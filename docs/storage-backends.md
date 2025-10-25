# Storage Backends Guide

## Overview

JaCommander supports multiple storage backends, allowing you to access files from:
- Local filesystem
- Cloud storage (S3, Google Drive, OneDrive)
- Remote servers (FTP/SFTP, WebDAV)
- Network storage (NFS)
- Database storage (Redis)

---

## Local Filesystem

**Direct access to server filesystem**

### Configuration

```env
LOCAL_STORAGE_1=/data
LOCAL_STORAGE_2=/uploads
LOCAL_STORAGE_3=/downloads
```

### Docker Setup

**Map host directories to container:**

```yaml
services:
  jacommander:
    volumes:
      - /host/path/documents:/data
      - /host/path/uploads:/uploads
      - /host/path/downloads:/downloads
    environment:
      LOCAL_STORAGE_1: /data
      LOCAL_STORAGE_2: /uploads
      LOCAL_STORAGE_3: /downloads
```

### Features

- **Full filesystem access**
- **Symbolic link support**
- **Permission preservation**
- **Fast operations** (direct I/O)
- **Large file support** (no size limits)

### Best Practices

- Use absolute paths
- Ensure directories exist before starting
- Set appropriate permissions
- Avoid system directories (/, /etc, /sys, /proc)
- Use separate volumes for different data types

### Permissions

**Set ownership:**
```bash
sudo chown -R 1000:1000 /data
```

**Set permissions:**
```bash
chmod 755 /data              # rwxr-xr-x
chmod 750 /data              # rwxr-x---
chmod 700 /data              # rwx------
```

---

## Amazon S3

**AWS S3 and S3-compatible storage**

### Configuration

```env
S3_ENABLED=true
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKETS=my-bucket,another-bucket
S3_REGION=us-east-1
```

### AWS S3 Setup

**1. Create IAM user:**

```bash
aws iam create-user --user-name jacommander
```

**2. Create access key:**

```bash
aws iam create-access-key --user-name jacommander
```

**3. Attach policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ]
    }
  ]
}
```

**4. Create bucket:**

```bash
aws s3 mb s3://my-bucket --region us-east-1
```

### S3-Compatible Services

**DigitalOcean Spaces:**
```env
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
```

**MinIO:**
```env
S3_ENDPOINT=https://minio.example.com
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

**Wasabi:**
```env
S3_ENDPOINT=https://s3.wasabisys.com
S3_REGION=us-east-1
```

**Backblaze B2:**
```env
S3_ENDPOINT=https://s3.us-west-000.backblazeb2.com
S3_REGION=us-west-000
```

**Cloudflare R2:**
```env
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
```

### Features

- Multipart uploads for large files
- Versioning support
- Server-side encryption
- ACL management
- Lifecycle policies
- Cross-region replication

### Performance Tips

- Use CloudFront for faster downloads
- Enable transfer acceleration
- Optimize chunk size for upload speed
- Use appropriate storage class

---

## Google Drive

**OAuth2 integration with Google Drive API**

### Configuration

```env
GDRIVE_ENABLED=true
GDRIVE_CLIENT_ID=123456789-abcd.apps.googleusercontent.com
GDRIVE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GDRIVE_REFRESH_TOKEN=1//0abcdefghijklmnopqrstuvwxyz
```

### Setup

**1. Create Google Cloud Project:**

Visit: https://console.cloud.google.com/

**2. Enable Google Drive API:**

```
APIs & Services → Enable APIs and Services → Google Drive API
```

**3. Create OAuth2 Credentials:**

```
APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
Application type: Web application
Authorized redirect URIs: http://localhost:8080/oauth2callback
```

**4. Get Refresh Token:**

Use OAuth2 Playground or authentication flow:

```bash
# Visit OAuth2 Playground
https://developers.google.com/oauthplayground/

# Configure:
1. Select "Drive API v3"
2. Authorize APIs
3. Exchange authorization code for tokens
4. Copy refresh_token
```

### Features

