# Development Guide for JaCommander

This guide explains how to develop JaCommander with the same code quality standards enforced by our CI/CD pipeline.

## Table of Contents
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Code Quality Tools](#code-quality-tools)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Go 1.25+
- Node.js 18+
- Make

### Initial Setup
```bash
# Install dependencies
make install

# Install linting tools (golangci-lint, eslint, prettier)
make install-linters

# Verify setup
make check-lint-config
```

---

## Development Workflow

### 1. Make Your Changes
Edit files as needed in `backend/` or `frontend/` directories.

### 2. Format Code
```bash
# Format everything
make format

# Or format specific parts
make format-backend
make format-frontend
```

### 3. Check Formatting
Before committing, verify formatting is correct:
```bash
# Check all formatting
make check-fmt

# Or check specific parts
make check-fmt-backend
make check-fmt-frontend
```

### 4. Run Linters
```bash
# Lint everything
make lint

# Or lint specific parts
make lint-backend
make lint-frontend
```

### 5. Run Tests
```bash
# Run all tests
make test

# Or run specific tests
make test-backend    # Go tests with coverage
make test-frontend   # JavaScript tests
```

### 6. Pre-Commit Check
Run this before every commit to catch issues early:
```bash
make pre-commit
```

This runs:
1. ✅ Formatting check
2. ✅ Linting
3. ✅ Backend tests with coverage

**If this passes, your code will pass CI!**

### 7. Full CI Validation (Optional)
To run the **exact** CI pipeline locally:
```bash
make ci-local
```

This matches `.github/workflows/ci.yml` step-by-step:
1. ✅ Install dependencies
2. ✅ Install linters
3. ✅ Check Go formatting
4. ✅ Run golangci-lint
5. ✅ Run tests with coverage

**If this passes, CI will pass!**

---

## Code Quality Tools

### golangci-lint
Our project uses golangci-lint v2.5.0 with a custom configuration (`.golangci.yml`).

**Enabled Linters:**
- `errcheck` - Unchecked errors (CRITICAL)
- `govet` - Standard Go analysis
- `ineffassign` - Dead assignments
- `staticcheck` - Advanced static analysis
- `unused` - Unused code detection
- `misspell` - Spelling errors
- `unconvert` - Unnecessary conversions
Note: gosec is intentionally disabled as all 26 warnings are acceptable for a file manager (see CHANGELOG_IMPROVEMENTS.md)

**Installation:**
```bash
make install-linters
```

**Usage:**
```bash
# Run with project configuration
make lint-backend

# Or directly
cd backend && golangci-lint run ./...
```

**Configuration:**
The `.golangci.yml` file at the project root contains:
- Linter settings
- Exclusions for false positives
- Severity levels
- Custom rules

### Go Formatting
Uses `gofmt -s` with simplified formatting.

**Check:**
```bash
make check-fmt-backend
```

**Fix:**
```bash
make format-backend
```

### Frontend Linting
Uses ESLint 8 and Prettier for JavaScript, CSS, and HTML.

**Check:**
```bash
make check-fmt-frontend
make lint-frontend
```

**Fix:**
```bash
make format-frontend
```

---

## CI/CD Integration

### GitHub Actions Workflow
File: `.github/workflows/ci.yml`

**Workflow Steps:**
1. **Lint** - Format check + golangci-lint
2. **Backend Tests** - All tests with race detection and coverage
3. **Frontend Tests** - JavaScript tests with coverage
4. **Integration Tests** - End-to-end tests
5. **Security** - Trivy + gosec scanning

### Local Equivalents

| GitHub Actions | Local Command | Description |
|---------------|---------------|-------------|
| Lint job | `make pre-commit` | Fast pre-commit checks |
| Full CI | `make ci-local` | Complete CI pipeline |
| Backend tests | `make test-backend` | Tests with coverage |
| Format check | `make check-fmt` | Non-destructive check |
| Linting | `make lint` | All linters |

### Coverage Reports
After running tests, coverage reports are generated:

**Backend:**
- File: `backend/coverage.txt`
- View: `go tool cover -html=backend/coverage.txt`

**Frontend:**
- Directory: `frontend/coverage/`
- View: Open `frontend/coverage/lcov-report/index.html`

---

## Makefile Commands Reference

### Building & Running
```bash
make build         # Build backend binary
make run           # Build and run application
make dev           # Development mode with hot reload
```

### Testing
```bash
make test          # Run all tests
make test-backend  # Backend tests with coverage
make test-frontend # Frontend tests
make coverage      # Generate coverage reports
make benchmark     # Run Go benchmarks
```

### Code Quality
```bash
make lint          # Run all linters
make lint-backend  # Go linters (golangci-lint)
make lint-frontend # JavaScript linters (ESLint)
make format        # Format all code
make format-backend # Format Go code
make format-frontend # Format JS/CSS/HTML
make check-fmt     # Check formatting without modifying
make check-fmt-backend # Check Go formatting
make check-fmt-frontend # Check frontend formatting
```

### CI/CD
```bash
make ci-local      # Run full CI pipeline locally
make pre-commit    # Quick pre-commit checks
make check-lint-config # Verify .golangci.yml exists
```

### Tools & Setup
```bash
make install       # Install dependencies
make install-linters # Install linting tools
make clean         # Clean build artifacts
```

### Docker
```bash
make docker        # Build Docker image
make docker-run    # Run in Docker container
```

### Security
```bash
make security      # Security scanning (gosec + npm audit)
```

---

## Troubleshooting

### "golangci-lint not found"
```bash
make install-linters
```

This installs golangci-lint v1.62.2 to match CI.

### Formatting Errors
If `make check-fmt-backend` fails:
```bash
make format-backend
```

Then verify:
```bash
make check-fmt-backend
```

### Linting Errors
Review the output and fix issues. Common fixes:

**Unchecked errors:**
```go
// Before
file.Close()

// After
defer func() {
    if err := file.Close(); err != nil {
        log.Printf("Error closing file: %v", err)
    }
}()
```

**Unused variables:**
Either use them or remove them.

**Staticcheck issues:**
Follow the suggestions in the linter output.

### Test Failures
Run specific tests to debug:
```bash
# Run specific test
go test -v -run TestFunctionName ./backend/handlers

# Run with debugging
go test -v ./backend/handlers
```

### CI Passes But Local Fails
Ensure you have the same tool versions:
```bash
# Check golangci-lint version
golangci-lint version
# Should show: v2.5.0

# Reinstall if needed
make install-linters
```

### CI Fails But Local Passes
1. Run the full CI pipeline locally:
   ```bash
   make ci-local
   ```

2. Check if `.golangci.yml` is committed:
   ```bash
   git status .golangci.yml
   ```

3. Verify you have the correct golangci-lint version (v2.5.0):
   ```bash
   golangci-lint version  # Should show v2.5.0
   make install-linters   # Reinstall if needed
   ```

4. Verify formatting:
   ```bash
   make check-fmt
   ```

---

## Best Practices

### Before Every Commit
```bash
make pre-commit
```

### Before Creating PR
```bash
make ci-local
```

### When Modifying Linter Config
1. Edit `.golangci.yml`
2. Test locally: `make lint-backend`
3. Verify CI will work: `make ci-local`
4. Commit `.golangci.yml` with your changes

### Adding New Linters
1. Update `.golangci.yml` `linters.enable` section
2. Update `DEVELOPMENT.md` (this file)
3. Test: `make lint-backend`
4. Update CI if needed

---

## Development Tips

### Fast Iteration
```bash
# Watch for changes and run tests
make dev  # In one terminal
make test-backend  # In another when ready
```

### Debugging Tests
```bash
# Verbose output
go test -v ./backend/handlers

# Run specific test
go test -v -run TestSpecificFunction ./backend/handlers

# With race detector
go test -race -v ./backend/handlers
```

### Coverage Analysis
```bash
# Generate and view coverage
make coverage
# Opens browser with coverage report
```

### Performance Profiling
```bash
# CPU profiling
go test -cpuprofile=cpu.prof -bench=. ./backend/storage

# Memory profiling
go test -memprofile=mem.prof -bench=. ./backend/storage

# View profiles
go tool pprof cpu.prof
```

---

## Getting Help

### Common Issues
See [Troubleshooting](#troubleshooting) section above.

### Documentation
- Main README: [README.md](README.md)
- API Docs: [docs/api.md](docs/api.md)
- Environment Vars: [docs/environment-variables.md](docs/environment-variables.md)
- Code Improvements: [CHANGELOG_IMPROVEMENTS.md](CHANGELOG_IMPROVEMENTS.md)

### CI Configuration
- GitHub Actions: [.github/workflows/ci.yml](.github/workflows/ci.yml)
- Linter Config: [.golangci.yml](.golangci.yml)
- Makefile: [Makefile](Makefile)

---

## Summary

**Key Commands to Remember:**

1. **Setup:** `make install && make install-linters`
2. **Before commit:** `make pre-commit`
3. **Before PR:** `make ci-local`
4. **Fix formatting:** `make format`
5. **Fix linting:** Address issues shown by `make lint`

**The Golden Rule:**
> If `make ci-local` passes, CI will pass!

Happy coding! 🚀
