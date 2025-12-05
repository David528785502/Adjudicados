const BaseController = require('./BaseController');
const { GrupoOcupacional } = require('../models');

class GrupoOcupacionalController extends BaseController {
    constructor() {
        super(GrupoOcupacional);
    }

    /**
     * Obtener grupos ocupacionales con estadísticas
     */
    async getGruposWithStats(req, res) {
        try {
            const result = await this.model.getGruposWithStats();
            this.sendSuccess(res, result, 'Grupos ocupacionales con estadísticas obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getGruposWithStats:', error);
            this.sendError(res, 'Error al obtener grupos ocupacionales con estadísticas', error, 500);
        }
    }

    /**
     * Obtener estadísticas de un grupo ocupacional específico
     */
    async getGrupoStats(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getGrupoStats(id);
            
            if (!result) {
                return this.sendError(res, 'Grupo ocupacional no encontrado', null, 404);
            }
            
            this.sendSuccess(res, result, 'Estadísticas del grupo ocupacional obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getGrupoStats:', error);
            this.sendError(res, 'Error al obtener estadísticas del grupo ocupacional', error, 500);
        }
    }

    /**
     * Obtener plazas de un grupo ocupacional
     */
    async getPlazas(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getPlazas(id);
            this.sendSuccess(res, result, 'Plazas del grupo ocupacional obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getPlazas:', error);
            this.sendError(res, 'Error al obtener plazas del grupo ocupacional', error, 500);
        }
    }

    /**
     * Obtener postulantes de un grupo ocupacional
     */
    async getPostulantes(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.query;
            const result = await this.model.getPostulantes(id, estado || null);
            this.sendSuccess(res, result, 'Postulantes del grupo ocupacional obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getPostulantes:', error);
            this.sendError(res, 'Error al obtener postulantes del grupo ocupacional', error, 500);
        }
    }

    /**
     * Obtener especialidades disponibles para un grupo ocupacional
     */
    async getEspecialidades(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getEspecialidades(id);
            this.sendSuccess(res, result, 'Especialidades obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getEspecialidades:', error);
            this.sendError(res, 'Error al obtener especialidades', error, 500);
        }
    }

    /**
     * Buscar grupos ocupacionales por nombre
     */
    async searchGrupos(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return this.sendError(res, 'Parámetro de búsqueda requerido');
            }
            
            const result = await this.model.searchByNombre(q);
            this.sendSuccess(res, result, 'Búsqueda de grupos ocupacionales realizada exitosamente');
        } catch (error) {
            console.error('Error en searchGrupos:', error);
            this.sendError(res, 'Error en búsqueda de grupos ocupacionales', error, 500);
        }
    }

    /**
     * Obtener grupos ocupacionales con plazas disponibles
     */
    async getGruposWithAvailablePlazas(req, res) {
        try {
            const result = await this.model.getGruposWithAvailablePlazas();
            this.sendSuccess(res, result, 'Grupos ocupacionales con plazas disponibles obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getGruposWithAvailablePlazas:', error);
            this.sendError(res, 'Error al obtener grupos ocupacionales con plazas disponibles', error, 500);
        }
    }

    /**
     * Obtener siguiente orden de mérito disponible
     */
    async getNextOrdenMerito(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getNextOrdenMerito(id);
            this.sendSuccess(res, { nextOrdenMerito: result }, 'Siguiente orden de mérito obtenido exitosamente');
        } catch (error) {
            console.error('Error en getNextOrdenMerito:', error);
            this.sendError(res, 'Error al obtener siguiente orden de mérito', error, 500);
        }
    }

    /**
     * Validar nombre de grupo ocupacional antes de crear/actualizar
     */
    async validateGrupo(req, res) {
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
            console.error('Error en validateGrupo:', error);
            this.sendError(res, 'Error en validación', error, 500);
        }
    }

    /**
     * Obtener resumen estadístico por grupo ocupacional
     */
    async getResumenEstadistico(req, res) {
        try {
            const grupos = await this.model.getGruposWithStats();
            
            // Calcular totales generales
            const resumen = grupos.reduce((acc, grupo) => {
                acc.totalGrupos += 1;
                acc.totalPlazas += parseInt(grupo.total_plazas) || 0;
                acc.totalPosiciones += parseInt(grupo.total_posiciones) || 0;
                acc.totalPostulantes += parseInt(grupo.total_postulantes) || 0;
                acc.totalAdjudicaciones += parseInt(grupo.adjudicaciones_realizadas) || 0;
                return acc;
            }, {
                totalGrupos: 0,
                totalPlazas: 0,
                totalPosiciones: 0,
                totalPostulantes: 0,
                totalAdjudicaciones: 0
            });
            
            // Calcular porcentajes
            resumen.porcentajeAdjudicacion = resumen.totalPosiciones > 0 ? 
                Math.round((resumen.totalAdjudicaciones / resumen.totalPosiciones) * 100) : 0;
            
            const resultado = {
                resumen,
                grupos: grupos.map(grupo => ({
                    ...grupo,
                    porcentaje_adjudicado: grupo.total_posiciones > 0 ? 
                        Math.round((grupo.adjudicaciones_realizadas / grupo.total_posiciones) * 100) : 0
                }))
            };
            
            this.sendSuccess(res, resultado, 'Resumen estadístico obtenido exitosamente');
        } catch (error) {
            console.error('Error en getResumenEstadistico:', error);
            this.sendError(res, 'Error al obtener resumen estadístico', error, 500);
        }
    }
}

module.exports = GrupoOcupacionalController;