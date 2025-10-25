# Environment Variables Reference

## Overview

JaCommander is configured using environment variables. Create a `.env` file in the project root or set variables in your shell/container environment.

**Template:** See `config/default.env` for a complete example.

---

## Server Configuration

### PORT
**Port number for HTTP server**

- **Type**: Integer
- **Default**: `8080`
- **Range**: `1024-65535`
- **Required**: No

**Example:**
```env
PORT=8080
```

**Docker override:**
```yaml
ports:
  - "9090:8080"  # External:Internal
```

### HOST
**Network interface to bind**

- **Type**: String (IP address)
- **Default**: `0.0.0.0` (all interfaces)
- **Required**: No

**Example:**
```env
HOST=0.0.0.0      # All interfaces
HOST=127.0.0.1    # Localhost only
HOST=192.168.1.10 # Specific interface
```

---

## Security Configuration

### ENABLE_AUTH
**Enable user authentication**

- **Type**: Boolean
- **Default**: `false`
- **Required**: No

**Example:**
```env
ENABLE_AUTH=true
```

**When enabled, requires:**
- `ADMIN_USER`
- `ADMIN_PASS`
- `JWT_SECRET`

### ADMIN_USER
**Administrator username**

- **Type**: String
- **Default**: None
- **Required**: If `ENABLE_AUTH=true`

**Example:**
```env
ADMIN_USER=admin
```

**Best practices:**
- Use unique username (not "admin" in production)
- Minimum 4 characters
- Alphanumeric recommended

### ADMIN_PASS
**Administrator password**

- **Type**: String
- **Default**: None
- **Required**: If `ENABLE_AUTH=true`

**Example:**
```env
ADMIN_PASS=your-secure-password-here
```

**Best practices:**
- Minimum 12 characters
- Mix uppercase, lowercase, numbers, symbols
- Use password manager to generate
- Change default immediately

### JWT_SECRET
**Secret key for JWT token signing**

- **Type**: String (hex recommended)
- **Default**: None
- **Required**: If `ENABLE_AUTH=true`

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Generate secure secret:**
```bash
# 32-byte hex string
openssl rand -hex 32

# 64-byte hex string (more secure)
openssl rand -hex 64
```

### SESSION_TIMEOUT
**JWT session timeout in seconds**

- **Type**: Integer
- **Default**: `3600` (1 hour)
- **Range**: `300-86400` (5 minutes to 24 hours)
- **Required**: No

**Example:**
```env
SESSION_TIMEOUT=3600   # 1 hour
SESSION_TIMEOUT=7200   # 2 hours
SESSION_TIMEOUT=86400  # 24 hours
```

### ALLOWED_IPS
**Whitelist of allowed IP addresses or ranges**

- **Type**: Comma-separated list (CIDR notation)
- **Default**: None (all IPs allowed)
- **Required**: No

**Example:**
```env
# Single IP
ALLOWED_IPS=192.168.1.100

# Multiple IPs
ALLOWED_IPS=192.168.1.100,192.168.1.101

# IP range (CIDR)
ALLOWED_IPS=192.168.1.0/24

# Multiple ranges
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8,172.16.0.0/12
```

### BLOCKED_IPS
**Blacklist of blocked IP addresses or ranges**

- **Type**: Comma-separated list (CIDR notation)
- **Default**: None
- **Required**: No

**Example:**
```env
BLOCKED_IPS=203.0.113.0/24,198.51.100.0/24
```

---

## Local Storage Configuration

### LOCAL_STORAGE_1 to LOCAL_STORAGE_10
**Paths for local filesystem access**

- **Type**: String (filesystem path)
- **Default**: None
- **Required**: No (at least one recommended)

**Example:**
```env
LOCAL_STORAGE_1=/data
LOCAL_STORAGE_2=/uploads
LOCAL_STORAGE_3=/downloads
LOCAL_STORAGE_4=/backups
LOCAL_STORAGE_5=/media
```

**Docker mapping:**
```yaml
volumes:
  - /host/path/data:/data
  - /host/path/uploads:/uploads
```

**Best practices:**
- Use absolute paths
- Ensure directories exist
- Verify permissions (read/write)
- Avoid system directories (/, /etc, /sys)

---

## AWS S3 Configuration

### S3_ENABLED
**Enable AWS S3 storage backend**

- **Type**: Boolean
- **Default**: `false`
- **Required**: No

**Example:**
```env
S3_ENABLED=true
```

### S3_ENDPOINT
**S3-compatible API endpoint**

- **Type**: URL
- **Default**: `https://s3.amazonaws.com`
- **Required**: If `S3_ENABLED=true`

**Example:**
```env
# AWS S3
S3_ENDPOINT=https://s3.amazonaws.com

# DigitalOcean Spaces
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com

# MinIO
S3_ENDPOINT=https://minio.example.com

# Wasabi
S3_ENDPOINT=https://s3.wasabisys.com

# Backblaze B2
S3_ENDPOINT=https://s3.us-west-000.backblazeb2.com
```

### S3_ACCESS_KEY
**S3 access key ID**

- **Type**: String
- **Default**: None
- **Required**: If `S3_ENABLED=true`

