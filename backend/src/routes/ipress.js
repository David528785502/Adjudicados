const express = require('express');
const router = express.Router();
const { IpressController } = require('../controllers');
const { 
    validate, 
    validateQuery, 
    validateParams, 
    schemas, 
    commonSchemas, 
    asyncHandler 
} = require('../middleware');

// Instanciar controlador
const ipressController = new IpressController();

/**
 * @route   GET /api/ipress
 * @desc    Obtener todos los IPRESS
 * @access  Public
 */
router.get('/', 
    validateQuery(commonSchemas.pagination),
    asyncHandler(ipressController.getAll.bind(ipressController))
);

/**
 * @route   GET /api/ipress/with-red
 * @desc    Obtener IPRESS con información de red
 * @access  Public
 */
router.get('/with-red', 
    asyncHandler(ipressController.getIpressWithRed.bind(ipressController))
);

/**
 * @route   GET /api/ipress/stats
 * @desc    Obtener IPRESS con estadísticas
 * @access  Public
 */
router.get('/stats', 
    asyncHandler(ipressController.getIpressWithStats.bind(ipressController))
);

/**
 * @route   GET /api/ipress/available-plazas
 * @desc    Obtener IPRESS con plazas disponibles
 * @access  Public
 */
router.get('/available-plazas', 
    asyncHandler(ipressController.getIpressWithAvailablePlazas.bind(ipressController))
);

/**
 * @route   GET /api/ipress/search
 * @desc    Buscar IPRESS por nombre
 * @access  Public
 */
router.get('/search', 
    validateQuery(schemas.ipress.search),
    asyncHandler(ipressController.searchIpress.bind(ipressController))
);

/**
 * @route   GET /api/ipress/by-red/:redId
 * @desc    Obtener IPRESS por red
 * @access  Public
 */
router.get('/by-red/:redId', 
    validateParams({
        redId: commonSchemas.id.extract('id').required()
    }),
    asyncHandler(ipressController.getIpressByRed.bind(ipressController))
);

/**
 * @route   POST /api/ipress/validate
 * @desc    Validar datos de IPRESS
 * @access  Public
 */
router.post('/validate',
    validate(schemas.ipress.create.keys({
        id: commonSchemas.id.extract('id').optional()
    })),
    asyncHandler(ipressController.validateIpress.bind(ipressController))
);

/**
 * @route   GET /api/ipress/count
 * @desc    Contar IPRESS
 * @access  Public
 */
router.get('/count', 
    asyncHandler(ipressController.count.bind(ipressController))
);

/**
 * @route   GET /api/ipress/:id
 * @desc    Obtener IPRESS por ID
 * @access  Public
 */
router.get('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(ipressController.getById.bind(ipressController))
);

/**
 * @route   GET /api/ipress/:id/stats
 * @desc    Obtener estadísticas de un IPRESS específico
 * @access  Public
 */
router.get('/:id/stats', 
    validateParams(commonSchemas.id),
    asyncHandler(ipressController.getIpressStats.bind(ipressController))
);

/**
 * @route   GET /api/ipress/:id/plazas
 * @desc    Obtener plazas de un IPRESS
 * @access  Public
 */
router.get('/:id/plazas', 
    validateParams(commonSchemas.id),
    asyncHandler(ipressController.getPlazas.bind(ipressController))
);

/**
 * @route   POST /api/ipress
 * @desc    Crear nuevo IPRESS
 * @access  Public (en producción debería requerir autenticación)
 */
router.post('/', 
    validate(schemas.ipress.create),
    asyncHandler(ipressController.create.bind(ipressController))
);

/**
 * @route   PUT /api/ipress/:id
 * @desc    Actualizar IPRESS
 * @access  Public (en producción debería requerir autenticación)
 */
router.put('/:id', 
    validateParams(commonSchemas.id),
    validate(schemas.ipress.update),
    asyncHandler(ipressController.update.bind(ipressController))
);

/**
 * @route   DELETE /api/ipress/:id
 * @desc    Eliminar IPRESS
 * @access  Public (en producción debería requerir autenticación y permisos especiales)
 */
router.delete('/:id', 
    validateParams(commonSchemas.id),
    asyncHandler(ipressController.delete.bind(ipressController))
);

module.exports = router;