# Troubleshooting Guide

## Resonance School Live Terminal - Common Issues and Solutions

This guide helps you diagnose and resolve common problems.

---

## Table of Contents

1. [Server Issues](#server-issues)
2. [WebSocket Problems](#websocket-problems)
3. [Frontend Issues](#frontend-issues)
4. [Testing Problems](#testing-problems)
5. [Deployment Issues](#deployment-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)

---

## Server Issues

### Server Won't Start

**Symptom:** Server fails to start or crashes immediately

**Error:** `EADDRINUSE: Port already in use`

**Cause:** Another process is using port 3000 or 3001

**Solutions:**

1. **Find and kill the process:**
   ```bash
   # On Unix/Linux/Mac
   lsof -i :3000
   kill -9 <PID>
   
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Use different ports:**
   ```bash
   PORT=4000 WS_PORT=4001 npm start
   ```

3. **Set in .env file:**
   ```
   PORT=4000
   WS_PORT=4001
   ```

---

**Error:** `Cannot find module 'express'`

**Cause:** Dependencies not installed

**Solution:**
```bash
npm install
```

---

**Error:** `EACCES: permission denied`

**Cause:** Trying to use port < 1024 without sudo

**Solutions:**

1. **Use ports > 1024:**
   ```bash
   PORT=3000 npm start
   ```

2. **Run with sudo (not recommended for development):**
   ```bash
   sudo npm start
   ```

---

### Server Crashes

**Symptom:** Server crashes with uncaught exception

**Common Causes:**
- Unhandled promise rejection
- Memory overflow
- Invalid JSON parsing

**Solutions:**

1. **Check logs** for error details
   ```bash
   npm start 2>&1 | tee server.log
   ```

2. **Enable debugging:**
   ```bash
   NODE_ENV=development DEBUG=* npm start
   ```

3. **Add error handlers:**
   ```javascript
   process.on('unhandledRejection', (error) => {
     console.error('Unhandled rejection:', error);
   });
   ```

---

### High CPU Usage

**Symptom:** Server consuming excessive CPU

**Common Causes:**
- Infinite loops
- Too many WebSocket broadcasts
- Memory leaks

**Solutions:**

1. **Profile the application:**
   ```bash
   node --prof backend/backend-mock-server.js
   ```

2. **Reduce broadcast frequency** in server code

3. **Monitor with tools:**
   ```bash
   npm install -g clinic
   clinic doctor -- node backend/backend-mock-server.js
   ```

---

## WebSocket Problems

### Connection Failed

**Symptom:** WebSocket fails to connect

**Error:** `WebSocket connection to 'ws://localhost:3001' failed`

**Solutions:**

1. **Verify server is running:**
   ```bash
   # Check if port is listening
   netstat -an | grep 3001
   ```

2. **Check WebSocket URL:**
   ```javascript
   // Ensure URL matches server port
   const ws = new WebSocket('ws://localhost:3001');
   ```

3. **Check CORS settings:**
   ```javascript
   // In backend-mock-server.js
   const corsOptions = {
     origin: '*',  // For development
   };
   ```

4. **Firewall issues:**
   - Check if firewall is blocking port 3001
   - Temporarily disable firewall to test

---

### Frequent Disconnections

**Symptom:** WebSocket disconnects frequently

**Common Causes:**
- Network instability
- Server timeouts
- Client-side issues

**Solutions:**

1. **Increase timeout:**
   ```javascript
   // Server-side
   wss.on('connection', (ws) => {
     ws.isAlive = true;
     ws.on('pong', () => { ws.isAlive = true; });
   });
   
   // Ping clients every 30 seconds
   setInterval(() => {
     wss.clients.forEach((ws) => {
       if (!ws.isAlive) return ws.terminate();
       ws.isAlive = false;
       ws.ping();
     });
   }, 30000);
   ```

2. **Implement reconnection** (already in api-service.js):
   ```javascript
   attemptReconnect() {
     if (this.reconnectAttempts < this.maxReconnectAttempts) {
       setTimeout(() => {
         this.initWebSocket();
       }, this.reconnectDelay);
     }
   }
   ```

---

### Messages Not Received

**Symptom:** Client not receiving WebSocket messages

**Solutions:**

1. **Verify subscription:**
   ```javascript
   ws.onopen = () => {
     ws.send(JSON.stringify({
       type: 'subscribe',
       channels: ['sovereignty', 'wallet', 'nodes', 'logs']
     }));
   };
   ```

2. **Check message handler:**
   ```javascript
   ws.onmessage = (event) => {
     console.log('Received:', event.data);
     const data = JSON.parse(event.data);
     // Handle data...
   };
   ```

3. **Verify server is broadcasting:**
   - Check server logs for broadcast messages
   - Ensure `wsClients.size > 0`

---

## Frontend Issues

### UI Not Updating

**Symptom:** Data fetched but UI doesn't update

**Solutions:**

1. **Check browser console** for errors:
   ```
   Press F12 → Console tab
   ```

2. **Verify DOM elements exist:**
   ```javascript
   const element = document.getElementById('consensus-value');
   if (!element) {
     console.error('Element not found!');
   }
   ```

3. **Check API service initialization:**
   ```javascript
   // In browser console
   window.liveTerminal.apiService
   ```

---

### Service Worker Not Registering

**Symptom:** PWA features not working

**Error:** `Service Worker registration failed`

**Solutions:**

1. **Use HTTPS or localhost:**
   - Service Workers require secure context
   - http://localhost is allowed
   - Use https:// for other domains

2. **Check path:**
   ```javascript
   navigator.serviceWorker.register('/service-worker.js', {
     scope: '/'
   });
   ```

3. **Clear browser cache:**
   - Chrome: DevTools → Application → Clear storage
   - Firefox: DevTools → Storage → Clear All

4. **Verify file exists:**
   ```bash
   ls -la service-worker.js
   ```

---

### Notifications Not Showing

**Symptom:** Browser notifications don't appear

**Solutions:**

1. **Request permission:**
   ```javascript
   if (Notification.permission === 'default') {
     Notification.requestPermission();
   }
   ```

2. **Check browser settings:**
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Ensure site is allowed

3. **Verify HTTPS:**
   - Notifications require secure context
   - Use https:// or localhost

4. **Test notification:**
   ```javascript
   new Notification('Test', { body: 'Testing notifications' });
   ```

---

## Testing Problems

### Tests Failing

**Symptom:** `npm test` fails

**Error:** `Cannot find module '../backend/backend-mock-server'`

**Solution:**
```bash
# Ensure backend server exports properly
# Check module.exports in backend-mock-server.js
```

---

**Error:** `Jest did not exit one second after the test run`

**Cause:** Async operations not completed

**Solutions:**

1. **Close connections in afterEach:**
   ```javascript
   afterEach((done) => {
     if (ws) {
       ws.close();
       ws.on('close', () => done());
     } else {
       done();
     }
   });
   ```

2. **Increase timeout:**
   ```javascript
   jest.setTimeout(30000); // 30 seconds
   ```

---

**Error:** `Exceeded timeout of 5000 ms`

**Cause:** Test taking too long

**Solutions:**

1. **Increase timeout for specific test:**
   ```javascript
   it('should handle long operation', (done) => {
     // Test code...
   }, 30000); // 30 second timeout
   ```

2. **Check if test is actually completing:**
   - Ensure `done()` is called
   - Check for unresolved promises

---

### WebSocket Tests Failing

**Symptom:** WebSocket tests timeout

**Solutions:**

1. **Ensure server is running:**
   ```bash
   # Start server in separate terminal
   npm start
   ```

2. **Check WebSocket URL:**
   ```javascript
   const WS_URL = `ws://localhost:${process.env.WS_PORT || 3001}`;
   ```

3. **Wait for connection:**
   ```javascript
   ws.on('open', () => {
     // Now send messages
   });
   ```

---

## Deployment Issues

### IPFS Deployment Failed

**Symptom:** `ipfs add` fails

**Error:** `ipfs: command not found`

**Solution:**
```bash
# Install IPFS
# See: https://docs.ipfs.io/install/

# Verify installation
ipfs --version
```

---

**Error:** `ipfs add: file too large`

**Solutions:**

1. **Remove node_modules:**
   ```bash
   # Add to .gitignore
   echo "node_modules/" >> .gitignore
   ```

2. **Use selective add:**
   ```bash
   ipfs add -r . --ignore node_modules --ignore .git
   ```

---

### Docker Build Failed

**Symptom:** Docker image fails to build

**Error:** `Cannot find package.json`

**Solution:**

1. **Check Dockerfile path:**
   ```dockerfile
   COPY package*.json ./
   ```

2. **Ensure files exist:**
   ```bash
   ls -la package.json
   ```

---

## Performance Issues

### Slow API Responses

**Symptom:** API requests taking > 1 second

**Solutions:**

1. **Enable caching:**
   ```javascript
   const { cacheMiddleware } = require('./backend/cache-strategy');
   app.use('/api/sovereignty/status', cacheMiddleware(60)); // 60s cache
   ```

2. **Enable compression:**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

3. **Profile requests:**
   ```javascript
   app.use((req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       console.log(`${req.method} ${req.path}: ${Date.now() - start}ms`);
     });
     next();
   });
   ```

---

### High Memory Usage

**Symptom:** Server using excessive memory

**Solutions:**

1. **Limit log buffer:**
   ```javascript
   // In backend-mock-server.js
   if (systemLogs.length > 1000) {
     systemLogs = systemLogs.slice(-1000);
   }
   ```

2. **Implement log rotation:**
   ```javascript
   const winston = require('winston');
   // Configure rotating file transport
   ```

3. **Monitor memory:**
   ```bash
   node --max-old-space-size=512 backend/backend-mock-server.js
   ```

---

### Slow Page Load

**Symptom:** Frontend takes long to load

**Solutions:**

1. **Minimize JavaScript:**
   ```bash
   # Use minification tools
   npm install -g terser
   terser live-terminal.js -o live-terminal.min.js
   ```

2. **Enable browser caching:**
   ```javascript
   app.use(express.static('.', {
     maxAge: '1d'
   }));
   ```

3. **Use CDN for libraries:**
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   ```

---

## Security Issues

### Rate Limit Too Strict

**Symptom:** Getting 429 Too Many Requests

**Solutions:**

1. **Increase limit:**
   ```javascript
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 200  // Increase from 100
   });
   ```

2. **Exempt specific IPs:**
   ```javascript
   const limiter = rateLimit({
     skip: (req) => {
       return req.ip === '127.0.0.1';
     }
   });
   ```

---

### CORS Errors in Browser

**Symptom:** `Access-Control-Allow-Origin` error

**Solutions:**

1. **Update CORS config:**
   ```javascript
   const corsOptions = {
     origin: ['http://localhost:8080', 'https://your-domain.com'],
     credentials: true
   };
   app.use(cors(corsOptions));
   ```

2. **Allow all origins (development only):**
   ```javascript
   app.use(cors({ origin: '*' }));
   ```

---

### JWT Token Expired

**Symptom:** Getting 403 Forbidden

**Solutions:**

1. **Increase token lifetime:**
   ```javascript
   JWT_EXPIRES_IN=24h  // In .env
   ```

2. **Implement token refresh:**
   ```javascript
   // Generate refresh token
   const refreshToken = generateToken(payload, '7d');
   ```

---

## Getting More Help

If your issue isn't covered here:

1. **Check logs:**
   ```bash
   # Server logs
   npm start 2>&1 | tee server.log
   
   # Browser console (F12)
   ```

2. **Search existing issues:**
   - https://github.com/hannesmitterer/geometry-nodes/issues

3. **Create new issue:**
   - Include error messages
   - Provide steps to reproduce
   - Share relevant logs

4. **Join community:**
   - Matrix: #resonance-school:matrix.org

---

## Diagnostic Commands

### Server Diagnostics

```bash
# Check server status
curl http://localhost:3000/health

# Check API endpoints
curl http://localhost:3000/api/sovereignty/status

# Check if port is listening
netstat -an | grep 3000

# Monitor server logs
tail -f server.log
```

### WebSocket Diagnostics

```bash
# Test WebSocket connection
wscat -c ws://localhost:3001

# Or use browser console
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### System Diagnostics

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list

# Check for outdated packages
npm outdated
```

---

**Last Updated:** 2026-01-06  
**License:** MIT
