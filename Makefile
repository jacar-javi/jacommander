# JaCommander Makefile
# Commands for building, testing, and running the application

.PHONY: help build run test clean install lint format docker check-fmt ci-local install-linters

# Variables
BACKEND_DIR := backend
FRONTEND_DIR := frontend
DOCKER_IMAGE := jacommander
DOCKER_TAG := latest
GOLANGCI_LINT_VERSION := v2.5.0

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Default target
help:
	@echo "JaCommander - Available commands:"
	@echo ""
	@echo "  ${GREEN}Building & Running:${NC}"
	@echo "    make build         - Build the backend"
	@echo "    make run           - Run the application"
	@echo "    make dev           - Run in development mode"
	@echo ""
	@echo "  ${GREEN}Testing:${NC}"
	@echo "    make test          - Run all tests"
	@echo "    make test-backend  - Run backend tests (with coverage)"
	@echo "    make test-frontend - Run frontend tests"
	@echo "    make coverage      - Generate test coverage reports"
	@echo ""
	@echo "  ${GREEN}Code Quality:${NC}"
	@echo "    make lint          - Run linters (backend + frontend)"
	@echo "    make format        - Format code (backend + frontend)"
	@echo "    make check-fmt     - Check code formatting without modifying"
	@echo ""
	@echo "  ${GREEN}CI/CD:${NC}"
	@echo "    make ci-local      - Run full CI pipeline locally (matches GitHub Actions)"
	@echo "    make pre-commit    - Quick pre-commit checks"
	@echo ""
	@echo "  ${GREEN}Tools & Setup:${NC}"
	@echo "    make install       - Install dependencies"
	@echo "    make install-linters - Install linting tools"
	@echo "    make docker        - Build Docker image"
	@echo "    make clean         - Clean build artifacts"
	@echo ""

# Build the backend
build:
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go build -o ../jacommander .

# Run the application
run: build
	@echo "Starting JaCommander..."
	./jacommander

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && go mod download
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "Installing test dependencies..."
	cd tests && npm install

# Run all tests
test: test-backend test-frontend test-integration
	@echo "All tests completed!"

# Run backend tests (matches CI configuration)
test-backend:
	@echo "Running backend tests with coverage..."
	cd $(BACKEND_DIR) && go test -v -race -coverprofile=coverage.txt -covermode=atomic ./...

# Run frontend tests
test-frontend:
	@echo "Running frontend tests..."
	cd $(FRONTEND_DIR) && npm test

# Run integration tests
test-integration:
	@echo "Running integration tests..."
	go test -v ./tests/...

# Generate coverage reports
coverage:
	@echo "Generating backend coverage..."
	cd $(BACKEND_DIR) && go test -coverprofile=coverage.out ./...
	cd $(BACKEND_DIR) && go tool cover -html=coverage.out -o coverage.html
	@echo "Backend coverage report: backend/coverage.html"

	@echo "Generating frontend coverage..."
	cd $(FRONTEND_DIR) && npm run test:coverage
	@echo "Frontend coverage report: frontend/coverage/lcov-report/index.html"

# Run backend coverage
coverage-backend:
	cd $(BACKEND_DIR) && go test -v -race -coverprofile=coverage.txt -covermode=atomic ./...
	@echo "Coverage file generated: backend/coverage.txt"

# Run frontend coverage
coverage-frontend:
	cd $(FRONTEND_DIR) && npm run test:coverage

# Lint the code
lint: lint-backend lint-frontend
	@echo "Linting completed!"

# Lint backend code (uses .golangci.yml configuration)
lint-backend:
	@echo "Linting backend with golangci-lint..."
	@if ! command -v golangci-lint >/dev/null 2>&1; then \
		echo "${RED}Error: golangci-lint is not installed${NC}"; \
		echo "Run: make install-linters"; \
		exit 1; \
	fi
	golangci-lint run ./backend/...

# Lint frontend code
lint-frontend:
	@echo "Linting frontend..."
	cd $(FRONTEND_DIR) && npm run lint

# Format the code
format: format-backend format-frontend
	@echo "Formatting completed!"

# Format backend code
format-backend:
	@echo "Formatting backend..."
	cd $(BACKEND_DIR) && gofmt -s -w .
	cd $(BACKEND_DIR) && goimports -w .

# Format frontend code
format-frontend:
	@echo "Formatting frontend..."
	cd $(FRONTEND_DIR) && npm run format

# Build Docker image
docker:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "Docker image built: $(DOCKER_IMAGE):$(DOCKER_TAG)"

# Run in Docker
docker-run:
	@echo "Running in Docker..."
	docker run -p 8080:8080 $(DOCKER_IMAGE):$(DOCKER_TAG)

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f jacommander
	rm -f $(BACKEND_DIR)/jacommander
	rm -f $(BACKEND_DIR)/coverage.out
	rm -f $(BACKEND_DIR)/coverage.html
	rm -f $(BACKEND_DIR)/coverage.txt
	rm -rf $(FRONTEND_DIR)/coverage
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf tests/node_modules
	@echo "Clean completed!"

# Development mode with hot reload
dev:
	@echo "Starting development mode..."
	@echo "Backend running on http://localhost:8080"
	cd $(BACKEND_DIR) && go run . &
	@echo "Press Ctrl+C to stop"
	@wait

# Run specific backend test
test-backend-%:
	cd $(BACKEND_DIR) && go test -v -run $(subst test-backend-,,$@) ./...

# Run specific frontend test
test-frontend-%:
	cd $(FRONTEND_DIR) && npm test -- --testNamePattern="$(subst test-frontend-,,$@)"

