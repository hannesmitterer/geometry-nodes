/**
 * WebSocket Tests
 * Tests WebSocket connection and real-time updates
 */

const WebSocket = require('ws');

// Test configuration
const WS_URL = 'ws://localhost:3001';
let testsPassed = 0;
let testsFailed = 0;

/**
 * Test helper
 */
async function test(name, fn) {
    try {
        await fn();
        console.log(`✓ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
        testsFailed++;
    }
}

/**
 * Assertion helper
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

/**
 * Wait for WebSocket message
 */
function waitForMessage(ws, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Timeout waiting for message'));
        }, timeout);
        
        ws.once('message', (data) => {
            clearTimeout(timer);
            try {
                const message = JSON.parse(data);
                resolve(message);
            } catch (error) {
                reject(new Error('Failed to parse message: ' + error.message));
            }
        });
    });
}

/**
 * Run tests
 */
async function runTests() {
    console.log('🧪 Running WebSocket Tests\n');
    console.log('Testing against:', WS_URL);
    console.log('');
    
    // Test: Connection
    await test('WebSocket connects successfully', async () => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL);
            
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error('Connection timeout'));
            }, 5000);
            
            ws.on('open', () => {
                clearTimeout(timer);
                assert(ws.readyState === WebSocket.OPEN, 'WebSocket should be open');
                ws.close();
                resolve();
            });
            
            ws.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    });
    
    // Test: Welcome message
    await test('Receives welcome message on connection', async () => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL);
            
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error('Timeout waiting for welcome message'));
            }, 5000);
            
            ws.on('open', () => {
                ws.on('message', (data) => {
                    clearTimeout(timer);
                    try {
                        const message = JSON.parse(data);
                        assert(message.type === 'connected', 'Should receive connected message');
                        assert(message.payload, 'Should have payload');
                        ws.close();
                        resolve();
                    } catch (error) {
                        ws.close();
                        reject(error);
                    }
                });
            });
            
            ws.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    });
    
    // Test: Subscribe to channels
    await test('Can subscribe to channels', async () => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL);
            
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error('Timeout'));
            }, 5000);
            
            ws.on('open', () => {
                // Wait for welcome message first
                ws.once('message', () => {
                    // Send subscription request
                    ws.send(JSON.stringify({
                        type: 'subscribe',
                        channels: ['sovereignty', 'wallet', 'nodes']
                    }));
                    
                    // Wait for subscription confirmation
                    ws.once('message', (data) => {
                        clearTimeout(timer);
                        try {
                            const message = JSON.parse(data);
                            assert(message.type === 'subscribed', 'Should receive subscribed message');
                            assert(Array.isArray(message.payload.channels), 'Should have channels array');
                            ws.close();
                            resolve();
                        } catch (error) {
                            ws.close();
                            reject(error);
                        }
                    });
                });
            });
            
            ws.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    });
    
    // Test: Receives sovereignty updates
    await test('Receives sovereignty updates', async () => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL);
            
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error('Timeout waiting for sovereignty update'));
            }, 15000); // Longer timeout as updates are periodic
            
            ws.on('open', () => {
                // Skip welcome message
                ws.once('message', () => {
                    // Subscribe
                    ws.send(JSON.stringify({
                        type: 'subscribe',
                        channels: ['sovereignty']
                    }));
                    
                    // Skip subscription confirmation
                    ws.once('message', () => {
                        // Wait for sovereignty update
                        ws.on('message', (data) => {
                            try {
                                const message = JSON.parse(data);
                                if (message.type === 'sovereignty_update') {
                                    clearTimeout(timer);
                                    assert(message.payload, 'Should have payload');
                                    assert(typeof message.payload.consensusOmnibus === 'number', 'Should have consensus');
                                    assert(typeof message.payload.coherenceInternal === 'number', 'Should have coherence');
                                    ws.close();
                                    resolve();
                                }
                            } catch (error) {
                                clearTimeout(timer);
                                ws.close();
                                reject(error);
                            }
                        });
                    });
                });
            });
            
            ws.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    });
    
    // Test: Multiple connections
    await test('Supports multiple connections', async () => {
        const connections = [];
        
        try {
            // Create 3 connections
            for (let i = 0; i < 3; i++) {
                const ws = new WebSocket(WS_URL);
                connections.push(ws);
                
                await new Promise((resolve, reject) => {
                    const timer = setTimeout(() => reject(new Error('Connection timeout')), 5000);
                    ws.on('open', () => {
                        clearTimeout(timer);
                        resolve();
                    });
                    ws.on('error', reject);
                });
            }
            
            // All connections should be open
            connections.forEach((ws, index) => {
                assert(ws.readyState === WebSocket.OPEN, `Connection ${index} should be open`);
            });
            
            // Close all connections
            connections.forEach(ws => ws.close());
        } catch (error) {
            connections.forEach(ws => ws.close());
            throw error;
        }
    });
    
    // Test: Reconnection after close
    await test('Can reconnect after close', async () => {
        return new Promise(async (resolve, reject) => {
            // First connection
            let ws = new WebSocket(WS_URL);
            
            await new Promise((res, rej) => {
                const timer = setTimeout(() => rej(new Error('First connection timeout')), 5000);
                ws.on('open', () => {
                    clearTimeout(timer);
                    res();
                });
                ws.on('error', rej);
            });
            
            // Close connection
            ws.close();
            
            await new Promise(res => setTimeout(res, 500)); // Wait a bit
            
            // Second connection
            ws = new WebSocket(WS_URL);
            
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error('Second connection timeout'));
            }, 5000);
            
            ws.on('open', () => {
                clearTimeout(timer);
                assert(ws.readyState === WebSocket.OPEN, 'Second connection should be open');
                ws.close();
                resolve();
            });
            
            ws.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    });
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    console.log('='.repeat(50));
    
    if (testsFailed > 0) {
        console.log('\n❌ Some tests failed');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

// Check if WebSocket server is running
const testWs = new WebSocket(WS_URL);
testWs.on('open', () => {
    testWs.close();
    runTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
});

testWs.on('error', () => {
    console.error('❌ WebSocket server is not running!');
    console.error('Please start the server with: npm run backend');
    process.exit(1);
});
