/**
 * Charts Management
 * Creates and updates Chart.js visualizations
 */

// Wait for DOM and analytics service to load
window.addEventListener('DOMContentLoaded', () => {
    // Initialize charts
    const charts = initializeCharts();
    
    // Initialize analytics service
    analytics.init();
    
    // Set up event listeners
    setupEventListeners(charts);
    
    // Set up periodic updates
    setupPeriodicUpdates(charts);
    
    // Update UI immediately
    updateUI();
});

/**
 * Initialize all charts
 */
function initializeCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#e0e0e0'
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#b0b0b0' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                ticks: { color: '#b0b0b0' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };
    
    // Consensus chart
    const consensusChart = new Chart(
        document.getElementById('consensus-chart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Consensus Omnibus (%)',
                    data: [],
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 99,
                        max: 100.5
                    }
                }
            }
        }
    );
    
    // Wallet chart
    const walletChart = new Chart(
        document.getElementById('wallet-chart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Balance (USD)',
                    data: [],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: commonOptions
        }
    );
    
    // Nodes chart (bar chart for current status)
    const nodesChart = new Chart(
        document.getElementById('nodes-chart'),
        {
            type: 'bar',
            data: {
                labels: ['ONNA', 'LUMSA', 'DELPHOS', 'EPIDAUROS'],
                datasets: [{
                    label: 'Load (%)',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(0, 217, 255, 0.6)',
                        'rgba(0, 255, 136, 0.6)',
                        'rgba(255, 153, 0, 0.6)',
                        'rgba(255, 68, 68, 0.6)'
                    ],
                    borderColor: [
                        '#00d9ff',
                        '#00ff88',
                        '#ff9900',
                        '#ff4444'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0,
                        max: 10
                    }
                }
            }
        }
    );
    
    // Coherence chart
    const coherenceChart = new Chart(
        document.getElementById('coherence-chart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'System Coherence',
                    data: [],
                    borderColor: '#ff9900',
                    backgroundColor: 'rgba(255, 153, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        min: 0.9,
                        max: 1.0
                    }
                }
            }
        }
    );
    
    return {
        consensus: consensusChart,
        wallet: walletChart,
        nodes: nodesChart,
        coherence: coherenceChart
    };
}

/**
 * Set up event listeners
 */
function setupEventListeners(charts) {
    // Connection status
    analytics.on('connected', () => {
        document.getElementById('connection-status').className = 'status-indicator connected';
        document.getElementById('connection-text').textContent = 'Connected';
    });
    
    analytics.on('disconnected', () => {
        document.getElementById('connection-status').className = 'status-indicator disconnected';
        document.getElementById('connection-text').textContent = 'Disconnected';
    });
    
    // Data updates
    analytics.on('sovereignty', (data) => {
        updateMetric('metric-consensus', data.consensusOmnibus.toFixed(1));
        updateMetric('metric-coherence', data.coherenceInternal.toFixed(3));
    });
    
    analytics.on('wallet', (data) => {
        const balanceM = (data.balance / 1000000).toFixed(0);
        updateMetric('metric-wallet', balanceM + 'M');
    });
    
    analytics.on('nodes', (data) => {
        const online = data.nodes.filter(n => n.status === 'online').length;
        updateMetric('metric-nodes', `${online}/${data.nodes.length}`);
        
        // Calculate average latency
        const avgLatency = data.nodes.reduce((sum, n) => sum + (n.ping || 0), 0) / data.nodes.length;
        updateMetric('metric-latency', Math.round(avgLatency));
    });
    
    analytics.on('logs', (logs) => {
        updateLogsDisplay(logs);
    });
    
    // Control buttons
    document.getElementById('pause-btn').addEventListener('click', () => {
        const paused = analytics.togglePause();
        document.getElementById('pause-btn').textContent = paused ? '▶ Resume Updates' : '⏸ Pause Updates';
    });
    
    document.getElementById('clear-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all historical data?')) {
            analytics.clearHistory();
            Object.values(charts).forEach(chart => {
                chart.data.labels = [];
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                chart.update();
            });
        }
    });
    
    // Export buttons
    document.getElementById('export-json').addEventListener('click', () => {
        analytics.exportJSON();
    });
    
    document.getElementById('export-csv').addEventListener('click', () => {
        analytics.exportCSV();
    });
    
    document.getElementById('export-chart').addEventListener('click', () => {
        exportCharts(charts);
    });
    
    // Time range change
    document.getElementById('time-range').addEventListener('change', () => {
        updateAllCharts(charts);
    });
    
    // Refresh rate change
    document.getElementById('refresh-rate').addEventListener('change', (e) => {
        const rate = parseInt(e.target.value);
        clearInterval(window.updateInterval);
        setupPeriodicUpdates(charts, rate);
    });
}

