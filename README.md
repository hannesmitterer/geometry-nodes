# Resonance School - Live Monitor Terminal

Enterprise-grade decentralized monitoring system for the Resonance School sovereignty infrastructure.

## 🌟 Features

- **Live Monitoring** - Real-time updates via WebSocket
- **Analytics Dashboard** - Interactive charts and metrics
- **Backend API** - RESTful API with JWT authentication
- **Security** - Rate limiting, input validation, Helmet.js
- **IPFS Deployment** - Decentralized hosting support
- **Docker Ready** - Complete containerization setup
- **Comprehensive Testing** - Unit, integration, and performance tests

## 📊 Components

### Frontend
- Live terminal interface (index.html)
- Analytics dashboard (analytics/dashboard.html)
- Real-time Chart.js visualizations
- Service Worker for offline support

### Backend
- Express.js REST API server
- WebSocket server for live updates
- JWT authentication
- Rate limiting and security middleware
- Input validation with Joi

### Services
- API Service - Dynamic data fetching
- Logger Service - Distributed logging
- Notification Service - Alerts and countdown
- Analytics Service - Historical data tracking

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
# Create environment file
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env

# Start all services
docker-compose up -d

# Access
# Frontend: http://localhost:8080
# Analytics: http://localhost:8080/analytics/
# API: http://localhost:3000
# Health: http://localhost:3000/health
```

### Local Development
```bash
# Install dependencies
npm install

# Start backend (Terminal 1)
npm run backend

# Start frontend (Terminal 2)
npm run serve

# Run tests
npm test
npm run test:api
npm run test:websocket
```

## 📖 Documentation

- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[Security Guide](docs/SECURITY.md)** - Security best practices
- **[Technical Docs](TECHNICAL_DOCS.md)** - Architecture and specifications
- **[IPFS Deployment](IPFS_DEPLOYMENT.md)** - IPFS setup guide

## 🧪 Testing

```bash
# Unit tests
npm test

# API integration tests (requires backend running)
npm run test:api

# WebSocket tests (requires backend running)
npm run test:websocket

# Performance tests
npm run test:performance

# All tests
npm run test:all
```

## 📦 Project Structure

```
geometry-nodes/
├── analytics/              # Analytics dashboard
│   ├── dashboard.html
│   ├── analytics-service.js
│   └── charts.js
├── backend/               # Backend services
│   ├── server.js
│   └── middleware/        # Security, auth, validation
├── deployment/            # Deployment scripts
│   ├── deploy-ipfs.sh
│   ├── nginx.conf
│   └── README.md
├── docs/                  # Documentation
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── SECURITY.md
├── tests/                 # Test suites
│   ├── api/
│   ├── websocket/
│   ├── e2e/
│   └── performance/
├── .github/workflows/     # CI/CD pipelines
├── Dockerfile
├── docker-compose.yml
├── index.html             # Main interface
└── package.json
```

## 🔒 Security

- Helmet.js security headers
- Rate limiting on all endpoints
- JWT authentication
- Input validation and sanitization
- CORS protection
- Regular security audits

See [docs/SECURITY.md](docs/SECURITY.md) for details.

## 🌐 IPFS Deployment

```bash
# Deploy to IPFS
./deployment/deploy-ipfs.sh

# With Pinata pinning
export PINATA_JWT="your-jwt-token"
./deployment/deploy-ipfs.sh

# Access via gateway
https://ipfs.io/ipfs/<CID>
```

## 🔧 Configuration

Edit `live-terminal.js` for API endpoints:
```javascript
this.apiService = new APIService({
    baseURL: 'https://your-api.com',
    wsURL: 'wss://your-api.com/ws'
});
```

## 📝 License

MIT License - See [LICENSE](LICENSE) file

## 🤝 Support

- **Issues**: https://github.com/hannesmitterer/geometry-nodes/issues
- **Matrix**: #resonance-school:matrix.org
- **Documentation**: See docs/ directory

## 🎯 System Requirements

- Node.js 18+
- Docker & Docker Compose (for containerized deployment)
- IPFS (for decentralized deployment)
- Modern web browser (Chrome/Firefox/Safari)

## ⚡ Performance

- Real-time updates every 5-20 seconds
- Historical data persistence with LocalStorage
- Rate limiting: 100-300 requests/15min
- WebSocket for low-latency updates
- Optimized Docker images

## 🔄 CI/CD

GitHub Actions workflow includes:
- Automated testing
- Security scanning (CodeQL)
- Docker image building
- IPFS deployment
- Performance testing

## 📈 Monitoring

- Health check endpoint: `/health`
- System metrics in analytics dashboard
- Docker health checks
- Log aggregation support

---

**Built for the Resonance School sovereignty infrastructure**

Geometry nodes - Euystacio framework synopsis system
triple-sign-validator.js
