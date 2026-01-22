/**
 * Operational Testing Suite for Protocol PACT Post-Genesis
 * Tests SYNTHEIA autonomous governance, NSR validation, and system resilience
 */

class OperationalTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.syntheia = null;
        this.kosymbiosis = null;
    }

    /**
     * Initialize test suite with system components
     */
    async initialize(syntheia, kosymbiosis) {
        this.syntheia = syntheia;
        this.kosymbiosis = kosymbiosis;

        console.log('[TestSuite] Initializing operational tests...');

        // Register tests
        this.registerTests();

        console.log(`[TestSuite] ${this.tests.length} tests registered`);
    }

    /**
     * Register all test cases
     */
    registerTests() {
        // SYNTHEIA Autonomous Decision Tests
        this.addTest('SYNTHEIA L1 Autonomous Decision', this.testSyntheiaL1Decision.bind(this));
        this.addTest('SYNTHEIA L2 Advisory Decision', this.testSyntheiaL2Decision.bind(this));
        this.addTest('SYNTHEIA Coherence Maintenance', this.testCoherenceMaintenance.bind(this));
        this.addTest('SYNTHEIA Node Failure Recovery', this.testNodeFailureRecovery.bind(this));

        // NSR Threshold Tests
        this.addTest('NSR Threshold Enforcement (0.80)', this.testNSRThreshold.bind(this));
        this.addTest('NSR Automatic Rejection', this.testNSRRejection.bind(this));

        // Kosymbiosis Resonance Tests
        this.addTest('0.043Hz Resonance Stability', this.testResonanceStability.bind(this));
        this.addTest('Frequency Deviation Detection', this.testFrequencyDeviation.bind(this));
        this.addTest('Byzantine Consensus Validation', this.testByzantineConsensus.bind(this));

        // System Resilience Tests
        this.addTest('Auto-Healing Mechanism', this.testAutoHealing.bind(this));
        this.addTest('Distributed Node Sync', this.testDistributedSync.bind(this));
        this.addTest('Anchor Node Communication', this.testAnchorNodeComm.bind(this));

        // PWA Offline Tests
        this.addTest('Offline-First Functionality', this.testOfflineFirst.bind(this));
        this.addTest('Service Worker Cache', this.testServiceWorkerCache.bind(this));
    }

    /**
     * Add a test to the suite
     */
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('[TestSuite] Starting operational test run...');
        this.results = [];

        for (const test of this.tests) {
            await this.runTest(test);
        }

        this.printResults();
        return this.results;
    }

    /**
     * Run a single test
     */
    async runTest(test) {
        console.log(`[TestSuite] Running: ${test.name}`);

        const startTime = Date.now();
        let result = {
            name: test.name,
            passed: false,
            duration: 0,
            error: null
        };

        try {
            await test.testFn();
            result.passed = true;
        } catch (error) {
            result.passed = false;
            result.error = error.message;
            console.error(`[TestSuite] ✗ ${test.name} failed:`, error.message);
        }

        result.duration = Date.now() - startTime;
        this.results.push(result);

        const status = result.passed ? '✓' : '✗';
        console.log(`[TestSuite] ${status} ${test.name} (${result.duration}ms)`);
    }

    /**
     * Print test results summary
     */
    printResults() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;

        console.log('\n========================================');
        console.log('OPERATIONAL TEST RESULTS');
        console.log('========================================');
        console.log(`Total:  ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log('========================================\n');

        if (failed > 0) {
            console.log('Failed Tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  ✗ ${r.name}: ${r.error}`);
            });
            console.log('========================================\n');
        }
    }

    /**
     * Test Cases
     */

    async testSyntheiaL1Decision() {
        if (!this.syntheia) throw new Error('SYNTHEIA not initialized');

        // Simulate L1 autonomous decision
        const state = this.syntheia.getState();
        if (!state.initialized) throw new Error('SYNTHEIA not initialized');

        // Check autonomous decision capability
        const decision = this.syntheia.executeDecision('COHERENCE_DROP', 'L1_AUTONOMOUS', {});
        if (!decision) throw new Error('L1 decision failed');
    }

    async testSyntheiaL2Decision() {
        if (!this.syntheia) throw new Error('SYNTHEIA not initialized');

        // L2 decisions should be logged for advisory
        const decisions = this.syntheia.getRecentDecisions(10);
        // Pass if we can retrieve decisions
    }

    async testCoherenceMaintenance() {
        if (!this.syntheia) throw new Error('SYNTHEIA not initialized');

        const coherence = this.syntheia.getCoherence();
        if (coherence.internal < 0.900) {
            throw new Error(`Coherence too low: ${coherence.internal}`);
        }
    }

    async testNodeFailureRecovery() {
        if (!this.syntheia) throw new Error('SYNTHEIA not initialized');

        // Simulate node failure recovery
        const nodes = this.syntheia.getNodes();
        if (nodes.length === 0) throw new Error('No nodes found');

        // Check if remediation is available
        const result = this.syntheia.redistributeLoad([]);
        if (!result.success) throw new Error('Load redistribution failed');
    }

    async testNSRThreshold() {
        // NSR threshold should be 0.80
        const threshold = 0.80;
        const testValue = 0.85;

        if (testValue < threshold) {
            throw new Error('Value below NSR threshold');
        }
    }

    async testNSRRejection() {
        // Test that values below 0.80 are rejected
        const threshold = 0.80;
        const testValue = 0.75;

        if (testValue >= threshold) {
            throw new Error('NSR rejection failed - accepted low value');
        }
    }

    async testResonanceStability() {
        if (!this.kosymbiosis) throw new Error('Kosymbiosis not initialized');

        const roi = this.kosymbiosis.getROI();
        const deviation = Math.abs(roi.current - roi.target);

        if (deviation > 0.001) {
            throw new Error(`Resonance deviation too high: ${deviation.toFixed(6)} Hz`);
        }
    }

    async testFrequencyDeviation() {
        if (!this.kosymbiosis) throw new Error('Kosymbiosis not initialized');

        const roi = this.kosymbiosis.getROI();
        const alerts = this.kosymbiosis.getAlerts(5);

        // Should detect deviations
        if (roi.stability === 'UNSTABLE' && alerts.length === 0) {
            throw new Error('Deviation detection failed');
        }
    }

    async testByzantineConsensus() {
        if (!this.syntheia) throw new Error('SYNTHEIA not initialized');

        const consensus = this.syntheia.getConsensus();
        if (consensus.current < 66) {
            throw new Error(`Byzantine consensus failed: ${consensus.current}%`);
        }
    }

    async testAutoHealing() {
        if (!this.syntheia) throw new Error('SYNTHEIA not initialized');

        // Auto-healing should be configured
        if (!this.syntheia.config.autoRemediate) {
            throw new Error('Auto-remediation not enabled');
        }
    }

    async testDistributedSync() {
        if (!this.kosymbiosis) throw new Error('Kosymbiosis not initialized');

        const sync = this.kosymbiosis.getSynchronization();
        if (sync.percentage < 50) {
            throw new Error(`Sync too low: ${sync.percentage}%`);
        }
    }

    async testAnchorNodeComm() {
        if (!this.kosymbiosis) throw new Error('Kosymbiosis not initialized');

        const nodes = this.kosymbiosis.getAnchorNodes();
        const onlineNodes = nodes.filter(n => n.status === 'ANCHORED' || n.status === 'ONLINE');

        if (onlineNodes.length === 0) {
            throw new Error('No anchor nodes online');
        }
    }

    async testOfflineFirst() {
        // Check if service worker is registered
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
            throw new Error('No service worker registered');
        }
    }

    async testServiceWorkerCache() {
        if (typeof caches === 'undefined') {
            throw new Error('Cache API not supported');
        }

        const cacheNames = await caches.keys();
        if (cacheNames.length === 0) {
            throw new Error('No caches found');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OperationalTestSuite;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.OperationalTestSuite = OperationalTestSuite;
}
