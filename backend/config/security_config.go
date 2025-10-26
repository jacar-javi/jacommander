package config

import (
	"encoding/json"
	"log"
	"os"
	"sync"
)

// SecurityConfig holds security-related configuration
type SecurityConfig struct {
	AllowLocalIPs bool `json:"allowLocalIPs"`
	mu            sync.RWMutex
	configPath    string
}

// NewSecurityConfig creates a new security configuration
func NewSecurityConfig() *SecurityConfig {
	cfg := &SecurityConfig{
		AllowLocalIPs: false, // Default to blocking local IPs for security
		configPath:    "/data/security-config.json",
	}

	// Load existing configuration
	if err := cfg.Load(); err != nil {
		log.Printf("Warning: Failed to load security config: %v", err)
	}

	return cfg
}

// Load reads configuration from file
func (sc *SecurityConfig) Load() error {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	// Check if config file exists
	if _, err := os.Stat(sc.configPath); os.IsNotExist(err) {
		// Create default config
		return sc.save()
	}

	// Read config file
	data, err := os.ReadFile(sc.configPath)
	if err != nil {
		return err
	}

	// Parse JSON
	return json.Unmarshal(data, sc)
}

// Save writes configuration to file
func (sc *SecurityConfig) save() error {
	// Ensure directory exists
	if err := os.MkdirAll("/data", 0755); err != nil {
		log.Printf("Warning: Failed to create data directory: %v", err)
	}

	// Marshal to JSON
	data, err := json.MarshalIndent(sc, "", "  ")
	if err != nil {
		return err
	}

	// Write to file
	return os.WriteFile(sc.configPath, data, 0644)
}

// GetAllowLocalIPs returns whether local IPs are allowed
func (sc *SecurityConfig) GetAllowLocalIPs() bool {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	return sc.AllowLocalIPs
}

// SetAllowLocalIPs updates the local IP permission
func (sc *SecurityConfig) SetAllowLocalIPs(allow bool) error {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	sc.AllowLocalIPs = allow
	return sc.save()
}

// Toggle switches the local IP permission
func (sc *SecurityConfig) Toggle() error {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	sc.AllowLocalIPs = !sc.AllowLocalIPs
	return sc.save()
}
