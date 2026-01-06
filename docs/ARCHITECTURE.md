# System Architecture

## Resonance School Live Terminal - Architecture Documentation

**Version:** 1.1.0  
**Last Updated:** 2026-01-06

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Diagram](#component-diagram)
4. [Data Flow](#data-flow)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Technology Stack](#technology-stack)

---

## Overview

The Resonance School Live Terminal is a decentralized, real-time monitoring system built with a modern client-server architecture. The system supports offline-first operations through Progressive Web App (PWA) technologies and IPFS deployment.

### Key Characteristics

- **Decentralized:** IPFS-deployable, content-addressed
- **Real-time:** WebSocket bidirectional communication
- **Offline-first:** Service Worker caching, local buffering
- **Secure:** JWT authentication, rate limiting, input validation
- **Scalable:** Stateless design, horizontal scaling capable

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Browser (PWA)                                               │
│  ├── index.html (UI)                                         │
│  ├── Service Worker (Offline Support)                       │
│  ├── Live Terminal (Orchestration)                          │
│  ├── API Service (REST/WebSocket Client)                    │
│  ├── Logger Service (Distributed Logging)                   │
│  └── Notification Service (Alerts)                          │
└─────────────────────────────────────────────────────────────┘
                           ▲  ▼
                    HTTP/HTTPS + WSS
                           ▲  ▼
┌─────────────────────────────────────────────────────────────┐
│                       Server Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Express Server (Node.js)                                    │
│  ├── REST API Endpoints                                      │
│  ├── WebSocket Server                                        │
│  ├── Security Middleware                                     │
│  ├── Compression Middleware                                  │
│  ├── Cache Strategy                                          │
│  └── Data Simulators                                         │
└─────────────────────────────────────────────────────────────┘
                           ▲  ▼
                      Optional Backend
                           ▲  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Storage Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ├── LocalStorage (Client-side persistence)                  │
│  ├── SessionStorage (Session data)                           │
│  ├── Memory Cache (Server-side)                             │
│  └── Optional: Redis/Database                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Diagram

### Client Components

```
┌──────────────────┐
│   index.html     │ ◄── Main UI
└────────┬─────────┘
         │
    ┌────▼────────────────────────────────┐
    │   Live Terminal (Orchestrator)      │
    └────┬────────────────────────────────┘
         │
    ┌────┴─────┬──────────┬──────────────┐
    │          │          │              │
┌───▼───┐  ┌──▼───┐  ┌───▼────┐  ┌─────▼─────┐
│  API  │  │Logger│  │Notific.│  │  Service  │
│Service│  │Service│ │Service │  │  Worker   │
└───────┘  └──────┘  └────────┘  └───────────┘
```

### Server Components

```
┌─────────────────────────────────────┐
│    Express Application              │
└┬────────────────────────────────────┘
 │
 ├─► Helmet (Security Headers)
 ├─► CORS (Cross-Origin)
 ├─► Compression (Gzip/Brotli)
 ├─► Rate Limiter
 ├─► Body Parser
 │
 ├─► REST API Routes
 │   ├── /health
 │   ├── /api/sovereignty/status
 │   ├── /api/wallet/balance
 │   ├── /api/nodes/status
 │   ├── /api/logs (GET/POST)
 │   └── /api/stats
 │
 ├─► Security Middleware
 │   ├── JWT Authentication
 │   ├── API Key Validation
 │   ├── Input Sanitization
 │   └── Audit Logging
 │
 ├─► Cache Strategy
 │   └── Memory Cache
 │
 └─► WebSocket Server (Separate Port)
     ├── Connection Management
     ├── Message Routing
     └── Broadcast System
```

---

## Data Flow

### REST API Flow

```
┌─────────┐                ┌──────────┐              ┌──────────┐
│ Browser │                │  Express │              │  Data    │
│ Client  │                │  Server  │              │Generator │
└────┬────┘                └─────┬────┘              └─────┬────┘
     │                           │                         │
     │ GET /api/sovereignty      │                         │
     │──────────────────────────►│                         │
     │                           │                         │
     │                           │ Generate Mock Data      │
     │                           │────────────────────────►│
     │                           │                         │
     │                           │◄────────────────────────│
     │                           │  Return Data            │
     │   200 OK + JSON           │                         │
     │◄──────────────────────────│                         │
     │                           │                         │
```

### WebSocket Flow

```
┌─────────┐                ┌──────────┐              ┌──────────┐
│ Browser │                │WebSocket │              │Broadcast │
│ Client  │                │  Server  │              │  Timer   │
└────┬────┘                └─────┬────┘              └─────┬────┘
     │                           │                         │
     │ WebSocket Connect         │                         │
     │──────────────────────────►│                         │
     │                           │                         │
     │ ◄─ Connected Message ─────│                         │
     │                           │                         │
     │ Subscribe to channels     │                         │
     │──────────────────────────►│                         │
     │                           │                         │
     │ ◄─ Subscribed Confirm ────│                         │
     │                           │                         │
     │                           │   Timer Tick            │
     │                           │◄────────────────────────│
     │                           │                         │
     │ ◄─ sovereignty_update ────│                         │
     │                           │                         │
     │ ◄─ wallet_update ─────────│                         │
     │                           │                         │
```

### Logging Flow

```
┌─────────┐        ┌──────────┐        ┌──────────┐
│ Logger  │        │   API    │        │  Server  │
│ Service │        │ Service  │        │          │
└────┬────┘        └─────┬────┘        └─────┬────┘
     │                   │                   │
     │ log("message")    │                   │
     │──────────────────►│                   │
     │                   │                   │
     │                   │ Buffer locally    │
     │                   │ (if offline)      │
     │                   │                   │
     │                   │ POST /api/logs    │
     │                   │──────────────────►│
     │                   │                   │
     │                   │  200 OK           │
     │                   │◄──────────────────│
     │                   │                   │
```

---

## Backend Architecture

### Server Components

#### Express Server
- **Purpose:** HTTP request handling
- **Features:**
  - REST API endpoints
  - Static file serving
  - Middleware pipeline
- **Port:** 3000 (configurable)

#### WebSocket Server
- **Purpose:** Real-time bidirectional communication
- **Features:**
  - Multiple client support
  - Event broadcasting
  - Automatic reconnection support
- **Port:** 3001 (configurable)

#### Security Middleware
- **Components:**
  - JWT token generation/validation
  - API key management
  - Rate limiting
  - Input validation (Joi)
  - Request sanitization
  - Audit logging

#### Data Layer
- **Mock Data Generators:**
  - Sovereignty status
  - Wallet balance
  - Node status
  - System logs
- **Caching:**
  - In-memory cache
  - TTL-based expiration
  - Pattern-based invalidation

---

## Frontend Architecture

### Client Components

#### Live Terminal (Orchestrator)
- **Purpose:** Main application controller
- **Responsibilities:**
  - Service initialization
  - Event coordination
  - UI updates
  - State management

#### API Service
- **Purpose:** Backend communication
- **Features:**
  - REST API calls
  - WebSocket management
  - Automatic reconnection
  - Offline fallback
  - Request queueing

#### Logger Service
- **Purpose:** Distributed logging
- **Features:**
  - Multi-level logging
  - Local buffering
  - Automatic flushing
  - Remote synchronization

#### Notification Service
- **Purpose:** User notifications
- **Features:**
  - Browser notifications
  - Visual alerts
  - Audio notifications
  - Countdown triggers

#### Service Worker
- **Purpose:** Offline support
- **Features:**
  - Asset caching
  - Network fallback
  - Update management
  - PWA capabilities

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────┐
│  Layer 1: Network Security              │
│  - HTTPS/WSS encryption                 │
│  - CORS restrictions                    │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│  Layer 2: Application Security          │
│  - Helmet security headers              │
│  - Rate limiting                        │
│  - Input validation                     │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│  Layer 3: Authentication & Authorization│
│  - JWT tokens                           │
│  - API keys                             │
│  - Session management                   │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│  Layer 4: Data Security                 │
│  - Input sanitization                   │
│  - XSS prevention                       │
│  - SQL/NoSQL injection prevention       │
└─────────────────────────────────────────┘
```

### Security Features

1. **Transport Security**
   - TLS 1.3 for HTTPS
   - WSS for WebSocket
   - Certificate validation

2. **Authentication**
   - JWT with expiration
   - API key rotation
   - Session tokens

3. **Authorization**
   - Role-based access control (RBAC)
   - Endpoint permissions
   - Resource-level access

4. **Input Validation**
   - Joi schema validation
   - Type checking
   - Length limits
   - Pattern matching

5. **Output Encoding**
   - HTML entity encoding
   - JSON sanitization
   - XSS prevention

6. **Audit Trail**
   - Request logging
   - Security events
   - Access tracking

---

## Deployment Architecture

### IPFS Deployment

```
┌─────────────────────────────────────────┐
│         IPFS Network                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Content-Addressed Storage        │ │
│  │  - Static Assets                  │ │
│  │  - HTML/CSS/JS                    │ │
│  │  - Service Worker                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Gateway Nodes                    │ │
│  │  - ipfs.io                        │ │
│  │  - gateway.ipfs.io                │ │
│  │  - Custom gateways                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ▼
      Global Accessibility
```

### Docker Deployment (Optional)

```
┌─────────────────────────────────────────┐
│  Docker Container                       │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Node.js Runtime                  │ │
│  │  - Express Server                 │ │
│  │  - WebSocket Server               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Static Assets                    │ │
│  │  - Frontend files                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| UI | HTML5, CSS3 | User interface |
| Logic | ES6+ JavaScript | Client-side logic |
| Offline | Service Worker | PWA support |
| Storage | LocalStorage, SessionStorage | Client persistence |
| Real-time | WebSocket API | Live updates |

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 16+ | JavaScript execution |
| Server | Express 4.x | HTTP server |
| WebSocket | ws 8.x | WebSocket server |
| Security | Helmet, JWT, Joi | Security layer |
| Compression | compression | Response compression |

### Testing

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Unit Tests | Jest | JavaScript testing |
| Integration | Supertest | API testing |
| E2E | Playwright | Browser automation |
| Load Testing | Artillery | Performance testing |

### DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| VCS | Git | Version control |
| CI/CD | GitHub Actions | Automation |
| Container | Docker | Containerization |
| Deployment | IPFS | Decentralized hosting |

---

## Performance Considerations

### Caching Strategy

- **Service Worker:** Cache-first for static assets
- **Memory Cache:** Server-side caching with TTL
- **HTTP Headers:** Appropriate cache-control headers

### Optimization Techniques

- **Compression:** Gzip/Brotli for responses
- **Minification:** Minified production assets
- **Lazy Loading:** On-demand module loading
- **Debouncing:** Throttled UI updates
- **Batching:** Grouped log transmissions

### Scalability

- **Stateless Design:** No server-side session storage
- **Horizontal Scaling:** Multiple server instances
- **Load Balancing:** Reverse proxy distribution
- **CDN:** IPFS global distribution

---

## Monitoring & Observability

### Metrics

- Server uptime
- Request rate
- Error rate
- WebSocket connections
- Memory usage
- Cache hit rate

### Logging

- Application logs (multi-level)
- Access logs
- Error logs
- Audit logs
- Security events

---

## Future Architecture Enhancements

### Planned Improvements

1. **Database Integration**
   - PostgreSQL for persistent storage
   - Redis for caching
   - Time-series DB for metrics

2. **Microservices**
   - Separate sovereignty service
   - Dedicated logging service
   - Analytics service

3. **Advanced Security**
   - OAuth2 integration
   - Two-factor authentication
   - Advanced threat detection

4. **Enhanced Real-time**
   - WebRTC for peer-to-peer
   - Socket.io for advanced features
   - Server-Sent Events (SSE)

---

## References

- [API Reference](./API_REFERENCE.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Technical Documentation](../TECHNICAL_DOCS.md)

---

**Last Updated:** 2026-01-06  
**License:** MIT
