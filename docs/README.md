# JaCommander Documentation

**Complete documentation for JaCommander - Modern dual-panel file manager for the web**

---

## Quick Start

### New Users

1. [Installation Guide](installation.md) - Get JaCommander running in minutes
2. [Keyboard Shortcuts](keyboard-shortcuts.md) - Learn essential shortcuts
3. [Features Overview](features.md) - Discover what JaCommander can do

### System Administrators

1. [Configuration Guide](configuration.md) - Production deployment setup
2. [Environment Variables](environment-variables.md) - Complete variable reference
3. [Storage Backends](storage-backends.md) - Connect to S3, Google Drive, NFS, etc.

### Developers

1. [API Documentation](api.md) - RESTful API and WebSocket reference
2. [Contributing Guide](../CONTRIBUTING.md) - How to contribute
3. [Troubleshooting](troubleshooting.md) - Debug common issues

---

## Documentation Index

### Getting Started

#### [Installation Guide](installation.md)
**Set up JaCommander using Docker or build from source**

- System requirements
- Docker installation (recommended)
- Manual installation
- Platform-specific instructions
- Post-installation configuration
- Upgrading and uninstallation

**Quick install:**
```bash
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander
docker-compose up -d
# Access at http://localhost:8080
```

---

#### [Features Guide](features.md)
**Comprehensive overview of all features**

- Dual-panel interface
- Keyboard-first navigation
- Multi-storage support (local, S3, Google Drive, OneDrive, FTP, WebDAV, NFS)
- Theme system and internationalization
- File operations (copy, move, delete, compress)
- Advanced search and batch rename
- Multi-tab support
- Integrated terminal
- Docker management

**Core capabilities:**
- 📁 Dual panels for parallel operations
- ⌨️ F1-F10 function keys + shortcuts
- 🌍 14+ languages supported
- 🎨 Dark/light themes
- ☁️ Multiple cloud storage backends

---

### Configuration

#### [Configuration Guide](configuration.md)
**Complete configuration documentation**

- Configuration methods (.env, Docker Compose, environment variables)
- Common scenarios (personal use, home network, small business, enterprise)
- Docker Compose examples
- Runtime configuration
- Security configuration
- Performance tuning

**Basic configuration:**
```env
PORT=8080
ENABLE_AUTH=true
ADMIN_USER=admin
ADMIN_PASS=secure-password
LOCAL_STORAGE_1=/data
```

---

#### [Environment Variables Reference](environment-variables.md)
**Detailed reference for all environment variables**

- Server configuration (PORT, HOST)
- Security settings (authentication, IP restrictions)
- Local storage paths
- Cloud storage (S3, Google Drive, OneDrive)
- Remote protocols (FTP/SFTP, WebDAV)
- Performance settings
- Logging configuration

**Variable categories:**
- 🖥️ Server configuration
- 🔒 Security settings
- 💾 Storage backends
- ⚡ Performance tuning
- 📝 Logging options

---

#### [Storage Backends Guide](storage-backends.md)
**Configure and connect to multiple storage types**

- Local filesystem
- Amazon S3 (and S3-compatible services)
- Google Drive
- Microsoft OneDrive
- FTP/SFTP
- WebDAV (Nextcloud, ownCloud)
- NFS (Network File System)
- Redis (database storage)

**Supported backends:**
- 📂 Local filesystem - Direct server access
- ☁️ AWS S3 - Cloud object storage
- 📊 Google Drive - Google Workspace integration
- 💼 OneDrive - Microsoft 365 integration
- 🔄 FTP/SFTP - Legacy file transfer
- 🌐 WebDAV - Standard web protocol
- 🏢 NFS - Enterprise network storage
- 💿 Redis - High-speed cache

---

### Usage

#### [Keyboard Shortcuts Reference](keyboard-shortcuts.md)
**Complete keyboard shortcut documentation**

- Function keys (F1-F12)
- Navigation shortcuts
- Panel control
- Selection shortcuts
- File operations
- Search and filter
- Tab management
- Bookmarks

**Essential shortcuts:**
```
F1    - Help          F5    - Copy
F2    - Terminal      F6    - Move
F3    - View          F7    - New Folder
F4    - Edit          F8    - Delete
Tab   - Switch Panel  Space - Select
```

---

### Development

#### [API Documentation](api.md)
**RESTful API and WebSocket reference**

