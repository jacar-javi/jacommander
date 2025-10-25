# Contributing to JaCommander

First off, thank you for considering contributing to JaCommander! It's people like you that make JaCommander such a great tool. We welcome contributions from everyone, regardless of their experience level.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Style Guides](#style-guides)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by the [JaCommander Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@jacommander.io](mailto:conduct@jacommander.io).

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your feature or fix
5. Make your changes
6. Test your changes thoroughly
7. Submit a pull request

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, browser, Go version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Describe the current behavior and expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issues:

- Issues labeled `good first issue`
- Issues labeled `help wanted`
- Issues labeled `documentation`

## Development Setup

### Prerequisites

- Go 1.21 or higher
- Node.js 18 or higher
- Docker (optional)
- Git

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/jacommander.git
cd jacommander

# Add upstream remote
git remote add upstream https://github.com/jacar-javi/jacommander.git

# Install dependencies
make install

# Run the development server
make dev
```

### Project Structure

```
jacommander/
├── backend/           # Go backend code
│   ├── handlers/     # HTTP request handlers
│   ├── storage/      # Storage implementations
│   ├── security/     # Security modules
│   └── main.go       # Application entry point
├── frontend/         # Frontend code
│   ├── js/          # JavaScript modules
│   ├── css/         # Stylesheets
│   └── index.html   # Main HTML file
├── tests/           # Test files
│   ├── integration/ # Integration tests
│   └── e2e/        # End-to-end tests
└── docker/         # Docker configuration
```

## Style Guides

### Go Code Style

We follow the standard Go formatting guidelines:

```bash
# Format your code
gofmt -s -w .
goimports -w .

# Run linter
golangci-lint run

# Or use the Makefile
make format-backend
make lint-backend
```

Key points:
- Use `gofmt` and `goimports` for formatting
- Follow [Effective Go](https://golang.org/doc/effective_go.html) guidelines
- Write clear, idiomatic Go code
- Add comments for exported functions and types
- Keep functions small and focused
- Handle errors explicitly

### JavaScript Code Style

We use ESLint and Prettier for JavaScript:

```bash
# Format your code
npm run format

# Run linter
npm run lint

# Or use the Makefile
make format-frontend
make lint-frontend
```

Key points:
- Use ES6+ features appropriately
- No framework dependencies (vanilla JavaScript only)
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused
- Use async/await for asynchronous code

### CSS Style Guide

- Use CSS variables for theming
- Follow BEM naming convention for classes
- Mobile-first responsive design
- Keep specificity low
- Organize styles by component

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build process or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Examples

```
feat(storage): add support for Azure Blob Storage

Implemented Azure Blob Storage backend with full CRUD operations.
Includes authentication via connection string or managed identity.

Closes #123
```

```
fix(ui): correct panel scrolling on large directories

Fixed virtual scrolling calculation that caused jumping when
scrolling through directories with >1000 items.

Fixes #456
```

## Pull Requests

### Before Submitting

1. **Test your changes thoroughly**
   ```bash
   make test
   make lint
   ```

2. **Update documentation** if needed

3. **Add tests** for new features

4. **Ensure all tests pass**
   ```bash
   make ci
   ```

5. **Update the README** if you've added new features

### Pull Request Process

1. **Create a descriptive title** following the commit message format

2. **Fill out the PR template** completely

3. **Link related issues** using keywords (Closes #123, Fixes #456)

4. **Request reviews** from maintainers

5. **Respond to feedback** promptly and professionally

6. **Keep your PR focused** - one feature/fix per PR

7. **Keep your branch up to date** with the main branch

### PR Title Examples

- `feat: add batch file rename functionality`
- `fix: resolve memory leak in file watcher`
- `docs: update installation instructions for Windows`

## Testing

### Running Tests

```bash
# Run all tests
make test

# Run backend tests only
make test-backend

# Run frontend tests only
make test-frontend

# Run integration tests
make test-integration

# Generate coverage report
make coverage
```

### Writing Tests

#### Go Tests

- Place test files next to the code they test
- Name test files with `_test.go` suffix
- Use table-driven tests where appropriate
- Mock external dependencies
- Aim for >80% coverage

Example:
```go
func TestCopyFile(t *testing.T) {
    tests := []struct {
        name    string
        source  string
        dest    string
        wantErr bool
    }{
        {"valid copy", "/tmp/source.txt", "/tmp/dest.txt", false},
        {"missing source", "/tmp/missing.txt", "/tmp/dest.txt", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := CopyFile(tt.source, tt.dest)
            if (err != nil) != tt.wantErr {
                t.Errorf("CopyFile() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

#### JavaScript Tests

- Use Jest for testing
- Place test files in `frontend/tests/`
- Mock browser APIs and external dependencies
- Test both success and error cases

## Documentation

- Update README.md for new features
- Add JSDoc comments for JavaScript functions
- Add godoc comments for Go functions
- Update API documentation for new endpoints
- Include examples where helpful

## Community

### Getting Help

- Check the [Documentation](https://docs.jacommander.io)
- Search existing [Issues](https://github.com/jacar-javi/jacommander/issues)
- Ask in [Discussions](https://github.com/jacar-javi/jacommander/discussions)
- Join our [Discord](https://discord.gg/jacommander)

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time chat and support
- **Email**: security@jacommander.io (security issues only)

## Recognition

Contributors who submit accepted PRs will be added to our [Contributors](https://github.com/jacar-javi/jacommander/graphs/contributors) list and mentioned in release notes.

## License

By contributing to JaCommander, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with the `question` label or reach out on Discord if you have any questions about contributing!

Thank you for contributing to JaCommander! 🎉