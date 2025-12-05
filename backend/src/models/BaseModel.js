const { query, getClient } = require('../config/database');

/**
 * Clase base para todos los modelos
 * Contiene métodos comunes para CRUD
 */
class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    /**
     * Encontrar todos los registros
     */
    async findAll(conditions = {}, orderBy = 'id') {
        let sql = `SELECT * FROM ${this.tableName}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        sql += ` ORDER BY ${orderBy}`;
        
        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Encontrar un registro por ID
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Crear un nuevo registro
     */
    async create(data) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        const sql = `
            INSERT INTO ${this.tableName} (${columns.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `;
        
        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Actualizar un registro por ID
     */
    async update(id, data) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns
            .map((col, index) => `${col} = $${index + 2}`)
            .join(', ');
        
        const sql = `
            UPDATE ${this.tableName}
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await query(sql, [id, ...values]);
        return result.rows[0] || null;
    }

    /**
     * Eliminar un registro por ID
     */
    async delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }

    /**
     * Contar registros
     */
    async count(conditions = {}) {
        let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        const result = await query(sql, params);
        return parseInt(result.rows[0].total);
    }

    /**
     * Verificar si un registro existe
     */
    async exists(conditions) {
        const count = await this.count(conditions);
        return count > 0;
    }

    /**
     * Buscar registros con paginación
     */
    async findWithPagination(page = 1, limit = 10, conditions = {}, orderBy = 'id') {
        const offset = (page - 1) * limit;
        let sql = `SELECT * FROM ${this.tableName}`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(conditions));
        }
        
        sql += ` ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const result = await query(sql, params);
        const total = await this.count(conditions);
        
        return {
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = BaseModel;