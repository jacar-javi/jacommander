package storage

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"path"
	"strings"
)

// S3FileSystem adapts S3Storage to implement the FileSystem interface
type S3FileSystem struct {
	*S3Storage
}

// NewS3FileSystem creates a new S3 filesystem adapter
func NewS3FileSystem(bucket, region, prefix, accessKey, secretKey, endpoint string) (*S3FileSystem, error) {
	s3Storage, err := NewS3Storage(bucket, region, prefix, accessKey, secretKey, endpoint)
	if err != nil {
		return nil, err
	}
	return &S3FileSystem{S3Storage: s3Storage}, nil
}

// Stat returns information about a file or directory
func (s *S3FileSystem) Stat(path string) (FileInfo, error) {
	info, err := s.GetInfo(path)
	if err != nil {
		return FileInfo{}, err
	}
	return *info, nil
}

// Read returns an io.ReadCloser for the file content
func (s *S3FileSystem) Read(path string) (io.ReadCloser, error) {
	data, err := s.S3Storage.Read(path)
	if err != nil {
		return nil, err
	}
	return ioutil.NopCloser(bytes.NewReader(data)), nil
}

// Write writes data from an io.Reader to a file
func (s *S3FileSystem) Write(path string, data io.Reader) error {
	content, err := ioutil.ReadAll(data)
	if err != nil {
		return fmt.Errorf("failed to read data: %w", err)
	}
	return s.S3Storage.Write(path, content)
}

// MkDir creates a directory
func (s *S3FileSystem) MkDir(path string) error {
	return s.CreateDirectory(path)
}

// Copy copies a file with progress callback
func (s *S3FileSystem) Copy(src, dst string, progress ProgressCallback) error {
	// For S3, we can use the native copy operation
	return s.S3Storage.Copy(src, dst)
}

// GetRootPath returns the root path of the storage
func (s *S3FileSystem) GetRootPath() string {
	if s.prefix != "" {
		return "/" + s.prefix
	}
	return "/"
}

// GetAvailableSpace returns available and total space
// For S3, we return unlimited space
func (s *S3FileSystem) GetAvailableSpace() (available, total int64, err error) {
	// S3 has effectively unlimited space
	const unlimitedSpace = int64(1 << 62) // Very large number
	return unlimitedSpace, unlimitedSpace, nil
}

// IsValidPath checks if a path is valid
func (s *S3FileSystem) IsValidPath(path string) bool {
	// S3 paths should not contain certain characters
	invalidChars := []string{"\\", "?", "#", "[", "]", "{", "}", "^", "`", "|", ">", "<"}
	for _, char := range invalidChars {
		if strings.Contains(path, char) {
			return false
		}
	}
	return true
}

// JoinPath joins path components
func (s *S3FileSystem) JoinPath(parts ...string) string {
	return path.Join(parts...)
}

// ResolvePath resolves a path to its absolute form
func (s *S3FileSystem) ResolvePath(p string) string {
	// Remove leading slash if present
	p = strings.TrimPrefix(p, "/")

	// Handle relative paths
	if !strings.HasPrefix(p, "/") && s.prefix != "" {
		return "/" + path.Join(s.prefix, p)
	}
	return "/" + p
}
