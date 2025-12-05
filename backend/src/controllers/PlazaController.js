const BaseController = require('./BaseController');
const { Plaza } = require('../models');

class PlazaController extends BaseController {
    constructor() {
        super(Plaza);
    }

    /**
     * Override getAll to handle special filtering for plazas
     */
    async getAll(req, res) {
        try {
            console.log('🔍 PlazaController.getAll - Query params:', req.query);
            
            const { page, limit, redId, grupoOcupacionalId, ipressId, soloDisponibles, ...otherFilters } = req.query;
            
            // If we have special filters, use the specialized methods
            if (redId || grupoOcupacionalId || ipressId || soloDisponibles === 'true') {
                console.log('📋 Using searchPlazas method for filtered request');
                
                const filters = {};
                if (redId && !isNaN(parseInt(redId))) {
                    filters.redId = parseInt(redId);
                }
                if (grupoOcupacionalId && !isNaN(parseInt(grupoOcupacionalId))) {
                    filters.grupoOcupacionalId = parseInt(grupoOcupacionalId);
                }
                if (ipressId && !isNaN(parseInt(ipressId))) {
                    filters.ipressId = parseInt(ipressId);
                }
                if (soloDisponibles === 'true') {
                    filters.soloDisponibles = true;
                }
                
                console.log('🎯 Sanitized filters:', filters);
                
                // Use searchPlazas which handles joins correctly
                const result = await this.model.searchPlazas(filters);
                
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
                    
                    this.sendSuccess(res, response, 'Plazas filtradas obtenidas exitosamente');
                } else {
                    this.sendSuccess(res, result, 'Plazas filtradas obtenidas exitosamente');
                }
            } else if (soloDisponibles === 'false' || Object.keys(otherFilters).length === 0) {
                // No special filters, use the view for all plazas with availability
                console.log('📊 Using getPlazasWithAvailability for complete list');
                
                const result = await this.model.getPlazasWithAvailability();
                
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
                    
                    this.sendSuccess(res, response, 'Plazas con disponibilidad obtenidas exitosamente');
                } else {
                    this.sendSuccess(res, result, 'Plazas con disponibilidad obtenidas exitosamente');
                }
            } else {
                // Other filters, delegate to parent
                console.log('⚙️ Using parent getAll for other filters:', otherFilters);
                await super.getAll(req, res);
            }
        } catch (error) {
            console.error('❌ Error in PlazaController.getAll:', error);
            console.error('Stack trace:', error.stack);
            this.sendError(res, 'Error al obtener plazas', error, 500);
        }
    }

    /**
     * Obtener plazas con disponibilidad (usando vista)
     */
    async getPlazasWithAvailability(req, res) {
        try {
            const result = await this.model.getPlazasWithAvailability();
            this.sendSuccess(res, result, 'Plazas con disponibilidad obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getPlazasWithAvailability:', error);
            this.sendError(res, 'Error al obtener plazas con disponibilidad', error, 500);
        }
    }

    /**
     * Obtener plaza por ID con detalles completos
     */
    async getPlazaWithDetails(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getPlazaWithDetails(id);
            
            if (!result) {
                return this.sendError(res, 'Plaza no encontrada', null, 404);
            }
            
            this.sendSuccess(res, result, 'Plaza con detalles obtenida exitosamente');
        } catch (error) {
            console.error('Error en getPlazaWithDetails:', error);
            this.sendError(res, 'Error al obtener plaza con detalles', error, 500);
        }
    }

    /**
     * Buscar plazas con filtros múltiples
     */
    async searchPlazas(req, res) {
        try {
            const filters = req.query;
            const result = await this.model.searchPlazas(filters);
            this.sendSuccess(res, result, 'Búsqueda de plazas realizada exitosamente');
        } catch (error) {
            console.error('Error en searchPlazas:', error);
            this.sendError(res, 'Error en búsqueda de plazas', error, 500);
        }
    }

    /**
     * Obtener plazas disponibles para adjudicación
     */
    async getAvailablePlazas(req, res) {
        try {
            const { grupoOcupacionalId } = req.query;
            const result = await this.model.getAvailablePlazas(grupoOcupacionalId || null);
            this.sendSuccess(res, result, 'Plazas disponibles obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getAvailablePlazas:', error);
            this.sendError(res, 'Error al obtener plazas disponibles', error, 500);
        }
    }

    /**
     * Verificar disponibilidad de una plaza específica
     */
    async checkAvailability(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.checkAvailability(id);
            
            if (!result) {
                return this.sendError(res, 'Plaza no encontrada', null, 404);
            }
            
            this.sendSuccess(res, result, 'Disponibilidad de plaza verificada exitosamente');
        } catch (error) {
            console.error('Error en checkAvailability:', error);
            this.sendError(res, 'Error al verificar disponibilidad de plaza', error, 500);
        }
    }

    /**
     * Obtener adjudicaciones de una plaza
     */
    async getAdjudicaciones(req, res) {
        try {
            const { id } = req.params;
            const result = await this.model.getAdjudicaciones(id);
            this.sendSuccess(res, result, 'Adjudicaciones de plaza obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getAdjudicaciones:', error);
            this.sendError(res, 'Error al obtener adjudicaciones de plaza', error, 500);
        }
    }

    /**
     * Obtener estadísticas generales de plazas
     */
    async getGeneralStats(req, res) {
        try {
            const result = await this.model.getGeneralStats();
            this.sendSuccess(res, result, 'Estadísticas generales obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getGeneralStats:', error);
            this.sendError(res, 'Error al obtener estadísticas generales', error, 500);
        }
    }

    /**
     * Obtener plazas agrupadas por red
     */
    async getPlazasByRed(req, res) {
        try {
            const result = await this.model.getPlazasByRed();
            this.sendSuccess(res, result, 'Plazas por red obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getPlazasByRed:', error);
            this.sendError(res, 'Error al obtener plazas por red', error, 500);
        }
    }

    /**
     * Obtener plazas agrupadas por grupo ocupacional
     */
    async getPlazasByGrupoOcupacional(req, res) {
        try {
            const result = await this.model.getPlazasByGrupoOcupacional();
            this.sendSuccess(res, result, 'Plazas por grupo ocupacional obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getPlazasByGrupoOcupacional:', error);
            this.sendError(res, 'Error al obtener plazas por grupo ocupacional', error, 500);
        }
    }

    /**
     * Validar datos de plaza antes de crear/actualizar
     */
    async validatePlaza(req, res) {
        try {
            const { id, ...data } = req.body;
            
            if (!data.ipress_id || !data.grupo_ocupacional_id || data.total === undefined) {
                return this.sendError(res, 'IPRESS, grupo ocupacional y total son requeridos');
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
            console.error('Error en validatePlaza:', error);
            this.sendError(res, 'Error en validación', error, 500);
        }
    }

    /**
     * Obtener dashboard de plazas con estadísticas completas
     */
    async getDashboard(req, res) {
        try {
            const [generalStats, plazasByRed, plazasByGrupo] = await Promise.all([
                this.model.getGeneralStats(),
                this.model.getPlazasByRed(),
                this.model.getPlazasByGrupoOcupacional()
            ]);
            
            // Calcular porcentajes
            const dashboard = {
                general: {
                    ...generalStats,
                    porcentaje_ocupacion: generalStats.total_posiciones > 0 ? 
                        Math.round((generalStats.total_asignados / generalStats.total_posiciones) * 100) : 0
                },
                por_red: plazasByRed.map(red => ({
                    ...red,
                    porcentaje_ocupacion: red.total_posiciones > 0 ? 
                        Math.round((red.total_asignados / red.total_posiciones) * 100) : 0
                })),
                por_grupo: plazasByGrupo.map(grupo => ({
                    ...grupo,
                    porcentaje_ocupacion: grupo.total_posiciones > 0 ? 
                        Math.round((grupo.total_asignados / grupo.total_posiciones) * 100) : 0
                }))
            };
            
            this.sendSuccess(res, dashboard, 'Dashboard de plazas obtenido exitosamente');
        } catch (error) {
            console.error('Error en getDashboard:', error);
            this.sendError(res, 'Error al obtener dashboard', error, 500);
        }
    }

    /**
     * Obtener plazas con filtros avanzados y paginación
     */
    async getPlazasAdvanced(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                soloDisponibles, 
                ...filters 
            } = req.query;
            
            // Agregar filtro de solo disponibles si se especifica
            if (soloDisponibles === 'true') {
                filters.soloDisponibles = true;
            }
            
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            
            // Para búsquedas con filtros, usar el método específico
            if (Object.keys(filters).length > 0) {
                const result = await this.model.searchPlazas(filters);
                
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
                
                this.sendSuccess(res, response, 'Plazas avanzadas obtenidas exitosamente');
            } else {
                // Sin filtros, usar paginación normal
                const result = await this.model.findWithPagination(pageNum, limitNum);
                this.sendSuccess(res, result, 'Plazas obtenidas exitosamente');
            }
        } catch (error) {
            console.error('Error en getPlazasAdvanced:', error);
            this.sendError(res, 'Error al obtener plazas avanzadas', error, 500);
        }
    }
}

module.exports = PlazaController;