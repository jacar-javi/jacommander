# Changelog

All notable changes to JaCommander will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Mobile responsive design
- File preview (images, videos, PDFs)
- Bulk file operations queue
- Keyboard shortcut customization
- Enhanced theme customization

## [1.3.0] - 2025-10-25

### Added - Open Source Release 🎉

#### Documentation
- **Comprehensive documentation suite** in `docs/` directory
  - Installation guide with multiple methods
  - Complete features overview
  - Environment variables reference
  - Configuration guide with real-world scenarios
  - Keyboard shortcuts reference
  - Storage backends setup guide
  - REST API and WebSocket documentation
  - Troubleshooting guide
- Updated main README.md with documentation links
- Created documentation index (docs/README.md)

#### GitHub Workflows
- GitHub Pages deployment workflow
- Branch protection configuration script
- Setup guide for repository features

#### Features
- Multi-storage backend support
  - Local filesystem
  - AWS S3 and S3-compatible services
  - Google Drive (OAuth2)
  - Microsoft OneDrive (Graph API)
  - FTP/SFTP
  - WebDAV (Nextcloud, ownCloud)
  - NFS (Network File System)
  - Redis (in-memory storage)
- Dual-panel file management interface
- Keyboard-first navigation (F1-F12 function keys)
- Archive management (ZIP, TAR, TAR.GZ)
- Advanced search (name, content, pattern)
- Multi-tab support
- Integrated terminal (xterm.js)
- Docker management from UI
- Batch rename with patterns
- Session persistence
- Virtual scrolling for large directories
- WebSocket real-time progress updates

#### Internationalization
- Support for 14+ languages
  - English, Spanish, German, French, Italian, Portuguese
  - Russian, Chinese (Simplified & Traditional), Japanese, Korean
  - Arabic (RTL support), Hindi, Turkish

#### Security
- Optional JWT-based authentication
- IP whitelisting and blacklisting
- Path traversal prevention
- Rate limiting
- Secure password hashing
- Session timeout configuration

#### Performance
- Docker image < 50MB
- Memory usage < 100MB (idle)
- Chunk-based uploads for large files
- Intelligent caching system
- Gzip compression for HTTP responses
- Configurable worker threads

#### Developer Experience
- RESTful API for all operations
- WebSocket API for real-time updates
- Comprehensive API documentation
- Example configurations
- Development and production Docker profiles
- Environment variable templates

### Changed
- Updated Docker Hub references to `jacarjavi/jacommander`
- Enhanced README with documentation links
- Improved project structure documentation
- Updated contributing guidelines

### Fixed
- Branch protection script schema validation errors
- Docker Compose configuration
- Environment variable parsing

### Infrastructure
- Multi-stage Docker builds
- Docker Compose orchestration
- GitHub Actions CI/CD
- Code coverage reporting (Codecov)
- Automated testing

## [1.2.0] - Previous Release

### Added
- Basic dual-panel interface
- Local filesystem support
- File operations (copy, move, delete)
- Basic authentication
- Dark/Light themes

### Changed
- UI/UX improvements
- Performance optimizations

### Fixed
- Various bug fixes

## [1.1.0] - Initial Release

### Added
- Initial dual-panel file manager
- Basic file operations
- Web-based interface
- Docker support

---

## Version Naming Scheme

- **Major version** (X.0.0): Breaking changes, major rewrites
- **Minor version** (1.X.0): New features, non-breaking changes
- **Patch version** (1.0.X): Bug fixes, minor improvements

## Release Types

- **[Unreleased]**: Changes in development, not yet released
- **[X.Y.Z]**: Released version with date
- **[X.Y.Z-alpha]**: Alpha release for testing
- **[X.Y.Z-beta]**: Beta release for wider testing
- **[X.Y.Z-rc.N]**: Release candidate

## Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

## Roadmap

### Version 1.4 (Q1 2026)
- Mobile responsive design
- File preview system
- Bulk operations queue
- Custom keyboard shortcuts
- Enhanced file search

### Version 2.0 (Q2-Q3 2026)
- Plugin system for extensibility
- Electron desktop application
- Collaborative features
- File versioning and history
- Encrypted storage backend
- Advanced permission management
- Multi-user support
- Activity logging and audit trails

### Version 3.0 (Future)
- AI-powered file organization
- Advanced analytics and insights
- Integration marketplace
- Team collaboration features
- Enterprise SSO integration

---

## Links

- [GitHub Repository](https://github.com/jacar-javi/jacommander)
- [Docker Hub](https://hub.docker.com/r/jacarjavi/jacommander)
- [Documentation](docs/README.md)
- [Issues](https://github.com/jacar-javi/jacommander/issues)
- [Discussions](https://github.com/jacar-javi/jacommander/discussions)

---

**Note**: Dates follow ISO 8601 format (YYYY-MM-DD)