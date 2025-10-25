package storage

import (
	"fmt"
	"io"
	"io/ioutil"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

// LocalStorage implements FileSystem for local filesystem access
type LocalStorage struct {
	rootPath string
}

// NewLocalStorage creates a new local storage instance
func NewLocalStorage(rootPath string) *LocalStorage {
	// Ensure the root path is absolute
	absPath, err := filepath.Abs(rootPath)
	if err != nil {
		absPath = rootPath
	}

	// Create directory if it doesn't exist
	os.MkdirAll(absPath, 0755)

	return &LocalStorage{
		rootPath: absPath,
	}
}

// GetType returns the storage type
func (ls *LocalStorage) GetType() string {
	return "local"
}

// GetRootPath returns the root path of this storage
func (ls *LocalStorage) GetRootPath() string {
	return ls.rootPath
}

// ResolvePath resolves a path relative to the root, preventing directory traversal
func (ls *LocalStorage) ResolvePath(path string) string {
	// Clean the path to remove . and .. elements
	cleanPath := filepath.Clean(path)

	// Remove leading slashes
	cleanPath = strings.TrimPrefix(cleanPath, "/")

	// Join with root path
	fullPath := filepath.Join(ls.rootPath, cleanPath)

	// Ensure the path is still within root (prevent directory traversal)
	if !strings.HasPrefix(fullPath, ls.rootPath) {
		return ls.rootPath
	}

	return fullPath
}

// IsValidPath checks if a path is valid and within the root directory
func (ls *LocalStorage) IsValidPath(path string) bool {
	resolvedPath := ls.ResolvePath(path)
	return strings.HasPrefix(resolvedPath, ls.rootPath)
}

// JoinPath joins path parts safely
func (ls *LocalStorage) JoinPath(parts ...string) string {
	return filepath.Join(parts...)
}

// List returns the contents of a directory
func (ls *LocalStorage) List(path string) ([]FileInfo, error) {
	fullPath := ls.ResolvePath(path)

	entries, err := ioutil.ReadDir(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	var files []FileInfo
	for _, entry := range entries {
		info := ls.fileInfoFromOS(entry, filepath.Join(fullPath, entry.Name()))

		// Make path relative to root for response
		relPath, _ := filepath.Rel(ls.rootPath, info.Path)
		info.Path = "/" + relPath

		files = append(files, info)
	}

	return files, nil
}

// Stat returns information about a file or directory
func (ls *LocalStorage) Stat(path string) (FileInfo, error) {
	fullPath := ls.ResolvePath(path)

	stat, err := os.Lstat(fullPath)
	if err != nil {
		return FileInfo{}, fmt.Errorf("failed to stat file: %w", err)
	}

	info := ls.fileInfoFromOS(stat, fullPath)

	// Make path relative to root for response
	relPath, _ := filepath.Rel(ls.rootPath, info.Path)
	info.Path = "/" + relPath

	return info, nil
}

// Read opens a file for reading
func (ls *LocalStorage) Read(path string) (io.ReadCloser, error) {
	fullPath := ls.ResolvePath(path)

	file, err := os.Open(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}

	return file, nil
}

// Write writes data to a file
func (ls *LocalStorage) Write(path string, data io.Reader) error {
	fullPath := ls.ResolvePath(path)

	// Create directory if necessary
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Create temporary file first
	tmpFile, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return fmt.Errorf("failed to create temporary file: %w", err)
	}
	tmpName := tmpFile.Name()

	// Copy data to temporary file
	_, err = io.Copy(tmpFile, data)
	tmpFile.Close()

	if err != nil {
		os.Remove(tmpName)
		return fmt.Errorf("failed to write data: %w", err)
	}

	// Rename temporary file to final name
	if err := os.Rename(tmpName, fullPath); err != nil {
		os.Remove(tmpName)
		return fmt.Errorf("failed to rename file: %w", err)
	}

	return nil
}

// Delete removes a file or directory
func (ls *LocalStorage) Delete(path string) error {
	fullPath := ls.ResolvePath(path)

	// Don't allow deleting the root directory itself
	if fullPath == ls.rootPath {
		return fmt.Errorf("cannot delete root directory")
	}

	// Check if it's a directory
	stat, err := os.Stat(fullPath)
	if err != nil {
		return fmt.Errorf("failed to stat file: %w", err)
	}

	if stat.IsDir() {
		// Remove directory and all contents
		return os.RemoveAll(fullPath)
	}

	// Remove single file
	return os.Remove(fullPath)
}

// MkDir creates a new directory
func (ls *LocalStorage) MkDir(path string) error {
	fullPath := ls.ResolvePath(path)

	if err := os.MkdirAll(fullPath, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	return nil
}

// Move moves or renames a file or directory
func (ls *LocalStorage) Move(src, dst string) error {
	srcPath := ls.ResolvePath(src)
	dstPath := ls.ResolvePath(dst)

	// Check if destination directory exists
	dstDir := filepath.Dir(dstPath)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return fmt.Errorf("failed to create destination directory: %w", err)
	}

	// Try simple rename first (works if on same filesystem)
	if err := os.Rename(srcPath, dstPath); err == nil {
		return nil
	}

	// If rename fails, fall back to copy and delete
	if err := ls.Copy(src, dst, nil); err != nil {
		return fmt.Errorf("failed to copy file: %w", err)
	}

	if err := ls.Delete(src); err != nil {
		// Try to clean up the copy
		ls.Delete(dst)
		return fmt.Errorf("failed to delete source after copy: %w", err)
	}

	return nil
}

// Copy copies a file or directory
func (ls *LocalStorage) Copy(src, dst string, progress ProgressCallback) error {
	srcPath := ls.ResolvePath(src)
	dstPath := ls.ResolvePath(dst)

	srcStat, err := os.Stat(srcPath)
	if err != nil {
		return fmt.Errorf("failed to stat source: %w", err)
	}

	if srcStat.IsDir() {
		return ls.copyDirectory(srcPath, dstPath, progress)
	}

	return ls.copyFile(srcPath, dstPath, srcStat.Size(), progress)
}

// copyFile copies a single file
func (ls *LocalStorage) copyFile(src, dst string, size int64, progress ProgressCallback) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file: %w", err)
	}
	defer srcFile.Close()

	// Create destination directory if needed
	dstDir := filepath.Dir(dst)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return fmt.Errorf("failed to create destination directory: %w", err)
	}

	dstFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dstFile.Close()

	// Copy with progress callback if provided
	if progress != nil {
		return ls.copyWithProgress(srcFile, dstFile, size, progress)
	}

	// Simple copy without progress
	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return fmt.Errorf("failed to copy file: %w", err)
	}

	// Preserve file permissions
	srcStat, _ := os.Stat(src)
	if srcStat != nil {
		os.Chmod(dst, srcStat.Mode())
	}

	return nil
}

