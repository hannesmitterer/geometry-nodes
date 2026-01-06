/**
 * Jest Configuration
 * 
 * @license MIT
 */

module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.spec.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'backend/**/*.js',
        'frontend/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    testTimeout: 30000,
    verbose: true
};
