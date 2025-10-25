package storage

import (
	"io"
	"time"
)

// FileInfo represents information about a file or directory
type FileInfo struct {
	Name        string    `json:"name"`
	Path        string    `json:"path"`
	Size        int64     `json:"size"`
	ModTime     time.Time `json:"modified"`
	IsDir       bool      `json:"is_dir"`
	Permissions string    `json:"permissions"`
	MimeType    string    `json:"mime_type,omitempty"`
	IsLink      bool      `json:"is_link,omitempty"`
	LinkTarget  string    `json:"link_target,omitempty"`
}

// ProgressCallback is called during long operations to report progress
type ProgressCallback func(current, total int64)

// FileSystem defines the interface for all storage backends
type FileSystem interface {
	// Basic operations
	List(path string) ([]FileInfo, error)
	Stat(path string) (FileInfo, error)
	Read(path string) (io.ReadCloser, error)
	Write(path string, data io.Reader) error
	Delete(path string) error
	MkDir(path string) error

	// File operations
	Move(src, dst string) error
	Copy(src, dst string, progress ProgressCallback) error

	// Backend information
	GetType() string
	GetRootPath() string
	GetAvailableSpace() (available, total int64, err error)

	// Path utilities
	IsValidPath(path string) bool
	JoinPath(parts ...string) string
	ResolvePath(path string) string
}

// Manager manages multiple storage backends
type Manager struct {
	storages map[string]FileSystem
}

// NewManager creates a new storage manager
func NewManager() *Manager {
	return &Manager{
		storages: make(map[string]FileSystem),
	}
}

// Register adds a new storage backend
func (m *Manager) Register(id string, fs FileSystem) {
	m.storages[id] = fs
}

// Get retrieves a storage backend by ID
func (m *Manager) Get(id string) (FileSystem, bool) {
	fs, ok := m.storages[id]
	return fs, ok
}

// List returns all registered storage IDs
func (m *Manager) List() []string {
	var ids []string
	for id := range m.storages {
		ids = append(ids, id)
	}
	return ids
}

// GetAll returns all registered storages with their IDs
func (m *Manager) GetAll() map[string]FileSystem {
	result := make(map[string]FileSystem)
	for id, fs := range m.storages {
		result[id] = fs
	}
	return result
}
