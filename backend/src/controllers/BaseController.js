/**
 * Controlador base con funciones CRUD comunes
 */
class BaseController {
    constructor(model) {
        this.model = new model();
    }

    /**
     * Obtener todos los registros
     */
    async getAll(req, res) {
        try {
            const { page, limit, ...filters } = req.query;
            
            let result;
            
            if (page && limit) {
                // Con paginación
                const pageNum = parseInt(page) || 1;
                const limitNum = parseInt(limit) || 10;
                result = await this.model.findWithPagination(pageNum, limitNum, filters);
            } else {
                // Sin paginación
                result = await this.model.findAll(filters);
            }
            
            res.json({
                success: true,
                data: result,
                message: 'Registros obtenidos exitosamente'
            });
        } catch (error) {
            console.error('Error en getAll:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtener un registro por ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.findById(id);
            
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: result,
                message: 'Registro obtenido exitosamente'
            });
        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Crear un nuevo registro
     */
    async create(req, res) {
        try {
            // Validar datos antes de crear (si el modelo tiene el método)
            if (typeof this.model.validateForCreation === 'function') {
                await this.model.validateForCreation(req.body);
            }
            
            const result = await this.model.create(req.body);
            
            res.status(201).json({
                success: true,
                data: result,
                message: 'Registro creado exitosamente'
            });
        } catch (error) {
            console.error('Error en create:', error);
            
            // Errores de validación tienen códigos específicos
            const statusCode = error.message.includes('Ya existe') ? 409 : 400;
            
            res.status(statusCode).json({
                success: false,
                message: 'Error al crear el registro',
                error: error.message
            });
        }
    }

    /**
     * Actualizar un registro
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar que el registro existe
            const existing = await this.model.findById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            }
            
            // Validar datos antes de actualizar (si el modelo tiene el método)
            if (typeof this.model.validateForUpdate === 'function') {
                await this.model.validateForUpdate(id, req.body);
            }
            
            const result = await this.model.update(id, req.body);
            
            res.json({
                success: true,
                data: result,
                message: 'Registro actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error en update:', error);
            
            // Errores de validación tienen códigos específicos
            const statusCode = error.message.includes('Ya existe') ? 409 : 400;
            
            res.status(statusCode).json({
                success: false,
                message: 'Error al actualizar el registro',
                error: error.message
            });
        }
    }

    /**
     * Eliminar un registro
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar que el registro existe
            const existing = await this.model.findById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            }
            
            // Usar método de eliminación específico si existe, sino usar el genérico
            let result;
            if (typeof this.model.deleteRed === 'function') {
                result = await this.model.deleteRed(id);
            } else if (typeof this.model.deleteIpress === 'function') {
                result = await this.model.deleteIpress(id);
            } else if (typeof this.model.deleteGrupoOcupacional === 'function') {
                result = await this.model.deleteGrupoOcupacional(id);
            } else if (typeof this.model.deletePlaza === 'function') {
                result = await this.model.deletePlaza(id);
            } else if (typeof this.model.deletePostulante === 'function') {
                result = await this.model.deletePostulante(id);
            } else {
                result = await this.model.delete(id);
            }
            
            res.json({
                success: true,
                data: result,
                message: 'Registro eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error en delete:', error);
            
            // Errores de dependencias tienen código 409
            const statusCode = error.message.includes('asociados') || 
                              error.message.includes('asociadas') ? 409 : 400;
            
            res.status(statusCode).json({
                success: false,
                message: 'Error al eliminar el registro',
                error: error.message
            });
        }
    }

    /**
     * Contar registros
     */
    async count(req, res) {
        try {
            const filters = req.query;
            const total = await this.model.count(filters);
            
            res.json({
                success: true,
                data: { total },
                message: 'Conteo realizado exitosamente'
            });
        } catch (error) {
            console.error('Error en count:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Buscar registros
     */
    async search(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetro de búsqueda requerido'
                });
            }
            
            // Usar método de búsqueda específico si existe
            let result;
            if (typeof this.model.searchByNombre === 'function') {
                result = await this.model.searchByNombre(q);
            } else {
                // Búsqueda genérica (esto requiere que sepas qué campo buscar)
                result = await this.model.findAll();
            }
            
            res.json({
                success: true,
                data: result,
                message: 'Búsqueda realizada exitosamente'
            });
        } catch (error) {
            console.error('Error en search:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Método helper para manejar respuestas exitosas
     */
    sendSuccess(res, data, message = 'Operación exitosa', statusCode = 200) {
        res.status(statusCode).json({
            success: true,
            data,
            message
        });
    }

    /**
     * Método helper para manejar errores
     */
    sendError(res, message, error = null, statusCode = 400) {
        const response = {
            success: false,
            message
        };
        
        if (error) {
            response.error = error.message || error;
        }
        
        res.status(statusCode).json(response);
    }
}

module.exports = BaseController;