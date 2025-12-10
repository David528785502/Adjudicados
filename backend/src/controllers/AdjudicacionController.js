const BaseController = require('./BaseController');
const { Adjudicacion } = require('../models');

class AdjudicacionController extends BaseController {
    constructor() {
        super(Adjudicacion);
    }

    /**
     * Realizar adjudicación automática
     */
    async adjudicarAutomatico(req, res) {
        try {
            const { postulanteId, plazaId, observaciones } = req.body;
            
            if (!postulanteId || !plazaId) {
                return this.sendError(res, 'Postulante ID y Plaza ID son requeridos');
            }
            
            const result = await this.model.adjudicarAutomatico(postulanteId, plazaId, observaciones);
            this.sendSuccess(res, result, 'Adjudicación realizada exitosamente', 201);
        } catch (error) {
            console.error('Error en adjudicarAutomatico:', error);
            this.sendError(res, 'Error al realizar adjudicación', error, 400);
        }
    }

    /**
     * Marcar postulante como desistido
     */
    async marcarDesistido(req, res) {
        try {
            const { postulanteId } = req.params;
            const { observaciones } = req.body;
            
            const result = await this.model.marcarDesistido(postulanteId, observaciones);
            this.sendSuccess(res, result, 'Postulante marcado como desistido exitosamente');
        } catch (error) {
            console.error('Error en marcarDesistido:', error);
            this.sendError(res, 'Error al marcar como desistido', error, 400);
        }
    }

    /**
     * Marcar adjudicación como renuncia
     */
    async marcarRenuncia(req, res) {
        try {
            const { postulanteId } = req.params;
            const { observaciones } = req.body;
            
            const result = await this.model.marcarRenuncia(postulanteId, observaciones);
            this.sendSuccess(res, result, 'Renuncia registrada exitosamente');
        } catch (error) {
            console.error('Error en marcarRenuncia:', error);
            this.sendError(res, 'Error al registrar renuncia', error, 400);
        }
    }

    /**
     * Marcar postulante como ausente
     */
    async marcarAusente(req, res) {
        try {
            const { postulanteId } = req.params;
            const { observaciones } = req.body;
            
            const result = await this.model.marcarAusente(postulanteId, observaciones);
            this.sendSuccess(res, result, 'Postulante marcado como ausente exitosamente');
        } catch (error) {
            console.error('Error en marcarAusente:', error);
            this.sendError(res, 'Error al marcar como ausente', error, 400);
        }
    }

    /**
     * Reasignar postulante - cambiar estado a pendiente
     */
    async reasignar(req, res) {
        try {
            const { postulanteId } = req.params;
            const { observaciones } = req.body;
            
            const result = await this.model.reasignar(postulanteId, observaciones);
            this.sendSuccess(res, result, 'Postulante reasignado exitosamente. Estado cambiado a pendiente');
        } catch (error) {
            console.error('Error en reasignar:', error);
            this.sendError(res, 'Error al reasignar postulante', error, 400);
        }
    }

    /**
     * Validar si se puede realizar una adjudicación
     */
    async validarAdjudicacion(req, res) {
        try {
            const { postulanteId, plazaId } = req.query;
            
            if (!postulanteId || !plazaId) {
                return this.sendError(res, 'Postulante ID y Plaza ID son requeridos');
            }
            
            const result = await this.model.validarAdjudicacion(postulanteId, plazaId);
            this.sendSuccess(res, result, 'Validación completada');
        } catch (error) {
            console.error('Error en validarAdjudicacion:', error);
            this.sendError(res, 'Error en validación', error, 500);
        }
    }

    /**
     * Obtener adjudicaciones con información completa
     */
    async getAdjudicacionesCompletas(req, res) {
        try {
            const filters = req.query;
            const result = await this.model.getAdjudicacionesCompletas(filters);
            this.sendSuccess(res, result, 'Adjudicaciones completas obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getAdjudicacionesCompletas:', error);
            this.sendError(res, 'Error al obtener adjudicaciones completas', error, 500);
        }
    }

