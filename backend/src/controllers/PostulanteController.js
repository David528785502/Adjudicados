const BaseController = require('./BaseController');
const { Postulante } = require('../models');

class PostulanteController extends BaseController {
    constructor() {
        super(Postulante);
    }

    /**
     * Override getAll to handle special filtering for postulantes
     */
    async getAll(req, res) {
        try {
            console.log('🔍 PostulanteController.getAll - Query params:', req.query);
            
            const { page, limit, grupoOcupacionalId, estado, ...otherFilters } = req.query;
            
            // If we have special filters, use the specialized methods
            if (grupoOcupacionalId || estado || Object.keys(otherFilters).length > 0) {
                console.log('📋 Using searchPostulantes method for filtered request');
                
                const filters = {};
                if (grupoOcupacionalId && !isNaN(parseInt(grupoOcupacionalId))) {
                    filters.grupoOcupacionalId = parseInt(grupoOcupacionalId);
                }
                if (estado && typeof estado === 'string') {
                    filters.estado = estado;
                }
                
                // Add other filters
                Object.assign(filters, otherFilters);
                
                console.log('🎯 Sanitized filters:', filters);
                
                // Use searchPostulantes which handles joins correctly
                const result = await this.model.searchPostulantes(filters);
                
                // Apply pagination if requested
                if (page && limit) {
                    const pageNum = parseInt(page) || 1;
                    const limitNum = parseInt(limit) || 10;
                    const startIndex = (pageNum - 1) * limitNum;
                    const endIndex = startIndex + limitNum;
                    const paginatedData = result.slice(startIndex, endIndex);
                    
                    const response = {
                        data: paginatedData,
                        pagination: {
                            page: pageNum,
                            limit: limitNum,
                            total: result.length,
                            pages: Math.ceil(result.length / limitNum)
                        }
                    };
                    
                    this.sendSuccess(res, response, 'Postulantes filtrados obtenidos exitosamente');
                } else {
                    this.sendSuccess(res, result, 'Postulantes filtrados obtenidos exitosamente');
                }
            } else {
                // No special filters, use the view for all postulantes with estado
                console.log('📊 Using getPostulantesWithEstado for complete list');
                
                const result = await this.model.getPostulantesWithEstado();
                
                // Apply pagination if requested
                if (page && limit) {
                    const pageNum = parseInt(page) || 1;
                    const limitNum = parseInt(limit) || 10;
                    const startIndex = (pageNum - 1) * limitNum;
                    const endIndex = startIndex + limitNum;
                    const paginatedData = result.slice(startIndex, endIndex);
                    
                    const response = {
                        data: paginatedData,
                        pagination: {
                            page: pageNum,
                            limit: limitNum,
                            total: result.length,
                            pages: Math.ceil(result.length / limitNum)
                        }
                    };
                    
                    this.sendSuccess(res, response, 'Postulantes con estado obtenidos exitosamente');
                } else {
                    this.sendSuccess(res, result, 'Postulantes con estado obtenidos exitosamente');
                }
            }
        } catch (error) {
            console.error('❌ Error in PostulanteController.getAll:', error);
            console.error('Stack trace:', error.stack);
            this.sendError(res, 'Error al obtener postulantes', error, 500);
        }
    }

    /**
     * Obtener postulantes con estado completo
     */
    async getPostulantesWithEstado(req, res) {
        try {
            const result = await this.model.getPostulantesWithEstado();
            this.sendSuccess(res, result, 'Postulantes con estado obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getPostulantesWithEstado:', error);
            this.sendError(res, 'Error al obtener postulantes con estado', error, 500);
        }
    }

