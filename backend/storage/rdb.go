//go:build !basic
// +build !basic

package storage

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-redis/redis/v8"
	"golang.org/x/net/context"
)

// RDBStorage implements FileSystem interface for Redis Database storage
// This stores files as binary data in Redis with metadata
type RDBStorage struct {
	client    *redis.Client
	ctx       context.Context
	namespace string // Prefix for all keys to avoid collisions
	maxSize   int64  // Maximum file size allowed (default 100MB)
}

// RDBFileMetadata stores file metadata in Redis
type RDBFileMetadata struct {
	Name     string      `json:"name"`
	Size     int64       `json:"size"`
	ModTime  time.Time   `json:"mod_time"`
	IsDir    bool        `json:"is_dir"`
	Mode     os.FileMode `json:"mode"`
	Children []string    `json:"children,omitempty"` // For directories
}

// NewRDBStorage creates a new Redis-based storage backend
func NewRDBStorage(address, password string, db int, namespace string) (*RDBStorage, error) {
	client := redis.NewClient(&redis.Options{
		Addr:       address,
		Password:   password,
		DB:         db,
		PoolSize:   10,
		MaxRetries: 3,
	})

	ctx := context.Background()

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	if namespace == "" {
		namespace = "jacommander"
	}

	return &RDBStorage{
		client:    client,
		ctx:       ctx,
		namespace: namespace,
		maxSize:   100 * 1024 * 1024, // 100MB default
	}, nil
}

// getKey returns the Redis key for a given path
func (r *RDBStorage) getKey(path string) string {
	return fmt.Sprintf("%s:fs:%s", r.namespace, strings.TrimPrefix(path, "/"))
}

// getDataKey returns the Redis key for file data
func (r *RDBStorage) getDataKey(path string) string {
	return fmt.Sprintf("%s:data:%s", r.namespace, strings.TrimPrefix(path, "/"))
}

// List returns a list of files/directories at the given path
func (r *RDBStorage) List(path string) ([]FileInfo, error) {
	key := r.getKey(path)

	// Get directory metadata
	metaStr, err := r.client.Get(r.ctx, key).Result()
	if err == redis.Nil {
		// Try to list root if path is empty
		if path == "" || path == "/" {
			return r.listRoot()
		}
		return nil, fmt.Errorf("path not found: %s", path)
	} else if err != nil {
		return nil, err
	}

	var meta RDBFileMetadata
	if err := json.Unmarshal([]byte(metaStr), &meta); err != nil {
		return nil, err
	}

	if !meta.IsDir {
		return nil, fmt.Errorf("not a directory: %s", path)
	}

	// Get metadata for each child
	files := make([]FileInfo, 0, len(meta.Children))
	for _, childName := range meta.Children {
		childPath := filepath.Join(path, childName)
		childKey := r.getKey(childPath)

		childMetaStr, err := r.client.Get(r.ctx, childKey).Result()
		if err == redis.Nil {
			continue
		} else if err != nil {
			continue
		}

		var childMeta RDBFileMetadata
		if err := json.Unmarshal([]byte(childMetaStr), &childMeta); err != nil {
			continue
		}

		files = append(files, FileInfo{
			Name:    childMeta.Name,
			Size:    childMeta.Size,
			ModTime: childMeta.ModTime,
			IsDir:   childMeta.IsDir,
			Mode:    childMeta.Mode,
		})
	}

	return files, nil
}

// listRoot lists items in the root directory
func (r *RDBStorage) listRoot() ([]FileInfo, error) {
	pattern := fmt.Sprintf("%s:fs:*", r.namespace)
	keys, err := r.client.Keys(r.ctx, pattern).Result()
	if err != nil {
		return nil, err
	}

	seen := make(map[string]bool)
	files := make([]FileInfo, 0)

	for _, key := range keys {
		// Extract path from key
		path := strings.TrimPrefix(key, fmt.Sprintf("%s:fs:", r.namespace))

		// Get first level only
		parts := strings.Split(path, "/")
		if len(parts) > 0 && parts[0] != "" {
			topLevel := parts[0]
			if !seen[topLevel] {
				seen[topLevel] = true

				// Get metadata for this item
				itemKey := r.getKey(topLevel)
				metaStr, err := r.client.Get(r.ctx, itemKey).Result()
				if err == nil {
					var meta RDBFileMetadata
					if err := json.Unmarshal([]byte(metaStr), &meta); err == nil {
						files = append(files, FileInfo{
							Name:    meta.Name,
							Size:    meta.Size,
							ModTime: meta.ModTime,
							IsDir:   meta.IsDir,
							Mode:    meta.Mode,
						})
					}
				}
			}
		}
	}

	return files, nil
}

