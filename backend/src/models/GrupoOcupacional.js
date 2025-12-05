const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class GrupoOcupacional extends BaseModel {
    constructor() {
        super('grupos_ocupacionales');
    }

    /**
     * Encontrar grupo ocupacional por nombre
     */
    async findByNombre(nombre) {
        const sql = 'SELECT * FROM grupos_ocupacionales WHERE nombre = $1';
        const result = await query(sql, [nombre]);
        return result.rows[0] || null;
    }

    /**
     * Obtener grupos ocupacionales con estadísticas
     */
    async getGruposWithStats() {
        const sql = `
            SELECT 
                go.*,
                COUNT(DISTINCT p.id) as total_plazas,
                SUM(p.total) as total_posiciones,
                COUNT(DISTINCT pos.id) as total_postulantes,
                COUNT(DISTINCT CASE WHEN adj.estado = 'adjudicado' THEN adj.id END) as adjudicaciones_realizadas
            FROM grupos_ocupacionales go
            LEFT JOIN plazas p ON go.id = p.grupo_ocupacional_id
            LEFT JOIN postulantes pos ON go.id = pos.grupo_ocupacional_id
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            GROUP BY go.id, go.nombre, go.created_at, go.updated_at
            ORDER BY go.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener estadísticas de un grupo ocupacional específico
     */
    async getGrupoStats(id) {
        const sql = `
            SELECT 
                go.*,
                COUNT(DISTINCT p.id) as total_plazas,
                SUM(p.total) as total_posiciones,
                COUNT(DISTINCT pos.id) as total_postulantes,
                COUNT(DISTINCT CASE WHEN adj.estado = 'pendiente' THEN pos.id END) as postulantes_pendientes,
                COUNT(DISTINCT CASE WHEN adj.estado = 'adjudicado' THEN adj.id END) as adjudicaciones_realizadas,
                COUNT(DISTINCT CASE WHEN adj.estado = 'desistido' THEN adj.id END) as desistimientos,
                COUNT(DISTINCT CASE WHEN adj.estado = 'renuncio' THEN adj.id END) as renuncias
            FROM grupos_ocupacionales go
            LEFT JOIN plazas p ON go.id = p.grupo_ocupacional_id
            LEFT JOIN postulantes pos ON go.id = pos.grupo_ocupacional_id
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            WHERE go.id = $1
            GROUP BY go.id, go.nombre, go.created_at, go.updated_at
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener plazas de un grupo ocupacional
     */
    async getPlazas(id) {
        const sql = `
            SELECT 
                p.*,
                i.nombre as ipress_nombre,
                r.nombre as red_nombre
            FROM plazas p
            INNER JOIN ipress i ON p.ipress_id = i.id
            INNER JOIN redes r ON i.red_id = r.id
            WHERE p.grupo_ocupacional_id = $1
            ORDER BY r.nombre, i.nombre, p.especialidad
        `;
        const result = await query(sql, [id]);
        return result.rows;
    }

    /**
     * Obtener postulantes de un grupo ocupacional
     */
    async getPostulantes(id, estado = null) {
        let sql = `
            SELECT 
                pos.*,
                adj.estado,
                adj.fecha_adjudicacion,
                adj.fecha_desistimiento,
                pl.id as plaza_id,
                i.nombre as ipress_adjudicada,
                r.nombre as red_adjudicada
            FROM postulantes pos
            LEFT JOIN adjudicaciones adj ON pos.id = adj.postulante_id
            LEFT JOIN plazas pl ON adj.plaza_id = pl.id
            LEFT JOIN ipress i ON pl.ipress_id = i.id
            LEFT JOIN redes r ON i.red_id = r.id
            WHERE pos.grupo_ocupacional_id = $1
        `;
        
        const params = [id];
        
        if (estado) {
            sql += ' AND adj.estado = $2';
            params.push(estado);
        }
        
        sql += ' ORDER BY pos.orden_merito';
        
        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Buscar grupos ocupacionales por nombre (búsqueda parcial)
     */
    async searchByNombre(searchTerm) {
        const sql = `
            SELECT * FROM grupos_ocupacionales 
            WHERE nombre ILIKE $1 
            ORDER BY nombre
        `;
        const result = await query(sql, [`%${searchTerm}%`]);
        return result.rows;
    }

    /**
     * Obtener especialidades disponibles para un grupo ocupacional
     */
    async getEspecialidades(id) {
        const sql = `
            SELECT DISTINCT especialidad
            FROM plazas 
            WHERE grupo_ocupacional_id = $1 
                AND especialidad IS NOT NULL 
                AND especialidad != ''
            ORDER BY especialidad
        `;
        const result = await query(sql, [id]);
        return result.rows.map(row => row.especialidad);
    }

    /**
     * Validar antes de crear un nuevo grupo ocupacional
     */
    async validateForCreation(nombre) {
        const existing = await this.findByNombre(nombre);
        if (existing) {
            throw new Error(`Ya existe un grupo ocupacional con el nombre: ${nombre}`);
        }
        return true;
    }

    /**
     * Validar antes de actualizar un grupo ocupacional
     */
    async validateForUpdate(id, nombre) {
        const existing = await this.findByNombre(nombre);
        if (existing && existing.id !== parseInt(id)) {
            throw new Error(`Ya existe otro grupo ocupacional con el nombre: ${nombre}`);
        }
        return true;
    }

    /**
     * Eliminar grupo ocupacional (solo si no tiene plazas o postulantes asociados)
     */
    async deleteGrupoOcupacional(id) {
        // Verificar si tiene plazas asociadas
        const plazasCount = await query(
            'SELECT COUNT(*) as total FROM plazas WHERE grupo_ocupacional_id = $1',
            [id]
        );
        
        if (parseInt(plazasCount.rows[0].total) > 0) {
            throw new Error('No se puede eliminar el grupo ocupacional porque tiene plazas asociadas');
        }

        // Verificar si tiene postulantes asociados
        const postulantesCount = await query(
            'SELECT COUNT(*) as total FROM postulantes WHERE grupo_ocupacional_id = $1',
            [id]
        );
        
        if (parseInt(postulantesCount.rows[0].total) > 0) {
            throw new Error('No se puede eliminar el grupo ocupacional porque tiene postulantes asociados');
        }
        
        return await this.delete(id);
    }

    /**
     * Obtener grupos ocupacionales con plazas disponibles
     */
    async getGruposWithAvailablePlazas() {
        const sql = `
            SELECT DISTINCT go.*
            FROM grupos_ocupacionales go
            INNER JOIN plazas_con_disponibilidad pcd ON go.id = pcd.id
            WHERE pcd.libres > 0
            ORDER BY go.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener siguiente orden de mérito disponible para un grupo
     */
    async getNextOrdenMerito(id) {
        const sql = `
            SELECT COALESCE(MAX(orden_merito), 0) + 1 as next_orden
            FROM postulantes 
            WHERE grupo_ocupacional_id = $1
        `;
        const result = await query(sql, [id]);
        return result.rows[0].next_orden;
    }
}

module.exports = GrupoOcupacional;