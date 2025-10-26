//go:build !basic
// +build !basic

package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"path"
	"strings"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// GDriveStorage implements FileSystem interface for Google Drive
type GDriveStorage struct {
	service *drive.Service
	rootID  string
	cache   map[string]*drive.File // Path to file cache
}

// NewGDriveFileSystem creates a new Google Drive filesystem
func NewGDriveFileSystem(clientID, clientSecret, refreshToken string) (*GDriveStorage, error) {
	config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		Scopes:       []string{drive.DriveScope},
		RedirectURL:  "urn:ietf:wg:oauth:2.0:oob",
	}

	token := &oauth2.Token{
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
	}

	client := config.Client(context.Background(), token)

	service, err := drive.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("unable to create Drive service: %v", err)
	}

	// Get root folder ID
	rootFile, err := service.Files.Get("root").Do()
	if err != nil {
		return nil, fmt.Errorf("unable to get root folder: %v", err)
	}

	return &GDriveStorage{
		service: service,
		rootID:  rootFile.Id,
		cache:   make(map[string]*drive.File),
	}, nil
}

// List lists files in a directory
func (g *GDriveStorage) List(dirPath string) ([]FileInfo, error) {
	parentID, err := g.getFileID(dirPath)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf("'%s' in parents and trashed = false", parentID)

	fileList, err := g.service.Files.List().
		Q(query).
		Fields("files(id, name, size, mimeType, modifiedTime, createdTime, parents)").
		PageSize(1000).
		Do()

	if err != nil {
		return nil, fmt.Errorf("unable to list files: %v", err)
	}

	var files []FileInfo
	for _, f := range fileList.Files {
		isDir := f.MimeType == "application/vnd.google-apps.folder"

		// Cache the file for later use
		fullPath := path.Join(dirPath, f.Name)
		g.cache[fullPath] = f

		files = append(files, FileInfo{
			Name:     f.Name,
			Size:     f.Size,
			IsDir:    isDir,
			ModTime:  parseGoogleTime(f.ModifiedTime),
			Path:     fullPath,
			MimeType: f.MimeType,
		})
	}

	return files, nil
}

// Stat returns information about a file
func (g *GDriveStorage) Stat(filePath string) (FileInfo, error) {
	fileID, err := g.getFileID(filePath)
	if err != nil {
		return FileInfo{}, err
	}

	file, err := g.service.Files.Get(fileID).
		Fields("id, name, size, mimeType, modifiedTime, createdTime").
		Do()

	if err != nil {
		return FileInfo{}, fmt.Errorf("unable to get file info: %v", err)
	}

	isDir := file.MimeType == "application/vnd.google-apps.folder"

	return FileInfo{
		Name:     file.Name,
		Size:     file.Size,
		IsDir:    isDir,
		ModTime:  parseGoogleTime(file.ModifiedTime),
		Path:     filePath,
		MimeType: file.MimeType,
	}, nil
}

// Read reads a file from Google Drive
func (g *GDriveStorage) Read(filePath string) (io.ReadCloser, error) {
	fileID, err := g.getFileID(filePath)
	if err != nil {
		return nil, err
	}

	// Check if it's a Google Docs/Sheets/Slides file that needs export
	file, err := g.service.Files.Get(fileID).Fields("mimeType").Do()
	if err != nil {
		return nil, err
	}

	var resp *http.Response

	if strings.HasPrefix(file.MimeType, "application/vnd.google-apps.") {
		// Export Google Docs/Sheets/Slides
		exportMimeType := g.getExportMimeType(file.MimeType)
		resp, err = g.service.Files.Export(fileID, exportMimeType).Download()
	} else {
		// Download regular file
		resp, err = g.service.Files.Get(fileID).Download()
	}

	if err != nil {
		return nil, fmt.Errorf("unable to download file: %v", err)
	}

	return resp.Body, nil
}

// Write writes a file to Google Drive
func (g *GDriveStorage) Write(filePath string, data io.Reader) error {
	dir, fileName := path.Split(filePath)

	parentID, err := g.getOrCreatePath(dir)
	if err != nil {
		return err
	}

	// Check if file already exists
	existingID, _ := g.getFileID(filePath)

	// Read all data
	content, err := io.ReadAll(data)
	if err != nil {
		return err
	}

	if existingID != "" {
		// Update existing file
		_, err = g.service.Files.Update(existingID, &drive.File{
			Name: fileName,
		}).Media(strings.NewReader(string(content))).Do()
	} else {
		// Create new file
		_, err = g.service.Files.Create(&drive.File{
			Name:    fileName,
			Parents: []string{parentID},
		}).Media(strings.NewReader(string(content))).Do()
	}

	return err
}

