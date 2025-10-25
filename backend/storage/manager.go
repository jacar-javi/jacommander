//go:build !basic
// +build !basic

package storage

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"sync"

	"github.com/jacommander/jacommander/backend/config"
	"github.com/jacommander/jacommander/backend/security"
)

// StorageConfig represents configuration for a storage backend
type StorageConfig struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"` // "local", "s3", "gdrive", "onedrive"
	DisplayName string                 `json:"display_name"`
	Icon        string                 `json:"icon"`
	Config      map[string]interface{} `json:"config"`
	IsDefault   bool                   `json:"is_default"`
}

// CloudManager manages multiple storage backends including cloud storage
type CloudManager struct {
	*Manager
	mu             sync.RWMutex
	configs        map[string]*StorageConfig
	securityConfig *config.SecurityConfig
	ipValidator    *security.IPValidator
}

// NewCloudManager creates a new cloud storage manager
func NewCloudManager() *CloudManager {
	secCfg := config.NewSecurityConfig()
	return &CloudManager{
		Manager:        NewManager(),
		configs:        make(map[string]*StorageConfig),
		securityConfig: secCfg,
		ipValidator:    security.NewIPValidator(secCfg.GetAllowLocalIPs()),
	}
}

// GetManager returns the embedded Manager for compatibility with handlers
func (cm *CloudManager) GetManager() *Manager {
	return cm.Manager
}

// LoadConfig loads storage configurations from a JSON file
func (sm *CloudManager) LoadConfig(path string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Check if config file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// Create default config
		return sm.createDefaultConfig(path)
	}

	data, err := ioutil.ReadFile(path)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	var configs []StorageConfig
	if err := json.Unmarshal(data, &configs); err != nil {
		return fmt.Errorf("failed to parse config: %w", err)
	}

	// Initialize storages based on config
	for _, cfg := range configs {
		if err := sm.initializeStorage(cfg); err != nil {
			// Log error but continue loading other storages
			fmt.Printf("Warning: Failed to initialize storage %s: %v\n", cfg.ID, err)
			continue
		}
	}

	return nil
}

// createDefaultConfig creates a default configuration file
func (sm *CloudManager) createDefaultConfig(path string) error {
	defaultConfigs := []StorageConfig{
		{
			ID:          "local",
			Type:        "local",
			DisplayName: "Local Storage",
			Icon:        "💾",
			Config: map[string]interface{}{
				"root_path": "/",
			},
			IsDefault: true,
		},
	}

	data, err := json.MarshalIndent(defaultConfigs, "", "  ")
	if err != nil {
		return err
	}

	if err := ioutil.WriteFile(path, data, 0644); err != nil {
		return err
	}

	// Initialize default storages
	for _, cfg := range defaultConfigs {
		if err := sm.initializeStorage(cfg); err != nil {
			return err
		}
	}

	return nil
}

