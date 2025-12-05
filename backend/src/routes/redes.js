const express = require('express');
const router = express.Router();
const { RedController } = require('../controllers');
const { 
    validate, 
    validateQuery, 
    validateParams, 
    schemas, 
    commonSchemas, 
    asyncHandler 
} = require('../middleware');

// Instanciar controlador
const redController = new RedController();

/**
 * @route   GET /api/redes
 * @desc    Obtener todas las redes
 * @access  Public
 */
router.get('/', 
    validateQuery(commonSchemas.pagination),
    asyncHandler(redController.getAll.bind(redController))
);

/**
 * @route   GET /api/redes/stats
 * @desc    Obtener redes con estadísticas
 * @access  Public
 */
router.get('/stats', 
    asyncHandler(redController.getRedesWithStats.bind(redController))
);

/**
 * @route   GET /api/redes/with-ipress
 * @desc    Obtener redes con sus IPRESS
 * @access  Public
 */
router.get('/with-ipress', 
    asyncHandler(redController.getRedesWithIpress.bind(redController))
);

/**
 * @route   GET /api/redes/search
 * @desc    Buscar redes por nombre
 * @access  Public
 */
router.get('/search', 
    validateQuery(commonSchemas.search),
    asyncHandler(redController.searchRedes.bind(redController))
);

/**
 * @route   POST /api/redes/validate
 * @desc    Validar nombre de red
 * @access  Public
 */
router.post('/validate',
    validate(schemas.red.create.keys({
        id: commonSchemas.id.extract('id').optional()
    })),
    asyncHandler(redController.validateNombre.bind(redController))
);

/**
 * @route   GET /api/redes/count
 * @desc    Contar redes
 * @access  Public
 */
router.get('/count', 
    asyncHandler(redController.count.bind(redController))
);

/**
 * @route   GET /api/redes/:id
 * @desc    Obtener red por ID
 * @access  Public
 */
router.get('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(redController.getById.bind(redController))
);

/**
 * @route   GET /api/redes/:id/stats
 * @desc    Obtener estadísticas detalladas de una red
 * @access  Public
 */
router.get('/:id/stats', 
    validateParams(commonSchemas.id),
    asyncHandler(redController.getRedStats.bind(redController))
);

/**
 * @route   POST /api/redes
 * @desc    Crear nueva red
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/', 
    validate(schemas.red.create),
    asyncHandler(redController.create.bind(redController))
);

/**
 * @route   PUT /api/redes/:id
 * @desc    Actualizar red
 * @access  Public (en producción debería requerir autenticación)
 */
router.put('/:id', 
    validateParams(commonSchemas.id),
    validate(schemas.red.update),
    asyncHandler(redController.update.bind(redController))
);

/**
 * @route   DELETE /api/redes/:id
 * @desc    Eliminar red
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.delete('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(redController.delete.bind(redController))
);

module.exports = router;