# JaCommander Docker Image

[![Docker Pulls](https://img.shields.io/docker/pulls/jacarjavi/jacommander)](https://hub.docker.com/r/jacarjavi/jacommander)
[![Docker Image Size](https://img.shields.io/docker/image-size/jacarjavi/jacommander/latest)](https://hub.docker.com/r/jacarjavi/jacommander)
[![Docker Image Version](https://img.shields.io/docker/v/jacarjavi/jacommander)](https://hub.docker.com/r/jacarjavi/jacommander/tags)

Modern dual-panel web file manager with cloud storage support (S3, Google Drive, OneDrive, FTP/SFTP, WebDAV, NFS, Redis).

## Quick Start

```bash
docker run -d \
  --name jacommander \
  -p 8080:8080 \
  -v /path/to/your/files:/data \
  jacarjavi/jacommander:latest
```

Then open http://localhost:8080 in your browser.

## Features

- 🎛️ **Dual-Panel Interface** - Norton Commander-style file management
- ⌨️ **Keyboard-First** - Complete F1-F10 function key support
- 🌍 **Multi-Storage** - Local, S3, Google Drive, OneDrive, FTP, WebDAV, NFS, Redis
- 🎨 **Modern UI** - Dark/Light themes with smooth animations
- 🌐 **14+ Languages** - English, Spanish, German, French, Chinese, Japanese, and more
- 📦 **Archive Support** - ZIP, TAR, TAR.GZ compression/extraction
- 🔍 **Advanced Search** - Content and pattern-based search with regex
- 📋 **Multi-Tab** - Work with multiple locations simultaneously
- 🔒 **Secure** - IP validation, path traversal prevention, rate limiting
- ⚡ **Fast** - Virtual scrolling, WebSocket updates, < 50MB image

## Docker Compose

```yaml
version: '3.8'
services:
  jacommander:
    image: jacarjavi/jacommander:latest
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
      - ./uploads:/uploads
      - ./downloads:/downloads
    environment:
      - PORT=8080
      - MAX_UPLOAD_SIZE=5368709120  # 5GB
    restart: unless-stopped
```

## Links

- **GitHub**: https://github.com/jacar-javi/jacommander
- **Documentation**: https://github.com/jacar-javi/jacommander/blob/main/docs/README.md
- **Issues**: https://github.com/jacar-javi/jacommander/issues

## License

MIT License
