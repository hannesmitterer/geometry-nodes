# API Reference

## Resonance School Live Terminal - API Documentation

**Version:** 1.1.0  
**Base URL:** `http://localhost:3000` (development)  
**WebSocket URL:** `ws://localhost:3001` (development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [REST API Endpoints](#rest-api-endpoints)
3. [WebSocket API](#websocket-api)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

### JWT Authentication

For protected endpoints (not implemented in mock server):

```http
Authorization: Bearer <jwt_token>
```

### API Key Authentication

Alternative authentication method:

```http
X-API-Key: <your_api_key>
```

---

## REST API Endpoints

### Health Check

#### `GET /health`

Check server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1704556800000,
  "uptime": 123.45,
  "version": "1.1.0"
}
```

**Status Codes:**
- `200 OK` - Server is healthy

---

### Sovereignty Status

#### `GET /api/sovereignty/status`

Get current sovereignty parameters.

**Response:**
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

**Status Codes:**
- `200 OK` - Success

**Rate Limit:** 100 requests per 15 minutes

---

### Wallet Balance

#### `GET /api/wallet/balance`

Get wallet balance and information.

**Response:**
```json
{
  "balance": 450000000,
  "currency": "USD",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "lastUpdate": 1704556800000
}
```

**Status Codes:**
- `200 OK` - Success

**Rate Limit:** 100 requests per 15 minutes

---

### Node Status

#### `GET /api/nodes/status`

Get health status of all nodes.

**Response:**
```json
{
  "nodes": [
    {
      "id": "onna",
      "name": "ONNA",
      "status": "online",
      "ping": 12,
      "load": 3
    },
    {
      "id": "lumsa",
      "name": "LUMSA",
      "status": "online",
      "sync": 100,
      "load": 5
    }
  ],
  "timestamp": 1704556800000
}
```

**Status Codes:**
- `200 OK` - Success

**Rate Limit:** 100 requests per 15 minutes

---

### System Logs

#### `GET /api/logs`

Retrieve system logs with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of logs to return (max 100) |
| `offset` | integer | 0 | Offset for pagination |

**Example Request:**
```http
GET /api/logs?limit=20&offset=0
```

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "level": "INFO",
      "message": "System initialized",
      "context": {},
      "timestamp": 1704556800000,
      "nodeId": "server_mock",
      "sessionId": "session_1704556800000"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters

**Rate Limit:** 100 requests per 15 minutes

---

#### `POST /api/logs`

Submit log entries to the system.

**Request Body:**
```json
{
  "entries": [
    {
      "level": "INFO",
      "message": "User action completed",
      "context": {
        "action": "login",
        "userId": "user123"
      },
      "timestamp": 1704556800000,
      "nodeId": "node_abc123",
      "sessionId": "session_xyz789"
    }
  ]
}
```

**Log Levels:**
- `DEBUG` - Detailed debugging information
- `INFO` - General informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages
- `CRITICAL` - Critical issues requiring immediate attention

**Response:**
```json
{
  "success": true,
  "received": 1,
  "logs": [
    {
      "id": 151,
      "level": "INFO",
      "message": "User action completed",
      "context": {
        "action": "login",
        "userId": "user123"
      },
      "timestamp": 1704556800000,
      "nodeId": "node_abc123",
      "sessionId": "session_xyz789"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request body

**Rate Limit:** 100 requests per 15 minutes

---

### Server Statistics

#### `GET /api/stats`

Get server statistics and metrics.

**Response:**
```json
{
  "uptime": 12345.67,
  "totalLogs": 150,
  "memory": {
    "rss": 50331648,
    "heapTotal": 16777216,
    "heapUsed": 8388608,
    "external": 1048576
  },
  "connections": 5,
  "timestamp": 1704556800000
}
```

**Status Codes:**
- `200 OK` - Success

**Rate Limit:** 100 requests per 15 minutes

---

## WebSocket API

### Connection

Connect to WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Events

#### Connected

Sent when client successfully connects.

```json
{
  "type": "connected",
  "payload": {
    "clientId": "client_1704556800000_abc123",
    "timestamp": 1704556800000,
    "message": "Connected to Resonance School Mock Server"
  }
}
```

#### Subscribe

Client sends to subscribe to channels.

**Request:**
```json
{
  "type": "subscribe",
  "channels": ["sovereignty", "wallet", "nodes", "logs"]
}
```

**Response:**
```json
{
  "type": "subscribed",
  "payload": {
    "channels": ["sovereignty", "wallet", "nodes", "logs"],
    "timestamp": 1704556800000
  }
}
```

#### Sovereignty Update

Broadcast every 10 seconds.

```json
{
  "type": "sovereignty_update",
  "payload": {
    "masterHash": "RS-CORONATION-31122025-HM-PROV",
    "overrideLevel": "ZERO",
    "overrideActive": true,
    "consensusOmnibus": 100,
    "coherenceInternal": 0.945,
    "timestamp": 1704556800000
  }
}
```

#### Wallet Update

Broadcast every 15 seconds.

```json
{
  "type": "wallet_update",
  "payload": {
    "balance": 450000000,
    "currency": "USD",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
    "lastUpdate": 1704556800000
  }
}
```

#### Node Status

Broadcast every 8 seconds.

```json
{
  "type": "node_status",
  "payload": {
    "nodes": [...],
    "timestamp": 1704556800000
  }
}
```

#### Log Entry

Broadcast every 5 seconds (new log entries).

```json
{
  "type": "log_entry",
  "payload": {
    "id": 152,
    "level": "INFO",
    "message": "Routine system check completed",
    "context": {},
    "timestamp": 1704556800000,
    "nodeId": "server_mock",
    "sessionId": "session_1704556800000"
  }
}
```

---

## Data Models

### SovereigntyStatus

| Field | Type | Description |
|-------|------|-------------|
| `masterHash` | string | Master hash identifier |
| `overrideLevel` | string | Override level (e.g., "ZERO") |
| `overrideActive` | boolean | Whether override is active |
| `consensusOmnibus` | number | Consensus level (0-100) |
| `coherenceInternal` | number | Internal coherence (0-1) |
| `timestamp` | number | Unix timestamp in milliseconds |

### WalletBalance

| Field | Type | Description |
|-------|------|-------------|
| `balance` | number | Wallet balance |
| `currency` | string | Currency code (e.g., "USD") |
| `walletAddress` | string | Ethereum wallet address |
| `lastUpdate` | number | Unix timestamp in milliseconds |

### NodeStatus

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Node identifier |
| `name` | string | Node display name |
| `status` | string | Status: "online", "offline", "degraded" |
| `ping` | number | Ping latency in milliseconds (optional) |
| `load` | number | System load (optional) |
| `sync` | number | Sync percentage (optional) |

### LogEntry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Auto | Log entry ID |
| `level` | string | Yes | Log level |
| `message` | string | Yes | Log message (max 1000 chars) |
| `context` | object | No | Additional context data |
| `timestamp` | number | Auto | Unix timestamp in milliseconds |
| `nodeId` | string | No | Originating node ID |
| `sessionId` | string | No | Session identifier |

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific error for this field"
    }
  ]
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Invalid credentials |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |

---

## Rate Limiting

### Limits

- **API Endpoints:** 100 requests per 15 minutes per IP
- **Health Check:** 300 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes per IP

### Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704557700000
```

### Exceeding Limits

When rate limit is exceeded:

```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later."
}
```

**Status Code:** `429 Too Many Requests`

---

## Examples

### Complete Workflow Example

```javascript
// 1. Check server health
const healthResponse = await fetch('http://localhost:3000/health');
const health = await healthResponse.json();
console.log('Server status:', health.status);

// 2. Fetch sovereignty status
const sovereigntyResponse = await fetch('http://localhost:3000/api/sovereignty/status');
const sovereignty = await sovereigntyResponse.json();
console.log('Consensus:', sovereignty.consensusOmnibus);

// 3. Submit a log entry
const logResponse = await fetch('http://localhost:3000/api/logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entries: [{
      level: 'INFO',
      message: 'Application started'
    }]
  })
});
const logResult = await logResponse.json();
console.log('Log submitted:', logResult.success);

// 4. Connect to WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['sovereignty', 'wallet', 'nodes', 'logs']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`Received ${data.type}:`, data.payload);
};
```

---

## Support

For issues or questions:
- **GitHub Issues:** https://github.com/hannesmitterer/geometry-nodes
- **Matrix Room:** #resonance-school:matrix.org
- **Documentation:** See DEVELOPMENT_GUIDE.md

---

**Last Updated:** 2026-01-06  
**License:** MIT
