const BaseController = require('./BaseController');
const { Ipress } = require('../models');

class IpressController extends BaseController {
    constructor() {
        super(Ipress);
    }

    /**
     * Obtener IPRESS con información de red
     */
    async getIpressWithRed(req, res) {
        try {
            const result = await this.model.getIpressWithRed();
            this.sendSuccess(res, result, 'IPRESS con red obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getIpressWithRed:', error);
            this.sendError(res, 'Error al obtener IPRESS con red', error, 500);
        }
    }

    /**
     * Obtener IPRESS por red
     */
    async getIpressByRed(req, res) {
        try {
            const { redId } = req.params;
            const result = await this.model.findByRed(redId);
            this.sendSuccess(res, result, 'IPRESS por red obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getIpressByRed:', error);
            this.sendError(res, 'Error al obtener IPRESS por red', error, 500);
        }
    }

    /**
     * Obtener IPRESS con estadísticas
     */
    async getIpressWithStats(req, res) {
        try {
            const result = await this.model.getIpressWithStats();
            this.sendSuccess(res, result, 'IPRESS con estadísticas obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getIpressWithStats:', error);
            this.sendError(res, 'Error al obtener IPRESS con estadísticas', error, 500);
        }
    }

    /**
     * Obtener estadísticas de un IPRESS específico
     */
    async getIpressStats(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getIpressStats(id);
            
            if (!result) {
                return this.sendError(res, 'IPRESS no encontrado', null, 404);
            }
            
            this.sendSuccess(res, result, 'Estadísticas de IPRESS obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getIpressStats:', error);
            this.sendError(res, 'Error al obtener estadísticas de IPRESS', error, 500);
        }
    }

    /**
     * Obtener plazas de un IPRESS
     */
    async getPlazas(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getPlazas(id);
            this.sendSuccess(res, result, 'Plazas del IPRESS obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getPlazas:', error);
            this.sendError(res, 'Error al obtener plazas del IPRESS', error, 500);
        }
    }

    /**
     * Buscar IPRESS por nombre
     */
    async searchIpress(req, res) {
        try {
            const { q, redId } = req.query;
            
            if (!q) {
                return this.sendError(res, 'Parámetro de búsqueda requerido');
            }
            
            const result = await this.model.searchByNombre(q, redId || null);
            this.sendSuccess(res, result, 'Búsqueda de IPRESS realizada exitosamente');
        } catch (error) {
            console.error('Error en searchIpress:', error);
            this.sendError(res, 'Error en búsqueda de IPRESS', error, 500);
        }
    }

    /**
     * Obtener IPRESS con plazas disponibles
     */
    async getIpressWithAvailablePlazas(req, res) {
        try {
            const result = await this.model.getIpressWithAvailablePlazas();
            this.sendSuccess(res, result, 'IPRESS con plazas disponibles obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getIpressWithAvailablePlazas:', error);
            this.sendError(res, 'Error al obtener IPRESS con plazas disponibles', error, 500);
        }
    }

    /**
     * Validar datos de IPRESS antes de crear/actualizar
     */
    async validateIpress(req, res) {
        try {
            const { nombre, red_id, id } = req.body;
            
            if (!nombre || !red_id) {
                return this.sendError(res, 'Nombre y red son requeridos');
            }
            
            try {
                if (id) {
                    await this.model.validateForUpdate(id, nombre, red_id);
                } else {
                    await this.model.validateForCreation(nombre, red_id);
                }
                
                this.sendSuccess(res, { valido: true }, 'Datos válidos');
            } catch (validationError) {
                this.sendSuccess(res, { valido: false, mensaje: validationError.message }, 'Validación completada');
            }
        } catch (error) {
            console.error('Error en validateIpress:', error);
            this.sendError(res, 'Error en validación', error, 500);
        }
    }
}

module.exports = IpressController;