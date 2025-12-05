/**
 * Middleware para manejo centralizado de errores
 */

// Clase personalizada para errores de API
class APIError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = 'APIError';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    
    // Log del error
    console.error(`Error: ${error.message}`);
    console.error(err.stack);
    
    // Error de PostgreSQL - Violación de constraint único
    if (err.code === '23505') {
        const message = 'Recurso duplicado. Ya existe un registro con estos datos.';
        error = new APIError(message, 409);
    }
    
    // Error de PostgreSQL - Violación de foreign key
    if (err.code === '23503') {
        const message = 'Referencia inválida. El registro referenciado no existe.';
        error = new APIError(message, 400);
    }
    
    // Error de PostgreSQL - Violación de check constraint
    if (err.code === '23514') {
        const message = 'Datos inválidos. Los valores no cumplen las restricciones.';
        error = new APIError(message, 400);
    }
    
    // Error de PostgreSQL - Sintaxis SQL
    if (err.code === '42601' || err.code === '42P01') {
        const message = 'Error interno del servidor.';
        error = new APIError(message, 500);
    }
    
    // Error de validación de Joi
    if (err.isJoi) {
        const message = err.details.map(detail => detail.message).join(', ');
        error = new APIError(message, 400);
    }
    
    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token inválido.';
        error = new APIError(message, 401);
    }
    
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expirado.';
        error = new APIError(message, 401);
    }
    
    // Error de Multer (subida de archivos)
    if (err.code === 'MULTER_ERROR') {
        const message = 'Error en la subida de archivo.';
        error = new APIError(message, 400);
    }
    
    // Respuesta de error estándar
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            error: err
        })
    });
};

// Middleware para capturar errores 404
const notFound = (req, res, next) => {
    const message = `Ruta no encontrada: ${req.originalUrl}`;
    const error = new APIError(message, 404);
    next(error);
};

// Middleware para errores asíncronos
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    APIError,
    errorHandler,
    notFound,
    asyncHandler
};