// initializeStorage creates a storage backend based on configuration
func (sm *CloudManager) initializeStorage(cfg StorageConfig) error {
	var fs FileSystem
	var err error

	switch cfg.Type {
	case "local":
		rootPath := "/"
		if rp, ok := cfg.Config["root_path"].(string); ok {
			rootPath = rp
		}
		fs = NewLocalStorage(rootPath)

	case "s3":
		bucket, _ := cfg.Config["bucket"].(string)
		region, _ := cfg.Config["region"].(string)
		prefix, _ := cfg.Config["prefix"].(string)
		accessKey, _ := cfg.Config["access_key"].(string)
		secretKey, _ := cfg.Config["secret_key"].(string)
		endpoint, _ := cfg.Config["endpoint"].(string)

		// Validate custom S3 endpoint if provided
		if endpoint != "" {
			if err := sm.ipValidator.ValidateEndpoint(endpoint); err != nil {
				return fmt.Errorf("S3 endpoint validation failed: %w", err)
			}
		}

		s3fs, err := NewS3FileSystem(bucket, region, prefix, accessKey, secretKey, endpoint)
		if err != nil {
			return fmt.Errorf("failed to create S3 storage: %w", err)
		}
		fs = s3fs

	case "gdrive":
		clientID, _ := cfg.Config["client_id"].(string)
		clientSecret, _ := cfg.Config["client_secret"].(string)
		refreshToken, _ := cfg.Config["refresh_token"].(string)

		gdrive, err := NewGDriveAdapter(clientID, clientSecret, refreshToken)
		if err != nil {
			return fmt.Errorf("failed to create Google Drive storage: %w", err)
		}
		fs = gdrive

	case "onedrive":
		accessToken, _ := cfg.Config["access_token"].(string)
		driveID, _ := cfg.Config["drive_id"].(string)

		onedrive, err := NewOneDriveAdapter(accessToken, driveID)
		if err != nil {
			return fmt.Errorf("failed to create OneDrive storage: %w", err)
		}
		fs = onedrive

	case "ftp", "sftp":
		host, _ := cfg.Config["host"].(string)
		port, _ := cfg.Config["port"].(string)
		username, _ := cfg.Config["username"].(string)
		password, _ := cfg.Config["password"].(string)
		rootPath, _ := cfg.Config["root_path"].(string)

		// Validate FTP/SFTP host
		if err := sm.ipValidator.ValidateEndpoint(host); err != nil {
			return fmt.Errorf("FTP/SFTP host validation failed: %w", err)
		}

		ftp, err := NewFTPAdapter(cfg.Type, host, port, username, password, rootPath)
		if err != nil {
			return fmt.Errorf("failed to create FTP/SFTP storage: %w", err)
		}
		fs = ftp

	case "webdav":
		baseURL, _ := cfg.Config["base_url"].(string)
		username, _ := cfg.Config["username"].(string)
		password, _ := cfg.Config["password"].(string)
		rootPath, _ := cfg.Config["root_path"].(string)

		// Validate WebDAV endpoint
		if err := sm.ipValidator.ValidateEndpoint(baseURL); err != nil {
			return fmt.Errorf("WebDAV endpoint validation failed: %w", err)
		}

		webdav, err := NewWebDAVAdapter(baseURL, username, password, rootPath)
		if err != nil {
			return fmt.Errorf("failed to create WebDAV storage: %w", err)
		}
		fs = webdav

	case "nfs":
		server, _ := cfg.Config["server"].(string)
		exportPath, _ := cfg.Config["export_path"].(string)
		mountPoint, _ := cfg.Config["mount_point"].(string)
		readOnly, _ := cfg.Config["read_only"].(bool)

		// Validate NFS server
		if err := sm.ipValidator.ValidateEndpoint(server); err != nil {
			return fmt.Errorf("NFS server validation failed: %w", err)
		}

		nfs, err := NewNFSStorage(server, exportPath, mountPoint, readOnly)
		if err != nil {
			return fmt.Errorf("failed to create NFS storage: %w", err)
		}
		fs = nfs

	case "redis", "rdb":
		address, _ := cfg.Config["address"].(string)
		password, _ := cfg.Config["password"].(string)
		db := 0
		if dbNum, ok := cfg.Config["db"].(float64); ok {
			db = int(dbNum)
		}
		namespace, _ := cfg.Config["namespace"].(string)

		// Validate Redis server
		if err := sm.ipValidator.ValidateEndpoint(address); err != nil {
			return fmt.Errorf("Redis server validation failed: %w", err)
		}

		rdb, err := NewRDBStorage(address, password, db, namespace)
		if err != nil {
			return fmt.Errorf("failed to create Redis storage: %w", err)
		}
		fs = rdb

	default:
		return fmt.Errorf("unknown storage type: %s", cfg.Type)
	}

	sm.storages[cfg.ID] = fs
	sm.configs[cfg.ID] = &cfg
	return err
}

