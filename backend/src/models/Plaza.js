const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Plaza extends BaseModel {
    constructor() {
        super('plazas');
    }

    /**
     * Obtener plazas con información completa (usando vista)
     */
    async getPlazasWithAvailability() {
        const sql = `
            SELECT * FROM plazas_con_disponibilidad 
            ORDER BY red, ipress, grupo_ocupacional, especialidad
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener plaza por ID con información completa
     */
    async getPlazaWithDetails(id) {
        const sql = `
            SELECT 
                p.*,
                i.nombre as ipress_nombre,
                r.nombre as red_nombre,
                go.nombre as grupo_ocupacional_nombre
            FROM plazas p
            INNER JOIN ipress i ON p.ipress_id = i.id
            INNER JOIN redes r ON i.red_id = r.id
            INNER JOIN grupos_ocupacionales go ON p.grupo_ocupacional_id = go.id
            WHERE p.id = $1
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Buscar plazas por criterios múltiples
     */
    async searchPlazas(filters = {}) {
        console.log('🔍 Plaza.searchPlazas called with filters:', filters);
        
        try {
            // Always use the availability view for consistency
            let sql = `
                SELECT 
                    v.id,
                    v.red,
                    v.ipress,
                    v.grupo_ocupacional,
                    v.subunidad,
                    v.especialidad,
                    v.total,
                    v.asignados,
                    v.libres
                FROM plazas_con_disponibilidad v
                WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 0;

            // Handle "solo disponibles" filter
            if (filters.soloDisponibles === true || filters.soloDisponibles === 'true') {
                sql += ` AND v.libres > 0`;
                console.log('🔄 Added soloDisponibles filter');
            }

            // Validate and apply filters using JOINs to get IDs
            if (filters.redId && !isNaN(parseInt(filters.redId))) {
                paramCount++;
                sql += ` AND v.red = (SELECT nombre FROM redes WHERE id = $${paramCount})`;
                params.push(parseInt(filters.redId));
                console.log(`📍 Added redId filter: ${filters.redId}`);
            }

            if (filters.ipressId && !isNaN(parseInt(filters.ipressId))) {
                paramCount++;
                sql += ` AND v.ipress = (SELECT nombre FROM ipress WHERE id = $${paramCount})`;
                params.push(parseInt(filters.ipressId));
                console.log(`🏢 Added ipressId filter: ${filters.ipressId}`);
            }

            if (filters.grupoOcupacionalId && !isNaN(parseInt(filters.grupoOcupacionalId))) {
                paramCount++;
                sql += ` AND v.grupo_ocupacional = (SELECT nombre FROM grupos_ocupacionales WHERE id = $${paramCount})`;
                params.push(parseInt(filters.grupoOcupacionalId));
                console.log(`👥 Added grupoOcupacionalId filter: ${filters.grupoOcupacionalId}`);
            }

            if (filters.especialidad && typeof filters.especialidad === 'string') {
                paramCount++;
                sql += ` AND v.especialidad ILIKE $${paramCount}`;
                params.push(`%${filters.especialidad}%`);
                console.log(`🎯 Added especialidad filter: ${filters.especialidad}`);
            }

            sql += ` ORDER BY v.red, v.ipress, v.grupo_ocupacional, v.especialidad`;
            
            console.log('📄 Final SQL:', sql);
            console.log('🔢 Parameters:', params);
            
            const result = await query(sql, params);
            console.log(`✅ Found ${result.rows.length} plazas`);
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error in searchPlazas:', error);
            console.error('🛠️ SQL that failed:', sql);
            console.error('📊 Parameters:', params);
            throw error;
        }
    }

    /**
     * Obtener plazas disponibles para adjudicación
     */
    async getAvailablePlazas(grupoOcupacionalId = null) {
        let sql = `
            SELECT * FROM plazas_con_disponibilidad 
            WHERE libres > 0
        `;
        const params = [];
        
        if (grupoOcupacionalId) {
            sql += ` AND grupo_ocupacional = (SELECT nombre FROM grupos_ocupacionales WHERE id = $1)`;
            params.push(grupoOcupacionalId);
        }
        
        sql += ' ORDER BY red, ipress, grupo_ocupacional, especialidad';
        
        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Verificar disponibilidad de una plaza específica
     */
    async checkAvailability(id) {
        const sql = `
            SELECT 
                id,
                total,
                asignados,
                libres,
                CASE WHEN libres > 0 THEN true ELSE false END as disponible
            FROM plazas_con_disponibilidad 
            WHERE id = $1
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener adjudicaciones de una plaza
     */
    async getAdjudicaciones(id) {
        const sql = `
            SELECT 
                adj.*,
                pos.orden_merito,
                pos.apellidos_nombres,
                pos.dni,
                go.nombre as grupo_ocupacional
            FROM adjudicaciones adj
            INNER JOIN postulantes pos ON adj.postulante_id = pos.id
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            WHERE adj.plaza_id = $1
            ORDER BY adj.fecha_adjudicacion DESC
        `;
        const result = await query(sql, [id]);
        return result.rows;
    }

    /**
     * Validar antes de crear una nueva plaza
     */
    async validateForCreation(data) {
        const { ipress_id, grupo_ocupacional_id, especialidad } = data;
        
        // Verificar que el IPRESS existe
        const ipressExists = await query('SELECT id FROM ipress WHERE id = $1', [ipress_id]);
        if (ipressExists.rows.length === 0) {
            throw new Error('El IPRESS especificado no existe');
        }

        // Verificar que el grupo ocupacional existe
        const grupoExists = await query('SELECT id FROM grupos_ocupacionales WHERE id = $1', [grupo_ocupacional_id]);
        if (grupoExists.rows.length === 0) {
            throw new Error('El grupo ocupacional especificado no existe');
        }

        // Verificar que no existe otra plaza con la misma combinación
        let checkSql = 'SELECT id FROM plazas WHERE ipress_id = $1 AND grupo_ocupacional_id = $2';
        const checkParams = [ipress_id, grupo_ocupacional_id];
        
        if (especialidad) {
            checkSql += ' AND especialidad = $3';
            checkParams.push(especialidad);
        } else {
            checkSql += ' AND especialidad IS NULL';
        }
        
        const existing = await query(checkSql, checkParams);
        if (existing.rows.length > 0) {
            throw new Error('Ya existe una plaza con esta combinación de IPRESS, grupo ocupacional y especialidad');
        }
        
        return true;
    }

    /**
     * Validar antes de actualizar una plaza
     */
    async validateForUpdate(id, data) {
        const { ipress_id, grupo_ocupacional_id, especialidad } = data;
        
        // Verificar que el IPRESS existe
        const ipressExists = await query('SELECT id FROM ipress WHERE id = $1', [ipress_id]);
        if (ipressExists.rows.length === 0) {
            throw new Error('El IPRESS especificado no existe');
        }

        // Verificar que el grupo ocupacional existe
        const grupoExists = await query('SELECT id FROM grupos_ocupacionales WHERE id = $1', [grupo_ocupacional_id]);
        if (grupoExists.rows.length === 0) {
            throw new Error('El grupo ocupacional especificado no existe');
        }

        // Verificar que no existe otra plaza con la misma combinación
        let checkSql = 'SELECT id FROM plazas WHERE ipress_id = $1 AND grupo_ocupacional_id = $2 AND id != $3';
        const checkParams = [ipress_id, grupo_ocupacional_id, id];
        
        if (especialidad) {
            checkSql += ' AND especialidad = $4';
            checkParams.push(especialidad);
        } else {
            checkSql += ' AND especialidad IS NULL';
        }
        
        const existing = await query(checkSql, checkParams);
        if (existing.rows.length > 0) {
            throw new Error('Ya existe otra plaza con esta combinación de IPRESS, grupo ocupacional y especialidad');
        }
        
        return true;
    }

    /**
     * Eliminar plaza (solo si no tiene adjudicaciones)
     */
    async deletePlaza(id) {
        // Verificar si tiene adjudicaciones
        const adjudicacionesCount = await query(
            'SELECT COUNT(*) as total FROM adjudicaciones WHERE plaza_id = $1',
            [id]
        );
        
        if (parseInt(adjudicacionesCount.rows[0].total) > 0) {
            throw new Error('No se puede eliminar la plaza porque tiene adjudicaciones asociadas');
        }
        
        return await this.delete(id);
    }

    /**
     * Obtener estadísticas generales de plazas
     */
    async getGeneralStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_plazas,
                SUM(total) as total_posiciones,
                SUM(asignados) as total_asignados,
                SUM(libres) as total_libres,
                COUNT(DISTINCT red) as total_redes,
                COUNT(DISTINCT ipress) as total_ipress,
                COUNT(DISTINCT grupo_ocupacional) as total_grupos
            FROM plazas_con_disponibilidad
        `;
        const result = await query(sql);
        return result.rows[0];
    }

    /**
     * Obtener plazas por red con estadísticas
     */
    async getPlazasByRed() {
        const sql = `
            SELECT 
                red,
                COUNT(*) as total_plazas,
                SUM(total) as total_posiciones,
                SUM(asignados) as total_asignados,
                SUM(libres) as total_libres
            FROM plazas_con_disponibilidad
            GROUP BY red
            ORDER BY red
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener plazas por grupo ocupacional con estadísticas
     */
    async getPlazasByGrupoOcupacional() {
        const sql = `
            SELECT 
                grupo_ocupacional,
                COUNT(*) as total_plazas,
                SUM(total) as total_posiciones,
                SUM(asignados) as total_asignados,
                SUM(libres) as total_libres
            FROM plazas_con_disponibilidad
            GROUP BY grupo_ocupacional
            ORDER BY grupo_ocupacional
        `;
        const result = await query(sql);
        return result.rows;
    }
}

module.exports = Plaza;