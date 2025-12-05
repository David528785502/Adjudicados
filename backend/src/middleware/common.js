const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

/**
 * Configuración de CORS
 */
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',')
            : ['http://localhost:3000', 'http://localhost:5173'];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'), false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key'
    ]
};

/**
 * Configuración de Rate Limiting
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = null) => {
    return rateLimit({
        windowMs,
        max,
        message: message || {
            success: false,
            message: 'Demasiadas solicitudes desde esta IP. Intente más tarde.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message: 'Demasiadas solicitudes desde esta IP. Intente más tarde.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Rate limits específicos
const rateLimits = {
    general: createRateLimit(
        parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    ),
    auth: createRateLimit(
        15 * 60 * 1000, // 15 minutos
        5, // 5 intentos
        'Demasiados intentos de autenticación. Intente más tarde.'
    ),
    api: createRateLimit(
        60 * 1000, // 1 minuto
        30, // 30 requests por minuto
        'Límite de API excedido. Intente más tarde.'
    )
};

/**
 * Configuración de Morgan (logging de requests)
 */
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

// Formato personalizado para desarrollo
const developmentFormat = ':method :url :status :res[content-length] - :response-time ms - :remote-addr';

// Stream personalizado para logging
const morganStream = {
    write: (message) => {
        console.log(message.trim());
    }
};

/**
 * Configuración de Helmet (seguridad)
 */
const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
};

/**
 * Middleware personalizado para logging de errores
 */
const errorLogger = (err, req, res, next) => {
    console.error(`
    ❌ ERROR: ${err.message}
    📍 URL: ${req.method} ${req.originalUrl}
    🖥️  IP: ${req.ip}
    👤 User: ${req.user?.email || req.user?.username || 'No autenticado'}
    📅 Timestamp: ${new Date().toISOString()}
    📋 Stack: ${err.stack}
    `);
    next(err);
};

/**
 * Middleware para logging de requests exitosos
 */
const successLogger = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        if (process.env.LOG_LEVEL === 'debug' && res.statusCode < 400) {
            console.log(`✅ SUCCESS: ${req.method} ${req.originalUrl} - ${res.statusCode}`);
        }
        originalSend.call(this, data);
    };
    
    next();
};

/**
 * Middleware para agregar headers personalizados
 */
const customHeaders = (req, res, next) => {
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Powered-By', 'EsSalud Adjudicacion API');
    next();
};

/**
 * Middleware para validar content-type en requests POST/PUT
 */
const validateContentType = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type debe ser application/json'
            });
        }
    }
    next();
};

/**
 * Middleware para sanitizar parámetros de entrada
 */
const sanitizeInput = (req, res, next) => {
    // Sanitizar query parameters
    for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
        }
    }
    
    // Sanitizar body (solo strings)
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        }
    }
    
    next();
};

/**
 * Middleware para timeout de requests
 */
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Request timeout'
                });
            }
        }, timeoutMs);
        
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        
        next();
    };
};

module.exports = {
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
    
    // Funciones de configuración
    setupCors: () => cors(corsOptions),
    setupMorgan: () => morgan(process.env.NODE_ENV === 'production' ? morganFormat : developmentFormat, { stream: morganStream }),
    setupHelmet: () => helmet(helmetOptions),
    setupCompression: () => compression()
};