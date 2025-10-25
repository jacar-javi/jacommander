# JaCommander Testing Documentation

## Overview

This document describes the comprehensive testing infrastructure for JaCommander, including unit tests, integration tests, and CI/CD pipeline configuration.

## Test Structure

```
jacommander/
├── backend/
│   ├── storage/
│   │   └── local_test.go           # Storage layer tests
│   ├── handlers/
│   │   └── file_handler_test.go    # HTTP handler tests
│   └── security/
│       └── ip_validator_test.go    # Security module tests
├── frontend/
│   ├── tests/
│   │   ├── setup.js                # Jest configuration
│   │   ├── __mocks__/              # Mock modules
│   │   ├── panels.test.js         # Panel component tests
│   │   ├── file-operations.test.js # File operation tests
│   │   └── i18n.test.js           # Internationalization tests
│   └── package.json                # Frontend test configuration
├── tests/
│   ├── integration_test.go        # End-to-end integration tests
│   └── package.json               # Integration test configuration
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Main CI/CD pipeline
│       └── format.yml             # Auto-formatting workflow
├── .eslintrc.json                 # JavaScript linting rules
├── .prettierrc.json               # Code formatting rules
├── .golangci.yml                  # Go linting configuration
├── .codecov.yml                   # Coverage reporting config
└── Makefile                       # Build and test automation
```

## Running Tests

### Quick Start

```bash
# Run all tests
make test

# Run specific test suites
make test-backend
make test-frontend
make test-integration

# Generate coverage reports
make coverage
```

### Backend Tests

```bash
# Run all backend tests
cd backend
go test -v ./...

# Run with race detection
go test -v -race ./...

# Run specific test
go test -v -run TestLocalStorage ./storage

# Generate coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Frontend Tests

```bash
# Install dependencies
cd frontend
npm install

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test suite
npm test -- panels.test.js
```

### Integration Tests

```bash
# Run integration tests
cd tests
go test -v ./...

# Run specific integration test
go test -v -run TestFileOperationsIntegration ./...
```

## Test Coverage

### Coverage Goals

- **Backend**: 85% coverage target
- **Frontend**: 75% coverage target
- **Overall**: 80% coverage target

### Viewing Coverage Reports

```bash
# Backend HTML report
open backend/coverage.html

# Frontend HTML report
open frontend/coverage/lcov-report/index.html

# Terminal coverage summary
make coverage-report
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### Main CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request:

1. **Linting Stage**
   - Go code linting with golangci-lint
   - JavaScript linting with ESLint
   - Format checking with Prettier

2. **Backend Tests**
   - Unit tests with race detection
   - Coverage report generation
   - Upload to Codecov

3. **Frontend Tests**
   - Jest unit tests
   - Coverage report generation
   - Upload to Codecov

4. **Integration Tests**
   - End-to-end API tests
   - WebSocket connection tests
   - File operation workflows

5. **Security Scanning**
   - Trivy vulnerability scanner
   - gosec for Go security issues
   - npm audit for JavaScript dependencies

6. **Docker Build**
   - Build and push Docker image
   - Multi-stage build optimization
   - Image scanning

#### Auto-Format Workflow (`.github/workflows/format.yml`)

Automatically formats code on pull requests:

- Go formatting with `gofmt` and `goimports`
- JavaScript/CSS/HTML formatting with Prettier
- YAML formatting
- Auto-commits formatting changes

## Test Categories

### Unit Tests

#### Backend Unit Tests

- **Storage Tests** (`local_test.go`):
  - File CRUD operations
  - Directory operations
  - Search functionality
  - Watch/monitoring

- **Handler Tests** (`file_handler_test.go`):
  - HTTP endpoint testing
  - Request/response validation
  - Error handling
  - Mock storage implementation

- **Security Tests** (`ip_validator_test.go`):
  - IP validation
  - Path traversal prevention
  - Rate limiting
  - Input sanitization

#### Frontend Unit Tests

