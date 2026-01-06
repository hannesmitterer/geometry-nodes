# IPFS Deployment Guide for Resonance School Live Monitor

## Overview
This guide covers deploying the Resonance School Live Monitor Terminal as a decentralized application on IPFS (InterPlanetary File System).

## Prerequisites

### Install IPFS
```bash
# On Linux/macOS
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh

# Verify installation
ipfs --version
```

### Initialize IPFS
```bash
ipfs init
ipfs daemon &
```

## Deployment Steps

### 1. Prepare the Application

Ensure all files are in place:
- `index.html` - Main application interface
- `api-service.js` - Dynamic backend API service
- `logger-service.js` - Distributed logging system
- `notification-service.js` - Countdown and notification handler
- `live-terminal.js` - Main integration orchestrator
- `service-worker.js` - Offline support
- `manifest.json` - PWA manifest
- `package.json` - Project metadata

### 2. Add to IPFS

```bash
# Navigate to project directory
cd /path/to/geometry-nodes

# Add entire directory to IPFS
ipfs add -r .

# The output will show CID for each file and directory
# Note the final directory CID (looks like: QmXxx...)
```

Example output:
```
added QmYxxx... index.html
added QmZxxx... api-service.js
...
added QmAbcd... . 
```

### 3. Pin the Content

Pinning ensures your content stays available on IPFS:

```bash
# Pin using the directory CID from step 2
ipfs pin add QmAbcd...

# Verify it's pinned
ipfs pin ls --type=recursive | grep QmAbcd
```

### 4. Access Your Deployment

Your application is now accessible via:

**Local Gateway:**
```
http://localhost:8080/ipfs/QmAbcd...
```

**Public Gateways:**
```
https://ipfs.io/ipfs/QmAbcd...
https://gateway.pinata.cloud/ipfs/QmAbcd...
https://cloudflare-ipfs.com/ipfs/QmAbcd...
```

### 5. Use IPNS for Mutable References (Optional)

IPNS allows you to update your content while keeping the same address:

```bash
# Publish to IPNS
ipfs name publish QmAbcd...

# This will give you an IPNS name like:
# /ipns/k51xxx...

# Update later by publishing new CID
ipfs name publish QmNewCID...
```

Access via:
```
https://ipfs.io/ipns/k51xxx...
```

## Advanced: Pinning Services

For production deployments, use pinning services to ensure high availability:

### Pinata
1. Create account at https://pinata.cloud
2. Get API keys
3. Use Pinata API or web interface to pin your CID

### Infura IPFS
1. Create account at https://infura.io
2. Create IPFS project
3. Use Infura API to pin content

### Web3.Storage
1. Create account at https://web3.storage
2. Upload via web interface or API

## Configuration for Production

### Update API Endpoints

Edit `api-service.js` to point to your production backend:

```javascript
this.baseURL = config.baseURL || 'https://your-api-domain.com';
this.wsURL = config.wsURL || 'wss://your-api-domain.com/ws';
```

### Configure WebSocket

Ensure your WebSocket server supports:
- WSS (WebSocket Secure) for HTTPS contexts
- CORS headers for cross-origin requests
- Reconnection handling

### Update Service Worker

Add your IPFS gateway URLs to the cache list in `service-worker.js`:

```javascript
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/api-service.js',
    // ... other files
];
```

## Monitoring Deployment

### Check IPFS Stats
```bash
# View repo stats
ipfs stats repo

# View bandwidth usage
ipfs stats bw

# List pins
ipfs pin ls --type=recursive
```

### Test Availability

Test your deployment from multiple gateways:
```bash
curl -I https://ipfs.io/ipfs/QmAbcd...
curl -I https://gateway.pinata.cloud/ipfs/QmAbcd...
```

## Updating Content

To update your deployment:

1. Make changes to your files
2. Add new version to IPFS: `ipfs add -r .`
3. Get new CID
4. Update IPNS (if using): `ipfs name publish <new-CID>`
5. Pin new version: `ipfs pin add <new-CID>`
6. Unpin old version (optional): `ipfs pin rm <old-CID>`

## DNS Integration (Optional)

Link your domain to IPFS:

### Using DNSLink
Add a TXT record to your domain:
```
_dnslink.yourdomain.com TXT "dnslink=/ipfs/QmAbcd..."
```

Then access via:
```
https://yourdomain.com
```

### Using Cloudflare
1. Add domain to Cloudflare
2. Enable IPFS gateway
3. Create DNSLink TXT record
4. Access via your domain

## Security Considerations

1. **Content Integrity**: IPFS content is content-addressed and immutable
2. **HTTPS**: Always use HTTPS gateways in production
3. **API Security**: Ensure your backend APIs use proper authentication
4. **WebSocket Security**: Use WSS with valid certificates
5. **Service Worker**: Test offline functionality thoroughly

## Troubleshooting

### Content Not Loading
- Check IPFS daemon is running: `ipfs swarm peers`
- Verify content is pinned: `ipfs pin ls`
- Try different gateways

### Service Worker Issues
- Clear browser cache
- Check console for errors
- Verify service-worker.js is accessible

### WebSocket Connection Fails
- Check WSS endpoint is reachable
- Verify CORS headers
- Check browser console for errors

## Maintenance

### Regular Tasks
1. Monitor IPFS daemon health
2. Update pinning services regularly
3. Check gateway availability
4. Review logs for errors
5. Update content as needed

### Backup
```bash
# Export IPFS data
ipfs pin ls > pins-backup.txt

# Backup repository
tar -czf ipfs-backup.tar.gz ~/.ipfs
```

## Resources

- IPFS Documentation: https://docs.ipfs.tech
- Pinata Docs: https://docs.pinata.cloud
- Web3.Storage Docs: https://web3.storage/docs
- IPFS Gateways: https://ipfs.github.io/public-gateway-checker

## Support

For issues specific to the Resonance School deployment:
- Matrix Room: #resonance-school:matrix.org
- GitHub Issues: https://github.com/hannesmitterer/geometry-nodes

## License

MIT License - See LICENSE file for details