// Read opens a file for reading
func (r *RDBStorage) Read(path string) (io.ReadCloser, error) {
	// Get file metadata
	metaKey := r.getKey(path)
	metaStr, err := r.client.Get(r.ctx, metaKey).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("file not found: %s", path)
	} else if err != nil {
		return nil, err
	}

	var meta RDBFileMetadata
	if err := json.Unmarshal([]byte(metaStr), &meta); err != nil {
		return nil, err
	}

	if meta.IsDir {
		return nil, fmt.Errorf("cannot read directory: %s", path)
	}

	// Get file data
	dataKey := r.getDataKey(path)
	data, err := r.client.Get(r.ctx, dataKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to read file data: %w", err)
	}

	// Decode from base64
	decoded, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return nil, fmt.Errorf("failed to decode file data: %w", err)
	}

	return ioutil.NopCloser(bytes.NewReader(decoded)), nil
}

// Write writes data to a file
func (r *RDBStorage) Write(path string, data io.Reader) error {
	// Read all data
	content, err := ioutil.ReadAll(data)
	if err != nil {
		return err
	}

	// Check size limit
	if int64(len(content)) > r.maxSize {
		return fmt.Errorf("file size exceeds limit (%d bytes > %d bytes)", len(content), r.maxSize)
	}

	// Create metadata
	meta := RDBFileMetadata{
		Name:    filepath.Base(path),
		Size:    int64(len(content)),
		ModTime: time.Now(),
		IsDir:   false,
		Mode:    0644,
	}

	// Store metadata
	metaJSON, err := json.Marshal(meta)
	if err != nil {
		return err
	}

	metaKey := r.getKey(path)
	if err := r.client.Set(r.ctx, metaKey, metaJSON, 0).Err(); err != nil {
		return err
	}

	// Store data (encoded as base64 to handle binary)
	dataKey := r.getDataKey(path)
	encoded := base64.StdEncoding.EncodeToString(content)
	if err := r.client.Set(r.ctx, dataKey, encoded, 0).Err(); err != nil {
		// Rollback metadata
		r.client.Del(r.ctx, metaKey)
		return err
	}

	// Update parent directory
	r.updateParentDir(path)

	return nil
}

// Delete removes a file or directory
func (r *RDBStorage) Delete(path string) error {
	metaKey := r.getKey(path)

	// Get metadata to check if it's a directory
	metaStr, err := r.client.Get(r.ctx, metaKey).Result()
	if err == redis.Nil {
		return fmt.Errorf("path not found: %s", path)
	} else if err != nil {
		return err
	}

	var meta RDBFileMetadata
	if err := json.Unmarshal([]byte(metaStr), &meta); err != nil {
		return err
	}

	if meta.IsDir {
		// Delete all children recursively
		for _, child := range meta.Children {
			childPath := filepath.Join(path, child)
			if err := r.Delete(childPath); err != nil {
				return err
			}
		}
	} else {
		// Delete file data
		dataKey := r.getDataKey(path)
		r.client.Del(r.ctx, dataKey)
	}

	// Delete metadata
	r.client.Del(r.ctx, metaKey)

	// Update parent directory
	r.removeFromParentDir(path)

	return nil
}

// MkDir creates a new directory
func (r *RDBStorage) MkDir(path string) error {
	// Check if already exists
	metaKey := r.getKey(path)
	exists, _ := r.client.Exists(r.ctx, metaKey).Result()
	if exists > 0 {
		return fmt.Errorf("path already exists: %s", path)
	}

	// Create directory metadata
	meta := RDBFileMetadata{
		Name:     filepath.Base(path),
		Size:     0,
		ModTime:  time.Now(),
		IsDir:    true,
		Mode:     0755,
		Children: []string{},
	}

	metaJSON, err := json.Marshal(meta)
	if err != nil {
		return err
	}

	if err := r.client.Set(r.ctx, metaKey, metaJSON, 0).Err(); err != nil {
		return err
	}

	// Update parent directory
	r.updateParentDir(path)

	return nil
}

// Stat returns information about a file
func (r *RDBStorage) Stat(path string) (FileInfo, error) {
	metaKey := r.getKey(path)
	metaStr, err := r.client.Get(r.ctx, metaKey).Result()
	if err == redis.Nil {
		return FileInfo{}, fmt.Errorf("path not found: %s", path)
	} else if err != nil {
		return FileInfo{}, err
	}

	var meta RDBFileMetadata
	if err := json.Unmarshal([]byte(metaStr), &meta); err != nil {
		return FileInfo{}, err
	}

	return FileInfo{
		Name:    meta.Name,
		Size:    meta.Size,
		ModTime: meta.ModTime,
		IsDir:   meta.IsDir,
		Mode:    meta.Mode,
	}, nil
}

