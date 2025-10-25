//go:build !basic
// +build !basic

package storage

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// NFSStorage implements FileSystem interface for NFS mounts
type NFSStorage struct {
	mountPoint string
	server     string
	exportPath string
	mounted    bool
	readOnly   bool
}

// NewNFSStorage creates a new NFS storage backend
func NewNFSStorage(server, exportPath, mountPoint string, readOnly bool) (*NFSStorage, error) {
	nfs := &NFSStorage{
		server:     server,
		exportPath: exportPath,
		mountPoint: mountPoint,
		readOnly:   readOnly,
	}

	// Check if already mounted
	if err := nfs.checkMount(); err == nil {
		nfs.mounted = true
	} else {
		// Try to mount
		if err := nfs.mount(); err != nil {
			return nil, fmt.Errorf("failed to mount NFS share: %w", err)
		}
	}

	return nfs, nil
}

// mount attempts to mount the NFS share
func (nfs *NFSStorage) mount() error {
	// Create mount point if it doesn't exist
	if err := os.MkdirAll(nfs.mountPoint, 0755); err != nil {
		return fmt.Errorf("failed to create mount point: %w", err)
	}

	// Build mount command
	mountOptions := "rw,sync,hard,intr"
	if nfs.readOnly {
		mountOptions = "ro,sync,hard,intr"
	}

	// Mount NFS share
	cmd := exec.Command("mount", "-t", "nfs",
		"-o", mountOptions,
		fmt.Sprintf("%s:%s", nfs.server, nfs.exportPath),
		nfs.mountPoint)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("mount failed: %s - %v", string(output), err)
	}

	nfs.mounted = true
	return nil
}

// unmount unmounts the NFS share
func (nfs *NFSStorage) unmount() error {
	if !nfs.mounted {
		return nil
	}

	cmd := exec.Command("umount", nfs.mountPoint)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("unmount failed: %s - %v", string(output), err)
	}

	nfs.mounted = false
	return nil
}

// checkMount verifies if the NFS share is currently mounted
func (nfs *NFSStorage) checkMount() error {
	cmd := exec.Command("mount")
	output, err := cmd.Output()
	if err != nil {
		return err
	}

	mountLine := fmt.Sprintf("%s:%s on %s", nfs.server, nfs.exportPath, nfs.mountPoint)
	if strings.Contains(string(output), mountLine) {
		return nil
	}

	return fmt.Errorf("not mounted")
}

// List returns a list of files/directories at the given path
func (nfs *NFSStorage) List(path string) ([]FileInfo, error) {
	if !nfs.mounted {
		return nil, fmt.Errorf("NFS share not mounted")
	}

	fullPath := filepath.Join(nfs.mountPoint, path)

	entries, err := ioutil.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	files := make([]FileInfo, len(entries))
	for i, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		files[i] = FileInfo{
			Name:    entry.Name(),
			Size:    info.Size(),
			ModTime: info.ModTime(),
			IsDir:   entry.IsDir(),
			Mode:    info.Mode(),
		}
	}

	return files, nil
}

// Read opens a file for reading
func (nfs *NFSStorage) Read(path string) (io.ReadCloser, error) {
	if !nfs.mounted {
		return nil, fmt.Errorf("NFS share not mounted")
	}

	fullPath := filepath.Join(nfs.mountPoint, path)
	return os.Open(fullPath)
}

// Write writes data to a file
func (nfs *NFSStorage) Write(path string, data io.Reader) error {
	if !nfs.mounted {
		return fmt.Errorf("NFS share not mounted")
	}

	if nfs.readOnly {
		return fmt.Errorf("NFS share is mounted read-only")
	}

	fullPath := filepath.Join(nfs.mountPoint, path)

	// Ensure parent directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Create or truncate file
	file, err := os.Create(fullPath)
	if err != nil {
		return err
	}
	defer file.Close()

	// Copy data
	_, err = io.Copy(file, data)
	return err
}

// Delete removes a file or directory
func (nfs *NFSStorage) Delete(path string) error {
	if !nfs.mounted {
		return fmt.Errorf("NFS share not mounted")
	}

	if nfs.readOnly {
		return fmt.Errorf("NFS share is mounted read-only")
	}

	fullPath := filepath.Join(nfs.mountPoint, path)
	return os.RemoveAll(fullPath)
}

// MkDir creates a new directory
func (nfs *NFSStorage) MkDir(path string) error {
	if !nfs.mounted {
		return fmt.Errorf("NFS share not mounted")
	}

	if nfs.readOnly {
		return fmt.Errorf("NFS share is mounted read-only")
	}

	fullPath := filepath.Join(nfs.mountPoint, path)
	return os.MkdirAll(fullPath, 0755)
}

// Stat returns information about a file
func (nfs *NFSStorage) Stat(path string) (FileInfo, error) {
	if !nfs.mounted {
		return FileInfo{}, fmt.Errorf("NFS share not mounted")
	}

	fullPath := filepath.Join(nfs.mountPoint, path)

	info, err := os.Stat(fullPath)
	if err != nil {
		return FileInfo{}, err
	}

	return FileInfo{
		Name:    info.Name(),
		Size:    info.Size(),
		ModTime: info.ModTime(),
		IsDir:   info.IsDir(),
		Mode:    info.Mode(),
	}, nil
}

// Move moves a file from src to dst
func (nfs *NFSStorage) Move(src, dst string) error {
	if !nfs.mounted {
		return fmt.Errorf("NFS share not mounted")
	}

	if nfs.readOnly {
		return fmt.Errorf("NFS share is mounted read-only")
	}

	srcPath := filepath.Join(nfs.mountPoint, src)
	dstPath := filepath.Join(nfs.mountPoint, dst)

	// Ensure destination directory exists
	dstDir := filepath.Dir(dstPath)
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return err
	}

	return os.Rename(srcPath, dstPath)
}

// Copy copies a file from src to dst
func (nfs *NFSStorage) Copy(src, dst string) error {
	if !nfs.mounted {
		return fmt.Errorf("NFS share not mounted")
	}

	srcFile, err := nfs.Read(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	return nfs.Write(dst, srcFile)
}

// Close unmounts the NFS share
func (nfs *NFSStorage) Close() error {
	return nfs.unmount()
}

// GetMountInfo returns information about the NFS mount
func (nfs *NFSStorage) GetMountInfo() map[string]interface{} {
	info := map[string]interface{}{
		"server":     nfs.server,
		"exportPath": nfs.exportPath,
		"mountPoint": nfs.mountPoint,
		"mounted":    nfs.mounted,
		"readOnly":   nfs.readOnly,
	}

	// Try to get disk usage info
	if nfs.mounted {
		var stat os.Statfs_t
		if err := os.Statfs(nfs.mountPoint, &stat); err == nil {
			info["totalSpace"] = stat.Blocks * uint64(stat.Bsize)
			info["freeSpace"] = stat.Bavail * uint64(stat.Bsize)
			info["usedSpace"] = (stat.Blocks - stat.Bfree) * uint64(stat.Bsize)
		}
	}

	return info
}

// RefreshMount attempts to remount if connection was lost
func (nfs *NFSStorage) RefreshMount() error {
	if err := nfs.checkMount(); err != nil {
		nfs.mounted = false
		return nfs.mount()
	}
	return nil
}
