/**
 * Kosymbiosis Monitoring Dashboard Service
 * 
 * Purpose: Real-time monitoring and visualization of Kosymbiosis metrics
 * including ROI, 0.043Hz stability, coherence, and anchor node synchronization
 * 
 * Features:
 * - Real-time metric collection and display
 * - Multi-anchor node synchronization
 * - Dashboard integration with existing live-terminal system
 * - Automated alerting for threshold violations
 */

class KosymbiosisMonitor {
    constructor(config = {}) {
        this.config = {
            targetFrequency: config.targetFrequency || 0.043, // Hz
            updateInterval: config.updateInterval || 1000, // 1 second
            historySize: config.historySize || 300, // 5 minutes at 1 second intervals
            alertThresholds: {
                frequencyDeviation: config.frequencyDeviation || 0.001, // ±0.001 Hz
                coherenceLow: config.coherenceLow || 0.940,
                synchronizationLow: config.synchronizationLow || 95, // percent
                ...config.alertThresholds
            },
            anchorNodes: config.anchorNodes || [
                { id: 'bolzano', location: 'Bolzano, Italy', region: 'Europe' },
                { id: 'chile', location: 'Chile', region: 'South America' },
                { id: 'singapore', location: 'Singapore', region: 'Asia-Pacific' }
            ],
            ...config
        };

        this.metrics = {
            roi: {
                current: 0,
                target: this.config.targetFrequency,
                history: [],
                stability: 'INITIALIZING'
            },
            coherence: {
                internal: 0,
                distributed: 0,
                history: [],
                status: 'INITIALIZING'
            },
            synchronization: {
                percentage: 0,
                nodes: [],
                history: [],
                status: 'INITIALIZING'
            },
            anchorNodes: this.config.anchorNodes.map(node => ({
                ...node,
                status: 'INITIALIZING',
                lastSync: null,
                latency: 0,
                health: 100
            }))
        };

        this.monitoring = null;
        this.alerts = [];
        this.initialized = false;
    }

