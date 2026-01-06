/**
 * Input Validation Middleware
 * Validates request data using Joi schemas
 */

const Joi = require('joi');

/**
 * Log entry schema
 */
const logEntrySchema = Joi.object({
    level: Joi.string()
        .valid('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')
        .required(),
    message: Joi.string()
        .min(1)
        .max(1000)
        .required(),
    timestamp: Joi.number()
        .integer()
        .positive()
        .optional(),
    nodeId: Joi.string()
        .max(100)
        .optional(),
    sessionId: Joi.string()
        .max(100)
        .optional(),
    context: Joi.object()
        .optional()
});

/**
 * Log submission schema
 */
const logSubmissionSchema = Joi.object({
    entries: Joi.array()
        .items(logEntrySchema)
        .min(1)
        .max(100)
        .required()
});

/**
 * Pagination query schema
 */
const paginationSchema = Joi.object({
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(50),
    offset: Joi.number()
        .integer()
        .min(0)
        .optional()
        .default(0)
});

/**
 * Login credentials schema
 */
const loginSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
    password: Joi.string()
        .min(8)
        .max(100)
        .required()
});

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi schema
 * @param {String} source - 'body', 'query', or 'params'
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const data = req[source];
        
        const { error, value } = schema.validate(data, {
            abortEarly: false, // Return all errors
            stripUnknown: true, // Remove unknown fields
            convert: true // Convert types
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));
            
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Request validation failed',
                details: errors
            });
        }
        
        // Replace request data with validated and sanitized data
        req[source] = value;
        next();
    };
}

/**
 * Validate log submission
 */
const validateLogSubmission = validate(logSubmissionSchema, 'body');

/**
 * Validate pagination parameters
 */
const validatePagination = validate(paginationSchema, 'query');

/**
 * Validate login credentials
 */
const validateLogin = validate(loginSchema, 'body');

/**
 * Custom validation for specific endpoints
 */
const customValidators = {
    /**
     * Validate sovereignty update
     */
    validateSovereigntyUpdate: (req, res, next) => {
        const schema = Joi.object({
            masterHash: Joi.string().optional(),
            overrideLevel: Joi.string().valid('ZERO', 'ONE', 'TWO', 'THREE').optional(),
            overrideActive: Joi.boolean().optional(),
            consensusOmnibus: Joi.number().min(0).max(100).optional(),
            coherenceInternal: Joi.number().min(0).max(1).optional()
        });
        
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }
        
        req.body = value;
        next();
    },
    
    /**
     * Validate wallet update
     */
    validateWalletUpdate: (req, res, next) => {
        const schema = Joi.object({
            balance: Joi.number().min(0).optional(),
            currency: Joi.string().length(3).uppercase().optional(),
            walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
        });
        
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }
        
        req.body = value;
        next();
    },
    
    /**
     * Validate node status update
     */
    validateNodeUpdate: (req, res, next) => {
        const nodeSchema = Joi.object({
            id: Joi.string().required(),
            name: Joi.string().optional(),
            status: Joi.string().valid('online', 'offline', 'degraded').optional(),
            ping: Joi.number().min(0).optional(),
            load: Joi.number().min(0).max(100).optional(),
            sync: Joi.number().min(0).max(100).optional(),
            uptime: Joi.number().min(0).max(100).optional(),
            connections: Joi.number().min(0).optional()
        });
        
        const schema = Joi.object({
            nodes: Joi.array().items(nodeSchema).min(1).required()
        });
        
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }
        
        req.body = value;
        next();
    }
};

module.exports = {
    validate,
    validateLogSubmission,
    validatePagination,
    validateLogin,
    ...customValidators,
    // Export schemas for testing
    schemas: {
        logEntrySchema,
        logSubmissionSchema,
        paginationSchema,
        loginSchema
    }
};
