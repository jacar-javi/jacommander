# Configuration Guide

## Quick Start

### Minimal Configuration

**Local filesystem only:**

```env
PORT=8080
LOCAL_STORAGE_1=/data
```

### Standard Configuration

**With authentication:**

```env
PORT=8080
HOST=0.0.0.0

ENABLE_AUTH=true
ADMIN_USER=admin
ADMIN_PASS=secure-password-here
JWT_SECRET=$(openssl rand -hex 32)

LOCAL_STORAGE_1=/data
LOCAL_STORAGE_2=/uploads

MAX_UPLOAD_SIZE=5368709120
```

## Configuration Methods

### Method 1: .env File (Recommended)

**Create `.env` in project root:**

```bash
# Copy template
cp config/default.env .env

# Edit configuration
nano .env
```

**Advantages:**
- Version control friendly (add to .gitignore)
- Easy to edit
- Standard approach
- Supports comments

### Method 2: Docker Compose

**Edit `docker-compose.yml`:**

```yaml
services:
  jacommander:
    environment:
      PORT: 8080
      ENABLE_AUTH: "true"
      ADMIN_USER: admin
      ADMIN_PASS: ${ADMIN_PASSWORD}
      LOCAL_STORAGE_1: /data
    volumes:
      - ./data:/data
```

**Advantages:**
- Container-specific settings
- Override .env values
- Environment variable substitution
- Multiple service coordination

### Method 3: Shell Environment

**Export variables:**

```bash
export PORT=8080
export ENABLE_AUTH=true
export ADMIN_USER=admin
export ADMIN_PASS=secret

./jacommander
```

**Advantages:**
- No configuration files
- Runtime configuration
- Temporary settings

### Method 4: Docker Secrets

**For production deployments:**

```yaml
services:
  jacommander:
    secrets:
      - admin_password
      - jwt_secret
    environment:
      ADMIN_PASS_FILE: /run/secrets/admin_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  admin_password:
    external: true
  jwt_secret:
    external: true
```

**Create secrets:**

```bash
echo "secure-password" | docker secret create admin_password -
openssl rand -hex 32 | docker secret create jwt_secret -
```

**Advantages:**
- Encrypted at rest
- Secure distribution
- No plaintext in files
- Audit trail

## Configuration Scenarios

### Scenario 1: Personal Use

**Single user, local files only**

```env
PORT=8080
HOST=127.0.0.1  # Localhost only
ENABLE_AUTH=false
LOCAL_STORAGE_1=/home/user/Documents
LOCAL_STORAGE_2=/home/user/Downloads
```

### Scenario 2: Home Network

**Multiple users on LAN**

```env
PORT=8080
HOST=0.0.0.0

ENABLE_AUTH=true
ADMIN_USER=family
ADMIN_PASS=FamilyPassword123
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SESSION_TIMEOUT=7200

ALLOWED_IPS=192.168.1.0/24

LOCAL_STORAGE_1=/media/nas/shared
LOCAL_STORAGE_2=/media/nas/movies
LOCAL_STORAGE_3=/media/nas/music
```

### Scenario 3: Small Business

**Team access with cloud storage**

```env
PORT=8080
HOST=0.0.0.0

ENABLE_AUTH=true
ADMIN_USER=admin
ADMIN_PASS_FILE=/run/secrets/admin_password
JWT_SECRET_FILE=/run/secrets/jwt_secret
SESSION_TIMEOUT=3600

ALLOWED_IPS=10.0.0.0/8

LOCAL_STORAGE_1=/data/company
LOCAL_STORAGE_2=/data/projects

S3_ENABLED=true
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_FILE=/run/secrets/s3_access_key
S3_SECRET_KEY_FILE=/run/secrets/s3_secret_key
S3_BUCKETS=company-documents,project-files
S3_REGION=us-east-1

MAX_UPLOAD_SIZE=10737418240
WORKER_THREADS=8
CACHE_SIZE_MB=512

LOG_LEVEL=info
LOG_FORMAT=json
```

### Scenario 4: Enterprise

**Multi-storage with advanced security**

