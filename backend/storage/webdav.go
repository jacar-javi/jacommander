//go:build !basic
// +build !basic

package storage

import (
	"encoding/xml"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
)

// WebDAVStorage implements FileSystem interface for WebDAV servers
type WebDAVStorage struct {
	client   *http.Client
	baseURL  string
	username string
	password string
	rootPath string
}

// WebDAV response structures
type multiStatus struct {
	XMLName   xml.Name   `xml:"multistatus"`
	Responses []response `xml:"response"`
}

type response struct {
	Href     string   `xml:"href"`
	Propstat propstat `xml:"propstat"`
}

type propstat struct {
	Prop prop `xml:"prop"`
}

type prop struct {
	GetLastModified  string       `xml:"getlastmodified"`
	GetContentLength int64        `xml:"getcontentlength"`
	ResourceType     resourceType `xml:"resourcetype"`
	DisplayName      string       `xml:"displayname"`
	GetContentType   string       `xml:"getcontenttype"`
}

type resourceType struct {
	Collection *struct{} `xml:"collection"`
}

// NewWebDAVStorage creates a new WebDAV filesystem
func NewWebDAVStorage(baseURL, username, password, rootPath string) (*WebDAVStorage, error) {
	// Ensure baseURL ends without trailing slash
	baseURL = strings.TrimSuffix(baseURL, "/")

	// Ensure rootPath starts with /
	if rootPath == "" {
		rootPath = "/"
	} else if !strings.HasPrefix(rootPath, "/") {
		rootPath = "/" + rootPath
	}

	fs := &WebDAVStorage{
		client:   &http.Client{Timeout: 30 * time.Second},
		baseURL:  baseURL,
		username: username,
		password: password,
		rootPath: rootPath,
	}

	// Test connection
	if _, err := fs.List("/"); err != nil {
		return nil, fmt.Errorf("failed to connect to WebDAV server: %v", err)
	}

	return fs, nil
}

// List lists files in a directory
func (w *WebDAVStorage) List(dirPath string) ([]FileInfo, error) {
	fullPath := w.getFullPath(dirPath)
	fullURL := w.baseURL + fullPath

	// Create PROPFIND request
	propfindBody := `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:resourcetype/>
    <d:getcontenttype/>
  </d:prop>
</d:propfind>`

	req, err := http.NewRequest("PROPFIND", fullURL, strings.NewReader(propfindBody))
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(w.username, w.password)
	req.Header.Set("Depth", "1")
	req.Header.Set("Content-Type", "application/xml")

	resp, err := w.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusMultiStatus {
		body, _ := ioutil.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, body)
	}

	var ms multiStatus
	if err := xml.NewDecoder(resp.Body).Decode(&ms); err != nil {
		return nil, err
	}

	var files []FileInfo
	for i, response := range ms.Responses {
		// Skip the directory itself (first entry)
		if i == 0 && strings.TrimSuffix(response.Href, "/") == strings.TrimSuffix(fullPath, "/") {
			continue
		}

		// Parse href to get the name
		href, _ := url.QueryUnescape(response.Href)
		name := path.Base(href)

		// Skip empty names
		if name == "" || name == "." {
			continue
		}

		// Determine if it's a directory
		isDir := response.Propstat.Prop.ResourceType.Collection != nil

		// Parse modification time
		modTime := w.parseTime(response.Propstat.Prop.GetLastModified)

		// Build file path
		filePath := path.Join(dirPath, name)

		files = append(files, FileInfo{
			Name:     name,
			Size:     response.Propstat.Prop.GetContentLength,
			IsDir:    isDir,
			ModTime:  modTime,
			Path:     filePath,
			MimeType: response.Propstat.Prop.GetContentType,
		})
	}

	return files, nil
}

