package main

import (
	"compress/gzip"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/jacommander/jacommander/backend/handlers"
	"github.com/jacommander/jacommander/backend/storage"
)

// Version is the current version of JaCommander
const Version = "1.3.0"

// Note: WebSocket upgrader is now defined in handlers/websocket.go

// Config holds the application configuration
type Config struct {
	Port          string
	Host          string
	LocalStorages []string
	MaxUploadSize int64
	EnableGzip    bool
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	config := &Config{
		Port:          getEnv("PORT", "8080"),
		Host:          getEnv("HOST", "0.0.0.0"),
		MaxUploadSize: 5 << 30, // 5GB default
		EnableGzip:    true,
	}

	// Parse local storage paths
	for i := 1; i <= 10; i++ {
		path := os.Getenv(fmt.Sprintf("LOCAL_STORAGE_%d", i))
		if path != "" {
			config.LocalStorages = append(config.LocalStorages, path)
		}
	}

	// If no local storages defined, use /data as default
	if len(config.LocalStorages) == 0 {
		config.LocalStorages = []string{"/data"}
	}

	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GzipMiddleware compresses responses when appropriate
func GzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip compression for WebSocket upgrades
		if r.Header.Get("Upgrade") == "websocket" {
			next.ServeHTTP(w, r)
			return
		}

		// Check if client accepts gzip
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		// Wrap response writer with gzip writer
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer func() {
			if err := gz.Close(); err != nil {
				// Ignore harmless errors like "http: request method or response status code does not allow body"
				// or "wrote more than the declared Content-Length"
				if !strings.Contains(err.Error(), "does not allow body") &&
				   !strings.Contains(err.Error(), "Content-Length") {
					log.Printf("Error closing gzip writer: %v", err)
				}
			}
		}()

		gzipWriter := &gzipResponseWriter{Writer: gz, ResponseWriter: w}
		next.ServeHTTP(gzipWriter, r)
	})
}

