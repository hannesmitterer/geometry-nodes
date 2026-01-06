# Deployment Guide

Complete guide for deploying the Resonance School Live Monitor.

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start backend (Terminal 1)
npm run backend

# Start frontend (Terminal 2)  
npm run serve

# Access
# Frontend: http://localhost:8080
# Analytics: http://localhost:8080/analytics/
# API: http://localhost:3000
```

### Docker (Recommended)
```bash
# Create .env file
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### IPFS
```bash
# Make script executable
chmod +x deployment/deploy-ipfs.sh

# Deploy
./deployment/deploy-ipfs.sh

# With Pinata
export PINATA_JWT="your-jwt-token"
./deployment/deploy-ipfs.sh
```

## Production Deployment

### Prerequisites
- Docker & Docker Compose
- SSL/TLS certificates
- Domain name (recommended)
- Firewall configured

### Environment Setup
```env
JWT_SECRET=<generate-random-32-char-string>
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

### Using Docker Compose
See docker-compose.yml and deployment/README.md

### Manual Deployment
See backend/server.js for Node.js requirements

### Reverse Proxy
Configure Nginx, Caddy, or Traefik for HTTPS termination

## Monitoring
- Health: http://localhost:3000/health
- Logs: docker-compose logs -f
- Metrics: (implement Prometheus/Grafana)

## Troubleshooting
See deployment/README.md for common issues

## CI/CD
GitHub Actions workflow in .github/workflows/ci-cd.yml

## Security
See docs/SECURITY.md for best practices
