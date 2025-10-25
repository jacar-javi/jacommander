# Multi-stage build for JaCommander
# Stage 1: Build the Go application
FROM golang:1.25-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source code
COPY backend/ ./backend/

# Build the application with basic tag (without advanced storage backends)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -tags=basic \
    -ldflags="-s -w" \
    -o jacommander \
    ./backend

# Stage 2: Create the minimal runtime image
FROM alpine:3.22

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 -S jacommander && \
    adduser -u 1000 -S jacommander -G jacommander

# Set working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/jacommander .

# Copy frontend files
COPY frontend/ ./frontend/

# Create data directory
RUN mkdir -p /data && \
    chown -R jacommander:jacommander /app /data

# Switch to non-root user
USER jacommander

# Expose port
EXPOSE 8080

# Volume for data storage
VOLUME ["/data"]

# Set environment variables
ENV PORT=8080 \
    HOST=0.0.0.0 \
    LOCAL_STORAGE_1=/data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/storages || exit 1

# Run the application
ENTRYPOINT ["./jacommander"]