# 📁 JaCommander

<div align="center">

[![GitHub license](https://img.shields.io/github/license/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/blob/main/LICENSE)
[![Go Version](https://img.shields.io/github/go-mod/go-version/jacar-javi/jacommander)](https://go.dev/)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/releases)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/jacar-javi/jacommander/basic-ci.yml?branch=main)](https://github.com/jacar-javi/jacommander/actions)
[![Go Report Card](https://goreportcard.com/badge/github.com/jacar-javi/jacommander)](https://goreportcard.com/report/github.com/jacar-javi/jacommander)
[![codecov](https://codecov.io/gh/jacar-javi/jacommander/branch/main/graph/badge.svg)](https://codecov.io/gh/jacar-javi/jacommander)

[![GitHub stars](https://img.shields.io/github/stars/jacar-javi/jacommander?style=social)](https://github.com/jacar-javi/jacommander/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/jacar-javi/jacommander?style=social)](https://github.com/jacar-javi/jacommander/network/members)
[![GitHub issues](https://img.shields.io/github/issues/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/pulls)
[![Docker Image Size](https://img.shields.io/docker/image-size/jacarjavi/jacommander/latest)](https://hub.docker.com/r/jacarjavi/jacommander)
[![GitHub last commit](https://img.shields.io/github/last-commit/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/commits/main)

**A modern, minimalist dual-panel file manager for the web**

[Features](#features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API](#-api-documentation) • [Contributing](#-contributing)

📖 **[Complete Documentation](docs/README.md)** • 🚀 **[Installation Guide](docs/installation.md)** • ⌨️ **[Keyboard Shortcuts](docs/keyboard-shortcuts.md)** • 🔧 **[Configuration](docs/configuration.md)**

</div>

---

## 📊 Repository Stats

<div align="center">

[![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander)
[![GitHub repo size](https://img.shields.io/github/repo-size/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander)
[![GitHub all releases](https://img.shields.io/github/downloads/jacar-javi/jacommander/total)](https://github.com/jacar-javi/jacommander/releases)
[![GitHub contributors](https://img.shields.io/github/contributors/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/graphs/contributors)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/commits/main)

</div>

## 🎯 Overview

JaCommander is a powerful web-based file manager inspired by classic dual-panel commanders like Midnight Commander and Total Commander. Built with Go and vanilla JavaScript, it provides a fast, intuitive interface for managing files across multiple storage backends including local filesystem, cloud storage (S3, Google Drive, OneDrive), and remote servers (FTP/SFTP, WebDAV).

## ✨ Features

### Core Functionality
- **🎛️ Dual-Panel Interface** - Work with two directory panels simultaneously
- **⌨️ Keyboard-First Navigation** - Complete F1-F10 function key support + advanced shortcuts
- **🌍 Multi-Storage Support** - Local, S3, Google Drive, OneDrive, FTP/SFTP, WebDAV, NFS, Redis
- **🎨 Modern UI** - Dark/Light themes with smooth animations
- **🌐 14+ Languages** - English, Spanish, German, French, Chinese, Japanese, and more
- **📦 Archive Management** - ZIP, TAR, TAR.GZ compression and extraction
- **🔍 Advanced Search** - Content and pattern-based file search with regex support
- **📋 Multi-Tab Support** - Work with multiple locations simultaneously
- **🐳 Docker Ready** - Easy deployment with minimal resource usage
- **🔒 Security First** - IP validation, path traversal prevention, rate limiting
- **⚡ High Performance** - Virtual scrolling, WebSocket updates, < 50MB Docker image

### Keyboard Shortcuts
| Key | Function | Description |
|-----|----------|-------------|
| **F1** | Help | Show keyboard shortcuts |
| **F2** | Terminal | Open integrated terminal |
| **F3** | View | View file content |
| **F4** | Edit | Edit file in browser |
| **F5** | Copy | Copy selected files |
| **F6** | Move/Rename | Move or rename files |
| **F7** | New Folder | Create directory |
| **F8** | Delete | Delete selected files |
| **F9** | Settings | Open settings panel |
| **F10** | Menu | Toggle menu bar |
| **F11** | Fullscreen | Toggle fullscreen mode |
| **F12** | Dev Tools | Open developer tools |
| **Tab** | Switch Panel | Move focus between panels |
| **Insert** | Select | Mark file and move down |
| **Space** | Quick Select | Select with size calculation |
| **Enter** | Open | Enter directory or open file |
| **Backspace** | Go Back | Navigate to parent directory |
| **Ctrl+A** | Select All | Mark all files in panel |
| **Ctrl+\\** | Deselect All | Clear selection |
| **Ctrl+S** | Search | Search files by name or content |
| **Ctrl+Tab** | Next Tab | Switch to next tab |
| **Alt+F5** | Compress | Create archive from selected |
| **Alt+F6** | Extract | Extract archive to current directory |

## 🚀 Quick Start

### Using Docker (Recommended)

[![Docker Pulls](https://img.shields.io/docker/pulls/jacarjavi/jacommander)](https://hub.docker.com/r/jacarjavi/jacommander)
[![Docker Image Version](https://img.shields.io/docker/v/jacarjavi/jacommander)](https://hub.docker.com/r/jacarjavi/jacommander/tags)

1. Clone the repository or use the latest release:
```bash
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander
# Or download the latest release from: https://github.com/jacar-javi/jacommander/releases/latest
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

### Manual Installation

1. Ensure you have Go 1.25+ installed

2. Clone and build:
```bash
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander
go mod download
go run backend/main.go
```

3. Open browser to http://localhost:8080

## 📖 Documentation

**Comprehensive guides and references:**

### Getting Started
- 📘 **[Documentation Home](docs/README.md)** - Complete documentation index
- 🚀 **[Installation Guide](docs/installation.md)** - Docker, manual, and platform-specific installation
- ✨ **[Features Overview](docs/features.md)** - Detailed feature documentation

### Configuration & Setup
- 🔧 **[Configuration Guide](docs/configuration.md)** - Production deployment and scenarios
- 📝 **[Environment Variables](docs/environment-variables.md)** - Complete variable reference
- 💾 **[Storage Backends](docs/storage-backends.md)** - S3, Google Drive, OneDrive, FTP, WebDAV, NFS

### Usage & Reference
- ⌨️ **[Keyboard Shortcuts](docs/keyboard-shortcuts.md)** - Complete shortcut reference
- 🔌 **[API Documentation](docs/api.md)** - REST API and WebSocket reference
- 🔍 **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

### Quick Links
```bash
# Installation
https://github.com/jacar-javi/jacommander/blob/main/docs/installation.md

# Configuration
https://github.com/jacar-javi/jacommander/blob/main/docs/configuration.md

# Environment Variables
https://github.com/jacar-javi/jacommander/blob/main/docs/environment-variables.md

# Keyboard Shortcuts
https://github.com/jacar-javi/jacommander/blob/main/docs/keyboard-shortcuts.md
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root (see `config/default.env` for example):

```env
# Server
PORT=8080
HOST=0.0.0.0

# Local Storage Paths
LOCAL_STORAGE_1=/data
LOCAL_STORAGE_2=/uploads
LOCAL_STORAGE_3=/downloads

# Performance
MAX_UPLOAD_SIZE=5368709120  # 5GB
CHUNK_SIZE=8388608          # 8MB
```

### Docker Volumes

The Docker setup uses the following volumes:
- `/data` - Primary storage location
- `/uploads` - Upload directory
- `/downloads` - Download directory

Mount your local directories to these volumes in `docker-compose.yml`:

```yaml
volumes:
  - ./my-files:/data
  - ./my-uploads:/uploads
  - ./my-downloads:/downloads
```

## 🏗️ Architecture

### Technology Stack
- **Backend**: Go (Golang) with Gorilla Mux
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Pure CSS with CSS Variables
- **Communication**: REST API + WebSockets
- **Containerization**: Docker with multi-stage builds

### Project Structure
```
jacommander/
├── backend/
│   ├── main.go              # HTTP server
│   ├── handlers/            # Request handlers
│   ├── storage/             # Storage abstraction
│   └── models/              # Data models
├── frontend/
│   ├── index.html          # Main HTML
│   ├── css/                # Stylesheets
│   └── js/                 # JavaScript modules
├── Dockerfile              # Multi-stage build
└── docker-compose.yml      # Container orchestration
```

## 🎯 Performance

- **Docker image**: < 50MB
- **Memory usage**: < 100MB idle
- **Initial load**: < 2 seconds
- **JavaScript bundle**: < 50KB (uncompressed)
- **CSS bundle**: < 20KB (uncompressed)

## 🧪 Development

### Running in Development Mode

```bash
# Using Docker Compose dev profile
docker-compose --profile dev up jacommander-dev

# Or run directly with Go
go run backend/main.go
```

### Building for Production

```bash
# Build Docker image
docker build -t jacommander:latest .

# Or build binary directly
CGO_ENABLED=0 go build -ldflags="-s -w" -o jacommander ./backend
```

## 📝 API Documentation

**📌 [Complete API Reference](docs/api.md)** - Full REST API and WebSocket documentation

### File Operations

- `GET /api/fs/list` - List directory contents
- `POST /api/fs/mkdir` - Create directory
- `POST /api/fs/copy` - Copy files
- `POST /api/fs/move` - Move/rename files
- `DELETE /api/fs/delete` - Delete files
- `GET /api/fs/download` - Download file
- `POST /api/fs/upload` - Upload file

### Compression

- `POST /api/fs/compress` - Create archive
- `POST /api/fs/decompress` - Extract archive

### WebSocket

- `WS /api/ws` - Real-time progress updates

**Example Usage:**

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'

# List files
curl "http://localhost:8080/api/fs/list?path=/data" \
  -H "Authorization: Bearer {token}"
```

See **[API Documentation](docs/api.md)** for complete examples and reference.

## 🎨 Advanced Features

### Storage Backends
- **Local Filesystem** - Direct access to server filesystem
- **AWS S3** - Full S3 API support with multipart uploads
- **Google Drive** - OAuth2 integration with Drive API
- **OneDrive** - Microsoft Graph API integration
- **FTP/SFTP** - Legacy and secure file transfer protocols
- **WebDAV** - Standards-based remote storage
- **NFS** - Network File System for enterprise environments
- **Redis** - Database as file storage for distributed systems

### Additional Capabilities
- **🔄 Batch Rename** - Powerful pattern-based renaming with preview
- **🐋 Docker Management** - Container lifecycle control from the UI
- **💻 Terminal Integration** - Built-in xterm.js terminal emulator
- **📊 Session Persistence** - Restore tabs and panel states
- **🚀 Virtual Scrolling** - Handle directories with thousands of files
- **📡 WebSocket Progress** - Real-time feedback for all operations

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
make test

# Run specific test suites
make test-backend    # Go unit tests
make test-frontend   # JavaScript tests
make test-integration # End-to-end tests

# Generate coverage reports
make coverage

# View coverage in browser
make coverage-report
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone repository
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander

# Install dependencies
make install

# Run development server
make dev

# Run tests before committing
make pre-commit
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Midnight Commander](https://midnight-commander.org/) and [Total Commander](https://www.ghisler.com/)
- Built with [Go](https://golang.org/) and vanilla JavaScript
- Terminal powered by [xterm.js](https://xtermjs.org/)
- WebSocket support via [Gorilla WebSocket](https://github.com/gorilla/websocket)

## 🗺️ Roadmap

### Version 1.3 (Next Release)
- [ ] Mobile responsive design
- [ ] File preview (images, videos, PDFs)
- [ ] Bulk file operations queue
- [ ] Keyboard shortcut customization

### Version 2.0 (Future)
- [ ] Plugin system for extensibility
- [ ] Electron desktop application
- [ ] Collaborative features
- [ ] File versioning and history
- [ ] Encrypted storage backend
- [ ] Advanced permission management

## 📞 Support

- 📖 **Documentation**: [Complete Documentation](docs/README.md) - Guides, references, and tutorials
- 🔍 **Troubleshooting**: [Troubleshooting Guide](docs/troubleshooting.md) - Solutions to common issues
- 🐛 **Issues**: [GitHub Issues](https://github.com/jacar-javi/jacommander/issues) - ![GitHub issues](https://img.shields.io/github/issues-raw/jacar-javi/jacommander)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/jacar-javi/jacommander/discussions) - Community Q&A
- ⭐ **Feature Requests**: [Request a Feature](https://github.com/jacar-javi/jacommander/issues/new?labels=enhancement)
- 🐞 **Bug Reports**: [Report a Bug](https://github.com/jacar-javi/jacommander/issues/new?labels=bug)

## 👥 Contributors

Thanks to all the amazing contributors who help make JaCommander better!

[![Contributors](https://contrib.rocks/image?repo=jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander/graphs/contributors)

Want to contribute? Check out our [Contributing Guide](CONTRIBUTING.md)!

## 📈 Language Composition

[![Top Language](https://img.shields.io/github/languages/top/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander)
[![Language Count](https://img.shields.io/github/languages/count/jacar-javi/jacommander)](https://github.com/jacar-javi/jacommander)

## ⭐ Star History

If you find this project useful, please consider giving it a star! It helps others discover the project.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=jacar-javi/jacommander&type=date&legend=top-left)](https://www.star-history.com/#jacar-javi/jacommander&type=date&legend=top-left)

---

<div align="center">

**JaCommander** - Fast, minimal, efficient file management for the web.

Made with ❤️ by Javier Cañete Arroyo

[Website](https://jacommander.io) • [Documentation](docs/README.md) • [Docker Hub](https://hub.docker.com/r/jacarjavi/jacommander) • [Demo](https://demo.jacommander.io)

</div>
