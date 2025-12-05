const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Red extends BaseModel {
    constructor() {
        super('redes');
    }

    /**
     * Encontrar red por nombre
     */
    async findByNombre(nombre) {
        const sql = 'SELECT * FROM redes WHERE nombre = $1';
        const result = await query(sql, [nombre]);
        return result.rows[0] || null;
    }

    /**
     * Obtener redes con estadísticas de IPRESS
     */
    async getRedesWithStats() {
        const sql = `
            SELECT 
                r.*,
                COUNT(i.id) as total_ipress,
                COUNT(p.id) as total_plazas,
                SUM(p.total) as total_posiciones
            FROM redes r
            LEFT JOIN ipress i ON r.id = i.red_id
            LEFT JOIN plazas p ON i.id = p.ipress_id
            GROUP BY r.id, r.nombre, r.created_at, r.updated_at
            ORDER BY r.nombre
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Obtener redes con sus IPRESS
     */
    async getRedesWithIpress() {
        const sql = `
            SELECT 
                r.id as red_id,
                r.nombre as red_nombre,
                i.id as ipress_id,
                i.nombre as ipress_nombre
            FROM redes r
            LEFT JOIN ipress i ON r.id = i.red_id
            ORDER BY r.nombre, i.nombre
        `;
        const result = await query(sql);
        
        // Agrupar por red
        const redesMap = new Map();
        
        result.rows.forEach(row => {
            if (!redesMap.has(row.red_id)) {
                redesMap.set(row.red_id, {
                    id: row.red_id,
                    nombre: row.red_nombre,
                    ipress: []
                });
            }
            
            if (row.ipress_id) {
                redesMap.get(row.red_id).ipress.push({
                    id: row.ipress_id,
                    nombre: row.ipress_nombre
                });
            }
        });
        
        return Array.from(redesMap.values());
    }

    /**
     * Buscar redes por nombre (búsqueda parcial)
     */
    async searchByNombre(searchTerm) {
        const sql = `
            SELECT * FROM redes 
            WHERE nombre ILIKE $1 
            ORDER BY nombre
        `;
        const result = await query(sql, [`%${searchTerm}%`]);
        return result.rows;
    }

    /**
     * Validar antes de crear una nueva red
     */
    async validateForCreation(nombre) {
        const existing = await this.findByNombre(nombre);
        if (existing) {
            throw new Error(`Ya existe una red con el nombre: ${nombre}`);
        }
        return true;
    }

    /**
     * Validar antes de actualizar una red
     */
    async validateForUpdate(id, nombre) {
        const existing = await this.findByNombre(nombre);
        if (existing && existing.id !== parseInt(id)) {
            throw new Error(`Ya existe otra red con el nombre: ${nombre}`);
        }
        return true;
    }

    /**
     * Eliminar red (solo si no tiene IPRESS asociados)
     */
    async deleteRed(id) {
        // Verificar si tiene IPRESS asociados
        const ipressCount = await query(
            'SELECT COUNT(*) as total FROM ipress WHERE red_id = $1',
            [id]
        );
        
        if (parseInt(ipressCount.rows[0].total) > 0) {
            throw new Error('No se puede eliminar la red porque tiene IPRESS asociados');
        }
        
        return await this.delete(id);
    }

    /**
     * Obtener estadísticas de una red específica
     */
    async getRedStats(id) {
        const sql = `
            SELECT 
                r.*,
                COUNT(DISTINCT i.id) as total_ipress,
                COUNT(DISTINCT p.id) as total_plazas,
                SUM(p.total) as total_posiciones,
                COUNT(DISTINCT pos.id) as total_postulantes,
                COUNT(DISTINCT CASE WHEN adj.estado = 'adjudicado' THEN adj.id END) as adjudicaciones_realizadas
            FROM redes r
            LEFT JOIN ipress i ON r.id = i.red_id
            LEFT JOIN plazas p ON i.id = p.ipress_id
            LEFT JOIN adjudicaciones adj ON p.id = adj.plaza_id
            LEFT JOIN postulantes pos ON adj.postulante_id = pos.id
            WHERE r.id = $1
            GROUP BY r.id, r.nombre, r.created_at, r.updated_at
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }
}

module.exports = Red;