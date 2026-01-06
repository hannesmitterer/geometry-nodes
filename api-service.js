/**
 * API Service Layer for Resonance School Live Monitor
 * Handles dynamic data fetching and WebSocket connections
 */

class APIService {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'https://api.resonance.school';
        this.wsURL = config.wsURL || 'wss://api.resonance.school/ws';
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.listeners = new Map();
    }

    /**
     * Initialize WebSocket connection for real-time updates
     */
    initWebSocket() {
        try {
            this.ws = new WebSocket(this.wsURL);
            
            this.ws.onopen = () => {
                console.log('[APIService] WebSocket connected');
                this.reconnectAttempts = 0;
                this.emit('connected', { timestamp: Date.now() });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('[APIService] Failed to parse message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[APIService] WebSocket error:', error);
                this.emit('error', { error, timestamp: Date.now() });
            };

            this.ws.onclose = () => {
                console.log('[APIService] WebSocket disconnected');
                this.emit('disconnected', { timestamp: Date.now() });
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('[APIService] WebSocket initialization failed:', error);
            this.attemptReconnect();
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'sovereignty_update':
                this.emit('sovereigntyUpdate', payload);
                break;
            case 'wallet_update':
                this.emit('walletUpdate', payload);
                break;
            case 'node_status':
                this.emit('nodeStatus', payload);
                break;
            case 'log_entry':
                this.emit('logEntry', payload);
                break;
            default:
                this.emit('message', data);
        }
    }

    /**
     * Attempt to reconnect WebSocket
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[APIService] Max reconnection attempts reached');
            this.emit('reconnect_failed', { attempts: this.reconnectAttempts });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`[APIService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.initWebSocket();
        }, delay);
    }

    /**
     * Fetch sovereignty status from API
     */
    async fetchSovereigntyStatus() {
        try {
            const response = await fetch(`${this.baseURL}/api/sovereignty/status`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('[APIService] Failed to fetch sovereignty status:', error);
            // Return mock data for offline mode
            return this.getMockSovereigntyData();
        }
    }

    /**
     * Fetch wallet balance
     */
    async fetchWalletBalance() {
        try {
            const response = await fetch(`${this.baseURL}/api/wallet/balance`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('[APIService] Failed to fetch wallet balance:', error);
            return this.getMockWalletData();
        }
    }

    /**
     * Fetch node statuses
     */
    async fetchNodeStatuses() {
        try {
            const response = await fetch(`${this.baseURL}/api/nodes/status`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('[APIService] Failed to fetch node statuses:', error);
            return this.getMockNodeData();
        }
    }

    /**
     * Fetch system logs
     */
    async fetchLogs(options = {}) {
        const { limit = 50, offset = 0 } = options;
        try {
            const response = await fetch(`${this.baseURL}/api/logs?limit=${limit}&offset=${offset}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('[APIService] Failed to fetch logs:', error);
            return this.getMockLogData();
        }
    }

    /**
     * Send log entry to distributed logging system
     */
    async sendLog(logEntry) {
        try {
            const response = await fetch(`${this.baseURL}/api/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...logEntry,
                    timestamp: Date.now(),
                    nodeId: this.getNodeId()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('[APIService] Failed to send log:', error);
            // Queue for retry
            this.queueLogForRetry(logEntry);
        }
    }

    /**
     * Event listener management
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[APIService] Error in ${event} listener:`, error);
            }
        });
    }

    /**
     * Get node ID (from localStorage or generate new one)
     */
    getNodeId() {
        let nodeId = localStorage.getItem('nodeId');
        if (!nodeId) {
            nodeId = 'node_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('nodeId', nodeId);
        }
        return nodeId;
    }

    /**
     * Queue log for retry
     */
    queueLogForRetry(logEntry) {
        const queue = JSON.parse(localStorage.getItem('logQueue') || '[]');
        queue.push(logEntry);
        localStorage.setItem('logQueue', JSON.stringify(queue));
    }

    /**
     * Process queued logs
     */
    async processLogQueue() {
        const queue = JSON.parse(localStorage.getItem('logQueue') || '[]');
        if (queue.length === 0) return;

        for (const logEntry of queue) {
            await this.sendLog(logEntry);
        }
        
        localStorage.setItem('logQueue', JSON.stringify([]));
    }

    /**
     * Mock data generators for offline mode
     */
    getMockSovereigntyData() {
        return {
            masterHash: 'RS-CORONATION-31122025-HM-PROV',
            overrideLevel: 'ZERO',
            overrideActive: true,
            consensusOmnibus: 100,
            coherenceInternal: 0.945,
            timestamp: Date.now()
        };
    }

    getMockWalletData() {
        return {
            balance: 450000000,
            currency: 'USD',
            walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
            lastUpdate: Date.now()
        };
    }

    getMockNodeData() {
        return {
            nodes: [
                { id: 'onna', name: 'ONNA', status: 'online', ping: 12, load: 3 },
                { id: 'lumsa', name: 'LUMSA', status: 'online', sync: 100, load: 5 },
                { id: 'suedtirol', name: 'SUEDTIROL', status: 'online', load: 4 },
                { id: 'berlin', name: 'BERLIN', status: 'online', failover: 'ready' }
            ],
            timestamp: Date.now()
        };
    }

    getMockLogData() {
        return {
            logs: [
                { id: 1, message: 'System initialized', level: 'info', timestamp: Date.now() - 300000 },
                { id: 2, message: 'WebSocket connected', level: 'info', timestamp: Date.now() - 240000 },
                { id: 3, message: 'Node sync complete', level: 'success', timestamp: Date.now() - 180000 }
            ]
        };
    }

    /**
     * Cleanup
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}
