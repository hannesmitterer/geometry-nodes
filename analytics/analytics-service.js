/**
 * Analytics Service
 * Handles data collection, storage, and real-time updates
 */

class AnalyticsService {
    constructor(config = {}) {
        this.apiBaseURL = config.apiBaseURL || 'http://localhost:3000';
        this.wsURL = config.wsURL || 'ws://localhost:3001';
        this.ws = null;
        this.connected = false;
        this.paused = false;
        
        // Historical data storage
        this.history = {
            consensus: [],
            wallet: [],
            coherence: [],
            nodes: [],
            logs: []
        };
        
        // Metrics
        this.metrics = {
            startTime: Date.now(),
            dataPoints: 0,
            latency: 0,
            errors: 0,
            requests: 0
        };
        
        // Load historical data from localStorage
        this.loadHistory();
        
        // Event listeners
        this.listeners = new Map();
    }
    
    /**
     * Initialize WebSocket connection
     */
    init() {
        this.connectWebSocket();
        this.fetchInitialData();
    }
    
    /**
     * Connect to WebSocket server
     */
    connectWebSocket() {
        try {
            this.ws = new WebSocket(this.wsURL);
            
            this.ws.onopen = () => {
                console.log('[Analytics] WebSocket connected');
                this.connected = true;
                this.emit('connected');
                
                // Subscribe to all channels
                this.ws.send(JSON.stringify({
                    type: 'subscribe',
                    channels: ['sovereignty', 'wallet', 'nodes', 'logs']
                }));
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('[Analytics] Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('[Analytics] WebSocket error:', error);
                this.metrics.errors++;
            };
            
            this.ws.onclose = () => {
                console.log('[Analytics] WebSocket disconnected');
                this.connected = false;
                this.emit('disconnected');
                
                // Reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };
        } catch (error) {
            console.error('[Analytics] WebSocket connection failed:', error);
            setTimeout(() => this.connectWebSocket(), 5000);
        }
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(data) {
        if (this.paused) return;
        
        const { type, payload } = data;
        
        switch (type) {
            case 'sovereignty_update':
                this.addDataPoint('consensus', payload.consensusOmnibus, payload.timestamp);
                this.addDataPoint('coherence', payload.coherenceInternal, payload.timestamp);
                this.emit('sovereignty', payload);
                break;
                
            case 'wallet_update':
                this.addDataPoint('wallet', payload.balance, payload.lastUpdate);
                this.emit('wallet', payload);
                break;
                
            case 'node_status':
                this.addDataPoint('nodes', payload.nodes, payload.timestamp);
                this.emit('nodes', payload);
                break;
                
            case 'log_entry':
                this.addLogs(payload);
                this.emit('logs', payload);
                break;
        }
        
        this.metrics.dataPoints++;
        this.saveHistory();
    }
    
    /**
     * Fetch initial data from API
     */
    async fetchInitialData() {
        try {
            const startTime = Date.now();
            
            // Fetch all data in parallel
            const [sovereignty, wallet, nodes, logs] = await Promise.all([
                this.fetchJSON('/api/sovereignty/status'),
                this.fetchJSON('/api/wallet/balance'),
                this.fetchJSON('/api/nodes/status'),
                this.fetchJSON('/api/logs?limit=50')
            ]);
            
            // Calculate latency
            this.metrics.latency = Date.now() - startTime;
            this.metrics.requests += 4;
            
            // Add initial data points
            if (sovereignty) {
                this.addDataPoint('consensus', sovereignty.consensusOmnibus, sovereignty.timestamp);
                this.addDataPoint('coherence', sovereignty.coherenceInternal, sovereignty.timestamp);
                this.emit('sovereignty', sovereignty);
            }
            
            if (wallet) {
                this.addDataPoint('wallet', wallet.balance, wallet.lastUpdate);
                this.emit('wallet', wallet);
            }
            
            if (nodes) {
                this.addDataPoint('nodes', nodes.nodes, nodes.timestamp);
                this.emit('nodes', nodes);
            }
            
            if (logs && logs.logs) {
                this.addLogs(logs.logs);
                this.emit('logs', logs.logs);
            }
            
            this.saveHistory();
        } catch (error) {
            console.error('[Analytics] Error fetching initial data:', error);
            this.metrics.errors++;
        }
    }
    
    /**
     * Fetch JSON from API
     */
    async fetchJSON(endpoint) {
        const response = await fetch(this.apiBaseURL + endpoint);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }
    
    /**
     * Add data point to history
     */
    addDataPoint(type, value, timestamp = Date.now()) {
        if (!this.history[type]) {
            this.history[type] = [];
        }
        
        this.history[type].push({
            value,
            timestamp
        });
        
        // Keep only data from the time range
        const maxAge = this.getMaxAge();
        const cutoff = Date.now() - maxAge;
        this.history[type] = this.history[type].filter(item => item.timestamp > cutoff);
    }
    
    /**
     * Add logs to history
     */
    addLogs(logs) {
        const logsArray = Array.isArray(logs) ? logs : [logs];
        this.history.logs.push(...logsArray);
        
        // Keep only last 500 logs
        if (this.history.logs.length > 500) {
            this.history.logs = this.history.logs.slice(-500);
        }
    }
    
    /**
     * Get max age based on time range
     */
    getMaxAge() {
        const timeRange = document.getElementById('time-range')?.value || '24h';
        const ranges = {
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        return ranges[timeRange] || ranges['24h'];
    }
    
    /**
     * Get filtered history based on time range
     */
    getHistory(type, timeRange = null) {
        if (!this.history[type]) return [];
        
        if (!timeRange) {
            return this.history[type];
        }
        
        const maxAge = this.getMaxAge();
        const cutoff = Date.now() - maxAge;
        
        return this.history[type].filter(item => item.timestamp > cutoff);
    }
    
    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem('analytics_history', JSON.stringify(this.history));
            localStorage.setItem('analytics_metrics', JSON.stringify(this.metrics));
        } catch (error) {
            console.error('[Analytics] Error saving history:', error);
        }
    }
    
    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const savedHistory = localStorage.getItem('analytics_history');
            if (savedHistory) {
                this.history = JSON.parse(savedHistory);
            }
            
            const savedMetrics = localStorage.getItem('analytics_metrics');
            if (savedMetrics) {
                const metrics = JSON.parse(savedMetrics);
                this.metrics = { ...this.metrics, ...metrics };
            }
        } catch (error) {
            console.error('[Analytics] Error loading history:', error);
        }
    }
    
