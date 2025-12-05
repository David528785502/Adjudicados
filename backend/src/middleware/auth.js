const jwt = require('jsonwebtoken');
const { APIError } = require('./errorHandler');

/**
 * Middleware de autenticación JWT
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return next(new APIError('Token de acceso requerido', 401));
        }
        
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;
        
        if (!token) {
            return next(new APIError('Token de acceso requerido', 401));
        }
        
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Agregar información del usuario a la request
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new APIError('Token inválido', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new APIError('Token expirado', 401));
        }
        next(error);
    }
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            req.user = null;
            return next();
        }
        
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;
        
        if (!token) {
            req.user = null;
            return next();
        }
        
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // En modo opcional, ignorar errores de token y continuar sin usuario
        req.user = null;
        next();
    }
};

/**
 * Middleware de autorización por roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new APIError('Acceso denegado. Autenticación requerida.', 401));
        }
        
        if (!roles.includes(req.user.role)) {
            return next(new APIError('Acceso denegado. Permisos insuficientes.', 403));
        }
        
        next();
    };
};

/**
 * Generar token JWT
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verificar token JWT
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Middleware para logging de acceso a rutas protegidas
 */
const logAccess = (req, res, next) => {
    if (req.user) {
        console.log(`🔐 Usuario autenticado: ${req.user.email || req.user.username} accedió a ${req.method} ${req.originalUrl}`);
    }
    next();
};

/**
 * Middleware de rate limiting por usuario
 */
const userRateLimit = () => {
    const userRequests = new Map();
    const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutos
    const MAX_REQUESTS = 1000; // máximo por ventana
    
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        
        const userId = req.user.id || req.user.email;
        const now = Date.now();
        
        if (!userRequests.has(userId)) {
            userRequests.set(userId, { count: 1, resetTime: now + WINDOW_SIZE });
            return next();
        }
        
        const userLimit = userRequests.get(userId);
        
        if (now > userLimit.resetTime) {
            // Resetear contador
            userRequests.set(userId, { count: 1, resetTime: now + WINDOW_SIZE });
            return next();
        }
        
        if (userLimit.count >= MAX_REQUESTS) {
            return next(new APIError('Demasiadas solicitudes. Intente más tarde.', 429));
        }
        
        userLimit.count++;
        next();
    };
};

/**
 * Middleware para validar API Key (alternativo al JWT)
 */
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return next(new APIError('API Key requerida', 401));
    }
    
    // Validar API Key (en un caso real, esto estaría en la base de datos)
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
        return next(new APIError('API Key inválida', 401));
    }
    
    // Agregar información básica del API Key a la request
    req.apiKey = {
        key: apiKey,
        type: 'api_key'
    };
    
    next();
};

module.exports = {
    authenticate,
    optionalAuthenticate,
    authorize,
    generateToken,
    verifyToken,
    logAccess,
    userRateLimit,
    validateApiKey
};