// Delete deletes a file or folder
func (g *GDriveStorage) Delete(filePath string) error {
	fileID, err := g.getFileID(filePath)
	if err != nil {
		return err
	}

	// Move to trash instead of permanent delete
	_, err = g.service.Files.Update(fileID, &drive.File{
		Trashed: true,
	}).Do()

	if err != nil {
		return fmt.Errorf("unable to delete file: %v", err)
	}

	// Remove from cache
	delete(g.cache, filePath)

	return nil
}

// MkDir creates a directory
func (g *GDriveStorage) MkDir(dirPath string) error {
	parentDir, dirName := path.Split(dirPath)

	parentID, err := g.getOrCreatePath(parentDir)
	if err != nil {
		return err
	}

	_, err = g.service.Files.Create(&drive.File{
		Name:     dirName,
		MimeType: "application/vnd.google-apps.folder",
		Parents:  []string{parentID},
	}).Do()

	return err
}

// Move moves a file or folder
func (g *GDriveStorage) Move(src, dst string) error {
	fileID, err := g.getFileID(src)
	if err != nil {
		return err
	}

	// Get current parent
	file, err := g.service.Files.Get(fileID).Fields("parents").Do()
	if err != nil {
		return err
	}

	// Get new parent
	dstDir, dstName := path.Split(dst)
	newParentID, err := g.getOrCreatePath(dstDir)
	if err != nil {
		return err
	}

	// Update file with new parent and name
	_, err = g.service.Files.Update(fileID, &drive.File{
		Name: dstName,
	}).AddParents(newParentID).RemoveParents(strings.Join(file.Parents, ",")).Do()

	if err != nil {
		return fmt.Errorf("unable to move file: %v", err)
	}

	// Update cache
	delete(g.cache, src)

	return nil
}

// Copy copies a file
func (g *GDriveStorage) Copy(src, dst string, progress ProgressCallback) error {
	srcID, err := g.getFileID(src)
	if err != nil {
		return err
	}

	dstDir, dstName := path.Split(dst)
	dstParentID, err := g.getOrCreatePath(dstDir)
	if err != nil {
		return err
	}

	// Get source file info
	srcFile, err := g.service.Files.Get(srcID).Fields("size, mimeType").Do()
	if err != nil {
		return err
	}

	// Report progress
	if progress != nil {
		progress(0, srcFile.Size)
	}

	// Copy the file
	_, err = g.service.Files.Copy(srcID, &drive.File{
		Name:    dstName,
		Parents: []string{dstParentID},
	}).Do()

	if err != nil {
		return fmt.Errorf("unable to copy file: %v", err)
	}

	// Report completion
	if progress != nil {
		progress(srcFile.Size, srcFile.Size)
	}

	return nil
}

// GetType returns the storage type
func (g *GDriveStorage) GetType() string {
	return "gdrive"
}

// GetRootPath returns the root path
func (g *GDriveStorage) GetRootPath() string {
	return "/"
}

// GetAvailableSpace returns available and total space
func (g *GDriveStorage) GetAvailableSpace() (available, total int64, err error) {
	about, err := g.service.About.Get().Fields("storageQuota").Do()
	if err != nil {
		return 0, 0, err
	}

	if about.StorageQuota == nil {
		// Unlimited storage
		return -1, -1, nil
	}

	used := about.StorageQuota.Usage
	limit := about.StorageQuota.Limit

	if limit > 0 {
		available = limit - used
	} else {
		available = -1
	}

	return available, limit, nil
}

// IsValidPath checks if a path is valid
func (g *GDriveStorage) IsValidPath(filePath string) bool {
	// Google Drive doesn't have traditional path restrictions
	return !strings.Contains(filePath, "\x00")
}

// JoinPath joins path parts
func (g *GDriveStorage) JoinPath(parts ...string) string {
	return path.Join(parts...)
}

// ResolvePath resolves a path
func (g *GDriveStorage) ResolvePath(filePath string) string {
	return path.Clean(filePath)
}

