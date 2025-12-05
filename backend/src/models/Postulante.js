const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Postulante extends BaseModel {
    constructor() {
        super('postulantes');
    }

    /**
     * Obtener postulantes con estado (usando vista)
     */
    async getPostulantesWithEstado() {
        const sql = 'SELECT * FROM postulantes_con_estado ORDER BY orden_merito';
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener postulante por ID con estado completo
     */
    async getPostulanteWithEstado(id) {
        const sql = 'SELECT * FROM postulantes_con_estado WHERE id = $1';
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Buscar postulantes por criterios
     */
    async searchPostulantes(filters = {}) {
        console.log('🔍 Postulante.searchPostulantes called with filters:', filters);
        
        try {
            let sql = `
                SELECT 
                    pos.*,
                    go.nombre as grupo_ocupacional_nombre,
                    COALESCE(adj.estado, 'pendiente') as estado,
                    adj.fecha_adjudicacion,
                    adj.fecha_desistimiento
                FROM postulantes pos
                INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
                LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
                WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 0;

            // Validate and apply filters
            if (filters.grupoOcupacionalId && !isNaN(parseInt(filters.grupoOcupacionalId))) {
                paramCount++;
                sql += ` AND pos.grupo_ocupacional_id = $${paramCount}`;
                params.push(parseInt(filters.grupoOcupacionalId));
                console.log(`👥 Added grupoOcupacionalId filter: ${filters.grupoOcupacionalId}`);
            }

            if (filters.estado && typeof filters.estado === 'string') {
                paramCount++;
                if (filters.estado === 'pendiente') {
                    sql += ` AND (adj.estado IS NULL OR adj.estado = $${paramCount})`;
                } else {
                    sql += ` AND adj.estado = $${paramCount}`;
                }
                params.push(filters.estado);
                console.log(`📋 Added estado filter: ${filters.estado}`);
            }

            if (filters.nombre && typeof filters.nombre === 'string') {
                paramCount++;
                sql += ` AND pos.apellidos_nombres ILIKE $${paramCount}`;
                params.push(`%${filters.nombre}%`);
                console.log(`👤 Added nombre filter: ${filters.nombre}`);
            }

            if (filters.dni && typeof filters.dni === 'string') {
                paramCount++;
                sql += ` AND pos.dni = $${paramCount}`;
                params.push(filters.dni);
                console.log(`🆔 Added DNI filter: ${filters.dni}`);
            }

            if (filters.ordenMeritoDesde && !isNaN(parseInt(filters.ordenMeritoDesde))) {
                paramCount++;
                sql += ` AND pos.orden_merito >= $${paramCount}`;
                params.push(parseInt(filters.ordenMeritoDesde));
                console.log(`📊 Added ordenMeritoDesde filter: ${filters.ordenMeritoDesde}`);
            }

            if (filters.ordenMeritoHasta && !isNaN(parseInt(filters.ordenMeritoHasta))) {
                paramCount++;
                sql += ` AND pos.orden_merito <= $${paramCount}`;
                params.push(parseInt(filters.ordenMeritoHasta));
                console.log(`📊 Added ordenMeritoHasta filter: ${filters.ordenMeritoHasta}`);
            }

            sql += ' ORDER BY pos.orden_merito';
            
            console.log('📄 Final SQL:', sql);
            console.log('🔢 Parameters:', params);
            
            const result = await query(sql, params);
            console.log(`✅ Found ${result.rows.length} postulantes`);
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error in searchPostulantes:', error);
            console.error('🛠️ SQL that failed:', sql);
            console.error('📊 Parameters:', params);
            throw error;
        }
    }

    /**
     * Obtener postulantes pendientes por grupo ocupacional (para adjudicación)
     */
    async getPostulantesPendientes(grupoOcupacionalId, limit = 50) {
        const sql = `
            SELECT 
                pos.*,
                go.nombre as grupo_ocupacional_nombre
            FROM postulantes pos
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            WHERE pos.grupo_ocupacional_id = $1 
                AND (adj.estado IS NULL OR adj.estado = 'pendiente')
            ORDER BY pos.orden_merito
            LIMIT $2
        `;
        const result = await query(sql, [grupoOcupacionalId, limit]);
        return result.rows;
    }

    /**
     * Encontrar postulante por DNI
     */
    async findByDni(dni) {
        const sql = `
            SELECT 
                pos.*,
                go.nombre as grupo_ocupacional_nombre
            FROM postulantes pos
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            WHERE pos.dni = $1
        `;
        const result = await query(sql, [dni]);
        return result.rows[0] || null;
    }

    /**
     * Encontrar postulante por orden de mérito y grupo ocupacional
     */
    async findByOrdenMerito(ordenMerito, grupoOcupacionalId) {
        const sql = `
            SELECT 
                pos.*,
                go.nombre as grupo_ocupacional_nombre
            FROM postulantes pos
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            WHERE pos.orden_merito = $1 AND pos.grupo_ocupacional_id = $2
        `;
        const result = await query(sql, [ordenMerito, grupoOcupacionalId]);
        return result.rows[0] || null;
    }

    /**
     * Obtener estadísticas de postulantes por grupo ocupacional
     */
    async getEstadisticasByGrupo() {
        const sql = `
            SELECT 
                go.nombre as grupo_ocupacional,
                COUNT(pos.id) as total_postulantes,
                COUNT(CASE WHEN adj.estado = 'pendiente' OR adj.estado IS NULL THEN 1 END) as pendientes,
                COUNT(CASE WHEN adj.estado = 'adjudicado' THEN 1 END) as adjudicados,
                COUNT(CASE WHEN adj.estado = 'desistido' THEN 1 END) as desistidos,
                COUNT(CASE WHEN adj.estado = 'renuncio' THEN 1 END) as renuncias
            FROM grupos_ocupacionales go
            LEFT JOIN postulantes pos ON go.id = pos.grupo_ocupacional_id
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            GROUP BY go.id, go.nombre
            ORDER BY go.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener siguiente postulante para adjudicar
     */
    async getSiguientePostulante(grupoOcupacionalId) {
        const sql = `
            SELECT 
                pos.*,
                go.nombre as grupo_ocupacional_nombre
            FROM postulantes pos
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            WHERE pos.grupo_ocupacional_id = $1 
                AND (adj.estado IS NULL OR adj.estado = 'pendiente')
            ORDER BY pos.orden_merito
            LIMIT 1
        `;
        const result = await query(sql, [grupoOcupacionalId]);
        return result.rows[0] || null;
    }

    /**
     * Validar antes de crear un nuevo postulante
     */
    async validateForCreation(data) {
        const { orden_merito, dni, grupo_ocupacional_id } = data;
        
        // Verificar que el grupo ocupacional existe
        const grupoExists = await query('SELECT id FROM grupos_ocupacionales WHERE id = $1', [grupo_ocupacional_id]);
        if (grupoExists.rows.length === 0) {
            throw new Error('El grupo ocupacional especificado no existe');
        }

        // Verificar que el orden de mérito no existe en el mismo grupo
        const ordenExists = await this.findByOrdenMerito(orden_merito, grupo_ocupacional_id);
        if (ordenExists) {
            throw new Error(`Ya existe un postulante con orden de mérito ${orden_merito} en este grupo ocupacional`);
        }

        // Verificar DNI si está proporcionado
        if (dni) {
            const dniExists = await this.findByDni(dni);
            if (dniExists) {
                throw new Error(`Ya existe un postulante con DNI ${dni}`);
            }
        }
        
        return true;
    }

    /**
     * Validar antes de actualizar un postulante
     */
    async validateForUpdate(id, data) {
        const { orden_merito, dni, grupo_ocupacional_id } = data;
        
        // Verificar que el grupo ocupacional existe
        const grupoExists = await query('SELECT id FROM grupos_ocupacionales WHERE id = $1', [grupo_ocupacional_id]);
        if (grupoExists.rows.length === 0) {
            throw new Error('El grupo ocupacional especificado no existe');
        }

        // Verificar que el orden de mérito no existe en otro postulante del mismo grupo
        const ordenExists = await this.findByOrdenMerito(orden_merito, grupo_ocupacional_id);
        if (ordenExists && ordenExists.id !== parseInt(id)) {
            throw new Error(`Ya existe otro postulante con orden de mérito ${orden_merito} en este grupo ocupacional`);
        }

        // Verificar DNI si está proporcionado
        if (dni) {
            const dniExists = await this.findByDni(dni);
            if (dniExists && dniExists.id !== parseInt(id)) {
                throw new Error(`Ya existe otro postulante con DNI ${dni}`);
            }
        }
        
        return true;
    }

    /**
     * Eliminar postulante (solo si no tiene adjudicaciones)
     */
    async deletePostulante(id) {
        // Verificar si tiene adjudicaciones
        const adjudicacionesCount = await query(
            'SELECT COUNT(*) as total FROM adjudicaciones WHERE postulante_id = $1',
            [id]
        );
        
        if (parseInt(adjudicacionesCount.rows[0].total) > 0) {
            throw new Error('No se puede eliminar el postulante porque tiene adjudicaciones asociadas');
        }
        
        return await this.delete(id);
    }

    /**
     * Calcular tiempo de servicio total en días
     */
    calcularTiempoServicioTotal(anios, meses, dias) {
        return (anios * 365) + (meses * 30) + dias;
    }

    /**
     * Obtener postulantes por rango de orden de mérito
     */
    async getPostulantesByRango(grupoOcupacionalId, ordenInicio, ordenFin) {
        const sql = `
            SELECT 
                pos.*,
                go.nombre as grupo_ocupacional_nombre,
                adj.estado,
                adj.fecha_adjudicacion
            FROM postulantes pos
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            WHERE pos.grupo_ocupacional_id = $1 
                AND pos.orden_merito BETWEEN $2 AND $3
            ORDER BY pos.orden_merito
        `;
        const result = await query(sql, [grupoOcupacionalId, ordenInicio, ordenFin]);
        return result.rows;
    }

    /**
     * Obtener estadísticas de un postulante específico
     */
    async getPostulanteStats(id) {
        const sql = `
            SELECT 
                pos.*,
                go.nombre as grupo_ocupacional_nombre,
                adj.estado,
                adj.fecha_adjudicacion,
                adj.fecha_desistimiento,
                adj.observaciones,
                CASE 
                    WHEN adj.plaza_id IS NOT NULL THEN (
                        SELECT json_build_object(
                            'plaza_id', p.id,
                            'ipress', i.nombre,
                            'red', r.nombre,
                            'especialidad', p.especialidad
                        )
                        FROM plazas p
                        INNER JOIN ipress i ON p.ipress_id = i.id
                        INNER JOIN redes r ON i.red_id = r.id
                        WHERE p.id = adj.plaza_id
                    )
                    ELSE NULL
                END as plaza_adjudicada
            FROM postulantes pos
            INNER JOIN grupos_ocupacionales go ON pos.grupo_ocupacional_id = go.id
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            WHERE pos.id = $1
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }
}

module.exports = Postulante;