#!/usr/bin/env node

/**
 * Backend Mock Server for Resonance School Live Monitor
 * Provides REST API endpoints and WebSocket server for real-time updates
 */

const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

// Import middleware
const { getSecurityMiddleware, getCorsOptions, sanitizeInput, validateRequest, securityHeaders } = require('./middleware/security');
const { apiLimiter, strictLimiter, authLimiter, readLimiter } = require('./middleware/rate-limit');
const { verifyToken, optionalAuth, demoLogin, refreshToken } = require('./middleware/auth');
const { validateLogSubmission, validatePagination, validateLogin } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

// Security middleware
app.use(getSecurityMiddleware());
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);
app.use(validateRequest);

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Dynamic data simulation
let sovereigntyData = {
    masterHash: 'RS-CORONATION-31122025-HM-PROV',
    overrideLevel: 'ZERO',
    overrideActive: true,
    consensusOmnibus: 100,
    coherenceInternal: 0.945,
    timestamp: Date.now()
};

let walletData = {
    balance: 450000000,
    currency: 'USD',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
    lastUpdate: Date.now()
};

let nodesData = {
    nodes: [
        { id: 'onna', name: 'ONNA', status: 'online', ping: 12, load: 3 },
        { id: 'lumsa', name: 'LUMSA', status: 'online', sync: 100, load: 5 },
        { id: 'delphos', name: 'DELPHOS', status: 'online', uptime: 99.9, load: 2 },
        { id: 'epidauros', name: 'EPIDAUROS', status: 'online', connections: 42, load: 4 }
    ],
    timestamp: Date.now()
};

let logsData = [];
let logIdCounter = 1;

// Initialize with some sample logs
const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
const logMessages = [
    'System initialized successfully',
    'WebSocket connection established',
    'Sovereignty parameters updated',
    'Wallet balance synchronized',
    'Node health check completed',
    'Cache cleared and refreshed',
    'API endpoint accessed',
    'Background task completed',
    'Data validation successful',
    'Configuration loaded'
];

// Generate initial logs
for (let i = 0; i < 20; i++) {
    logsData.push({
        id: logIdCounter++,
        level: logLevels[Math.floor(Math.random() * logLevels.length)],
        message: logMessages[Math.floor(Math.random() * logMessages.length)],
        timestamp: Date.now() - (20 - i) * 60000, // Logs from last 20 minutes
        nodeId: `node_${Math.random().toString(36).substring(7)}`,
        sessionId: `session_${Math.random().toString(36).substring(7)}`
    });
}

// API Endpoints

/**
 * GET /api/sovereignty/status
 * Returns sovereignty parameters
 */
app.get('/api/sovereignty/status', readLimiter, securityHeaders, (req, res) => {
    sovereigntyData.timestamp = Date.now();
    res.json(sovereigntyData);
});

/**
 * GET /api/wallet/balance
 * Returns wallet information
 */
app.get('/api/wallet/balance', readLimiter, securityHeaders, (req, res) => {
    walletData.lastUpdate = Date.now();
    res.json(walletData);
});

/**
 * GET /api/nodes/status
 * Returns node health status
 */
app.get('/api/nodes/status', readLimiter, securityHeaders, (req, res) => {
    nodesData.timestamp = Date.now();
    res.json(nodesData);
});

/**
 * GET /api/logs
 * Returns system logs with pagination
 */
app.get('/api/logs', readLimiter, validatePagination, securityHeaders, (req, res) => {
    const limit = req.query.limit;
    const offset = req.query.offset;
    
    // Sort logs by timestamp descending (newest first)
    const sortedLogs = logsData.sort((a, b) => b.timestamp - a.timestamp);
    const paginatedLogs = sortedLogs.slice(offset, offset + limit);
    
    res.json({
        logs: paginatedLogs,
        total: logsData.length,
        limit: limit,
        offset: offset
    });
});

/**
 * POST /api/logs
 * Submit log entries
 */
