// JaCommander - Main Application Module

import { PanelManager } from './panels.js';
import { KeyboardHandler } from './keyboard.js';
import { FileOperations } from './fileops.js';
import { WebSocketClient } from './websocket.js';
import { ThemeManager } from './theme.js';
import { ShortcutManager } from './shortcuts.js';
import { CloudStorageManager } from './cloud-storage.js';

class JaCommander {
    constructor() {
        this.panels = null;
        this.keyboard = null;
        this.fileOps = null;
        this.wsClient = null;
        this.theme = null;
        this.shortcuts = null;
        this.cloudStorage = null;
        this.storages = [];
        this.activePanel = 'left';
    }

    async init() {
        console.log('Initializing JaCommander...');

        // Initialize theme manager
        this.theme = new ThemeManager();

        // Initialize WebSocket client for progress tracking
        this.wsClient = new WebSocketClient();
        await this.wsClient.connect();

        // Initialize panel manager
        this.panels = new PanelManager(this);

        // Initialize file operations handler
        this.fileOps = new FileOperations(this);

        // Initialize shortcut manager (before keyboard handler)
        this.shortcuts = new ShortcutManager(this);

        // Initialize cloud storage manager
        this.cloudStorage = new CloudStorageManager(this);

        // Initialize keyboard handler
        this.keyboard = new KeyboardHandler(this);

        // Load available storages
        await this.loadStorages();

        // Initialize panels with first storage
        if (this.storages.length > 0) {
            await this.panels.initializePanels(this.storages[0].id);
        }

        // Setup UI event listeners
        this.setupUIListeners();

        console.log('JaCommander initialized successfully');
    }

    async loadStorages() {
        try {
            const response = await fetch('/api/storages');
            const data = await response.json();

            if (data.success) {
                this.storages = data.data;
                console.log('Loaded storages:', this.storages);

                // Update storage selectors
                this.updateStorageSelectors();
            }
        } catch (error) {
            console.error('Failed to load storages:', error);
            this.showNotification('Failed to load storages', 'error');
        }
    }

    updateStorageSelectors() {
        const leftSelector = document.getElementById('storage-left');
        const rightSelector = document.getElementById('storage-right');

        // Clear existing options
        leftSelector.innerHTML = '';
        rightSelector.innerHTML = '';

        // Add storage options
        this.storages.forEach((storage) => {
            const optionLeft = document.createElement('option');
            optionLeft.value = storage.id;
            optionLeft.textContent = `${storage.id} (${storage.type})`;
            leftSelector.appendChild(optionLeft);

            const optionRight = document.createElement('option');
            optionRight.value = storage.id;
            optionRight.textContent = `${storage.id} (${storage.type})`;
            rightSelector.appendChild(optionRight);
        });
    }

    setupUIListeners() {
        // Theme toggle button
        document.getElementById('theme-btn').addEventListener('click', () => {
            this.theme.toggle();
        });

        // Shortcuts button
        document.getElementById('shortcuts-btn').addEventListener('click', () => {
            this.shortcuts.showShortcutModal();
        });

        // Menu button
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showMenu();
        });

        // Configuration button
        document.getElementById('config-btn').addEventListener('click', () => {
            this.showConfiguration();
        });

        // Storage selector change
        document.getElementById('storage-left').addEventListener('change', (e) => {
            this.panels.changeStorage('left', e.target.value);
        });

        document.getElementById('storage-right').addEventListener('change', (e) => {
            this.panels.changeStorage('right', e.target.value);
        });

        // Function key buttons
        document.querySelectorAll('.function-key').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                this.keyboard.handleFunctionKey(key);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close, .btn-cancel').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal || e.target.closest('.modal').id;
                this.closeModal(modalId);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach((modal) => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Panel click to activate
        document.getElementById('panel-left').addEventListener('click', () => {
            this.setActivePanel('left');
        });

        document.getElementById('panel-right').addEventListener('click', () => {
            this.setActivePanel('right');
        });
    }

    setActivePanel(panel) {
        this.activePanel = panel;

        // Update visual state
        document.getElementById('panel-left').classList.toggle('active', panel === 'left');
        document.getElementById('panel-right').classList.toggle('active', panel === 'right');

        // Focus on the active panel's file list
        const tbody = document.getElementById(`files-${panel}`);
        if (tbody && tbody.firstElementChild) {
            tbody.firstElementChild.focus();
        }
    }

    getActivePanel() {
        return this.activePanel;
    }

    switchPanel() {
        const newPanel = this.activePanel === 'left' ? 'right' : 'left';
        this.setActivePanel(newPanel);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';

            // Focus on first input if present
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach((modal) => {
            modal.style.display = 'none';
        });
    }

    showMenu() {
        // TODO: Implement menu
        console.log('Menu requested');
        this.showNotification('Menu not implemented yet', 'info');
    }

    showConfiguration() {
        // TODO: Implement configuration
        console.log('Configuration requested');
        this.showNotification('Configuration not implemented yet', 'info');
    }

    showNotification(message, type = 'info') {
        // Simple notification system - can be enhanced later
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#f44747' : type === 'success' ? '#4ec9b0' : '#3794ff'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) {return '0 B';}
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // If today, show time
        if (diff < 86400000 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // If this year, show month and day
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }

        // Otherwise show full date
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    async confirmAction(title, message, dangerAction = false) {
        return new Promise((resolve) => {
            // For now, use native confirm - can be replaced with custom modal
            const result = confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    }
}

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new JaCommander();
    window.app.init().catch((error) => {
        console.error('Failed to initialize JaCommander:', error);
    });
});

export { JaCommander };
