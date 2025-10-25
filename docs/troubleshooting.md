# Troubleshooting Guide

## Installation Issues

### Docker Container Won't Start

**Symptom:** Container exits immediately after starting

**Check logs:**
```bash
docker logs jacommander
```

**Common causes:**

1. **Port already in use**
```bash
# Check what's using port 8080
sudo lsof -i :8080
# or
sudo netstat -tlnp | grep 8080

# Solution: Change port
PORT=9090 docker-compose up -d
```

2. **Permission denied on volumes**
```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data
chmod 755 ./data
```

3. **Configuration error**
```bash
# Validate .env file
cat .env
# Check for syntax errors, missing quotes
```

4. **Resource constraints**
```bash
# Check Docker resources
docker stats
# Increase memory in Docker Desktop settings
```

---

### Cannot Access Web Interface

**Symptom:** Browser shows "Cannot connect" or timeout

**Checks:**

1. **Verify container is running**
```bash
docker ps | grep jacommander
# Should show "Up X minutes"
```

2. **Check port mapping**
```bash
docker port jacommander
# Should show: 8080/tcp -> 0.0.0.0:8080
```

3. **Test from localhost**
```bash
curl http://localhost:8080
# Should return HTML or JSON
```

4. **Check firewall**
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 8080/tcp

# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload

# macOS
# Check System Preferences → Security & Privacy → Firewall
```

5. **Try different browser**
- Clear browser cache
- Try incognito/private mode
- Try different browser

6. **Check Docker network**
```bash
docker network inspect bridge
# Verify container has IP address
```

---

### Build Fails

**Symptom:** `docker build` or `go build` fails

**Go build errors:**

1. **Module not found**
```bash
go mod download
go mod tidy
```

2. **Version mismatch**
```bash
# Check Go version
go version
# Requires Go 1.24+

# Update Go
# Visit: https://golang.org/dl/
```

3. **Dependency issues**
```bash
# Clear module cache
go clean -modcache
go mod download
```

**Docker build errors:**

1. **Network timeout**
```bash
# Use Docker buildkit
DOCKER_BUILDKIT=1 docker build -t jacommander .
```

2. **Insufficient disk space**
```bash
# Check disk space
df -h

# Clean Docker
docker system prune -a
```

3. **Base image pull fails**
```bash
# Pull base image manually
docker pull golang:1.24-alpine
docker pull alpine:latest
```

---

## Runtime Issues

### High Memory Usage

**Symptom:** Container using excessive memory

**Diagnosis:**
```bash
docker stats jacommander
```

**Solutions:**

1. **Reduce cache size**
```env
CACHE_SIZE_MB=128  # Down from 256
```

2. **Limit worker threads**
```env
WORKER_THREADS=2  # Down from 4
```

3. **Disable caching**
```env
CACHE_ENABLED=false
```

4. **Set Docker memory limit**
```yaml
services:
  jacommander:
    mem_limit: 512m
    mem_reservation: 256m
```

---

### Slow Performance

**Symptom:** Operations taking too long

**Optimizations:**

1. **Increase worker threads**
```env
WORKER_THREADS=8  # Match CPU cores
```

2. **Increase chunk size**
```env
CHUNK_SIZE=16777216  # 16MB for fast networks
```

3. **Enable caching**
```env
CACHE_ENABLED=true
CACHE_SIZE_MB=512
```

4. **Reduce compression level**
```env
COMPRESSION_LEVEL=1  # Fastest
```

5. **Use SSD for local storage**
```yaml
volumes:
  - /fast/ssd/path:/data
```

6. **Check network latency**
```bash
# Test network speed
iperf3 -c server-address
```

---

### Upload Fails

**Symptom:** File upload returns error or hangs

**Checks:**

1. **File size limit**
```env
# Increase limit
MAX_UPLOAD_SIZE=10737418240  # 10GB
```

2. **Chunk size**
```env
# Smaller chunks for unreliable networks
CHUNK_SIZE=4194304  # 4MB
```

3. **Timeout settings**
```env
UPLOAD_TIMEOUT=3600  # 1 hour
```

4. **Disk space**
```bash
# Check available space
df -h /data

# Clean up
docker system prune
```

5. **Browser timeout**
- Use chunked upload
- Monitor WebSocket progress
- Check browser console for errors

6. **Network interruption**
- Enable resume support
- Check WebSocket connection
- Verify network stability

---

## Authentication Issues

### Cannot Login

**Symptom:** Login fails with correct credentials

**Checks:**

1. **Verify credentials**
```bash
# Check environment
docker exec jacommander env | grep ADMIN