/**
 * Set up periodic updates
 */
function setupPeriodicUpdates(charts, interval = 10000) {
    // Clear existing interval
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
    }
    
    // Update charts periodically
    window.updateInterval = setInterval(() => {
        updateAllCharts(charts);
        updateUI();
    }, interval);
}

/**
 * Update all charts with current data
 */
function updateAllCharts(charts) {
    updateConsensusChart(charts.consensus);
    updateWalletChart(charts.wallet);
    updateNodesChart(charts.nodes);
    updateCoherenceChart(charts.coherence);
}

/**
 * Update consensus chart
 */
function updateConsensusChart(chart) {
    const data = analytics.getHistory('consensus', true);
    const maxPoints = 50;
    const step = Math.max(1, Math.floor(data.length / maxPoints));
    
    const labels = [];
    const values = [];
    
    for (let i = 0; i < data.length; i += step) {
        const item = data[i];
        labels.push(formatTime(item.timestamp));
        values.push(item.value);
    }
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update('none');
}

/**
 * Update wallet chart
 */
function updateWalletChart(chart) {
    const data = analytics.getHistory('wallet', true);
    const maxPoints = 50;
    const step = Math.max(1, Math.floor(data.length / maxPoints));
    
    const labels = [];
    const values = [];
    
    for (let i = 0; i < data.length; i += step) {
        const item = data[i];
        labels.push(formatTime(item.timestamp));
        values.push(item.value);
    }
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update('none');
}

/**
 * Update nodes chart
 */
function updateNodesChart(chart) {
    const data = analytics.getHistory('nodes', true);
    if (data.length === 0) return;
    
    const latest = data[data.length - 1];
    if (!Array.isArray(latest.value)) return;
    
    const loads = latest.value.map(node => node.load || 0);
    chart.data.datasets[0].data = loads;
    chart.update('none');
}

/**
 * Update coherence chart
 */
function updateCoherenceChart(chart) {
    const data = analytics.getHistory('coherence', true);
    const maxPoints = 50;
    const step = Math.max(1, Math.floor(data.length / maxPoints));
    
    const labels = [];
    const values = [];
    
    for (let i = 0; i < data.length; i += step) {
        const item = data[i];
        labels.push(formatTime(item.timestamp));
        values.push(item.value);
    }
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update('none');
}

/**
 * Update UI metrics
 */
function updateUI() {
    document.getElementById('uptime').textContent = analytics.getUptime();
    document.getElementById('data-points').textContent = analytics.metrics.dataPoints;
    document.getElementById('metric-errors').textContent = analytics.getErrorRate();
}

/**
 * Update metric display
 */
function updateMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Update logs display
 */
function updateLogsDisplay(logs) {
    const container = document.getElementById('logs-container');
    const logsArray = Array.isArray(logs) ? logs : [logs];
    
    // Get existing logs
    const allLogs = analytics.history.logs.slice(-50).reverse();
    
    container.innerHTML = '';
    
    allLogs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = formatTime(log.timestamp);
        
        const level = document.createElement('span');
        level.className = `log-level ${log.level}`;
        level.textContent = log.level;
        
        const message = document.createElement('span');
        message.textContent = log.message;
        
        entry.appendChild(timestamp);
        entry.appendChild(level);
        entry.appendChild(message);
        
        container.appendChild(entry);
    });
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

/**
 * Export charts as images
 */
function exportCharts(charts) {
    Object.entries(charts).forEach(([name, chart]) => {
        const url = chart.toBase64Image();
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-${name}-${Date.now()}.png`;
        a.click();
    });
}
