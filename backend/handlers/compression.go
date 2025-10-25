package handlers

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jacommander/jacommander/backend/storage"
)

// CompressionHandler handles compression and decompression operations
type CompressionHandler struct {
	storageManager *storage.Manager
	wsHandler      *WebSocketHandler
}

// NewCompressionHandler creates a new compression handler
func NewCompressionHandler(manager *storage.Manager) *CompressionHandler {
	return &CompressionHandler{
		storageManager: manager,
	}
}

// SetWebSocketHandler sets the WebSocket handler for progress updates
func (ch *CompressionHandler) SetWebSocketHandler(ws *WebSocketHandler) {
	ch.wsHandler = ws
}

// CompressRequest represents a compression request
type CompressRequest struct {
	Storage    string   `json:"storage"`
	Files      []string `json:"files"`
	BasePath   string   `json:"base_path"`
	OutputPath string   `json:"output_path"`
	Format     string   `json:"format"` // zip, tar, tar.gz, tar.bz2
}

// DecompressRequest represents a decompression request
type DecompressRequest struct {
	Storage      string `json:"storage"`
	ArchivePath  string `json:"archive_path"`
	OutputPath   string `json:"output_path"`
	CreateFolder bool   `json:"create_folder"`
}

// Compress handles compression requests
func (ch *CompressionHandler) Compress(w http.ResponseWriter, r *http.Request) {
	var req CompressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get storage backend
	fs, ok := ch.storageManager.Get(req.Storage)
	if !ok {
		errorResponse(w, "Storage not found", http.StatusNotFound)
		return
	}

	// Generate operation ID for progress tracking
	operationID := fmt.Sprintf("compress-%d", time.Now().UnixNano())

	// Start compression in background
	go ch.performCompression(fs, req, operationID)

	successResponse(w, map[string]interface{}{
		"message":      "Compression started",
		"operation_id": operationID,
		"output_path":  req.OutputPath,
	})
}

// Decompress handles decompression requests
func (ch *CompressionHandler) Decompress(w http.ResponseWriter, r *http.Request) {
	var req DecompressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get storage backend
	fs, ok := ch.storageManager.Get(req.Storage)
	if !ok {
		errorResponse(w, "Storage not found", http.StatusNotFound)
		return
	}

	// Generate operation ID for progress tracking
	operationID := fmt.Sprintf("decompress-%d", time.Now().UnixNano())

	// Start decompression in background
	go ch.performDecompression(fs, req, operationID)

	successResponse(w, map[string]interface{}{
		"message":      "Decompression started",
		"operation_id": operationID,
		"output_path":  req.OutputPath,
	})
}

