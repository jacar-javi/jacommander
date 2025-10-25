# Installation Guide

## Prerequisites

### System Requirements
- **CPU**: 1 core minimum, 2+ cores recommended
- **RAM**: 512MB minimum, 1GB+ recommended
- **Storage**: 100MB for application + space for files
- **OS**: Linux, macOS, or Windows (WSL2)

### Software Requirements

#### Docker Installation (Recommended)
- **Docker**: 20.10 or later
- **Docker Compose**: 2.0 or later

#### Manual Installation
- **Go**: 1.24 or later
- **Git**: 2.0 or later

## Quick Install Methods

### Method 1: Docker (Recommended)

**Fastest way to get started**

```bash
# Clone repository
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander

# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:8080
```

**Using pre-built image:**

```bash
# Pull and run official image
docker pull jacarjavi/jacommander:latest
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  --name jacommander \
  jacarjavi/jacommander:latest
```

### Method 2: Docker with Custom Configuration

```bash
# Create configuration file
cat > .env <<EOF
PORT=8080
HOST=0.0.0.0
LOCAL_STORAGE_1=/data
LOCAL_STORAGE_2=/uploads
MAX_UPLOAD_SIZE=5368709120
EOF

# Start with custom config
docker-compose up -d

# Access at http://localhost:8080
```

### Method 3: Manual Installation

**For development or custom deployments**

```bash
# Install Go 1.24+
# Visit: https://golang.org/dl/

# Clone repository
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander

# Download dependencies
go mod download

# Run application
go run backend/main.go

# Access at http://localhost:8080
```

### Method 4: Build from Source

**Production binary**

```bash
# Clone repository
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander

# Build optimized binary
CGO_ENABLED=0 go build \
  -ldflags="-s -w" \
  -o jacommander \
  ./backend

# Run binary
./jacommander

# Access at http://localhost:8080
```

## Platform-Specific Installation

### Linux

**Ubuntu/Debian:**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Install JaCommander
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander
docker-compose up -d
```

**CentOS/RHEL:**

```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install JaCommander
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander
docker-compose up -d
```

### macOS

**Using Homebrew:**

```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop from Applications
# Wait for Docker to start

# Install JaCommander
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander
docker-compose up -d
```

### Windows

**Using WSL2 (Recommended):**

```powershell
# Install WSL2
wsl --install

# Open WSL2 terminal and follow Linux instructions
wsl

# Inside WSL2
git clone https://github.com/jacar-javi/jacommander.git
cd jacommander
docker-compose up -d
```

## Post-Installation

### Verify Installation

```bash
# Check container status
docker ps | grep jacommander

# View logs
docker logs jacommander

# Test API
curl http://localhost:8080/api/health
```

### Configure Volumes

**Edit docker-compose.yml:**

```yaml
services:
  jacommander:
    volumes:
      - /path/to/your/files:/data
      - /path/to/uploads:/uploads
      - /path/to/downloads:/downloads
```

**Restart to apply:**

```bash
docker-compose down
docker-compose up -d
```

### Enable Authentication

**Create .env file:**

```bash
cat > .env <<EOF
ENABLE_AUTH=true
ADMIN_USER=admin
ADMIN_PASS=your-secure-password
JWT_SECRET=$(openssl rand -hex 32)
SESSION_TIMEOUT=3600
EOF
```

**Restart:**

```bash
docker-compose restart
```

## Upgrading

### Docker Upgrade

```bash
# Pull latest image
docker-compose pull

# Restart with new version
docker-compose down
docker-compose up -d

# Verify version
docker logs jacommander | grep "version"
```

### Manual Upgrade

```bash
# Pull latest code
git pull origin main

# Rebuild
go build -ldflags="-s -w" -o jacommander ./backend

# Restart application
./jacommander
```

## Uninstallation

### Remove Docker Installation

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove images
docker rmi jacarjavi/jacommander:latest

# Remove project directory
cd ..
rm -rf jacommander
```

### Remove Manual Installation

```bash
# Stop application (Ctrl+C if running)

# Remove binary
rm jacommander

# Remove project directory
cd ..
rm -rf jacommander
```

## Troubleshooting Installation

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "9090:8080"  # Use port 9090 instead

# Or set in .env
PORT=9090
```

### Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker ps
```

### Container Won't Start

```bash
# Check logs
docker logs jacommander

# Remove and recreate
docker-compose down
docker-compose up -d

# Check system resources
docker stats
```

### Cannot Access Web Interface

```bash
# Verify container is running
docker ps | grep jacommander

# Check port mapping
docker port jacommander

# Test locally
curl http://localhost:8080

# Check firewall
sudo ufw allow 8080/tcp  # Ubuntu
sudo firewall-cmd --add-port=8080/tcp --permanent  # CentOS
```

## Next Steps

- [Configure Environment Variables](environment-variables.md)
- [Set Up Storage Backends](storage-backends.md)
- [Learn Keyboard Shortcuts](keyboard-shortcuts.md)
- [Explore Features](features.md)