app.post('/api/logs', strictLimiter, validateLogSubmission, securityHeaders, (req, res) => {
    const { entries } = req.body;
    
    const addedLogs = [];
    
    entries.forEach(entry => {
        const log = {
            id: logIdCounter++,
            level: entry.level || 'INFO',
            message: entry.message || '',
            timestamp: entry.timestamp || Date.now(),
            nodeId: entry.nodeId || 'unknown',
            sessionId: entry.sessionId || 'unknown',
            context: entry.context || {}
        };
        
        logsData.push(log);
        addedLogs.push(log);
    });
    
    // Broadcast to WebSocket clients
    broadcast({
        type: 'log_entry',
        payload: addedLogs
    });
    
    res.status(201).json({
        success: true,
        added: addedLogs.length,
        logs: addedLogs
    });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

/**
 * POST /api/auth/login
 * Demo login endpoint (for testing)
 */
app.post('/api/auth/login', authLimiter, validateLogin, demoLogin);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
app.post('/api/auth/refresh', apiLimiter, refreshToken);

/**
 * GET /api/auth/verify
 * Verify token validity
 */
app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log(`[WebSocket] Client connected. Total clients: ${clients.size + 1}`);
    clients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        payload: {
            message: 'Connected to Resonance School Live Monitor',
            timestamp: Date.now()
        }
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`[WebSocket] Received:`, data);
            
            // Handle subscription requests
            if (data.type === 'subscribe') {
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    payload: {
                        channels: data.channels,
                        timestamp: Date.now()
                    }
                }));
            }
        } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Total clients: ${clients.size}`);
    });
    
    ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
    });
});

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcast(message) {
    const payload = JSON.stringify(message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Data mutation simulation
// Periodically update values to simulate real-time changes
setInterval(() => {
    // Fluctuate consensus slightly
    const consensusChange = (Math.random() - 0.5) * 0.5;
    sovereigntyData.consensusOmnibus = Math.max(99, Math.min(100, sovereigntyData.consensusOmnibus + consensusChange));
    
    // Fluctuate coherence
    const coherenceChange = (Math.random() - 0.5) * 0.01;
    sovereigntyData.coherenceInternal = Math.max(0.9, Math.min(1.0, sovereigntyData.coherenceInternal + coherenceChange));
    
    sovereigntyData.timestamp = Date.now();
    
    broadcast({
        type: 'sovereignty_update',
        payload: sovereigntyData
    });
}, 10000); // Every 10 seconds

setInterval(() => {
    // Fluctuate wallet balance slightly
    const balanceChange = Math.floor((Math.random() - 0.5) * 1000000);
    walletData.balance = Math.max(0, walletData.balance + balanceChange);
    walletData.lastUpdate = Date.now();
    
    broadcast({
        type: 'wallet_update',
        payload: walletData
    });
}, 15000); // Every 15 seconds

setInterval(() => {
    // Update node status randomly
    nodesData.nodes.forEach(node => {
        if (node.ping !== undefined) {
            node.ping = Math.max(5, Math.min(50, node.ping + Math.floor((Math.random() - 0.5) * 10)));
        }
        if (node.load !== undefined) {
            node.load = Math.max(0, Math.min(10, node.load + Math.floor((Math.random() - 0.5) * 2)));
        }
        if (node.sync !== undefined) {
            node.sync = Math.max(95, Math.min(100, node.sync + Math.floor((Math.random() - 0.5) * 2)));
        }
    });
    
    nodesData.timestamp = Date.now();
    
    broadcast({
        type: 'node_status',
        payload: nodesData
    });
}, 20000); // Every 20 seconds

// Periodic log generation
setInterval(() => {
    const newLog = {
        id: logIdCounter++,
        level: logLevels[Math.floor(Math.random() * 3)], // Mostly DEBUG, INFO, WARN
        message: logMessages[Math.floor(Math.random() * logMessages.length)],
        timestamp: Date.now(),
        nodeId: `node_${Math.random().toString(36).substring(7)}`,
        sessionId: `session_${Math.random().toString(36).substring(7)}`
    };
    
    logsData.push(newLog);
    
    // Keep only last 1000 logs
    if (logsData.length > 1000) {
        logsData = logsData.slice(-1000);
    }
    
    broadcast({
        type: 'log_entry',
        payload: [newLog]
    });
}, 5000); // Every 5 seconds

// Start HTTP server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('Resonance School Backend Mock Server');
    console.log('='.repeat(60));
    console.log(`HTTP API Server running on http://localhost:${PORT}`);
    console.log(`WebSocket Server running on ws://localhost:${WS_PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  http://localhost:${PORT}/api/sovereignty/status`);
    console.log(`  GET  http://localhost:${PORT}/api/wallet/balance`);
    console.log(`  GET  http://localhost:${PORT}/api/nodes/status`);
    console.log(`  GET  http://localhost:${PORT}/api/logs?limit=50&offset=0`);
    console.log(`  POST http://localhost:${PORT}/api/logs`);
    console.log(`  POST http://localhost:${PORT}/api/auth/login`);
    console.log(`  POST http://localhost:${PORT}/api/auth/refresh`);
    console.log(`  GET  http://localhost:${PORT}/api/auth/verify`);
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log('');
    
    // Only show demo credentials in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('Demo credentials:');
        console.log('  Admin: username=admin, password=resonance2025');
        console.log('  Viewer: username=viewer, password=viewer2025');
        console.log('');
    }
    
    console.log(`WebSocket: ws://localhost:${WS_PORT}`);
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing servers...');
    wss.close(() => {
        console.log('WebSocket server closed');
    });
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing servers...');
    wss.close(() => {
        console.log('WebSocket server closed');
    });
    process.exit(0);
});