**Example:**
```env
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
```

### S3_SECRET_KEY
**S3 secret access key**

- **Type**: String
- **Default**: None
- **Required**: If `S3_ENABLED=true`

**Example:**
```env
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Security:**
- Never commit to version control
- Use IAM roles when possible
- Rotate keys regularly
- Grant minimum required permissions

### S3_BUCKETS
**Comma-separated list of S3 bucket names**

- **Type**: Comma-separated string
- **Default**: None
- **Required**: If `S3_ENABLED=true`

**Example:**
```env
S3_BUCKETS=my-bucket
S3_BUCKETS=bucket1,bucket2,bucket3
```

### S3_REGION
**AWS region for S3 buckets**

- **Type**: String
- **Default**: `us-east-1`
- **Required**: No

**Example:**
```env
S3_REGION=us-east-1
S3_REGION=eu-west-1
S3_REGION=ap-southeast-1
```

---

## Google Drive Configuration

### GDRIVE_ENABLED
**Enable Google Drive storage backend**

- **Type**: Boolean
- **Default**: `false`
- **Required**: No

**Example:**
```env
GDRIVE_ENABLED=true
```

### GDRIVE_CLIENT_ID
**Google OAuth2 client ID**

- **Type**: String
- **Default**: None
- **Required**: If `GDRIVE_ENABLED=true`

**Example:**
```env
GDRIVE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**Obtain from:**
https://console.cloud.google.com/apis/credentials

### GDRIVE_CLIENT_SECRET
**Google OAuth2 client secret**

- **Type**: String
- **Default**: None
- **Required**: If `GDRIVE_ENABLED=true`

**Example:**
```env
GDRIVE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### GDRIVE_REFRESH_TOKEN
**Google OAuth2 refresh token**

- **Type**: String
- **Default**: None
- **Required**: If `GDRIVE_ENABLED=true`

**Example:**
```env
GDRIVE_REFRESH_TOKEN=1//0abcdefghijklmnopqrstuvwxyz
```

**Generate refresh token:**
Use OAuth2 Playground or custom authentication flow.

---

## Microsoft OneDrive Configuration

### ONEDRIVE_ENABLED
**Enable OneDrive storage backend**

- **Type**: Boolean
- **Default**: `false`
- **Required**: No

**Example:**
```env
ONEDRIVE_ENABLED=true
```

### ONEDRIVE_CLIENT_ID
**Azure AD application client ID**

- **Type**: String (UUID)
- **Default**: None
- **Required**: If `ONEDRIVE_ENABLED=true`

**Example:**
```env
ONEDRIVE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
```

**Obtain from:**
https://portal.azure.com/ → App registrations

### ONEDRIVE_CLIENT_SECRET
**Azure AD application client secret**

- **Type**: String
- **Default**: None
- **Required**: If `ONEDRIVE_ENABLED=true`

**Example:**
```env
ONEDRIVE_CLIENT_SECRET=abc~DEF123ghi456JKL789mno
```

### ONEDRIVE_REFRESH_TOKEN
**OneDrive OAuth2 refresh token**

- **Type**: String
- **Default**: None
- **Required**: If `ONEDRIVE_ENABLED=true`

**Example:**
```env
ONEDRIVE_REFRESH_TOKEN=M.R3_BAY.abcdefghijklmnopqrstuvwxyz
```

---

## FTP/SFTP Configuration

### FTP_ENABLED
**Enable FTP/SFTP storage backend**

- **Type**: Boolean
- **Default**: `false`
- **Required**: No

**Example:**
```env
FTP_ENABLED=true
```

### FTP_SERVERS
**FTP/SFTP server connection strings**

- **Type**: Comma-separated connection strings
- **Format**: `host:port:username:password`
- **Default**: None
- **Required**: If `FTP_ENABLED=true`

**Example:**
```env
# Single server
FTP_SERVERS=ftp.example.com:21:user:pass

# Multiple servers
FTP_SERVERS=ftp1.example.com:21:user1:pass1,sftp.example.com:22:user2:pass2

# SFTP (port 22)
FTP_SERVERS=sftp.example.com:22:user:pass
```

**Security note:**
Use SFTP (port 22) instead of FTP (port 21) when possible.

---

## WebDAV Configuration

### WEBDAV_ENABLED
**Enable WebDAV storage backend**

- **Type**: Boolean
- **Default**: `false`
- **Required**: No

**Example:**
```env
WEBDAV_ENABLED=true
```

### WEBDAV_SERVERS
**WebDAV server connection strings**

- **Type**: Comma-separated connection strings
- **Format**: `https://url:username:password`
- **Default**: None
- **Required**: If `WEBDAV_ENABLED=true`

**Example:**
```env
# Nextcloud
WEBDAV_SERVERS=https://cloud.example.com/remote.php/dav/files/username:user:pass

# ownCloud
WEBDAV_SERVERS=https://owncloud.example.com/remote.php/webdav:user:pass

# Multiple servers
WEBDAV_SERVERS=https://server1.com/dav:user1:pass1,https://server2.com/dav:user2:pass2
```

---

## Performance Settings

### MAX_UPLOAD_SIZE
**Maximum file upload size in bytes**

