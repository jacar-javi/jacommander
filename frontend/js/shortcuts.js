/**
 * Keyboard Shortcuts Customization Module
 * Allows users to customize keyboard shortcuts
 */

export class ShortcutManager {
    constructor(app) {
        this.app = app;
        this.shortcuts = new Map();
        this.defaultShortcuts = this.getDefaultShortcuts();
        this.customShortcuts = {};
        this.activeKeys = new Set();
        this.recording = false;
        this.recordingAction = null;
        this.init();
    }

    /**
     * Initialize the shortcut manager
     */
    init() {
        this.loadCustomShortcuts();
        this.mergeShortcuts();
        this.setupShortcutModal();
        this.setupKeyListeners();
    }

    /**
     * Get default shortcuts configuration
     */
    getDefaultShortcuts() {
        return {
            // Function keys
            help: { key: 'F1', description: 'Show help', action: 'help' },
            menu: { key: 'F2', description: 'User menu', action: 'menu' },
            view: { key: 'F3', description: 'View file', action: 'view' },
            edit: { key: 'F4', description: 'Edit file', action: 'edit' },
            copy: { key: 'F5', description: 'Copy files', action: 'copy' },
            move: { key: 'F6', description: 'Move/Rename files', action: 'move' },
            mkdir: { key: 'F7', description: 'Create directory', action: 'mkdir' },
            delete: { key: 'F8', description: 'Delete files', action: 'delete' },
            pulldown: { key: 'F9', description: 'Menu', action: 'pulldown' },
            quit: { key: 'F10', description: 'Exit', action: 'quit' },

            // Navigation
            switchPanel: { key: 'Tab', description: 'Switch panel', action: 'switchPanel' },
            navigateUp: { key: 'ArrowUp', description: 'Navigate up', action: 'navigateUp' },
            navigateDown: { key: 'ArrowDown', description: 'Navigate down', action: 'navigateDown' },
            enterDirectory: { key: 'Enter', description: 'Open file/folder', action: 'enter' },
            parentDirectory: { key: 'Backspace', description: 'Go to parent directory', action: 'parent' },
            pageUp: { key: 'PageUp', description: 'Page up', action: 'pageUp' },
            pageDown: { key: 'PageDown', description: 'Page down', action: 'pageDown' },
            home: { key: 'Home', description: 'Go to first item', action: 'home' },
            end: { key: 'End', description: 'Go to last item', action: 'end' },

            // Selection
            selectItem: { key: 'Insert', description: 'Select item', action: 'select' },
            selectAll: { key: 'Ctrl+A', description: 'Select all', action: 'selectAll' },
            deselectAll: { key: 'Ctrl+\\', description: 'Deselect all', action: 'deselectAll' },

            // Operations
            refresh: { key: 'Ctrl+R', description: 'Refresh panel', action: 'refresh' },
            search: { key: 'Ctrl+S', description: 'Search files', action: 'search' },
            compress: { key: 'Alt+F5', description: 'Compress files', action: 'compress' },
            extract: { key: 'Alt+F6', description: 'Extract archive', action: 'extract' },
            newFile: { key: 'Shift+F4', description: 'New file', action: 'newFile' },
            rename: { key: 'Shift+F6', description: 'Rename file', action: 'rename' },
            terminal: { key: 'Ctrl+T', description: 'Open terminal', action: 'terminal' },
            properties: { key: 'Alt+Enter', description: 'File properties', action: 'properties' },
            shortcuts: { key: 'Ctrl+K', description: 'Keyboard shortcuts', action: 'shortcuts' }
        };
    }

    /**
     * Load custom shortcuts from localStorage
     */
    loadCustomShortcuts() {
        try {
            const saved = localStorage.getItem('jacommander-shortcuts');
            if (saved) {
                this.customShortcuts = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load custom shortcuts:', error);
            this.customShortcuts = {};
        }
    }

    /**
     * Save custom shortcuts to localStorage
     */
    saveCustomShortcuts() {
        try {
            localStorage.setItem('jacommander-shortcuts', JSON.stringify(this.customShortcuts));
            this.app.showNotification('Shortcuts saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save shortcuts:', error);
            this.app.showNotification('Failed to save shortcuts', 'error');
        }
    }

    /**
     * Merge custom shortcuts with defaults
     */
    mergeShortcuts() {
        this.shortcuts.clear();

        // Start with defaults
        for (const [name, config] of Object.entries(this.defaultShortcuts)) {
            const key = this.customShortcuts[name] || config.key;
            this.shortcuts.set(this.normalizeKey(key), {
                ...config,
                key,
                name
            });
        }
    }

    /**
     * Normalize key string for consistent comparison
     */
    normalizeKey(key) {
        const parts = key.toLowerCase().split('+');
        const modifiers = [];
        const keys = [];

        parts.forEach((part) => {
            part = part.trim();
            if (part === 'ctrl' || part === 'control') {modifiers.push('ctrl');}
            else if (part === 'alt') {modifiers.push('alt');}
            else if (part === 'shift') {modifiers.push('shift');}
            else if (part === 'meta' || part === 'cmd' || part === 'command') {modifiers.push('meta');}
            else {keys.push(part);}
        });

        modifiers.sort();
        return [...modifiers, ...keys].join('+');
    }

    /**
     * Setup keyboard event listeners
     */
    setupKeyListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.recording) {
                this.handleRecording(e);
                return;
            }

