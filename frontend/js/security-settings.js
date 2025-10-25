// security-settings.js - Local IP connection security management
export class SecuritySettings {
    constructor(app) {
        this.app = app;
        this.allowLocalIPs = false; // Default to blocking
        this.blockedRanges = [];
        this.modal = null;
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/security/config');
            if (response.ok) {
                const config = await response.json();
                this.allowLocalIPs = config.allowLocalIPs || false;
                this.blockedRanges = config.blockedRanges || [];
            }
        } catch (error) {
            console.error('Failed to load security configuration:', error);
        }
    }

    async saveConfig(allowLocalIPs) {
        try {
            const response = await fetch('/api/security/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    allowLocalIPs: allowLocalIPs
                })
            });

            if (response.ok) {
                const config = await response.json();
                this.allowLocalIPs = config.allowLocalIPs || false;
                this.blockedRanges = config.blockedRanges || [];
                this.app.showNotification(
                    allowLocalIPs ? 'Local IP connections enabled' : 'Local IP connections blocked',
                    'success'
                );
                return true;
            }
        } catch (error) {
            console.error('Failed to save security configuration:', error);
            this.app.showNotification('Failed to update security settings', 'error');
        }
        return false;
    }

    async validateEndpoint(endpoint) {
        try {
            const response = await fetch('/api/security/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ endpoint })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to validate endpoint:', error);
        }
        return { valid: false, error: 'Validation failed' };
    }

    showSettingsModal() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal security-settings-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🔒 Security Settings</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="security-section">
                            <h3>Local IP Connection Policy</h3>
                            <p class="security-description">
                                Control whether JaCommander can connect to local/private IP addresses.
                                When disabled, connections to local infrastructure are blocked for security.
                            </p>

                            <div class="security-toggle-container">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="allow-local-ips" ${this.allowLocalIPs ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                                <span class="toggle-label">
                                    ${this.allowLocalIPs ? '✅ Local IPs Allowed' : '🚫 Local IPs Blocked'}
                                </span>
                            </div>

                            <div class="security-status">
                                <h4>Current Status:</h4>
                                <div class="status-indicator ${this.allowLocalIPs ? 'allowed' : 'blocked'}">
                                    ${
    this.allowLocalIPs
        ? '⚠️ Connections to local IP addresses are ALLOWED'
        : '✓ Connections to local IP addresses are BLOCKED'
}
                                </div>
                            </div>

                            <div class="blocked-ranges">
                                <h4>Blocked IP Ranges (when disabled):</h4>
                                <ul class="ip-ranges-list">
                                    ${this.blockedRanges.map((range) => `<li><code>${range}</code></li>`).join('')}
                                </ul>
                            </div>

                            <div class="endpoint-validator">
                                <h4>Test Endpoint:</h4>
                                <div class="validator-input">
                                    <input type="text" id="test-endpoint" placeholder="Enter URL or IP address">
                                    <button id="validate-btn" class="btn-primary">Validate</button>
                                </div>
                                <div id="validation-result"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="cancel-btn">Cancel</button>
                        <button class="btn-primary" id="apply-btn">Apply Settings</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        this.modal = modalContainer.querySelector('.modal');

        // Bind events
        this.bindModalEvents();

        // Show modal
        setTimeout(() => this.modal.classList.add('show'), 10);
    }

    bindModalEvents() {
        const toggle = this.modal.querySelector('#allow-local-ips');
        const toggleLabel = this.modal.querySelector('.toggle-label');
        const statusIndicator = this.modal.querySelector('.status-indicator');
        const validateBtn = this.modal.querySelector('#validate-btn');
        const applyBtn = this.modal.querySelector('#apply-btn');
        const cancelBtn = this.modal.querySelector('#cancel-btn');
        const closeBtn = this.modal.querySelector('.modal-close');

        // Toggle change
        toggle.addEventListener('change', (e) => {
            const allowed = e.target.checked;
            toggleLabel.textContent = allowed ? '✅ Local IPs Allowed' : '🚫 Local IPs Blocked';

            statusIndicator.className = `status-indicator ${allowed ? 'allowed' : 'blocked'}`;
            statusIndicator.textContent = allowed
                ? '⚠️ Connections to local IP addresses are ALLOWED'
                : '✓ Connections to local IP addresses are BLOCKED';
        });

        // Validate endpoint
        validateBtn.addEventListener('click', async () => {
            const endpoint = this.modal.querySelector('#test-endpoint').value;
            const resultDiv = this.modal.querySelector('#validation-result');

            if (!endpoint) {
                resultDiv.innerHTML = '<div class="validation-error">Please enter an endpoint</div>';
                return;
            }

            resultDiv.innerHTML = '<div class="validation-loading">Validating...</div>';

            const result = await this.validateEndpoint(endpoint);

            if (result.valid) {
                resultDiv.innerHTML = `
                    <div class="validation-success">
                        ✓ Connection allowed to: <code>${endpoint}</code>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="validation-blocked">
                        🚫 Connection blocked: <code>${endpoint}</code>
                        <br><small>${result.error || 'Blocked by security policy'}</small>
                    </div>
                `;
            }
        });

        // Apply settings
        applyBtn.addEventListener('click', async () => {
            const newValue = toggle.checked;
            const success = await this.saveConfig(newValue);
            if (success) {
                this.closeModal();
            }
        });

        // Cancel/Close
        const closeModal = () => this.closeModal();
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                closeModal();
            }
        });
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                this.modal.parentElement.remove();
                this.modal = null;
            }, 300);
        }
    }

    // Add menu item to settings
    addSettingsMenuItem() {
        const settingsMenu = document.querySelector('.settings-menu');
        if (settingsMenu) {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.innerHTML = '🔒 Security Settings';
            menuItem.addEventListener('click', () => this.showSettingsModal());
            settingsMenu.appendChild(menuItem);
        }
    }

    // Get current security status for display
    getStatusBadge() {
        if (this.allowLocalIPs) {
            return '<span class="security-badge warning">⚠️ Local IPs Allowed</span>';
        } else {
            return '<span class="security-badge secure">🔒 Secure Mode</span>';
        }
    }
}

