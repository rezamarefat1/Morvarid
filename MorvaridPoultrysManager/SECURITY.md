# Security Policy for Morvarid Poultry Management System

## Security Overview

The Morvarid Poultry Management System has been hardened following OWASP Top 10 security best practices and industry standards for Node.js/Express applications. This document outlines the security measures implemented and operational guidelines.

## Security Measures Implemented

### 1. Authentication and Session Management

- **Password Hashing**: All passwords are hashed using bcrypt with a salt factor of 12
- **Secure Sessions**: Implemented PostgreSQL-backed sessions using `connect-pg-simple`
- **Session Security**: Session cookies are configured with:
  - `httpOnly: true` (not accessible via JavaScript)
  - `secure: true` (in production)
  - `sameSite: 'lax'` (CSRF protection)
  - `maxAge: 24 hours` (session timeout)

### 2. API Protection

- **Authentication Middleware**: All sensitive routes require valid authentication
- **Role-Based Access Control**: Different user roles (admin, recording_officer, sales_officer) have appropriate access levels
- **Farm-Based Access Control**: Users can only access resources related to their assigned farm
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse:
  - General: 100 requests per 15 minutes per IP
  - Authentication: 5 login attempts per 15 minutes per IP

### 3. Input Validation and Sanitization

- **Schema Validation**: All API inputs validated using Zod schemas
- **Type Safety**: Strong TypeScript typing throughout the application
- **SQL Injection Prevention**: Using Drizzle ORM with parameterized queries

### 4. Security Headers

- **Content Security Policy**: Restrictive CSP headers via Helmet
- **XSS Protection**: XSS protection headers configured
- **Clickjacking Protection**: X-Frame-Options set to DENY
- **MIME-Type Sniffing**: X-Content-Type-Options: nosniff

### 5. Data Protection

- **Password Security**: Passwords never stored in plaintext
- **Data Isolation**: Users can only access data related to their assigned farms
- **PII Protection**: Personal information access limited by role

## Threat Model

### Assets to Protect
- User credentials and personal data
- Poultry production data
- Financial transaction records
- Farm operational data

### Threat Vectors Addressed
- Credential stuffing and brute force attacks
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- SQL injection
- Insecure direct object references
- Insufficient logging and monitoring

## Security Guidelines for Developers

### Creating New API Endpoints
1. Always apply `requireAuth` middleware to protected endpoints
2. Use `requireRole` for role-specific authorization
3. Validate all inputs using Zod schemas
4. Apply farm-based access control where appropriate
5. Log sensitive operations appropriately

### Handling Sensitive Data
1. Never log sensitive information (credentials, personal data)
2. Ensure password hashing for any credentials stored
3. Use environment variables for configuration secrets

### Frontend Security
1. Use proper authentication context
2. Never expose server-side secrets in the client bundle
3. Validate data received from the server before use

## Environment Configuration Requirements

The application requires the following environment variables:

```bash
# Database connection
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Session security
SESSION_SECRET=your-very-secure-random-session-secret-here

# Application configuration
NODE_ENV=development|production
PORT=5000
CLIENT_URL=your-client-url (in production)
```

## Operational Guidelines

### Deployment Security
1. Ensure `NODE_ENV=production` in production environments
2. Set strong session secrets (32+ characters, random)
3. Use HTTPS in production (enforced by secure cookies)
4. Monitor session table for potential abuse
5. Regularly rotate secrets

### Monitoring
1. Monitor authentication attempts for suspicious patterns
2. Log security-relevant events (failed logins, access violations)
3. Monitor rate limiting events

## Security Testing

The application has been tested against common vulnerabilities:
- ✅ Authentication/Authorization bypass attempts
- ✅ SQL Injection
- ✅ Cross-site scripting (XSS)
- ✅ Cross-site request forgery (CSRF)
- ✅ Insecure direct object references
- ✅ Security misconfigurations

## Incident Response

If you discover any security vulnerabilities:

1. Do not report them through public GitHub issues
2. Contact the project maintainers immediately
3. Provide sufficient detail to reproduce the issue
4. Allow reasonable time for response before disclosure

## Maintenance

- Regularly run `npm audit` to check for vulnerabilities
- Keep all dependencies updated
- Review and update security controls regularly
- Monitor for new security threats and patches

---

This document should be updated when significant security changes are made.