- Shared drives support
- File sharing and permissions
- Real-time collaboration
- Version history
- Team drive access
- Large file uploads (5TB limit)

### Limitations

- API rate limits (1000 queries/100 seconds)
- Daily upload quota (750GB/user/day)
- OAuth token expiration (must refresh)

---

## Microsoft OneDrive

**Microsoft Graph API integration**

### Configuration

```env
ONEDRIVE_ENABLED=true
ONEDRIVE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
ONEDRIVE_CLIENT_SECRET=abc~DEF123ghi456JKL789mno
ONEDRIVE_REFRESH_TOKEN=M.R3_BAY.abcdefghijklmnopqrstuvwxyz
```

### Setup

**1. Register Azure AD Application:**

Visit: https://portal.azure.com/ → App registrations

**2. Configure Application:**

```
Name: JaCommander
Supported account types: Personal Microsoft accounts
Redirect URI: http://localhost:8080/oauth2callback
```

**3. Add API Permissions:**

```
Microsoft Graph:
  - Files.Read.All
  - Files.ReadWrite.All
  - User.Read
```

**4. Create Client Secret:**

```
Certificates & secrets → New client secret
```

**5. Get Refresh Token:**

Use Microsoft OAuth2 flow or Graph Explorer.

### Features

- Personal and business accounts
- SharePoint integration
- Office 365 integration
- File versioning
- Sharing and permissions
- Large file support (100GB/file)

### Limitations

- API throttling (per-app and per-user)
- 15GB free storage (personal)
- File name restrictions

---

## FTP/SFTP

**File Transfer Protocol (legacy and secure)**

### Configuration

```env
FTP_ENABLED=true
FTP_SERVERS=ftp.example.com:21:username:password,sftp.example.com:22:user:pass
```

### Connection Formats

**FTP:**
```
hostname:21:username:password
```

**SFTP (SSH):**
```
hostname:22:username:password
```

**FTP with TLS (FTPS):**
```
ftps://hostname:990:username:password
```

### SSH Key Authentication

**For SFTP with key-based auth:**

```env
FTP_SERVERS=sftp.example.com:22:username:~/.ssh/id_rsa
```

**Generate SSH key:**

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jacommander_key
ssh-copy-id -i ~/.ssh/jacommander_key.pub user@sftp.example.com
```

### Features

- Resume broken transfers
- Multiple connection support
- Passive/active modes
- TLS/SSL encryption (FTPS)
- Directory listing caching

### Best Practices

- **Use SFTP** instead of FTP (encrypted)
- Enable connection pooling
- Set timeout values appropriately
- Use key-based auth when possible

### Common Ports

- FTP: 21 (control), 20 (data)
- FTPS: 990
- SFTP: 22

---

## WebDAV

**Web Distributed Authoring and Versioning**

### Configuration

```env
WEBDAV_ENABLED=true
WEBDAV_SERVERS=https://cloud.example.com/remote.php/dav:username:password
```

### Supported Services

**Nextcloud:**
```env
WEBDAV_SERVERS=https://cloud.example.com/remote.php/dav/files/username:user:pass
```

**ownCloud:**
```env
WEBDAV_SERVERS=https://owncloud.example.com/remote.php/webdav:user:pass
```

**Box.com:**
```env
WEBDAV_SERVERS=https://dav.box.com/dav:user:pass
```

**pCloud:**
```env
WEBDAV_SERVERS=https://webdav.pcloud.com:user:pass
```

### Features

- HTTP/HTTPS based
- Standard protocol (RFC 4918)
- Versioning support
- Locking mechanisms
- Properties and metadata
- Cross-platform compatibility

### Authentication

**Basic Auth:**
```
https://username:password@server.com/dav
```

**Digest Auth:**
```
WEBDAV_AUTH_TYPE=digest
```

**Token Auth:**
```
https://server.com/dav:token:app-password
```

---

## NFS

**Network File System**

### Configuration

```env
NFS_ENABLED=true
NFS_SERVERS=nfs.example.com:/export/data,nfs2.example.com:/backup
```

### Server Setup

**On NFS server:**

```bash
# Install NFS server
sudo apt-get install nfs-kernel-server

