package api

import (
	"encoding/json"
	"net/http"

	"github.com/jacommander/jacommander/backend/security"
)

// HandleGetSecurityConfig returns the current security configuration
func (h *Handler) HandleGetSecurityConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	config := h.storage.GetSecurityConfig()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// HandleSetSecurityConfig updates the security configuration
func (h *Handler) HandleSetSecurityConfig(w http.ResponseWriter, r *http.Request) {
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
	json.NewEncoder(w).Encode(config)
}

// HandleValidateEndpoint validates if an endpoint can be connected to
func (h *Handler) HandleValidateEndpoint(w http.ResponseWriter, r *http.Request) {
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
	json.NewEncoder(w).Encode(response)
}
