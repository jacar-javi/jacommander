# GitHub Scripts

This directory contains utility scripts for repository automation and maintenance.

## 📸 Screenshot Generator

Generate screenshots of the JaCommander interface for documentation and social media.

### Prerequisites

```bash
# Install Playwright
npm install -D playwright

# Install browsers
npx playwright install chromium
```

### Usage

**Basic usage** (requires JaCommander running on localhost:8080):
```bash
# Start JaCommander first
docker-compose up -d

# Then run the screenshot script
node .github/scripts/screenshot.js
```

**Advanced usage**:
```bash
# Custom URL
node .github/scripts/screenshot.js --url http://localhost:3000

# Custom output directory
node .github/scripts/screenshot.js --output ./docs/images

# Both options
node .github/scripts/screenshot.js --url http://demo.example.com --output ./marketing
```

### Output Files

The script generates the following screenshots:

- `01-main-interface.png` - Main JaCommander interface (1280x720)
- `02-dual-panel.png` - Dual-panel view (1280x720)
- `03-dark-theme.png` - Dark theme view (1280x720)
- `04-help-menu.png` - Help menu/keyboard shortcuts (1280x720)
- `05-full-page.png` - Full page scrollable view
- `social-preview.png` - Social media preview (1280x640) - **Use for GitHub social preview!**

### Automation

Add this to a GitHub Actions workflow:

```yaml
- name: Generate Screenshots
  run: |
    # Start the application
    docker-compose up -d
    sleep 10

    # Install dependencies
    npm install -D playwright
    npx playwright install chromium

    # Generate screenshots
    node .github/scripts/screenshot.js

    # Stop the application
    docker-compose down
```

### Manual Social Preview Upload

After generating `social-preview.png`:

1. Go to GitHub repository **Settings**
2. Scroll to **Social preview** section
3. Click **Edit** and upload `screenshots/social-preview.png`
4. This improves how your repository looks when shared on social media!

## 🐳 Docker Hub README Sync

The Docker Hub README is automatically synced via the `.github/workflows/docker.yml` workflow.

The specialized Docker Hub README is located at `.docker/README.md` and is optimized for Docker Hub display with:
- Quick start commands
- Environment variables table
- Volume mount examples
- Docker Compose examples

## 📄 GitHub Pages

GitHub Pages documentation is automatically built and deployed via `.github/workflows/pages.yml`.

The workflow:
1. Installs `marked` for proper markdown-to-HTML conversion
2. Generates beautiful HTML pages from markdown files
3. Deploys to GitHub Pages

Pages available:
- https://jacar-javi.github.io/jacommander/ - Main documentation
- https://jacar-javi.github.io/jacommander/api.html - API documentation
- https://jacar-javi.github.io/jacommander/contributing.html - Contributing guide
- https://jacar-javi.github.io/jacommander/security.html - Security policy

## 🔧 Future Scripts

Ideas for additional automation:

- **Changelog generator** - Auto-generate CHANGELOG.md from commits
- **Release notes** - Create formatted release notes from git history
- **Dependency checker** - Check for outdated dependencies
- **Performance benchmarks** - Automated performance testing
- **Link checker** - Verify all links in documentation
