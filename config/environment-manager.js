/**
 * Environment Manager
 * 
 * @license MIT
 * @description Manages configuration across multiple environments
 */

const path = require('path');
const fs = require('fs');
const { loadAndValidateConfig, mergeConfigs } = require('./config-validator');

/**
 * Environment types
 */
const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
    TEST: 'test'
};

/**
 * Environment Manager Class
 */
class EnvironmentManager {
    constructor() {
        this.currentEnv = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;
        this.config = null;
        this.configDir = __dirname;
    }
    
    /**
     * Get current environment
     * @returns {string} Current environment
     */
    getCurrentEnvironment() {
        return this.currentEnv;
    }
    
    /**
     * Check if environment is production
     * @returns {boolean} True if production
     */
    isProduction() {
        return this.currentEnv === ENVIRONMENTS.PRODUCTION;
    }
    
    /**
     * Check if environment is development
     * @returns {boolean} True if development
     */
    isDevelopment() {
        return this.currentEnv === ENVIRONMENTS.DEVELOPMENT;
    }
    
    /**
     * Check if environment is test
     * @returns {boolean} True if test
     */
    isTest() {
        return this.currentEnv === ENVIRONMENTS.TEST;
    }
    
    /**
     * Load configuration for current environment
     * @returns {Object} Configuration object
     */
    loadConfig() {
        // Load base configuration
        const basePath = path.join(this.configDir, 'config.example.json');
        let baseConfig;
        
        try {
            baseConfig = loadAndValidateConfig(basePath);
        } catch (error) {
            console.error('Failed to load base configuration:', error.message);
            throw error;
        }
        
        // Load environment-specific configuration if exists
        const envPath = path.join(this.configDir, `config.${this.currentEnv}.json`);
        let envConfig = {};
        
        if (fs.existsSync(envPath)) {
            try {
                const envFile = fs.readFileSync(envPath, 'utf8');
                envConfig = JSON.parse(envFile);
                console.log(`✓ Loaded ${this.currentEnv} configuration`);
            } catch (error) {
                console.warn(`Warning: Failed to load ${this.currentEnv} config:`, error.message);
            }
        }
        
        // Merge configurations
        this.config = mergeConfigs(baseConfig, envConfig);
        
        // Override with environment variables
        this.applyEnvironmentVariables();
        
        return this.config;
    }
    
    /**
     * Apply environment variables to configuration
     */
    applyEnvironmentVariables() {
        if (!this.config) return;
        
        // Server
        if (process.env.PORT) {
            this.config.server.port = parseInt(process.env.PORT);
        }
        if (process.env.WS_PORT) {
            this.config.server.wsPort = parseInt(process.env.WS_PORT);
        }
        if (process.env.HOST) {
            this.config.server.host = process.env.HOST;
        }
        
        // Security
        if (process.env.JWT_SECRET) {
            this.config.security.jwt.secret = process.env.JWT_SECRET;
        }
        if (process.env.JWT_EXPIRES_IN) {
            this.config.security.jwt.expiresIn = process.env.JWT_EXPIRES_IN;
        }
        if (process.env.CORS_ORIGIN) {
            this.config.security.cors.origin = process.env.CORS_ORIGIN;
        }
        
        // API
        if (process.env.API_BASE_URL) {
            this.config.api.baseURL = process.env.API_BASE_URL;
        }
        if (process.env.API_WS_URL) {
            this.config.api.wsURL = process.env.API_WS_URL;
        }
        
        console.log('✓ Applied environment variables');
    }
    
    /**
     * Get configuration value
     * @param {string} key - Configuration key (dot-separated path)
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Configuration value
     */
    get(key, defaultValue = undefined) {
        if (!this.config) {
            this.loadConfig();
        }
        
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * Get all configuration
     * @returns {Object} Full configuration
     */
    getAll() {
        if (!this.config) {
            this.loadConfig();
        }
        return this.config;
    }
    
    /**
     * Reload configuration
     */
    reload() {
        this.config = null;
        return this.loadConfig();
    }
    
    /**
     * Export configuration to file
     * @param {string} outputPath - Output file path
     */
    exportConfig(outputPath) {
        if (!this.config) {
            this.loadConfig();
        }
        
        const output = JSON.stringify(this.config, null, 2);
        fs.writeFileSync(outputPath, output, 'utf8');
        console.log(`✓ Configuration exported to ${outputPath}`);
    }
    
    /**
     * Validate current configuration
     * @returns {boolean} True if valid
     */
    validate() {
        if (!this.config) {
            this.loadConfig();
        }
        
        const { validateConfig } = require('./config-validator');
        const { error } = validateConfig(this.config);
        
        if (error) {
            console.error('Configuration validation failed:');
            error.details.forEach(detail => {
                console.error(`  - ${detail.path.join('.')}: ${detail.message}`);
            });
            return false;
        }
        
        console.log('✓ Configuration is valid');
        return true;
    }
}

// Singleton instance
let instance = null;

/**
 * Get environment manager instance
 * @returns {EnvironmentManager} Environment manager instance
 */
function getEnvironmentManager() {
    if (!instance) {
        instance = new EnvironmentManager();
    }
    return instance;
}

// CLI usage
if (require.main === module) {
    const manager = getEnvironmentManager();
    
    console.log('Environment Manager');
    console.log('='.repeat(50));
    console.log(`Current Environment: ${manager.getCurrentEnvironment()}`);
    console.log(`Is Production: ${manager.isProduction()}`);
    console.log(`Is Development: ${manager.isDevelopment()}`);
    console.log('='.repeat(50));
    
    try {
        const config = manager.loadConfig();
        console.log('\nConfiguration loaded successfully!');
        console.log(JSON.stringify(config, null, 2));
        
        // Validate
        manager.validate();
        
        // Export if requested
        if (process.argv.includes('--export')) {
            const exportPath = path.join(__dirname, `config.${manager.currentEnv}.export.json`);
            manager.exportConfig(exportPath);
        }
    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

module.exports = {
    ENVIRONMENTS,
    EnvironmentManager,
    getEnvironmentManager
};