# Check for security vulnerabilities
security:
	@echo "Checking for security vulnerabilities..."
	cd $(BACKEND_DIR) && gosec ./...
	cd $(FRONTEND_DIR) && npm audit

# Update dependencies
update:
	@echo "Updating dependencies..."
	cd $(BACKEND_DIR) && go get -u ./...
	cd $(BACKEND_DIR) && go mod tidy
	cd $(FRONTEND_DIR) && npm update

# CI/CD pipeline simulation
ci:
	@echo "Running CI pipeline..."
	$(MAKE) install
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) coverage
	$(MAKE) security
	@echo "CI pipeline completed successfully!"

# Quick check before committing (fast version of ci-local)
pre-commit:
	@echo "${YELLOW}Running pre-commit checks...${NC}"
	@echo ""
	@echo "1. Checking formatting..."
	@$(MAKE) check-fmt-backend
	@echo ""
	@echo "2. Running linters..."
	@$(MAKE) lint-backend
	@echo ""
	@echo "3. Running tests..."
	@$(MAKE) test-backend
	@echo ""
	@echo "${GREEN}✓ Pre-commit checks passed!${NC}"
	@echo "${YELLOW}Tip: Run 'make ci-local' for full CI validation${NC}"

# Show test coverage in terminal
coverage-report:
	@echo "Backend test coverage:"
	@cd $(BACKEND_DIR) && go test -cover ./...
	@echo ""
	@echo "Frontend test coverage:"
	@cd $(FRONTEND_DIR) && npm run test:coverage -- --reporters=text

# Benchmark tests
benchmark:
	@echo "Running benchmarks..."
	cd $(BACKEND_DIR) && go test -bench=. -benchmem ./...

# ============================================================================
# CI/CD Targets - Match GitHub Actions exactly
# ============================================================================

# Install linting and formatting tools
install-linters:
	@echo "Installing linting tools..."
	@echo "Installing golangci-lint $(GOLANGCI_LINT_VERSION)..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		INSTALLED_VERSION=$$(golangci-lint version 2>&1 | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1); \
		if [ "$$INSTALLED_VERSION" != "$(GOLANGCI_LINT_VERSION)" ]; then \
			echo "${YELLOW}Upgrading golangci-lint from $$INSTALLED_VERSION to $(GOLANGCI_LINT_VERSION)${NC}"; \
			curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $$(go env GOPATH)/bin $(GOLANGCI_LINT_VERSION); \
		else \
			echo "${GREEN}golangci-lint $(GOLANGCI_LINT_VERSION) already installed${NC}"; \
		fi \
	else \
		curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $$(go env GOPATH)/bin $(GOLANGCI_LINT_VERSION); \
		echo "${GREEN}golangci-lint installed${NC}"; \
	fi
	@echo "Installing frontend linters..."
	@cd $(FRONTEND_DIR) && npm install --save-dev eslint@8 prettier
	@echo "${GREEN}All linters installed!${NC}"

# Check Go code formatting (without modifying files)
check-fmt-backend:
	@echo "Checking Go code formatting..."
	@UNFORMATTED=$$(cd $(BACKEND_DIR) && gofmt -l . | grep -v vendor); \
	if [ -n "$$UNFORMATTED" ]; then \
		echo "${RED}The following files need formatting:${NC}"; \
		echo "$$UNFORMATTED"; \
		echo "${YELLOW}Run 'make format-backend' to fix${NC}"; \
		exit 1; \
	else \
		echo "${GREEN}✓ All Go files are properly formatted${NC}"; \
	fi

# Check frontend code formatting (without modifying files)
check-fmt-frontend:
	@echo "Checking frontend code formatting..."
	@cd $(FRONTEND_DIR) && npx prettier --check "**/*.{js,css,html}" || \
		(echo "${RED}Frontend files need formatting${NC}" && \
		 echo "${YELLOW}Run 'make format-frontend' to fix${NC}" && \
		 exit 1)
	@echo "${GREEN}✓ Frontend files are properly formatted${NC}"

# Check all code formatting
check-fmt: check-fmt-backend check-fmt-frontend
	@echo "${GREEN}✓ All files are properly formatted!${NC}"

# Run complete CI pipeline locally (matches GitHub Actions .github/workflows/ci.yml)
ci-local:
	@echo "${GREEN}========================================${NC}"
	@echo "${GREEN}Running CI Pipeline Locally${NC}"
	@echo "${GREEN}========================================${NC}"
	@echo ""
	@echo "${YELLOW}Step 1: Installing dependencies...${NC}"
	@$(MAKE) install
	@echo ""
	@echo "${YELLOW}Step 2: Installing linters...${NC}"
	@$(MAKE) install-linters
	@echo ""
	@echo "${YELLOW}Step 3: Checking code formatting...${NC}"
	@$(MAKE) check-fmt-backend
	@echo ""
	@echo "${YELLOW}Step 4: Running linters...${NC}"
	@$(MAKE) lint-backend
	@echo ""
	@echo "${YELLOW}Step 5: Running tests with coverage...${NC}"
	@$(MAKE) test-backend
	@echo ""
	@echo "${GREEN}========================================${NC}"
	@echo "${GREEN}✓ CI Pipeline Completed Successfully!${NC}"
	@echo "${GREEN}========================================${NC}"
	@echo ""
	@echo "Coverage report generated: $(BACKEND_DIR)/coverage.txt"
	@echo "Your code is ready to push to GitHub!"

# Verify .golangci.yml configuration exists
check-lint-config:
	@if [ ! -f .golangci.yml ]; then \
		echo "${RED}Error: .golangci.yml not found${NC}"; \
		echo "golangci-lint configuration is missing"; \
		exit 1; \
	fi
	@echo "${GREEN}✓ .golangci.yml configuration found${NC}"