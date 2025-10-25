package security

import (
	"errors"
	"fmt"
	"net"
	"net/url"
	"strings"
)

var (
	ErrLocalIPBlocked = errors.New("connection to local IP address is blocked by security policy")
	ErrInvalidAddress = errors.New("invalid address format")
)

// IPValidator handles IP address validation and security checks
type IPValidator struct {
	AllowLocalIPs bool
}

// NewIPValidator creates a new IP validator instance
func NewIPValidator(allowLocal bool) *IPValidator {
	return &IPValidator{
		AllowLocalIPs: allowLocal,
	}
}

// ValidateEndpoint validates an endpoint URL or address
func (v *IPValidator) ValidateEndpoint(endpoint string) error {
	// Extract host from endpoint
	host, err := v.extractHost(endpoint)
	if err != nil {
		return fmt.Errorf("failed to extract host: %w", err)
	}

	// Check if it's an IP address or hostname
	ip := net.ParseIP(host)
	if ip == nil {
		// It's a hostname, resolve it
		ips, err := net.LookupIP(host)
		if err != nil {
			return fmt.Errorf("failed to resolve hostname %s: %w", host, err)
		}

		// Check all resolved IPs
		for _, resolvedIP := range ips {
			if err := v.ValidateIP(resolvedIP.String()); err != nil {
				return err
			}
		}
	} else {
		// It's already an IP, validate it
		if err := v.ValidateIP(ip.String()); err != nil {
			return err
		}
	}

	return nil
}

// ValidateIP checks if an IP address is allowed based on security policy
func (v *IPValidator) ValidateIP(ipStr string) error {
	if v.AllowLocalIPs {
		// All IPs are allowed
		return nil
	}

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return ErrInvalidAddress
	}

	// Check for local/private IP ranges
	if v.isLocalIP(ip) {
		return ErrLocalIPBlocked
	}

	return nil
}

// isLocalIP checks if an IP is in a local/private range
func (v *IPValidator) isLocalIP(ip net.IP) bool {
	// Define private IP ranges
	privateRanges := []string{
		"10.0.0.0/8",     // Class A private
		"172.16.0.0/12",  // Class B private
		"192.168.0.0/16", // Class C private
		"127.0.0.0/8",    // Loopback
		"169.254.0.0/16", // Link-local
		"::1/128",        // IPv6 loopback
		"fe80::/10",      // IPv6 link-local
		"fc00::/7",       // IPv6 unique local
	}

	for _, rangeStr := range privateRanges {
		_, network, err := net.ParseCIDR(rangeStr)
		if err != nil {
			continue
		}

		if network.Contains(ip) {
			return true
		}
	}

	// Check for localhost
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return true
	}

	// Check for private IP
	if ip.IsPrivate() {
		return true
	}

	return false
}

// extractHost extracts the host from various formats
func (v *IPValidator) extractHost(endpoint string) (string, error) {
	// Try to parse as URL
	if strings.Contains(endpoint, "://") {
		u, err := url.Parse(endpoint)
		if err != nil {
			return "", err
		}

		// Extract hostname without port
		host := u.Hostname()
		if host == "" {
			return "", ErrInvalidAddress
		}
		return host, nil
	}

	// Handle host:port format
	if strings.Contains(endpoint, ":") {
		host, _, err := net.SplitHostPort(endpoint)
		if err != nil {
			// Might be IPv6 without port
			return endpoint, nil
		}
		return host, nil
	}

	// Plain hostname or IP
	return endpoint, nil
}

// GetBlockedRanges returns a list of blocked IP ranges for display
func (v *IPValidator) GetBlockedRanges() []string {
	if v.AllowLocalIPs {
		return []string{}
	}

	return []string{
		"10.0.0.0/8 (Private Class A)",
		"172.16.0.0/12 (Private Class B)",
		"192.168.0.0/16 (Private Class C)",
		"127.0.0.0/8 (Loopback)",
		"169.254.0.0/16 (Link-local)",
		"::1 (IPv6 Loopback)",
		"fe80::/10 (IPv6 Link-local)",
		"fc00::/7 (IPv6 Unique local)",
	}
}