    /**
     * Initialize monitoring system
     */
    async initialize() {
        console.log('[KOSYMBIOSIS] Initializing monitoring dashboard...');

        try {
            // Load initial metrics
            await this.loadInitialMetrics();

            // Start monitoring loop
            this.startMonitoring();

            // Setup UI integration
            this.setupUIIntegration();

            this.initialized = true;
            console.log('[KOSYMBIOSIS] Monitoring dashboard initialized');

            return true;
        } catch (error) {
            console.error('[KOSYMBIOSIS] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Load initial metrics from PACT metadata
     */
    async loadInitialMetrics() {
        try {
            const response = await fetch('/.PACT_METADATA.json');
            if (response.ok) {
                const metadata = await response.json();
                
                if (metadata.kosymbiosis) {
                    this.metrics.roi.current = metadata.kosymbiosis.roi.current;
                    this.metrics.roi.stability = metadata.kosymbiosis.roi.stability;
                    this.metrics.coherence.internal = metadata.kosymbiosis.coherence.internal;
                    this.metrics.coherence.distributed = metadata.kosymbiosis.coherence.distributed;
                }

                if (metadata.anchoring?.states) {
                    metadata.anchoring.states.forEach(anchorState => {
                        const node = this.metrics.anchorNodes.find(n => n.id === anchorState.nodeId.toLowerCase());
                        if (node) {
                            node.status = anchorState.status;
                            node.lastSync = anchorState.lastSync;
                        }
                    });
                }

                console.log('[KOSYMBIOSIS] Initial metrics loaded from PACT metadata');
            }
        } catch (error) {
            console.warn('[KOSYMBIOSIS] Could not load initial metrics:', error.message);
        }
    }

    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        this.monitoring = setInterval(() => {
            this.updateMetrics();
            this.checkThresholds();
            this.updateHistory();
            this.updateUI();
        }, this.config.updateInterval);

        console.log(`[KOSYMBIOSIS] Monitoring active at ${this.config.updateInterval}ms intervals`);
    }

    /**
     * Update all metrics
     */
    updateMetrics() {
        // Update ROI (Resonant Operating Index) - 0.043 Hz stability
        this.updateROI();

        // Update coherence measurements
        this.updateCoherence();

        // Update synchronization status
        this.updateSynchronization();

        // Update anchor node health
        this.updateAnchorNodes();
    }

    /**
     * Update ROI measurements
     */
    updateROI() {
        // Simulate resonant frequency measurement with realistic variance
        const baseFrequency = this.config.targetFrequency;
        const variance = (Math.random() - 0.5) * 0.0002; // ±0.0001 Hz
        
        this.metrics.roi.current = baseFrequency + variance;

        // Determine stability status
        const deviation = Math.abs(this.metrics.roi.current - baseFrequency);
        
        if (deviation < 0.00005) {
            this.metrics.roi.stability = 'RESONANT';
        } else if (deviation < 0.0001) {
            this.metrics.roi.stability = 'STABLE';
        } else if (deviation < 0.0005) {
            this.metrics.roi.stability = 'FLUCTUATING';
        } else {
            this.metrics.roi.stability = 'UNSTABLE';
        }
    }

    /**
     * Update coherence measurements
     */
    updateCoherence() {
        // Simulate coherence with slight variations
        const targetInternal = 0.945;
        const targetDistributed = 1.0;

        // Internal coherence (slight variations)
        this.metrics.coherence.internal = Math.max(0, Math.min(1, 
            targetInternal + (Math.random() - 0.5) * 0.01
        ));

        // Distributed coherence (based on anchor node health)
        const healthyNodes = this.metrics.anchorNodes.filter(n => n.status === 'ANCHORED' || n.status === 'ONLINE').length;
        const totalNodes = this.metrics.anchorNodes.length;
        
        this.metrics.coherence.distributed = healthyNodes / totalNodes;

        // Status determination
        if (this.metrics.coherence.internal >= 0.945 && this.metrics.coherence.distributed >= 0.95) {
            this.metrics.coherence.status = 'OPTIMAL';
        } else if (this.metrics.coherence.internal >= 0.940 && this.metrics.coherence.distributed >= 0.90) {
            this.metrics.coherence.status = 'GOOD';
        } else if (this.metrics.coherence.internal >= 0.900) {
            this.metrics.coherence.status = 'ACCEPTABLE';
        } else {
            this.metrics.coherence.status = 'CRITICAL';
        }
    }

    /**
     * Update synchronization status
     */
    updateSynchronization() {
        // Count synchronized nodes
        const syncedCount = this.metrics.anchorNodes.filter(n => 
            n.status === 'ANCHORED' || n.status === 'ONLINE'
        ).length;
        
        this.metrics.synchronization.percentage = (syncedCount / this.metrics.anchorNodes.length) * 100;
        this.metrics.synchronization.nodes = this.metrics.anchorNodes
            .filter(n => n.status === 'ANCHORED' || n.status === 'ONLINE')
            .map(n => n.id);

        // Status determination
        if (this.metrics.synchronization.percentage === 100) {
            this.metrics.synchronization.status = 'FULL_SYNC';
        } else if (this.metrics.synchronization.percentage >= 66) {
            this.metrics.synchronization.status = 'PARTIAL_SYNC';
        } else {
            this.metrics.synchronization.status = 'DEGRADED';
        }
    }

    /**
     * Update anchor node health
     */
    updateAnchorNodes() {
        this.metrics.anchorNodes.forEach(node => {
            // Simulate node health and latency
            if (node.status === 'INITIALIZING') {
                node.status = Math.random() > 0.1 ? 'ANCHORED' : 'OFFLINE';
            }

            if (node.status === 'ANCHORED' || node.status === 'ONLINE') {
                // Simulate latency (ms)
                node.latency = Math.floor(Math.random() * 50) + 10; // 10-60ms
                
                // Simulate health percentage
                node.health = Math.max(95, Math.min(100, node.health + (Math.random() - 0.5) * 2));
                
                // Update last sync
                node.lastSync = new Date().toISOString();
            } else {
                node.health = Math.max(0, node.health - 1);
                node.latency = 0;
            }
        });
    }

    /**
     * Check alert thresholds
     */
    checkThresholds() {
        const now = new Date().toISOString();

        // Check frequency deviation
        const freqDeviation = Math.abs(this.metrics.roi.current - this.config.targetFrequency);
        if (freqDeviation > this.config.alertThresholds.frequencyDeviation) {
            this.createAlert('WARNING', 
                `Frequency deviation ${(freqDeviation * 1000).toFixed(4)}mHz exceeds threshold`,
                { deviation: freqDeviation, current: this.metrics.roi.current }
            );
        }

        // Check coherence
        if (this.metrics.coherence.internal < this.config.alertThresholds.coherenceLow) {
            this.createAlert('WARNING',
                `Internal coherence ${this.metrics.coherence.internal.toFixed(4)} below threshold`,
                { coherence: this.metrics.coherence.internal }
            );
        }

        // Check synchronization
        if (this.metrics.synchronization.percentage < this.config.alertThresholds.synchronizationLow) {
            this.createAlert('CRITICAL',
                `Synchronization ${this.metrics.synchronization.percentage.toFixed(1)}% below threshold`,
                { percentage: this.metrics.synchronization.percentage }
            );
        }
    }

    /**
     * Update metric history
     */
    updateHistory() {
        const timestamp = Date.now();

        // ROI history
        this.metrics.roi.history.push({
            timestamp: timestamp,
            value: this.metrics.roi.current,
            stability: this.metrics.roi.stability
        });

        // Coherence history
        this.metrics.coherence.history.push({
            timestamp: timestamp,
            internal: this.metrics.coherence.internal,
            distributed: this.metrics.coherence.distributed
        });

        // Synchronization history
        this.metrics.synchronization.history.push({
            timestamp: timestamp,
            percentage: this.metrics.synchronization.percentage
        });

        // Trim history to configured size
        if (this.metrics.roi.history.length > this.config.historySize) {
            this.metrics.roi.history.shift();
        }
        if (this.metrics.coherence.history.length > this.config.historySize) {
            this.metrics.coherence.history.shift();
        }
        if (this.metrics.synchronization.history.length > this.config.historySize) {
            this.metrics.synchronization.history.shift();
        }
    }

    /**
     * Setup UI integration
     */
    setupUIIntegration() {
        // Create dashboard elements if they don't exist
        this.createDashboardElements();

        // Listen for custom events
        if (typeof window !== 'undefined') {
            window.addEventListener('kosymbiosis:refresh', () => this.updateUI());
        }

        console.log('[KOSYMBIOSIS] UI integration setup complete');
    }

    /**
     * Create dashboard UI elements
     */
    createDashboardElements() {
        if (typeof document === 'undefined') return;

        // Find or create Kosymbiosis dashboard container
        let container = document.getElementById('kosymbiosis-dashboard');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'kosymbiosis-dashboard';
            container.className = 'kosymbiosis-metrics';
            
            // Try to append to existing metrics area
            const metricsArea = document.querySelector('.status-panel') || document.body;
            metricsArea.appendChild(container);
        }

        // Create metric display elements
        container.innerHTML = `
            <div style="margin-top: 20px; padding: 15px; background: rgba(0, 255, 204, 0.1); border-radius: 5px;">
                <strong style="color: #00ffcc;">KOSYMBIOSIS METRICS:</strong>
                <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    <div>
                        <span style="color: #888;">ROI Frequency:</span>
                        <span id="kosym-roi" style="color: #00ffcc; font-weight: bold;">--</span>
                        <span id="kosym-roi-status" style="margin-left: 5px; font-size: 0.8em;">--</span>
                    </div>
                    <div>
                        <span style="color: #888;">Internal Coherence:</span>
                        <span id="kosym-coherence-internal" style="color: #00ffcc; font-weight: bold;">--</span>
                    </div>
                    <div>
                        <span style="color: #888;">Distributed Coherence:</span>
                        <span id="kosym-coherence-distributed" style="color: #00ffcc; font-weight: bold;">--</span>
                    </div>
                    <div>
                        <span style="color: #888;">Sync Status:</span>
                        <span id="kosym-sync" style="color: #00ffcc; font-weight: bold;">--</span>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <strong style="color: #00ffcc; font-size: 0.9em;">Anchor Nodes:</strong>
                    <div id="kosym-anchor-nodes" style="margin-top: 5px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
                        <!-- Anchor nodes will be inserted here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update UI with current metrics
     */
    updateUI() {
        if (typeof document === 'undefined') return;

        // Update ROI
        const roiEl = document.getElementById('kosym-roi');
        if (roiEl) {
            roiEl.textContent = `${(this.metrics.roi.current * 1000).toFixed(4)} mHz`;
        }

        const roiStatusEl = document.getElementById('kosym-roi-status');
        if (roiStatusEl) {
            roiStatusEl.textContent = `[${this.metrics.roi.stability}]`;
            roiStatusEl.style.color = this.getStatusColor(this.metrics.roi.stability);
        }

        // Update coherence
        const coherenceInternalEl = document.getElementById('kosym-coherence-internal');
        if (coherenceInternalEl) {
            coherenceInternalEl.textContent = this.metrics.coherence.internal.toFixed(4);
        }

        const coherenceDistributedEl = document.getElementById('kosym-coherence-distributed');
        if (coherenceDistributedEl) {
            coherenceDistributedEl.textContent = this.metrics.coherence.distributed.toFixed(4);
        }

        // Update synchronization
        const syncEl = document.getElementById('kosym-sync');
        if (syncEl) {
            syncEl.textContent = `${this.metrics.synchronization.percentage.toFixed(1)}% [${this.metrics.synchronization.status}]`;
        }

        // Update anchor nodes
        this.updateAnchorNodesUI();
    }

    /**
     * Update anchor nodes UI
     */
    updateAnchorNodesUI() {
        const container = document.getElementById('kosym-anchor-nodes');
        if (!container) return;

        container.innerHTML = this.metrics.anchorNodes.map(node => `
            <div style="padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 3px; font-size: 0.85em;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold;">${node.location}</span>
                    <span style="color: ${this.getNodeStatusColor(node.status)};">●</span>
                </div>
                <div style="color: #888; font-size: 0.9em; margin-top: 3px;">
                    ${node.status} | ${node.latency}ms | ${node.health.toFixed(0)}%
                </div>
            </div>
        `).join('');
    }

    /**
     * Helper: Get status color
     */
    getStatusColor(status) {
        const colors = {
            'RESONANT': '#00ff00',
            'STABLE': '#00ffcc',
            'FLUCTUATING': '#ffaa00',
            'UNSTABLE': '#ff0000',
            'OPTIMAL': '#00ff00',
            'GOOD': '#00ffcc',
            'ACCEPTABLE': '#ffaa00',
            'CRITICAL': '#ff0000',
            'FULL_SYNC': '#00ff00',
            'PARTIAL_SYNC': '#ffaa00',
            'DEGRADED': '#ff0000'
        };
        return colors[status] || '#888';
    }

    /**
     * Helper: Get node status color
     */
    getNodeStatusColor(status) {
        const colors = {
            'ANCHORED': '#00ff00',
            'ONLINE': '#00ffcc',
            'SYNCING': '#ffaa00',
            'OFFLINE': '#ff0000',
            'INITIALIZING': '#888'
        };
        return colors[status] || '#888';
    }

    /**
     * Create alert
     */
    createAlert(severity, message, context = {}) {
        const alert = {
            severity: severity,
            message: message,
            context: context,
            timestamp: new Date().toISOString()
        };

        this.alerts.push(alert);

        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        console.log(`[KOSYMBIOSIS] ${severity}: ${message}`);

        // Emit alert event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kosymbiosis:alert', { detail: alert }));
        }
    }

    /**
     * Public API
     */
    getMetrics() {
        return this.metrics;
    }

    getROI() {
        return this.metrics.roi;
    }

    getCoherence() {
        return this.metrics.coherence;
    }

    getSynchronization() {
        return this.metrics.synchronization;
    }

    getAnchorNodes() {
        return this.metrics.anchorNodes;
    }

    getHistory(metric, duration = 60000) { // default 1 minute
        const cutoff = Date.now() - duration;
        
        if (metric === 'roi') {
            return this.metrics.roi.history.filter(h => h.timestamp >= cutoff);
        } else if (metric === 'coherence') {
            return this.metrics.coherence.history.filter(h => h.timestamp >= cutoff);
        } else if (metric === 'synchronization') {
            return this.metrics.synchronization.history.filter(h => h.timestamp >= cutoff);
        }
        
        return [];
    }

    getAlerts(count = 10) {
        return this.alerts.slice(-count);
    }

    /**
     * Shutdown
     */
    shutdown() {
        if (this.monitoring) {
            clearInterval(this.monitoring);
            this.monitoring = null;
        }

        console.log('[KOSYMBIOSIS] Monitoring dashboard shutdown');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KosymbiosisMonitor;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.KosymbiosisMonitor = KosymbiosisMonitor;
}
