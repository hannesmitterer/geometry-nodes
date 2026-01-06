# Resonance School Live Terminal

A decentralized, real-time monitoring system for the Resonance School's sovereignty infrastructure with dynamic backend integration, comprehensive security, and IPFS deployment capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hannesmitterer/geometry-nodes/pulls)

## Features

### Core Capabilities

- **Real-time Monitoring** - Live updates via WebSocket for sovereignty status, wallet balance, and node health
- **Backend Mock Server** - Full-featured Express server with REST API and WebSocket support
- **Security-First** - JWT authentication, rate limiting, input validation, and comprehensive security headers
- **Offline-First** - PWA with Service Worker for offline access and local data persistence
- **Decentralized** - IPFS deployment for content-addressed, censorship-resistant hosting
- **Comprehensive Testing** - Unit, integration, security, and WebSocket tests with 70%+ coverage
- **Production Ready** - Docker containerization, CI/CD pipelines, and monitoring

### Technical Highlights

- **Backend**: Node.js, Express, WebSocket (ws), Security middleware
- **Frontend**: Pure JavaScript (ES6+), No frameworks, PWA-enabled
- **Testing**: Jest, Supertest, Playwright integration
- **Deployment**: Docker, Docker Compose, IPFS, GitHub Actions CI/CD
- **Documentation**: Comprehensive API reference, development guide, architecture docs

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm 8+
- (Optional) Docker for containerized deployment
- (Optional) IPFS for decentralized deployment

### Installation

```bash
# Clone repository
git clone https://github.com/hannesmitterer/geometry-nodes.git
cd geometry-nodes

# Install dependencies
npm install

# Copy environment configuration (optional)
cp .env.example .env
```

### Running the Application

#### Development Mode

**Start Backend Server:**
```bash
npm start
# or with auto-reload
npm run dev
```

Server will start on:
- HTTP API: `http://localhost:3000`
- WebSocket: `ws://localhost:3001`

**Serve Frontend:**
```bash
# Option 1: Python simple server
npm run serve
# Opens on http://localhost:8080

# Option 2: Access via backend
# Open http://localhost:3000/index.html
```

#### Docker Deployment

```bash
# Using Docker Compose
cd deployment
docker-compose up -d

# Access application
# Frontend: http://localhost:80
# Backend: http://localhost:3000
```

#### IPFS Deployment

```bash
# Deploy to IPFS
./deployment/deploy-ipfs.sh --pin

# Access via gateway
# https://ipfs.io/ipfs/<CID>
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:api
npm run test:security
npm run test:integration

# Watch mode
npm run test:watch
```

## Project Structure

```
geometry-nodes/
├── backend/                    # Backend services
│   ├── backend-mock-server.js  # Express + WebSocket server
│   ├── security-middleware.js  # JWT, validation, sanitization
│   ├── compression-middleware.js
│   └── cache-strategy.js
│
├── tests/                      # Test suite
│   ├── test-api.spec.js        # API endpoint tests
│   ├── test-websocket.spec.js  # WebSocket tests
│   ├── test-security.spec.js   # Security tests
│   └── test-integration.spec.js
│
├── docs/                       # Documentation
│   ├── API_REFERENCE.md        # Complete API documentation
│   ├── DEVELOPMENT_GUIDE.md    # Development setup guide
│   ├── ARCHITECTURE.md         # System architecture
│   ├── TROUBLESHOOTING.md      # Common issues & solutions
│   └── CHANGELOG.md            # Version history
│
├── deployment/                 # Deployment configs
│   ├── Dockerfile              # Container image
│   ├── docker-compose.yml      # Multi-container orchestration
│   ├── nginx.conf              # Reverse proxy config
│   ├── deploy-ipfs.sh          # IPFS deployment script
│   └── README.md               # Deployment guide
│
├── config/                     # Configuration management
│   ├── config.example.json     # Config template
│   ├── config-validator.js     # Schema validation
│   └── environment-manager.js  # Multi-environment support
│
├── .github/workflows/          # CI/CD pipelines
│   ├── ci-cd.yml               # Main CI/CD pipeline
│   ├── codeql-analysis.yml     # Security scanning
│   └── dependency-review.yml   # Dependency checks
│
├── index.html                  # Main application UI
├── api-service.js              # API client
├── logger-service.js           # Logging service
├── notification-service.js     # Notification system
├── live-terminal.js            # Main orchestrator
├── service-worker.js           # PWA offline support
└── package.json                # Dependencies & scripts
```

## API Documentation

### REST Endpoints

- `GET /health` - Health check
- `GET /api/sovereignty/status` - Sovereignty parameters
- `GET /api/wallet/balance` - Wallet information
- `GET /api/nodes/status` - Node health status
- `GET /api/logs` - Retrieve system logs
- `POST /api/logs` - Submit log entries
- `GET /api/stats` - Server statistics

### WebSocket Events

- `sovereignty_update` - Real-time sovereignty changes (every 10s)
- `wallet_update` - Balance updates (every 15s)
- `node_status` - Node health changes (every 8s)
- `log_entry` - Live log streaming (every 5s)

See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete documentation.

## Configuration

### Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

Key configurations:
```env
PORT=3000                    # HTTP server port
WS_PORT=3001                 # WebSocket port
JWT_SECRET=your-secret       # JWT signing secret
NODE_ENV=development         # Environment
```

### Configuration Files

- `config/config.example.json` - Base configuration template
- `config/config.development.json` - Development overrides
- `config/config.production.json` - Production overrides

See [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) for details.

## Development

### Prerequisites

```bash
node --version    # >= 16.0.0
npm --version     # >= 8.0.0
```

### Development Workflow

1. Create feature branch
2. Make changes and add tests
3. Run linting and tests
4. Commit with conventional commits
5. Push and create PR

### Scripts

```bash
npm start           # Start backend server
npm run dev         # Development mode
npm test            # Run all tests
npm run lint        # Code linting
npm run format      # Code formatting
npm run serve       # Serve frontend
```

See [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) for complete guide.

## Deployment

### Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### IPFS

```bash
# Deploy with pinning
./deployment/deploy-ipfs.sh --pin

# Update existing deployment
./deployment/deploy-ipfs.sh --update
```

See [deployment/README.md](deployment/README.md) for detailed instructions.

## Security

### Security Features

- **JWT Authentication** - Token-based auth with expiration
- **Rate Limiting** - Per-endpoint and per-IP limits
- **Input Validation** - Joi schema validation
- **XSS Prevention** - Input sanitization
- **Security Headers** - Helmet.js integration
- **CORS Protection** - Configurable origin whitelist

### Security Testing

```bash
# Run security tests
npm run test:security

# CodeQL scanning (in CI/CD)
# Automated dependency review
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for security architecture.

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## Documentation

- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Setup and development
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues
- **[Changelog](docs/CHANGELOG.md)** - Version history

## Support

- **Issues**: [GitHub Issues](https://github.com/hannesmitterer/geometry-nodes/issues)
- **Matrix**: #resonance-school:matrix.org
- **Documentation**: See [docs/](docs/) directory

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the Resonance School sovereignty infrastructure
- Implements decentralized, self-reliant architecture
- Follows progressive web app best practices
- Security-first design with comprehensive testing

---

**Status**: ✅ Production Ready

**Version**: 1.1.0

**Last Updated**: 2026-01-06