// AddStorage adds a new storage backend
func (sm *CloudManager) AddStorage(config StorageConfig) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if _, exists := sm.storages[config.ID]; exists {
		return fmt.Errorf("storage with ID %s already exists", config.ID)
	}

	if err := sm.initializeStorage(config); err != nil {
		return err
	}

	// Save updated configuration
	return sm.saveConfig()
}

// RemoveStorage removes a storage backend
func (sm *CloudManager) RemoveStorage(id string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if id == "local" {
		return fmt.Errorf("cannot remove local storage")
	}

	delete(sm.storages, id)
	delete(sm.configs, id)

	return sm.saveConfig()
}

// GetStorage retrieves a storage backend by ID
func (sm *CloudManager) GetStorage(id string) (FileSystem, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	fs, ok := sm.storages[id]
	if !ok {
		return nil, fmt.Errorf("storage %s not found", id)
	}
	return fs, nil
}

// GetDefaultStorage returns the default storage backend
func (sm *CloudManager) GetDefaultStorage() (FileSystem, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	for id, cfg := range sm.configs {
		if cfg.IsDefault {
			if fs, ok := sm.storages[id]; ok {
				return fs, nil
			}
		}
	}

	// Fall back to local storage
	if fs, ok := sm.storages["local"]; ok {
		return fs, nil
	}

	return nil, fmt.Errorf("no default storage found")
}

// ListStorages returns all available storage configurations
func (sm *CloudManager) ListStorages() []StorageConfig {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	var configs []StorageConfig
	for _, cfg := range sm.configs {
		configs = append(configs, *cfg)
	}
	return configs
}

// SetDefault sets a storage as the default
func (sm *CloudManager) SetDefault(id string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if _, ok := sm.storages[id]; !ok {
		return fmt.Errorf("storage %s not found", id)
	}

	// Clear all defaults
	for _, cfg := range sm.configs {
		cfg.IsDefault = false
	}

	// Set new default
	if cfg, ok := sm.configs[id]; ok {
		cfg.IsDefault = true
	}

	return sm.saveConfig()
}

// saveConfig saves the current configuration to file
func (sm *CloudManager) saveConfig() error {
	var configs []StorageConfig
	for _, cfg := range sm.configs {
		configs = append(configs, *cfg)
	}

	data, err := json.MarshalIndent(configs, "", "  ")
	if err != nil {
		return err
	}

	return ioutil.WriteFile("config/storage.json", data, 0644)
}

// TransferBetweenStorages copies files between different storage backends
func (sm *CloudManager) TransferBetweenStorages(srcStorageID, srcPath, dstStorageID, dstPath string, progress ProgressCallback) error {
	sm.mu.RLock()
	srcStorage, srcOk := sm.storages[srcStorageID]
	dstStorage, dstOk := sm.storages[dstStorageID]
	sm.mu.RUnlock()

	if !srcOk {
		return fmt.Errorf("source storage %s not found", srcStorageID)
	}
	if !dstOk {
		return fmt.Errorf("destination storage %s not found", dstStorageID)
	}

	// Read from source
	reader, err := srcStorage.Read(srcPath)
	if err != nil {
		return fmt.Errorf("failed to read from source: %w", err)
	}
	defer reader.Close()

	// Write to destination
	if err := dstStorage.Write(dstPath, reader); err != nil {
		return fmt.Errorf("failed to write to destination: %w", err)
	}

	return nil
}

// GetSecurityConfig returns the current security configuration
func (sm *CloudManager) GetSecurityConfig() map[string]interface{} {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	return map[string]interface{}{
		"allowLocalIPs": sm.securityConfig.GetAllowLocalIPs(),
		"blockedRanges": sm.ipValidator.GetBlockedRanges(),
	}
}

// SetAllowLocalIPs updates the local IP permission
func (sm *CloudManager) SetAllowLocalIPs(allow bool) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Update configuration
	if err := sm.securityConfig.SetAllowLocalIPs(allow); err != nil {
		return err
	}

	// Update validator
	sm.ipValidator = security.NewIPValidator(allow)

	return nil
}