# Should show:
# ADMIN_USER=admin
# ADMIN_PASS=your-password
```

2. **JWT secret configured**
```bash
docker exec jacommander env | grep JWT_SECRET
# Should show JWT_SECRET value
```

3. **Authentication enabled**
```bash
docker exec jacommander env | grep ENABLE_AUTH
# Should show ENABLE_AUTH=true
```

4. **Check logs**
```bash
docker logs jacommander | grep -i auth
# Look for authentication errors
```

5. **Reset password**
```bash
# Stop container
docker-compose down

# Update .env
ADMIN_PASS=new-password

# Restart
docker-compose up -d
```

---

### Session Expires Too Quickly

**Symptom:** Logged out frequently

**Solution:**
```env
# Increase session timeout
SESSION_TIMEOUT=7200  # 2 hours
SESSION_TIMEOUT=28800  # 8 hours
```

---

### Token Invalid Error

**Symptom:** "Invalid token" or "Token expired"

**Solutions:**

1. **Refresh token**
```javascript
// Use refresh endpoint
fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ token: oldToken })
})
```

2. **Check JWT secret**
```bash
# Verify JWT_SECRET hasn't changed
docker exec jacommander env | grep JWT_SECRET
```

3. **Clear browser storage**
```javascript
localStorage.clear();
sessionStorage.clear();
```

4. **Re-login**
- Logout completely
- Close browser
- Login again

---

## Storage Backend Issues

### S3 Connection Failed

**Symptom:** Cannot access S3 buckets

**Diagnosis:**
```bash
# Test S3 connection
aws s3 ls s3://bucket-name \
  --endpoint-url $S3_ENDPOINT \
  --region $S3_REGION
```

**Solutions:**

1. **Verify credentials**
```bash
# Check environment
docker exec jacommander env | grep S3_

# Test credentials
aws configure set aws_access_key_id $S3_ACCESS_KEY
aws configure set aws_secret_access_key $S3_SECRET_KEY
aws s3 ls
```

2. **Check endpoint**
```env
# Common endpoints:
S3_ENDPOINT=https://s3.amazonaws.com
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

3. **Verify region**
```env
# Must match bucket region
S3_REGION=us-east-1
```

4. **Check IAM permissions**
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:ListBucket",
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject"
  ],
  "Resource": [
    "arn:aws:s3:::bucket-name",
    "arn:aws:s3:::bucket-name/*"
  ]
}
```

5. **Bucket exists**
```bash
aws s3 ls | grep bucket-name
```

---

### Google Drive Authentication Failed

**Symptom:** Cannot connect to Google Drive

**Solutions:**

1. **Verify credentials**
```bash
docker exec jacommander env | grep GDRIVE_
```

2. **Check API enabled**
- Visit: https://console.cloud.google.com/
- APIs & Services → Enabled APIs
- Verify "Google Drive API" is enabled

3. **Regenerate refresh token**
- OAuth2 Playground: https://developers.google.com/oauthplayground/
- Select Drive API v3
- Authorize and get new refresh token

4. **Check OAuth consent screen**
- Must be published (not in testing)
- Add your email to test users if in testing

5. **Verify scopes**
```
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/drive.file
```

---

### FTP/SFTP Connection Timeout

**Symptom:** Cannot connect to FTP server

**Diagnosis:**
```bash
# Test SFTP
sftp -vvv user@hostname

# Test FTP
ftp hostname
```

**Solutions:**

1. **Check connection string**
```env
# Format: host:port:user:pass
FTP_SERVERS=ftp.example.com:21:user:password
```

2. **Verify port**
```bash
# FTP: port 21
# SFTP: port 22
# FTPS: port 990

# Test connectivity
telnet hostname port
nc -zv hostname port
```

3. **Firewall rules**
```bash
# Allow outbound connections
sudo ufw allow out 21/tcp
sudo ufw allow out 22/tcp
```

4. **Passive mode**
```env
FTP_PASSIVE_MODE=true
```

5. **SSH key auth**
```bash
# Copy key to container
docker cp ~/.ssh/id_rsa jacommander:/app/.ssh/
```

---

### WebDAV Access Denied

**Symptom:** Cannot list WebDAV directory

**Solutions:**

1. **Check URL format**
```env
# Include protocol and path
WEBDAV_SERVERS=https://cloud.example.com/remote.php/dav:user:pass
```

2. **Verify credentials**
```bash
# Test with curl
curl -X PROPFIND \
  -H "Depth: 1" \
  -u user:pass \
  https://server.com/dav/
