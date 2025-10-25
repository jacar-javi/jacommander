# API Documentation

## Overview

JaCommander provides a RESTful API and WebSocket interface for all file operations.

**Base URL**: `http://localhost:8080/api`

**Content Type**: `application/json`

---

## Authentication

### POST /api/auth/login

**Authenticate user and receive JWT token**

**Request:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

**Status Codes:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded

**Example:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'
```

---

### POST /api/auth/refresh

**Refresh JWT token**

**Request:**
```json
{
  "token": "existing-jwt-token"
}
```

**Response:**
```json
{
  "token": "new-jwt-token",
  "expiresIn": 3600
}
```

**Status Codes:**
- `200 OK` - Token refreshed
- `401 Unauthorized` - Invalid or expired token

---

### POST /api/auth/logout

**Invalidate JWT token**

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200 OK` - Logout successful
- `401 Unauthorized` - Not authenticated

---

## File System Operations

### GET /api/fs/list

**List directory contents**

**Query Parameters:**
- `path` (string, required) - Directory path
- `storage` (string, optional) - Storage backend ID
- `showHidden` (boolean, optional) - Show hidden files
- `sortBy` (string, optional) - Sort field: name, size, date, type
- `sortOrder` (string, optional) - Sort order: asc, desc

**Response:**
```json
{
  "path": "/data",
  "files": [
    {
      "name": "document.pdf",
      "path": "/data/document.pdf",
      "size": 1048576,
      "modified": "2025-10-25T12:00:00Z",
      "isDir": false,
      "permissions": "rw-r--r--",
      "mimeType": "application/pdf"
    },
    {
      "name": "photos",
      "path": "/data/photos",
      "size": 4096,
      "modified": "2025-10-24T10:30:00Z",
      "isDir": true,
      "permissions": "rwxr-xr-x"
    }
  ],
  "totalSize": 10485760,
  "totalFiles": 42,
  "totalDirs": 8
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid path
- `403 Forbidden` - Permission denied
- `404 Not Found` - Directory doesn't exist

**Example:**
```bash
curl "http://localhost:8080/api/fs/list?path=/data&sortBy=name" \
  -H "Authorization: Bearer {token}"
```

---

### GET /api/fs/download

**Download file**

**Query Parameters:**
- `path` (string, required) - File path
- `storage` (string, optional) - Storage backend ID

**Response:**
- Binary file content
- Headers:
  - `Content-Type`: MIME type
  - `Content-Length`: File size
  - `Content-Disposition`: attachment; filename="..."

**Status Codes:**
- `200 OK` - Download started
- `400 Bad Request` - Invalid path
- `403 Forbidden` - Permission denied
- `404 Not Found` - File doesn't exist

**Example:**
```bash
curl "http://localhost:8080/api/fs/download?path=/data/file.txt" \
  -H "Authorization: Bearer {token}" \
  -o file.txt
```

---

### POST /api/fs/upload

**Upload file**

**Content-Type**: `multipart/form-data`

**Form Fields:**
- `path` (string) - Target directory
- `file` (file) - File to upload
- `storage` (string, optional) - Storage backend ID
- `overwrite` (boolean, optional) - Overwrite if exists

**Response:**
```json
{
  "path": "/data/uploaded.txt",
  "size": 2048,
  "message": "File uploaded successfully"
}
```

**Status Codes:**
- `200 OK` - Upload successful
- `400 Bad Request` - Invalid request
- `403 Forbidden` - Permission denied
- `409 Conflict` - File exists and overwrite=false
- `413 Payload Too Large` - File exceeds MAX_UPLOAD_SIZE

**Example:**
```bash
curl -X POST "http://localhost:8080/api/fs/upload" \
  -H "Authorization: Bearer {token}" \
  -F "path=/data" \
  -F "file=@/local/path/file.txt"
