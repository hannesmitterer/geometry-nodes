# Live Monitor Terminal - Technical Documentation

## Overview

The Live Monitor Terminal is a decentralized, real-time monitoring system for the Resonance School's sovereignty infrastructure. It integrates dynamic backend services, distributed logging, and IPFS deployment capabilities.

## Architecture

### Core Components

1. **API Service (`api-service.js`)**
   - RESTful API integration
   - WebSocket real-time communication
   - Automatic reconnection handling
   - Offline mode with mock data
   - Request queuing for failed operations

2. **Logger Service (`logger-service.js`)**
   - Multi-level logging (DEBUG, INFO, WARN, ERROR, CRITICAL)
   - Distributed log synchronization
   - Automatic buffer flushing
   - Local buffering for offline scenarios
   - Real-time log streaming to UI

3. **Notification Service (`notification-service.js`)**
   - Browser notifications
   - Visual in-app notifications
   - Audio alerts
   - Countdown triggers
   - Automatic event notifications

4. **Live Terminal Integration (`live-terminal.js`)**
   - Main orchestration layer
   - Service initialization and coordination
   - UI updates and event handling
   - Periodic data synchronization

5. **Service Worker (`service-worker.js`)**
   - Offline-first architecture
   - Asset caching
   - Network fallback handling
   - PWA support

## Features

### Dynamic Backend Integration

The system fetches and updates data in real-time using:

- **REST API Endpoints:**
  - `/api/sovereignty/status` - Sovereignty parameters
  - `/api/wallet/balance` - Wallet information
  - `/api/nodes/status` - Node health status
  - `/api/logs` - System logs

- **WebSocket Events:**
  - `sovereignty_update` - Real-time sovereignty changes
  - `wallet_update` - Balance updates
  - `node_status` - Node health changes
  - `log_entry` - Live log streaming

### Distributed Logging

Logs are synchronized across distributed nodes with:

- Multi-level severity filtering
- Automatic batching and flushing
- Retry mechanism for failed transmissions
- Local buffering during network outages
- Session and node identification

### Countdown & Notifications

Automatic triggers at configurable intervals:

- 1 hour before target time
- 10 minutes before target time
- Exact target time (Coronation)
- Custom trigger registration

Notification types:
- Browser push notifications (requires permission)
- Visual in-app notifications
- Audio alerts (configurable)

### IPFS Deployment

Decentralized hosting with:

- Content-addressed immutability
- Global accessibility
- Offline-first architecture
- Service Worker caching
- PWA manifest

## Installation & Setup

### Prerequisites

```bash
# No build tools required - pure JavaScript
# Optional: Python for local testing
python3 --version

# Optional: IPFS for deployment
ipfs --version
```

### Local Development

```bash
# Clone repository
git clone https://github.com/hannesmitterer/geometry-nodes.git
cd geometry-nodes

# Serve locally
python3 -m http.server 8080

# Open browser
# Navigate to http://localhost:8080
```

### Configuration

Edit configuration in `live-terminal.js`:

```javascript
this.apiService = new APIService({
    baseURL: 'https://api.resonance.school',  // Your API endpoint
    wsURL: 'wss://api.resonance.school/ws'    // Your WebSocket endpoint
});
```

## API Requirements

### Backend API Specification

Your backend should implement the following endpoints:

#### GET /api/sovereignty/status
Returns sovereignty parameters:
```json
{
  "masterHash": "RS-CORONATION-31122025-HM-PROV",
  "overrideLevel": "ZERO",
  "overrideActive": true,
  "consensusOmnibus": 100,
  "coherenceInternal": 0.945,
  "timestamp": 1704556800000
}
```

#### GET /api/wallet/balance
Returns wallet information:
```json
{
  "balance": 450000000,
  "currency": "USD",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "lastUpdate": 1704556800000
}
```

#### GET /api/nodes/status
Returns node health:
```json
{
  "nodes": [
    { "id": "onna", "name": "ONNA", "status": "online", "ping": 12, "load": 3 },
    { "id": "lumsa", "name": "LUMSA", "status": "online", "sync": 100, "load": 5 }
  ],
  "timestamp": 1704556800000
}
```

