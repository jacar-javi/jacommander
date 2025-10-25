/**
 * Cloud Storage Management Module
 * Handles cloud storage backends (S3, Google Drive, OneDrive)
 */

export class CloudStorageManager {
    constructor(app) {
        this.app = app;
        this.storages = [];
        this.currentStorages = { left: 'local', right: 'local' };
        this.storageModal = null;
        this.init();
    }

    init() {
        this.loadStorages();
        this.createStorageModal();
        this.setupEventListeners();
        this.updateStorageSelectors();
    }

    async loadStorages() {
        try {
            const response = await fetch('/api/storages');
            if (response.ok) {
                this.storages = await response.json();
                this.updateStorageSelectors();
            }
        } catch (error) {
            console.error('Failed to load storages:', error);
            // Default to local storage only
            this.storages = [
                {
                    id: 'local',
                    type: 'local',
                    display_name: 'Local Storage',
                    icon: '💾',
                    is_default: true
                }
            ];
        }
    }

    createStorageModal() {
        // Create cloud storage configuration modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'cloud-storage-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content modal-wide">
                <div class="modal-header">
                    <h2>Cloud Storage Configuration</h2>
                    <button class="modal-close" data-modal="cloud-storage-modal">✕</button>
                </div>
                <div class="modal-body">
                    <div class="storage-tabs">
                        <div class="tab-buttons">
                            <button class="tab-button active" data-tab="storages">Configured Storages</button>
                            <button class="tab-button" data-tab="add-storage">Add New Storage</button>
                        </div>

                        <div class="tab-content active" id="tab-storages">
                            <div class="storage-list" id="storage-list">
                                <!-- Storage items will be dynamically added here -->
                            </div>
                        </div>

                        <div class="tab-content" id="tab-add-storage">
                            <div class="storage-form">
                                <h3>Add Cloud Storage</h3>

                                <div class="form-group">
                                    <label>Storage Type:</label>
                                    <select id="storage-type" class="modal-select">
                                        <option value="">Select Storage Type...</option>
                                        <option value="s3">Amazon S3</option>
                                        <option value="gdrive" disabled>Google Drive (Coming Soon)</option>
                                        <option value="onedrive" disabled>OneDrive (Coming Soon)</option>
                                    </select>
                                </div>

                                <div id="storage-config-form">
                                    <!-- Dynamic form fields based on storage type -->
                                </div>

                                <div class="form-actions">
                                    <button id="test-connection" class="btn-secondary" disabled>Test Connection</button>
                                    <button id="add-storage-btn" class="btn-primary" disabled>Add Storage</button>
                                </div>

                                <div id="test-result" class="test-result" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.storageModal = modal;
    }

