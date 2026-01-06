# Security Best Practices

## Overview

This document outlines security measures implemented in the Resonance School Live Monitor and best practices for secure deployment.

## Implemented Security Features

### 1. HTTP Security Headers (Helmet.js)

All responses include security headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy` - Controls referrer information

### 2. Rate Limiting

Protection against abuse:
- API endpoints: 100 requests/15min
- Read operations: 300 requests/15min
- Write operations: 20 requests/15min
- Auth attempts: 5 requests/15min

### 3. Input Validation

All inputs validated using Joi schemas:
- Type checking
- Length limits
- Pattern matching
- Sanitization

### 4. JWT Authentication

Token-based authentication:
- HS256 algorithm
- 24-hour expiration
- Refresh tokens supported
- Role-based access control

### 5. CORS Configuration

Cross-origin requests controlled via environment variables.

## Production Deployment Checklist

### Critical (Must Do)

- [ ] Change JWT_SECRET to strong random value (32+ characters)
- [ ] Use HTTPS/TLS for all connections
- [ ] Set NODE_ENV=production
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Configure proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable Docker health checks
- [ ] Set up automated backups

### Recommended

- [ ] Use reverse proxy (Nginx/Caddy)
- [ ] Enable HTTP/2
- [ ] Configure CSP headers
- [ ] Set up log aggregation
- [ ] Implement API versioning
- [ ] Use CDN for static assets
- [ ] Enable database encryption at rest
- [ ] Set up intrusion detection
- [ ] Perform regular security audits
- [ ] Keep dependencies updated

## Environment Variables

Never commit these to git:

```env
JWT_SECRET=your-super-secret-random-key-here
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```

## Password Requirements

For production authentication:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Not in common password lists
- Rotate every 90 days

## API Security

### Authentication Flow

1. Client sends credentials to `/api/auth/login`
2. Server validates and returns JWT
3. Client includes JWT in Authorization header
4. Server validates JWT on protected routes
5. Token expires after 24 hours

### Token Storage

**Browser:**
- Use localStorage for SPAs
- Clear on logout
- Don't expose in URLs

**Server:**
- Never log tokens
- Use secure HTTP-only cookies if possible

## WebSocket Security

- Use WSS (WebSocket Secure) in production
- Validate origin headers
- Implement connection rate limiting
- Timeout idle connections

## Common Vulnerabilities Prevented

### XSS (Cross-Site Scripting)
- Content Security Policy
- Input sanitization
- Output encoding
- textContent instead of innerHTML

### CSRF (Cross-Site Request Forgery)
- JWT tokens (not cookies)
- Origin validation
- Same-site cookie attribute

### SQL Injection
- Not applicable (no database currently)
- Use parameterized queries if database added

### Path Traversal
- Input validation
- Whitelist allowed paths
- No user-supplied file paths

## Monitoring

### Log Security Events

Monitor for:
- Failed login attempts
- Rate limit violations
- Invalid tokens
- Unusual traffic patterns
- Error spikes

### Alerts

Set up alerts for:
- Multiple failed logins from same IP
- Rate limit exceeded
- Server errors
- High CPU/memory usage
- Disk space low

## Incident Response

1. **Detection** - Automated alerts
2. **Analysis** - Review logs
3. **Containment** - Block malicious IPs
4. **Eradication** - Patch vulnerabilities
5. **Recovery** - Restore from backups
6. **Post-Incident** - Update procedures

## Compliance

### Data Protection

- Minimize data collection
- Encrypt sensitive data
- Implement data retention policies
- Provide data export/deletion

### Privacy

- No tracking without consent
- Clear privacy policy
- GDPR compliance if EU users
- Log anonymization

## Security Updates

### Regular Maintenance

```bash
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Dependency Management

- Review dependencies before adding
- Use lock files (package-lock.json)
- Monitor security advisories
- Automated dependency updates (Dependabot)

## Network Security

### Firewall Rules

Allow only necessary ports:
- 80 (HTTP redirect)
- 443 (HTTPS)
- 3000 (API - internal only)
- 3001 (WebSocket - internal only)

Block:
- All other inbound traffic
- Unnecessary outbound traffic

### DDoS Protection

- Rate limiting (implemented)
- CDN with DDoS protection (Cloudflare)
- Load balancing
- Auto-scaling

## Backup and Recovery

### Backup Strategy

- Daily automated backups
- Off-site storage
- Encryption at rest
- Regular restore testing
- 30-day retention

### What to Backup

- Configuration files
- Environment variables (encrypted)
- IPFS pins
- Application logs (last 7 days)
- SSL certificates

## Reporting Security Issues

Report vulnerabilities to:
- Email: security@resonance.school
- GitHub: Private security advisory
- Matrix: #resonance-school-security:matrix.org

**DO NOT** create public issues for security vulnerabilities.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
