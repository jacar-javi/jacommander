// Keyboard Handler Module

export class KeyboardHandler {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main keyboard event listener
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // Prevent default for function keys
        document.addEventListener('keydown', (e) => {
            if (e.key.startsWith('F') && e.key.length <= 3) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(e) {
        // Check if a modal is open
        const modalOpen = Array.from(document.querySelectorAll('.modal')).some(
            (modal) => modal.style.display !== 'none'
        );

        if (modalOpen) {
            // Only handle modal-specific keys when modal is open
            this.handleModalKeys(e);
            // Prevent all other shortcuts from executing
            return;
        }

        // Handle function keys F1-F10
        if (e.key.startsWith('F') && e.key.length <= 3) {
            this.handleFunctionKey(e.key, e);
            return;
        }

        // Handle other keyboard shortcuts
        this.handleShortcut(e);
    }

    handleFunctionKey(key, event = null) {
        if (event) {
            event.preventDefault();
        }

        const panel = this.app.getActivePanel();

        switch (key) {
            case 'F1':
                this.showHelp();
                break;
            case 'F2':
                this.showUserMenu();
                break;
            case 'F3':
                this.viewFile(panel);
                break;
            case 'F4':
                if (event && event.shiftKey) {
                    this.createNewFile(panel);
                } else {
                    this.editFile(panel);
                }
                break;
            case 'F5':
                if (event && event.altKey) {
                    this.compressFiles(panel);
                } else if (event && event.shiftKey) {
                    this.copyWithOptions(panel);
                } else {
                    this.copyFiles(panel);
                }
                break;
            case 'F6':
                if (event && event.altKey) {
                    this.decompressFile(panel);
                } else if (event && event.shiftKey) {
                    this.renameFile(panel);
                } else {
                    this.moveFiles(panel);
                }
                break;
            case 'F7':
                this.createDirectory(panel);
                break;
            case 'F8':
                this.deleteFiles(panel);
                break;
            case 'F9':
                this.showMenu();
                break;
            case 'F10':
                this.exitApplication();
                break;
        }
    }

    handleShortcut(e) {
        const panel = this.app.getActivePanel();

        // Tab - Switch panels
        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            this.app.switchPanel();
            return;
        }

        // Ctrl+A - Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.app.panels.selectAll(panel);
            return;
        }

        // Ctrl+\ - Deselect all
        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
            e.preventDefault();
            this.app.panels.deselectAll(panel);
            return;
        }

