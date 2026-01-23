# Deployment Guide

This directory contains deployment configurations and scripts for the Resonance School Live Terminal.

## Contents

- **Dockerfile** - Container image definition
- **docker-compose.yml** - Multi-container orchestration
- **nginx.conf** - Reverse proxy configuration
- **deploy-ipfs.sh** - IPFS deployment automation script

## Quick Start

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   cd deployment
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000
   - WebSocket: ws://localhost:3001

3. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

### IPFS Deployment

1. **Make script executable (if not already):**
   ```bash
   chmod +x deployment/deploy-ipfs.sh
   ```

2. **Deploy to IPFS:**
   ```bash
   ./deployment/deploy-ipfs.sh --pin
   ```

3. **Update existing deployment:**
   ```bash
   ./deployment/deploy-ipfs.sh --update
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3000
WS_PORT=3001
JWT_SECRET=your-production-secret
NODE_ENV=production
```

### Docker Compose

Customize `docker-compose.yml` for your needs:

- Modify ports
- Add environment variables
- Enable/disable services (nginx, redis)
- Configure volumes

### Nginx

Edit `nginx.conf` to:

- Configure SSL certificates
- Adjust rate limiting
- Set up custom domains
- Add additional locations

## Production Deployment

### Prerequisites

1. **Domain name** (optional but recommended)
2. **SSL certificates** (Let's Encrypt recommended)
3. **Docker and Docker Compose** installed
4. **Firewall** configured (ports 80, 443)

### Steps

1. **Clone repository:**
   ```bash
   git clone https://github.com/hannesmitterer/geometry-nodes.git
   cd geometry-nodes
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your settings
   ```

3. **Generate SSL certificates (if using HTTPS):**
   ```bash
   # Using Let's Encrypt
   sudo certbot certonly --standalone -d your-domain.com
   ```

4. **Update nginx.conf:**
   - Uncomment HTTPS server block
   - Update SSL certificate paths
   - Update server_name

5. **Deploy:**
   ```bash
   docker-compose up -d
   ```

6. **Verify:**
   ```bash
   curl https://your-domain.com/health
   ```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000

# Or change port in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Rebuild container
docker-compose up -d --build
```

### IPFS Deployment Failed

```bash
# Check IPFS daemon status
ipfs swarm peers

# Start daemon if not running
ipfs daemon &
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Check container status
docker-compose ps
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last N lines
docker-compose logs --tail=50 backend
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3
```

### Load Balancing

Configure nginx upstream with multiple backend instances.

## Security Checklist

- [ ] Change default JWT secret
- [ ] Configure CORS for production
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Regular dependency updates
- [ ] Implement monitoring

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Project Documentation](../docs/)

## Support

For issues or questions:
- GitHub Issues: https://github.com/hannesmitterer/geometry-nodes/issues
- Matrix: #resonance-school:matrix.org
