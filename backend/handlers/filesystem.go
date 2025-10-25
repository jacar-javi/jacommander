package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/jacommander/jacommander/backend/storage"
)

// FileHandlers handles all file operation HTTP requests
type FileHandlers struct {
	storageManager *storage.Manager
}

// NewFileHandlers creates a new FileHandlers instance
func NewFileHandlers(manager *storage.Manager) *FileHandlers {
	return &FileHandlers{
		storageManager: manager,
	}
}

// ListStorages returns all available storage backends
func (h *FileHandlers) ListStorages(w http.ResponseWriter, r *http.Request) {
	storages := h.storageManager.GetAll()

	result := make([]map[string]interface{}, 0)
	for id, fs := range storages {
		available, total, _ := fs.GetAvailableSpace()

		result = append(result, map[string]interface{}{
			"id":        id,
			"type":      fs.GetType(),
			"root_path": fs.GetRootPath(),
			"available": available,
			"total":     total,
		})
	}

	successResponse(w, result)
}

// ListDirectory lists the contents of a directory
func (h *FileHandlers) ListDirectory(w http.ResponseWriter, r *http.Request) {
	// Get parameters
	storageID := r.URL.Query().Get("storage")
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "/"
	}

	// Get storage backend
	fs, ok := h.storageManager.Get(storageID)
	if !ok {
		errorResponse(w, "Storage not found", http.StatusNotFound)
		return
	}

	// List directory
	files, err := fs.List(path)
	if err != nil {
		errorResponse(w, fmt.Sprintf("Failed to list directory: %v", err), http.StatusInternalServerError)
		return
	}

	// Get space information
	available, total, _ := fs.GetAvailableSpace()

	successResponse(w, map[string]interface{}{
		"path":      path,
		"files":     files,
		"count":     len(files),
		"available": available,
		"total":     total,
	})
}

// CreateDirectory creates a new directory
func (h *FileHandlers) CreateDirectory(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		Storage string `json:"storage"`
		Path    string `json:"path"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get storage backend
	fs, ok := h.storageManager.Get(req.Storage)
	if !ok {
		errorResponse(w, "Storage not found", http.StatusNotFound)
		return
	}

	// Create directory
	if err := fs.MkDir(req.Path); err != nil {
		errorResponse(w, fmt.Sprintf("Failed to create directory: %v", err), http.StatusInternalServerError)
		return
	}

	successResponse(w, map[string]string{
		"message": "Directory created successfully",
		"path":    req.Path,
	})
}

// CopyFiles copies files from source to destination
func (h *FileHandlers) CopyFiles(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		SrcStorage string   `json:"src_storage"`
		DstStorage string   `json:"dst_storage"`
		Files      []string `json:"files"`
		SrcPath    string   `json:"src_path"`
		DstPath    string   `json:"dst_path"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get storage backends
	srcFS, ok := h.storageManager.Get(req.SrcStorage)
	if !ok {
		errorResponse(w, "Source storage not found", http.StatusNotFound)
		return
	}

	dstFS, ok := h.storageManager.Get(req.DstStorage)
	if !ok {
		errorResponse(w, "Destination storage not found", http.StatusNotFound)
		return
	}

	// If same storage backend, use native copy
	if req.SrcStorage == req.DstStorage {
		for _, file := range req.Files {
			srcPath := filepath.Join(req.SrcPath, file)
			dstPath := filepath.Join(req.DstPath, file)

			if err := srcFS.Copy(srcPath, dstPath, nil); err != nil {
				errorResponse(w, fmt.Sprintf("Failed to copy %s: %v", file, err), http.StatusInternalServerError)
				return
			}
		}
	} else {
		// Cross-storage copy: read from source, write to destination
		for _, file := range req.Files {
			srcPath := filepath.Join(req.SrcPath, file)
			dstPath := filepath.Join(req.DstPath, file)

			// Check if source is directory
			srcInfo, err := srcFS.Stat(srcPath)
			if err != nil {
				errorResponse(w, fmt.Sprintf("Failed to stat %s: %v", file, err), http.StatusInternalServerError)
				return
			}

			if srcInfo.IsDir {
				// For directories, we need recursive copy
				if err := h.copyDirectoryCrossStorage(srcFS, dstFS, srcPath, dstPath); err != nil {
					errorResponse(w, fmt.Sprintf("Failed to copy directory %s: %v", file, err), http.StatusInternalServerError)
					return
				}
			} else {
				// For files, simple read and write
				reader, err := srcFS.Read(srcPath)
				if err != nil {
					errorResponse(w, fmt.Sprintf("Failed to read %s: %v", file, err), http.StatusInternalServerError)
					return
				}
				defer reader.Close()

				if err := dstFS.Write(dstPath, reader); err != nil {
					errorResponse(w, fmt.Sprintf("Failed to write %s: %v", file, err), http.StatusInternalServerError)
					return
				}
			}
		}
	}

	successResponse(w, map[string]interface{}{
		"message": "Files copied successfully",
		"count":   len(req.Files),
	})
}