// Stat returns information about a file
func (w *WebDAVStorage) Stat(filePath string) (FileInfo, error) {
	fullPath := w.getFullPath(filePath)
	fullURL := w.baseURL + fullPath

	// Create PROPFIND request
	propfindBody := `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:resourcetype/>
    <d:getcontenttype/>
  </d:prop>
</d:propfind>`

	req, err := http.NewRequest("PROPFIND", fullURL, strings.NewReader(propfindBody))
	if err != nil {
		return FileInfo{}, err
	}

	req.SetBasicAuth(w.username, w.password)
	req.Header.Set("Depth", "0")
	req.Header.Set("Content-Type", "application/xml")

	resp, err := w.client.Do(req)
	if err != nil {
		return FileInfo{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusMultiStatus {
		return FileInfo{}, fmt.Errorf("file not found: %s", filePath)
	}

	var ms multiStatus
	if err := xml.NewDecoder(resp.Body).Decode(&ms); err != nil {
		return FileInfo{}, err
	}

	if len(ms.Responses) == 0 {
		return FileInfo{}, fmt.Errorf("no response for file: %s", filePath)
	}

	response := ms.Responses[0]
	isDir := response.Propstat.Prop.ResourceType.Collection != nil
	modTime := w.parseTime(response.Propstat.Prop.GetLastModified)

	return FileInfo{
		Name:     path.Base(filePath),
		Size:     response.Propstat.Prop.GetContentLength,
		IsDir:    isDir,
		ModTime:  modTime,
		Path:     filePath,
		MimeType: response.Propstat.Prop.GetContentType,
	}, nil
}

// Read reads a file from WebDAV server
func (w *WebDAVStorage) Read(filePath string) (io.ReadCloser, error) {
	fullPath := w.getFullPath(filePath)
	fullURL := w.baseURL + fullPath

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(w.username, w.password)

	resp, err := w.client.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("failed to read file: %s (status %d)", filePath, resp.StatusCode)
	}

	return resp.Body, nil
}

// Write writes a file to WebDAV server
func (w *WebDAVStorage) Write(filePath string, data io.Reader) error {
	fullPath := w.getFullPath(filePath)
	fullURL := w.baseURL + fullPath

	// Ensure parent directory exists
	parentDir := path.Dir(fullPath)
	if parentDir != "/" && parentDir != "." {
		w.ensureDir(parentDir)
	}

	req, err := http.NewRequest("PUT", fullURL, data)
	if err != nil {
		return err
	}

	req.SetBasicAuth(w.username, w.password)

	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("failed to write file: %s (status %d): %s", filePath, resp.StatusCode, body)
	}

	return nil
}

// Delete deletes a file or directory
func (w *WebDAVStorage) Delete(filePath string) error {
	fullPath := w.getFullPath(filePath)
	fullURL := w.baseURL + fullPath

	req, err := http.NewRequest("DELETE", fullURL, nil)
	if err != nil {
		return err
	}

	req.SetBasicAuth(w.username, w.password)

	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to delete: %s (status %d)", filePath, resp.StatusCode)
	}

	return nil
}

// MkDir creates a directory
func (w *WebDAVStorage) MkDir(dirPath string) error {
	fullPath := w.getFullPath(dirPath)
	fullURL := w.baseURL + fullPath

	// Ensure trailing slash for directories
	if !strings.HasSuffix(fullURL, "/") {
		fullURL += "/"
	}

	req, err := http.NewRequest("MKCOL", fullURL, nil)
	if err != nil {
		return err
	}

	req.SetBasicAuth(w.username, w.password)

	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to create directory: %s (status %d)", dirPath, resp.StatusCode)
	}

	return nil
}

// Move moves a file or directory
func (w *WebDAVStorage) Move(src, dst string) error {
	srcPath := w.getFullPath(src)
	srcURL := w.baseURL + srcPath

	dstPath := w.getFullPath(dst)
	dstURL := w.baseURL + dstPath

	req, err := http.NewRequest("MOVE", srcURL, nil)
	if err != nil {
		return err
	}

	req.SetBasicAuth(w.username, w.password)
	req.Header.Set("Destination", dstURL)
	req.Header.Set("Overwrite", "T")

	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to move file: %s to %s (status %d)", src, dst, resp.StatusCode)
	}

	return nil
}

// Copy copies a file
func (w *WebDAVStorage) Copy(src, dst string, progress ProgressCallback) error {
	// Get file info for progress reporting
	info, err := w.Stat(src)
	if err != nil {
		return err
	}

	if progress != nil {
		progress(0, info.Size, src)
	}

	srcPath := w.getFullPath(src)
	srcURL := w.baseURL + srcPath

	dstPath := w.getFullPath(dst)
	dstURL := w.baseURL + dstPath

	req, err := http.NewRequest("COPY", srcURL, nil)
	if err != nil {
		return err
	}

	req.SetBasicAuth(w.username, w.password)
	req.Header.Set("Destination", dstURL)
	req.Header.Set("Overwrite", "T")

	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to copy file: %s to %s (status %d)", src, dst, resp.StatusCode)
	}

	if progress != nil {
		progress(info.Size, info.Size, src)
	}

	return nil
}

// GetType returns the storage type
func (w *WebDAVStorage) GetType() string {
	return "webdav"
}

// GetRootPath returns the root path
func (w *WebDAVStorage) GetRootPath() string {
	return w.rootPath
}

