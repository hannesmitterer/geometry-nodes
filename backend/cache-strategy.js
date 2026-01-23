/**
 * Cache Strategy for Resonance School Live Terminal
 * 
 * @license MIT
 * @description Advanced caching with in-memory storage and optional Redis support
 */

/**
 * Simple in-memory cache
 */
class MemoryCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTTL = options.ttl || 300000; // 5 minutes default
        this.maxSize = options.maxSize || 1000;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }
    
    /**
     * Set cache entry
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, value, ttl = this.defaultTTL) {
        // Enforce max size
        if (this.cache.size >= this.maxSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        const entry = {
            value,
            expires: Date.now() + ttl
        };
        
        this.cache.set(key, entry);
        this.stats.sets++;
        
        return true;
    }
    
    /**
     * Get cache entry
     * @param {string} key - Cache key
     * @returns {*} Cached value or null
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        
        // Check if expired
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        return entry.value;
    }
    
    /**
     * Delete cache entry
     * @param {string} key - Cache key
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
        }
        return deleted;
    }
    
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        return true;
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
        };
    }
    
    /**
     * Clean expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expires) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        return cleaned;
    }
}

/**
 * Create cache instance
 */
const cache = new MemoryCache({
    ttl: 300000, // 5 minutes
    maxSize: 1000
});

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 */
function cacheMiddleware(ttl = 300) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        
        const key = `cache:${req.originalUrl || req.url}`;
        const cached = cache.get(key);
        
        if (cached) {
            // Cache hit
            res.setHeader('X-Cache', 'HIT');
            return res.json(cached);
        }
        
        // Cache miss - intercept json method
        res.setHeader('X-Cache', 'MISS');
        const originalJson = res.json.bind(res);
        
        res.json = (data) => {
            cache.set(key, data, ttl * 1000);
            return originalJson(data);
        };
        
        next();
    };
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
function invalidateCache(pattern) {
    let invalidated = 0;
    
    for (const key of cache.cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
            invalidated++;
        }
    }
    
    return invalidated;
}

// Periodic cleanup every 5 minutes
setInterval(() => {
    const cleaned = cache.cleanup();
    if (cleaned > 0) {
        console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
}, 300000);

module.exports = {
    cache,
    MemoryCache,
    cacheMiddleware,
    invalidateCache
};
