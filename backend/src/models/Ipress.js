const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Ipress extends BaseModel {
    constructor() {
        super('ipress');
    }

    /**
     * Obtener IPRESS con información de red
     */
    async getIpressWithRed() {
        const sql = `
            SELECT 
                i.*,
                r.nombre as red_nombre
            FROM ipress i
            INNER JOIN redes r ON i.red_id = r.id
            ORDER BY r.nombre, i.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Encontrar IPRESS por red
     */
    async findByRed(redId) {
        const sql = `
            SELECT 
                i.*,
                r.nombre as red_nombre
            FROM ipress i
            INNER JOIN redes r ON i.red_id = r.id
            WHERE i.red_id = $1
            ORDER BY i.nombre
        `;
        const result = await query(sql, [redId]);
        return result.rows;
    }

    /**
     * Buscar IPRESS por nombre
     */
    async findByNombre(nombre, redId = null) {
        let sql = 'SELECT * FROM ipress WHERE nombre = $1';
        const params = [nombre];
        
        if (redId) {
            sql += ' AND red_id = $2';
            params.push(redId);
        }
        
        const result = await query(sql, params);
        return result.rows[0] || null;
    }

    /**
     * Buscar IPRESS (búsqueda parcial por nombre)
     */
    async searchByNombre(searchTerm, redId = null) {
        let sql = `
            SELECT 
                i.*,
                r.nombre as red_nombre
            FROM ipress i
            INNER JOIN redes r ON i.red_id = r.id
            WHERE i.nombre ILIKE $1
        `;
        const params = [`%${searchTerm}%`];
        
        if (redId) {
            sql += ' AND i.red_id = $2';
            params.push(redId);
        }
        
        sql += ' ORDER BY r.nombre, i.nombre';
        
        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Obtener IPRESS con estadísticas de plazas
     */
    async getIpressWithStats() {
        const sql = `
            SELECT 
                i.*,
                r.nombre as red_nombre,
                COUNT(p.id) as total_plazas,
                SUM(p.total) as total_posiciones,
                COUNT(DISTINCT p.grupo_ocupacional_id) as grupos_ocupacionales
            FROM ipress i
            INNER JOIN redes r ON i.red_id = r.id
            LEFT JOIN plazas p ON i.id = p.ipress_id
            GROUP BY i.id, i.nombre, i.red_id, i.created_at, i.updated_at, r.nombre
            ORDER BY r.nombre, i.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener estadísticas de un IPRESS específico
     */
    async getIpressStats(id) {
        const sql = `
            SELECT 
                i.*,
                r.nombre as red_nombre,
                COUNT(DISTINCT p.id) as total_plazas,
                SUM(p.total) as total_posiciones,
                COUNT(DISTINCT p.grupo_ocupacional_id) as grupos_ocupacionales,
                COUNT(DISTINCT CASE WHEN adj.estado = 'adjudicado' THEN adj.id END) as adjudicaciones_realizadas
            FROM ipress i
            INNER JOIN redes r ON i.red_id = r.id
            LEFT JOIN plazas p ON i.id = p.ipress_id
            LEFT JOIN adjudicaciones adj ON p.id = adj.plaza_id
            WHERE i.id = $1
            GROUP BY i.id, i.nombre, i.red_id, i.created_at, i.updated_at, r.nombre
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Obtener plazas de un IPRESS
     */
    async getPlazas(id) {
        const sql = `
            SELECT 
                p.*,
                go.nombre as grupo_ocupacional_nombre,
                i.nombre as ipress_nombre,
                r.nombre as red_nombre
            FROM plazas p
            INNER JOIN grupos_ocupacionales go ON p.grupo_ocupacional_id = go.id
            INNER JOIN ipress i ON p.ipress_id = i.id
            INNER JOIN redes r ON i.red_id = r.id
            WHERE p.ipress_id = $1
            ORDER BY go.nombre, p.especialidad
        `;
        const result = await query(sql, [id]);
        return result.rows;
    }

    /**
     * Validar antes de crear un nuevo IPRESS
     */
    async validateForCreation(nombre, redId) {
        // Verificar que la red existe
        const redExists = await query('SELECT id FROM redes WHERE id = $1', [redId]);
        if (redExists.rows.length === 0) {
            throw new Error('La red especificada no existe');
        }

        // Verificar que no existe otro IPRESS con el mismo nombre en la misma red
        const existing = await this.findByNombre(nombre, redId);
        if (existing) {
            throw new Error(`Ya existe un IPRESS con el nombre "${nombre}" en esta red`);
        }
        
        return true;
    }

    /**
     * Validar antes de actualizar un IPRESS
     */
    async validateForUpdate(id, nombre, redId) {
        // Verificar que la red existe
        const redExists = await query('SELECT id FROM redes WHERE id = $1', [redId]);
        if (redExists.rows.length === 0) {
            throw new Error('La red especificada no existe');
        }

        // Verificar que no existe otro IPRESS con el mismo nombre en la misma red
        const existing = await this.findByNombre(nombre, redId);
        if (existing && existing.id !== parseInt(id)) {
            throw new Error(`Ya existe otro IPRESS con el nombre "${nombre}" en esta red`);
        }
        
        return true;
    }

    /**
     * Eliminar IPRESS (solo si no tiene plazas asociadas)
     */
    async deleteIpress(id) {
        // Verificar si tiene plazas asociadas
        const plazasCount = await query(
            'SELECT COUNT(*) as total FROM plazas WHERE ipress_id = $1',
            [id]
        );
        
        if (parseInt(plazasCount.rows[0].total) > 0) {
            throw new Error('No se puede eliminar el IPRESS porque tiene plazas asociadas');
        }
        
        return await this.delete(id);
    }

    /**
     * Obtener IPRESS con plazas disponibles
     */
    async getIpressWithAvailablePlazas() {
        const sql = `
            SELECT DISTINCT
                i.*,
                r.nombre as red_nombre
            FROM ipress i
            INNER JOIN redes r ON i.red_id = r.id
            INNER JOIN plazas_con_disponibilidad pcd ON i.id = pcd.id
            WHERE pcd.libres > 0
            ORDER BY r.nombre, i.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }
}

module.exports = Ipress;