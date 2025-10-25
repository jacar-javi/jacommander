# GitHub Actions Workflows

This directory contains the CI/CD workflows for JaCommander.

## Workflows

### 1. `basic-ci.yml` (Recommended for Initial Setup)
A simplified CI workflow that runs basic checks without requiring all dependencies to be installed:
- **Go formatting checks** - Ensures consistent code style
- **JavaScript/CSS formatting** - Uses Prettier for frontend code
- **ESLint checks** - Basic JavaScript linting
- **Docker build test** - Validates Dockerfile
- **Security scanning** - Trivy vulnerability scanner

This workflow uses `continue-on-error: true` to report issues without blocking the pipeline.

### 2. `ci.yml` (Full CI/CD Pipeline)
Complete CI/CD workflow with comprehensive testing:
- **Linting and formatting** for both backend and frontend
- **Unit tests** for Go and JavaScript
- **Integration tests** with Redis service
- **Docker image build and push** (on main branch)
- **Security scanning** with Trivy and gosec
- **Code coverage** reporting to Codecov

## Setup Instructions

### For Basic Setup (Recommended)
1. The `basic-ci.yml` workflow will run automatically without additional configuration
2. It's designed to work even if some dependencies are missing
3. Perfect for initial repository setup and basic quality checks

### For Full CI/CD
1. Install all Go dependencies:
   ```bash
   cp go.mod.full go.mod
   go mod tidy
   ```

2. Set up GitHub Secrets (for Docker Hub):
   - `DOCKERHUB_USERNAME` - Your Docker Hub username
   - `DOCKERHUB_TOKEN` - Your Docker Hub access token

3. Configure Codecov (optional):
   - Sign up at codecov.io
   - Add your repository
   - The token will be automatically configured

## Handling Compilation Issues

The workflows are configured to handle missing dependencies gracefully:
- Tests use `continue-on-error: true` to report issues without failing
- Advanced storage backends (Google Drive, OneDrive, etc.) can be excluded using build tags
- The basic workflow focuses on essential checks that should always work

## GitHub Actions Versions

All actions have been updated to their latest versions to avoid deprecation warnings:
- CodeQL Action: v3
- actions/checkout: v4
- actions/setup-go: v5
- actions/setup-node: v4
- docker/setup-buildx-action: v3
- docker/login-action: v3
- docker/build-push-action: v5
- codecov/codecov-action: v4

## Troubleshooting

### "Resource not accessible by integration" Error
This error typically occurs when:
- The repository is private and lacks proper permissions
- GitHub token permissions are insufficient
- First-time setup of security features

Solution: Enable GitHub Actions permissions in repository settings.

### Compilation Errors in CI
If you see compilation errors for storage backends:
1. Use the `basic-ci.yml` workflow initially
2. Install full dependencies when ready for production
3. Consider using build tags to exclude certain features

### ESLint/Prettier Issues
Run locally to fix:
```bash
cd frontend
npm run format
npm run lint -- --fix
```