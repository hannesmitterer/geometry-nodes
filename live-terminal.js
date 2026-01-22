/**
 * Live Terminal Integration
 * Main orchestration file for Resonance School Live Monitor
 */

class LiveTerminal {
    constructor() {
        this.apiService = null;
        this.logger = null;
        this.notificationService = null;
        this.syntheiaGovernance = null;
        this.kosymbiosisMonitor = null;
        this.updateInterval = null;
        this.coronationDate = new Date("2025-12-31T12:00:00Z");
        this.initialized = false;
    }

    /**
     * Initialize the live terminal
     */
    async init() {
        try {
            console.log('[LiveTerminal] Initializing...');

            // Initialize API Service
            this.apiService = new APIService({
                baseURL: 'https://api.resonance.school',
                wsURL: 'wss://api.resonance.school/ws'
            });

            // Initialize Logger
            this.logger = new LoggerService(this.apiService);
            this.logger.info('Live Terminal initializing');

            // Initialize Notification Service
            this.notificationService = new NotificationService(this.logger);

            // Initialize SYNTHEIA Autonomous Governance (if available)
            if (typeof SyntheiaGovernance !== 'undefined') {
                this.syntheiaGovernance = new SyntheiaGovernance();
                await this.syntheiaGovernance.initialize();
                this.logger.info('SYNTHEIA Autonomous Governance initialized');
            }

            // Initialize Kosymbiosis Monitoring (if available)
            if (typeof KosymbiosisMonitor !== 'undefined') {
                this.kosymbiosisMonitor = new KosymbiosisMonitor();
                await this.kosymbiosisMonitor.initialize();
                this.logger.info('Kosymbiosis Monitor initialized');
            }

            // Setup WebSocket listeners
            this.setupWebSocketListeners();

            // Initialize WebSocket connection
            this.apiService.initWebSocket();

            // Initial data load
            await this.loadInitialData();

            // Setup countdown triggers
            this.setupCountdownTriggers();

            // Start periodic updates
            this.startPeriodicUpdates();

            // Register service worker for offline support
            this.registerServiceWorker();

            this.initialized = true;
            this.logger.info('Live Terminal initialized successfully');
            
            this.notificationService.notify(
                'Live Terminal Active',
                {
                    body: 'Resonance School monitoring system is now online',
                    type: 'success'
                }
            );

        } catch (error) {
            console.error('[LiveTerminal] Initialization failed:', error);
            this.logger.error('Initialization failed', { error: error.message });
        }
    }