- **Type**: Integer
- **Default**: `5368709120` (5GB)
- **Range**: `1048576` to `107374182400` (1MB to 100GB)
- **Required**: No

**Example:**
```env
MAX_UPLOAD_SIZE=5368709120   # 5GB
MAX_UPLOAD_SIZE=10737418240  # 10GB
MAX_UPLOAD_SIZE=1073741824   # 1GB
```

**Common values:**
- 1GB = 1073741824
- 5GB = 5368709120
- 10GB = 10737418240
- 50GB = 53687091200

### CHUNK_SIZE
**Upload chunk size in bytes**

- **Type**: Integer
- **Default**: `8388608` (8MB)
- **Range**: `1048576` to `104857600` (1MB to 100MB)
- **Required**: No

**Example:**
```env
CHUNK_SIZE=8388608   # 8MB
CHUNK_SIZE=16777216  # 16MB
CHUNK_SIZE=4194304   # 4MB
```

**Recommendations:**
- Fast connections: 16-32MB
- Standard connections: 8MB
- Slow connections: 4MB

### WORKER_THREADS
**Number of concurrent operation threads**

- **Type**: Integer
- **Default**: `4`
- **Range**: `1-32`
- **Required**: No

**Example:**
```env
WORKER_THREADS=4   # Standard
WORKER_THREADS=8   # High performance
WORKER_THREADS=2   # Low resource
```

**Recommendations:**
- CPU cores × 1 for I/O bound operations
- CPU cores × 2 for mixed workloads

### CACHE_ENABLED
**Enable caching system**

- **Type**: Boolean
- **Default**: `true`
- **Required**: No

**Example:**
```env
CACHE_ENABLED=true
```

### CACHE_SIZE_MB
**Cache size in megabytes**

- **Type**: Integer
- **Default**: `256`
- **Range**: `16-4096`
- **Required**: No

**Example:**
```env
CACHE_SIZE_MB=256   # 256MB
CACHE_SIZE_MB=512   # 512MB
CACHE_SIZE_MB=1024  # 1GB
```

---

## Logging Configuration

### LOG_LEVEL
**Logging verbosity level**

- **Type**: String (enum)
- **Default**: `info`
- **Options**: `debug`, `info`, `warn`, `error`
- **Required**: No

**Example:**
```env
LOG_LEVEL=debug  # Development
LOG_LEVEL=info   # Production
LOG_LEVEL=warn   # Minimal logging
LOG_LEVEL=error  # Errors only
```

### LOG_FORMAT
**Log output format**

- **Type**: String (enum)
- **Default**: `json`
- **Options**: `json`, `text`
- **Required**: No

**Example:**
```env
LOG_FORMAT=json  # Structured logs for parsing
LOG_FORMAT=text  # Human-readable logs
```

---

## Compression Settings

### ENABLE_GZIP
**Enable gzip compression for HTTP responses**

- **Type**: Boolean
- **Default**: `true`
- **Required**: No

**Example:**
```env
ENABLE_GZIP=true
```

### COMPRESSION_LEVEL
**Gzip compression level**

- **Type**: Integer
- **Default**: `6`
- **Range**: `1-9` (1=fastest, 9=best compression)
- **Required**: No

**Example:**
```env
COMPRESSION_LEVEL=6  # Balanced
COMPRESSION_LEVEL=9  # Maximum compression
COMPRESSION_LEVEL=1  # Fastest
```

**Recommendations:**
- Production: 6 (balanced)
- CPU-constrained: 1-3
- Bandwidth-constrained: 7-9

---

## Complete Example

**Production configuration:**

```env
# Server
PORT=8080
HOST=0.0.0.0

# Security
ENABLE_AUTH=true
ADMIN_USER=admin
ADMIN_PASS=$(cat /run/secrets/admin_password)
JWT_SECRET=$(cat /run/secrets/jwt_secret)
SESSION_TIMEOUT=7200
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8

# Local Storage
LOCAL_STORAGE_1=/data
LOCAL_STORAGE_2=/uploads
LOCAL_STORAGE_3=/downloads

# AWS S3
S3_ENABLED=true
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=$(cat /run/secrets/s3_access_key)
S3_SECRET_KEY=$(cat /run/secrets/s3_secret_key)
S3_BUCKETS=production-files,user-uploads
S3_REGION=us-east-1

# Performance
MAX_UPLOAD_SIZE=10737418240
CHUNK_SIZE=16777216
WORKER_THREADS=8
CACHE_ENABLED=true
CACHE_SIZE_MB=512

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Compression
ENABLE_GZIP=true
COMPRESSION_LEVEL=6
```

---

## Docker Secrets

**For sensitive data, use Docker secrets:**

```yaml
services:
  jacommander:
    secrets:
      - admin_password
      - jwt_secret
      - s3_access_key
      - s3_secret_key
    environment:
      ADMIN_PASS_FILE: /run/secrets/admin_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  admin_password:
    file: ./secrets/admin_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

---

## Next Steps

- [Configuration Guide](configuration.md)
- [Storage Backends Setup](storage-backends.md)
- [Security Best Practices](security.md)