// performCompression performs the actual compression
func (ch *CompressionHandler) performCompression(fs storage.FileSystem, req CompressRequest, operationID string) {
	// Create progress tracker if WebSocket handler is available
	var tracker *ProgressTracker
	if ch.wsHandler != nil {
		// Calculate total size for progress tracking
		totalSize := ch.calculateTotalSize(fs, req.Files, req.BasePath)
		tracker = NewProgressTracker(ch.wsHandler, operationID, "compress", totalSize)
	}

	// Create temporary file for archive
	tmpFile, err := os.CreateTemp("", "archive-*.tmp")
	if err != nil {
		if tracker != nil {
			tracker.Error(err)
		}
		return
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	// Perform compression based on format
	switch strings.ToLower(req.Format) {
	case "zip":
		err = ch.createZipArchive(fs, tmpFile, req.Files, req.BasePath, tracker)
	case "tar":
		err = ch.createTarArchive(fs, tmpFile, req.Files, req.BasePath, false, tracker)
	case "tar.gz", "tgz":
		err = ch.createTarArchive(fs, tmpFile, req.Files, req.BasePath, true, tracker)
	default:
		err = fmt.Errorf("unsupported format: %s", req.Format)
	}

	if err != nil {
		if tracker != nil {
			tracker.Error(err)
		}
		return
	}

	// Seek to beginning of temp file
	tmpFile.Seek(0, 0)

	// Write the archive to the storage
	if err := fs.Write(req.OutputPath, tmpFile); err != nil {
		if tracker != nil {
			tracker.Error(err)
		}
		return
	}

	// Mark as complete
	if tracker != nil {
		tracker.Complete()
	}

	// Send notification
	if ch.wsHandler != nil {
		ch.wsHandler.SendNotification(fmt.Sprintf("Compression completed: %s", req.OutputPath))
	}
}

// createZipArchive creates a ZIP archive
func (ch *CompressionHandler) createZipArchive(fs storage.FileSystem, output io.Writer, files []string, basePath string, tracker *ProgressTracker) error {
	zipWriter := zip.NewWriter(output)
	defer zipWriter.Close()

	var currentSize int64

	for _, file := range files {
		fullPath := filepath.Join(basePath, file)

		// Get file info
		info, err := fs.Stat(fullPath)
		if err != nil {
			return fmt.Errorf("failed to stat %s: %w", file, err)
		}

		if info.IsDir {
			// Add directory recursively
			err = ch.addDirectoryToZip(fs, zipWriter, fullPath, file, &currentSize, tracker)
		} else {
			// Add single file
			err = ch.addFileToZip(fs, zipWriter, fullPath, file, &currentSize, tracker)
		}

		if err != nil {
			return err
		}
	}

	return nil
}

// addFileToZip adds a single file to a ZIP archive
func (ch *CompressionHandler) addFileToZip(fs storage.FileSystem, zipWriter *zip.Writer, fullPath, archivePath string, currentSize *int64, tracker *ProgressTracker) error {
	// Get file info
	info, err := fs.Stat(fullPath)
	if err != nil {
		return err
	}

	// Create ZIP header
	header, err := zip.FileInfoHeader(fileInfoToOS(info))
	if err != nil {
		return err
	}
	header.Name = archivePath
	header.Method = zip.Deflate

	// Create writer for file
	writer, err := zipWriter.CreateHeader(header)
	if err != nil {
		return err
	}

	// Open and copy file
	reader, err := fs.Read(fullPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	// Copy with progress tracking
	if tracker != nil {
		written, err := ch.copyWithProgress(writer, reader, currentSize, tracker)
		*currentSize += written
		return err
	}

	_, err = io.Copy(writer, reader)
	return err
}

// addDirectoryToZip recursively adds a directory to a ZIP archive
func (ch *CompressionHandler) addDirectoryToZip(fs storage.FileSystem, zipWriter *zip.Writer, dirPath, archivePath string, currentSize *int64, tracker *ProgressTracker) error {
	// List directory contents
	files, err := fs.List(dirPath)
	if err != nil {
		return err
	}

	// Add each file/subdirectory
	for _, file := range files {
		fullPath := filepath.Join(dirPath, file.Name)
		archiveFilePath := filepath.Join(archivePath, file.Name)

		if file.IsDir {
			err = ch.addDirectoryToZip(fs, zipWriter, fullPath, archiveFilePath, currentSize, tracker)
		} else {
			err = ch.addFileToZip(fs, zipWriter, fullPath, archiveFilePath, currentSize, tracker)
		}

		if err != nil {
			return err
		}
	}

	return nil
}

// createTarArchive creates a TAR archive (optionally gzipped)
func (ch *CompressionHandler) createTarArchive(fs storage.FileSystem, output io.Writer, files []string, basePath string, compress bool, tracker *ProgressTracker) error {
	var tarWriter *tar.Writer

	if compress {
		// Create gzip writer
		gzWriter := gzip.NewWriter(output)
		defer gzWriter.Close()
		tarWriter = tar.NewWriter(gzWriter)
	} else {
		tarWriter = tar.NewWriter(output)
	}
	defer tarWriter.Close()

	var currentSize int64

	for _, file := range files {
		fullPath := filepath.Join(basePath, file)

		// Get file info
		info, err := fs.Stat(fullPath)
		if err != nil {
			return fmt.Errorf("failed to stat %s: %w", file, err)
		}

		if info.IsDir {
			// Add directory recursively
			err = ch.addDirectoryToTar(fs, tarWriter, fullPath, file, &currentSize, tracker)
		} else {
			// Add single file
			err = ch.addFileToTar(fs, tarWriter, fullPath, file, &currentSize, tracker)
		}

		if err != nil {
			return err
		}
	}

	return nil
}

// addFileToTar adds a single file to a TAR archive
func (ch *CompressionHandler) addFileToTar(fs storage.FileSystem, tarWriter *tar.Writer, fullPath, archivePath string, currentSize *int64, tracker *ProgressTracker) error {
	// Get file info
	info, err := fs.Stat(fullPath)
	if err != nil {
		return err
	}

	// Create TAR header
	header := &tar.Header{
		Name:    archivePath,
		Size:    info.Size,
		Mode:    0644,
		ModTime: info.ModTime,
	}

	// Write header
	if err := tarWriter.WriteHeader(header); err != nil {
		return err
	}

	// Open and copy file
	reader, err := fs.Read(fullPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	// Copy with progress tracking
	if tracker != nil {
		written, err := ch.copyWithProgress(tarWriter, reader, currentSize, tracker)
		*currentSize += written
		return err
	}

	_, err = io.Copy(tarWriter, reader)
	return err
}

// addDirectoryToTar recursively adds a directory to a TAR archive
func (ch *CompressionHandler) addDirectoryToTar(fs storage.FileSystem, tarWriter *tar.Writer, dirPath, archivePath string, currentSize *int64, tracker *ProgressTracker) error {
	// List directory contents
	files, err := fs.List(dirPath)
	if err != nil {
		return err
	}

	// Add directory header
	header := &tar.Header{
		Name:     archivePath + "/",
		Mode:     0755,
		Typeflag: tar.TypeDir,
		ModTime:  time.Now(),
	}
	if err := tarWriter.WriteHeader(header); err != nil {
		return err
	}

	// Add each file/subdirectory
	for _, file := range files {
		fullPath := filepath.Join(dirPath, file.Name)
		archiveFilePath := filepath.Join(archivePath, file.Name)

		if file.IsDir {
			err = ch.addDirectoryToTar(fs, tarWriter, fullPath, archiveFilePath, currentSize, tracker)
		} else {
			err = ch.addFileToTar(fs, tarWriter, fullPath, archiveFilePath, currentSize, tracker)
		}

		if err != nil {
			return err
		}
	}

	return nil
}

// performDecompression performs the actual decompression
func (ch *CompressionHandler) performDecompression(fs storage.FileSystem, req DecompressRequest, operationID string) {
	// Create progress tracker if WebSocket handler is available
	var tracker *ProgressTracker
	if ch.wsHandler != nil {
		// Get archive size for progress tracking
		info, _ := fs.Stat(req.ArchivePath)
		tracker = NewProgressTracker(ch.wsHandler, operationID, "decompress", info.Size)
	}

	// Open archive file
	reader, err := fs.Read(req.ArchivePath)
	if err != nil {
		if tracker != nil {
			tracker.Error(err)
		}
		return
	}
	defer reader.Close()

	// Determine archive format by extension
	ext := strings.ToLower(filepath.Ext(req.ArchivePath))

	// Create output directory if needed
	outputPath := req.OutputPath
	if req.CreateFolder {
		// Create a folder with the archive name (without extension)
		baseName := strings.TrimSuffix(filepath.Base(req.ArchivePath), ext)
		outputPath = filepath.Join(outputPath, baseName)
		fs.MkDir(outputPath)
	}

	// Perform extraction based on format
	switch ext {
	case ".zip":
		err = ch.extractZipArchive(fs, reader, outputPath, tracker)
	case ".tar":
		err = ch.extractTarArchive(fs, reader, outputPath, false, tracker)
	case ".gz", ".tgz":
		if strings.HasSuffix(strings.ToLower(req.ArchivePath), ".tar.gz") || ext == ".tgz" {
			err = ch.extractTarArchive(fs, reader, outputPath, true, tracker)
		} else {
			err = fmt.Errorf("unsupported format: %s", ext)
		}
	default:
		err = fmt.Errorf("unsupported format: %s", ext)
	}

	if err != nil {
		if tracker != nil {
			tracker.Error(err)
		}
		return
	}

	// Mark as complete
	if tracker != nil {
		tracker.Complete()
	}

	// Send notification
	if ch.wsHandler != nil {
		ch.wsHandler.SendNotification(fmt.Sprintf("Decompression completed: %s", outputPath))
	}
}

// extractZipArchive extracts a ZIP archive
func (ch *CompressionHandler) extractZipArchive(fs storage.FileSystem, reader io.Reader, outputPath string, tracker *ProgressTracker) error {
	// ZIP extraction requires seeking, so we need to copy to a temporary file first
	tmpFile, err := os.CreateTemp("", "extract-*.zip")
	if err != nil {
		return err
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	// Copy archive to temp file
	if _, err := io.Copy(tmpFile, reader); err != nil {
		return err
	}

	// Open as ZIP
	zipReader, err := zip.OpenReader(tmpFile.Name())
	if err != nil {
		return err
	}
	defer zipReader.Close()

	var currentSize int64

	// Extract each file
	for _, file := range zipReader.File {
		filePath := filepath.Join(outputPath, file.Name)

		if file.FileInfo().IsDir() {
			// Create directory
			fs.MkDir(filePath)
			continue
		}

		// Create parent directory if needed
		fs.MkDir(filepath.Dir(filePath))

		// Open file in archive
		rc, err := file.Open()
		if err != nil {
			return err
		}

		// Write file to storage
		if tracker != nil {
			// Create temp buffer for progress tracking
			tmpOut, _ := os.CreateTemp("", "extract-file-*.tmp")
			written, err := ch.copyWithProgress(tmpOut, rc, &currentSize, tracker)
			currentSize += written
			tmpOut.Seek(0, 0)
			fs.Write(filePath, tmpOut)
			tmpOut.Close()
			os.Remove(tmpOut.Name())
			if err != nil {
				rc.Close()
				return err
			}
		} else {
			err = fs.Write(filePath, rc)
		}

		rc.Close()
		if err != nil {
			return err
		}
	}

	return nil
}

// extractTarArchive extracts a TAR archive (optionally gzipped)
func (ch *CompressionHandler) extractTarArchive(fs storage.FileSystem, reader io.Reader, outputPath string, compressed bool, tracker *ProgressTracker) error {
	var tarReader *tar.Reader

	if compressed {
		// Create gzip reader
		gzReader, err := gzip.NewReader(reader)
		if err != nil {
			return err
		}
		defer gzReader.Close()
		tarReader = tar.NewReader(gzReader)
	} else {
		tarReader = tar.NewReader(reader)
	}

	var currentSize int64

	// Extract each file
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		filePath := filepath.Join(outputPath, header.Name)

		switch header.Typeflag {
		case tar.TypeDir:
			// Create directory
			fs.MkDir(filePath)

		case tar.TypeReg:
			// Create parent directory if needed
			fs.MkDir(filepath.Dir(filePath))

			// Write file to storage
			if tracker != nil {
				// Create temp buffer for progress tracking
				tmpOut, _ := os.CreateTemp("", "extract-file-*.tmp")
				written, err := ch.copyWithProgress(tmpOut, tarReader, &currentSize, tracker)
				currentSize += written
				tmpOut.Seek(0, 0)
				fs.Write(filePath, tmpOut)
				tmpOut.Close()
				os.Remove(tmpOut.Name())
				if err != nil {
					return err
				}
			} else {
				err = fs.Write(filePath, tarReader)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// copyWithProgress copies data with progress tracking
func (ch *CompressionHandler) copyWithProgress(dst io.Writer, src io.Reader, currentSize *int64, tracker *ProgressTracker) (int64, error) {
	buf := make([]byte, 32*1024) // 32KB buffer
	var written int64

	for {
		n, err := src.Read(buf)
		if n > 0 {
			if _, writeErr := dst.Write(buf[:n]); writeErr != nil {
				return written, writeErr
			}
			written += int64(n)
			*currentSize += int64(n)
			if tracker != nil {
				tracker.Update(*currentSize)
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return written, err
		}
	}

	return written, nil
}

// calculateTotalSize calculates the total size of files to be compressed
func (ch *CompressionHandler) calculateTotalSize(fs storage.FileSystem, files []string, basePath string) int64 {
	var totalSize int64

	for _, file := range files {
		fullPath := filepath.Join(basePath, file)
		size := ch.getFileOrDirSize(fs, fullPath)
		totalSize += size
	}

	return totalSize
}

// getFileOrDirSize gets the size of a file or directory (recursive)
func (ch *CompressionHandler) getFileOrDirSize(fs storage.FileSystem, path string) int64 {
	info, err := fs.Stat(path)
	if err != nil {
		return 0
	}

	if !info.IsDir {
		return info.Size
	}

	// For directories, calculate size recursively
	var size int64
	files, err := fs.List(path)
	if err != nil {
		return 0
	}

	for _, file := range files {
		fullPath := filepath.Join(path, file.Name)
		size += ch.getFileOrDirSize(fs, fullPath)
	}

	return size
}

// fileInfoToOS converts our FileInfo to os.FileInfo for ZIP
func fileInfoToOS(info storage.FileInfo) os.FileInfo {
	return &osFileInfo{
		name:    info.Name,
		size:    info.Size,
		modTime: info.ModTime,
		isDir:   info.IsDir,
	}
}

// osFileInfo implements os.FileInfo
type osFileInfo struct {
	name    string
	size    int64
	modTime time.Time
	isDir   bool
}

func (fi *osFileInfo) Name() string { return fi.name }
func (fi *osFileInfo) Size() int64  { return fi.size }
func (fi *osFileInfo) Mode() os.FileMode {
	if fi.isDir {
		return os.ModeDir | 0755
	}
	return 0644
}
func (fi *osFileInfo) ModTime() time.Time { return fi.modTime }
func (fi *osFileInfo) IsDir() bool        { return fi.isDir }
func (fi *osFileInfo) Sys() interface{}   { return nil }
