//go:build !basic
// +build !basic

package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"golang.org/x/oauth2"
)

// OneDriveStorage implements FileSystem interface for Microsoft OneDrive
type OneDriveStorage struct {
	client  *http.Client
	baseURL string
	driveID string
	cache   map[string]*OneDriveItem
	// Note: accessToken removed - auth handled via OAuth2 client configuration
}

// OneDriveItem represents a file or folder in OneDrive
type OneDriveItem struct {
	ID               string           `json:"id"`
	Name             string           `json:"name"`
	Size             int64            `json:"size"`
	CreatedDateTime  string           `json:"createdDateTime"`
	ModifiedDateTime string           `json:"lastModifiedDateTime"`
	WebURL           string           `json:"webUrl"`
	DownloadURL      string           `json:"@microsoft.graph.downloadUrl,omitempty"`
	Folder           *OneDriveFolder  `json:"folder,omitempty"`
	File             *OneDriveFile    `json:"file,omitempty"`
	ParentReference  *ParentReference `json:"parentReference,omitempty"`
}

// OneDriveFolder represents folder metadata
type OneDriveFolder struct {
	ChildCount int32 `json:"childCount"`
}

// OneDriveFile represents file metadata
type OneDriveFile struct {
	MimeType string `json:"mimeType"`
}

// ParentReference contains parent folder information
type ParentReference struct {
	DriveID string `json:"driveId"`
	ID      string `json:"id"`
	Path    string `json:"path"`
}

// OneDriveListResponse represents the response from listing items
type OneDriveListResponse struct {
	Value    []OneDriveItem `json:"value"`
	NextLink string         `json:"@odata.nextLink,omitempty"`
}

// NewOneDriveFileSystem creates a new OneDrive filesystem
func NewOneDriveFileSystem(clientID, clientSecret, refreshToken string) (*OneDriveStorage, error) {
	// Create OAuth2 config
	config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
			TokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
		},
		Scopes: []string{
			"https://graph.microsoft.com/files.readwrite",
			"https://graph.microsoft.com/user.read",
		},
	}

	// Create token from refresh token
	token := &oauth2.Token{
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
	}

	// Create HTTP client with OAuth2
	client := config.Client(context.Background(), token)

	// Get drive information
	driveResp, err := client.Get("https://graph.microsoft.com/v1.0/me/drive")
	if err != nil {
		return nil, fmt.Errorf("failed to get drive info: %v", err)
	}
	defer func() {
		if err := driveResp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	var driveInfo struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(driveResp.Body).Decode(&driveInfo); err != nil {
		return nil, fmt.Errorf("failed to parse drive info: %v", err)
	}

	return &OneDriveStorage{
		client:  client,
		baseURL: "https://graph.microsoft.com/v1.0",
		driveID: driveInfo.ID,
		cache:   make(map[string]*OneDriveItem),
	}, nil
}

// List lists files in a directory
func (o *OneDriveStorage) List(dirPath string) ([]FileInfo, error) {
	encodedPath := o.encodePath(dirPath)

	var apiURL string
	if dirPath == "/" || dirPath == "" {
		apiURL = fmt.Sprintf("%s/me/drive/root/children", o.baseURL)
	} else {
		apiURL = fmt.Sprintf("%s/me/drive/root:%s:/children", o.baseURL, encodedPath)
	}

	var allItems []OneDriveItem
	nextLink := apiURL

	// Handle pagination
	for nextLink != "" {
		resp, err := o.client.Get(nextLink)
		if err != nil {
			return nil, fmt.Errorf("failed to list items: %v", err)
		}
		defer func() {
			if err := resp.Body.Close(); err != nil {
				log.Printf("Error closing response body: %v", err)
			}
		}()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("API error: %s", body)
		}

		var listResp OneDriveListResponse
		if err := json.NewDecoder(resp.Body).Decode(&listResp); err != nil {
			return nil, fmt.Errorf("failed to parse response: %v", err)
		}

		allItems = append(allItems, listResp.Value...)
		nextLink = listResp.NextLink
	}

	// Convert to FileInfo
	var files []FileInfo
	for _, item := range allItems {
		isDir := item.Folder != nil
		mimeType := ""
		if item.File != nil {
			mimeType = item.File.MimeType
		}

		// Cache the item
		fullPath := path.Join(dirPath, item.Name)
		o.cache[fullPath] = &item

		files = append(files, FileInfo{
			Name:     item.Name,
			Size:     item.Size,
			IsDir:    isDir,
			ModTime:  o.parseTime(item.ModifiedDateTime),
			Path:     fullPath,
			MimeType: mimeType,
		})
	}

	return files, nil
}

