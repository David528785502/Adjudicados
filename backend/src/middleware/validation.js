const Joi = require('joi');
const { APIError } = require('./errorHandler');

/**
 * Middleware de validación usando Joi
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false, // Mostrar todos los errores, no solo el primero
            stripUnknown: true // Remover campos no definidos en el schema
        });
        
        if (error) {
            const message = error.details
                .map(detail => detail.message.replace(/"/g, ''))
                .join(', ');
            return next(new APIError(message, 400));
        }
        
        next();
    };
};

/**
 * Validación de parámetros de query
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const message = error.details
                .map(detail => detail.message.replace(/"/g, ''))
                .join(', ');
            return next(new APIError(message, 400));
        }
        
        next();
    };
};

/**
 * Validación de parámetros de URL
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.params);
        
        if (error) {
            const message = error.details
                .map(detail => detail.message.replace(/"/g, ''))
                .join(', ');
            return next(new APIError(message, 400));
        }
        
        next();
    };
};

// Schemas de validación comunes
const commonSchemas = {
    // ID numérico positivo
    id: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    
    // Paginación
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }),
    
    // Búsqueda
    search: Joi.object({
        q: Joi.string().min(2).max(100).required()
    }),
    
    // Fecha
    dateRange: Joi.object({
        fechaInicio: Joi.date().iso(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio'))
    })
};

// Schemas específicos por entidad
const schemas = {
    // Red
    red: {
        create: Joi.object({
            nombre: Joi.string().min(2).max(100).required().trim()
        }),
        update: Joi.object({
            nombre: Joi.string().min(2).max(100).trim()
        })
    },
    
    // IPRESS
    ipress: {
        create: Joi.object({
            red_id: Joi.number().integer().positive().required(),
            nombre: Joi.string().min(2).max(200).required().trim()
        }),
        update: Joi.object({
            red_id: Joi.number().integer().positive(),
            nombre: Joi.string().min(2).max(200).trim()
        }),
        search: Joi.object({
            q: Joi.string().min(2).max(100).required(),
            redId: Joi.number().integer().positive()
        })
    },
    
    // Grupo Ocupacional
    grupoOcupacional: {
        create: Joi.object({
            nombre: Joi.string().min(2).max(100).required().trim()
        }),
        update: Joi.object({
            nombre: Joi.string().min(2).max(100).trim()
        })
    },
    
    // Plaza
    plaza: {
        create: Joi.object({
            ipress_id: Joi.number().integer().positive().required(),
            grupo_ocupacional_id: Joi.number().integer().positive().required(),
            especialidad: Joi.string().max(200).allow(null, '').trim(),
            total: Joi.number().integer().min(0).required()
        }),
        update: Joi.object({
            ipress_id: Joi.number().integer().positive(),
            grupo_ocupacional_id: Joi.number().integer().positive(),
            especialidad: Joi.string().max(200).allow(null, '').trim(),
            total: Joi.number().integer().min(0)
        }),
        search: Joi.object({
            redId: Joi.number().integer().positive(),
            ipressId: Joi.number().integer().positive(),
            grupoOcupacionalId: Joi.number().integer().positive(),
            especialidad: Joi.string().max(200),
            soloDisponibles: Joi.boolean()
        })
    },
    
    // Postulante
    postulante: {
        create: Joi.object({
            orden_merito: Joi.number().integer().positive().required(),
            apellidos_nombres: Joi.string().min(3).max(200).required().trim(),
            dni: Joi.string().pattern(/^\d{8}$/).allow(null, '').messages({
                'string.pattern.base': 'DNI debe tener exactamente 8 dígitos'
            }),
            fecha_inicio_contrato: Joi.date().iso().allow(null),
            tiempo_servicio_anios: Joi.number().integer().min(0).default(0),
            tiempo_servicio_meses: Joi.number().integer().min(0).max(11).default(0),
            tiempo_servicio_dias: Joi.number().integer().min(0).max(31).default(0),
            horas_capacitacion: Joi.number().integer().min(0).default(0),
            grupo_ocupacional_id: Joi.number().integer().positive().required()
        }),
        update: Joi.object({
            orden_merito: Joi.number().integer().positive(),
            apellidos_nombres: Joi.string().min(3).max(200).trim(),
            dni: Joi.string().pattern(/^\d{8}$/).allow(null, '').messages({
                'string.pattern.base': 'DNI debe tener exactamente 8 dígitos'
            }),
            fecha_inicio_contrato: Joi.date().iso().allow(null),
            tiempo_servicio_anios: Joi.number().integer().min(0),
            tiempo_servicio_meses: Joi.number().integer().min(0).max(11),
            tiempo_servicio_dias: Joi.number().integer().min(0).max(31),
            horas_capacitacion: Joi.number().integer().min(0),
            grupo_ocupacional_id: Joi.number().integer().positive()
        }),
        search: Joi.object({
            grupoOcupacionalId: Joi.number().integer().positive(),
            estado: Joi.string().valid('pendiente', 'adjudicado', 'desistido', 'renuncio'),
            nombre: Joi.string().min(2).max(100),
            dni: Joi.string().pattern(/^\d{8}$/),
            ordenMeritoDesde: Joi.number().integer().positive(),
            ordenMeritoHasta: Joi.number().integer().positive()
        })
    },
    
    // Adjudicación
    adjudicacion: {
        crear: Joi.object({
            postulanteId: Joi.number().integer().positive().required(),
            plazaId: Joi.number().integer().positive().required(),
            observaciones: Joi.string().max(500).allow(null, '').trim()
        }),
        desistir: Joi.object({
            observaciones: Joi.string().max(500).allow(null, '').trim()
        }),
        renuncia: Joi.object({
            observaciones: Joi.string().max(500).allow(null, '').trim()
        }),
        revertir: Joi.object({
            observaciones: Joi.string().max(500).allow(null, '').trim()
        }),
        updateEstado: Joi.object({
            estado: Joi.string().valid('pendiente', 'adjudicado', 'desistido', 'renuncio').required(),
            observaciones: Joi.string().max(500).allow(null, '').trim()
        }),
        masiva: Joi.object({
            grupoOcupacionalId: Joi.number().integer().positive().required(),
            cantidad: Joi.number().integer().min(1).max(100).default(10)
        }),
        validar: Joi.object({
            postulanteId: Joi.number().integer().positive().required(),
            plazaId: Joi.number().integer().positive().required()
        }),
        filtros: Joi.object({
            estado: Joi.string().valid('pendiente', 'adjudicado', 'desistido', 'renuncio'),
            redId: Joi.number().integer().positive(),
            grupoOcupacionalId: Joi.number().integer().positive(),
            fechaDesde: Joi.date().iso(),
            fechaHasta: Joi.date().iso().min(Joi.ref('fechaDesde')),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(50)
        })
    }
};

module.exports = {
    validate,
    validateQuery,
    validateParams,
    commonSchemas,
    schemas
};