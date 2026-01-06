/**
 * API Integration Tests
 * Tests all REST API endpoints
 */

const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;

/**
 * Make HTTP request
 */
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
        }
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : null;
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

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
 * Run tests
 */
async function runTests() {
    console.log('🧪 Running API Integration Tests\n');
    console.log('Testing against:', API_BASE);
    console.log('');
    
    // Health check
    await test('GET /health returns 200', async () => {
        const res = await request('GET', '/health');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.status === 'healthy', 'Status should be healthy');
        assert(typeof res.data.uptime === 'number', 'Should have uptime');
    });
    
    // Sovereignty endpoints
    await test('GET /api/sovereignty/status returns valid data', async () => {
        const res = await request('GET', '/api/sovereignty/status');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.masterHash === 'RS-CORONATION-31122025-HM-PROV', 'Invalid master hash');
        assert(res.data.consensusOmnibus === 100 || res.data.consensusOmnibus >= 99, 'Invalid consensus');
        assert(typeof res.data.coherenceInternal === 'number', 'Should have coherence');
    });
    
    // Wallet endpoints
    await test('GET /api/wallet/balance returns valid data', async () => {
        const res = await request('GET', '/api/wallet/balance');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(typeof res.data.balance === 'number', 'Balance should be a number');
        assert(res.data.currency === 'USD', 'Currency should be USD');
        assert(res.data.walletAddress.startsWith('0x'), 'Invalid wallet address');
    });
    
    // Nodes endpoints
    await test('GET /api/nodes/status returns valid data', async () => {
        const res = await request('GET', '/api/nodes/status');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.data.nodes), 'Nodes should be an array');
        assert(res.data.nodes.length === 4, 'Should have 4 nodes');
        assert(res.data.nodes[0].id === 'onna', 'First node should be onna');
    });
    
    // Logs endpoints - GET
    await test('GET /api/logs returns paginated logs', async () => {
        const res = await request('GET', '/api/logs?limit=10&offset=0');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.data.logs), 'Logs should be an array');
        assert(res.data.logs.length <= 10, 'Should respect limit');
        assert(typeof res.data.total === 'number', 'Should have total count');
    });
    
    // Logs endpoints - POST
    await test('POST /api/logs submits log entries', async () => {
        const logData = {
            entries: [
                {
                    level: 'INFO',
                    message: 'Test log entry',
                    timestamp: Date.now(),
                    nodeId: 'test_node',
                    sessionId: 'test_session'
                }
            ]
        };
        
        const res = await request('POST', '/api/logs', logData);
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        assert(res.data.success === true, 'Should return success');
        assert(res.data.added === 1, 'Should add 1 log');
    });
    
    // Validation tests
    await test('POST /api/logs rejects invalid data', async () => {
        const invalidData = {
            entries: [
                {
                    level: 'INVALID',
                    message: 'Test'
                }
            ]
        };
        
        const res = await request('POST', '/api/logs', invalidData);
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });
    
    // Authentication endpoints
    await test('POST /api/auth/login accepts valid credentials', async () => {
        const credentials = {
            username: 'admin',
            password: 'resonance2025'
        };
        
        const res = await request('POST', '/api/auth/login', credentials);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success === true, 'Login should succeed');
        assert(typeof res.data.token === 'string', 'Should return token');
    });
    
    await test('POST /api/auth/login rejects invalid credentials', async () => {
        const credentials = {
            username: 'admin',
            password: 'wrong'
        };
        
        const res = await request('POST', '/api/auth/login', credentials);
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });
    
    await test('GET /api/auth/verify requires token', async () => {
        const res = await request('GET', '/api/auth/verify');
        assert(res.status === 401, `Expected 401, got ${res.status}`);
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

// Check if server is running
request('GET', '/health')
    .then(() => {
        runTests().catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
    })
    .catch(() => {
        console.error('❌ Backend server is not running!');
        console.error('Please start the server with: npm run backend');
        process.exit(1);
    });