// Stat returns information about a file
func (o *OneDriveStorage) Stat(filePath string) (FileInfo, error) {
	encodedPath := o.encodePath(filePath)

	var apiURL string
	if filePath == "/" || filePath == "" {
		apiURL = fmt.Sprintf("%s/me/drive/root", o.baseURL)
	} else {
		apiURL = fmt.Sprintf("%s/me/drive/root:%s", o.baseURL, encodedPath)
	}

	resp, err := o.client.Get(apiURL)
	if err != nil {
		return FileInfo{}, fmt.Errorf("failed to get item info: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return FileInfo{}, fmt.Errorf("item not found")
	}

	var item OneDriveItem
	if err := json.NewDecoder(resp.Body).Decode(&item); err != nil {
		return FileInfo{}, fmt.Errorf("failed to parse item info: %v", err)
	}

	isDir := item.Folder != nil
	mimeType := ""
	if item.File != nil {
		mimeType = item.File.MimeType
	}

	return FileInfo{
		Name:     item.Name,
		Size:     item.Size,
		IsDir:    isDir,
		ModTime:  o.parseTime(item.ModifiedDateTime),
		Path:     filePath,
		MimeType: mimeType,
	}, nil
}

// Read reads a file from OneDrive
func (o *OneDriveStorage) Read(filePath string) (io.ReadCloser, error) {
	encodedPath := o.encodePath(filePath)
	apiURL := fmt.Sprintf("%s/me/drive/root:%s:/content", o.baseURL, encodedPath)

	resp, err := o.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		func() {
			if err := resp.Body.Close(); err != nil {
				log.Printf("Error closing response body: %v", err)
			}
		}()
		return nil, fmt.Errorf("failed to download file: status %d", resp.StatusCode)
	}

	return resp.Body, nil
}

// Write writes a file to OneDrive
func (o *OneDriveStorage) Write(filePath string, data io.Reader) error {
	content, err := io.ReadAll(data)
	if err != nil {
		return fmt.Errorf("failed to read data: %v", err)
	}

	// For small files (< 4MB), use simple upload
	if len(content) < 4*1024*1024 {
		return o.simpleUpload(filePath, content)
	}

	// For large files, use upload session
	return o.largeUpload(filePath, content)
}

// simpleUpload handles small file uploads
func (o *OneDriveStorage) simpleUpload(filePath string, content []byte) error {
	encodedPath := o.encodePath(filePath)
	apiURL := fmt.Sprintf("%s/me/drive/root:%s:/content", o.baseURL, encodedPath)

	req, err := http.NewRequest("PUT", apiURL, bytes.NewReader(content))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/octet-stream")

	resp, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("upload failed: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upload failed: %s", body)
	}

	return nil
}