// copyDirectoryCrossStorage recursively copies a directory across different storage backends
func (h *FileHandlers) copyDirectoryCrossStorage(srcFS, dstFS storage.FileSystem, srcPath, dstPath string) error {
	// Create destination directory
	if err := dstFS.MkDir(dstPath); err != nil {
		return err
	}

	// List source directory
	files, err := srcFS.List(srcPath)
	if err != nil {
		return err
	}

	// Copy each item
	for _, file := range files {
		srcFilePath := filepath.Join(srcPath, file.Name)
		dstFilePath := filepath.Join(dstPath, file.Name)

		if file.IsDir {
			// Recursive copy for subdirectories
			if err := h.copyDirectoryCrossStorage(srcFS, dstFS, srcFilePath, dstFilePath); err != nil {
				return err
			}
		} else {
			// Copy file
			reader, err := srcFS.Read(srcFilePath)
			if err != nil {
				return err
			}
			defer reader.Close()

			if err := dstFS.Write(dstFilePath, reader); err != nil {
				return err
			}
		}
	}

	return nil
}

// MoveFiles moves files from source to destination
func (h *FileHandlers) MoveFiles(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		SrcStorage string   `json:"src_storage"`
		DstStorage string   `json:"dst_storage"`
		Files      []string `json:"files"`
		SrcPath    string   `json:"src_path"`
		DstPath    string   `json:"dst_path"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get storage backends
	srcFS, ok := h.storageManager.Get(req.SrcStorage)
	if !ok {
		errorResponse(w, "Source storage not found", http.StatusNotFound)
		return
	}

	dstFS, ok := h.storageManager.Get(req.DstStorage)
	if !ok {
		errorResponse(w, "Destination storage not found", http.StatusNotFound)
		return
	}

	// If same storage backend, use native move
	if req.SrcStorage == req.DstStorage {
		for _, file := range req.Files {
			srcPath := filepath.Join(req.SrcPath, file)
			dstPath := filepath.Join(req.DstPath, file)

			if err := srcFS.Move(srcPath, dstPath); err != nil {
				errorResponse(w, fmt.Sprintf("Failed to move %s: %v", file, err), http.StatusInternalServerError)
				return
			}
		}
	} else {
		// Cross-storage move: copy then delete
		// First copy all files
		for _, file := range req.Files {
			srcPath := filepath.Join(req.SrcPath, file)
			dstPath := filepath.Join(req.DstPath, file)

			// Check if source is directory
			srcInfo, err := srcFS.Stat(srcPath)
			if err != nil {
				errorResponse(w, fmt.Sprintf("Failed to stat %s: %v", file, err), http.StatusInternalServerError)
				return
			}

			if srcInfo.IsDir {
				// For directories, recursive copy
				if err := h.copyDirectoryCrossStorage(srcFS, dstFS, srcPath, dstPath); err != nil {
					errorResponse(w, fmt.Sprintf("Failed to copy directory %s: %v", file, err), http.StatusInternalServerError)
					return
				}
			} else {
				// For files, simple read and write
				reader, err := srcFS.Read(srcPath)
				if err != nil {
					errorResponse(w, fmt.Sprintf("Failed to read %s: %v", file, err), http.StatusInternalServerError)
					return
				}
				defer reader.Close()

				if err := dstFS.Write(dstPath, reader); err != nil {
					errorResponse(w, fmt.Sprintf("Failed to write %s: %v", file, err), http.StatusInternalServerError)
					return
				}
			}
		}

		// Then delete source files
		for _, file := range req.Files {
			srcPath := filepath.Join(req.SrcPath, file)
			if err := srcFS.Delete(srcPath); err != nil {
				// Log error but continue
				fmt.Printf("Warning: failed to delete source after move: %s: %v\n", srcPath, err)
			}
		}
	}

	successResponse(w, map[string]interface{}{
		"message": "Files moved successfully",
		"count":   len(req.Files),
	})
}

// DeleteFiles deletes files or directories
func (h *FileHandlers) DeleteFiles(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		Storage string   `json:"storage"`
		Files   []string `json:"files"`
		Path    string   `json:"path"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get storage backend
	fs, ok := h.storageManager.Get(req.Storage)
	if !ok {
		errorResponse(w, "Storage not found", http.StatusNotFound)
		return
	}

	// Delete each file
	var deleted []string
	var errors []string

	for _, file := range req.Files {
		fullPath := filepath.Join(req.Path, file)
		if err := fs.Delete(fullPath); err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", file, err))
		} else {
			deleted = append(deleted, file)
		}
	}

	if len(errors) > 0 {
		errorResponse(w, fmt.Sprintf("Some files could not be deleted: %s", strings.Join(errors, ", ")), http.StatusPartialContent)
		return
	}

	successResponse(w, map[string]interface{}{
		"message": "Files deleted successfully",
		"deleted": deleted,
		"count":   len(deleted),
	})
}

