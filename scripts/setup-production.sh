#!/bin/bash
# JaCommander Production Setup Script
#
# This script automates the setup of a production JaCommander instance by:
# - Creating necessary directories
# - Generating secure secrets
# - Setting proper permissions
# - Validating configuration
#
# Usage:
#   chmod +x scripts/setup-production.sh
#   ./scripts/setup-production.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running in project root
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found!"
    print_info "Please run this script from the project root directory"
    exit 1
fi

print_header "JaCommander Production Setup"

# 1. Create directories
print_info "Creating directories..."
mkdir -p secrets
mkdir -p data
mkdir -p uploads
mkdir -p downloads
mkdir -p backups
mkdir -p config
print_success "Directories created"

# 2. Set directory permissions
print_info "Setting directory permissions..."
chmod 700 secrets
chmod 755 data uploads downloads backups config
print_success "Directory permissions set"

# 3. Generate admin password
print_info "Generating admin password..."
if [ -f "secrets/admin_password.txt" ]; then
    print_warning "Admin password already exists, skipping generation"
else
    openssl rand -base64 32 > secrets/admin_password.txt
    chmod 600 secrets/admin_password.txt
    print_success "Admin password generated: secrets/admin_password.txt"
    print_warning "IMPORTANT: Save this password securely!"
    echo ""
    echo -e "${YELLOW}Admin Password: $(cat secrets/admin_password.txt)${NC}"
    echo ""
fi

# 4. Generate JWT secret
print_info "Generating JWT secret..."
if [ -f "secrets/jwt_secret.txt" ]; then
    print_warning "JWT secret already exists, skipping generation"
else
    openssl rand -hex 64 > secrets/jwt_secret.txt
    chmod 600 secrets/jwt_secret.txt
    print_success "JWT secret generated: secrets/jwt_secret.txt"
fi

# 5. Create example storage config if not exists
print_info "Creating storage configuration..."
if [ -f "config/storage.json" ]; then
    print_warning "Storage config already exists, skipping creation"
else
    cat > config/storage.json << 'EOF'
{
  "storages": [
    {
      "id": "local_1",
      "type": "local",
      "displayName": "Data",
      "icon": "💾",
      "config": {
        "root_path": "/data"
      },
      "isDefault": true
    },
    {
      "id": "local_2",
      "type": "local",
      "displayName": "Uploads",
      "icon": "📤",
      "config": {
        "root_path": "/uploads"
      },
      "isDefault": false
    },
    {
      "id": "local_3",
      "type": "local",
      "displayName": "Downloads",
      "icon": "📥",
      "config": {
        "root_path": "/downloads"
      },
      "isDefault": false
    }
  ]
}
EOF
    chmod 644 config/storage.json
    print_success "Storage config created: config/storage.json"
fi

# 6. Create SSH known_hosts placeholder
print_info "Creating SSH known_hosts file..."
if [ -f "config/ssh_known_hosts" ]; then
    print_warning "SSH known_hosts already exists, skipping creation"
else
    touch config/ssh_known_hosts
    chmod 644 config/ssh_known_hosts
    print_success "SSH known_hosts created: config/ssh_known_hosts"
    print_info "Add SFTP server host keys using: ssh-keyscan -H sftp.example.com >> config/ssh_known_hosts"
fi

# 7. Create .env.production example
print_info "Creating .env.production template..."
if [ -f ".env.production" ]; then
    print_warning ".env.production already exists, skipping creation"
else
    cat > .env.production << 'EOF'
# Production Environment Configuration
# This file is for reference only - actual secrets are in ./secrets/

# IMPORTANT: Update ALLOWED_ORIGIN to your actual domain
ALLOWED_ORIGIN=https://files.example.com

# Authentication is enabled via docker-compose.prod.yml
# Credentials are managed through Docker secrets

# Optional: IP allowlist (comma-separated CIDR ranges)
# ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8

# Cloud Storage (uncomment and configure as needed)
# S3_ENABLED=true
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_BUCKETS=production-files,user-uploads
# S3_REGION=us-east-1

