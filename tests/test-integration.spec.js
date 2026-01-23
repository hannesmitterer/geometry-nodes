/**
 * Integration Tests
 * 
 * @license MIT
 * @description End-to-end integration tests
 */

const request = require('supertest');
const WebSocket = require('ws');
const { app } = require('../backend/backend-mock-server');

const WS_PORT = process.env.WS_PORT || 3001;
const WS_URL = `ws://localhost:${WS_PORT}`;

describe('Integration Tests', () => {
    describe('Complete API Flow', () => {
        it('should fetch all data endpoints successfully', async () => {
            // Fetch sovereignty status
            const sovereignty = await request(app)
                .get('/api/sovereignty/status')
                .expect(200);
            expect(sovereignty.body).toHaveProperty('masterHash');
            
            // Fetch wallet balance
            const wallet = await request(app)
                .get('/api/wallet/balance')
                .expect(200);
            expect(wallet.body).toHaveProperty('balance');
            
            // Fetch node status
            const nodes = await request(app)
                .get('/api/nodes/status')
                .expect(200);
            expect(nodes.body).toHaveProperty('nodes');
            
            // Fetch logs
            const logs = await request(app)
                .get('/api/logs')
                .expect(200);
            expect(logs.body).toHaveProperty('logs');
            
            // Check health
            const health = await request(app)
                .get('/health')
                .expect(200);
            expect(health.body).toHaveProperty('status', 'healthy');
        });
        
        it('should submit and retrieve logs', async () => {
            // Submit log
            const submitResponse = await request(app)
                .post('/api/logs')
                .send({
                    entries: [
                        {
                            level: 'INFO',
                            message: 'Integration test log',
                            context: { test: 'integration' }
                        }
                    ]
                })
                .expect(200);
            
            expect(submitResponse.body.success).toBe(true);
            expect(submitResponse.body.received).toBe(1);
            
            // Retrieve logs
            const logsResponse = await request(app)
                .get('/api/logs?limit=100')
                .expect(200);
            
            expect(logsResponse.body.logs.length).toBeGreaterThan(0);
            
            // Check if our log is in the results
            const ourLog = logsResponse.body.logs.find(
                log => log.message === 'Integration test log'
            );
            expect(ourLog).toBeDefined();
        });
    });
    
    describe('WebSocket and REST Integration', () => {
        let ws;
        
        afterEach((done) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
                ws.on('close', () => done());
            } else {
                done();
            }
        });
        
        it('should receive updates via WebSocket for data fetched via REST', (done) => {
            // First fetch via REST
            request(app)
                .get('/api/sovereignty/status')
                .expect(200)
                .then(restResponse => {
                    expect(restResponse.body).toHaveProperty('consensusOmnibus');
                    
                    // Then connect WebSocket and wait for update
                    ws = new WebSocket(WS_URL);
                    
                    ws.on('message', (data) => {
                        const message = JSON.parse(data.toString());
                        
                        if (message.type === 'sovereignty_update') {
                            expect(message.payload).toHaveProperty('consensusOmnibus');
                            done();
                        }
                    });
                    
                    ws.on('error', (error) => {
                        done(error);
                    });
                })
                .catch(error => done(error));
        }, 20000);
        
        it('should handle concurrent REST and WebSocket operations', (done) => {
            let restCompleted = false;
            let wsConnected = false;
            
            // Make REST request
            request(app)
                .get('/api/nodes/status')
                .expect(200)
                .then(response => {
                    expect(response.body).toHaveProperty('nodes');
                    restCompleted = true;
                    
                    if (wsConnected) {
                        done();
                    }
                })
                .catch(error => done(error));
            
            // Connect WebSocket
            ws = new WebSocket(WS_URL);
            
            ws.on('open', () => {
                wsConnected = true;
                
                if (restCompleted) {
                    done();
                }
            });
            
            ws.on('error', (error) => {
                done(error);
            });
        }, 10000);
    });
    
    describe('Error Recovery', () => {
        it('should handle malformed requests gracefully', async () => {
            // Send invalid JSON
            const response = await request(app)
                .post('/api/logs')
                .set('Content-Type', 'application/json')
                .send('{"invalid json}')
                .expect(400);
            
            // Server should still be responsive
            const healthCheck = await request(app)
                .get('/health')
                .expect(200);
            
            expect(healthCheck.body.status).toBe('healthy');
        });
        
        it('should continue serving after WebSocket disconnections', (done) => {
            const ws1 = new WebSocket(WS_URL);
            
            ws1.on('open', () => {
                // Immediately close
                ws1.close();
            });
            
            ws1.on('close', () => {
                // After disconnect, server should still work
                request(app)
                    .get('/health')
                    .expect(200)
                    .then(response => {
                        expect(response.body.status).toBe('healthy');
                        done();
                    })
                    .catch(error => done(error));
            });
            
            ws1.on('error', (error) => {
                done(error);
            });
        }, 10000);
    });
    
    describe('Performance Under Load', () => {
        it('should handle multiple concurrent requests', async () => {
            const promises = [];
            
            // Make 20 concurrent requests
            for (let i = 0; i < 20; i++) {
                promises.push(
                    request(app)
                        .get('/api/sovereignty/status')
                        .expect(200)
                );
            }
            
            const responses = await Promise.all(promises);
            
            // All should succeed
            responses.forEach(response => {
                expect(response.body).toHaveProperty('masterHash');
            });
        });
        
        it('should handle multiple WebSocket clients', (done) => {
            const clients = [];
            const numClients = 10;
            let connectedCount = 0;
            let receivedUpdates = 0;
            
            for (let i = 0; i < numClients; i++) {
                const client = new WebSocket(WS_URL);
                clients.push(client);
                
                client.on('open', () => {
                    connectedCount++;
                });
                
                client.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'sovereignty_update') {
                        receivedUpdates++;
                        
                        // If all clients received at least one update
                        if (receivedUpdates >= numClients) {
                            clients.forEach(c => c.close());
                            done();
                        }
                    }
                });
                
                client.on('error', (error) => {
                    done(error);
                });
            }
        }, 20000);
    });
    
    describe('Data Consistency', () => {
        it('should return consistent data structure across multiple requests', async () => {
            const response1 = await request(app)
                .get('/api/sovereignty/status')
                .expect(200);
            
            const response2 = await request(app)
                .get('/api/sovereignty/status')
                .expect(200);
            
            // Structure should be the same
            expect(Object.keys(response1.body).sort()).toEqual(
                Object.keys(response2.body).sort()
            );
        });
        
        it('should maintain log order and integrity', async () => {
            // Submit multiple logs
            await request(app)
                .post('/api/logs')
                .send({
                    entries: [
                        { level: 'INFO', message: 'Test 1' },
                        { level: 'INFO', message: 'Test 2' },
                        { level: 'INFO', message: 'Test 3' }
                    ]
                })
                .expect(200);
            
            // Retrieve logs
            const logsResponse = await request(app)
                .get('/api/logs?limit=100')
                .expect(200);
            
            // Logs should be ordered by ID
            const logs = logsResponse.body.logs;
            for (let i = 1; i < logs.length; i++) {
                expect(logs[i].id).toBeGreaterThan(logs[i - 1].id);
            }
        });
    });
    
    describe('Statistics and Monitoring', () => {
        it('should track and report accurate statistics', async () => {
            // Make some requests
            await request(app).get('/api/sovereignty/status');
            await request(app).get('/api/wallet/balance');
            await request(app).get('/api/nodes/status');
            
            // Check stats
            const stats = await request(app)
                .get('/api/stats')
                .expect(200);
            
            expect(stats.body).toHaveProperty('uptime');
            expect(stats.body).toHaveProperty('totalLogs');
            expect(stats.body).toHaveProperty('memory');
            expect(stats.body.uptime).toBeGreaterThan(0);
        });
    });
});