    /**
     * Obtener estadísticas generales de adjudicaciones
     */
    async getEstadisticas(req, res) {
        try {
            const result = await this.model.getEstadisticas();
            this.sendSuccess(res, result, 'Estadísticas obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getEstadisticas:', error);
            this.sendError(res, 'Error al obtener estadísticas', error, 500);
        }
    }

    /**
     * Obtener estadísticas por red
     */
    async getEstadisticasByRed(req, res) {
        try {
            const result = await this.model.getEstadisticasByRed();
            this.sendSuccess(res, result, 'Estadísticas por red obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getEstadisticasByRed:', error);
            this.sendError(res, 'Error al obtener estadísticas por red', error, 500);
        }
    }

    /**
     * Procesar adjudicaciones masivas automáticas
     */
    async procesarAdjudicacionesMasivas(req, res) {
        try {
            const { grupoOcupacionalId, cantidad = 10 } = req.body;
            
            if (!grupoOcupacionalId) {
                return this.sendError(res, 'Grupo ocupacional ID es requerido');
            }
            
            const result = await this.model.procesarAdjudicacionesMasivas(
                grupoOcupacionalId, 
                parseInt(cantidad)
            );
            
            this.sendSuccess(res, {
                adjudicaciones: result,
                total: result.length
            }, `${result.length} adjudicaciones masivas procesadas exitosamente`, 201);
        } catch (error) {
            console.error('Error en procesarAdjudicacionesMasivas:', error);
            this.sendError(res, 'Error al procesar adjudicaciones masivas', error, 400);
        }
    }

    /**
     * Revertir adjudicación
     */
    async revertirAdjudicacion(req, res) {
        try {
            const { adjudicacionId } = req.params;
            const { observaciones } = req.body;
            
            const result = await this.model.revertirAdjudicacion(adjudicacionId, observaciones);
            this.sendSuccess(res, result, 'Adjudicación revertida exitosamente');
        } catch (error) {
            console.error('Error en revertirAdjudicacion:', error);
            this.sendError(res, 'Error al revertir adjudicación', error, 400);
        }
    }

    /**
     * Obtener dashboard completo de adjudicaciones
     */
    async getDashboard(req, res) {
        try {
            const [estadisticasGenerales, estadisticasPorRed] = await Promise.all([
                this.model.getEstadisticas(),
                this.model.getEstadisticasByRed()
            ]);
            
            // Calcular métricas adicionales
            const dashboard = {
                general: estadisticasGenerales,
                por_red: estadisticasPorRed.map(red => ({
                    ...red,
                    porcentaje_adjudicado: red.total_adjudicaciones > 0 ? 
                        Math.round((red.adjudicados / red.total_adjudicaciones) * 100) : 0
                })),
                metricas_clave: {
                    eficiencia_adjudicacion: estadisticasGenerales.porcentaje_adjudicado,
                    tasa_desistimiento: estadisticasGenerales.total_adjudicaciones > 0 ? 
                        Math.round((estadisticasGenerales.desistidos / estadisticasGenerales.total_adjudicaciones) * 100) : 0,
                    tasa_renuncias: estadisticasGenerales.total_adjudicaciones > 0 ? 
                        Math.round((estadisticasGenerales.renuncias / estadisticasGenerales.total_adjudicaciones) * 100) : 0
                }
            };
            
            this.sendSuccess(res, dashboard, 'Dashboard de adjudicaciones obtenido exitosamente');
        } catch (error) {
            console.error('Error en getDashboard:', error);
            this.sendError(res, 'Error al obtener dashboard', error, 500);
        }
    }

