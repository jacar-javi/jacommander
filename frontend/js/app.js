// JaCommander - Main Application Module
/* eslint-disable no-console */

import { PanelManager } from './panels.js?v=1.3.8';
import { KeyboardHandler } from './keyboard.js?v=1.3.8';
import { FileOperations } from './fileops.js?v=1.3.8';
import { WebSocketClient } from './websocket.js?v=1.3.8';
import { ThemeManager } from './theme.js?v=1.3.8';
import { ShortcutManager } from './shortcuts.js?v=1.3.8';
import { CloudStorageManager } from './cloud-storage.js?v=1.3.8';
import { SimpleI18n } from './simple-i18n.js?v=1.3.8';
import { TableEnhancements } from './table-enhancements.js?v=1.3.8';
import { PerformanceOptimizer } from './performance.js?v=1.3.8';

class JaCommander {
    constructor() {
        this.panels = null;
        this.keyboard = null;
        this.fileOps = null;
        this.wsClient = null;
        this.theme = null;
        this.shortcuts = null;
        this.cloudStorage = null;
        this.i18n = null;
        this.tableEnhancements = null;
        this.performance = null;
        this.activePanel = 'left';
    }

    async init() {
        console.log('Initializing JaCommander...');

        // Initialize performance optimizer (early for caching and metrics)
        this.performance = new PerformanceOptimizer(this);

        // Initialize theme manager
        this.theme = new ThemeManager();

        // Initialize i18n (internationalization) support
        this.i18n = new SimpleI18n(this);

        // Initialize WebSocket client for progress tracking
        this.wsClient = new WebSocketClient();
        await this.wsClient.connect();

        // Initialize panel manager
        this.panels = new PanelManager(this);

        // Initialize file operations handler
        this.fileOps = new FileOperations(this);

        // Initialize shortcut manager (before keyboard handler)
        this.shortcuts = new ShortcutManager(this);

        // Initialize cloud storage manager (waits for storage loading)
        this.cloudStorage = new CloudStorageManager(this);
        await this.cloudStorage.init();

        // Initialize keyboard handler
        this.keyboard = new KeyboardHandler(this);

        // Initialize panels with first storage from CloudStorageManager
        if (this.cloudStorage.storages.length > 0) {
            await this.panels.initializePanels(this.cloudStorage.storages[0].id);
        }

        // Initialize table enhancements (select-all checkbox and column sorting)
        this.tableEnhancements = new TableEnhancements(this);

        // Setup UI event listeners
        this.setupUIListeners();

        // Start connection monitoring
        this.startConnectionMonitoring();

        console.log('JaCommander initialized successfully');
    }

    setupUIListeners() {
        // Connection status button (show connection info on click)
        document.getElementById('connection-status-btn').addEventListener('click', () => {
            this.showConnectionInfo();
        });

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

    startConnectionMonitoring() {
        // Initial check
        this.checkBackendConnection();

        // Check every 10 seconds
        setInterval(() => {
            this.checkBackendConnection();
        }, 10000);
    }

    async checkBackendConnection() {
        const statusBtn = document.getElementById('connection-status-btn');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch('/api/health', {
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                statusBtn.setAttribute('data-status', 'connected');
                statusBtn.title = 'Backend Connected';
            } else {
                statusBtn.setAttribute('data-status', 'disconnected');
                statusBtn.title = 'Backend Error';
            }
        } catch (error) {
            statusBtn.setAttribute('data-status', 'disconnected');
            statusBtn.title = 'Backend Disconnected';
            console.warn('Backend connection check failed:', error.message);
        }
    }

    showConnectionInfo() {
        const statusBtn = document.getElementById('connection-status-btn');
        const status = statusBtn.getAttribute('data-status');

        let message = '';
        let type = 'info';

        if (status === 'connected') {
            message = 'Backend server is connected';
            type = 'success';
        } else if (status === 'connecting') {
            message = 'Connecting to backend server...';
            type = 'info';
        } else {
            message = 'Backend server is disconnected';
            type = 'error';
        }

        this.showNotification(message, type);
    }

    formatFileSize(bytes) {
        if (bytes === 0) {
            return '0 B';
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);

        // Return ISO 8601 format: YYYY-MM-DD HH:MM:SS
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async confirmAction(options) {
        // Support both old API (title, message, dangerAction) and new API (options object)
        let title, message, confirmText, cancelText, dangerAction;

        if (typeof options === 'string') {
            // Old API: confirmAction(title, message, dangerAction)
            title = options;
            message = arguments[1] || '';
            dangerAction = arguments[2] || false;
            confirmText = 'Yes';
            cancelText = 'No';
        } else {
            // New API: confirmAction({ title, message, confirmText, cancelText, dangerAction })
            title = options.title || 'Confirm';
            message = options.message || 'Are you sure?';
            confirmText = options.confirmText || 'Yes';
            cancelText = options.cancelText || 'No';
            dangerAction = options.dangerAction || false;
        }

        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');

            // Set content
            titleEl.textContent = title;
            messageEl.textContent = message;
            yesBtn.textContent = confirmText;
            noBtn.textContent = cancelText;

            // Apply danger styling if needed
            if (dangerAction) {
                yesBtn.className = 'btn-danger';
            } else {
                yesBtn.className = 'btn-primary';
            }

            // Show modal
            this.showModal('confirm-modal');

            // Focus on the appropriate button
            setTimeout(() => {
                if (dangerAction) {
                    noBtn.focus(); // Focus cancel for danger actions
                } else {
                    yesBtn.focus(); // Focus confirm for normal actions
                }
            }, 100);

            // Handle confirmation
            const handleYes = () => {
                cleanup(); // eslint-disable-line no-use-before-define
                this.closeModal('confirm-modal');
                resolve(true);
            };

            const handleNo = () => {
                cleanup(); // eslint-disable-line no-use-before-define
                this.closeModal('confirm-modal');
                resolve(false);
            };

            const handleKeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleYes();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleNo();
                }
            };

            // Define cleanup function after handlers (hoisting allows this)
            const cleanup = () => {
                yesBtn.removeEventListener('click', handleYes);
                noBtn.removeEventListener('click', handleNo);
                modal.removeEventListener('keydown', handleKeydown);
            };

            // Add event listeners
            yesBtn.addEventListener('click', handleYes);
            noBtn.addEventListener('click', handleNo);
            modal.addEventListener('keydown', handleKeydown);
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
