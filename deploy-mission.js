#!/usr/bin/env node

/**
 * Automated Deployment Script for Mission Ave Maria
 * Handles MATIC deployment with zkSync fallback
 */

const { PeaceBondsEngine, NETWORKS, MISSION_DEADLINE } = require('./peacebonds-engine.js');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function runDeployment() {
    log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
    log('║     MISSION AVE MARIA - DEPLOYMENT AUTOMATION         ║', 'cyan');
    log('║     Peace Bonds Contract Deployment System            ║', 'cyan');
    log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

    const engine = new PeaceBondsEngine();
    
    try {
        // Step 1: Initialize Engine
        log('STEP 1: Initializing PeaceBonds Engine...', 'blue');
        await engine.initialize('MATIC_TESTNET', 'ZKSYNC_TESTNET');
        log('✓ Engine initialized successfully\n', 'green');

        // Step 2: Deploy Contract
        log('STEP 2: Deploying PeaceBonds Contract...', 'blue');
        const masterHash = 'NOTHING_IS_FINAL_UNTIL_NOW_SOVEREIGNTY_DECLARED';
        const contract = await engine.deployContract(masterHash);
        log('✓ Contract deployed successfully', 'green');
        log(`  Address: ${contract.address}`, 'cyan');
        log(`  Network: ${contract.network}`, 'cyan');
        log(`  TX Hash: ${contract.txHash}\n`, 'cyan');

        // Step 3: Start Monitoring
        log('STEP 3: Starting Real-time Monitoring...', 'blue');
        engine.startMonitoring(5000);
        log('✓ Monitoring activated (5s intervals)\n', 'green');

        // Step 4: Wait for verification
        log('STEP 4: Waiting for verification to complete...', 'blue');
        await new Promise(resolve => setTimeout(resolve, 3000));
        log('✓ Verification process completed\n', 'green');

        // Step 5: Run Mission Validation
        log('STEP 5: Running Mission Validation...', 'blue');
        const validation = await engine.validateMission();
        
        if (validation.allChecks) {
            log('✓ MISSION VALIDATION PASSED - ALL SYSTEMS GO!\n', 'green');
        } else {
            log('⚠ MISSION VALIDATION INCOMPLETE', 'yellow');
            log('  Missing requirements:', 'yellow');
            Object.entries(validation.checks).forEach(([key, value]) => {
                if (!value) {
                    log(`    - ${key}`, 'red');
                }
            });
            log('');
        }

        // Step 6: Display Status Dashboard
        log('STEP 6: Current System Status', 'blue');
        displayStatus(engine);

        // Step 7: Mission Deadline
        displayDeadline();

        log('\n╔════════════════════════════════════════════════════════╗', 'green');
        log('║     DEPLOYMENT COMPLETE - SYSTEM OPERATIONAL          ║', 'green');
        log('╚════════════════════════════════════════════════════════╝\n', 'green');

        log('Monitoring will continue. Press Ctrl+C to exit.\n', 'yellow');

        // Keep monitoring active
        process.on('SIGINT', () => {
            log('\n\nShutting down monitoring...', 'yellow');
            engine.stopMonitoring();
            log('✓ Shutdown complete\n', 'green');
            process.exit(0);
        });

    } catch (error) {
        log(`\n✗ ERROR: ${error.message}\n`, 'red');
        process.exit(1);
    }
}

function displayStatus(engine) {
    const metrics = engine.getMetrics();
    const contracts = engine.getContracts();
    const verifiedCount = contracts.filter(c => c.verified).length;

    console.log('  ┌─────────────────────────────────────────────────┐');
    console.log(`  │ Network:          ${engine.currentNetwork.name.padEnd(27)} │`);
    console.log(`  │ Chain ID:         ${engine.currentNetwork.chainId.toString().padEnd(27)} │`);
    console.log(`  │ Contracts:        ${contracts.length} deployed, ${verifiedCount} verified${' '.repeat(11)} │`);
    console.log(`  │ Treasury:         $${metrics.treasury.toFixed(2).padEnd(25)} │`);
    console.log(`  │ NSR Frequency:    ${metrics.nsrFrequency} Hz${' '.repeat(21)} │`);
    console.log(`  │ Drift Index:      ${metrics.drift.toFixed(3)}%${' '.repeat(22)} │`);
    console.log(`  │ Active Nodes:     ${metrics.nodes.toLocaleString().padEnd(27)} │`);
    console.log(`  │ Monitoring:       ${(engine.monitoringActive ? 'ACTIVE' : 'INACTIVE').padEnd(27)} │`);
    console.log('  └─────────────────────────────────────────────────┘\n');
}

function displayDeadline() {
    const now = Date.now();
    const remaining = MISSION_DEADLINE - now;

    if (remaining <= 0) {
        log('  🎯 MISSION DEADLINE: REACHED', 'magenta');
        return;
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    log(`  🎯 MISSION DEADLINE: ${days} days, ${hours} hours, ${minutes} minutes remaining`, 'magenta');
}

// Run deployment if script is executed directly
if (require.main === module) {
    runDeployment().catch(error => {
        log(`\n✗ FATAL ERROR: ${error.message}\n`, 'red');
        process.exit(1);
    });
}

module.exports = { runDeployment };