    /**
     * Clear all history
     */
    clearHistory() {
        this.history = {
            consensus: [],
            wallet: [],
            coherence: [],
            nodes: [],
            logs: []
        };
        
        this.metrics.dataPoints = 0;
        
        localStorage.removeItem('analytics_history');
        localStorage.removeItem('analytics_metrics');
        
        this.emit('history_cleared');
    }
    
    /**
     * Pause/resume updates
     */
    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }
    
    /**
     * Export data as JSON
     */
    exportJSON() {
        const data = {
            timestamp: Date.now(),
            metrics: this.metrics,
            history: this.history
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Export data as CSV
     */
    exportCSV() {
        let csv = 'Timestamp,Type,Value\n';
        
        // Export consensus data
        this.history.consensus.forEach(item => {
            csv += `${new Date(item.timestamp).toISOString()},Consensus,${item.value}\n`;
        });
        
        // Export wallet data
        this.history.wallet.forEach(item => {
            csv += `${new Date(item.timestamp).toISOString()},Wallet,${item.value}\n`;
        });
        
        // Export coherence data
        this.history.coherence.forEach(item => {
            csv += `${new Date(item.timestamp).toISOString()},Coherence,${item.value}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Get uptime in human-readable format
     */
    getUptime() {
        const uptime = Date.now() - this.metrics.startTime;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
    
    /**
     * Get error rate
     */
    getErrorRate() {
        if (this.metrics.requests === 0) return 0;
        return ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2);
    }
    
    /**
     * Event system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

// Initialize analytics service
const analytics = new AnalyticsService();
