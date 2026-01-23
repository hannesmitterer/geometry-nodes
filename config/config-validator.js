/**
 * Configuration Validator
 * 
 * @license MIT
 * @description Validates configuration files against schema
 */

const Joi = require('joi');
const fs = require('fs');
const path = require('path');

/**
 * Configuration schema
 */
const configSchema = Joi.object({
    server: Joi.object({
        port: Joi.number().port().required(),
        wsPort: Joi.number().port().required(),
        host: Joi.string().hostname().required(),
        nodeEnv: Joi.string().valid('development', 'production', 'test').required()
    }).required(),
    
    security: Joi.object({
        jwt: Joi.object({
            secret: Joi.string().min(64).required().messages({
                'string.min': 'JWT secret must be at least 64 characters for security (HMAC-SHA256 best practice)'
            }),
            expiresIn: Joi.string().required()
        }).required(),
        cors: Joi.object({
            origin: Joi.alternatives().try(
                Joi.string(),
                Joi.array().items(Joi.string())
            ).required(),
            credentials: Joi.boolean().required()
        }).required(),
        rateLimit: Joi.object({
            windowMs: Joi.number().positive().required(),
            max: Joi.number().positive().required()
        }).required()
    }).required(),
    
    api: Joi.object({
        baseURL: Joi.string().uri().required(),
        wsURL: Joi.string().uri({ scheme: ['ws', 'wss'] }).required(),
        timeout: Joi.number().positive().required()
    }).required(),
    
    logging: Joi.object({
        level: Joi.string().valid('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL').required(),
        bufferSize: Joi.number().positive().required(),
        flushInterval: Joi.number().positive().required()
    }).required(),
    
    notifications: Joi.object({
        browserEnabled: Joi.boolean().required(),
        visualEnabled: Joi.boolean().required(),
        soundEnabled: Joi.boolean().required()
    }).required(),
    
    cache: Joi.object({
        enabled: Joi.boolean().required(),
        ttl: Joi.number().positive().required(),
        maxSize: Joi.number().positive().required()
    }).required(),
    
    websocket: Joi.object({
        reconnectAttempts: Joi.number().positive().required(),
        reconnectDelay: Joi.number().positive().required(),
        broadcastIntervals: Joi.object({
            sovereignty: Joi.number().positive().required(),
            wallet: Joi.number().positive().required(),
            nodes: Joi.number().positive().required(),
            logs: Joi.number().positive().required()
        }).required()
    }).required(),
    
    ipfs: Joi.object({
        gateway: Joi.string().uri().required(),
        pinning: Joi.object({
            enabled: Joi.boolean().required(),
            services: Joi.array().items(Joi.string()).required()
        }).required()
    }).required(),
    
    features: Joi.object({
        analytics: Joi.boolean().required(),
        i18n: Joi.boolean().required(),
        themes: Joi.boolean().required(),
        export: Joi.boolean().required()
    }).required()
});

/**
 * Validate configuration object
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateConfig(config) {
    return configSchema.validate(config, {
        abortEarly: false,
        allowUnknown: false
    });
}

/**
 * Load and validate configuration file
 * @param {string} configPath - Path to configuration file
 * @returns {Object} Validated configuration
 */
function loadAndValidateConfig(configPath) {
    try {
        // Read config file
        const configFile = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configFile);
        
        // Validate
        const { error, value } = validateConfig(config);
        
        if (error) {
            console.error('Configuration validation failed:');
            error.details.forEach(detail => {
                console.error(`  - ${detail.path.join('.')}: ${detail.message}`);
            });
            throw new Error('Invalid configuration');
        }
        
        console.log('✓ Configuration validated successfully');
        return value;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Configuration file not found: ${configPath}`);
        } else if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in configuration file: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Get configuration value by path
 * @param {Object} config - Configuration object
 * @param {string} path - Dot-separated path (e.g., 'server.port')
 * @returns {*} Configuration value
 */
function getConfigValue(config, path) {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    
    return value;
}

/**
 * Merge configurations (deep merge)
 * @param {Object} base - Base configuration
 * @param {Object} override - Override configuration
 * @returns {Object} Merged configuration
 */
function mergeConfigs(base, override) {
    const result = { ...base };
    
    for (const key in override) {
        if (override.hasOwnProperty(key)) {
            if (
                typeof override[key] === 'object' &&
                override[key] !== null &&
                !Array.isArray(override[key]) &&
                typeof result[key] === 'object' &&
                result[key] !== null &&
                !Array.isArray(result[key])
            ) {
                result[key] = mergeConfigs(result[key], override[key]);
            } else {
                result[key] = override[key];
            }
        }
    }
    
    return result;
}

// CLI usage
if (require.main === module) {
    const configPath = process.argv[2] || path.join(__dirname, 'config.example.json');
    
    try {
        const config = loadAndValidateConfig(configPath);
        console.log('\nConfiguration is valid!');
        console.log(JSON.stringify(config, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

module.exports = {
    configSchema,
    validateConfig,
    loadAndValidateConfig,
    getConfigValue,
    mergeConfigs
};
