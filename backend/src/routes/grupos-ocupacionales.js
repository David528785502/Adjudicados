const express = require('express');
const router = express.Router();
const { GrupoOcupacionalController } = require('../controllers');
const { 
    validate, 
    validateQuery, 
    validateParams, 
    schemas, 
    commonSchemas, 
    asyncHandler 
} = require('../middleware');

// Instanciar controlador
const grupoOcupacionalController = new GrupoOcupacionalController();

/**
 * @route   GET /api/grupos-ocupacionales
 * @desc    Obtener todos los grupos ocupacionales
 * @access  Public
 */
router.get('/', 
    validateQuery(commonSchemas.pagination),
    asyncHandler(grupoOcupacionalController.getAll.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/stats
 * @desc    Obtener grupos ocupacionales con estadísticas
 * @access  Public
 */
router.get('/stats', 
    asyncHandler(grupoOcupacionalController.getGruposWithStats.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/available-plazas
 * @desc    Obtener grupos ocupacionales con plazas disponibles
 * @access  Public
 */
router.get('/available-plazas', 
    asyncHandler(grupoOcupacionalController.getGruposWithAvailablePlazas.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/resumen-estadistico
 * @desc    Obtener resumen estadístico por grupo ocupacional
 * @access  Public
 */
router.get('/resumen-estadistico', 
    asyncHandler(grupoOcupacionalController.getResumenEstadistico.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/search
 * @desc    Buscar grupos ocupacionales por nombre
 * @access  Public
 */
router.get('/search', 
    validateQuery(commonSchemas.search),
    asyncHandler(grupoOcupacionalController.searchGrupos.bind(grupoOcupacionalController))
);

/**
 * @route   POST /api/grupos-ocupacionales/validate
 * @desc    Validar nombre de grupo ocupacional
 * @access  Public
 */
router.post('/validate',
    validate(schemas.grupoOcupacional.create.keys({
        id: commonSchemas.id.extract('id').optional()
    })),
    asyncHandler(grupoOcupacionalController.validateGrupo.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/count
 * @desc    Contar grupos ocupacionales
 * @access  Public
 */
router.get('/count', 
    asyncHandler(grupoOcupacionalController.count.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/:id
 * @desc    Obtener grupo ocupacional por ID
 * @access  Public
 */
router.get('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(grupoOcupacionalController.getById.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/:id/stats
 * @desc    Obtener estadísticas de un grupo ocupacional específico
 * @access  Public
 */
router.get('/:id/stats', 
    validateParams(commonSchemas.id),
    asyncHandler(grupoOcupacionalController.getGrupoStats.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/:id/plazas
 * @desc    Obtener plazas de un grupo ocupacional
 * @access  Public
 */
router.get('/:id/plazas', 
    validateParams(commonSchemas.id),
    asyncHandler(grupoOcupacionalController.getPlazas.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/:id/postulantes
 * @desc    Obtener postulantes de un grupo ocupacional
 * @access  Public
 */
router.get('/:id/postulantes', 
    validateParams(commonSchemas.id),
    validateQuery({
        estado: schemas.postulante.search.extract('estado').optional()
    }),
    asyncHandler(grupoOcupacionalController.getPostulantes.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/:id/especialidades
 * @desc    Obtener especialidades disponibles para un grupo ocupacional
 * @access  Public
 */
router.get('/:id/especialidades', 
    validateParams(commonSchemas.id),
    asyncHandler(grupoOcupacionalController.getEspecialidades.bind(grupoOcupacionalController))
);

/**
 * @route   GET /api/grupos-ocupacionales/:id/next-orden-merito
 * @desc    Obtener siguiente orden de mérito disponible
 * @access  Public
 */
router.get('/:id/next-orden-merito', 
    validateParams(commonSchemas.id),
    asyncHandler(grupoOcupacionalController.getNextOrdenMerito.bind(grupoOcupacionalController))
);

/**
 * @route   POST /api/grupos-ocupacionales
 * @desc    Crear nuevo grupo ocupacional
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/', 
    validate(schemas.grupoOcupacional.create),
    asyncHandler(grupoOcupacionalController.create.bind(grupoOcupacionalController))
);

/**
 * @route   PUT /api/grupos-ocupacionales/:id
 * @desc    Actualizar grupo ocupacional
 * @access  Public (en producción debería requerir autenticación)
 */
router.put('/:id', 
    validateParams(commonSchemas.id),
    validate(schemas.grupoOcupacional.update),
    asyncHandler(grupoOcupacionalController.update.bind(grupoOcupacionalController))
);

/**
 * @route   DELETE /api/grupos-ocupacionales/:id
 * @desc    Eliminar grupo ocupacional
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.delete('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(grupoOcupacionalController.delete.bind(grupoOcupacionalController))
);

module.exports = router;