// GetFileContent reads file content
func (g *GDriveStorage) GetFileContent(filePath string) ([]byte, error) {
	reader, err := g.Read(filePath)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := reader.Close(); err != nil {
			log.Printf("Error closing reader in GetFileContent: %v", err)
		}
	}()

	return io.ReadAll(reader)
}

// PutFileContent writes file content
func (g *GDriveStorage) PutFileContent(filePath string, content []byte) error {
	return g.Write(filePath, strings.NewReader(string(content)))
}

// Search searches for files
func (g *GDriveStorage) Search(query string, options map[string]interface{}) ([]FileInfo, error) {
	// Build search query
	driveQuery := fmt.Sprintf("name contains '%s' and trashed = false", query)

	if mimeType, ok := options["mimeType"].(string); ok {
		driveQuery += fmt.Sprintf(" and mimeType = '%s'", mimeType)
	}

	fileList, err := g.service.Files.List().
		Q(driveQuery).
		Fields("files(id, name, size, mimeType, modifiedTime, parents)").
		PageSize(100).
		Do()

	if err != nil {
		return nil, err
	}

	var results []FileInfo
	for _, f := range fileList.Files {
		isDir := f.MimeType == "application/vnd.google-apps.folder"

		results = append(results, FileInfo{
			Name:     f.Name,
			Size:     f.Size,
			IsDir:    isDir,
			ModTime:  parseGoogleTime(f.ModifiedTime),
			MimeType: f.MimeType,
		})
	}

	return results, nil
}

// Helper functions

func (g *GDriveStorage) getFileID(filePath string) (string, error) {
	if filePath == "/" || filePath == "" {
		return g.rootID, nil
	}

	// Check cache first
	if cached, ok := g.cache[filePath]; ok {
		return cached.Id, nil
	}

	// Walk the path from root
	parts := strings.Split(strings.TrimPrefix(filePath, "/"), "/")
	parentID := g.rootID

	for _, part := range parts {
		if part == "" {
			continue
		}

		query := fmt.Sprintf("name = '%s' and '%s' in parents and trashed = false", part, parentID)
		fileList, err := g.service.Files.List().
			Q(query).
			Fields("files(id)").
			PageSize(1).
			Do()

		if err != nil {
			return "", err
		}

		if len(fileList.Files) == 0 {
			return "", fmt.Errorf("file not found: %s", filePath)
		}

		parentID = fileList.Files[0].Id
	}

	return parentID, nil
}

func (g *GDriveStorage) getOrCreatePath(dirPath string) (string, error) {
	if dirPath == "/" || dirPath == "" {
		return g.rootID, nil
	}

	parts := strings.Split(strings.TrimPrefix(dirPath, "/"), "/")
	parentID := g.rootID

	for _, part := range parts {
		if part == "" {
			continue
		}

		// Check if folder exists
		query := fmt.Sprintf("name = '%s' and '%s' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false", part, parentID)
		fileList, err := g.service.Files.List().
			Q(query).
			Fields("files(id)").
			PageSize(1).
			Do()

		if err != nil {
			return "", err
		}

		if len(fileList.Files) == 0 {
			// Create folder
			folder, err := g.service.Files.Create(&drive.File{
				Name:     part,
				MimeType: "application/vnd.google-apps.folder",
				Parents:  []string{parentID},
			}).Do()

			if err != nil {
				return "", err
			}
			parentID = folder.Id
		} else {
			parentID = fileList.Files[0].Id
		}
	}

	return parentID, nil
}

func (g *GDriveStorage) getExportMimeType(googleMimeType string) string {
	switch googleMimeType {
	case "application/vnd.google-apps.document":
		return "application/pdf"
	case "application/vnd.google-apps.spreadsheet":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case "application/vnd.google-apps.presentation":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case "application/vnd.google-apps.drawing":
		return "image/png"
	default:
		return "application/pdf"
	}
}

func parseGoogleTime(timeStr string) time.Time {
	if timeStr == "" {
		return time.Time{}
	}

	t, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		return time.Time{}
	}

	return t
}

// GDriveAdapter adapts GDriveStorage to implement FileSystem interface
type GDriveAdapter struct {
	*GDriveStorage
}

// NewGDriveAdapter creates a new Google Drive adapter
func NewGDriveAdapter(clientID, clientSecret, refreshToken string) (FileSystem, error) {
	storage, err := NewGDriveFileSystem(clientID, clientSecret, refreshToken)
	if err != nil {
		return nil, err
	}
	return &GDriveAdapter{storage}, nil
}
