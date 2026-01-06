#!/usr/bin/env node

/**
 * Node.js test script for Live Terminal modules
 */

// Mock browser APIs for Node.js environment
global.WebSocket = class WebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 0;
        setTimeout(() => {
            this.readyState = 1;
            if (this.onopen) this.onopen();
        }, 100);
    }
    close() {
        this.readyState = 3;
        if (this.onclose) this.onclose();
    }
};

global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    removeItem(key) { delete this.data[key]; }
};

global.sessionStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    removeItem(key) { delete this.data[key]; }
};

// Load modules
const APIService = require('./api-service.js');
const LoggerService = require('./logger-service.js');
const NotificationService = require('./notification-service.js');

console.log('🧪 Running Live Terminal Module Tests\n');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        console.log(`✓ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Run tests
console.log('Testing APIService...');
test('APIService can be instantiated', () => {
    const api = new APIService();
    assert(api !== null, 'APIService should not be null');
    assert(typeof api.fetchSovereigntyStatus === 'function', 'Should have fetchSovereigntyStatus method');
});

test('APIService has correct default configuration', () => {
    const api = new APIService();
    assert(api.baseURL === 'https://api.resonance.school', 'Default baseURL should be set');
    assert(api.wsURL === 'wss://api.resonance.school/ws', 'Default wsURL should be set');
});

test('APIService can generate mock sovereignty data', () => {
    const api = new APIService();
    const data = api.getMockSovereigntyData();
    assert(data.masterHash === 'RS-CORONATION-31122025-HM-PROV', 'Mock data should have correct master hash');
    assert(data.overrideActive === true, 'Override should be active');
    assert(data.consensusOmnibus === 100, 'Consensus should be 100');
});

test('APIService can generate mock wallet data', () => {
    const api = new APIService();
    const data = api.getMockWalletData();
    assert(data.balance === 450000000, 'Wallet balance should be 450M');
    assert(data.currency === 'USD', 'Currency should be USD');
});

test('APIService can generate mock node data', () => {
    const api = new APIService();
    const data = api.getMockNodeData();
    assert(Array.isArray(data.nodes), 'Nodes should be an array');
    assert(data.nodes.length === 4, 'Should have 4 nodes');
    assert(data.nodes[0].id === 'onna', 'First node should be onna');
});

test('APIService can generate node ID', () => {
    const api = new APIService();
    const nodeId = api.getNodeId();
    assert(nodeId !== null, 'Node ID should not be null');
    assert(nodeId.startsWith('node_'), 'Node ID should start with node_');
    
    // Check persistence
    const nodeId2 = api.getNodeId();
    assert(nodeId === nodeId2, 'Node ID should be persistent');
});

test('APIService event system works', () => {
    const api = new APIService();
    let eventFired = false;
    let eventData = null;
    
    api.on('test', (data) => {
        eventFired = true;
        eventData = data;
    });
    
    api.emit('test', { foo: 'bar' });
    
    assert(eventFired, 'Event should have fired');
    assert(eventData.foo === 'bar', 'Event data should be passed correctly');
});

console.log('\nTesting LoggerService...');
test('LoggerService can be instantiated', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    assert(logger !== null, 'LoggerService should not be null');
    assert(typeof logger.info === 'function', 'Should have info method');
});

test('LoggerService has correct log levels', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    assert(logger.levels.DEBUG === 0, 'DEBUG level should be 0');
    assert(logger.levels.INFO === 1, 'INFO level should be 1');
    assert(logger.levels.WARN === 2, 'WARN level should be 2');
    assert(logger.levels.ERROR === 3, 'ERROR level should be 3');
    assert(logger.levels.CRITICAL === 4, 'CRITICAL level should be 4');
});

test('LoggerService can create log entries', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    
    const logEntry = logger.info('Test message', { context: 'test' });
    
    assert(logEntry !== undefined, 'Log entry should be returned');
    assert(logEntry.level === 'INFO', 'Level should be INFO');
    assert(logEntry.message === 'Test message', 'Message should match');
});

test('LoggerService buffer works', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    
    logger.info('Message 1');
    logger.info('Message 2');
    logger.warn('Message 3');
    
    const logs = logger.getRecentLogs(3);
    assert(logs.length === 3, 'Should have 3 logs in buffer');
});

test('LoggerService respects log level filtering', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    
    logger.setLevel('WARN');
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    
    const logs = logger.getRecentLogs(10);
    const warnLogs = logs.filter(l => l.level === 'WARN');
    const debugLogs = logs.filter(l => l.level === 'DEBUG');
    
    assert(warnLogs.length > 0, 'Should have warn logs');
    assert(debugLogs.length === 0, 'Should not have debug logs');
});

console.log('\nTesting NotificationService...');
test('NotificationService can be instantiated', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    const notifier = new NotificationService(logger);
    assert(notifier !== null, 'NotificationService should not be null');
    assert(typeof notifier.notify === 'function', 'Should have notify method');
});

test('NotificationService can register triggers', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    const notifier = new NotificationService(logger);
    
    const trigger = notifier.registerCountdownTrigger(
        'test',
        Date.now() + 1000,
        () => {}
    );
    
    assert(trigger !== undefined, 'Trigger should be registered');
    assert(trigger.name === 'test', 'Trigger name should match');
    assert(trigger.executed === false, 'Trigger should not be executed yet');
});

test('NotificationService stores notifications', () => {
    const api = new APIService();
    const logger = new LoggerService(api);
    const notifier = new NotificationService(logger);
    
    // Note: In Node.js, visual notifications won't actually display
    notifier.visualEnabled = false;
    notifier.soundEnabled = false;
    
    notifier.notify('Test Title', { body: 'Test Body', type: 'info' });
    
    const notifications = notifier.getNotifications();
    assert(notifications.length > 0, 'Should have notifications');
    assert(notifications[0].title === 'Test Title', 'Title should match');
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests run: ${testsRun}`);
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
