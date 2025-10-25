# GitHub Features Setup Guide

This guide explains all the GitHub features that have been configured for JaCommander and how to use them.

## ✅ Configured Features

### 1. Issue Templates

**Location**: `.github/ISSUE_TEMPLATE/`

**What's included:**
- `bug_report.yml` - Structured bug report form
- `feature_request.yml` - Feature request form with priority levels
- `config.yml` - Links to discussions and documentation

**How to use:**
Users will see these templates when creating new issues at:
https://github.com/jacar-javi/jacommander/issues/new/choose

**No additional setup required** - Templates are active immediately after pushing to GitHub.

---

### 2. Pull Request Template

**Location**: `.github/pull_request_template.md`

**What's included:**
- PR description structure
- Type of change checkboxes
- Testing checklist
- Code quality checklist
- Browser testing section

**How to use:**
This template automatically appears when creating new pull requests.

**No additional setup required** - Active immediately.

---

### 3. Security Policy (SECURITY.md)

**Location**: `SECURITY.md`

**What's included:**
- Supported versions table
- Vulnerability reporting instructions
- Security best practices for deployment
- Docker security guidelines
- Known security considerations

**How to use:**
- Users can view it at: https://github.com/jacar-javi/jacommander/security/policy
- Security tab will appear in your repository
- Enables private security advisories

**No additional setup required** - Active immediately.

---

### 4. Funding Configuration

**Location**: `.github/FUNDING.yml`

**What's included:**
- GitHub Sponsors link
- Placeholders for other platforms (Patreon, Ko-fi, etc.)

**How to customize:**
Edit `.github/FUNDING.yml` and uncomment/add your funding platforms:
```yaml
github: [jacar-javi]  # Your GitHub username
patreon: your-username  # Uncomment and add if using Patreon
ko_fi: your-username    # Uncomment and add if using Ko-fi
```

**To activate:**
1. Push the file to GitHub
2. A "Sponsor" button will appear in your repository

---

### 5. CODEOWNERS

**Location**: `.github/CODEOWNERS`

**What's included:**
- Automatic review requests for @jacar-javi on all PRs
- Specific ownership for backend, frontend, Docker, docs, etc.

**How it works:**
- When someone opens a PR, you'll automatically be requested as a reviewer
- Works with branch protection rules requiring code owner reviews

**To customize:**
Add more owners:
```
/backend/ @jacar-javi @other-maintainer
/frontend/ @jacar-javi @frontend-expert
```

**No additional setup required** - Active immediately.

---

### 6. Dependabot

**Location**: `.github/dependabot.yml`

**What's included:**
- **Go modules** - Weekly updates for Go dependencies
- **Docker** - Weekly updates for Docker base images
- **GitHub Actions** - Weekly updates for workflow actions
- Automatic PR creation for dependency updates
- Grouped updates for minor/patch versions

**How it works:**
- Dependabot automatically checks for updates every Monday at 9:00 AM
- Creates PRs for outdated dependencies
- You'll be assigned as reviewer
- Labels: `dependencies`, `go`, `docker`, or `github-actions`

**To verify it's working:**
1. Go to: https://github.com/jacar-javi/jacommander/security/dependabot
2. You should see Dependabot enabled

**No additional setup required** - Active after first push.

---

### 7. Automated Release Workflow

**Location**: `.github/workflows/release.yml`

**What's included:**
- Automatic releases when you push a version tag
- Multi-platform binary builds (Linux, macOS, Windows for AMD64/ARM64)
- Automatic changelog generation
- SHA256 checksums for all binaries
- Docker image publishing (Docker Hub + GHCR)
- GitHub Release creation with artifacts

**How to create a release:**

```bash
# 1. Update version in your code
# 2. Commit changes
git add .
git commit -m "Bump version to v1.4.0"

# 3. Create and push tag
git tag -a v1.4.0 -m "Release v1.4.0"
git push origin main --tags

# The workflow will automatically:
# - Build binaries for all platforms
# - Create GitHub release
# - Generate changelog
# - Upload artifacts
# - Build and push Docker images
```

**Required secrets:**
Add these to repository settings → Secrets and variables → Actions:
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Your Docker Hub token

**To add secrets:**
1. Go to: https://github.com/jacar-javi/jacommander/settings/secrets/actions
2. Click "New repository secret"
3. Add the required secrets

---

### 8. Docker Build & Push Workflow

**Location**: `.github/workflows/docker.yml`

**What's included:**
- Automatic Docker builds on every push to `main`
- Multi-platform support (AMD64/ARM64)
- Docker Hub and GitHub Container Registry publishing
- Security scanning with Trivy
- Automatic testing of built images
- Docker Hub description updates

**How it works:**
- Triggers on pushes to `main` branch
- Builds and tests Docker image
- Pushes to Docker Hub as `jacarjavi/jacommander:edge`
- Pushes to GHCR as `ghcr.io/jacar-javi/jacommander:main`
- Runs security scan and uploads results

**Required secrets** (same as release workflow):
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

**Tags created:**
- `edge` - Latest main branch build
- `main-<commit-sha>` - Specific commit builds

---

### 9. Branch Protection Rules

**Location**: `.github/scripts/setup-branch-protection.sh` and `.github/BRANCH_PROTECTION.md`

**What's included:**
- Script to automatically configure protection rules
- Documentation on recommended settings
- Manual configuration instructions

