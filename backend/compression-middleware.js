/**
 * Compression Middleware for Resonance School Live Terminal
 * 
 * @license MIT
 * @description Gzip/Brotli compression for HTTP responses
 */

const compression = require('compression');

/**
 * Standard compression middleware
 * Compresses all responses with gzip
 */
const standardCompression = compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        // Don't compress if the client doesn't support it
        if (req.headers['x-no-compression']) {
            return false;
        }
        
        // Use compression filter
        return compression.filter(req, res);
    }
});

/**
 * High compression middleware
 * Maximum compression for static assets
 */
const highCompression = compression({
    level: 9,
    threshold: 512,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        
        // Only compress specific content types
        const contentType = res.getHeader('Content-Type');
        if (!contentType) return false;
        
        const compressibleTypes = [
            'text/html',
            'text/css',
            'text/plain',
            'text/javascript',
            'application/javascript',
            'application/json',
            'application/xml',
            'image/svg+xml'
        ];
        
        return compressibleTypes.some(type => contentType.includes(type));
    }
});

/**
 * API compression middleware
 * Optimized for JSON responses
 */
const apiCompression = compression({
    level: 6,
    threshold: 256,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        
        const contentType = res.getHeader('Content-Type');
        return contentType && contentType.includes('application/json');
    }
});

module.exports = {
    standardCompression,
    highCompression,
    apiCompression
};