// largeUpload handles large file uploads using upload sessions
func (o *OneDriveStorage) largeUpload(filePath string, content []byte) error {
	// Create upload session
	encodedPath := o.encodePath(filePath)
	sessionURL := fmt.Sprintf("%s/me/drive/root:%s:/createUploadSession", o.baseURL, encodedPath)

	sessionReq := map[string]interface{}{
		"@microsoft.graph.conflictBehavior": "rename",
	}

	sessionData, _ := json.Marshal(sessionReq)
	req, err := http.NewRequest("POST", sessionURL, bytes.NewReader(sessionData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := o.client.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to create upload session: %s", body)
	}

	var session struct {
		UploadURL string `json:"uploadUrl"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&session); err != nil {
		return err
	}

	// Upload file in chunks
	chunkSize := 10 * 1024 * 1024 // 10MB chunks
	totalSize := len(content)

	for offset := 0; offset < totalSize; offset += chunkSize {
		end := offset + chunkSize
		if end > totalSize {
			end = totalSize
		}

		chunk := content[offset:end]

		req, err := http.NewRequest("PUT", session.UploadURL, bytes.NewReader(chunk))
		if err != nil {
			return err
		}

		rangeHeader := fmt.Sprintf("bytes %d-%d/%d", offset, end-1, totalSize)
		req.Header.Set("Content-Range", rangeHeader)
		req.Header.Set("Content-Length", fmt.Sprintf("%d", len(chunk)))

		chunkResp, err := o.client.Do(req)
		if err != nil {
			return err
		}
		func() {
			if err := chunkResp.Body.Close(); err != nil {
				log.Printf("Error closing chunk response body: %v", err)
			}
		}()

		if chunkResp.StatusCode != http.StatusAccepted && chunkResp.StatusCode != http.StatusCreated && chunkResp.StatusCode != http.StatusOK {
			return fmt.Errorf("chunk upload failed: status %d", chunkResp.StatusCode)
		}
	}

	return nil
}

// Delete deletes a file or folder
func (o *OneDriveStorage) Delete(filePath string) error {
	encodedPath := o.encodePath(filePath)
	apiURL := fmt.Sprintf("%s/me/drive/root:%s", o.baseURL, encodedPath)

	req, err := http.NewRequest("DELETE", apiURL, nil)
	if err != nil {
		return err
	}

	resp, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("delete failed: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed: %s", body)
	}

	// Remove from cache
	delete(o.cache, filePath)

	return nil
}

// MkDir creates a directory
func (o *OneDriveStorage) MkDir(dirPath string) error {
	parentPath := path.Dir(dirPath)
	dirName := path.Base(dirPath)

	var apiURL string
	if parentPath == "/" || parentPath == "." {
		apiURL = fmt.Sprintf("%s/me/drive/root/children", o.baseURL)
	} else {
		encodedParent := o.encodePath(parentPath)
		apiURL = fmt.Sprintf("%s/me/drive/root:%s:/children", o.baseURL, encodedParent)
	}

	folderData := map[string]interface{}{
		"name":                              dirName,
		"folder":                            map[string]interface{}{},
		"@microsoft.graph.conflictBehavior": "rename",
	}

	data, _ := json.Marshal(folderData)
	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(data))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("mkdir failed: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("mkdir failed: %s", body)
	}

	return nil
}

// Move moves a file or folder
func (o *OneDriveStorage) Move(src, dst string) error {
	// Get source item ID
	srcEncoded := o.encodePath(src)
	srcURL := fmt.Sprintf("%s/me/drive/root:%s", o.baseURL, srcEncoded)

	srcResp, err := o.client.Get(srcURL)
	if err != nil {
		return err
	}
	defer func() {
		if err := srcResp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	var srcItem OneDriveItem
	if err := json.NewDecoder(srcResp.Body).Decode(&srcItem); err != nil {
		return err
	}

	// Prepare move request
	dstParent := path.Dir(dst)
	dstName := path.Base(dst)

	var parentRef map[string]interface{}
	if dstParent == "/" || dstParent == "." {
		parentRef = map[string]interface{}{
			"path": "/drive/root",
		}
	} else {
		parentRef = map[string]interface{}{
			"path": "/drive/root:" + o.encodePath(dstParent),
		}
	}

	patchData := map[string]interface{}{
		"parentReference": parentRef,
		"name":            dstName,
	}

	data, _ := json.Marshal(patchData)
	patchURL := fmt.Sprintf("%s/me/drive/items/%s", o.baseURL, srcItem.ID)

	req, err := http.NewRequest("PATCH", patchURL, bytes.NewReader(data))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("move failed: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("move failed: %s", body)
	}

	// Update cache
	delete(o.cache, src)

	return nil
}

// Copy copies a file
func (o *OneDriveStorage) Copy(src, dst string, progress ProgressCallback) error {
	// Get source item
	srcEncoded := o.encodePath(src)
	srcURL := fmt.Sprintf("%s/me/drive/root:%s", o.baseURL, srcEncoded)

	srcResp, err := o.client.Get(srcURL)
	if err != nil {
		return err
	}
	defer func() {
		if err := srcResp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	var srcItem OneDriveItem
	if err := json.NewDecoder(srcResp.Body).Decode(&srcItem); err != nil {
		return err
	}

	// Report initial progress
	if progress != nil {
		progress(0, srcItem.Size)
	}

	// Prepare copy request
	dstParent := path.Dir(dst)
	dstName := path.Base(dst)

	var parentRef map[string]interface{}
	if dstParent == "/" || dstParent == "." {
		parentRef = map[string]interface{}{
			"driveId": o.driveID,
			"path":    "/drive/root",
		}
	} else {
		parentRef = map[string]interface{}{
			"driveId": o.driveID,
			"path":    "/drive/root:" + o.encodePath(dstParent),
		}
	}

	copyData := map[string]interface{}{
		"parentReference": parentRef,
		"name":            dstName,
	}

	data, _ := json.Marshal(copyData)
	copyURL := fmt.Sprintf("%s/me/drive/items/%s/copy", o.baseURL, srcItem.ID)

	req, err := http.NewRequest("POST", copyURL, bytes.NewReader(data))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "respond-async")

	resp, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("copy failed: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusAccepted {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("copy failed: %s", body)
	}

	// Get monitor URL from Location header
	monitorURL := resp.Header.Get("Location")
	if monitorURL != "" {
		// Poll for completion
		for {
			time.Sleep(1 * time.Second)

			statusResp, err := o.client.Get(monitorURL)
			if err != nil {
				break
			}

			var status struct {
				PercentageComplete float64 `json:"percentageComplete"`
				Status             string  `json:"status"`
			}

			_ = json.NewDecoder(statusResp.Body).Decode(&status)
			_ = statusResp.Body.Close()

			if progress != nil {
				completed := int64(float64(srcItem.Size) * status.PercentageComplete / 100)
				progress(completed, srcItem.Size)
			}

			if status.Status == "completed" || status.Status == "failed" {
				break
			}
		}
	}

	// Report completion
	if progress != nil {
		progress(srcItem.Size, srcItem.Size)
	}

	return nil
}

// GetType returns the storage type
func (o *OneDriveStorage) GetType() string {
	return "onedrive"
}

// GetRootPath returns the root path
func (o *OneDriveStorage) GetRootPath() string {
	return "/"
}

// GetAvailableSpace returns available and total space
func (o *OneDriveStorage) GetAvailableSpace() (available, total int64, err error) {
	resp, err := o.client.Get(fmt.Sprintf("%s/me/drive", o.baseURL))
	if err != nil {
		return 0, 0, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	var driveInfo struct {
		Quota struct {
			Total     int64 `json:"total"`
			Used      int64 `json:"used"`
			Remaining int64 `json:"remaining"`
		} `json:"quota"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&driveInfo); err != nil {
		return 0, 0, err
	}

	return driveInfo.Quota.Remaining, driveInfo.Quota.Total, nil
}

// IsValidPath checks if a path is valid
func (o *OneDriveStorage) IsValidPath(filePath string) bool {
	// OneDrive path restrictions
	invalidChars := []string{"<", ">", ":", "\"", "|", "?", "*", "\x00"}
	for _, char := range invalidChars {
		if strings.Contains(filePath, char) {
			return false
		}
	}
	return true
}

// JoinPath joins path parts
func (o *OneDriveStorage) JoinPath(parts ...string) string {
	return path.Join(parts...)
}

// ResolvePath resolves a path
func (o *OneDriveStorage) ResolvePath(filePath string) string {
	return path.Clean(filePath)
}

// GetFileContent reads file content
func (o *OneDriveStorage) GetFileContent(filePath string) ([]byte, error) {
	reader, err := o.Read(filePath)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := reader.Close(); err != nil {
			log.Printf("Error closing reader: %v", err)
		}
	}()

	return io.ReadAll(reader)
}