```

---

### POST /api/fs/mkdir

**Create directory**

**Request:**
```json
{
  "path": "/data/new-folder",
  "storage": "local",
  "recursive": true,
  "permissions": "0755"
}
```

**Response:**
```json
{
  "path": "/data/new-folder",
  "message": "Directory created successfully"
}
```

**Status Codes:**
- `201 Created` - Directory created
- `400 Bad Request` - Invalid path
- `403 Forbidden` - Permission denied
- `409 Conflict` - Directory already exists

**Example:**
```bash
curl -X POST http://localhost:8080/api/fs/mkdir \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"path":"/data/new-folder","recursive":true}'
```

---

### POST /api/fs/copy

**Copy files**

**Request:**
```json
{
  "sources": ["/data/file1.txt", "/data/file2.txt"],
  "destination": "/data/backup",
  "overwrite": false,
  "preserveTimestamps": true
}
```

**Response:**
```json
{
  "copied": 2,
  "failed": 0,
  "totalSize": 4096,
  "message": "Files copied successfully"
}
```

**Status Codes:**
- `200 OK` - Copy successful
- `207 Multi-Status` - Partial success
- `400 Bad Request` - Invalid request
- `403 Forbidden` - Permission denied

**Example:**
```bash
curl -X POST http://localhost:8080/api/fs/copy \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"sources":["/data/file.txt"],"destination":"/backup"}'
```

---

### POST /api/fs/move

**Move or rename files**

**Request:**
```json
{
  "sources": ["/data/old-name.txt"],
  "destination": "/data/new-name.txt",
  "overwrite": false
}
```

**Response:**
```json
{
  "moved": 1,
  "failed": 0,
  "message": "Files moved successfully"
}
```

**Status Codes:**
- `200 OK` - Move successful
- `207 Multi-Status` - Partial success
- `400 Bad Request` - Invalid request
- `403 Forbidden` - Permission denied
- `409 Conflict` - Destination exists

**Example:**
```bash
curl -X POST http://localhost:8080/api/fs/move \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"sources":["/data/old.txt"],"destination":"/data/new.txt"}'
```

---

### DELETE /api/fs/delete

**Delete files or directories**

**Request:**
```json
{
  "paths": ["/data/file1.txt", "/data/folder"],
  "recursive": true
}
```

**Response:**
```json
{
  "deleted": 2,
  "failed": 0,
  "message": "Files deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Delete successful
- `207 Multi-Status` - Partial success
- `400 Bad Request` - Invalid request
- `403 Forbidden` - Permission denied

**Example:**
```bash
curl -X DELETE http://localhost:8080/api/fs/delete \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"paths":["/data/temp.txt"],"recursive":true}'
```

---

## Compression Operations

### POST /api/fs/compress

**Create archive from files**

**Request:**
```json
{
  "sources": ["/data/file1.txt", "/data/folder"],
  "destination": "/data/archive.zip",
  "format": "zip",
  "compressionLevel": 6,
  "password": "optional-password"
}
```

**Parameters:**
- `format`: zip, tar, tar.gz
- `compressionLevel`: 1-9 (1=fastest, 9=best)

**Response:**
```json
{
  "archive": "/data/archive.zip",
  "size": 2048,
  "filesCompressed": 5,
  "compressionRatio": 0.45,
  "message": "Archive created successfully"
}
```

**Status Codes:**
- `200 OK` - Compression successful
- `400 Bad Request` - Invalid format or sources
- `403 Forbidden` - Permission denied
- `507 Insufficient Storage` - Not enough space

**Example:**
```bash
curl -X POST http://localhost:8080/api/fs/compress \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"sources":["/data/folder"],"destination":"/data/backup.tar.gz","format":"tar.gz"}'
```

---

### POST /api/fs/decompress

**Extract archive**

**Request:**
```json
{
  "source": "/data/archive.zip",
  "destination": "/data/extracted",
  "overwrite": false,
  "password": "optional-password"
}
```

**Response:**
```json
{
  "extracted": "/data/extracted",
  "filesExtracted": 10,
  "totalSize": 10240,
  "message": "Archive extracted successfully"
}
```

**Status Codes:**
- `200 OK` - Extraction successful
- `400 Bad Request` - Invalid archive or format
- `403 Forbidden` - Permission denied
- `409 Conflict` - Files exist and overwrite=false

**Example:**
```bash
curl -X POST http://localhost:8080/api/fs/decompress \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"source":"/data/archive.zip","destination":"/data/out"}'
```

---

## Search Operations

### POST /api/fs/search

**Search for files**

**Request:**
```json
{
  "path": "/data",
  "query": "*.txt",
  "searchType": "name",
  "caseSensitive": false,
  "recursive": true,
  "maxResults": 100
}
```

**Search Types:**
- `name` - Filename pattern matching
- `content` - Full-text search
- `pattern` - Regular expression

**Response:**
```json
{
  "results": [
    {
      "path": "/data/file1.txt",
      "size": 1024,
      "modified": "2025-10-25T12:00:00Z",
      "matches": 3
    }
  ],
  "totalResults": 42,
  "searchTime": 0.125
}
```

**Status Codes:**
- `200 OK` - Search completed
- `400 Bad Request` - Invalid search query

**Example:**
```bash
curl -X POST http://localhost:8080/api/fs/search \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"path":"/data","query":"*.pdf","searchType":"name"}'
```

---

## Storage Backend Operations

### GET /api/storage/list

**List available storage backends**

**Response:**
```json
{
  "backends": [
    {
      "id": "local-1",
      "type": "local",
      "name": "Local Storage",
      "path": "/data",
      "available": true,
      "totalSpace": 107374182400,
      "freeSpace": 53687091200
    },
    {
      "id": "s3-bucket1",
      "type": "s3",
      "name": "AWS S3 - bucket1",
      "bucket": "bucket1",
      "region": "us-east-1",
      "available": true
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8080/api/storage/list \
  -H "Authorization: Bearer {token}"
```

---

### GET /api/storage/info

**Get storage backend information**

**Query Parameters:**
- `id` (string, required) - Storage backend ID

**Response:**
```json
{
  "id": "local-1",
  "type": "local",
  "path": "/data",
  "totalSpace": 107374182400,
  "usedSpace": 53687091200,
  "freeSpace": 53687091200,
  "percentUsed": 50.0,
  "mounted": true,
  "readOnly": false
}
```

**Example:**
```bash
curl "http://localhost:8080/api/storage/info?id=local-1" \
  -H "Authorization: Bearer {token}"
```

---

## WebSocket API

### WS /api/ws

**Real-time operation updates**

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080/api/ws');
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'your-jwt-token'
}));
```

**Message Types:**

**Upload Progress:**
```json
{
  "type": "upload",
  "operation": "upload-123",
  "filename": "largefile.zip",
  "bytesTransferred": 5242880,
  "totalBytes": 10485760,
  "percentage": 50,
  "speed": 1048576,
  "eta": 5
}
```

**Copy Progress:**
```json
{
  "type": "copy",
  "operation": "copy-456",
  "currentFile": "photo.jpg",
  "filesProcessed": 10,
  "totalFiles": 20,
  "percentage": 50
}
```

**Compression Progress:**
```json
{
  "type": "compress",
  "operation": "compress-789",
  "filesProcessed": 5,
  "totalFiles": 10,
  "currentSize": 2048,
  "percentage": 50
}
```

**Error:**
```json
{
  "type": "error",
  "operation": "upload-123",
  "error": "Permission denied",
  "code": 403
}
```

**Complete:**
```json
{
  "type": "complete",
  "operation": "upload-123",
  "result": {
    "path": "/data/uploaded.zip",
    "size": 10485760
  }
}
```

---

## Error Responses

**Standard Error Format:**
```json
{
  "error": "Error message",
  "code": 400,
  "details": "Additional error details",
  "timestamp": "2025-10-25T12:00:00Z"
}
```

**Common Status Codes:**

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no body
- `207 Multi-Status` - Partial success
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `413 Payload Too Large` - File too large
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service down
- `507 Insufficient Storage` - Out of space

---

## Rate Limiting

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

**Limits:**
- API: 100 requests/minute
- Upload: Based on MAX_UPLOAD_SIZE
- WebSocket: 10 connections/user

---

## Examples

### Complete Upload Flow

```javascript
// 1. Login
const loginRes = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'secret' })
});
const { token } = await loginRes.json();

