# Development Guide

## Resonance School Live Terminal - Development Setup

This guide will help you set up your development environment and start contributing to the project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Workflow](#development-workflow)
4. [Running the Application](#running-the-application)
5. [Testing](#testing)
6. [Code Style](#code-style)
7. [Project Structure](#project-structure)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Git** 2.x or higher

### Optional Software

- **Python** 3.x (for simple HTTP server)
- **IPFS** (for deployment)
- **Docker** (for containerized deployment)

### Installation Check

```bash
node --version    # Should be v16.x or higher
npm --version     # Should be 8.x or higher
git --version     # Should be 2.x or higher
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/hannesmitterer/geometry-nodes.git
cd geometry-nodes
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Express and WebSocket server dependencies
- Security middleware (Helmet, JWT, Joi)
- Testing frameworks (Jest, Playwright, Supertest)
- Development tools (ESLint, Prettier)

### 3. Environment Setup

Create a `.env` file (optional):

```bash
# Server configuration
PORT=3000
WS_PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=*
```

**Note:** Never commit `.env` files with real secrets to version control.

---

## Development Workflow

### Standard Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run test:integration
   ```

4. **Lint and format**
   ```bash
   npm run lint
   npm run format
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Follow conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
test: add or update tests
refactor: code refactoring
style: code style changes
chore: maintenance tasks
```

---

## Running the Application

### Development Mode

#### Start Backend Server

```bash
npm start
# or
npm run dev  # with auto-reload
```

Server will start on:
- HTTP: `http://localhost:3000`
- WebSocket: `ws://localhost:3001`

#### Serve Frontend

Option 1: Python SimpleHTTPServer
```bash
npm run serve
# Opens on http://localhost:8080
```

Option 2: Use backend as static file server
```bash
npm start
# Open http://localhost:3000/index.html
```

### Testing the Application

1. **Open your browser**
   ```
   http://localhost:8080
   # or
   http://localhost:3000/index.html
   ```

2. **Open browser console** (F12)
   - Check for initialization messages
   - Verify WebSocket connection
   - Monitor real-time updates

3. **Test WebSocket connection**
   ```javascript
   // In browser console
   window.liveTerminal.apiService.ws.readyState
   // Should return 1 (OPEN)
   ```

---

## Testing

### Unit Tests

Run all unit tests:

```bash
npm test
```

Run specific test file:

```bash
npm test tests/test-api.spec.js
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Integration Tests

```bash
npm run test:integration
```

### Test Coverage

Generate coverage report:

```bash
npm run test:coverage
```

Coverage thresholds (defined in `jest.config.js`):
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Manual Testing

Use the included test page:

```
http://localhost:8080/test.html
```

This provides:
- Module initialization tests
- Mock data verification
- Event system tests
- Persistence tests

---

## Code Style

### JavaScript Style Guide

- **ES6+** features preferred
- **Semicolons** required
- **Single quotes** for strings
- **2 spaces** for indentation
- **JSDoc** comments for all functions

### Example:

```javascript
/**
 * Calculate consensus score
 * @param {number} value - Input value
 * @returns {number} Consensus score
 */
function calculateConsensus(value) {
  return Math.min(100, Math.max(0, value));
}
```

### Linting

Check code style:

```bash
npm run lint
```

Auto-fix issues:

```bash
npm run lint -- --fix
```

### Formatting

Format all files:

```bash
npm run format
```

---

## Project Structure

```
geometry-nodes/
├── backend/                    # Backend services
│   ├── backend-mock-server.js  # Main server
│   ├── security-middleware.js  # Security layer
│   ├── compression-middleware.js
│   └── cache-strategy.js
│
├── frontend/                   # Frontend code
│   └── (to be added)
│
├── tests/                      # Test suite
│   ├── test-api.spec.js        # API tests
│   ├── test-websocket.spec.js  # WebSocket tests
│   ├── test-security.spec.js   # Security tests
│   └── test-integration.spec.js # Integration tests
│
├── docs/                       # Documentation
│   ├── API_REFERENCE.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── ARCHITECTURE.md
│
├── deployment/                 # Deployment configs
│   └── (to be added)
│
├── config/                     # Configuration files
│   └── (to be added)
│
├── index.html                  # Main application
├── api-service.js              # API service layer
├── logger-service.js           # Logging service
├── notification-service.js     # Notifications
├── live-terminal.js            # Main integration
├── service-worker.js           # PWA support
├── package.json                # Dependencies
├── jest.config.js              # Test configuration
└── .gitignore                  # Git exclusions
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Add route in `backend-mock-server.js`:**

```javascript
app.get('/api/new-endpoint', (req, res) => {
  res.json({ data: 'your data' });
});
```

2. **Add test in `tests/test-api.spec.js`:**

```javascript
describe('GET /api/new-endpoint', () => {
  it('should return data', async () => {
    const response = await request(app)
      .get('/api/new-endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

3. **Update API documentation** in `docs/API_REFERENCE.md`

4. **Run tests:**

```bash
npm test
```

### Adding WebSocket Event

1. **Add broadcast in `backend-mock-server.js`:**

```javascript
setInterval(() => {
  if (wsClients.size > 0) {
    broadcastToClients('new_event', generateData());
  }
}, 10000);
```

2. **Handle in `api-service.js`:**

```javascript
handleMessage(data) {
  if (data.type === 'new_event') {
    this.emit('new_event', data.payload);
  }
}
```

3. **Add test in `tests/test-websocket.spec.js`**

### Adding Middleware

1. **Create middleware function:**

```javascript
function myMiddleware(req, res, next) {
  // Your logic here
  next();
}
```

2. **Apply to routes:**

```javascript
app.use('/api/', myMiddleware);
```

3. **Add tests**

### Updating Dependencies

Check for updates:

```bash
npm outdated
```

Update dependencies:

```bash
npm update
```

Update to latest versions:

```bash
npm install package-name@latest
```

### Building for Production

Currently, the project is static and doesn't require a build step.

For deployment:

```bash
# IPFS deployment
npm run ipfs:add
npm run ipfs:pin <CID>
```

---

## Troubleshooting

### Server Won't Start

**Error:** `EADDRINUSE: Port already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3000
# or
netstat -ano | grep 3000

# Kill process
kill -9 <PID>
```

### WebSocket Connection Failed

**Error:** `WebSocket connection to 'ws://localhost:3001' failed`

**Solution:**
1. Check if backend server is running
2. Verify WS_PORT in .env matches connection URL
3. Check firewall settings

### Tests Failing

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin error`

**Solution:**
1. Check CORS configuration in `backend-mock-server.js`
2. Verify frontend URL is allowed
3. For development, use `origin: '*'`

### Service Worker Not Registering

**Solution:**
1. Use HTTPS or localhost
2. Check browser console for errors
3. Clear browser cache
4. Verify service-worker.js path

---

## Additional Resources

- **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Technical Docs:** [../TECHNICAL_DOCS.md](../TECHNICAL_DOCS.md)
- **GitHub Repository:** https://github.com/hannesmitterer/geometry-nodes

---

## Getting Help

- **Issues:** https://github.com/hannesmitterer/geometry-nodes/issues
- **Matrix Chat:** #resonance-school:matrix.org
- **Documentation:** See docs/ directory

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

See our coding standards and testing requirements above.

---

**Last Updated:** 2026-01-06  
**License:** MIT
