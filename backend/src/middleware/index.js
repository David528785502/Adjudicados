// Exportar todos los middlewares
const { errorHandler, notFound, asyncHandler, APIError } = require('./errorHandler');
const { validate, validateQuery, validateParams, commonSchemas, schemas } = require('./validation');
const { 
    authenticate, 
    optionalAuthenticate, 
    authorize, 
    generateToken, 
    verifyToken, 
    logAccess, 
    userRateLimit, 
    validateApiKey 
} = require('./auth');
const {
    corsOptions,
    rateLimits,
    morganFormat,
    morganStream,
    helmetOptions,
    errorLogger,
    successLogger,
    customHeaders,
    validateContentType,
    sanitizeInput,
    requestTimeout,
    setupCors,
    setupMorgan,
    setupHelmet,
    setupCompression
} = require('./common');

module.exports = {
    // Error handling
    errorHandler,
    notFound,
    asyncHandler,
    APIError,
    
    // Validation
    validate,
    validateQuery,
    validateParams,
    commonSchemas,
    schemas,
    
    // Authentication & Authorization
    authenticate,
    optionalAuthenticate,
    authorize,
    generateToken,
    verifyToken,
    logAccess,
    userRateLimit,
    validateApiKey,
    
    // Common middleware
    corsOptions,
    rateLimits,
    morganFormat,
    morganStream,
    helmetOptions,
    errorLogger,
    successLogger,
    customHeaders,
    validateContentType,
    sanitizeInput,
    requestTimeout,
    
    // Setup functions
    setupCors,
    setupMorgan,
    setupHelmet,
    setupCompression
};