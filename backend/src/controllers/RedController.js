const BaseController = require('./BaseController');
const { Red } = require('../models');

class RedController extends BaseController {
    constructor() {
        super(Red);
    }

    /**
     * Obtener redes con estadísticas
     */
    async getRedesWithStats(req, res) {
        try {
            const result = await this.model.getRedesWithStats();
            this.sendSuccess(res, result, 'Redes con estadísticas obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getRedesWithStats:', error);
            this.sendError(res, 'Error al obtener redes con estadísticas', error, 500);
        }
    }

    /**
     * Obtener redes con sus IPRESS
     */
    async getRedesWithIpress(req, res) {
        try {
            const result = await this.model.getRedesWithIpress();
            this.sendSuccess(res, result, 'Redes con IPRESS obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getRedesWithIpress:', error);
            this.sendError(res, 'Error al obtener redes con IPRESS', error, 500);
        }
    }

    /**
     * Obtener estadísticas detalladas de una red
     */
    async getRedStats(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getRedStats(id);
            
            if (!result) {
                return this.sendError(res, 'Red no encontrada', null, 404);
            }
            
            this.sendSuccess(res, result, 'Estadísticas de red obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getRedStats:', error);
            this.sendError(res, 'Error al obtener estadísticas de red', error, 500);
        }
    }

    /**
     * Buscar redes por nombre
     */
    async searchRedes(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return this.sendError(res, 'Parámetro de búsqueda requerido');
            }
            
            const result = await this.model.searchByNombre(q);
            this.sendSuccess(res, result, 'Búsqueda de redes realizada exitosamente');
        } catch (error) {
            console.error('Error en searchRedes:', error);
            this.sendError(res, 'Error en búsqueda de redes', error, 500);
        }
    }

    /**
     * Validar nombre de red antes de crear/actualizar
     */
    async validateNombre(req, res) {
        try {
            const { nombre, id } = req.body;
            
            if (!nombre) {
                return this.sendError(res, 'Nombre es requerido');
            }
            
            try {
                if (id) {
                    await this.model.validateForUpdate(id, nombre);
                } else {
                    await this.model.validateForCreation(nombre);
                }
                
                this.sendSuccess(res, { valido: true }, 'Nombre válido');
            } catch (validationError) {
                this.sendSuccess(res, { valido: false, mensaje: validationError.message }, 'Validación completada');
            }
        } catch (error) {
            console.error('Error en validateNombre:', error);
            this.sendError(res, 'Error en validación', error, 500);
        }
    }
}

module.exports = RedController;