// DownloadFile handles file downloads
func (h *FileHandlers) DownloadFile(w http.ResponseWriter, r *http.Request) {
	// Get parameters
	storageID := r.URL.Query().Get("storage")
	path := r.URL.Query().Get("path")

	// Get storage backend
	fs, ok := h.storageManager.Get(storageID)
	if !ok {
		errorResponse(w, "Storage not found", http.StatusNotFound)
		return
	}

	// Get file info
	info, err := fs.Stat(path)
	if err != nil {
		errorResponse(w, "File not found", http.StatusNotFound)
		return
	}

	if info.IsDir {
		errorResponse(w, "Cannot download a directory", http.StatusBadRequest)
		return
	}

	// Open file for reading
	reader, err := fs.Read(path)
	if err != nil {
		errorResponse(w, fmt.Sprintf("Failed to read file: %v", err), http.StatusInternalServerError)
		return
	}
	defer reader.Close()

	// Set headers
	w.Header().Set("Content-Type", info.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", info.Name))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", info.Size))

	// Stream the file
	if _, err := io.Copy(w, reader); err != nil {
		// Log error, but response is already being written
		fmt.Printf("Error streaming file: %v\n", err)
	}
}

// UploadFile handles file uploads
func (h *FileHandlers) UploadFile(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	err := r.ParseMultipartForm(100 << 20) // 100 MB max memory
	if err != nil {
		errorResponse(w, "Failed to parse upload form", http.StatusBadRequest)
		return
	}

	storageID := r.FormValue("storage")
	path := r.FormValue("path")

	// Get storage backend
	fs, ok := h.storageManager.Get(storageID)
	if !ok {
		errorResponse(w, "Storage not found", http.StatusNotFound)
		return
	}

	// Get the file from form
	file, header, err := r.FormFile("file")
	if err != nil {
		errorResponse(w, "No file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Construct full path
	fullPath := filepath.Join(path, header.Filename)

	// Write file
	if err := fs.Write(fullPath, file); err != nil {
		errorResponse(w, fmt.Sprintf("Failed to save file: %v", err), http.StatusInternalServerError)
		return
	}

	successResponse(w, map[string]interface{}{
		"message":  "File uploaded successfully",
		"filename": header.Filename,
		"size":     header.Size,
		"path":     fullPath,
	})
}

// Helper functions for responses
func successResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
	})
}

func errorResponse(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error": map[string]string{
			"message": message,
		},
	})
}
