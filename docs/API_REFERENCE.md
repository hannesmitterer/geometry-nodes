# API Reference

Complete API documentation for the Resonance School Live Monitor backend services.

## Base URLs

- Production: `https://api.resonance.school`
- Development: `http://localhost:3000`
- WebSocket: `ws://localhost:3001`

## Authentication

Protected endpoints require JWT authentication in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Login
```http
POST /api/auth/login
{
  "username": "admin",
  "password": "resonance2025"
}
```

Response includes `token`, `user` object, and `expiresIn` (24h).

Demo credentials:
- Admin: username=admin, password=resonance2025
- Viewer: username=viewer, password=viewer2025

## Core Endpoints

### Health Check
`GET /health` - Server status and uptime

### Sovereignty
`GET /api/sovereignty/status` - Returns master hash, consensus, coherence

### Wallet
`GET /api/wallet/balance` - Returns balance, currency, wallet address

### Nodes
`GET /api/nodes/status` - Returns array of node objects with status, ping, load

### Logs
`GET /api/logs?limit=50&offset=0` - Paginated logs with filtering

`POST /api/logs` - Submit log entries (requires array of log objects)

## WebSocket Events

Connect to `ws://localhost:3001`

**Subscribe:**
```json
{"type": "subscribe", "channels": ["sovereignty", "wallet", "nodes", "logs"]}
```

**Events received:**
- `sovereignty_update` - Every 10s
- `wallet_update` - Every 15s
- `node_status` - Every 20s
- `log_entry` - Every 5s + on POST

## Rate Limits

- Read endpoints: 300/15min
- Write endpoints: 20/15min  
- Auth endpoints: 5/15min

See TECHNICAL_DOCS.md for detailed specifications.
