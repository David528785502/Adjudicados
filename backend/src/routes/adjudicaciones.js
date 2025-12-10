const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { AdjudicacionController } = require('../controllers');
const { 
    validate, 
    validateQuery, 
    validateParams, 
    schemas, 
    commonSchemas, 
    asyncHandler 
} = require('../middleware');

// Schema para validar ID en params
const idParamSchema = Joi.object({
    postulanteId: Joi.number().integer().positive().required()
});

// Instanciar controlador
const adjudicacionController = new AdjudicacionController();

/**
 * @route   GET /api/adjudicaciones
 * @desc    Obtener todas las adjudicaciones
 * @access  Public
 */
router.get('/', 
    validateQuery(commonSchemas.pagination),
    asyncHandler(adjudicacionController.getAll.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/completas
 * @desc    Obtener adjudicaciones con información completa
 * @access  Public
 */
router.get('/completas', 
    validateQuery(schemas.adjudicacion.filtros),
    asyncHandler(adjudicacionController.getAdjudicacionesCompletas.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/stats
 * @desc    Obtener estadísticas generales de adjudicaciones
 * @access  Public
 */
router.get('/stats', 
    asyncHandler(adjudicacionController.getEstadisticas.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/stats/by-red
 * @desc    Obtener estadísticas por red
 * @access  Public
 */
router.get('/stats/by-red', 
    asyncHandler(adjudicacionController.getEstadisticasByRed.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/dashboard
 * @desc    Obtener dashboard completo de adjudicaciones
 * @access  Public
 */
router.get('/dashboard', 
    asyncHandler(adjudicacionController.getDashboard.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/historial
 * @desc    Obtener historial de adjudicaciones
 * @access  Public
 */
router.get('/historial', 
    validateQuery(schemas.adjudicacion.filtros),
    asyncHandler(adjudicacionController.getHistorial.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/proximas
 * @desc    Obtener próximas adjudicaciones sugeridas
 * @access  Public
 */
router.get('/proximas', 
    validateQuery({
        grupoOcupacionalId: commonSchemas.id.extract('id').required(),
        limite: commonSchemas.pagination.extract('limit').default(10)
    }),
    asyncHandler(adjudicacionController.getProximasAdjudicaciones.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/validar
 * @desc    Validar si se puede realizar una adjudicación
 * @access  Public
 */
router.get('/validar', 
    validateQuery(schemas.adjudicacion.validar),
    asyncHandler(adjudicacionController.validarAdjudicacion.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/by-postulante/:postulanteId
 * @desc    Obtener adjudicaciones por postulante
 * @access  Public
 */
router.get('/by-postulante/:postulanteId', 
    validateParams({
        postulanteId: commonSchemas.id.extract('id').required()
    }),
    asyncHandler(adjudicacionController.getAdjudicacionesByPostulante.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/by-plaza/:plazaId
 * @desc    Obtener adjudicaciones por plaza
 * @access  Public
 */
router.get('/by-plaza/:plazaId', 
    validateParams({
        plazaId: commonSchemas.id.extract('id').required()
    }),
    asyncHandler(adjudicacionController.getAdjudicacionesByPlaza.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/count
 * @desc    Contar adjudicaciones
 * @access  Public
 */
router.get('/count', 
    asyncHandler(adjudicacionController.count.bind(adjudicacionController))
);

/**
 * @route   GET /api/adjudicaciones/:id
 * @desc    Obtener adjudicación por ID
 * @access  Public
 */
router.get('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(adjudicacionController.getById.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones/adjudicar
 * @desc    Realizar adjudicación automática
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/adjudicar', 
    validate(schemas.adjudicacion.crear),
    asyncHandler(adjudicacionController.adjudicarAutomatico.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones/masiva
 * @desc    Procesar adjudicaciones masivas automáticas
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.post('/masiva', 
    validate(schemas.adjudicacion.masiva),
    asyncHandler(adjudicacionController.procesarAdjudicacionesMasivas.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones/desistir/:postulanteId
 * @desc    Marcar postulante como desistido
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/desistir/:postulanteId', 
    validateParams(idParamSchema),
    validate(schemas.adjudicacion.desistir),
    asyncHandler(adjudicacionController.marcarDesistido.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones/renuncia/:postulanteId
 * @desc    Marcar adjudicación como renuncia
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/renuncia/:postulanteId', 
    validateParams(idParamSchema),
    validate(schemas.adjudicacion.renuncia),
    asyncHandler(adjudicacionController.marcarRenuncia.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones/ausente/:postulanteId
 * @desc    Marcar postulante como ausente
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/ausente/:postulanteId', 
    validateParams(idParamSchema),
    validate(schemas.adjudicacion.desistir),
    asyncHandler(adjudicacionController.marcarAusente.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones/reasignar/:postulanteId
 * @desc    Reasignar postulante - cambiar estado a pendiente
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/reasignar/:postulanteId', 
    validateParams(idParamSchema),
    validate(schemas.adjudicacion.desistir),
    asyncHandler(adjudicacionController.reasignar.bind(adjudicacionController))
);

/**
 * @route   PUT /api/adjudicaciones/:id/estado
 * @desc    Actualizar estado de adjudicación
 * @access  Public (en producción debería requerir autenticación)
 */
router.put('/:id/estado', 
    validateParams(commonSchemas.id),
    validate(schemas.adjudicacion.updateEstado),
    asyncHandler(adjudicacionController.updateEstado.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones/revertir/:adjudicacionId
 * @desc    Revertir adjudicación
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.post('/revertir/:adjudicacionId', 
    validateParams({
        adjudicacionId: commonSchemas.id.extract('id').required()
    }),
    validate(schemas.adjudicacion.revertir),
    asyncHandler(adjudicacionController.revertirAdjudicacion.bind(adjudicacionController))
);

/**
 * @route   POST /api/adjudicaciones
 * @desc    Crear nueva adjudicación (método alternativo)
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/', 
    validate(schemas.adjudicacion.crear),
    asyncHandler(adjudicacionController.create.bind(adjudicacionController))
);

/**
 * @route   PUT /api/adjudicaciones/:id
 * @desc    Actualizar adjudicación
 * @access  Public (en producción debería requerir autenticación)
 */
router.put('/:id', 
    validateParams(commonSchemas.id),
    validate(schemas.adjudicacion.updateEstado),
    asyncHandler(adjudicacionController.update.bind(adjudicacionController))
);

/**
 * @route   DELETE /api/adjudicaciones/:id
 * @desc    Eliminar adjudicación
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.delete('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(adjudicacionController.delete.bind(adjudicacionController))
);

module.exports = router;