// PutFileContent writes file content
func (o *OneDriveStorage) PutFileContent(filePath string, content []byte) error {
	return o.Write(filePath, bytes.NewReader(content))
}

// Search searches for files
func (o *OneDriveStorage) Search(query string, options map[string]interface{}) ([]FileInfo, error) {
	searchURL := fmt.Sprintf("%s/me/drive/search(q='%s')", o.baseURL, url.QueryEscape(query))

	resp, err := o.client.Get(searchURL)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	var searchResp struct {
		Value []OneDriveItem `json:"value"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, err
	}

	var results []FileInfo
	for _, item := range searchResp.Value {
		isDir := item.Folder != nil
		mimeType := ""
		if item.File != nil {
			mimeType = item.File.MimeType
		}

		results = append(results, FileInfo{
			Name:     item.Name,
			Size:     item.Size,
			IsDir:    isDir,
			ModTime:  o.parseTime(item.ModifiedDateTime),
			MimeType: mimeType,
		})
	}

	return results, nil
}

// Helper functions

func (o *OneDriveStorage) encodePath(filePath string) string {
	// URL encode path for OneDrive API
	parts := strings.Split(filePath, "/")
	for i, part := range parts {
		parts[i] = url.QueryEscape(part)
	}
	return strings.Join(parts, "/")
}

func (o *OneDriveStorage) parseTime(timeStr string) time.Time {
	if timeStr == "" {
		return time.Time{}
	}

	t, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		// Try alternative formats
		t, _ = time.Parse("2006-01-02T15:04:05Z", timeStr)
	}

	return t
}

// OneDriveAdapter adapts OneDriveStorage to implement FileSystem interface
type OneDriveAdapter struct {
	*OneDriveStorage
}

// NewOneDriveAdapter creates a new OneDrive adapter
func NewOneDriveAdapter(clientID, clientSecret, refreshToken string) (FileSystem, error) {
	storage, err := NewOneDriveFileSystem(clientID, clientSecret, refreshToken)
	if err != nil {
		return nil, err
	}
	return &OneDriveAdapter{storage}, nil
}
