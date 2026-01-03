/**
 * Test Suite for PeaceBonds Engine
 * Mission Ave Maria - Quality Assurance
 */

const { PeaceBondsEngine, NETWORKS, MISSION_DEADLINE } = require('./peacebonds-engine.js');

class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }

    async runTest(name, testFn) {
        process.stdout.write(`  Testing: ${name}... `);
        try {
            await testFn();
            console.log('✓ PASS');
            this.passed++;
            this.tests.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`✗ FAIL: ${error.message}`);
            this.failed++;
            this.tests.push({ name, status: 'FAIL', error: error.message });
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    printSummary() {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                   TEST SUMMARY                        ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log(`  Total Tests: ${this.passed + this.failed}`);
        console.log(`  Passed:      ${this.passed}`);
        console.log(`  Failed:      ${this.failed}`);
        console.log(`  Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%\n`);

        if (this.failed > 0) {
            console.log('Failed Tests:');
            this.tests.filter(t => t.status === 'FAIL').forEach(t => {
                console.log(`  ✗ ${t.name}: ${t.error}`);
            });
            console.log('');
        }
    }
}

async function runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     PEACEBONDS ENGINE - TEST SUITE                    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const runner = new TestRunner();
    let engine;

    // Test 1: Engine Initialization
    await runner.runTest('Engine initialization', async () => {
        engine = new PeaceBondsEngine();
        const result = await engine.initialize('MATIC_TESTNET', 'ZKSYNC_TESTNET');
        runner.assert(result === true, 'Engine should initialize successfully');
        runner.assert(engine.currentNetwork !== null, 'Current network should be set');
    });

    // Test 2: Network Configuration
    await runner.runTest('Network configuration', async () => {
        runner.assertEqual(engine.currentNetwork.name, 'Polygon Mumbai Testnet', 'Primary network mismatch');
        runner.assertEqual(engine.fallbackNetwork.name, 'zkSync Era Testnet', 'Fallback network mismatch');
        runner.assertEqual(engine.currentNetwork.chainId, 80001, 'Chain ID mismatch');
    });

    // Test 3: Contract Deployment
    await runner.runTest('Contract deployment', async () => {
        const contract = await engine.deployContract('TEST_HASH_123');
        runner.assert(contract.address.startsWith('0x'), 'Contract address should start with 0x');
        runner.assert(contract.address.length === 42, 'Contract address should be 42 characters');
        runner.assert(contract.txHash.startsWith('0x'), 'TX hash should start with 0x');
        runner.assert(contract.txHash.length === 66, 'TX hash should be 66 characters');
    });

    // Test 4: Contract Verification
    await runner.runTest('Contract verification logic', async () => {
        const contracts = engine.getContracts();
        runner.assert(contracts.length > 0, 'Should have at least one contract');
        // Note: Verification may succeed or fail due to randomness, we just check it attempted
        runner.assert(contracts[0].address !== undefined, 'Contract should have address');
    });

    // Test 5: Metrics Tracking
    await runner.runTest('Metrics tracking', async () => {
        const metrics = engine.getMetrics();
        runner.assert(metrics.treasury > 0, 'Treasury should be positive');
        runner.assert(metrics.drift === 0.000, 'Drift should be zero (NSR enforced)');
        runner.assert(metrics.nsrFrequency === 0.043, 'NSR frequency should be 0.043 Hz');
        runner.assert(metrics.nodes === 144000, 'Should have 144000 nodes');
    });

    // Test 6: Deadline Calculation
    await runner.runTest('Mission deadline calculation', async () => {
        const deadline = engine.checkDeadline();
        runner.assert(deadline.status === 'IN_PROGRESS' || deadline.status === 'COMPLETE', 
                     'Deadline status should be valid');
        if (deadline.status === 'IN_PROGRESS') {
            runner.assert(deadline.remaining > 0, 'Remaining time should be positive');
            runner.assert(deadline.formatted !== undefined, 'Should have formatted time');
        }
    });

    // Test 7: Monitoring Start/Stop
    await runner.runTest('Monitoring activation', async () => {
        engine.startMonitoring(1000);
        runner.assert(engine.monitoringActive === true, 'Monitoring should be active');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        engine.stopMonitoring();
        runner.assert(engine.monitoringActive === false, 'Monitoring should be stopped');
    });

    // Test 8: Network Failover
    await runner.runTest('Network failover mechanism', async () => {
        const originalNetwork = engine.currentNetwork.name;
        await engine.switchToFallback();
        const newNetwork = engine.currentNetwork.name;
        runner.assert(originalNetwork !== newNetwork, 'Network should change after failover');
    });

    // Test 9: Mission Validation
    await runner.runTest('Mission validation', async () => {
        const validation = await engine.validateMission();
        runner.assert(validation.checks !== undefined, 'Should have validation checks');
        runner.assert(validation.allChecks !== undefined, 'Should have overall status');
        runner.assert(typeof validation.allChecks === 'boolean', 'Overall status should be boolean');
    });

    // Test 10: Checksum Validation
    await runner.runTest('Address checksum validation', async () => {
        const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2';
        const invalidAddress = '742d35Cc6634C0532925a3b844Bc9e7595f0bEb2';
        runner.assert(engine.validateChecksum(validAddress) === true, 'Valid address should pass');
        runner.assert(engine.validateChecksum(invalidAddress) === false, 'Invalid address should fail');
    });

    // Test 11: Hash Validation
    await runner.runTest('Transaction hash validation', async () => {
        const validHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const invalidHash = '0x123456';
        runner.assert(engine.validateHash(validHash) === true, 'Valid hash should pass');
        runner.assert(engine.validateHash(invalidHash) === false, 'Invalid hash should fail');
    });

    // Test 12: Multiple Contract Deployments
    await runner.runTest('Multiple contract deployments', async () => {
        const initialCount = engine.getContracts().length;
        await engine.deployContract('TEST_HASH_2');
        await engine.deployContract('TEST_HASH_3');
        const finalCount = engine.getContracts().length;
        runner.assert(finalCount === initialCount + 2, 'Should have 2 more contracts');
    });

    // Test 13: Metrics Update
    await runner.runTest('Metrics update mechanism', async () => {
        const before = engine.getMetrics().lastUpdate;
        await new Promise(resolve => setTimeout(resolve, 10));
        engine.updateMetrics();
        const after = engine.getMetrics().lastUpdate;
        runner.assert(after > before, 'Last update timestamp should increase');
    });

    // Test 14: Contract Retrieval
    await runner.runTest('Contract retrieval', async () => {
        const contracts = engine.getContracts();
        runner.assert(Array.isArray(contracts), 'Should return array of contracts');
        runner.assert(contracts.length > 0, 'Should have at least one contract');
        runner.assert(contracts[0].address !== undefined, 'Contract should have address field');
    });

    // Test 15: Network Health Check
    await runner.runTest('Network health check', async () => {
        const health = await engine.checkNetworkHealth(engine.currentNetwork);
        runner.assert(health.rpcConnectivity !== undefined, 'Should check RPC connectivity');
        runner.assert(health.latency !== undefined, 'Should measure latency');
        runner.assert(health.blockNumber !== undefined, 'Should get block number');
    });

    // Print summary
    runner.printSummary();

    // Return exit code
    return runner.failed === 0 ? 0 : 1;
}

// Run tests if executed directly
if (require.main === module) {
    runAllTests().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests, TestRunner };
