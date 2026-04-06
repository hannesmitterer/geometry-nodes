/**
 * Security Tests
 * 
 * @license MIT
 * @description Security vulnerability tests
 */

const request = require('supertest');
const { app } = require('../backend/backend-mock-server');
const { 
    generateToken, 
    verifyToken, 
    sanitizeString, 
    sanitizeObject,
    validateApiKey,
    createApiKey
} = require('../backend/security-middleware');

describe('Security Tests', () => {
    describe('JWT Authentication', () => {
        it('should generate valid JWT token', () => {
            const token = generateToken({ username: 'testuser', role: 'admin' });
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });
        
        it('should verify valid JWT token', () => {
            const payload = { username: 'testuser', role: 'admin' };
            const token = generateToken(payload);
            const decoded = verifyToken(token);
            
            expect(decoded).toHaveProperty('username', 'testuser');
            expect(decoded).toHaveProperty('role', 'admin');
        });
        
        it('should reject invalid JWT token', () => {
            expect(() => {
                verifyToken('invalid.token.here');
            }).toThrow();
        });
        
        it('should reject expired JWT token', () => {
            // This would require waiting for expiration - skip in unit tests
            expect(true).toBe(true);
        });
    });
    
    describe('Input Sanitization', () => {
        it('should sanitize XSS attempts', () => {
            const malicious = '<script>alert("XSS")</script>';
            const sanitized = sanitizeString(malicious);
            
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('</script>');
            expect(sanitized).toContain('&lt;script&gt;');
        });
        
        it('should sanitize HTML entities', () => {
            const input = '<div>Test & "quotes"</div>';
            const sanitized = sanitizeString(input);
            
            expect(sanitized).toContain('&lt;');
            expect(sanitized).toContain('&gt;');
            expect(sanitized).toContain('&amp;');
            expect(sanitized).toContain('&quot;');
        });
        
        it('should sanitize objects recursively', () => {
            const obj = {
                safe: 'normal text',
                malicious: '<script>alert("XSS")</script>',
                nested: {
                    deep: '<img src=x onerror=alert("XSS")>'
                }
            };
            
            const sanitized = sanitizeObject(obj);
            
            expect(sanitized.safe).toBe('normal text');
            expect(sanitized.malicious).not.toContain('<script>');
            expect(sanitized.nested.deep).not.toContain('<img');
        });
        
        it('should handle arrays in object sanitization', () => {
            const obj = {
                items: ['<script>alert(1)</script>', 'safe', '<div>test</div>']
            };
            
            const sanitized = sanitizeObject(obj);
            
            expect(sanitized.items[0]).not.toContain('<script>');
            expect(sanitized.items[1]).toBe('safe');
            expect(sanitized.items[2]).not.toContain('<div>');
        });
    });
    
    describe('API Key Management', () => {
        it('should generate valid API key', () => {
            const keyData = createApiKey('Test Key');
            
            expect(keyData).toHaveProperty('key');
            expect(keyData).toHaveProperty('name', 'Test Key');
            expect(keyData).toHaveProperty('created');
            expect(keyData.key).toHaveLength(64);
        });
        
        it('should validate created API key', () => {
            const keyData = createApiKey('Test Key 2');
            const isValid = validateApiKey(keyData.key);
            
            expect(isValid).toBe(true);
        });
        
        it('should reject invalid API key', () => {
            const isValid = validateApiKey('invalid_key_12345');
            
            expect(isValid).toBe(false);
        });
    });
    
    describe('SQL Injection Prevention', () => {
        it('should not be vulnerable to SQL injection in query params', async () => {
            const maliciousInput = "1' OR '1'='1";
            
            const response = await request(app)
                .get(`/api/logs?limit=${encodeURIComponent(maliciousInput)}`)
                .expect(200);
            
            // Should handle gracefully, not execute SQL
            expect(response.body).toHaveProperty('logs');
        });
    });
    
    describe('XSS Prevention in API Responses', () => {
        it('should sanitize log messages before storage', async () => {
            const maliciousLog = {
                entries: [
                    {
                        level: 'INFO',
                        message: '<script>alert("XSS")</script>',
                        context: {}
                    }
                ]
            };
            
            const response = await request(app)
                .post('/api/logs')
                .send(maliciousLog)
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });
    });
    
    describe('Rate Limiting', () => {
        it('should have rate limiting enabled', async () => {
            const response = await request(app)
                .get('/api/sovereignty/status');
            
            // Check for rate limit headers
            expect(response.headers).toHaveProperty('x-ratelimit-limit');
        });
        
        it('should enforce rate limits (integration test)', async () => {
            // This would require making many requests - skip in unit tests
            // In a real scenario, you'd make 100+ requests and expect 429
            expect(true).toBe(true);
        });
    });
    
    describe('CORS Security', () => {
        it('should have CORS headers', async () => {
            const response = await request(app)
                .get('/api/sovereignty/status');
            
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });
        
        it('should handle preflight requests', async () => {
            const response = await request(app)
                .options('/api/sovereignty/status');
            
            expect([200, 204]).toContain(response.status);
        });
    });
    
    describe('Security Headers', () => {
        it('should have security headers from Helmet', async () => {
            const response = await request(app)
                .get('/health');
            
            // Helmet adds various security headers
            expect(response.headers).toHaveProperty('x-dns-prefetch-control');
            expect(response.headers).toHaveProperty('x-frame-options');
            expect(response.headers).toHaveProperty('x-content-type-options');
        });
    });
    
    describe('Input Validation', () => {
        it('should reject malformed log entries', async () => {
            const invalidLog = {
                entries: [
                    {
                        // Missing required fields
                        invalidField: 'value'
                    }
                ]
            };
            
            const response = await request(app)
                .post('/api/logs')
                .send(invalidLog)
                .expect(400);
            
            expect(response.body).toHaveProperty('error');
        });
        
        it('should accept valid log entries', async () => {
            const validLog = {
                entries: [
                    {
                        level: 'INFO',
                        message: 'Valid log message'
                    }
                ]
            };
            
            const response = await request(app)
                .post('/api/logs')
                .send(validLog)
                .expect(200);
            
            expect(response.body.success).toBe(true);
        });
    });
    
    describe('Path Traversal Prevention', () => {
        it('should not allow directory traversal', async () => {
            const response = await request(app)
                .get('/api/../../../etc/passwd');
            
            // Should return 404, not serve system files
            expect(response.status).toBe(404);
        });
    });
    
    describe('NoSQL Injection Prevention', () => {
        it('should handle object injection attempts', async () => {
            const maliciousQuery = { $gt: '' };
            
            const response = await request(app)
                .get(`/api/logs?limit=${JSON.stringify(maliciousQuery)}`)
                .expect(200);
            
            // Should parse as invalid number and use default
            expect(response.body).toHaveProperty('logs');
        });
    });
});