// CSS styles for the security settings
export const securitySettingsStyles = `
    .security-settings-modal .modal-content {
        max-width: 600px;
    }

    .security-section {
        padding: 20px;
    }

    .security-description {
        color: var(--text-secondary);
        margin-bottom: 20px;
        line-height: 1.6;
    }

    .security-toggle-container {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: var(--panel-bg);
        border-radius: 8px;
        margin-bottom: 20px;
    }

    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--danger-color);
        transition: .4s;
        border-radius: 34px;
    }

    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .toggle-slider {
        background-color: var(--warning-color);
    }

    input:checked + .toggle-slider:before {
        transform: translateX(26px);
    }

    .toggle-label {
        font-weight: 600;
        font-size: 16px;
    }

    .security-status {
        margin-bottom: 20px;
    }

    .status-indicator {
        padding: 12px;
        border-radius: 6px;
        font-weight: 500;
        margin-top: 8px;
    }

    .status-indicator.blocked {
        background: var(--success-bg);
        color: var(--success-color);
        border: 1px solid var(--success-color);
    }

    .status-indicator.allowed {
        background: var(--warning-bg);
        color: var(--warning-color);
        border: 1px solid var(--warning-color);
    }

    .blocked-ranges {
        margin-bottom: 20px;
    }

    .ip-ranges-list {
        list-style: none;
        padding: 0;
        margin-top: 10px;
        max-height: 150px;
        overflow-y: auto;
        background: var(--code-bg);
        border-radius: 4px;
        padding: 10px;
    }

    .ip-ranges-list li {
        padding: 4px 0;
        font-family: monospace;
        font-size: 13px;
    }

    .endpoint-validator {
        border-top: 1px solid var(--border-color);
        padding-top: 20px;
    }

    .validator-input {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }

    .validator-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-family: monospace;
    }

    #validation-result {
        margin-top: 15px;
        padding: 12px;
        border-radius: 4px;
        font-size: 14px;
    }

    .validation-loading {
        color: var(--text-secondary);
    }

    .validation-success {
        background: var(--success-bg);
        color: var(--success-color);
        border: 1px solid var(--success-color);
    }

    .validation-blocked {
        background: var(--danger-bg);
        color: var(--danger-color);
        border: 1px solid var(--danger-color);
    }

    .validation-error {
        color: var(--danger-color);
    }

    .security-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }

    .security-badge.secure {
        background: var(--success-bg);
        color: var(--success-color);
    }

    .security-badge.warning {
        background: var(--warning-bg);
        color: var(--warning-color);
    }

    /* CSS Variables for themes */
    :root {
        --success-bg: #d4edda;
        --success-color: #155724;
        --warning-bg: #fff3cd;
        --warning-color: #856404;
        --danger-bg: #f8d7da;
        --danger-color: #721c24;
        --code-bg: #f4f4f4;
    }

    .theme-dark {
        --success-bg: #1a3e1a;
        --success-color: #52c752;
        --warning-bg: #3e3a1a;
        --warning-color: #ffc107;
        --danger-bg: #3e1a1a;
        --danger-color: #ff5252;
        --code-bg: #2a2a2a;
    }
`;

export default SecuritySettings;