# FTP/SFTP (uncomment if needed)
# FTP_ENABLED=true
# SSH_KNOWN_HOSTS=/etc/ssh/ssh_known_hosts
# SSH_INSECURE=false  # NEVER set to true in production!
EOF
    chmod 644 .env.production
    print_success ".env.production template created"
fi

# 8. Validate Docker installation
print_info "Validating Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    print_info "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker is installed"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed!"
    print_info "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
print_success "Docker Compose is installed"

# 9. Create backup script
print_info "Creating backup script..."
mkdir -p scripts
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
# JaCommander Backup Script
# Usage: ./scripts/backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup in $BACKUP_DIR..."

# Backup data volumes
docker run --rm \
    -v jacommander_data:/data:ro \
    -v jacommander_uploads:/uploads:ro \
    -v jacommander_downloads:/downloads:ro \
    -v "$(pwd)/$BACKUP_DIR:/backup" \
    alpine sh -c '
        tar czf /backup/data.tar.gz /data
        tar czf /backup/uploads.tar.gz /uploads
        tar czf /backup/downloads.tar.gz /downloads
    '

# Backup configuration
cp config/storage.json "$BACKUP_DIR/"
cp docker-compose.prod.yml "$BACKUP_DIR/"

# Backup secrets (encrypted)
if command -v gpg &> /dev/null; then
    tar czf - secrets/ | gpg --encrypt --recipient jacommander@example.com > "$BACKUP_DIR/secrets.tar.gz.gpg"
    echo "Secrets backed up (encrypted)"
else
    echo "WARNING: gpg not found, secrets not backed up"
fi

echo "Backup completed: $BACKUP_DIR"
EOF
chmod +x scripts/backup.sh
print_success "Backup script created: scripts/backup.sh"

# 10. Create restore script
print_info "Creating restore script..."
cat > scripts/restore.sh << 'EOF'
#!/bin/bash
# JaCommander Restore Script
# Usage: ./scripts/restore.sh <backup_directory>

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_directory>"
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "Restoring from $BACKUP_DIR..."

# Restore data volumes
docker run --rm \
    -v jacommander_data:/data \
    -v jacommander_uploads:/uploads \
    -v jacommander_downloads:/downloads \
    -v "$(pwd)/$BACKUP_DIR:/backup:ro" \
    alpine sh -c '
        tar xzf /backup/data.tar.gz -C /
        tar xzf /backup/uploads.tar.gz -C /
        tar xzf /backup/downloads.tar.gz -C /
    '

# Restore configuration
cp "$BACKUP_DIR/storage.json" config/

echo "Restore completed"
echo "Please restart JaCommander: docker-compose -f docker-compose.prod.yml restart"
EOF
chmod +x scripts/restore.sh
print_success "Restore script created: scripts/restore.sh"

# 11. Summary
print_header "Setup Complete!"

echo -e "${GREEN}✓ Production environment is ready${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Review and update configuration:"
echo "   - Edit ALLOWED_ORIGIN in docker-compose.prod.yml"
echo "   - Review resource limits and storage paths"
echo ""
echo "2. (Optional) Configure cloud storage:"
echo "   - Uncomment desired storage backends in docker-compose.prod.yml"
echo "   - Create secrets for API keys: echo 'key' > secrets/s3_access_key.txt"
echo ""
echo "3. (Optional) Setup SFTP host verification:"
echo "   - Run: ssh-keyscan -H sftp.example.com >> config/ssh_known_hosts"
echo ""
echo "4. Start JaCommander:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "5. Check logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "6. Verify health:"
echo "   curl http://localhost:8080/api/health"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "- Admin password: secrets/admin_password.txt"
echo "- Username: admin"
echo "- Access: http://localhost:8080 (configure reverse proxy for external access)"
echo ""
echo -e "${YELLOW}Security reminders:${NC}"
echo "- Set ALLOWED_ORIGIN to your actual domain"
echo "- Use HTTPS with a reverse proxy (nginx, traefik, caddy)"
echo "- Keep secrets/ directory secure (never commit to git)"
echo "- Regularly backup using: ./scripts/backup.sh"
echo ""
print_success "Setup complete!"
