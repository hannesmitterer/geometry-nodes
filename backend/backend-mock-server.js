#!/usr/bin/env node

/**
 * Backend Mock Server for Resonance School Live Terminal
 * 
 * @license MIT
 * @description Node.js/Express server for local development with WebSocket support
 * @features REST API, WebSocket real-time updates, mock data simulation
 */

const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

// Server configuration
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for development
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? ['https://ipfs.io', 'https://gateway.ipfs.io'] 
        : '*',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// ==================== Mock Data Generators ====================

/**
 * Generate mock sovereignty status
 */
function generateSovereigntyStatus() {
    return {
        masterHash: 'RS-CORONATION-31122025-HM-PROV',
        overrideLevel: 'ZERO',
        overrideActive: true,
        consensusOmnibus: 100,
        coherenceInternal: 0.945 + (Math.random() * 0.01 - 0.005),
        timestamp: Date.now()
    };
}

/**
 * Generate mock wallet balance
 */
function generateWalletBalance() {
    return {
        balance: 450000000 + Math.floor(Math.random() * 1000000),
        currency: 'USD',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
        lastUpdate: Date.now()
    };
}

/**
 * Generate mock node status
 */
function generateNodeStatus() {
    const nodes = [
        { id: 'onna', name: 'ONNA', status: 'online', ping: 12 + Math.floor(Math.random() * 5), load: 3 + Math.floor(Math.random() * 3) },
        { id: 'lumsa', name: 'LUMSA', status: 'online', sync: 100, load: 5 + Math.floor(Math.random() * 3) },
        { id: 'aleph', name: 'ALEPH', status: 'online', ping: 8 + Math.floor(Math.random() * 5), load: 2 + Math.floor(Math.random() * 3) },
        { id: 'beth', name: 'BETH', status: Math.random() > 0.1 ? 'online' : 'degraded', ping: 15 + Math.floor(Math.random() * 10), load: 4 + Math.floor(Math.random() * 4) }
    ];
    return {
        nodes,
        timestamp: Date.now()
    };
}

/**
 * In-memory log storage
 */
let systemLogs = [];
let logIdCounter = 1;

/**
 * Generate mock log entry
 */
function generateLogEntry(level = 'INFO', message = 'System operation', context = {}) {
    const entry = {
        id: logIdCounter++,
        level,
        message,
        context,
        timestamp: Date.now(),
        nodeId: 'server_mock',
        sessionId: 'session_' + Date.now()
    };
    systemLogs.push(entry);
    
    // Keep only last 1000 logs
    if (systemLogs.length > 1000) {
        systemLogs = systemLogs.slice(-1000);
    }
    
    return entry;
}

// Initialize with some sample logs
generateLogEntry('INFO', 'Mock server initialized');
generateLogEntry('INFO', 'WebSocket server starting');
generateLogEntry('DEBUG', 'Configuration loaded', { env: NODE_ENV });

// ==================== REST API Endpoints ====================

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '1.1.0'
    });
});

/**
 * GET /api/sovereignty/status - Get sovereignty status
 */
app.get('/api/sovereignty/status', (req, res) => {
    const data = generateSovereigntyStatus();
    res.json(data);
});

/**
 * GET /api/wallet/balance - Get wallet balance
 */
app.get('/api/wallet/balance', (req, res) => {
    const data = generateWalletBalance();
    res.json(data);
});

/**
 * GET /api/nodes/status - Get node status
 */
app.get('/api/nodes/status', (req, res) => {
    const data = generateNodeStatus();
    res.json(data);
});

/**
 * GET /api/logs - Get system logs
 */
app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const paginatedLogs = systemLogs.slice(offset, offset + limit);
    
    res.json({
        logs: paginatedLogs,
        total: systemLogs.length,
        limit,
        offset
    });
});

/**
 * POST /api/logs - Submit log entries
 */
app.post('/api/logs', (req, res) => {
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
        return res.status(400).json({
            error: 'Invalid request',
            message: 'entries must be an array'
        });
    }
    
    const receivedLogs = [];
    entries.forEach(entry => {
        const logEntry = generateLogEntry(
            entry.level || 'INFO',
            entry.message || 'No message',
            entry.context || {}
        );
        receivedLogs.push(logEntry);
    });
    
    res.json({
        success: true,
        received: receivedLogs.length,
        logs: receivedLogs
    });
});