```env
PORT=8080
HOST=0.0.0.0

ENABLE_AUTH=true
ADMIN_USER=admin
ADMIN_PASS_FILE=/run/secrets/admin_password
JWT_SECRET_FILE=/run/secrets/jwt_secret
SESSION_TIMEOUT=1800

ALLOWED_IPS=10.0.0.0/8,172.16.0.0/12
RATE_LIMIT=100

# Local Storage
LOCAL_STORAGE_1=/mnt/nfs/shared
LOCAL_STORAGE_2=/mnt/nfs/departments

# Cloud Storage
S3_ENABLED=true
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_FILE=/run/secrets/s3_access_key
S3_SECRET_KEY_FILE=/run/secrets/s3_secret_key
S3_BUCKETS=enterprise-docs,backups
S3_REGION=us-east-1

GDRIVE_ENABLED=true
GDRIVE_CLIENT_ID_FILE=/run/secrets/gdrive_client_id
GDRIVE_CLIENT_SECRET_FILE=/run/secrets/gdrive_client_secret
GDRIVE_REFRESH_TOKEN_FILE=/run/secrets/gdrive_refresh_token

ONEDRIVE_ENABLED=true
ONEDRIVE_CLIENT_ID_FILE=/run/secrets/onedrive_client_id
ONEDRIVE_CLIENT_SECRET_FILE=/run/secrets/onedrive_client_secret
ONEDRIVE_REFRESH_TOKEN_FILE=/run/secrets/onedrive_refresh_token

# NFS
NFS_ENABLED=true
NFS_SERVERS=nfs1.company.com:/export,nfs2.company.com:/backup

# WebDAV
WEBDAV_ENABLED=true
WEBDAV_SERVERS=https://nextcloud.company.com/remote.php/dav:admin:pass

# Performance
MAX_UPLOAD_SIZE=53687091200  # 50GB
CHUNK_SIZE=33554432          # 32MB
WORKER_THREADS=16
CACHE_ENABLED=true
CACHE_SIZE_MB=2048

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_AUDIT_LOG=true

# Compression
ENABLE_GZIP=true
COMPRESSION_LEVEL=6

# Security
TLS_ENABLED=true
TLS_CERT_FILE=/run/secrets/tls_cert
TLS_KEY_FILE=/run/secrets/tls_key
```

## Docker Compose Examples

### Basic Setup

```yaml
version: '3.8'

services:
  jacommander:
    image: jacarjavi/jacommander:latest
    container_name: jacommander
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      PORT: 8080
      LOCAL_STORAGE_1: /data
    restart: unless-stopped
```

### With Environment File

```yaml
version: '3.8'

services:
  jacommander:
    image: jacarjavi/jacommander:latest
    container_name: jacommander
    ports:
      - "${PORT:-8080}:8080"
    volumes:
      - ./data:/data
      - ./uploads:/uploads
    env_file:
      - .env
    restart: unless-stopped
```

### With Secrets

```yaml
version: '3.8'

services:
  jacommander:
    image: jacarjavi/jacommander:latest
    container_name: jacommander
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    secrets:
      - admin_password
      - jwt_secret
    environment:
      ENABLE_AUTH: "true"
      ADMIN_USER: admin
      ADMIN_PASS_FILE: /run/secrets/admin_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      LOCAL_STORAGE_1: /data
    restart: unless-stopped

secrets:
  admin_password:
    file: ./secrets/admin_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### With Multiple Services

```yaml
version: '3.8'

services:
  jacommander:
    image: jacarjavi/jacommander:latest
    container_name: jacommander
    depends_on:
      - redis
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      PORT: 8080
      LOCAL_STORAGE_1: /data
      REDIS_ENABLED: "true"
      REDIS_HOST: redis
      REDIS_PORT: 6379
    restart: unless-stopped

  redis:
    image: redis:alpine
    container_name: jacommander-redis
    restart: unless-stopped

networks:
  default:
    name: jacommander-network
```

## Runtime Configuration

### Application Settings

**Access via UI:** Press `F9`

**Available Settings:**
- Language preference
- Theme (dark/light/auto)
- Date/time format
- File size format (bytes, KB, MB)
- Show hidden files
- Confirm deletions
- Default panel layout
- Keyboard shortcut customization

**Persistence:**
- Saved to browser localStorage
- Per-user settings
- Survives browser refresh
- Export/import settings

### User Interface Customization

**Panels:**
```javascript
// Via browser console
localStorage.setItem('panelLayout', 'equal');  // equal, left, right
localStorage.setItem('showHidden', 'true');
localStorage.setItem('sortBy', 'name');        // name, size, date, type
localStorage.setItem('sortOrder', 'asc');      // asc, desc
```

**Theme:**
```javascript
localStorage.setItem('theme', 'dark');  // dark, light, auto
```

**Language:**
```javascript
localStorage.setItem('language', 'en');  // en, es, de, fr, etc.
```

## Security Configuration

### Generate Secure Secrets

**JWT Secret:**
```bash
# 32-byte hex (recommended)
openssl rand -hex 32