type gzipResponseWriter struct {
	http.ResponseWriter
	Writer *gzip.Writer
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

// CORSMiddleware adds CORS headers to responses
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get allowed origin from environment, default to * for development
		allowedOrigin := getEnv("ALLOWED_ORIGIN", "*")

		// If specific origin is set, validate the request origin
		if allowedOrigin != "*" {
			origin := r.Header.Get("Origin")
			if origin == allowedOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				// Log unauthorized origin attempt
				log.Printf("CORS: Blocked request from unauthorized origin: %s", origin)
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		} else {
			// Development mode - allow all origins
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// JSONResponse sends a JSON response
func JSONResponse(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
	}
}

// ErrorResponse sends an error response
func ErrorResponse(w http.ResponseWriter, message string, status int) {
	JSONResponse(w, map[string]interface{}{
		"success": false,
		"error": map[string]string{
			"message": message,
		},
	}, status)
}

// SuccessResponse sends a success response
func SuccessResponse(w http.ResponseWriter, data interface{}) {
	JSONResponse(w, map[string]interface{}{
		"success": true,
		"data":    data,
	}, http.StatusOK)
}

func main() {
	// Load configuration
	config := LoadConfig()
	log.Printf("[STARTUP] Config loaded: %d local storage paths", len(config.LocalStorages))

	// Initialize storage manager with cloud support
	storageManager := storage.NewCloudManager()
	log.Printf("[STARTUP] Storage manager initialized")

	// Load storage configuration (includes local and cloud storages)
	if err := storageManager.LoadConfig("config/storage.json"); err != nil {
		log.Printf("Warning: Failed to load storage config, using defaults: %v", err)
	}
	log.Printf("[STARTUP] Storage config loaded")

	// Add local storages from environment variables
	log.Printf("[STARTUP] Adding %d local storages from environment", len(config.LocalStorages))
	for i, localPath := range config.LocalStorages {
		storageID := fmt.Sprintf("local_%d", i+1)
		storageName := fmt.Sprintf("Local Storage %d", i+1)

		// Check if this storage already exists
		if _, err := storageManager.GetStorage(storageID); err == nil {
			log.Printf("Storage %s already exists, skipping", storageID)
			continue
		}

		storageConfig := storage.StorageConfig{
			ID:          storageID,
			Type:        "local",
			DisplayName: storageName,
			Icon:        "💾",
			Config: map[string]interface{}{
				"root_path": localPath,
			},
			IsDefault: i == 0, // First storage is default
		}

		if err := storageManager.AddStorage(storageConfig); err != nil {
			log.Printf("Warning: Failed to add storage %s: %v", storageID, err)
		} else {
			log.Printf("Added storage %s with path %s", storageID, localPath)
		}
	}
	log.Printf("[STARTUP] Finished adding local storages")

	// Create handlers with storage manager
	log.Printf("[STARTUP] Creating handlers...")
	fileHandlers := handlers.NewFileHandlers(storageManager.GetManager())
	wsHandler := handlers.NewWebSocketHandler()
	compressionHandler := handlers.NewCompressionHandler(storageManager.GetManager())
	storageHandler := handlers.NewStorageHandler(storageManager)
	securityHandler := handlers.NewSecurityHandler(storageManager)

	// Connect WebSocket handler to compression handler for progress tracking
	compressionHandler.SetWebSocketHandler(wsHandler)

	// Setup routes
	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api").Subrouter()

	// Health check endpoint
	api.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "ok",
			"message": "Backend is running",
		}); err != nil {
			log.Printf("Error encoding JSON response: %v", err)
		}
	}).Methods("GET")

	// Filesystem operations
	api.HandleFunc("/fs/list", fileHandlers.ListDirectory).Methods("GET")
	api.HandleFunc("/fs/mkdir", fileHandlers.CreateDirectory).Methods("POST")
	api.HandleFunc("/fs/copy", fileHandlers.CopyFiles).Methods("POST")
	api.HandleFunc("/fs/move", fileHandlers.MoveFiles).Methods("POST")
	api.HandleFunc("/fs/delete", fileHandlers.DeleteFiles).Methods("DELETE")
	api.HandleFunc("/fs/download", fileHandlers.DownloadFile).Methods("GET")
	api.HandleFunc("/fs/upload", fileHandlers.UploadFile).Methods("POST")

	// Compression operations
	api.HandleFunc("/fs/compress", compressionHandler.Compress).Methods("POST")
	api.HandleFunc("/fs/decompress", compressionHandler.Decompress).Methods("POST")

	// WebSocket endpoint for progress tracking
	api.HandleFunc("/ws", wsHandler.Handle)

	// Storage management endpoints
	api.HandleFunc("/storages", storageHandler.ListStorages).Methods("GET")
	api.HandleFunc("/storages", storageHandler.AddStorage).Methods("POST")
	api.HandleFunc("/storages/{id}", storageHandler.RemoveStorage).Methods("DELETE")
	api.HandleFunc("/storages/{id}/default", storageHandler.SetDefaultStorage).Methods("PUT")
	api.HandleFunc("/storages/test", storageHandler.TestConnection).Methods("POST")
	api.HandleFunc("/storages/transfer", storageHandler.TransferFiles).Methods("POST")

	// Security configuration endpoints
	api.HandleFunc("/security/config", securityHandler.GetSecurityConfig).Methods("GET")
	api.HandleFunc("/security/config", securityHandler.SetSecurityConfig).Methods("POST")
	api.HandleFunc("/security/validate", securityHandler.ValidateEndpoint).Methods("POST")

	// Config endpoint - returns server configuration
	api.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
		JSONResponse(w, map[string]interface{}{
			"version": Version,
		}, http.StatusOK)
	}).Methods("GET")

	// Serve frontend static files
	spa := spaHandler{staticPath: "frontend", indexPath: "index.html"}
	router.PathPrefix("/").Handler(spa)

	// Apply middleware
	handler := CORSMiddleware(router)
	if config.EnableGzip {
		handler = GzipMiddleware(handler)
	}

	// Start server
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)
	log.Printf("JaCommander server starting on %s", addr)
	log.Printf("Registered %d local storage(s)", len(config.LocalStorages))

	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}

// spaHandler implements the http.Handler interface for serving the SPA
type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Get the absolute path to prevent directory traversal
	path := r.URL.Path

	// Prepend the path with the static directory
	fullPath := h.staticPath + path

	// Check if file exists
	_, err := os.Stat(fullPath)
	if os.IsNotExist(err) {
		// File doesn't exist, serve index.html
		http.ServeFile(w, r, h.staticPath+"/"+h.indexPath)
		return
	} else if err != nil {
		// If we got an error (other than not exist), return 500
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// File exists, serve it
	http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
}