# Configure exports
sudo nano /etc/exports
```

**/etc/exports:**
```
/export/data    192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
/export/backup  192.168.1.0/24(ro,sync,no_subtree_check)
```

**Restart NFS:**
```bash
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
```

### Client Configuration

**Mount NFS share (if running outside Docker):**

```bash
sudo mount -t nfs nfs.example.com:/export/data /mnt/nfs
```

**Docker volume:**

```yaml
volumes:
  nfs-data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=nfs.example.com,rw
      device: ":/export/data"

services:
  jacommander:
    volumes:
      - nfs-data:/data
```

### Features

- Enterprise-grade performance
- NFSv3 and NFSv4 support
- Kerberos authentication (NFSv4)
- File locking
- POSIX compliance
- Low latency

### Performance Tuning

```
rsize=8192,wsize=8192,timeo=14,intr
```

---

## Redis

**Database as file storage**

### Configuration

```env
REDIS_ENABLED=true
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=optional-password
REDIS_DB=0
```

### Docker Compose Setup

```yaml
services:
  jacommander:
    depends_on:
      - redis
    environment:
      REDIS_ENABLED: "true"
      REDIS_HOST: redis
      REDIS_PORT: 6379

  redis:
    image: redis:alpine
    command: redis-server --requirepass yourpassword
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Features

- In-memory storage (fast)
- Persistence options (RDB, AOF)
- Clustering support
- Replication
- Pub/sub messaging
- TTL support

### Use Cases

- Session storage
- Temporary file cache
- Distributed lock coordination
- High-speed file metadata

### Limitations

- Memory-constrained (not for large files)
- Not a traditional filesystem
- Best for small, frequently accessed files

---

## Mixed Storage Configuration

**Using multiple backends simultaneously:**

```env
# Local
LOCAL_STORAGE_1=/data
LOCAL_STORAGE_2=/uploads

# S3
S3_ENABLED=true
S3_BUCKETS=backups,archives
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx

# Google Drive
GDRIVE_ENABLED=true
GDRIVE_CLIENT_ID=xxx
GDRIVE_CLIENT_SECRET=xxx
GDRIVE_REFRESH_TOKEN=xxx

# NFS
NFS_ENABLED=true
NFS_SERVERS=nfs.company.com:/shared
```

**Access all from single interface**

---

## Troubleshooting

### S3 Connection Issues

**Test connection:**
```bash
aws s3 ls s3://my-bucket --endpoint-url $S3_ENDPOINT
```

**Common issues:**
- Incorrect access key/secret
- Bucket doesn't exist
- Region mismatch
- Endpoint URL wrong
- IAM permissions insufficient

### Google Drive Authentication

**Token expired:**
- Regenerate refresh token
- Check token expiration
- Verify API quota

**Permission denied:**
- Check OAuth scopes
- Verify API enabled
- Check sharing settings

### FTP/SFTP Connection Failed

**Debug connection:**
```bash
sftp -vvv user@hostname
```

**Common issues:**
- Wrong port number
- Firewall blocking
- Credentials incorrect
- SSH key not authorized

### WebDAV Not Accessible

**Test WebDAV:**
```bash
curl -X PROPFIND \
  -H "Depth: 1" \
  -u username:password \
  https://server.com/dav/
```

**Common issues:**
- SSL certificate problems
- Authentication method mismatch
- Server path incorrect
- Credentials invalid

---

## Security Best Practices

1. **Use encrypted protocols** (SFTP, not FTP)
2. **Enable authentication** for all backends
3. **Use secrets management** for credentials
4. **Rotate access keys** regularly
5. **Limit IAM permissions** to minimum required
6. **Enable audit logging** where available
7. **Use VPN** for remote access
8. **Encrypt data at rest** when possible

---

## Next Steps

- [Environment Variables](environment-variables.md)
- [Configuration Guide](configuration.md)
- [Security Best Practices](security.md)