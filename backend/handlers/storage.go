package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jacommander/jacommander/backend/storage"
)

// StorageHandler handles storage-related HTTP requests
type StorageHandler struct {
	manager *storage.CloudManager
}

// NewStorageHandler creates a new storage handler
func NewStorageHandler(manager *storage.CloudManager) *StorageHandler {
	return &StorageHandler{
		manager: manager,
	}
}

// ListStorages returns all available storage configurations
func (h *StorageHandler) ListStorages(w http.ResponseWriter, r *http.Request) {
	storages := h.manager.ListStorages()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(storages)
}

// AddStorage adds a new storage backend
func (h *StorageHandler) AddStorage(w http.ResponseWriter, r *http.Request) {
	var config storage.StorageConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.manager.AddStorage(config); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Storage added successfully",
	})
}

// RemoveStorage removes a storage backend
func (h *StorageHandler) RemoveStorage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	storageID := vars["id"]

	if err := h.manager.RemoveStorage(storageID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Storage removed successfully",
	})
}

// SetDefaultStorage sets a storage as the default
func (h *StorageHandler) SetDefaultStorage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	storageID := vars["id"]

	if err := h.manager.SetDefault(storageID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Default storage updated",
	})
}

// TransferFiles transfers files between storage backends
func (h *StorageHandler) TransferFiles(w http.ResponseWriter, r *http.Request) {
	var request struct {
		SourceStorage      string `json:"source_storage"`
		SourcePath         string `json:"source_path"`
		DestinationStorage string `json:"destination_storage"`
		DestinationPath    string `json:"destination_path"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// TODO: Add progress tracking via WebSocket
	err := h.manager.TransferBetweenStorages(
		request.SourceStorage,
		request.SourcePath,
		request.DestinationStorage,
		request.DestinationPath,
		nil, // Progress callback - can be enhanced with WebSocket
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Transfer completed successfully",
	})
}

// TestConnection tests a storage configuration
func (h *StorageHandler) TestConnection(w http.ResponseWriter, r *http.Request) {
	var config storage.StorageConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Try to create a storage backend with the given config
	var testResult struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Details string `json:"details,omitempty"`
	}

	// Create a temporary storage to test the connection
	switch config.Type {
	case "s3":
		bucket, _ := config.Config["bucket"].(string)
		region, _ := config.Config["region"].(string)
		prefix, _ := config.Config["prefix"].(string)
		accessKey, _ := config.Config["access_key"].(string)
		secretKey, _ := config.Config["secret_key"].(string)
		endpoint, _ := config.Config["endpoint"].(string)

		_, err := storage.NewS3FileSystem(bucket, region, prefix, accessKey, secretKey, endpoint)
		if err != nil {
			testResult.Success = false
			testResult.Message = "Connection failed"
			testResult.Details = err.Error()
		} else {
			testResult.Success = true
			testResult.Message = "Connection successful"
		}

	default:
		testResult.Success = false
		testResult.Message = "Unsupported storage type"
		testResult.Details = "Storage type " + config.Type + " is not supported"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testResult)
}