// 2. Connect WebSocket for progress
const ws = new WebSocket('ws://localhost:8080/api/ws');
ws.send(JSON.stringify({ type: 'authenticate', token }));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`Progress: ${data.percentage}%`);
};

// 3. Upload file
const formData = new FormData();
formData.append('path', '/data');
formData.append('file', fileInput.files[0]);

const uploadRes = await fetch('http://localhost:8080/api/fs/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const result = await uploadRes.json();
console.log('Uploaded:', result.path);
```

---

## Client Libraries

**JavaScript/TypeScript:**
```javascript
import { JaCommanderClient } from '@jacommander/client';

const client = new JaCommanderClient('http://localhost:8080');
await client.login('admin', 'password');

const files = await client.listFiles('/data');
await client.uploadFile('/data', file);
```

**Python:**
```python
from jacommander import Client

client = Client('http://localhost:8080')
client.login('admin', 'password')

files = client.list_files('/data')
client.upload_file('/data', 'file.txt')
```

**Go:**
```go
import "github.com/jacar-javi/jacommander-go"

client := jacommander.NewClient("http://localhost:8080")
client.Login("admin", "password")

files, _ := client.ListFiles("/data")
client.UploadFile("/data", "file.txt")
```

---

## Next Steps

- [Installation Guide](installation.md)
- [Configuration](configuration.md)
- [Troubleshooting](troubleshooting.md)