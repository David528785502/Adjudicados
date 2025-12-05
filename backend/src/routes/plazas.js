const express = require('express');
const router = express.Router();
const { PlazaController } = require('../controllers');
const { 
    validate, 
    validateQuery, 
    validateParams, 
    schemas, 
    commonSchemas, 
    asyncHandler 
} = require('../middleware');

// Instanciar controlador
const plazaController = new PlazaController();

/**
 * @route   GET /api/plazas
 * @desc    Obtener todas las plazas
 * @access  Public
 */
router.get('/', 
    validateQuery(commonSchemas.pagination),
    asyncHandler(plazaController.getAll.bind(plazaController))
);

/**
 * @route   GET /api/plazas/advanced
 * @desc    Obtener plazas con filtros avanzados y paginación
 * @access  Public
 */
router.get('/advanced', 
    validateQuery(schemas.plaza.search.keys({
        page: commonSchemas.pagination.extract('page').optional(),
        limit: commonSchemas.pagination.extract('limit').optional()
    })),
    asyncHandler(plazaController.getPlazasAdvanced.bind(plazaController))
);

/**
 * @route   GET /api/plazas/with-availability
 * @desc    Obtener plazas con información de disponibilidad
 * @access  Public
 */
router.get('/with-availability', 
    asyncHandler(plazaController.getPlazasWithAvailability.bind(plazaController))
);

/**
 * @route   GET /api/plazas/available
 * @desc    Obtener plazas disponibles para adjudicación
 * @access  Public
 */
router.get('/available', 
    validateQuery({
        grupoOcupacionalId: commonSchemas.id.extract('id').optional()
    }),
    asyncHandler(plazaController.getAvailablePlazas.bind(plazaController))
);

/**
 * @route   GET /api/plazas/stats/general
 * @desc    Obtener estadísticas generales de plazas
 * @access  Public
 */
router.get('/stats/general', 
    asyncHandler(plazaController.getGeneralStats.bind(plazaController))
);

/**
 * @route   GET /api/plazas/stats/by-red
 * @desc    Obtener plazas agrupadas por red
 * @access  Public
 */
router.get('/stats/by-red', 
    asyncHandler(plazaController.getPlazasByRed.bind(plazaController))
);

/**
 * @route   GET /api/plazas/stats/by-grupo
 * @desc    Obtener plazas agrupadas por grupo ocupacional
 * @access  Public
 */
router.get('/stats/by-grupo', 
    asyncHandler(plazaController.getPlazasByGrupoOcupacional.bind(plazaController))
);

/**
 * @route   GET /api/plazas/dashboard
 * @desc    Obtener dashboard de plazas con estadísticas completas
 * @access  Public
 */
router.get('/dashboard', 
    asyncHandler(plazaController.getDashboard.bind(plazaController))
);

/**
 * @route   GET /api/plazas/search
 * @desc    Buscar plazas con filtros múltiples
 * @access  Public
 */
router.get('/search', 
    validateQuery(schemas.plaza.search),
    asyncHandler(plazaController.searchPlazas.bind(plazaController))
);

/**
 * @route   POST /api/plazas/validate
 * @desc    Validar datos de plaza
 * @access  Public
 */
router.post('/validate',
    validate(schemas.plaza.create.keys({
        id: commonSchemas.id.extract('id').optional()
    })),
    asyncHandler(plazaController.validatePlaza.bind(plazaController))
);

/**
 * @route   GET /api/plazas/count
 * @desc    Contar plazas
 * @access  Public
 */
router.get('/count', 
    asyncHandler(plazaController.count.bind(plazaController))
);

/**
 * @route   GET /api/plazas/:id
 * @desc    Obtener plaza por ID
 * @access  Public
 */
router.get('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(plazaController.getById.bind(plazaController))
);

/**
 * @route   GET /api/plazas/:id/details
 * @desc    Obtener plaza por ID con detalles completos
 * @access  Public
 */
router.get('/:id/details', 
    validateParams(commonSchemas.id),
    asyncHandler(plazaController.getPlazaWithDetails.bind(plazaController))
);

/**
 * @route   GET /api/plazas/:id/availability
 * @desc    Verificar disponibilidad de una plaza específica
 * @access  Public
 */
router.get('/:id/availability', 
    validateParams(commonSchemas.id),
    asyncHandler(plazaController.checkAvailability.bind(plazaController))
);

/**
 * @route   GET /api/plazas/:id/adjudicaciones
 * @desc    Obtener adjudicaciones de una plaza
 * @access  Public
 */
router.get('/:id/adjudicaciones', 
    validateParams(commonSchemas.id),
    asyncHandler(plazaController.getAdjudicaciones.bind(plazaController))
);

/**
 * @route   POST /api/plazas
 * @desc    Crear nueva plaza
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/', 
    validate(schemas.plaza.create),
    asyncHandler(plazaController.create.bind(plazaController))
);

/**
 * @route   PUT /api/plazas/:id
 * @desc    Actualizar plaza
 * @access  Public (en producción debería requerir autenticación)
 */
router.put('/:id', 
    validateParams(commonSchemas.id),
    validate(schemas.plaza.update),
    asyncHandler(plazaController.update.bind(plazaController))
);

/**
 * @route   DELETE /api/plazas/:id
 * @desc    Eliminar plaza
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.delete('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(plazaController.delete.bind(plazaController))
);

module.exports = router;