// copyWithProgress copies data with progress reporting
func (ls *LocalStorage) copyWithProgress(src io.Reader, dst io.Writer, total int64, progress ProgressCallback) error {
	buf := make([]byte, 1024*1024) // 1MB buffer
	var written int64

	for {
		n, err := src.Read(buf)
		if n > 0 {
			if _, writeErr := dst.Write(buf[:n]); writeErr != nil {
				return writeErr
			}
			written += int64(n)
			if progress != nil {
				progress(written, total)
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	return nil
}

// copyDirectory recursively copies a directory
func (ls *LocalStorage) copyDirectory(src, dst string, progress ProgressCallback) error {
	// Create destination directory
	if err := os.MkdirAll(dst, 0755); err != nil {
		return fmt.Errorf("failed to create destination directory: %w", err)
	}

	// Read source directory
	entries, err := ioutil.ReadDir(src)
	if err != nil {
		return fmt.Errorf("failed to read source directory: %w", err)
	}

	// Copy each entry
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := ls.copyDirectory(srcPath, dstPath, progress); err != nil {
				return err
			}
		} else {
			if err := ls.copyFile(srcPath, dstPath, entry.Size(), progress); err != nil {
				return err
			}
		}
	}

	// Preserve directory permissions
	srcStat, _ := os.Stat(src)
	if srcStat != nil {
		os.Chmod(dst, srcStat.Mode())
	}

	return nil
}

// GetAvailableSpace returns available and total space for the filesystem
func (ls *LocalStorage) GetAvailableSpace() (available, total int64, err error) {
	var stat syscall.Statfs_t

	if err := syscall.Statfs(ls.rootPath, &stat); err != nil {
		return 0, 0, fmt.Errorf("failed to get filesystem stats: %w", err)
	}

	// Available space = available blocks * block size
	available = int64(stat.Bavail) * int64(stat.Bsize)
	// Total space = total blocks * block size
	total = int64(stat.Blocks) * int64(stat.Bsize)

	return available, total, nil
}

// fileInfoFromOS converts os.FileInfo to our FileInfo
func (ls *LocalStorage) fileInfoFromOS(info os.FileInfo, fullPath string) FileInfo {
	fileInfo := FileInfo{
		Name:        info.Name(),
		Path:        fullPath,
		Size:        info.Size(),
		ModTime:     info.ModTime(),
		IsDir:       info.IsDir(),
		Permissions: info.Mode().String(),
	}

	// Check if it's a symlink
	if info.Mode()&os.ModeSymlink != 0 {
		fileInfo.IsLink = true
		if target, err := os.Readlink(fullPath); err == nil {
			fileInfo.LinkTarget = target
		}
	}

	// Determine MIME type for files
	if !fileInfo.IsDir && !fileInfo.IsLink {
		ext := filepath.Ext(fileInfo.Name)
		if mimeType := mime.TypeByExtension(ext); mimeType != "" {
			fileInfo.MimeType = mimeType
		} else {
			fileInfo.MimeType = "application/octet-stream"
		}
	}

	return fileInfo
}