        // Ctrl+R - Refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.app.panels.refresh(panel);
            return;
        }

        // Ctrl+S - Search
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.showSearch(panel);
            return;
        }

        // Insert - Toggle selection and move down
        if (e.key === 'Insert') {
            e.preventDefault();
            this.toggleSelectionAndMoveDown(panel);
            return;
        }

        // Space - Toggle selection (without moving down)
        if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            this.toggleSelection(panel);
            return;
        }

        // Delete - Delete files (alias for F8)
        if (e.key === 'Delete') {
            e.preventDefault();
            this.deleteFiles(panel);
            return;
        }

        // Backspace - Go to parent directory
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.navigateToParent(panel);
            return;
        }

        // Enter - Open file/directory
        if (e.key === 'Enter') {
            e.preventDefault();
            this.openSelectedItem(panel);
            return;
        }

        // Arrow keys - Navigate files
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.app.panels.navigateUp(panel);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.app.panels.navigateDown(panel);
            return;
        }

        // Page Up/Down
        if (e.key === 'PageUp') {
            e.preventDefault();
            this.pageUp(panel);
            return;
        }

        if (e.key === 'PageDown') {
            e.preventDefault();
            this.pageDown(panel);
            return;
        }

        // Home/End
        if (e.key === 'Home') {
            e.preventDefault();
            this.jumpToFirst(panel);
            return;
        }

        if (e.key === 'End') {
            e.preventDefault();
            this.jumpToLast(panel);
            return;
        }

        // ESC - Cancel operation / Close modal
        if (e.key === 'Escape') {
            this.handleEscape();
            return;
        }

        // Alt+O - Show same directory in both panels
        if (e.altKey && e.key === 'o') {
            e.preventDefault();
            this.syncPanels();
            return;
        }
    }

    handleModalKeys(e) {
        // Get active element first
        const activeElement = document.activeElement;
        const isInInputField =
            activeElement &&
            (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable);

        // ESC closes modal
        if (e.key === 'Escape') {
            e.preventDefault();
            this.app.closeAllModals();
            return;
        }

        // Ctrl+S in edit modal saves
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            const editModal = document.getElementById('edit-modal');
            if (editModal && editModal.style.display !== 'none') {
                e.preventDefault();
                document.getElementById('edit-save').click();
                return;
            }
        }

        // Enter in input modals confirms (but not in textareas)
        if (e.key === 'Enter' && !isInInputField) {
            const activeModal = Array.from(document.querySelectorAll('.modal')).find(
                (modal) => modal.style.display !== 'none'
            );

            if (activeModal) {
                const confirmBtn = activeModal.querySelector('.btn-primary');
                if (confirmBtn) {
                    e.preventDefault();
                    confirmBtn.click();
                    return;
                }
            }
        }

        // If focused on input field, allow ALL keys to work normally for editing
        if (isInInputField) {
            // Allow all standard editing shortcuts
            if (e.ctrlKey || e.metaKey) {
                const allowedCtrlKeys = ['c', 'v', 'x', 'a', 'z', 'y', 's']; // Copy, Paste, Cut, Select All, Undo, Redo, Save
                if (allowedCtrlKeys.includes(e.key.toLowerCase())) {
                    return; // Allow these shortcuts
                }
            }
            // Allow all other keys (typing, arrows, delete, backspace, etc.)
            return;
        }

        // Tab navigation is allowed in modals for accessibility
        if (e.key === 'Tab') {
            return;
        }

        // Allow navigation keys even when not in input (for scrolling in viewer)
        const navigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];

        if (navigationKeys.includes(e.key)) {
            return; // Allow these keys for scrolling
        }

        // Prevent function keys F1-F12 when modal is open
        if (e.key.startsWith('F') && e.key.length <= 3) {
            e.preventDefault();
            return;
        }

        // Block other Ctrl/Cmd shortcuts that aren't handled above
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            return;
        }
    }

    // F1 - Help
    showHelp() {
        this.app.showModal('help-modal');
    }

    // F2 - User Menu
    showUserMenu() {
        this.app.showNotification('User menu not implemented yet', 'info');
    }

    // F3 - View File
    // F3 - View File
    viewFile(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        let file;
        if (selectedFiles.length === 0) {
            // Get the focused file
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                file = panelData.files[panelData.focusedIndex];
            }

            if (!file) {
                this.app.showNotification('No file selected', 'warning');
                return;
            }
        } else {
            file = panelData.files.find((f) => f.name === selectedFiles[0]);
        }

        if (file && !file.is_dir) {
            this.app.fileOps.viewFile(panel, file);
        }
    }

    // F4 - Edit File
    // F4 - Edit File
    editFile(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        let file;
        if (selectedFiles.length === 0) {
            // Get the focused file
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                file = panelData.files[panelData.focusedIndex];
            }

            if (!file) {
                this.app.showNotification('No file selected', 'warning');
                return;
            }
        } else {
            file = panelData.files.find((f) => f.name === selectedFiles[0]);
        }

        if (file && !file.is_dir) {
            this.app.fileOps.editFile(panel, file);
        }
    }

    // Shift+F4 - Create New File
    createNewFile(panel) {
        this.app.fileOps.createNewFile(panel);
    }

    // F5 - Copy Files
    // F5 - Copy Files
    // F5 - Copy Files
    copyFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        if (selectedFiles.length === 0) {
            // Get the focused file and select it
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                const focusedFile = panelData.files[panelData.focusedIndex];
                if (focusedFile && !focusedFile.is_dir) {
                    // Select the focused file for the copy operation
                    this.app.panels.toggleSelection(panel, focusedFile.name);
                    this.app.fileOps.copyFiles(panel);
                    return;
                } else if (focusedFile && focusedFile.is_dir) {
                    // Can copy directories too
                    this.app.panels.toggleSelection(panel, focusedFile.name);
                    this.app.fileOps.copyFiles(panel);
                    return;
                }
            }

            this.app.showNotification('No files selected', 'warning');
            return;
        }

        this.app.fileOps.copyFiles(panel);
    }

    // Shift+F5 - Copy with Options
    copyWithOptions(_panel) {
        this.app.showNotification('Copy with options not implemented yet', 'info');
    }

    // Alt+F5 - Compress Files
    // Alt+F5 - Compress Files
    // Alt+F5 - Compress Files
    compressFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        if (selectedFiles.length === 0) {
            // Get the focused file and select it
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                const focusedFile = panelData.files[panelData.focusedIndex];
                if (focusedFile) {
                    // Select the focused file for the compress operation
                    this.app.panels.toggleSelection(panel, focusedFile.name);
                    this.app.fileOps.compressFiles(panel);
                    return;
                }
            }

            this.app.showNotification('No files selected', 'warning');
            return;
        }

        this.app.fileOps.compressFiles(panel);
    }

    // F6 - Move Files
    // F6 - Move Files
    // F6 - Move Files
    moveFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        if (selectedFiles.length === 0) {
            // Get the focused file and select it
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                const focusedFile = panelData.files[panelData.focusedIndex];
                if (focusedFile) {
                    // Select the focused file for the move operation
                    this.app.panels.toggleSelection(panel, focusedFile.name);
                    this.app.fileOps.moveFiles(panel);
                    return;
                }
            }

            this.app.showNotification('No files selected', 'warning');
            return;
        }

        this.app.fileOps.moveFiles(panel);
    }

    // Shift+F6 - Rename File
    // Shift+F6 - Rename File
    // Shift+F6 - Rename File
    renameFile(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        if (selectedFiles.length === 0) {
            // Get the focused file and select it
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                const focusedFile = panelData.files[panelData.focusedIndex];
                if (focusedFile) {
                    // Select the focused file for the rename operation
                    this.app.panels.toggleSelection(panel, focusedFile.name);
                    this.app.fileOps.renameFile(panel);
                    return;
                }
            }

            this.app.showNotification('Select exactly one file to rename', 'warning');
            return;
        }

        if (selectedFiles.length !== 1) {
            this.app.showNotification('Select exactly one file to rename', 'warning');
            return;
        }

        this.app.fileOps.renameFile(panel);
    }

    // Alt+F6 - Decompress File
    // Alt+F6 - Decompress File
    // Alt+F6 - Decompress File
    decompressFile(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        if (selectedFiles.length === 0) {
            // Get the focused file and select it
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                const focusedFile = panelData.files[panelData.focusedIndex];
                if (focusedFile) {
                    // Select the focused file for the decompress operation
                    this.app.panels.toggleSelection(panel, focusedFile.name);
                    this.app.fileOps.decompressFile(panel);
                    return;
                }
            }

            this.app.showNotification('Select exactly one archive to decompress', 'warning');
            return;
        }

        if (selectedFiles.length !== 1) {
            this.app.showNotification('Select exactly one archive to decompress', 'warning');
            return;
        }

        this.app.fileOps.decompressFile(panel);
    }

    // F7 - Create Directory
    createDirectory(panel) {
        this.app.fileOps.createDirectory(panel);
    }

    // F8 - Delete Files
    // F8 - Delete Files
    // F8 - Delete Files
    deleteFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const panelData = this.app.panels.panels[panel];

        // If no files selected, use the focused file
        if (selectedFiles.length === 0) {
            // Get the focused file and select it
            if (panelData.focusedIndex >= 0 && panelData.focusedIndex < panelData.files.length) {
                const focusedFile = panelData.files[panelData.focusedIndex];
                if (focusedFile) {
                    // Select the focused file for the delete operation
                    this.app.panels.toggleSelection(panel, focusedFile.name);
                    this.app.fileOps.deleteFiles(panel);
                    return;
                }
            }

            this.app.showNotification('No files selected', 'warning');
            return;
        }

        this.app.fileOps.deleteFiles(panel);
    }

    // F9 - Menu
    showMenu() {
        this.app.showMenu();
    }

    // F10 - Exit
    async exitApplication() {
        const confirmed = await this.app.confirmAction({
            title: 'Exit JaCommander',
            message: 'Are you sure you want to exit JaCommander?',
            confirmText: 'Exit',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            window.close();
            // If window.close() doesn't work (e.g., not opened by script)
            this.app.showNotification('Please close the browser tab to exit', 'info');
        }
    }

    // Navigation helpers
    toggleSelectionAndMoveDown(panel) {
        const panelData = this.app.panels.panels[panel];
        const currentFile = panelData.files[panelData.focusedIndex];

        if (currentFile) {
            this.app.panels.toggleSelection(panel, currentFile.name);
            this.app.panels.navigateDown(panel);
        }
    }

    toggleSelection(panel) {
        const panelData = this.app.panels.panels[panel];
        const currentFile = panelData.files[panelData.focusedIndex];

        if (currentFile) {
            this.app.panels.toggleSelection(panel, currentFile.name);
        }
    }

    navigateToParent(panel) {
        const currentPath = this.app.panels.getCurrentPath(panel);
        if (currentPath !== '/') {
            const parts = currentPath.split('/').filter((p) => p);
            parts.pop();
            const parentPath = `/${parts.join('/')}`;
            this.app.panels.loadDirectory(panel, parentPath);
        }
    }

    openSelectedItem(panel) {
        const panelData = this.app.panels.panels[panel];

        // Handle ".." (parent directory) - focusedIndex is -1
        if (panelData.focusedIndex === -1) {
            const currentPath = this.app.panels.getCurrentPath(panel);
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
            this.app.panels.loadDirectory(panel, parentPath);
            return;
        }

        const focusedFile = panelData.files[panelData.focusedIndex];

        if (focusedFile) {
            if (focusedFile.is_dir) {
                const newPath = `${this.app.panels.getCurrentPath(panel)}/${focusedFile.name}`;
                this.app.panels.loadDirectory(panel, newPath.replace('//', '/'));
            } else {
                this.app.fileOps.viewFile(panel, focusedFile);
            }
        }
    }

    pageUp(panel) {
        const panelData = this.app.panels.panels[panel];
        const hasParentDir = panelData.currentPath !== '/';
        const minIndex = hasParentDir ? -1 : 0;
        panelData.focusedIndex = Math.max(minIndex, panelData.focusedIndex - 10);
        this.app.panels.updateFocus(panel);
    }

    pageDown(panel) {
        const panelData = this.app.panels.panels[panel];
        panelData.focusedIndex = Math.min(panelData.files.length - 1, panelData.focusedIndex + 10);
        this.app.panels.updateFocus(panel);
    }

    jumpToFirst(panel) {
        const panelData = this.app.panels.panels[panel];
        const hasParentDir = panelData.currentPath !== '/';
        panelData.focusedIndex = hasParentDir ? -1 : 0;
        this.app.panels.updateFocus(panel);
    }

    jumpToLast(panel) {
        const panelData = this.app.panels.panels[panel];
        panelData.focusedIndex = panelData.files.length - 1;
        this.app.panels.updateFocus(panel);
    }

    showSearch(panel) {
        // Show search modal
        document.getElementById('search-query').value = '';
        document.getElementById('search-query').dataset.panel = panel;
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('search-results-list').innerHTML = '';

        // Set up search button handler
        const searchBtn = document.getElementById('search-confirm');
        const newSearchBtn = searchBtn.cloneNode(true);
        searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

        newSearchBtn.addEventListener('click', () => {
            this.performSearch(panel);
        });

        // Handle Enter key in search input
        document.getElementById('search-query').onkeyup = (e) => {
            if (e.key === 'Enter') {
                this.performSearch(panel);
            }
        };

        this.app.showModal('search-modal');
        setTimeout(() => document.getElementById('search-query').focus(), 100);
    }

    async performSearch(panel) {
        const query = document.getElementById('search-query').value.trim();
        if (!query) {
            this.app.showNotification('Please enter a search term', 'warning');
            return;
        }

        const caseSensitive = document.getElementById('search-case-sensitive').checked;
        const useRegex = document.getElementById('search-regex').checked;
        const includeSubdirs = document.getElementById('search-subdirs').checked;

        const currentPath = this.app.panels.getCurrentPath(panel);
        const storage = this.app.panels.getCurrentStorage(panel);

        // Show loading state
        const resultsContainer = document.getElementById('search-results');
        const resultsList = document.getElementById('search-results-list');
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = '<div class="loading-state">Searching...</div>';

        try {
            // Search files recursively
            const results = await this.searchFiles(storage, currentPath, query, {
                caseSensitive,
                useRegex,
                includeSubdirs
            });

            if (results.length === 0) {
                resultsList.innerHTML = '<div class="empty-state">No files found</div>';
            } else {
                resultsList.innerHTML = results
                    .map(
                        (file) => `
                    <div class="search-result-item" data-path="${file.path}" data-panel="${panel}">
                        <span class="file-icon">${file.is_dir ? '📁' : '📄'}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-path">${file.path}</span>
                    </div>
                `
                    )
                    .join('');

                // Add click handlers to results
                resultsList.querySelectorAll('.search-result-item').forEach((item) => {
                    item.addEventListener('click', () => {
                        const path = item.dataset.path;
                        const targetPanel = item.dataset.panel;

                        // Navigate to the file's directory
                        const dirPath = path.substring(0, path.lastIndexOf('/')) || '/';
                        this.app.panels.loadDirectory(targetPanel, dirPath);

                        // Close search modal
                        this.app.closeModal('search-modal');
                    });
                });
            }

            this.app.showNotification(`Found ${results.length} result(s)`, 'success');
        } catch (error) {
            console.error('Search failed:', error);
            resultsList.innerHTML = '<div class="empty-state">Search failed</div>';
            this.app.showNotification('Search failed', 'error');
        }
    }

    async searchFiles(storage, path, query, options) {
        const results = [];

        try {
            // Get files in current directory
            const response = await fetch(`/api/fs/list?storage=${storage}&path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (data.success && data.data.files) {
                for (const file of data.data.files) {
                    // Check if filename matches
                    let matches = false;
                    const fileName = file.name;
                    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
                    const searchName = options.caseSensitive ? fileName : fileName.toLowerCase();

                    if (options.useRegex) {
                        try {
                            const regex = new RegExp(searchQuery, options.caseSensitive ? 'g' : 'gi');
                            matches = regex.test(fileName);
                        } catch (e) {
                            // Invalid regex, fall back to includes
                            matches = searchName.includes(searchQuery);
                        }
                    } else {
                        matches = searchName.includes(searchQuery);
                    }

                    if (matches) {
                        results.push({
                            name: file.name,
                            path: file.path,
                            is_dir: file.is_dir
                        });
                    }

                    // Recursively search subdirectories if enabled
                    if (options.includeSubdirs && file.is_dir) {
                        const subPath = path + (path.endsWith('/') ? '' : '/') + file.name;
                        const subResults = await this.searchFiles(storage, subPath, query, options);
                        results.push(...subResults);
                    }
                }
            }
        } catch (error) {
            console.error('Error searching directory:', path, error);
        }

        return results;
    }

    syncPanels() {
        const activePanel = this.app.getActivePanel();
        const otherPanel = activePanel === 'left' ? 'right' : 'left';

        const currentPath = this.app.panels.getCurrentPath(activePanel);
        const currentStorage = this.app.panels.getCurrentStorage(activePanel);

        // Set the other panel to the same storage and path
        document.getElementById(`storage-${otherPanel}`).value = currentStorage;
        this.app.panels.changeStorage(otherPanel, currentStorage).then(() => {
            this.app.panels.loadDirectory(otherPanel, currentPath);
        });
    }

    handleEscape() {
        // Close any open modal
        this.app.closeAllModals();

        // Cancel any ongoing operation
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer.style.display !== 'none') {
            document.getElementById('progress-cancel').click();
        }
    }
}