            // Build key combination string
            const keyCombo = this.getKeyCombo(e);
            const normalizedKey = this.normalizeKey(keyCombo);

            // Check if this shortcut is registered
            const shortcut = this.shortcuts.get(normalizedKey);
            if (shortcut) {
                e.preventDefault();
                this.executeShortcut(shortcut);
            }
        });
    }

    /**
     * Get key combination from event
     */
    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) {parts.push('Ctrl');}
        if (e.altKey) {parts.push('Alt');}
        if (e.shiftKey) {parts.push('Shift');}
        if (e.metaKey) {parts.push('Meta');}

        // Get the key name
        let key = e.key;
        if (key === ' ') {key = 'Space';}
        else if (key === 'ArrowUp') {key = 'ArrowUp';}
        else if (key === 'ArrowDown') {key = 'ArrowDown';}
        else if (key === 'ArrowLeft') {key = 'ArrowLeft';}
        else if (key === 'ArrowRight') {key = 'ArrowRight';}
        else if (key.length === 1) {key = key.toUpperCase();}
        else if (e.code.startsWith('F') && /F\d+/.test(e.code)) {
            key = e.code;
        }

        parts.push(key);
        return parts.join('+');
    }

    /**
     * Execute a shortcut action
     */
    executeShortcut(shortcut) {
        const action = shortcut.action;

        // Check if modal is open
        const modals = document.querySelectorAll('.modal[style*="display: block"]');
        if (modals.length > 0 && action !== 'escape') {
            return; // Don't execute shortcuts when modals are open
        }

        // Dispatch to appropriate handler
        switch (action) {
            case 'help':
                this.app.keyboard.showHelp();
                break;
            case 'view':
                this.app.fileOps.viewFile();
                break;
            case 'edit':
                this.app.fileOps.editFile();
                break;
            case 'copy':
                this.app.fileOps.copyFiles();
                break;
            case 'move':
                this.app.fileOps.moveFiles();
                break;
            case 'mkdir':
                this.app.fileOps.createDirectory();
                break;
            case 'delete':
                this.app.fileOps.deleteFiles();
                break;
            case 'switchPanel':
                this.app.switchActivePanel();
                break;
            case 'refresh':
                this.app.panels.refresh(this.app.getActivePanel());
                break;
            case 'search':
                this.app.fileOps.showSearchModal();
                break;
            case 'compress':
                this.app.fileOps.compressFiles();
                break;
            case 'selectAll':
                this.app.panels.selectAll(this.app.getActivePanel());
                break;
            case 'deselectAll':
                this.app.panels.deselectAll(this.app.getActivePanel());
                break;
            case 'shortcuts':
                this.showShortcutModal();
                break;
            default:
                // Delegate to keyboard handler for navigation
                if (this.app.keyboard && this.app.keyboard[action]) {
                    this.app.keyboard[action]();
                }
        }
    }

    /**
     * Setup shortcut customization modal
     */
    setupShortcutModal() {
        // Create modal if it doesn't exist
        if (!document.getElementById('shortcut-modal')) {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'shortcut-modal';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-content modal-wide">
                    <div class="modal-header">
                        <h2>Customize Keyboard Shortcuts</h2>
                        <button class="modal-close" data-modal="shortcut-modal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="shortcut-instructions">
                            <p>Click on any shortcut and press the new key combination you want to assign.</p>
                            <p>Press <kbd>Escape</kbd> to cancel recording. Press <kbd>Delete</kbd> to remove a custom shortcut.</p>
                        </div>
                        <div class="shortcut-categories">
                            <div class="shortcut-category">
                                <h3>Function Keys</h3>
                                <div id="shortcuts-function" class="shortcut-list"></div>
                            </div>
                            <div class="shortcut-category">
                                <h3>Navigation</h3>
                                <div id="shortcuts-navigation" class="shortcut-list"></div>
                            </div>
                            <div class="shortcut-category">
                                <h3>Selection</h3>
                                <div id="shortcuts-selection" class="shortcut-list"></div>
                            </div>
                            <div class="shortcut-category">
                                <h3>Operations</h3>
                                <div id="shortcuts-operations" class="shortcut-list"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="shortcut-reset" class="btn-secondary">Reset to Defaults</button>
                        <button id="shortcut-export" class="btn-secondary">Export</button>
                        <button id="shortcut-import" class="btn-secondary">Import</button>
                        <button id="shortcut-save" class="btn-primary">Save Changes</button>
                        <button class="btn-cancel" data-modal="shortcut-modal">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Setup event handlers
            this.setupModalHandlers();
        }
    }

    /**
     * Setup modal event handlers
     */
    setupModalHandlers() {
        const modal = document.getElementById('shortcut-modal');

        // Close button
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideShortcutModal();
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.hideShortcutModal();
        });

        // Reset button
        document.getElementById('shortcut-reset').addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Save button
        document.getElementById('shortcut-save').addEventListener('click', () => {
            this.saveChanges();
        });

        // Export button
        document.getElementById('shortcut-export').addEventListener('click', () => {
            this.exportShortcuts();
        });

        // Import button
        document.getElementById('shortcut-import').addEventListener('click', () => {
            this.importShortcuts();
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                if (this.recording) {
                    this.cancelRecording();
                } else {
                    this.hideShortcutModal();
                }
            }
        });
    }

    /**
     * Show shortcut customization modal
     */
    showShortcutModal() {
        const modal = document.getElementById('shortcut-modal');
        modal.style.display = 'block';
        this.populateShortcuts();
    }

    /**
     * Hide shortcut customization modal
     */
    hideShortcutModal() {
        const modal = document.getElementById('shortcut-modal');
        modal.style.display = 'none';
        this.cancelRecording();
    }

    /**
     * Populate shortcuts in the modal
     */
    populateShortcuts() {
        const categories = {
            function: [],
            navigation: [],
            selection: [],
            operations: []
        };

        // Categorize shortcuts
        for (const [name, config] of Object.entries(this.defaultShortcuts)) {
            const currentKey = this.customShortcuts[name] || config.key;
            const item = {
                name,
                ...config,
                currentKey,
                isCustom: !!this.customShortcuts[name]
            };

            if (name.startsWith('F') || config.key.startsWith('F')) {
                categories.function.push(item);
            } else if (
                [
                    'switchPanel',
                    'navigateUp',
                    'navigateDown',
                    'enterDirectory',
                    'parentDirectory',
                    'pageUp',
                    'pageDown',
                    'home',
                    'end'
                ].includes(name)
            ) {
                categories.navigation.push(item);
            } else if (['selectItem', 'selectAll', 'deselectAll'].includes(name)) {
                categories.selection.push(item);
            } else {
                categories.operations.push(item);
            }
        }

        // Render each category
        for (const [category, items] of Object.entries(categories)) {
            const container = document.getElementById(`shortcuts-${category}`);
            container.innerHTML = items
                .map(
                    (item) => `
                <div class="shortcut-item ${item.isCustom ? 'custom' : ''}" data-name="${item.name}">
                    <span class="shortcut-description">${item.description}</span>
                    <div class="shortcut-key-container">
                        <kbd class="shortcut-key" data-action="${item.name}">${item.currentKey}</kbd>
                        ${item.isCustom ? '<span class="custom-indicator">custom</span>' : ''}
                    </div>
                </div>
            `
                )
                .join('');

            // Add click handlers
            container.querySelectorAll('.shortcut-key').forEach((kbd) => {
                kbd.addEventListener('click', (e) => {
                    this.startRecording(e.target.dataset.action);
                });
            });
        }
    }

    /**
     * Start recording a new shortcut
     */
    startRecording(action) {
        // Cancel any previous recording
        this.cancelRecording();

        this.recording = true;
        this.recordingAction = action;

        // Update UI
        const kbd = document.querySelector(`kbd[data-action="${action}"]`);
        if (kbd) {
            kbd.classList.add('recording');
            kbd.textContent = 'Press keys...';
        }
    }

    /**
     * Handle key recording
     */
    handleRecording(e) {
        e.preventDefault();
        e.stopPropagation();

        const kbd = document.querySelector(`kbd[data-action="${this.recordingAction}"]`);
        if (!kbd) {return;}

        // Handle Delete key to remove custom shortcut
        if (e.key === 'Delete') {
            delete this.customShortcuts[this.recordingAction];
            this.cancelRecording();
            this.populateShortcuts();
            return;
        }

        // Get the key combination
        const keyCombo = this.getKeyCombo(e);

        // Check for conflicts
        const conflict = this.checkConflict(keyCombo, this.recordingAction);
        if (conflict) {
            kbd.textContent = 'Conflict!';
            kbd.classList.add('error');
            setTimeout(() => {
                this.cancelRecording();
                this.populateShortcuts();
            }, 1500);
            return;
        }

        // Save the new shortcut
        this.customShortcuts[this.recordingAction] = keyCombo;
        kbd.textContent = keyCombo;
        kbd.classList.remove('recording');
        kbd.classList.add('success');

        setTimeout(() => {
            kbd.classList.remove('success');
            this.populateShortcuts();
        }, 500);

        this.recording = false;
        this.recordingAction = null;
    }

    /**
     * Cancel recording
     */
    cancelRecording() {
        if (this.recording) {
            const kbd = document.querySelector(`kbd[data-action="${this.recordingAction}"]`);
            if (kbd) {
                kbd.classList.remove('recording', 'error');
                const original =
                    this.customShortcuts[this.recordingAction] || this.defaultShortcuts[this.recordingAction].key;
                kbd.textContent = original;
            }
        }
        this.recording = false;
        this.recordingAction = null;
    }

    /**
     * Check for shortcut conflicts
     */
    checkConflict(keyCombo, excludeAction) {
        const normalized = this.normalizeKey(keyCombo);

        for (const [name, config] of Object.entries(this.defaultShortcuts)) {
            if (name === excludeAction) {continue;}

            const currentKey = this.customShortcuts[name] || config.key;
            if (this.normalizeKey(currentKey) === normalized) {
                return name;
            }
        }

        return null;
    }

    /**
     * Reset to default shortcuts
     */
    resetToDefaults() {
        if (confirm('Reset all shortcuts to defaults? This will remove all customizations.')) {
            this.customShortcuts = {};
            localStorage.removeItem('jacommander-shortcuts');
            this.mergeShortcuts();
            this.populateShortcuts();
            this.app.showNotification('Shortcuts reset to defaults', 'success');
        }
    }

    /**
     * Save changes
     */
    saveChanges() {
        this.saveCustomShortcuts();
        this.mergeShortcuts();
        this.hideShortcutModal();
    }

    /**
     * Export shortcuts to JSON
     */
    exportShortcuts() {
        const data = {
            version: '1.0',
            shortcuts: this.customShortcuts,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jacommander-shortcuts.json';
        a.click();
        URL.revokeObjectURL(url);

        this.app.showNotification('Shortcuts exported successfully', 'success');
    }

    /**
     * Import shortcuts from JSON
     */
    importShortcuts() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) {return;}

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (data.version && data.shortcuts) {
                    this.customShortcuts = data.shortcuts;
                    this.mergeShortcuts();
                    this.populateShortcuts();
                    this.app.showNotification('Shortcuts imported successfully', 'success');
                } else {
                    throw new Error('Invalid shortcut file format');
                }
            } catch (error) {
                console.error('Failed to import shortcuts:', error);
                this.app.showNotification('Failed to import shortcuts', 'error');
            }
        });

        input.click();
    }

    /**
     * Get shortcut for action
     */
    getShortcutForAction(action) {
        for (const [key, shortcut] of this.shortcuts.entries()) {
            if (shortcut.action === action) {
                return shortcut.key;
            }
        }
        return null;
    }

    /**
     * Update UI elements with current shortcuts
     */
    updateUIShortcuts() {
        // Update function key buttons
        document.querySelectorAll('.function-key').forEach((btn) => {
            const action = btn.dataset.key?.toLowerCase().replace('f', '');
            if (action) {
                const shortcut = this.getShortcutForAction(action);
                if (shortcut) {
                    btn.textContent = shortcut;
                }
            }
        });

        // Update help modal
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            this.updateHelpModal();
        }
    }

    /**
     * Update help modal with current shortcuts
     */
    updateHelpModal() {
        const shortcuts = Array.from(this.shortcuts.values());
        const grid = document.querySelector('.shortcuts-grid');
        if (grid) {
            grid.innerHTML = shortcuts
                .map(
                    (s) => `
                <div class="shortcut-item">
                    <kbd>${s.key}</kbd> ${s.description}
                </div>
            `
                )
                .join('');
        }
    }
}
