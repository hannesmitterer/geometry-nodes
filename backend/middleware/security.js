/**
 * Security Middleware
 * Provides Helmet.js security headers and basic security configuration
 */

const helmet = require('helmet');

/**
 * Get Helmet security middleware with custom configuration
 */
function getSecurityMiddleware() {
    return helmet({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for frontend
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'ws:', 'wss:'],
                fontSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        // Strict-Transport-Security
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        // X-Frame-Options
        frameguard: {
            action: 'deny'
        },
        // X-Content-Type-Options
        noSniff: true,
        // X-XSS-Protection (legacy but still useful)
        xssFilter: true,
        // Hide X-Powered-By header
        hidePoweredBy: true,
        // Referrer-Policy
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin'
        }
    });
}

/**
 * CORS configuration for development and production
 */
function getCorsOptions() {
    return {
        origin: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            '*', // Allow all origins in development
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400 // 24 hours
    };
}

/**
 * Input sanitization middleware
 * Sanitizes request body, query, and params
 */
function sanitizeInput(req, res, next) {
    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].trim();
            }
        });
    }
    
    // Sanitize body
    if (req.body) {
        sanitizeObject(req.body);
    }
    
    next();
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    });
}

/**
 * Request validation middleware
 * Validates common request properties
 */
function validateRequest(req, res, next) {
    // Check for excessively large payloads
    const contentLength = parseInt(req.get('content-length') || '0');
    const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (contentLength > MAX_PAYLOAD_SIZE) {
        return res.status(413).json({
            error: 'Payload too large',
            maxSize: MAX_PAYLOAD_SIZE
        });
    }
    
    next();
}

/**
 * Security headers for API responses
 */
function securityHeaders(req, res, next) {
    // Prevent caching of sensitive data
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    
    next();
}

module.exports = {
    getSecurityMiddleware,
    getCorsOptions,
    sanitizeInput,
    validateRequest,
    securityHeaders
};