```

3. **SSL certificate**
```env
# Ignore SSL errors (development only)
WEBDAV_INSECURE=true
```

4. **Authentication method**
```env
# Try digest auth instead of basic
WEBDAV_AUTH_METHOD=digest
```

---

## Performance Issues

### Virtual Scrolling Glitches

**Symptom:** File list rendering issues

**Solutions:**

1. **Clear browser cache**
```javascript
localStorage.clear();
location.reload();
```

2. **Disable animations**
```
F9 → Appearance → Disable animations
```

3. **Reduce item height**
```
F9 → View → Compact mode
```

4. **Update browser**
- Use latest Chrome/Firefox/Edge
- Enable hardware acceleration

---

### WebSocket Disconnects

**Symptom:** Real-time updates stop working

**Solutions:**

1. **Check WebSocket connection**
```javascript
// Browser console
console.log(ws.readyState);
// 0: CONNECTING
// 1: OPEN
// 2: CLOSING
// 3: CLOSED
```

2. **Increase timeout**
```env
WEBSOCKET_TIMEOUT=300  # 5 minutes
```

3. **Check proxy settings**
- Nginx: Add WebSocket upgrade headers
- Apache: Enable mod_proxy_wstunnel

4. **Firewall**
```bash
# Allow WebSocket connections
sudo ufw allow 8080/tcp
```

---

## File Operation Issues

### Copy/Move Fails

**Symptom:** File operations return errors

**Solutions:**

1. **Check permissions**
```bash
# Verify source readable
ls -la /source/path

# Verify destination writable
touch /dest/path/test && rm /dest/path/test
```

2. **Check disk space**
```bash
df -h /dest/path
```

3. **File name issues**
- Remove special characters
- Check max filename length (255 chars)
- Avoid reserved names (CON, PRN, AUX on Windows)

4. **Path traversal**
- Ensure paths don't contain ../
- Use absolute paths

---

### Archive Extraction Fails

**Symptom:** Cannot extract ZIP/TAR files

**Solutions:**

1. **Verify archive integrity**
```bash
# Test ZIP
unzip -t archive.zip

# Test TAR
tar -tzf archive.tar.gz
```

2. **Check format support**
```
Supported: ZIP, TAR, TAR.GZ, GZ, BZ2
Not supported: RAR, 7Z, XZ
```

3. **Password protected**
```json
{
  "source": "archive.zip",
  "password": "secret"
}
```

4. **Disk space**
```bash
# Archive may expand 10x
df -h /extraction/path
```

---

## Browser-Specific Issues

### Safari

**Issue:** Upload doesn't work

**Solution:**
- Enable JavaScript
- Allow popups
- Disable "Prevent Cross-Site Tracking"

---

### Firefox

**Issue:** Keyboard shortcuts conflict

**Solution:**
```
about:config
Set browser.ctrlTab.previews to false
```

---

### Chrome

**Issue:** Download prompts every time

**Solution:**
- Settings → Downloads
- Disable "Ask where to save each file"

---

## Logging and Debugging

### Enable Debug Logging

```env
LOG_LEVEL=debug
LOG_FORMAT=text
```

### View Logs

```bash
# Docker
docker logs -f jacommander

# Filter errors
docker logs jacommander 2>&1 | grep ERROR

# Last 100 lines
docker logs --tail 100 jacommander

# Follow logs
docker logs -f --tail 100 jacommander
```

### Browser Console

```
F12 → Console
```

Look for:
- JavaScript errors (red)
- Network failures (red)
- WebSocket messages
- API responses

---

## Getting Help

### Gather Information

Before reporting issues, collect:

1. **System info**
```bash
docker version
docker-compose version
uname -a
```

2. **Container logs**
```bash
docker logs jacommander > logs.txt
```

3. **Configuration**
```bash
docker exec jacommander env > config.txt
# Remove sensitive data before sharing!
```

4. **Browser info**
- Browser name and version
- Console errors (F12)
- Network tab errors

### Report Issue

**GitHub Issues:** https://github.com/jacar-javi/jacommander/issues

**Include:**
- Steps to reproduce
- Expected behavior
- Actual behavior
- System information
- Logs (sanitized)
- Screenshots if applicable

### Community Support

- **Discussions:** https://github.com/jacar-javi/jacommander/discussions
- **Wiki:** https://github.com/jacar-javi/jacommander/wiki

---

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Login or refresh token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify path exists |
| 409 | Conflict | File exists, use overwrite |
| 413 | Payload Too Large | Reduce file size or increase limit |
| 429 | Too Many Requests | Wait and retry |
| 500 | Server Error | Check server logs |
| 503 | Service Unavailable | Check service is running |
| 507 | Insufficient Storage | Free up disk space |

---

## Quick Fixes

### Reset Everything

```bash
# Stop and remove containers
docker-compose down -v

# Remove images
docker rmi jacarjavi/jacommander:latest

# Clear volumes
docker volume prune

# Start fresh
docker-compose up -d
```

### Clear Browser Data

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Restart Application

```bash
# Docker
docker-compose restart

# Manual
# Ctrl+C then re-run:
./jacommander
```

---

## Next Steps

- [Installation Guide](installation.md)
- [Configuration](configuration.md)
- [API Documentation](api.md)
- [GitHub Issues](https://github.com/jacar-javi/jacommander/issues)