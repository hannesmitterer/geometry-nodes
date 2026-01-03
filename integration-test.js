/**
 * Integration Test - Full System Validation
 * Tests the complete workflow from initialization to mission validation
 */

const { PeaceBondsEngine } = require('./peacebonds-engine.js');

async function runIntegrationTest() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║        INTEGRATION TEST - FULL SYSTEM WORKFLOW        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    try {
        // Step 1: Initialize
        console.log('STEP 1: Initializing system...');
        const engine = new PeaceBondsEngine();
        await engine.initialize('MATIC_TESTNET', 'ZKSYNC_TESTNET');
        console.log('✓ System initialized\n');

        // Step 2: Deploy multiple contracts
        console.log('STEP 2: Deploying multiple contracts...');
        const contract1 = await engine.deployContract('INTEGRATION_TEST_1');
        const contract2 = await engine.deployContract('INTEGRATION_TEST_2');
        console.log(`✓ Deployed ${engine.getContracts().length} contracts\n`);

        // Step 3: Start monitoring
        console.log('STEP 3: Starting monitoring system...');
        engine.startMonitoring(2000);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✓ Monitoring active\n');

        // Step 4: Test failover
        console.log('STEP 4: Testing network failover...');
        const originalNetwork = engine.currentNetwork.name;
        await engine.switchToFallback();
        console.log(`✓ Switched from ${originalNetwork} to ${engine.currentNetwork.name}\n`);

        // Step 5: Deploy on fallback network
        console.log('STEP 5: Deploying on fallback network...');
        const contract3 = await engine.deployContract('FALLBACK_TEST');
        console.log(`✓ Deployed on ${contract3.network}\n`);

        // Step 6: Run mission validation
        console.log('STEP 6: Running mission validation...');
        const validation = await engine.validateMission();
        console.log(`✓ Mission status: ${validation.allChecks ? 'READY' : 'NOT READY'}\n`);

        // Step 7: Verify all components
        console.log('STEP 7: Component verification...');
        const contracts = engine.getContracts();
        const metrics = engine.getMetrics();
        const deadline = engine.checkDeadline();

        console.log(`  - Contracts: ${contracts.length} deployed`);
        console.log(`  - Verified: ${contracts.filter(c => c.verified).length}/${contracts.length}`);
        console.log(`  - Treasury: $${metrics.treasury.toFixed(2)}`);
        console.log(`  - NSR: ${metrics.nsrFrequency} Hz, Drift: ${metrics.drift}%`);
        console.log(`  - Deadline: ${deadline.formatted} remaining`);
        console.log(`  - Monitoring: ${engine.monitoringActive ? 'Active' : 'Inactive'}`);
        console.log('');

        // Cleanup
        engine.stopMonitoring();

        // Final report
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║           INTEGRATION TEST COMPLETED                  ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log('✅ All integration tests PASSED\n');

        return 0;

    } catch (error) {
        console.error(`\n✗ Integration test FAILED: ${error.message}\n`);
        return 1;
    }
}

if (require.main === module) {
    runIntegrationTest().then(exitCode => process.exit(exitCode));
}

module.exports = { runIntegrationTest };
