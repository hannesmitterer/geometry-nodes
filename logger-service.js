/**
 * Distributed Logger Service for Resonance School
 * Handles logging across distributed nodes with sync capabilities
 */

class LoggerService {
    constructor(apiService) {
        this.apiService = apiService;
        this.logBuffer = [];
        this.maxBufferSize = 100;
        this.flushInterval = 5000; // Flush every 5 seconds
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            CRITICAL: 4
        };
        this.currentLevel = this.levels.INFO;
        this.listeners = [];
        
        this.startFlushInterval();
    }

    /**
     * Log debug message
     */
    debug(message, context = {}) {
        return this.log('DEBUG', message, context);
    }

    /**
     * Log info message
     */
    info(message, context = {}) {
        return this.log('INFO', message, context);
    }

    /**
     * Log warning message
     */
    warn(message, context = {}) {
        return this.log('WARN', message, context);
    }

    /**
     * Log error message
     */
    error(message, context = {}) {
        return this.log('ERROR', message, context);
    }

    /**
     * Log critical message
     */
    critical(message, context = {}) {
        return this.log('CRITICAL', message, context);
    }

    /**
     * Core logging function
     */
    log(level, message, context = {}) {
        const levelValue = this.levels[level];
        
        // Check if we should log this level
        if (levelValue < this.currentLevel) {
            return;
        }

        const logEntry = {
            level,
            message,
            context,
            timestamp: Date.now(),
            nodeId: this.apiService.getNodeId(),
            sessionId: this.getSessionId()
        };

        // Add to buffer
        this.logBuffer.push(logEntry);

        // Console output
        this.consoleOutput(logEntry);

        // Notify listeners
        this.notifyListeners(logEntry);

        // Check if buffer is full
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flush();
        }

        return logEntry;
    }

    /**
     * Output to console with formatting
     */
    consoleOutput(logEntry) {
        const { level, message, context, timestamp } = logEntry;
        const timeStr = new Date(timestamp).toISOString();
        
        const styles = {
            DEBUG: 'color: #999',
            INFO: 'color: #00ffcc',
            WARN: 'color: #ffa500',
            ERROR: 'color: #ff4444',
            CRITICAL: 'color: #ff0000; font-weight: bold'
        };

        console.log(
            `%c[${timeStr}] [${level}] ${message}`,
            styles[level],
            context
        );
    }

    /**
     * Notify all registered listeners
     */
    notifyListeners(logEntry) {
        this.listeners.forEach(listener => {
            try {
                listener(logEntry);
            } catch (error) {
                console.error('[LoggerService] Error in listener:', error);
            }
        });
    }

    /**
     * Add listener for log entries
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Flush buffer to remote logging system
     */
    async flush() {
        if (this.logBuffer.length === 0) {
            return;
        }

        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];

        try {
            // Send to API service
            await this.apiService.sendLog({
                entries: logsToSend,
                nodeId: this.apiService.getNodeId(),
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('[LoggerService] Failed to flush logs:', error);
            // Put logs back in buffer for retry
            this.logBuffer.unshift(...logsToSend);
        }
    }

    /**
     * Start automatic flush interval
     */
    startFlushInterval() {
        this.flushIntervalId = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    /**
     * Stop automatic flush interval
     */
    stopFlushInterval() {
        if (this.flushIntervalId) {
            clearInterval(this.flushIntervalId);
            this.flushIntervalId = null;
        }
    }

    /**
     * Get or create session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Set minimum log level
     */
    setLevel(level) {
        if (typeof level === 'string' && this.levels[level] !== undefined) {
            this.currentLevel = this.levels[level];
        } else if (typeof level === 'number') {
            this.currentLevel = level;
        }
    }

    /**
     * Get recent logs from buffer
     */
    getRecentLogs(count = 10) {
        return this.logBuffer.slice(-count);
    }

    /**
     * Clear buffer
     */
    clearBuffer() {
        this.logBuffer = [];
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopFlushInterval();
        this.flush(); // Final flush
        this.listeners = [];
        this.logBuffer = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoggerService;
}