- Authentication (login, refresh, logout)
- File system operations (list, download, upload, mkdir, copy, move, delete)
- Compression operations (compress, decompress)
- Search operations
- Storage backend operations
- WebSocket API for real-time updates
- Error responses and rate limiting

**API endpoints:**
- `POST /api/auth/login` - Authenticate
- `GET /api/fs/list` - List directory
- `POST /api/fs/upload` - Upload file
- `POST /api/fs/compress` - Create archive
- `WS /api/ws` - WebSocket updates

**Example:**
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'

# List files
curl "http://localhost:8080/api/fs/list?path=/data" \
  -H "Authorization: Bearer {token}"
```

---

### Support

#### [Troubleshooting Guide](troubleshooting.md)
**Solutions for common issues**

- Installation issues
- Runtime problems
- Authentication errors
- Storage backend failures
- Performance optimization
- Browser-specific issues
- Logging and debugging

**Common issues:**
- 🐳 Docker container won't start
- 🌐 Cannot access web interface
- 🔐 Login failures
- ☁️ S3/cloud connection errors
- 📁 File operation failures
- 🐌 Slow performance

---

## Feature Highlights

### Dual-Panel Interface
Work with two directories simultaneously. Copy, move, and compare files between panels with ease.

### Multi-Storage Support
Access local files, S3 buckets, Google Drive, OneDrive, FTP servers, and more from a single interface.

### Keyboard-First Design
Complete keyboard control with F1-F10 function keys and advanced shortcuts for maximum efficiency.

### Real-Time Updates
WebSocket integration provides live progress tracking for uploads, downloads, and file operations.

### Internationalization
Support for 14+ languages including English, Spanish, German, French, Chinese, Japanese, and more.

### Security Features
Optional authentication, IP whitelisting, rate limiting, and path traversal protection.

### Performance
Virtual scrolling handles thousands of files, intelligent caching, and chunked uploads for large files.

---

## Architecture

### Technology Stack

**Backend:**
- Go (Golang) 1.25+
- Gorilla Mux (routing)
- Gorilla WebSocket (real-time updates)

**Frontend:**
- Vanilla JavaScript (ES6+)
- Pure CSS with CSS Variables
- No framework dependencies

**Deployment:**
- Docker with multi-stage builds
- Docker Compose orchestration
- <50MB container image

### Project Structure

```
jacommander/
├── backend/
│   ├── main.go              # HTTP server entry point
│   ├── handlers/            # Request handlers
│   │   ├── filesystem.go    # File operations
│   │   ├── compression.go   # Archive operations
│   │   ├── websocket.go     # WebSocket handling
│   │   └── storage.go       # Storage backends
│   ├── storage/             # Storage abstraction layer
│   │   ├── interface.go     # Storage interface
│   │   ├── local.go         # Local filesystem
│   │   ├── s3.go            # Amazon S3
│   │   ├── gdrive.go        # Google Drive
│   │   ├── onedrive.go      # Microsoft OneDrive
│   │   ├── ftp.go           # FTP/SFTP
│   │   ├── webdav.go        # WebDAV
│   │   └── nfs.go           # NFS
│   └── security/            # Security features
│       └── ip_validator.go  # IP validation
├── frontend/
│   ├── index.html           # Main HTML
│   ├── css/                 # Stylesheets
│   │   ├── main.css         # Main styles
│   │   ├── panels.css       # Panel styles
│   │   └── themes.css       # Theme definitions
│   └── js/                  # JavaScript modules
│       ├── app.js           # Main application
│       ├── panels.js        # Panel management
│       ├── fileops.js       # File operations
│       ├── keyboard.js      # Keyboard handling
│       ├── websocket.js     # WebSocket client
│       └── i18n.js          # Internationalization
├── docs/                    # Documentation (you are here)
├── config/                  # Configuration files
│   └── default.env          # Environment template
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Container orchestration
└── README.md                # Project overview
```

---

## Common Tasks

### Upload Files
1. Navigate to target directory
2. Drag and drop files or click upload button
3. Monitor progress via WebSocket
4. Confirm completion

### Copy Between Panels
1. Select files in source panel (Space or Insert)
2. Navigate target directory in opposite panel
3. Press F5 to copy
4. Handle conflicts (skip/overwrite/rename)

### Create Archive
1. Select files to compress (Ctrl+A for all)
2. Press Alt+F5
3. Choose format (ZIP, TAR, TAR.GZ)
4. Set compression level
5. Confirm creation

### Search Files
1. Press Ctrl+S
2. Choose search type (name/content/pattern)
3. Enter search query
4. Navigate results with arrow keys
5. Press Enter to open

### Configure Cloud Storage
1. Edit .env file with credentials
2. Enable storage backend (S3_ENABLED=true)
3. Restart container
4. Access from storage selector

---

## Best Practices

### Security
- Enable authentication in production
- Use strong passwords (12+ characters)
- Generate secure JWT secrets
- Restrict IP access when possible
- Use HTTPS in production
- Rotate credentials regularly

### Performance
- Match worker threads to CPU cores
- Increase chunk size for fast networks
- Enable caching for frequently accessed files
- Use SSD for local storage
- Optimize compression level (6 for balanced)

### Deployment
- Use Docker for consistent deployment
- Store secrets in Docker secrets or vault
- Monitor resource usage (docker stats)
- Set up log rotation
- Configure backups for important data
- Use health checks in production

### Usage
- Learn keyboard shortcuts for efficiency
- Use bookmarks for frequent directories
- Organize with multiple tabs
- Enable hidden files when needed
- Use batch rename for bulk operations

---

## Additional Resources

### Official Links
- **Website:** https://jacommander.io
- **GitHub:** https://github.com/jacar-javi/jacommander
- **Docker Hub:** https://hub.docker.com/r/jacarjavi/jacommander
- **Issues:** https://github.com/jacar-javi/jacommander/issues
- **Discussions:** https://github.com/jacar-javi/jacommander/discussions

### Community
- **Contributing:** [CONTRIBUTING.md](../CONTRIBUTING.md)
- **License:** [MIT License](../LICENSE)
- **Code of Conduct:** Be respectful and constructive

### External Documentation
- **Go:** https://golang.org/doc/
- **Docker:** https://docs.docker.com/
- **AWS S3:** https://docs.aws.amazon.com/s3/
- **Google Drive API:** https://developers.google.com/drive
- **Microsoft Graph:** https://docs.microsoft.com/en-us/graph/

---

## Version History

### v1.3 (Current)
- Open source release
- Multi-storage support
- Enhanced security features
- Performance optimizations
- Comprehensive documentation

### Upcoming Features
- Mobile responsive design
- File preview (images, videos, PDFs)
- Bulk operation queue
- Keyboard shortcut customization
- Plugin system
- Electron desktop app

---

## Support

### Getting Help

**Documentation Issues:**
- Found a typo or error? Open an issue!
- Missing information? Request documentation updates!

**Technical Support:**
- Check [Troubleshooting Guide](troubleshooting.md)
- Search existing [GitHub Issues](https://github.com/jacar-javi/jacommander/issues)
- Ask in [Discussions](https://github.com/jacar-javi/jacommander/discussions)

**Feature Requests:**
- Open a [feature request](https://github.com/jacar-javi/jacommander/issues/new?labels=enhancement)
- Describe use case and expected behavior
- Check roadmap for planned features

**Bug Reports:**
- Open a [bug report](https://github.com/jacar-javi/jacommander/issues/new?labels=bug)
- Include steps to reproduce
- Provide system information and logs

---

## Contributing to Documentation

Found an error or want to improve the docs?

1. Fork the repository
2. Edit documentation in `docs/` directory
3. Submit a pull request
4. Reference any related issues

**Documentation style:**
- Use clear, concise language
- Include code examples
- Add troubleshooting tips
- Keep formatting consistent

---

## GitHub Pages

This documentation is available at: `https://jacar-javi.github.io/jacommander/`

To enable GitHub Pages:
1. Go to repository settings: https://github.com/jacar-javi/jacommander/settings/pages
2. Under "Build and deployment", select "GitHub Actions"
3. The `.github/workflows/pages.yml` workflow will deploy automatically

---

## License

JaCommander is open source software licensed under the [MIT License](../LICENSE).

Copyright (c) 2025 Javier Cañete Arroyo

---

<div align="center">

**Happy file managing!**

Made with ❤️ by [Javier Cañete Arroyo](https://github.com/jacar-javi)

[⬆ Back to Top](#jacommander-documentation)

</div>