# 64-byte hex (maximum security)
openssl rand -hex 64

# Base64 encoded
openssl rand -base64 32
```

**Admin Password:**
```bash
# Random password (16 chars)
openssl rand -base64 16

# Random password (32 chars)
openssl rand -base64 32

# Or use password manager
# - LastPass
# - 1Password
# - Bitwarden
```

### IP Restrictions

**Allow specific IPs:**
```env
ALLOWED_IPS=192.168.1.100,192.168.1.101
```

**Allow IP range:**
```env
ALLOWED_IPS=192.168.1.0/24
```

**Block specific IPs:**
```env
BLOCKED_IPS=203.0.113.0/24
```

**Combine allow and block:**
```env
ALLOWED_IPS=10.0.0.0/8
BLOCKED_IPS=10.0.0.50,10.0.0.51
```

### Session Management

**Short sessions (high security):**
```env
SESSION_TIMEOUT=900  # 15 minutes
```

**Standard sessions:**
```env
SESSION_TIMEOUT=3600  # 1 hour
```

**Extended sessions:**
```env
SESSION_TIMEOUT=28800  # 8 hours
```

## Performance Tuning

### Memory Optimization

**Low memory (< 512MB):**
```env
WORKER_THREADS=2
CACHE_ENABLED=false
COMPRESSION_LEVEL=1
```

**Standard memory (512MB - 2GB):**
```env
WORKER_THREADS=4
CACHE_ENABLED=true
CACHE_SIZE_MB=256
COMPRESSION_LEVEL=6
```

**High memory (> 2GB):**
```env
WORKER_THREADS=8
CACHE_ENABLED=true
CACHE_SIZE_MB=1024
COMPRESSION_LEVEL=6
```

### Network Optimization

**Fast network (> 100Mbps):**
```env
CHUNK_SIZE=33554432  # 32MB
MAX_UPLOAD_SIZE=53687091200  # 50GB
COMPRESSION_LEVEL=1
```

**Standard network (10-100Mbps):**
```env
CHUNK_SIZE=8388608  # 8MB
MAX_UPLOAD_SIZE=10737418240  # 10GB
COMPRESSION_LEVEL=6
```

**Slow network (< 10Mbps):**
```env
CHUNK_SIZE=2097152  # 2MB
MAX_UPLOAD_SIZE=1073741824  # 1GB
COMPRESSION_LEVEL=9
```

### CPU Optimization

**Set worker threads based on CPU cores:**

```bash
# Get CPU core count
nproc

# Set in .env (cores × 1 for I/O bound)
WORKER_THREADS=4

# Set in .env (cores × 2 for mixed workload)
WORKER_THREADS=8
```

## Validation

### Check Configuration

**View active configuration:**
```bash
# Docker
docker exec jacommander env | grep -E '^(PORT|HOST|ENABLE_AUTH|LOCAL_STORAGE)'

# Direct
env | grep -E '^(PORT|HOST|ENABLE_AUTH|LOCAL_STORAGE)'
```

### Test Configuration

**Check server is listening:**
```bash
curl http://localhost:8080/api/health
```

**Check authentication:**
```bash
# Should return 401 if auth enabled
curl http://localhost:8080/api/fs/list

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

**Check storage backends:**
```bash
curl http://localhost:8080/api/storage/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Configuration Not Loading

**Check file exists:**
```bash
ls -la .env
cat .env
```

**Check permissions:**
```bash
chmod 644 .env
```

**Check Docker mount:**
```bash
docker exec jacommander cat /app/.env
```

### Environment Variables Not Applied

**Check precedence:**
1. Shell environment (highest)
2. Docker Compose environment
3. .env file (lowest)

**Override in Docker:**
```yaml
environment:
  PORT: 9090  # Overrides .env
```

### Secrets Not Working

**Verify secret files:**
```bash
ls -la ./secrets/
cat ./secrets/admin_password.txt
```

**Check Docker secret:**
```bash
docker secret ls
docker secret inspect admin_password
```

**Verify mount:**
```bash
docker exec jacommander ls -la /run/secrets/
docker exec jacommander cat /run/secrets/admin_password
```

## Next Steps

- [Environment Variables Reference](environment-variables.md)
- [Storage Backends Setup](storage-backends.md)
- [Security Best Practices](security.md)
- [Performance Optimization](performance.md)