**Recommended protection rules:**
- Require pull request reviews (1 approval)
- Require code owner reviews
- Dismiss stale reviews
- Require status checks to pass
- Require conversation resolution
- Prevent force pushes
- Prevent branch deletion

**To configure:**

**Option 1 - Using the script:**
```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Linux: See https://cli.github.com/

# Authenticate
gh auth login

# Run the setup script
.github/scripts/setup-branch-protection.sh
```

**Option 2 - Manual via GitHub UI:**
1. Go to: https://github.com/jacar-javi/jacommander/settings/branches
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Enable the protections listed in `.github/BRANCH_PROTECTION.md`

**Note:** Branch protection requires a paid GitHub plan for private repositories, but is free for public repositories.

---

### 10. GitHub Pages

**Location**: `.github/workflows/pages.yml` and `docs/`

**What's included:**
- Automatic documentation site generation
- API documentation page
- Contributing and security policy pages
- Dark theme matching GitHub
- Responsive design

**To enable GitHub Pages:**

1. **Enable GitHub Pages in settings:**
   - Go to: https://github.com/jacar-javi/jacommander/settings/pages
   - Under "Build and deployment" → Source: Select **"GitHub Actions"**
   - Save

2. **Push your changes:**
   ```bash
   git add .
   git commit -m "Configure GitHub features"
   git push origin main
   ```

3. **Wait for deployment:**
   - Go to: https://github.com/jacar-javi/jacommander/actions
   - Watch the "Deploy GitHub Pages" workflow
   - Once complete, your site will be at: https://jacar-javi.github.io/jacommander/

**Pages included:**
- `/` - Main documentation (from README)
- `/api.html` - API documentation
- `/contributing.html` - Contributing guide
- `/security.html` - Security policy

**To add more documentation:**
1. Add markdown files to `docs/` directory
2. Push to GitHub
3. Workflow automatically rebuilds site

---

## 🚀 Next Steps

### 1. Push All Changes to GitHub

```bash
# Add all new files
git add .

# Commit
git commit -m "Configure GitHub features: templates, workflows, docs, security"

# Push to main
git push origin main
```

### 2. Configure Repository Secrets

Go to: https://github.com/jacar-javi/jacommander/settings/secrets/actions

Add these secrets:
- `DOCKERHUB_USERNAME` - For Docker Hub publishing
- `DOCKERHUB_TOKEN` - Docker Hub token

### 3. Enable GitHub Pages

https://github.com/jacar-javi/jacommander/settings/pages
- Source: GitHub Actions

### 4. Set Up Branch Protection (Optional but Recommended)

```bash
gh auth login
.github/scripts/setup-branch-protection.sh
```

### 5. Verify Everything Works

- [ ] Create a test issue - verify templates appear
- [ ] Create a test PR - verify template appears
- [ ] Check Security tab - verify policy is visible
- [ ] Push a commit - verify CI workflows run
- [ ] Check Actions tab - verify workflows succeed
- [ ] Visit GitHub Pages URL after enabling

---

## 📊 GitHub Features Summary

| Feature | File/Location | Status | Additional Setup |
|---------|---------------|--------|------------------|
| Issue Templates | `.github/ISSUE_TEMPLATE/` | ✅ Ready | None |
| PR Template | `.github/pull_request_template.md` | ✅ Ready | None |
| Security Policy | `SECURITY.md` | ✅ Ready | None |
| Funding | `.github/FUNDING.yml` | ✅ Ready | Add funding URLs |
| CODEOWNERS | `.github/CODEOWNERS` | ✅ Ready | None |
| Dependabot | `.github/dependabot.yml` | ✅ Ready | None |
| Release Workflow | `.github/workflows/release.yml` | ✅ Ready | Add Docker secrets |
| Docker Workflow | `.github/workflows/docker.yml` | ✅ Ready | Add Docker secrets |
| Branch Protection | `.github/scripts/` | ⚠️ Manual | Run script or configure via UI |
| GitHub Pages | `.github/workflows/pages.yml` | ⚠️ Manual | Enable in settings |

---

## 🔧 Customization

### Updating Funding Links

Edit `.github/FUNDING.yml`:
```yaml
github: [jacar-javi]
patreon: your-username
ko_fi: your-username
custom: ['https://www.buymeacoffee.com/your-username']
```

### Adding More CODEOWNERS

Edit `.github/CODEOWNERS`:
```
/backend/ @jacar-javi @backend-team
/frontend/ @jacar-javi @frontend-team
```

### Modifying Dependabot Schedule

Edit `.github/dependabot.yml`:
```yaml
schedule:
  interval: "daily"  # Change from weekly to daily
  time: "03:00"      # Change time
```

### Customizing Release Workflow

Edit `.github/workflows/release.yml` to:
- Add/remove platforms
- Change binary names
- Modify changelog generation
- Add release notes

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

## 🐛 Troubleshooting

### Workflows not running?
- Check if Actions are enabled: Repository Settings → Actions → General
- Ensure workflows have proper permissions

### Docker push failing?
- Verify secrets are set correctly
- Check Docker Hub token has write permissions

### Dependabot not creating PRs?
- May take up to 24 hours for first run
- Check security tab for Dependabot alerts

### GitHub Pages not deploying?
- Ensure "GitHub Actions" is selected as source
- Check Actions tab for deployment errors
- Verify repository is public or you have GitHub Pro/Team

---

**Last Updated**: October 2025