    /**
     * Setup WebSocket event listeners
     */
    setupWebSocketListeners() {
        this.apiService.on('connected', () => {
            this.logger.info('WebSocket connected');
            this.updateConnectionStatus('connected');
        });

        this.apiService.on('disconnected', () => {
            this.logger.warn('WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
        });

        this.apiService.on('error', (data) => {
            this.logger.error('WebSocket error', data);
        });

        this.apiService.on('sovereigntyUpdate', (data) => {
            this.logger.info('Sovereignty update received', data);
            this.updateSovereigntyDisplay(data);
        });

        this.apiService.on('walletUpdate', (data) => {
            this.logger.info('Wallet update received', data);
            this.updateWalletDisplay(data);
        });

        this.apiService.on('nodeStatus', (data) => {
            this.logger.info('Node status update received', data);
            this.updateNodeDisplay(data);
        });

        this.apiService.on('logEntry', (data) => {
            this.addLogToDisplay(data);
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // Fetch sovereignty status
            const sovereignty = await this.apiService.fetchSovereigntyStatus();
            this.updateSovereigntyDisplay(sovereignty);

            // Fetch wallet balance
            const wallet = await this.apiService.fetchWalletBalance();
            this.updateWalletDisplay(wallet);

            // Fetch node statuses
            const nodes = await this.apiService.fetchNodeStatuses();
            this.updateNodeDisplay(nodes);

            // Fetch logs
            const logs = await this.apiService.fetchLogs({ limit: 10 });
            this.displayLogs(logs);

            this.logger.info('Initial data loaded');
        } catch (error) {
            this.logger.error('Failed to load initial data', { error: error.message });
        }
    }

    /**
     * Update sovereignty display
     */
    updateSovereigntyDisplay(data) {
        const elements = {
            masterHash: document.getElementById('mhc-display'),
            overrideStatus: document.getElementById('override-status'),
            consensus: document.getElementById('consensus-display')
        };

        if (elements.masterHash) {
            elements.masterHash.textContent = data.masterHash || 'RS-CORONATION-31122025-HM-PROV';
        }

        if (elements.overrideStatus) {
            elements.overrideStatus.textContent = data.overrideActive ? 'ATTIVO' : 'INATTIVO';
        }

        if (elements.consensus) {
            elements.consensus.textContent = `${data.consensusOmnibus || 100}%`;
        }
    }

    /**
     * Update wallet display
     */
    updateWalletDisplay(data) {
        const element = document.getElementById('wallet-balance');
        if (element) {
            element.textContent = `$${(data.balance || 0).toLocaleString()}`;
        }
    }

    /**
     * Update node status display
     */
    updateNodeDisplay(data) {
        if (!data.nodes) return;

        data.nodes.forEach(node => {
            const nodeElement = document.getElementById(`node-${node.id}`);
            if (nodeElement) {
                const statusDot = nodeElement.querySelector('.node-pulse');
                if (statusDot) {
                    statusDot.className = node.status === 'online' 
                        ? 'h-2 w-2 rounded-full bg-green-500 node-pulse'
                        : 'h-2 w-2 rounded-full bg-red-500';
                }
            }
        });
    }

    /**
     * Display logs
     */
    displayLogs(data) {
        if (!data.logs) return;
        
        data.logs.forEach(log => {
            this.addLogToDisplay(log);
        });
    }

    /**
     * Add single log entry to display
     */
    addLogToDisplay(log) {
        const logContainer = document.getElementById('log-container');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.style.cssText = `
            padding: 5px 10px;
            border-bottom: 1px solid rgba(0, 255, 204, 0.1);
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
        `;

        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        const levelColor = {
            DEBUG: '#999',
            INFO: '#00ffcc',
            WARN: '#ffa500',
            ERROR: '#ff4444',
            CRITICAL: '#ff0000'
        };

        // Create spans safely without innerHTML
        const timestampSpan = document.createElement('span');
        timestampSpan.style.color = '#666';
        timestampSpan.textContent = `[${timestamp}]`;
        
        const levelSpan = document.createElement('span');
        levelSpan.style.color = levelColor[log.level] || '#00ffcc';
        levelSpan.textContent = `[${log.level || 'INFO'}]`;
        
        const messageSpan = document.createElement('span');
        messageSpan.style.color = '#ccc';
        messageSpan.textContent = log.message;

        logEntry.appendChild(timestampSpan);
        logEntry.appendChild(document.createTextNode(' '));
        logEntry.appendChild(levelSpan);
        logEntry.appendChild(document.createTextNode(' '));
        logEntry.appendChild(messageSpan);

        logContainer.insertBefore(logEntry, logContainer.firstChild);

        // Keep only last 50 logs
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    /**
     * Update connection status in UI
     */
    updateConnectionStatus(status) {
        const element = document.getElementById('connection-status');
        if (element) {
            element.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
            element.style.color = status === 'connected' ? '#00ff00' : '#ff4444';
        }
    }

    /**
     * Setup countdown triggers
     */
    setupCountdownTriggers() {
        const now = Date.now();
        const targetTime = this.coronationDate.getTime();

        // Warning at 1 hour before
        this.notificationService.registerCountdownTrigger(
            'one-hour-warning',
            targetTime - (60 * 60 * 1000),
            () => {
                this.logger.warn('Coronation in 1 hour');
            },
            {
                notifications: [{
                    title: 'Coronation Approaching',
                    options: {
                        body: 'One hour until Coronation Day',
                        type: 'warning',
                        sound: 'warning'
                    }
                }]
            }
        );

        // Warning at 10 minutes before
        this.notificationService.registerCountdownTrigger(
            'ten-minute-warning',
            targetTime - (10 * 60 * 1000),
            () => {
                this.logger.warn('Coronation in 10 minutes');
            },
            {
                notifications: [{
                    title: 'Coronation Imminent',
                    options: {
                        body: '10 minutes until Coronation Day',
                        type: 'warning',
                        sound: 'warning'
                    }
                }]
            }
        );

        // Coronation moment
        this.notificationService.registerCountdownTrigger(
            'coronation',
            targetTime,
            () => {
                this.logger.critical('CORONATION IN CORSO - SOVRANITÀ ATTIVA');
                this.onCoronation();
            },
            {
                notifications: [{
                    title: 'CORONATION DAY',
                    options: {
                        body: 'Sovereignty is now ACTIVE',
                        type: 'critical',
                        sound: 'success',
                        browser: true
                    }
                }]
            }
        );

        // Start monitoring
        this.notificationService.startMonitoring();
    }

    /**
     * Handle coronation event
     */
    onCoronation() {
        document.body.style.boxShadow = "inset 0 0 100px #00ffcc";
        
        // Trigger visual effects
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.innerHTML = "CORONATION IN CORSO - SOVRANITÀ ATTIVA";
            timerElement.style.color = "#00ffcc";
            timerElement.style.fontWeight = "bold";
        }

        // Log the event
        this.apiService.sendLog({
            level: 'CRITICAL',
            message: 'CORONATION COMPLETE - SOVEREIGNTY ACTIVE',
            context: {
                timestamp: Date.now(),
                masterHash: 'RS-CORONATION-31122025-HM-PROV'
            }
        });
    }

    /**
     * Start periodic updates
     */
    startPeriodicUpdates() {
        // Update every 30 seconds
        this.updateInterval = setInterval(async () => {
            try {
                await this.loadInitialData();
                await this.apiService.processLogQueue();
            } catch (error) {
                this.logger.error('Periodic update failed', { error: error.message });
            }
        }, 30000);

        this.logger.info('Periodic updates started');
    }

    /**
     * Stop periodic updates
     */
    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            this.logger.info('Periodic updates stopped');
        }
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                this.logger.info('Service Worker registered', { scope: registration.scope });
            } catch (error) {
                this.logger.error('Service Worker registration failed', { error: error.message });
            }
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopPeriodicUpdates();
        
        if (this.apiService) {
            this.apiService.disconnect();
        }
        
        if (this.logger) {
            this.logger.destroy();
        }
        
        if (this.notificationService) {
            this.notificationService.destroy();
        }

        if (this.syntheiaGovernance) {
            this.syntheiaGovernance.shutdown();
        }

        if (this.kosymbiosisMonitor) {
            this.kosymbiosisMonitor.shutdown();
        }

        this.initialized = false;
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.liveTerminal = new LiveTerminal();
            window.liveTerminal.init();
        });
    } else {
        window.liveTerminal = new LiveTerminal();
        window.liveTerminal.init();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveTerminal;
}
