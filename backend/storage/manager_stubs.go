//go:build basic
// +build basic

package storage

import (
	"fmt"
	"io"
	"os"
)

// CloudManager stub for basic build
type CloudManager struct {
	*Manager
}

// NewCloudManager creates a basic storage manager (stub for basic build)
func NewCloudManager() *CloudManager {
	return &CloudManager{
		Manager: NewManager(),
	}
}

// GetManager returns the embedded Manager
func (cm *CloudManager) GetManager() *Manager {
	return cm.Manager
}

// LoadConfig is a stub for basic build
func (cm *CloudManager) LoadConfig(path string) error {
	// In basic build, just initialize with local storage
	homeDir := os.Getenv("HOME")
	if homeDir == "" {
		homeDir = "."
	}
	localFS := NewLocalStorage(homeDir)
	cm.Register("local", localFS)
	return nil
}

// GetSecurityConfig stub
func (cm *CloudManager) GetSecurityConfig() map[string]interface{} {
	return map[string]interface{}{
		"allowLocalIPs": true,
	}
}

// SetAllowLocalIPs stub
func (cm *CloudManager) SetAllowLocalIPs(allow bool) error {
	return nil
}

// ListStorages returns list of available storages
func (cm *CloudManager) ListStorages() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"id":           "local",
			"type":         "local",
			"display_name": "Local Storage",
			"is_default":   true,
		},
	}
}

// AddStorage stub (not supported in basic build)
func (cm *CloudManager) AddStorage(config StorageConfig) error {
	return fmt.Errorf("adding cloud storage not supported in basic build")
}

// RemoveStorage stub
func (cm *CloudManager) RemoveStorage(id string) error {
	if id == "local" {
		return fmt.Errorf("cannot remove local storage")
	}
	return nil
}

// SetDefault stub
func (cm *CloudManager) SetDefault(id string) error {
	if id != "local" {
		return fmt.Errorf("only local storage available in basic build")
	}
	return nil
}

// TransferBetweenStorages stub (not supported in basic build)
func (cm *CloudManager) TransferBetweenStorages(srcStorageID, srcPath, dstStorageID, dstPath string, progress ProgressCallback) error {
	return fmt.Errorf("transfer between storages not supported in basic build")
}

// StorageConfig for basic build
type StorageConfig struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	DisplayName string                 `json:"display_name"`
	Icon        string                 `json:"icon"`
	Config      map[string]interface{} `json:"config"`
	IsDefault   bool                   `json:"is_default"`
}

// Stub functions for basic build without external dependencies

func NewGDriveAdapter(credentialsJSON, clientID, clientSecret string) (FileSystem, error) {
	return nil, fmt.Errorf("Google Drive storage not available in basic build")
}

func NewOneDriveAdapter(accessToken, driveID string) (FileSystem, error) {
	return nil, fmt.Errorf("OneDrive storage not available in basic build")
}

func NewFTPStorage(protocol, host, port, username, password, rootPath string) (FileSystem, error) {
	return nil, fmt.Errorf("FTP/SFTP storage not available in basic build")
}

func NewWebDAVStorage(baseURL, username, password string) (FileSystem, error) {
	return nil, fmt.Errorf("WebDAV storage not available in basic build")
}

func NewNFSStorage(server, exportPath, mountPoint string, readOnly bool) (FileSystem, error) {
	return nil, fmt.Errorf("NFS storage not available in basic build")
}

func NewRDBStorage(address, password string, db int, namespace string) (FileSystem, error) {
	return nil, fmt.Errorf("Redis storage not available in basic build")
}

// Stub implementations for additional functions
func NewFTPAdapter(protocol, host, port, username, password, rootPath string) (FileSystem, error) {
	return NewFTPStorage(protocol, host, port, username, password, rootPath)
}

func NewWebDAVAdapter(baseURL, username, password, rootPath string) (FileSystem, error) {
	return NewWebDAVStorage(baseURL, username, password)
}

// Stub type definitions to satisfy compilation
type File = io.ReadCloser
type FileEvent struct {
	Type string
	Path string
}
type SearchResult struct {
	Path    string
	Line    int
	Content string
}
type UsageInfo struct {
	Used  int64
	Total int64
	Free  int64
}
