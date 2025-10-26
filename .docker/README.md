# 🐳 JaCommander - Modern Dual-Panel Web File Manager

[![GitHub](https://img.shields.io/badge/GitHub-jacar--javi%2Fjacommander-blue?logo=github)](https://github.com/jacar-javi/jacommander)
[![License](https://img.shields.io/github/license/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/blob/main/LICENSE)
[![Docker Image Size](https://img.shields.io/docker/image-size/jacarjavi/jacommander/latest)](https://hub.docker.com/r/jacarjavi/jacommander)

**A powerful web-based file manager with dual-panel interface and cloud storage support**

---

## 🎯 Quick Start

### Run with Docker

```bash
docker run -d \
  --name jacommander \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  jacarjavi/jacommander:latest
```

Then open your browser to **http://localhost:8080**

### Using Docker Compose

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
      - ./uploads:/uploads
      - ./downloads:/downloads
    environment:
      - PORT=8080
      - HOST=0.0.0.0
      - LOCAL_STORAGE_1=/data
      - LOCAL_STORAGE_2=/uploads
      - LOCAL_STORAGE_3=/downloads
    restart: unless-stopped
```

---

## ✨ Key Features

- **🎛️ Dual-Panel Interface** - Work with two directories simultaneously (Total Commander style)
- **⌨️ Keyboard-First Navigation** - Complete F1-F10 function keys + advanced shortcuts
- **🌍 Multi-Storage Support** - Local filesystem, S3, Google Drive, OneDrive, FTP/SFTP, WebDAV, NFS
- **🎨 Modern UI** - Dark/Light themes with smooth animations
- **🌐 14+ Languages** - Multi-language interface support
- **📦 Archive Management** - ZIP, TAR, TAR.GZ compression and extraction
- **🔍 Advanced Search** - Content and pattern-based file search
- **💻 Built-in Terminal** - Integrated xterm.js terminal
- **⚡ Lightweight** - < 50MB Docker image, < 100MB RAM usage
- **🔒 Security First** - IP validation, path traversal prevention, rate limiting

---

## 📋 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server port |
| `HOST` | `0.0.0.0` | Server bind address |
| `LOCAL_STORAGE_1` | `/data` | Primary storage mount point |
| `LOCAL_STORAGE_2` | - | Secondary storage mount point |
| `LOCAL_STORAGE_3` | - | Tertiary storage mount point |
| `MAX_UPLOAD_SIZE` | `5368709120` | Max upload size in bytes (5GB) |
| `CHUNK_SIZE` | `8388608` | Chunk size for large files (8MB) |

---

## 🔌 Volume Mounts

Mount your directories to access them in JaCommander:

```bash
docker run -d \
  --name jacommander \
  -p 8080:8080 \
  -v /path/to/your/files:/data \
  -v /path/to/uploads:/uploads \
  -v /path/to/downloads:/downloads \
  jacarjavi/jacommander:latest
```

---

## ⌨️ Essential Keyboard Shortcuts

| Key | Function | Description |
|-----|----------|-------------|
| **F1** | Help | Show keyboard shortcuts |
| **F2** | Terminal | Open integrated terminal |
| **F3** | View | View file content |
| **F4** | Edit | Edit file in browser |
| **F5** | Copy | Copy selected files |
| **F6** | Move | Move or rename files |
| **F7** | New Folder | Create directory |
| **F8** | Delete | Delete selected files |
| **Tab** | Switch Panel | Move between panels |
| **Space** | Select | Quick select files |
| **Ctrl+S** | Search | Search files |

---

## 🏗️ Architecture

- **Backend**: Go 1.25+ with Gorilla Mux
- **Frontend**: Vanilla JavaScript (ES6+)
- **Communication**: REST API + WebSockets
- **Image Size**: < 50MB (Alpine-based)
- **Memory Usage**: < 100MB idle
- **Platforms**: linux/amd64, linux/arm64

---

## 🌐 Cloud Storage Configuration

### AWS S3
```yaml
environment:
  - S3_ENDPOINT=https://s3.amazonaws.com
  - S3_BUCKET=my-bucket
  - S3_ACCESS_KEY=your-access-key
  - S3_SECRET_KEY=your-secret-key
```

### Google Drive
```yaml
environment:
  - GOOGLE_DRIVE_CREDENTIALS=/config/credentials.json
volumes:
  - ./google-credentials.json:/config/credentials.json:ro
```

### FTP/SFTP
```yaml
environment:
  - FTP_HOST=ftp.example.com
  - FTP_PORT=21
  - FTP_USERNAME=user
  - FTP_PASSWORD=pass
```

---

## 🔒 Security

- Runs as non-root user (UID 1000)
- Path traversal protection
- Rate limiting on API endpoints
- IP whitelisting support
- HTTPS ready (reverse proxy recommended)

---

## 🚀 Advanced Usage

### Behind Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name files.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### With Traefik

```yaml
services:
  jacommander:
    image: jacarjavi/jacommander:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.jacommander.rule=Host(`files.example.com`)"
      - "traefik.http.services.jacommander.loadbalancer.server.port=8080"
```

---

## 📊 Performance

- **Startup Time**: < 2 seconds
- **Memory Footprint**: < 100MB idle
- **Concurrent Connections**: 1000+
- **Large Directory Handling**: Virtual scrolling for 10,000+ files
- **File Transfer**: Chunked uploads/downloads with progress tracking

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs jacommander

# Verify port availability
netstat -tuln | grep 8080
```

### Permission Issues
```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data

# Or run with your user ID
docker run -d \
  --user $(id -u):$(id -g) \
  -v $(pwd)/data:/data \
  jacarjavi/jacommander:latest
```

### WebSocket Connection Failed
Ensure your reverse proxy supports WebSocket upgrades (see Nginx example above).

---

## 📚 Documentation

- **Full Documentation**: https://github.com/jacar-javi/jacommander/tree/main/docs
- **API Reference**: https://github.com/jacar-javi/jacommander/blob/main/docs/api.md
- **Configuration Guide**: https://github.com/jacar-javi/jacommander/blob/main/docs/configuration.md
- **Keyboard Shortcuts**: https://github.com/jacar-javi/jacommander/blob/main/docs/keyboard-shortcuts.md
- **Troubleshooting**: https://github.com/jacar-javi/jacommander/blob/main/docs/troubleshooting.md

---

## 🔖 Tags

`golang` `file-manager` `web-application` `docker` `dual-panel` `self-hosted` `cloud-storage` `s3` `google-drive` `file-browser` `commander` `total-commander` `midnight-commander`

---

## 📞 Support & Contributing

- **GitHub Repository**: https://github.com/jacar-javi/jacommander
- **Issues**: https://github.com/jacar-javi/jacommander/issues
- **Discussions**: https://github.com/jacar-javi/jacommander/discussions
- **Contributing**: https://github.com/jacar-javi/jacommander/blob/main/CONTRIBUTING.md

---

## ⭐ Star History

If you find JaCommander useful, please consider giving it a star on GitHub!

**Made with ❤️ by Javier Cañete Arroyo**

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](https://github.com/jacar-javi/jacommander/blob/main/LICENSE) for details.