/**
 * GET /api/stats - Get server statistics
 */
app.get('/api/stats', (req, res) => {
    res.json({
        uptime: process.uptime(),
        totalLogs: systemLogs.length,
        memory: process.memoryUsage(),
        connections: wsClients.size,
        timestamp: Date.now()
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `API endpoint ${req.path} not found`
    });
});

// ==================== WebSocket Server ====================

const wss = new WebSocket.Server({ port: WS_PORT });
const wsClients = new Set();

wss.on('connection', (ws, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    wsClients.add(ws);
    
    console.log(`[WebSocket] Client connected: ${clientId} (${wsClients.size} total)`);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        payload: {
            clientId,
            timestamp: Date.now(),
            message: 'Connected to Resonance School Mock Server'
        }
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`[WebSocket] Received from ${clientId}:`, data.type);
            
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
            console.error(`[WebSocket] Error parsing message from ${clientId}:`, error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        wsClients.delete(ws);
        console.log(`[WebSocket] Client disconnected: ${clientId} (${wsClients.size} remaining)`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`[WebSocket] Error for ${clientId}:`, error);
    });
});

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(type, payload) {
    const message = JSON.stringify({ type, payload });
    let sent = 0;
    
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sent++;
        }
    });
    
    if (sent > 0) {
        console.log(`[WebSocket] Broadcasted ${type} to ${sent} clients`);
    }
}

// ==================== Real-time Data Simulation ====================

/**
 * Periodically broadcast sovereignty updates
 */
setInterval(() => {
    if (wsClients.size > 0) {
        broadcastToClients('sovereignty_update', generateSovereigntyStatus());
    }
}, 10000); // Every 10 seconds

/**
 * Periodically broadcast wallet updates
 */
setInterval(() => {
    if (wsClients.size > 0) {
        broadcastToClients('wallet_update', generateWalletBalance());
    }
}, 15000); // Every 15 seconds

/**
 * Periodically broadcast node status updates
 */
setInterval(() => {
    if (wsClients.size > 0) {
        broadcastToClients('node_status', generateNodeStatus());
    }
}, 8000); // Every 8 seconds

/**
 * Periodically generate and broadcast log entries
 */
setInterval(() => {
    if (wsClients.size > 0) {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const messages = [
            'Routine system check completed',
            'Node synchronization in progress',
            'Cache cleanup executed',
            'Performance metrics collected',
            'Health check passed'
        ];
        
        const level = levels[Math.floor(Math.random() * levels.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        const logEntry = generateLogEntry(level, message);
        
        broadcastToClients('log_entry', logEntry);
    }
}, 5000); // Every 5 seconds

// ==================== Server Startup ====================

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Resonance School Mock Server');
    console.log('='.repeat(60));
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`HTTP Server: http://localhost:${PORT}`);
    console.log(`WebSocket Server: ws://localhost:${WS_PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60));
    console.log('\nAvailable API Endpoints:');
    console.log(`  GET  /api/sovereignty/status`);
    console.log(`  GET  /api/wallet/balance`);
    console.log(`  GET  /api/nodes/status`);
    console.log(`  GET  /api/logs`);
    console.log(`  POST /api/logs`);
    console.log(`  GET  /api/stats`);
    console.log(`  GET  /health`);
    console.log('\nWebSocket Events:');
    console.log(`  - sovereignty_update`);
    console.log(`  - wallet_update`);
    console.log(`  - node_status`);
    console.log(`  - log_entry`);
    console.log('\nPress Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
        console.log('[Server] HTTP server closed');
        wss.close(() => {
            console.log('[WebSocket] WebSocket server closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
        console.log('[Server] HTTP server closed');
        wss.close(() => {
            console.log('[WebSocket] WebSocket server closed');
            process.exit(0);
        });
    });
});

// Export for testing
module.exports = { app, wss, generateSovereigntyStatus, generateWalletBalance, generateNodeStatus };