    /**
     * Obtener postulante por ID con estado completo
     */
    async getPostulanteWithEstado(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getPostulanteWithEstado(id);
            
            if (!result) {
                return this.sendError(res, 'Postulante no encontrado', null, 404);
            }
            
            this.sendSuccess(res, result, 'Postulante con estado obtenido exitosamente');
        } catch (error) {
            console.error('Error en getPostulanteWithEstado:', error);
            this.sendError(res, 'Error al obtener postulante con estado', error, 500);
        }
    }

    /**
     * Buscar postulantes con filtros múltiples
     */
    async searchPostulantes(req, res) {
        try {
            const filters = req.query;
            const result = await this.model.searchPostulantes(filters);
            this.sendSuccess(res, result, 'Búsqueda de postulantes realizada exitosamente');
        } catch (error) {
            console.error('Error en searchPostulantes:', error);
            this.sendError(res, 'Error en búsqueda de postulantes', error, 500);
        }
    }

    /**
     * Obtener postulantes pendientes por grupo ocupacional
     */
    async getPostulantesPendientes(req, res) {
        try {
            const { grupoOcupacionalId } = req.params;
            const { limit = 50 } = req.query;
            const result = await this.model.getPostulantesPendientes(grupoOcupacionalId, parseInt(limit));
            this.sendSuccess(res, result, 'Postulantes pendientes obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getPostulantesPendientes:', error);
            this.sendError(res, 'Error al obtener postulantes pendientes', error, 500);
        }
    }

    /**
     * Buscar postulante por DNI
     */
    async findByDni(req, res) {
        try {
            const { dni } = req.params;
            const result = await this.model.findByDni(dni);
            
            if (!result) {
                return this.sendError(res, 'Postulante no encontrado', null, 404);
            }
            
            this.sendSuccess(res, result, 'Postulante encontrado exitosamente');
        } catch (error) {
            console.error('Error en findByDni:', error);
            this.sendError(res, 'Error al buscar postulante por DNI', error, 500);
        }
    }

    /**
     * Buscar postulante por orden de mérito
     */
    async findByOrdenMerito(req, res) {
        try {
            const { ordenMerito, grupoOcupacionalId } = req.params;
            const result = await this.model.findByOrdenMerito(parseInt(ordenMerito), parseInt(grupoOcupacionalId));
            
            if (!result) {
                return this.sendError(res, 'Postulante no encontrado', null, 404);
            }
            
            this.sendSuccess(res, result, 'Postulante encontrado exitosamente');
        } catch (error) {
            console.error('Error en findByOrdenMerito:', error);
            this.sendError(res, 'Error al buscar postulante por orden de mérito', error, 500);
        }
    }

    /**
     * Obtener estadísticas de postulantes por grupo ocupacional
     */
    async getEstadisticasByGrupo(req, res) {
        try {
            const result = await this.model.getEstadisticasByGrupo();
            this.sendSuccess(res, result, 'Estadísticas por grupo obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getEstadisticasByGrupo:', error);
            this.sendError(res, 'Error al obtener estadísticas por grupo', error, 500);
        }
    }

    /**
     * Obtener siguiente postulante para adjudicar
     */
    async getSiguientePostulante(req, res) {
        try {
            const { grupoOcupacionalId } = req.params;
            const result = await this.model.getSiguientePostulante(parseInt(grupoOcupacionalId));
            
            if (!result) {
                return this.sendError(res, 'No hay postulantes pendientes para este grupo ocupacional', null, 404);
            }
            
            this.sendSuccess(res, result, 'Siguiente postulante obtenido exitosamente');
        } catch (error) {
            console.error('Error en getSiguientePostulante:', error);
            this.sendError(res, 'Error al obtener siguiente postulante', error, 500);
        }
    }

    /**
     * Obtener postulantes por rango de orden de mérito
     */
    async getPostulantesByRango(req, res) {
        try {
            const { grupoOcupacionalId } = req.params;
            const { ordenInicio, ordenFin } = req.query;
            
            if (!ordenInicio || !ordenFin) {
                return this.sendError(res, 'Orden de inicio y fin son requeridos');
            }
            
            const result = await this.model.getPostulantesByRango(
                parseInt(grupoOcupacionalId), 
                parseInt(ordenInicio), 
                parseInt(ordenFin)
            );
            
            this.sendSuccess(res, result, 'Postulantes por rango obtenidos exitosamente');
        } catch (error) {
            console.error('Error en getPostulantesByRango:', error);
            this.sendError(res, 'Error al obtener postulantes por rango', error, 500);
        }
    }

    /**
     * Obtener estadísticas detalladas de un postulante
     */
    async getPostulanteStats(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getPostulanteStats(id);
            
            if (!result) {
                return this.sendError(res, 'Postulante no encontrado', null, 404);
            }
            
            this.sendSuccess(res, result, 'Estadísticas del postulante obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getPostulanteStats:', error);
            this.sendError(res, 'Error al obtener estadísticas del postulante', error, 500);
        }
    }

    /**
     * Validar datos de postulante antes de crear/actualizar
     */
    async validatePostulante(req, res) {
        try {
            const { id, ...data } = req.body;
            
            if (!data.orden_merito || !data.apellidos_nombres || !data.grupo_ocupacional_id) {
                return this.sendError(res, 'Orden de mérito, apellidos y nombres, y grupo ocupacional son requeridos');
            }
            
            try {
                if (id) {
                    await this.model.validateForUpdate(id, data);
                } else {
                    await this.model.validateForCreation(data);
                }
                
                this.sendSuccess(res, { valido: true }, 'Datos válidos');
            } catch (validationError) {
                this.sendSuccess(res, { valido: false, mensaje: validationError.message }, 'Validación completada');
            }
        } catch (error) {
            console.error('Error en validatePostulante:', error);
            this.sendError(res, 'Error en validación', error, 500);
        }
    }

    /**
     * Obtener dashboard de postulantes
     */
    async getDashboard(req, res) {
        try {
            const estadisticasPorGrupo = await this.model.getEstadisticasByGrupo();
            
            // Calcular totales generales
            const totales = estadisticasPorGrupo.reduce((acc, grupo) => {
                acc.totalPostulantes += parseInt(grupo.total_postulantes) || 0;
                acc.pendientes += parseInt(grupo.pendientes) || 0;
                acc.adjudicados += parseInt(grupo.adjudicados) || 0;
                acc.desistidos += parseInt(grupo.desistidos) || 0;
                acc.renuncias += parseInt(grupo.renuncias) || 0;
                return acc;
            }, {
                totalPostulantes: 0,
                pendientes: 0,
                adjudicados: 0,
                desistidos: 0,
                renuncias: 0
            });
            
            // Calcular porcentajes
            totales.porcentajeAdjudicados = totales.totalPostulantes > 0 ? 
                Math.round((totales.adjudicados / totales.totalPostulantes) * 100) : 0;
            totales.porcentajePendientes = totales.totalPostulantes > 0 ? 
                Math.round((totales.pendientes / totales.totalPostulantes) * 100) : 0;
            
            const dashboard = {
                totales,
                por_grupo: estadisticasPorGrupo.map(grupo => ({
                    ...grupo,
                    porcentaje_adjudicados: grupo.total_postulantes > 0 ? 
                        Math.round((grupo.adjudicados / grupo.total_postulantes) * 100) : 0
                }))
            };
            
            this.sendSuccess(res, dashboard, 'Dashboard de postulantes obtenido exitosamente');
        } catch (error) {
            console.error('Error en getDashboard:', error);
            this.sendError(res, 'Error al obtener dashboard', error, 500);
        }
    }

    /**
     * Obtener postulantes con paginación y filtros avanzados
     */
    async getPostulantesAdvanced(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                ...filters 
            } = req.query;
            
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            
            // Si hay filtros, usar búsqueda específica
            if (Object.keys(filters).length > 0) {
                const result = await this.model.searchPostulantes(filters);
                
                // Implementar paginación manual
                const startIndex = (pageNum - 1) * limitNum;
                const endIndex = startIndex + limitNum;
                const paginatedData = result.slice(startIndex, endIndex);
                
                const response = {
                    data: paginatedData,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: result.length,
                        pages: Math.ceil(result.length / limitNum)
                    }
                };
                
                this.sendSuccess(res, response, 'Postulantes avanzados obtenidos exitosamente');
            } else {
                // Sin filtros, usar paginación normal
                const result = await this.model.findWithPagination(pageNum, limitNum, {}, 'orden_merito');
                this.sendSuccess(res, result, 'Postulantes obtenidos exitosamente');
            }
        } catch (error) {
            console.error('Error en getPostulantesAdvanced:', error);
            this.sendError(res, 'Error al obtener postulantes avanzados', error, 500);
        }
    }

    /**
     * Calcular tiempo de servicio total
     */
    async calcularTiempoServicio(req, res) {
        try {
            const { anios = 0, meses = 0, dias = 0 } = req.query;
            const totalDias = this.model.calcularTiempoServicioTotal(
                parseInt(anios), 
                parseInt(meses), 
                parseInt(dias)
            );
            
            this.sendSuccess(res, { 
                anios: parseInt(anios), 
                meses: parseInt(meses), 
                dias: parseInt(dias), 
                totalDias 
            }, 'Tiempo de servicio calculado exitosamente');
        } catch (error) {
            console.error('Error en calcularTiempoServicio:', error);
            this.sendError(res, 'Error al calcular tiempo de servicio', error, 500);
        }
    }
}

module.exports = PostulanteController;