// GetAvailableSpace returns available and total space
func (w *WebDAVStorage) GetAvailableSpace() (available, total int64, err error) {
	// Try to get quota information (not all servers support this)
	fullURL := w.baseURL + w.rootPath

	propfindBody := `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:quota-available-bytes/>
    <d:quota-used-bytes/>
  </d:prop>
</d:propfind>`

	req, err := http.NewRequest("PROPFIND", fullURL, strings.NewReader(propfindBody))
	if err != nil {
		return -1, -1, nil
	}

	req.SetBasicAuth(w.username, w.password)
	req.Header.Set("Depth", "0")
	req.Header.Set("Content-Type", "application/xml")

	resp, err := w.client.Do(req)
	if err != nil {
		return -1, -1, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusMultiStatus {
		return -1, -1, nil
	}

	// Parse quota response if available
	// Most servers don't support quota, so we return -1 to indicate unknown
	return -1, -1, nil
}

// IsValidPath checks if a path is valid
func (w *WebDAVStorage) IsValidPath(filePath string) bool {
	// Basic validation
	return !strings.Contains(filePath, "")
}

// JoinPath joins path parts
func (w *WebDAVStorage) JoinPath(parts ...string) string {
	return path.Join(parts...)
}

// ResolvePath resolves a path
func (w *WebDAVStorage) ResolvePath(filePath string) string {
	return path.Clean(filePath)
}

// GetFileContent reads file content
func (w *WebDAVStorage) GetFileContent(filePath string) ([]byte, error) {
	reader, err := w.Read(filePath)
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	return ioutil.ReadAll(reader)
}

// PutFileContent writes file content
func (w *WebDAVStorage) PutFileContent(filePath string, content []byte) error {
	return w.Write(filePath, strings.NewReader(string(content)))
}

// Search searches for files
func (w *WebDAVStorage) Search(query string, options map[string]interface{}) ([]FileInfo, error) {
	// Start from root and search recursively
	return w.searchRecursive(w.rootPath, query, options, 0)
}

func (w *WebDAVStorage) searchRecursive(dirPath, query string, options map[string]interface{}, depth int) ([]FileInfo, error) {
	if depth > 10 { // Limit recursion depth
		return nil, nil
	}

	files, err := w.List(dirPath)
	if err != nil {
		return nil, err
	}

	var results []FileInfo
	queryLower := strings.ToLower(query)

	for _, file := range files {
		// Check if name matches
		if strings.Contains(strings.ToLower(file.Name), queryLower) {
			results = append(results, file)
		}

		// Recursively search directories
		if file.IsDir {
			subResults, _ := w.searchRecursive(file.Path, query, options, depth+1)
			results = append(results, subResults...)
		}

		// Limit results
		if len(results) >= 100 {
			break
		}
	}

	return results, nil
}

// Helper functions

func (w *WebDAVStorage) getFullPath(filePath string) string {
	if filePath == "" || filePath == "/" {
		return w.rootPath
	}

	// Clean the path
	cleaned := path.Clean(filePath)

	// Combine with root path
	if strings.HasPrefix(cleaned, "/") {
		return path.Join(w.rootPath, cleaned)
	}

	return path.Join(w.rootPath, "/", cleaned)
}

func (w *WebDAVStorage) parseTime(timeStr string) time.Time {
	if timeStr == "" {
		return time.Time{}
	}

	// Try RFC1123 format first (common in WebDAV)
	t, err := time.Parse(time.RFC1123, timeStr)
	if err == nil {
		return t
	}

	// Try RFC3339
	t, err = time.Parse(time.RFC3339, timeStr)
	if err == nil {
		return t
	}

	// Try custom format
	t, err = time.Parse("Mon, 02 Jan 2006 15:04:05 MST", timeStr)
	if err == nil {
		return t
	}

	return time.Time{}
}

func (w *WebDAVStorage) ensureDir(dirPath string) error {
	// Check if directory exists
	_, err := w.Stat(dirPath)
	if err == nil {
		return nil // Directory exists
	}

	// Create parent directories recursively
	parent := path.Dir(dirPath)
	if parent != "/" && parent != "." {
		if err := w.ensureDir(parent); err != nil {
			return err
		}
	}

	// Create the directory
	return w.MkDir(dirPath)
}

// WebDAVAdapter adapts WebDAVStorage to implement FileSystem interface
type WebDAVAdapter struct {
	*WebDAVStorage
}

// NewWebDAVAdapter creates a new WebDAV adapter
func NewWebDAVAdapter(baseURL, username, password, rootPath string) (FileSystem, error) {
	storage, err := NewWebDAVStorage(baseURL, username, password, rootPath)
	if err != nil {
		return nil, err
	}
	return &WebDAVAdapter{storage}, nil
}