    /**
     * Obtener adjudicaciones por postulante
     */
    async getAdjudicacionesByPostulante(req, res) {
        try {
            const { postulanteId } = req.params;
            const result = await this.model.findAll({ postulante_id: postulanteId });
            this.sendSuccess(res, result, 'Adjudicaciones del postulante obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getAdjudicacionesByPostulante:', error);
            this.sendError(res, 'Error al obtener adjudicaciones del postulante', error, 500);
        }
    }

    /**
     * Obtener adjudicaciones por plaza
     */
    async getAdjudicacionesByPlaza(req, res) {
        try {
            const { plazaId } = req.params;
            const result = await this.model.findAll({ plaza_id: plazaId });
            this.sendSuccess(res, result, 'Adjudicaciones de la plaza obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getAdjudicacionesByPlaza:', error);
            this.sendError(res, 'Error al obtener adjudicaciones de la plaza', error, 500);
        }
    }

    /**
     * Actualizar estado de adjudicación
     */
    async updateEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, observaciones } = req.body;
            
            if (!estado) {
                return this.sendError(res, 'Estado es requerido');
            }
            
            const validStates = ['pendiente', 'adjudicado', 'desistido', 'renuncio'];
            if (!validStates.includes(estado)) {
                return this.sendError(res, 'Estado inválido');
            }
            
            const updateData = { estado };
            
            if (estado === 'desistido' || estado === 'renuncio') {
                updateData.fecha_desistimiento = new Date();
            } else if (estado === 'adjudicado') {
                updateData.fecha_adjudicacion = new Date();
            }
            
            if (observaciones) {
                updateData.observaciones = observaciones;
            }
            
            const result = await this.model.update(id, updateData);
            
            if (!result) {
                return this.sendError(res, 'Adjudicación no encontrada', null, 404);
            }
            
            this.sendSuccess(res, result, 'Estado de adjudicación actualizado exitosamente');
        } catch (error) {
            console.error('Error en updateEstado:', error);
            this.sendError(res, 'Error al actualizar estado', error, 400);
        }
    }

    /**
     * Obtener historial de adjudicaciones
     */
    async getHistorial(req, res) {
        try {
            const { 
                fechaInicio, 
                fechaFin, 
                estado, 
                grupoOcupacionalId,
                page = 1,
                limit = 50
            } = req.query;
            
            const filters = {};
            
            if (estado) filters.estado = estado;
            if (grupoOcupacionalId) filters.grupoOcupacionalId = grupoOcupacionalId;
            if (fechaInicio) filters.fechaDesde = fechaInicio;
            if (fechaFin) filters.fechaHasta = fechaFin;
            
            const result = await this.model.getAdjudicacionesCompletas(filters);
            
            // Implementar paginación manual
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
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
            
            this.sendSuccess(res, response, 'Historial de adjudicaciones obtenido exitosamente');
        } catch (error) {
            console.error('Error en getHistorial:', error);
            this.sendError(res, 'Error al obtener historial', error, 500);
        }
    }

    /**
     * Obtener próximas adjudicaciones sugeridas
     */
    async getProximasAdjudicaciones(req, res) {
        try {
            const { grupoOcupacionalId, limite = 10 } = req.query;
            
            if (!grupoOcupacionalId) {
                return this.sendError(res, 'Grupo ocupacional ID es requerido');
            }
            
            // Implementar lógica para obtener próximas adjudicaciones sugeridas
            // Esto sería una consulta compleja que combine postulantes pendientes con plazas disponibles
            
            // Por ahora, retornar un placeholder
            const resultado = {
                grupo_ocupacional_id: grupoOcupacionalId,
                proximas_adjudicaciones: [],
                sugerencias: 'Función en desarrollo'
            };
            
            this.sendSuccess(res, resultado, 'Próximas adjudicaciones obtenidas exitosamente');
        } catch (error) {
            console.error('Error en getProximasAdjudicaciones:', error);
            this.sendError(res, 'Error al obtener próximas adjudicaciones', error, 500);
        }
    }
}

module.exports = AdjudicacionController;