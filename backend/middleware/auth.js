/**
 * Authentication Middleware
 * Provides JWT-based authentication
 */

const jwt = require('jsonwebtoken');

// Secret key for JWT (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'resonance-school-dev-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {String} expiresIn - Token expiration (default: 24h)
 * @returns {String} JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRY) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn,
        issuer: 'resonance-school',
        algorithm: 'HS256'
    });
}

/**
 * Verify JWT token middleware
 * Validates token from Authorization header
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No authorization token provided'
        });
    }
    
    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authorization header format. Use: Bearer <token>'
        });
    }
    
    const token = parts[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'resonance-school',
            algorithms: ['HS256']
        });
        
        // Attach decoded token to request
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token has expired',
                expiredAt: error.expiredAt
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Token verification failed'
        });
    }
}

/**
 * Optional authentication middleware
 * Verifies token if present, but allows request to continue if not
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return next();
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next();
    }
    
    const token = parts[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'resonance-school',
            algorithms: ['HS256']
        });
        req.user = decoded;
    } catch (error) {
        // Silently fail for optional auth
    }
    
    next();
}

/**
 * Role-based access control middleware
 * Requires specific role in token payload
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }
        
        if (!req.user.role || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }
        
        next();
    };
}

/**
 * Refresh token
 * Generates new token with extended expiry
 */
function refreshToken(req, res) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No authorization token provided'
        });
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authorization header format'
        });
    }
    
    const token = parts[1];
    
    try {
        // Verify old token (ignore expiration for refresh)
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'resonance-school',
            algorithms: ['HS256'],
            ignoreExpiration: true
        });
        
        // Remove JWT metadata
        delete decoded.iat;
        delete decoded.exp;
        delete decoded.iss;
        
        // Generate new token
        const newToken = generateToken(decoded);
        
        res.json({
            success: true,
            token: newToken,
            expiresIn: JWT_EXPIRY
        });
    } catch (error) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });
    }
}

/**
 * Demo login endpoint (for testing)
 * In production, this would validate credentials against a database
 */
function demoLogin(req, res) {
    const { username, password } = req.body;
    
    // Demo credentials (DO NOT use in production)
    if (username === 'admin' && password === 'resonance2025') {
        const token = generateToken({
            userId: '1',
            username: 'admin',
            role: 'admin',
            permissions: ['read', 'write', 'delete']
        });
        
        return res.json({
            success: true,
            token,
            expiresIn: JWT_EXPIRY,
            user: {
                userId: '1',
                username: 'admin',
                role: 'admin'
            }
        });
    }
    
    if (username === 'viewer' && password === 'viewer2025') {
        const token = generateToken({
            userId: '2',
            username: 'viewer',
            role: 'viewer',
            permissions: ['read']
        });
        
        return res.json({
            success: true,
            token,
            expiresIn: JWT_EXPIRY,
            user: {
                userId: '2',
                username: 'viewer',
                role: 'viewer'
            }
        });
    }
    
    return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
    });
}

module.exports = {
    generateToken,
    verifyToken,
    optionalAuth,
    requireRole,
    refreshToken,
    demoLogin,
    JWT_SECRET
};