#### GET /api/logs?limit=50&offset=0
Returns system logs:
```json
{
  "logs": [
    {
      "id": 1,
      "message": "System initialized",
      "level": "INFO",
      "timestamp": 1704556800000
    }
  ]
}
```

#### POST /api/logs
Submit log entries:
```json
{
  "entries": [
    {
      "level": "INFO",
      "message": "Log message",
      "context": {},
      "timestamp": 1704556800000,
      "nodeId": "node_abc123",
      "sessionId": "session_xyz789"
    }
  ]
}
```

### WebSocket Protocol

Connect to: `wss://api.resonance.school/ws`

**Outgoing Messages:**
```json
{
  "type": "subscribe",
  "channels": ["sovereignty", "wallet", "nodes", "logs"]
}
```

**Incoming Messages:**
```json
{
  "type": "sovereignty_update",
  "payload": { "consensusOmnibus": 100 }
}
```

Message types:
- `sovereignty_update`
- `wallet_update`
- `node_status`
- `log_entry`

## Offline Mode

When backend services are unavailable, the system automatically switches to offline mode:

- Mock data is displayed
- Operations are queued locally
- Automatic reconnection attempts
- Queued operations sync when reconnected

## Browser Compatibility

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Required features:
- WebSocket API
- Service Worker API
- Notification API (optional)
- Web Audio API (optional)
- LocalStorage/SessionStorage

## Security Considerations

1. **HTTPS Required**: All production deployments must use HTTPS
2. **WebSocket Security**: Use WSS (WebSocket Secure)
3. **CORS Configuration**: Backend must allow frontend origin
4. **Content Security Policy**: Configure CSP headers appropriately
5. **API Authentication**: Implement token-based auth for sensitive endpoints

## Performance Optimization

- **Lazy Loading**: Services initialize on-demand
- **Debouncing**: UI updates are throttled
- **Buffering**: Logs are batched before transmission
- **Caching**: Service Worker caches static assets
- **Compression**: Enable gzip/brotli on server

## Monitoring & Debugging

### Browser Console

Enable debug logging:
```javascript
window.liveTerminal.logger.setLevel('DEBUG');
```

### View Logs
```javascript
// Get recent logs
window.liveTerminal.logger.getRecentLogs(20);

// Get notifications
window.liveTerminal.notificationService.getNotifications();
```

### Check Connection Status
```javascript
// WebSocket status
console.log(window.liveTerminal.apiService.ws?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

## Deployment

See [IPFS_DEPLOYMENT.md](./IPFS_DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment:
```bash
# Add to IPFS
ipfs add -r .

# Pin content
ipfs pin add <CID>

# Access via gateway
https://ipfs.io/ipfs/<CID>
```

## Testing

### Manual Testing

1. Open browser console
2. Check for initialization messages
3. Verify WebSocket connection
4. Test notifications (grant permission)
5. Test offline mode (disconnect network)
6. Verify log display
7. Check countdown functionality

### Mock Backend Testing

The system includes mock data for testing without a backend:

```javascript
// Force offline mode
window.liveTerminal.apiService.disconnect();

// Mock data will be used automatically
```

## Troubleshooting

### WebSocket Won't Connect
- Check URL is correct and accessible
- Verify WSS for HTTPS pages
- Check CORS headers
- Review browser console errors

### Service Worker Not Registering
- Must use HTTPS or localhost
- Check browser compatibility
- Verify service-worker.js path
- Clear browser cache

### Notifications Not Showing
- Grant browser permission
- Check notification settings
- Verify HTTPS (required for notifications)

### Logs Not Displaying
- Check `#log-container` element exists
- Verify logger service initialized
- Check browser console for errors

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - See LICENSE file

## Support

- Matrix Room: #resonance-school:matrix.org
- GitHub Issues: https://github.com/hannesmitterer/geometry-nodes
- Documentation: See this README and IPFS_DEPLOYMENT.md

## Changelog

### Version 1.0.0
- Initial release
- API Service integration
- WebSocket real-time updates
- Distributed logging
- Notification system
- IPFS deployment support
- Service Worker offline mode
- PWA manifest
