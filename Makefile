# JaCommander Makefile
# Commands for building, testing, and running the application

.PHONY: help build run test clean install lint format docker

# Variables
BACKEND_DIR := backend
FRONTEND_DIR := frontend
DOCKER_IMAGE := jacommander
DOCKER_TAG := latest

# Default target
help:
	@echo "JaCommander - Available commands:"
	@echo "  make build      - Build the backend"
	@echo "  make run        - Run the application"
	@echo "  make test       - Run all tests"
	@echo "  make test-backend  - Run backend tests"
	@echo "  make test-frontend - Run frontend tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make coverage   - Generate test coverage reports"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make docker     - Build Docker image"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make install    - Install dependencies"

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

# Run backend tests
test-backend:
	@echo "Running backend tests..."
	cd $(BACKEND_DIR) && go test -v -race ./...

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

# Lint backend code
lint-backend:
	@echo "Linting backend..."
	cd $(BACKEND_DIR) && golangci-lint run ./...

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

# Quick check before committing
pre-commit:
	@echo "Running pre-commit checks..."
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) test-backend
	@echo "Pre-commit checks passed!"

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