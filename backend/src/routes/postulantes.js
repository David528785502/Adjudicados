const express = require('express');
const router = express.Router();
const { PostulanteController } = require('../controllers');
const { 
    validate, 
    validateQuery, 
    validateParams, 
    schemas, 
    commonSchemas, 
    asyncHandler 
} = require('../middleware');

// Instanciar controlador
const postulanteController = new PostulanteController();

/**
 * @route   GET /api/postulantes
 * @desc    Obtener todos los postulantes
 * @access  Public
 */
router.get('/', 
    validateQuery(commonSchemas.pagination),
    asyncHandler(postulanteController.getAll.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/advanced
 * @desc    Obtener postulantes con paginación y filtros avanzados
 * @access  Public
 */
router.get('/advanced', 
    validateQuery(schemas.postulante.search.keys({
        page: commonSchemas.pagination.extract('page').optional(),
        limit: commonSchemas.pagination.extract('limit').optional()
    })),
    asyncHandler(postulanteController.getPostulantesAdvanced.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/with-estado
 * @desc    Obtener postulantes con estado completo
 * @access  Public
 */
router.get('/with-estado', 
    asyncHandler(postulanteController.getPostulantesWithEstado.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/stats/by-grupo
 * @desc    Obtener estadísticas de postulantes por grupo ocupacional
 * @access  Public
 */
router.get('/stats/by-grupo', 
    asyncHandler(postulanteController.getEstadisticasByGrupo.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/dashboard
 * @desc    Obtener dashboard de postulantes
 * @access  Public
 */
router.get('/dashboard', 
    asyncHandler(postulanteController.getDashboard.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/search
 * @desc    Buscar postulantes con filtros múltiples
 * @access  Public
 */
router.get('/search', 
    validateQuery(schemas.postulante.search),
    asyncHandler(postulanteController.searchPostulantes.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/calcular-tiempo-servicio
 * @desc    Calcular tiempo de servicio total
 * @access  Public
 */
router.get('/calcular-tiempo-servicio', 
    validateQuery({
        anios: commonSchemas.id.extract('id').min(0).default(0),
        meses: commonSchemas.id.extract('id').min(0).max(11).default(0),
        dias: commonSchemas.id.extract('id').min(0).max(31).default(0)
    }),
    asyncHandler(postulanteController.calcularTiempoServicio.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/pendientes/:grupoOcupacionalId
 * @desc    Obtener postulantes pendientes por grupo ocupacional
 * @access  Public
 */
router.get('/pendientes/:grupoOcupacionalId', 
    validateParams({
        grupoOcupacionalId: commonSchemas.id.extract('id').required()
    }),
    validateQuery({
        limit: commonSchemas.pagination.extract('limit').default(50)
    }),
    asyncHandler(postulanteController.getPostulantesPendientes.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/siguiente/:grupoOcupacionalId
 * @desc    Obtener siguiente postulante para adjudicar
 * @access  Public
 */
router.get('/siguiente/:grupoOcupacionalId', 
    validateParams({
        grupoOcupacionalId: commonSchemas.id.extract('id').required()
    }),
    asyncHandler(postulanteController.getSiguientePostulante.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/rango/:grupoOcupacionalId
 * @desc    Obtener postulantes por rango de orden de mérito
 * @access  Public
 */
router.get('/rango/:grupoOcupacionalId', 
    validateParams({
        grupoOcupacionalId: commonSchemas.id.extract('id').required()
    }),
    validateQuery({
        ordenInicio: commonSchemas.id.extract('id').positive().required(),
        ordenFin: commonSchemas.id.extract('id').positive().required()
    }),
    asyncHandler(postulanteController.getPostulantesByRango.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/by-dni/:dni
 * @desc    Buscar postulante por DNI
 * @access  Public
 */
router.get('/by-dni/:dni', 
    validateParams({
        dni: schemas.postulante.create.extract('dni').required()
    }),
    asyncHandler(postulanteController.findByDni.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/by-orden/:ordenMerito/:grupoOcupacionalId
 * @desc    Buscar postulante por orden de mérito
 * @access  Public
 */
router.get('/by-orden/:ordenMerito/:grupoOcupacionalId', 
    validateParams({
        ordenMerito: commonSchemas.id.extract('id').positive().required(),
        grupoOcupacionalId: commonSchemas.id.extract('id').positive().required()
    }),
    asyncHandler(postulanteController.findByOrdenMerito.bind(postulanteController))
);

/**
 * @route   POST /api/postulantes/validate
 * @desc    Validar datos de postulante
 * @access  Public
 */
router.post('/validate',
    validate(schemas.postulante.create.keys({
        id: commonSchemas.id.extract('id').optional()
    })),
    asyncHandler(postulanteController.validatePostulante.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/count
 * @desc    Contar postulantes
 * @access  Public
 */
router.get('/count', 
    asyncHandler(postulanteController.count.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/:id
 * @desc    Obtener postulante por ID
 * @access  Public
 */
router.get('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(postulanteController.getById.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/:id/with-estado
 * @desc    Obtener postulante por ID con estado completo
 * @access  Public
 */
router.get('/:id/with-estado', 
    validateParams(commonSchemas.id),
    asyncHandler(postulanteController.getPostulanteWithEstado.bind(postulanteController))
);

/**
 * @route   GET /api/postulantes/:id/stats
 * @desc    Obtener estadísticas detalladas de un postulante
 * @access  Public
 */
router.get('/:id/stats', 
    validateParams(commonSchemas.id),
    asyncHandler(postulanteController.getPostulanteStats.bind(postulanteController))
);

/**
 * @route   POST /api/postulantes
 * @desc    Crear nuevo postulante
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/', 
    validate(schemas.postulante.create),
    asyncHandler(postulanteController.create.bind(postulanteController))
);

/**
 * @route   PUT /api/postulantes/:id
 * @desc    Actualizar postulante
 * @access  Public (en producción debería requerir autenticación)
 */
router.put('/:id', 
    validateParams(commonSchemas.id),
    validate(schemas.postulante.update),
    asyncHandler(postulanteController.update.bind(postulanteController))
);

/**
 * @route   DELETE /api/postulantes/:id
 * @desc    Eliminar postulante
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.delete('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(postulanteController.delete.bind(postulanteController))
);

module.exports = router;