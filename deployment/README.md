# Deployment Guide

This directory contains deployment automation scripts and configurations for the Resonance School Live Monitor.

## Files

- **deploy-ipfs.sh** - Automated IPFS deployment script
- **nginx.conf** - Nginx configuration for Docker/production deployment
- **last-deployment.json** - Metadata from the most recent deployment (auto-generated)

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see below)

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

Create a `.env` file in the project root:

```env
# JWT Secret (required in production)
JWT_SECRET=your-secure-random-secret-key-here

# IPFS Configuration (optional)
IPFS_GATEWAY=https://ipfs.io/ipfs/
IPNS_KEY=resonance-school

# Pinata Configuration (optional)
PINATA_JWT=your-pinata-jwt-token
```

### Accessing the Application

After starting with Docker Compose:

- **Frontend**: http://localhost:8080
- **Analytics Dashboard**: http://localhost:8080/analytics/
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:3001
- **Health Check**: http://localhost:3000/health

## IPFS Deployment

### Prerequisites

- IPFS installed and initialized
- IPFS daemon running (optional - script can start it)

### Deployment

```bash
# Make script executable (if not already)
chmod +x deployment/deploy-ipfs.sh

# Run deployment
./deployment/deploy-ipfs.sh
```

### With Pinata Pinning

```bash
# Set Pinata JWT token
export PINATA_JWT="your-jwt-token-here"

# Deploy
./deployment/deploy-ipfs.sh
```

### With IPNS

```bash
# Set IPNS key name
export IPNS_KEY="resonance-school"

# Deploy
./deployment/deploy-ipfs.sh
```

The script will:
1. Check IPFS availability
2. Add files to IPFS (excluding backend, tests, node_modules)
3. Pin to local IPFS node
4. Optionally pin to Pinata
5. Optionally publish to IPNS
6. Save deployment metadata to `last-deployment.json`

## Production Deployment

### Recommended Setup

1. **Use Docker Compose** for easy orchestration
2. **Set JWT_SECRET** to a strong random value
3. **Use HTTPS** with a reverse proxy (Nginx, Caddy, or Traefik)
4. **Enable monitoring** with Prometheus/Grafana
5. **Configure backups** for critical data
6. **Use IPNS** for a permanent, updateable link

### Reverse Proxy Example (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name resonance.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:

- Runs tests on push/PR
- Performs security scans
- Builds Docker images
- Deploys to IPFS on main branch
- Runs performance tests

### Required Secrets

Configure in GitHub repository settings:

- `PINATA_JWT` - Pinata API token (optional)

## Monitoring

### Health Checks

```bash
# Docker health check
docker-compose ps

# Direct health check
curl http://localhost:3000/health
```

### Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Application logs (if running without Docker)
journalctl -u resonance-backend -f
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Restart service
docker-compose restart backend
```

### WebSocket connection fails

- Ensure port 3001 is accessible
- Check firewall rules
- Verify WebSocket proxy configuration

### IPFS deployment fails

```bash
# Check IPFS status
ipfs id

# Restart daemon
ipfs shutdown
ipfs daemon &
```

### High memory usage

```bash
# Limit container memory
docker-compose up -d --scale backend=1 --memory="512m"
```

## Security Considerations

1. **Change default JWT secret** in production
2. **Use HTTPS** for all connections
3. **Enable rate limiting** (already configured)
4. **Regularly update dependencies**: `npm audit fix`
5. **Monitor logs** for suspicious activity
6. **Use environment variables** for secrets
7. **Restrict network access** with firewall rules

## Scaling

### Horizontal Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Use a load balancer (Nginx, HAProxy)
```

### Vertical Scaling

Increase container resources in `docker-compose.yml`:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
```

## Backup and Recovery

### Data Backup

```bash
# Export IPFS pins
ipfs pin ls > ipfs-pins-backup.txt

# Backup deployment configs
tar -czf resonance-backup-$(date +%Y%m%d).tar.gz \
    deployment/ .env docker-compose.yml
```

### Restore

```bash
# Re-pin IPFS content
while read -r cid; do
    ipfs pin add "$cid"
done < ipfs-pins-backup.txt
```

## Support

- **Documentation**: See main README.md and docs/
- **Issues**: https://github.com/hannesmitterer/geometry-nodes/issues
- **Matrix**: #resonance-school:matrix.org