    setupEventListeners() {
        // Storage modal toggle
        const configBtn = document.getElementById('config-btn');
        if (configBtn) {
            configBtn.addEventListener('click', () => this.showStorageModal());
        }

        // Tab switching
        document.querySelectorAll('.tab-button').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Storage type selection
        const storageTypeSelect = document.getElementById('storage-type');
        if (storageTypeSelect) {
            storageTypeSelect.addEventListener('change', (e) => {
                this.showStorageConfigForm(e.target.value);
            });
        }

        // Test connection button
        const testBtn = document.getElementById('test-connection');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testConnection());
        }

        // Add storage button
        const addBtn = document.getElementById('add-storage-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addStorage());
        }

        // Storage selector change events
        document.querySelectorAll('.storage-selector').forEach((selector) => {
            selector.addEventListener('change', (e) => {
                const panel = e.target.id.replace('storage-', '');
                this.changeStorage(panel, e.target.value);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach((content) => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        // Refresh storage list when switching to storages tab
        if (tabName === 'storages') {
            this.refreshStorageList();
        }
    }

    showStorageConfigForm(storageType) {
        const formContainer = document.getElementById('storage-config-form');
        const testBtn = document.getElementById('test-connection');
        const addBtn = document.getElementById('add-storage-btn');

        if (!storageType) {
            formContainer.innerHTML = '';
            testBtn.disabled = true;
            addBtn.disabled = true;
            return;
        }

        let formHTML = '';

        switch (storageType) {
            case 's3':
                formHTML = `
                    <div class="form-group">
                        <label>Storage Name:</label>
                        <input type="text" id="storage-name" class="modal-input" placeholder="My S3 Storage" required>
                    </div>
                    <div class="form-group">
                        <label>Bucket Name:</label>
                        <input type="text" id="s3-bucket" class="modal-input" placeholder="my-bucket" required>
                    </div>
                    <div class="form-group">
                        <label>AWS Region:</label>
                        <select id="s3-region" class="modal-select">
                            <option value="us-east-1">US East (N. Virginia)</option>
                            <option value="us-west-2">US West (Oregon)</option>
                            <option value="eu-west-1">EU (Ireland)</option>
                            <option value="eu-central-1">EU (Frankfurt)</option>
                            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                            <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Access Key ID:</label>
                        <input type="text" id="s3-access-key" class="modal-input" placeholder="AKIAIOSFODNN7EXAMPLE" required>
                    </div>
                    <div class="form-group">
                        <label>Secret Access Key:</label>
                        <input type="password" id="s3-secret-key" class="modal-input" placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" required>
                    </div>
                    <div class="form-group">
                        <label>Path Prefix (optional):</label>
                        <input type="text" id="s3-prefix" class="modal-input" placeholder="folder/subfolder">
                    </div>
                    <div class="form-group">
                        <label>Custom Endpoint (optional):</label>
                        <input type="text" id="s3-endpoint" class="modal-input" placeholder="https://s3.example.com">
                        <small>For S3-compatible services like MinIO, Wasabi, etc.</small>
                    </div>
                `;
                break;
        }

        formContainer.innerHTML = formHTML;
        testBtn.disabled = false;
        addBtn.disabled = false;
    }

    async testConnection() {
        const config = this.getStorageConfig();
        if (!config) {
            this.showTestResult('Please fill in all required fields', 'error');
            return;
        }

        const testResult = document.getElementById('test-result');
        testResult.style.display = 'block';
        testResult.className = 'test-result testing';
        testResult.innerHTML = '🔄 Testing connection...';

        try {
            const response = await fetch('/api/storages/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const result = await response.json();
            if (result.success) {
                this.showTestResult(`✅ ${result.message}`, 'success');
            } else {
                this.showTestResult(`❌ ${result.message}${result.details ? `: ${result.details}` : ''}`, 'error');
            }
        } catch (error) {
            this.showTestResult(`❌ Connection test failed: ${error.message}`, 'error');
        }
    }

    showTestResult(message, type) {
        const testResult = document.getElementById('test-result');
        testResult.style.display = 'block';
        testResult.className = `test-result ${type}`;
        testResult.innerHTML = message;
    }

    getStorageConfig() {
        const storageType = document.getElementById('storage-type').value;
        if (!storageType) {return null;}

        const config = {
            type: storageType,
            display_name: document.getElementById('storage-name')?.value || '',
            icon: '☁️',
            config: {}
        };

        switch (storageType) {
            case 's3':
                const bucket = document.getElementById('s3-bucket')?.value;
                const accessKey = document.getElementById('s3-access-key')?.value;
                const secretKey = document.getElementById('s3-secret-key')?.value;

                if (!bucket || !accessKey || !secretKey) {return null;}

                config.id = `s3-${bucket}`;
                config.config = {
                    bucket: bucket,
                    region: document.getElementById('s3-region')?.value || 'us-east-1',
                    access_key: accessKey,
                    secret_key: secretKey,
                    prefix: document.getElementById('s3-prefix')?.value || '',
                    endpoint: document.getElementById('s3-endpoint')?.value || ''
                };
                break;
        }

        return config;
    }

    async addStorage() {
        const config = this.getStorageConfig();
        if (!config) {
            this.app.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            const response = await fetch('/api/storages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.app.showNotification('Cloud storage added successfully', 'success');
                await this.loadStorages();
                this.switchTab('storages');
                this.clearStorageForm();
            } else {
                const error = await response.text();
                this.app.showNotification(`Failed to add storage: ${error}`, 'error');
            }
        } catch (error) {
            this.app.showNotification(`Failed to add storage: ${error.message}`, 'error');
        }
    }

    clearStorageForm() {
        document.getElementById('storage-type').value = '';
        document.getElementById('storage-config-form').innerHTML = '';
        document.getElementById('test-result').style.display = 'none';
        document.getElementById('test-connection').disabled = true;
        document.getElementById('add-storage-btn').disabled = true;
    }

    refreshStorageList() {
        const listContainer = document.getElementById('storage-list');
        if (!listContainer) {return;}

        if (this.storages.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No cloud storages configured</div>';
            return;
        }

        listContainer.innerHTML = this.storages
            .map(
                (storage) => `
            <div class="storage-item" data-id="${storage.id}">
                <div class="storage-icon">${storage.icon}</div>
                <div class="storage-info">
                    <div class="storage-name">${storage.display_name}</div>
                    <div class="storage-type">${this.getStorageTypeName(storage.type)}</div>
                </div>
                <div class="storage-actions">
                    ${storage.is_default ? '<span class="default-badge">Default</span>' : ''}
                    ${
    storage.id !== 'local'
        ? `
                        <button class="btn-small" onclick="cloudStorage.setDefault('${storage.id}')">Set Default</button>
                        <button class="btn-small btn-danger" onclick="cloudStorage.removeStorage('${storage.id}')">Remove</button>
                    `
        : ''
}
                </div>
            </div>
        `
            )
            .join('');
    }

    getStorageTypeName(type) {
        const typeNames = {
            local: 'Local Storage',
            s3: 'Amazon S3',
            gdrive: 'Google Drive',
            onedrive: 'OneDrive'
        };
        return typeNames[type] || type;
    }

    async setDefault(storageId) {
        try {
            const response = await fetch(`/api/storages/${storageId}/default`, {
                method: 'PUT'
            });

            if (response.ok) {
                this.app.showNotification('Default storage updated', 'success');
                await this.loadStorages();
            }
        } catch (error) {
            this.app.showNotification('Failed to set default storage', 'error');
        }
    }

    async removeStorage(storageId) {
        if (!confirm('Are you sure you want to remove this storage?')) {return;}

        try {
            const response = await fetch(`/api/storages/${storageId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.app.showNotification('Storage removed successfully', 'success');
                await this.loadStorages();
            }
        } catch (error) {
            this.app.showNotification('Failed to remove storage', 'error');
        }
    }

    updateStorageSelectors() {
        const selectors = document.querySelectorAll('.storage-selector');
        selectors.forEach((selector) => {
            const currentValue = selector.value;
            selector.innerHTML = this.storages
                .map((storage) => `<option value="${storage.id}">${storage.icon} ${storage.display_name}</option>`)
                .join('');

            // Restore previous selection if available
            if (currentValue && this.storages.find((s) => s.id === currentValue)) {
                selector.value = currentValue;
            } else {
                // Set to default storage
                const defaultStorage = this.storages.find((s) => s.is_default) || this.storages[0];
                if (defaultStorage) {
                    selector.value = defaultStorage.id;
                }
            }
        });
    }

    async changeStorage(panel, storageId) {
        this.currentStorages[panel] = storageId;

        // Update the panel's file list with the new storage
        if (this.app.panels) {
            await this.app.panels.refreshPanel(panel, '/');
        }

        // Save to session
        sessionStorage.setItem(`storage-${panel}`, storageId);
    }

    showStorageModal() {
        if (this.storageModal) {
            this.storageModal.style.display = 'block';
            this.refreshStorageList();
        }
    }

    hideStorageModal() {
        if (this.storageModal) {
            this.storageModal.style.display = 'none';
        }
    }
}

// Make CloudStorageManager globally available
window.CloudStorageManager = CloudStorageManager;
