/**
 * WebSocket Connection Tests
 * 
 * @license MIT
 * @description Tests for WebSocket server functionality
 */

const WebSocket = require('ws');

const WS_PORT = process.env.WS_PORT || 3001;
const WS_URL = `ws://localhost:${WS_PORT}`;

describe('WebSocket Server', () => {
    let ws;
    
    afterEach((done) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
            ws.on('close', () => done());
        } else {
            done();
        }
    });
    
    describe('Connection', () => {
        it('should accept WebSocket connections', (done) => {
            ws = new WebSocket(WS_URL);
            
            ws.on('open', () => {
                expect(ws.readyState).toBe(WebSocket.OPEN);
                done();
            });
            
            ws.on('error', (error) => {
                done(error);
            });
        }, 10000);
        
        it('should send welcome message on connection', (done) => {
            ws = new WebSocket(WS_URL);
            
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                expect(message).toHaveProperty('type', 'connected');
                expect(message).toHaveProperty('payload');
                expect(message.payload).toHaveProperty('clientId');
                done();
            });
            
            ws.on('error', (error) => {
                done(error);
            });
        }, 10000);
    });
    
    describe('Messaging', () => {
        it('should handle subscribe messages', (done) => {
            ws = new WebSocket(WS_URL);
            
            ws.on('open', () => {
                const subscribeMsg = {
                    type: 'subscribe',
                    channels: ['sovereignty', 'wallet', 'nodes', 'logs']
                };
                ws.send(JSON.stringify(subscribeMsg));
            });
            
            let messageCount = 0;
            ws.on('message', (data) => {
                messageCount++;
                const message = JSON.parse(data.toString());
                
                // First message is welcome, second is subscription confirmation
                if (messageCount === 2) {
                    expect(message.type).toBe('subscribed');
                    expect(message.payload).toHaveProperty('channels');
                    done();
                }
            });
            
            ws.on('error', (error) => {
                done(error);
            });
        }, 10000);
        
        it('should broadcast sovereignty updates', (done) => {
            ws = new WebSocket(WS_URL);
            
            let receivedUpdate = false;
            
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                
                if (message.type === 'sovereignty_update') {
                    expect(message).toHaveProperty('payload');
                    expect(message.payload).toHaveProperty('masterHash');
                    expect(message.payload).toHaveProperty('consensusOmnibus');
                    receivedUpdate = true;
                    done();
                }
            });
            
            ws.on('error', (error) => {
                done(error);
            });
            
            // Timeout after 15 seconds (broadcasts happen every 10s)
            setTimeout(() => {
                if (!receivedUpdate) {
                    done(new Error('No sovereignty update received'));
                }
            }, 15000);
        }, 20000);
    });
    
    describe('Multiple Clients', () => {
        it('should handle multiple simultaneous connections', (done) => {
            const clients = [];
            const numClients = 5;
            let connectedCount = 0;
            
            for (let i = 0; i < numClients; i++) {
                const client = new WebSocket(WS_URL);
                clients.push(client);
                
                client.on('open', () => {
                    connectedCount++;
                    
                    if (connectedCount === numClients) {
                        // All clients connected
                        expect(connectedCount).toBe(numClients);
                        
                        // Close all clients
                        clients.forEach(c => c.close());
                        done();
                    }
                });
                
                client.on('error', (error) => {
                    done(error);
                });
            }
        }, 10000);
    });
    
    describe('Error Handling', () => {
        it('should handle invalid JSON messages', (done) => {
            ws = new WebSocket(WS_URL);
            
            ws.on('open', () => {
                // Send invalid JSON
                ws.send('invalid json {');
                
                // Should not crash - if we get here after a delay, it passed
                setTimeout(() => {
                    expect(ws.readyState).toBe(WebSocket.OPEN);
                    done();
                }, 1000);
            });
            
            ws.on('error', (error) => {
                done(error);
            });
        }, 10000);
    });
    
    describe('Cleanup', () => {
        it('should handle client disconnection gracefully', (done) => {
            ws = new WebSocket(WS_URL);
            
            ws.on('open', () => {
                ws.close();
            });
            
            ws.on('close', () => {
                expect(ws.readyState).toBe(WebSocket.CLOSED);
                done();
            });
            
            ws.on('error', (error) => {
                done(error);
            });
        }, 10000);
    });
});
