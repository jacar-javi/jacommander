# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| < 1.3   | :x:                |

## Reporting a Vulnerability

We take the security of JaCommander seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT:

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. **Report via GitHub Security Advisories** (preferred)
   - Go to https://github.com/jacar-javi/jacommander/security/advisories/new
   - Provide a detailed description of the vulnerability
   - Include steps to reproduce if possible

2. **Report via Email** (alternative)
   - Email: jcanete@theadwatch.com
   - Subject: [SECURITY] JaCommander - Brief description
   - Include detailed information about the vulnerability

### What to Include in Your Report

Please provide as much information as possible:

- Type of vulnerability (e.g., XSS, path traversal, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Any potential fixes you've identified

## Security Response Process

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: We will investigate and assess the severity within 5 business days
3. **Updates**: We will keep you informed of our progress throughout the process
4. **Resolution**: We will work to release a fix as quickly as possible
5. **Disclosure**: Once patched, we will coordinate public disclosure with you

## Security Best Practices for Deployment

When deploying JaCommander, follow these security best practices:

### Network Security

- Always use HTTPS in production environments
- Place JaCommander behind a reverse proxy (nginx, Traefik, etc.)
- Implement rate limiting at the reverse proxy level
- Use a Web Application Firewall (WAF) for additional protection

### Authentication & Authorization

- Enable authentication for production deployments
- Use strong passwords (minimum 12 characters, mixed case, numbers, symbols)
- Consider integrating with existing SSO/OAuth providers
- Implement IP whitelisting when possible

### Docker Security

```bash
# Run container as non-root user
docker run --user 1000:1000 jacarjavi/jacommander

# Limit container resources
docker run --memory="512m" --cpus="1.0" jacarjavi/jacommander

# Use read-only filesystem where possible
docker run --read-only --tmpfs /tmp jacarjavi/jacommander

# Drop unnecessary capabilities
docker run --cap-drop=ALL --cap-add=CHOWN,SETGID,SETUID jacarjavi/jacommander
```

### File System Security

- Mount volumes with appropriate permissions
- Restrict access to sensitive directories
- Use separate volumes for uploads/downloads
- Regularly audit file access logs

### Environment Variables

- Never commit `.env` files to version control
- Use secrets management (Docker secrets, Kubernetes secrets, etc.)
- Rotate credentials regularly
- Use separate credentials for development and production

### Updates & Monitoring

- Keep JaCommander updated to the latest version
- Subscribe to security advisories (Watch → Custom → Security alerts)
- Monitor logs for suspicious activity
- Implement automated security scanning in CI/CD

## Known Security Considerations

### Path Traversal Protection

JaCommander includes built-in path traversal prevention:
- All file paths are validated and sanitized
- Symlinks are handled carefully to prevent escape
- Access is restricted to configured storage paths only

### Rate Limiting

Built-in rate limiting helps prevent:
- Brute force attacks
- Resource exhaustion
- Denial of Service

Default limits (configurable via environment variables):
- 100 requests per minute per IP
- 10 upload requests per minute per IP

### File Upload Security

- Maximum file size limits (default: 5GB)
- File type validation
- Malware scanning recommended for production
- Automatic cleanup of temporary files

### WebSocket Security

- Origin validation
- Connection rate limiting
- Automatic timeout and cleanup

## Security Audit History

| Date | Auditor | Scope | Status |
|------|---------|-------|--------|
| TBD  | TBD     | Full  | Planned |

## Bug Bounty Program

We currently do not have a bug bounty program, but we greatly appreciate responsible disclosure and will publicly credit security researchers (with permission) who help improve JaCommander's security.

## Contact

For security concerns:
- Security Email: jcanete@theadwatch.com
- GitHub Security: https://github.com/jacar-javi/jacommander/security/advisories/new

For general questions:
- GitHub Issues: https://github.com/jacar-javi/jacommander/issues
- Discussions: https://github.com/jacar-javi/jacommander/discussions

## Attribution

We would like to thank the following security researchers:

<!-- Security researchers will be listed here with their permission -->

---

**Last Updated**: October 2025
