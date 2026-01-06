/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limit: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later',
        retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Strict rate limiter for write operations
 * Limit: 20 requests per 15 minutes per IP
 */
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: 'Too many write requests, please slow down',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many write operations. Please wait before trying again.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Aggressive rate limiter for authentication endpoints
 * Limit: 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many authentication attempts',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful auth
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many authentication attempts',
            message: 'Your IP has been temporarily blocked due to too many failed attempts.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Lenient rate limiter for read operations
 * Limit: 300 requests per 15 minutes per IP
 */
const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        error: 'Too many read requests',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please reduce your request frequency.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * WebSocket connection rate limiter
 * Custom implementation for WebSocket upgrade requests
 */
function wsConnectionLimiter() {
    const connections = new Map();
    const MAX_CONNECTIONS_PER_IP = 5;
    const CLEANUP_INTERVAL = 60000; // 1 minute
    
    // Periodic cleanup
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of connections.entries()) {
            if (now - data.lastCheck > CLEANUP_INTERVAL) {
                connections.delete(ip);
            }
        }
    }, CLEANUP_INTERVAL);
    
    return (req, socket, head) => {
        const ip = req.socket.remoteAddress;
        const now = Date.now();
        
        if (!connections.has(ip)) {
            connections.set(ip, { count: 1, lastCheck: now });
            return true;
        }
        
        const data = connections.get(ip);
        
        // Reset if window expired
        if (now - data.lastCheck > CLEANUP_INTERVAL) {
            connections.set(ip, { count: 1, lastCheck: now });
            return true;
        }
        
        // Check limit
        if (data.count >= MAX_CONNECTIONS_PER_IP) {
            socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
            socket.destroy();
            return false;
        }
        
        data.count++;
        return true;
    };
}

module.exports = {
    apiLimiter,
    strictLimiter,
    authLimiter,
    readLimiter,
    wsConnectionLimiter
};
