/**
 * API Endpoint Tests
 * 
 * @license MIT
 * @description Tests for REST API endpoints
 */

const request = require('supertest');
const { app } = require('../backend/backend-mock-server');

describe('API Endpoints', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('version');
        });
    });
    
    describe('GET /api/sovereignty/status', () => {
        it('should return sovereignty status', async () => {
            const response = await request(app)
                .get('/api/sovereignty/status')
                .expect(200);
            
            expect(response.body).toHaveProperty('masterHash');
            expect(response.body).toHaveProperty('overrideLevel');
            expect(response.body).toHaveProperty('overrideActive');
            expect(response.body).toHaveProperty('consensusOmnibus');
            expect(response.body).toHaveProperty('coherenceInternal');
            expect(response.body).toHaveProperty('timestamp');
        });
        
        it('should return correct master hash', async () => {
            const response = await request(app)
                .get('/api/sovereignty/status')
                .expect(200);
            
            expect(response.body.masterHash).toBe('RS-CORONATION-31122025-HM-PROV');
        });
        
        it('should return consensus of 100', async () => {
            const response = await request(app)
                .get('/api/sovereignty/status')
                .expect(200);
            
            expect(response.body.consensusOmnibus).toBe(100);
        });
    });
    
    describe('GET /api/wallet/balance', () => {
        it('should return wallet balance', async () => {
            const response = await request(app)
                .get('/api/wallet/balance')
                .expect(200);
            
            expect(response.body).toHaveProperty('balance');
            expect(response.body).toHaveProperty('currency');
            expect(response.body).toHaveProperty('walletAddress');
            expect(response.body).toHaveProperty('lastUpdate');
        });
        
        it('should return USD currency', async () => {
            const response = await request(app)
                .get('/api/wallet/balance')
                .expect(200);
            
            expect(response.body.currency).toBe('USD');
        });
        
        it('should return valid wallet address', async () => {
            const response = await request(app)
                .get('/api/wallet/balance')
                .expect(200);
            
            expect(response.body.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
    });
    
    describe('GET /api/nodes/status', () => {
        it('should return node status', async () => {
            const response = await request(app)
                .get('/api/nodes/status')
                .expect(200);
            
            expect(response.body).toHaveProperty('nodes');
            expect(response.body).toHaveProperty('timestamp');
            expect(Array.isArray(response.body.nodes)).toBe(true);
        });
        
        it('should return 4 nodes', async () => {
            const response = await request(app)
                .get('/api/nodes/status')
                .expect(200);
            
            expect(response.body.nodes).toHaveLength(4);
        });
        
        it('should return nodes with required properties', async () => {
            const response = await request(app)
                .get('/api/nodes/status')
                .expect(200);
            
            response.body.nodes.forEach(node => {
                expect(node).toHaveProperty('id');
                expect(node).toHaveProperty('name');
                expect(node).toHaveProperty('status');
            });
        });
    });
    
    describe('GET /api/logs', () => {
        it('should return system logs', async () => {
            const response = await request(app)
                .get('/api/logs')
                .expect(200);
            
            expect(response.body).toHaveProperty('logs');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('limit');
            expect(response.body).toHaveProperty('offset');
            expect(Array.isArray(response.body.logs)).toBe(true);
        });
        
        it('should respect limit parameter', async () => {
            const response = await request(app)
                .get('/api/logs?limit=5')
                .expect(200);
            
            expect(response.body.limit).toBe(5);
            expect(response.body.logs.length).toBeLessThanOrEqual(5);
        });
        
        it('should respect offset parameter', async () => {
            const response = await request(app)
                .get('/api/logs?offset=10')
                .expect(200);
            
            expect(response.body.offset).toBe(10);
        });
    });
    
    describe('POST /api/logs', () => {
        it('should accept log entries', async () => {
            const logData = {
                entries: [
                    {
                        level: 'INFO',
                        message: 'Test log entry',
                        context: { test: true }
                    }
                ]
            };
            
            const response = await request(app)
                .post('/api/logs')
                .send(logData)
                .expect(200);
            
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('received', 1);
        });
        
        it('should reject invalid log entries', async () => {
            const response = await request(app)
                .post('/api/logs')
                .send({ invalid: 'data' })
                .expect(400);
            
            expect(response.body).toHaveProperty('error');
        });
        
        it('should accept multiple log entries', async () => {
            const logData = {
                entries: [
                    { level: 'INFO', message: 'Log 1' },
                    { level: 'WARN', message: 'Log 2' },
                    { level: 'ERROR', message: 'Log 3' }
                ]
            };
            
            const response = await request(app)
                .post('/api/logs')
                .send(logData)
                .expect(200);
            
            expect(response.body.received).toBe(3);
        });
    });
    
    describe('GET /api/stats', () => {
        it('should return server statistics', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);
            
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('totalLogs');
            expect(response.body).toHaveProperty('memory');
            expect(response.body).toHaveProperty('connections');
            expect(response.body).toHaveProperty('timestamp');
        });
    });
    
    describe('404 Handling', () => {
        it('should return 404 for unknown API routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
            
            expect(response.body).toHaveProperty('error', 'Not Found');
        });
    });
    
    describe('Rate Limiting', () => {
        it('should have rate limiting headers', async () => {
            const response = await request(app)
                .get('/api/sovereignty/status');
            
            // Check for rate limit headers
            expect(response.headers).toHaveProperty('x-ratelimit-limit');
        });
    });
    
    describe('CORS', () => {
        it('should have CORS headers', async () => {
            const response = await request(app)
                .get('/api/sovereignty/status');
            
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });
    });
});