// Move moves a file from src to dst
func (r *RDBStorage) Move(src, dst string) error {
	// Read source file
	srcData, err := r.Read(src)
	if err != nil {
		// If it's a directory, handle differently
		srcInfo, statErr := r.Stat(src)
		if statErr != nil {
			return err
		}

		if srcInfo.IsDir {
			// Create destination directory
			if err := r.MkDir(dst); err != nil {
				return err
			}

			// Move all children
			children, err := r.List(src)
			if err != nil {
				return err
			}

			for _, child := range children {
				srcChild := filepath.Join(src, child.Name)
				dstChild := filepath.Join(dst, child.Name)
				if err := r.Move(srcChild, dstChild); err != nil {
					return err
				}
			}
		}

		// Delete source
		return r.Delete(src)
	}
	defer srcData.Close()

	// Write to destination
	if err := r.Write(dst, srcData); err != nil {
		return err
	}

	// Delete source
	return r.Delete(src)
}

// Copy copies a file from src to dst
func (r *RDBStorage) Copy(src, dst string) error {
	srcData, err := r.Read(src)
	if err != nil {
		// If it's a directory, handle differently
		srcInfo, statErr := r.Stat(src)
		if statErr != nil {
			return err
		}

		if srcInfo.IsDir {
			// Create destination directory
			if err := r.MkDir(dst); err != nil {
				return err
			}

			// Copy all children
			children, err := r.List(src)
			if err != nil {
				return err
			}

			for _, child := range children {
				srcChild := filepath.Join(src, child.Name)
				dstChild := filepath.Join(dst, child.Name)
				if err := r.Copy(srcChild, dstChild); err != nil {
					return err
				}
			}
			return nil
		}
		return err
	}
	defer srcData.Close()

	return r.Write(dst, srcData)
}

// updateParentDir adds a child to its parent directory
func (r *RDBStorage) updateParentDir(childPath string) {
	parent := filepath.Dir(childPath)
	if parent == "." || parent == "/" || parent == childPath {
		return
	}

	parentKey := r.getKey(parent)
	metaStr, err := r.client.Get(r.ctx, parentKey).Result()
	if err != nil {
		// Parent doesn't exist, create it
		r.MkDir(parent)
		return
	}

	var meta RDBFileMetadata
	if err := json.Unmarshal([]byte(metaStr), &meta); err != nil {
		return
	}

	childName := filepath.Base(childPath)
	// Check if child already in list
	for _, c := range meta.Children {
		if c == childName {
			return
		}
	}

	meta.Children = append(meta.Children, childName)
	metaJSON, _ := json.Marshal(meta)
	r.client.Set(r.ctx, parentKey, metaJSON, 0)
}

// removeFromParentDir removes a child from its parent directory
func (r *RDBStorage) removeFromParentDir(childPath string) {
	parent := filepath.Dir(childPath)
	if parent == "." || parent == "/" || parent == childPath {
		return
	}

	parentKey := r.getKey(parent)
	metaStr, err := r.client.Get(r.ctx, parentKey).Result()
	if err != nil {
		return
	}

	var meta RDBFileMetadata
	if err := json.Unmarshal([]byte(metaStr), &meta); err != nil {
		return
	}

	childName := filepath.Base(childPath)
	newChildren := make([]string, 0, len(meta.Children))
	for _, c := range meta.Children {
		if c != childName {
			newChildren = append(newChildren, c)
		}
	}

	meta.Children = newChildren
	metaJSON, _ := json.Marshal(meta)
	r.client.Set(r.ctx, parentKey, metaJSON, 0)
}

// Close closes the Redis connection
func (r *RDBStorage) Close() error {
	return r.client.Close()
}

// GetInfo returns information about the Redis storage
func (r *RDBStorage) GetInfo() map[string]interface{} {
	info := map[string]interface{}{
		"type":      "redis",
		"namespace": r.namespace,
		"maxSize":   r.maxSize,
	}

	// Get Redis server info
	if result := r.client.Info(r.ctx, "server"); result.Err() == nil {
		info["serverInfo"] = result.Val()
	}

	// Get memory usage
	if result := r.client.Info(r.ctx, "memory"); result.Err() == nil {
		info["memoryInfo"] = result.Val()
	}

	// Count keys in namespace
	pattern := fmt.Sprintf("%s:*", r.namespace)
	if keys, err := r.client.Keys(r.ctx, pattern).Result(); err == nil {
		info["totalKeys"] = len(keys)
	}

	return info
}
