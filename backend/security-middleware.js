/**
 * Security Middleware for Resonance School Live Terminal
 * 
 * @license MIT
 * @description Security layer with JWT authentication, rate limiting, and input validation
 */

const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');

// JWT Secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'resonance-school-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ==================== JWT Authentication ====================

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No token provided'
        });
    }
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            error: 'Forbidden',
            message: error.message
        });
    }
}

/**
 * Optional JWT Authentication Middleware
 * Attaches user if token is valid, but doesn't reject if missing
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
        } catch (error) {
            // Token invalid but we don't reject
            console.warn('[Auth] Invalid token provided:', error.message);
        }
    }
    
    next();
}

// ==================== Rate Limiting ====================

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        error: 'Too Many Requests',
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Standard rate limiter for API endpoints
 */
const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        error: 'Too Many Requests',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Relaxed rate limiter for public endpoints
 */
const publicRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per window
    message: {
        error: 'Too Many Requests',
        message: 'Request limit exceeded, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ==================== Input Validation ====================

/**
 * Joi schemas for input validation
 */
const schemas = {
    // Log entry validation
    logEntry: Joi.object({
        level: Joi.string().valid('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL').required(),
        message: Joi.string().min(1).max(1000).required(),
        context: Joi.object().optional(),
        timestamp: Joi.number().optional(),
        nodeId: Joi.string().optional(),
        sessionId: Joi.string().optional()
    }),
    
    // Log entries array validation
    logEntries: Joi.object({
        entries: Joi.array().items(Joi.object({
            level: Joi.string().valid('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL').required(),
            message: Joi.string().min(1).max(1000).required(),
            context: Joi.object().optional(),
            timestamp: Joi.number().optional(),
            nodeId: Joi.string().optional(),
            sessionId: Joi.string().optional()
        })).min(1).max(100).required()
    }),
    
    // Pagination validation
    pagination: Joi.object({
        limit: Joi.number().integer().min(1).max(100).optional(),
        offset: Joi.number().integer().min(0).optional()
    }),
    
    // User login validation
    login: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(8).max(128).required()
    }),
    
    // API key validation
    apiKey: Joi.object({
        key: Joi.string().length(64).required(),
        name: Joi.string().min(1).max(100).optional()
    })
};

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid input data',
                details: error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }))
            });
        }
        
        // Replace request data with validated and sanitized data
        req[source] = value;
        next();
    };
}

// ==================== Request Sanitization ====================

/**
 * Sanitize string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Recursively sanitize object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    
    return sanitized;
}

/**
 * Sanitization middleware
 * Sanitizes all request body data
 */
function sanitizeRequest(req, res, next) {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    next();
}

// ==================== API Key Management ====================

// In-memory API key storage (use database in production)
const apiKeys = new Map();

/**
 * Generate API key
 * @returns {string} 64-character API key
 */
function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 64; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

/**
 * Create API key
 * @param {string} name - Name for the API key
 * @returns {Object} API key details
 */
function createApiKey(name = 'Unnamed Key') {
    const key = generateApiKey();
    const keyData = {
        key,
        name,
        created: Date.now(),
        lastUsed: null,
        usageCount: 0
    };
    
    apiKeys.set(key, keyData);
    return keyData;
}

/**
 * Validate API key
 * @param {string} key - API key to validate
 * @returns {boolean} True if valid
 */
function validateApiKey(key) {
    const keyData = apiKeys.get(key);
    if (!keyData) {
        return false;
    }
    
    // Update usage statistics
    keyData.lastUsed = Date.now();
    keyData.usageCount++;
    
    return true;
}

/**
 * API Key Authentication Middleware
 * Validates API key from X-API-Key header
 */
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No API key provided'
        });
    }
    
    if (!validateApiKey(apiKey)) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid API key'
        });
    }
    
    next();
}

// ==================== Audit Logging ====================

/**
 * Audit log storage
 */
const auditLogs = [];

/**
 * Log audit event
 * @param {Object} event - Audit event details
 */
function logAudit(event) {
    const auditEntry = {
        timestamp: Date.now(),
        ...event
    };
    
    auditLogs.push(auditEntry);
    
    // Keep only last 1000 audit logs
    if (auditLogs.length > 1000) {
        auditLogs.shift();
    }
    
    console.log('[Audit]', JSON.stringify(auditEntry));
}

/**
 * Audit logging middleware for critical operations
 */
function auditLog(operation) {
    return (req, res, next) => {
        // Log before processing
        logAudit({
            operation,
            method: req.method,
            path: req.path,
            ip: req.ip,
            user: req.user ? req.user.username : 'anonymous',
            userAgent: req.headers['user-agent']
        });
        
        next();
    };
}

/**
 * Get audit logs
 * @param {number} limit - Number of logs to retrieve
 * @returns {Array} Audit logs
 */
function getAuditLogs(limit = 100) {
    return auditLogs.slice(-limit);
}

// ==================== Exports ====================

module.exports = {
    // JWT
    generateToken,
    verifyToken,
    authenticateToken,
    optionalAuth,
    
    // Rate limiting
    authRateLimiter,
    apiRateLimiter,
    publicRateLimiter,
    
    // Validation
    schemas,
    validate,
    
    // Sanitization
    sanitizeString,
    sanitizeObject,
    sanitizeRequest,
    
    // API Keys
    generateApiKey,
    createApiKey,
    validateApiKey,
    authenticateApiKey,
    
    // Audit
    logAudit,
    auditLog,
    getAuditLogs
};
