package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jacommander/jacommander/backend/security"
	"github.com/jacommander/jacommander/backend/storage"
)

// SecurityHandler manages security-related operations
type SecurityHandler struct {
	storage *storage.CloudManager
}

// NewSecurityHandler creates a new security handler
func NewSecurityHandler(storage *storage.CloudManager) *SecurityHandler {
	return &SecurityHandler{
		storage: storage,
	}
}

// GetSecurityConfig returns the current security configuration
func (h *SecurityHandler) GetSecurityConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	config := h.storage.GetSecurityConfig()

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(config); err != nil {
		log.Printf("Error encoding config response: %v", err)
	}
}

// SetSecurityConfig updates the security configuration
func (h *SecurityHandler) SetSecurityConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		AllowLocalIPs bool `json:"allowLocalIPs"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.storage.SetAllowLocalIPs(req.AllowLocalIPs); err != nil {
		http.Error(w, "Failed to update security configuration: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return updated configuration
	config := h.storage.GetSecurityConfig()
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(config); err != nil {
		log.Printf("Error encoding config response: %v", err)
	}
}

// ValidateEndpoint validates if an endpoint can be connected to
func (h *SecurityHandler) ValidateEndpoint(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Endpoint string `json:"endpoint"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create a temporary validator to check the endpoint
	config := h.storage.GetSecurityConfig()
	allowLocal := config["allowLocalIPs"].(bool)

	validator := security.NewIPValidator(allowLocal)
	err := validator.ValidateEndpoint(req.Endpoint)

	response := map[string]interface{}{
		"endpoint": req.Endpoint,
		"valid":    err == nil,
	}

	if err != nil {
		response["error"] = err.Error()
		response["blockedRanges"] = validator.GetBlockedRanges()
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding validation response: %v", err)
	}
}