- **Component Tests** (`panels.test.js`):
  - Panel initialization
  - Navigation behavior
  - Selection management
  - Rendering logic

- **Operation Tests** (`file-operations.test.js`):
  - Copy/Move/Delete operations
  - Upload/Download handling
  - Compression/Extraction
  - Error scenarios

- **I18n Tests** (`i18n.test.js`):
  - Language switching
  - Translation loading
  - Pluralization rules
  - RTL support

### Integration Tests

- **File Operations Flow**:
  - Complete upload/download cycle
  - Copy/Move/Delete workflows
  - Directory creation and navigation

- **Search Integration**:
  - Content-based search
  - Pattern matching
  - Cross-directory search

- **WebSocket Communication**:
  - Connection establishment
  - Progress updates
  - Real-time notifications

- **Compression Workflow**:
  - Archive creation
  - Extraction verification
  - Format support

## Linting and Formatting

### Go Code Quality

Configured in `.golangci.yml`:

- 40+ linters enabled
- Custom rules for JaCommander
- Security checks
- Performance optimizations

Run manually:
```bash
golangci-lint run ./backend/...
```

### JavaScript Code Quality

Configured in `.eslintrc.json`:

- ES2021 standards
- Consistent code style
- Security best practices
- No unused variables

Run manually:
```bash
cd frontend
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Code Formatting

Prettier configuration in `.prettierrc.json`:

- 120 character line width
- 4 space indentation
- Single quotes for JavaScript
- No trailing commas

Format code:
```bash
cd frontend
npm run format
```

## Makefile Commands

```bash
make help              # Show all available commands
make test             # Run all tests
make test-backend     # Run backend tests
make test-frontend    # Run frontend tests
make test-integration # Run integration tests
make coverage         # Generate coverage reports
make lint             # Run all linters
make format           # Format all code
make docker           # Build Docker image
make clean            # Clean build artifacts
make ci               # Run full CI pipeline locally
make pre-commit       # Run checks before committing
```

## Pre-Commit Hooks

Before committing code:

```bash
# Run pre-commit checks
make pre-commit

# This runs:
# - Code formatting
# - Linting checks
# - Backend tests
```

## Continuous Improvement

### Adding New Tests

1. **Backend Tests**: Create `*_test.go` files alongside source files
2. **Frontend Tests**: Add `*.test.js` files in `frontend/tests/`
3. **Integration Tests**: Add to `tests/integration_test.go`

### Test Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Use mocks for external dependencies
3. **Coverage**: Aim for meaningful coverage, not 100%
4. **Speed**: Keep unit tests fast (<100ms)
5. **Documentation**: Document complex test scenarios
6. **Cleanup**: Always clean up test resources

## Troubleshooting

### Common Issues

1. **Tests failing locally but passing in CI**:
   - Check for timing issues
   - Verify environment variables
   - Clean test artifacts: `make clean`

2. **Coverage not updating**:
   - Clear coverage cache
   - Regenerate reports: `make coverage`

3. **Linting errors**:
   - Run auto-fix: `make format`
   - Check linter versions

4. **WebSocket tests timing out**:
   - Increase timeout values
   - Check for port conflicts

## Performance Benchmarks

Run performance benchmarks:

```bash
# Backend benchmarks
cd backend
go test -bench=. -benchmem ./...

# Frontend performance tests
cd frontend
npm run test -- --testNamePattern="performance"
```

## Security Testing

```bash
# Run security audit
make security

# Check for vulnerabilities
cd backend && gosec ./...
cd frontend && npm audit

# Update dependencies
make update
```

## Test Data

Test fixtures are located in:
- Backend: Temporary directories created during tests
- Frontend: Mock data in test files
- Integration: `tests/fixtures/` (if needed)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass: `make test`
3. Check coverage: `make coverage`
4. Run linting: `make lint`
5. Format code: `make format`
6. Run pre-commit: `make pre-commit`

## Resources

- [Go Testing Documentation](https://golang.org/pkg/testing/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.io/)
- [golangci-lint](https://golangci-lint.run/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)