// Panel Management Module
import { FilePreview } from './preview.js';
import { DragDropManager } from './dragdrop.js';
import { BreadcrumbNav } from './breadcrumb.js';
import { FileUploader } from './upload.js';
import { TabManager } from './tabs.js';

export class PanelManager {
    constructor(app) {
        this.app = app;
        this.filePreview = new FilePreview(app);
        this.dragDropManager = new DragDropManager(app);
        this.breadcrumbNav = new BreadcrumbNav(app);
        this.fileUploader = new FileUploader(app);
        this.tabManager = new TabManager(app);
        this.panels = {
            left: {
                storage: null,
                currentPath: '/',
                files: [],
                selectedFiles: new Set(),
                focusedIndex: 0
            },
            right: {
                storage: null,
                currentPath: '/',
                files: [],
                selectedFiles: new Set(),
                focusedIndex: 0
            }
        };
    }

    async initializePanels(storageId) {
        // Try to restore session
        const savedSession = this.loadSession();

        if (savedSession) {
            // Restore saved session
            const leftStorage = savedSession.left.storage || storageId;
            const rightStorage = savedSession.right.storage || storageId;
            const leftPath = savedSession.left.path || '/';
            const rightPath = savedSession.right.path || '/';

            await this.changeStorage('left', leftStorage);
            await this.loadDirectory('left', leftPath);

            await this.changeStorage('right', rightStorage);
            await this.loadDirectory('right', rightPath);

            // Restore active panel
            this.app.setActivePanel(savedSession.activePanel || 'left');
        } else {
            // Initialize both panels with the same storage
            await this.changeStorage('left', storageId);
            await this.changeStorage('right', storageId);

            // Set left panel as active
            this.app.setActivePanel('left');
        }
    }

    saveSession() {
        const session = {
            left: {
                storage: this.panels.left.storage,
                path: this.panels.left.currentPath
            },
            right: {
                storage: this.panels.right.storage,
                path: this.panels.right.currentPath
            },
            activePanel: this.app.getActivePanel(),
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('jacommander-session', JSON.stringify(session));
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    loadSession() {
        try {
            const sessionData = localStorage.getItem('jacommander-session');
            if (sessionData) {
                const session = JSON.parse(sessionData);

                // Check if session is not too old (24 hours)
                const dayInMs = 24 * 60 * 60 * 1000;
                if (Date.now() - session.timestamp < dayInMs) {
                    return session;
                }
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        return null;
    }

    clearSession() {
        try {
            localStorage.removeItem('jacommander-session');
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    async changeStorage(panel, storageId) {
        this.panels[panel].storage = storageId;
        this.panels[panel].currentPath = '/';
        this.panels[panel].selectedFiles.clear();

        // Emit storage changed event for breadcrumb
        document.dispatchEvent(
            new CustomEvent('storageChanged', {
                detail: {
                    panel,
                    path: '/',
                    storage: storageId
                }
            })
        );

        await this.loadDirectory(panel, '/');
    }

    async loadDirectory(panel, path) {
        const panelData = this.panels[panel];

        // Show loading state
        this.showLoading(panel, true);

        try {
            const response = await fetch(`/api/fs/list?storage=${panelData.storage}&path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (data.success) {
                panelData.files = data.data.files || [];
                panelData.currentPath = path;
                panelData.selectedFiles.clear();
                panelData.focusedIndex = 0;

                // Update tab manager
                if (this.tabManager) {
                    this.tabManager.updateCurrentTabPath(panel, path);
                }

                // Update UI
                this.renderFileList(panel);
                this.updatePanelInfo(panel, data.data);

                // Update path input
                document.getElementById(`path-${panel}`).value = path;

                // Emit path changed event for breadcrumb
                document.dispatchEvent(
                    new CustomEvent('pathChanged', {
                        detail: {
                            panel,
                            path: panelData.currentPath,
                            storage: panelData.storage
                        }
                    })
                );

                // Save session after successful navigation
                this.saveSession();
            } else {
                throw new Error(data.error?.message || 'Failed to load directory');
            }
        } catch (error) {
            console.error(`Failed to load directory for ${panel} panel:`, error);
            this.app.showNotification(`Failed to load directory: ${error.message}`, 'error');
        } finally {
            this.showLoading(panel, false);
        }
    }

    renderFileList(panel) {
        const tbody = document.getElementById(`files-${panel}`);
        const panelData = this.panels[panel];

        // Clear existing content
        tbody.innerHTML = '';

        // Add parent directory entry if not at root
        if (panelData.currentPath !== '/') {
            const parentRow = this.createFileRow(
                panel,
                {
                    name: '..',
                    is_dir: true,
                    size: 0,
                    modified: '',
                    isParent: true
                },
                -1
            );
            tbody.appendChild(parentRow);
        }

        // Sort files: directories first, then files, alphabetically
        const sortedFiles = [...panelData.files].sort((a, b) => {
            if (a.is_dir !== b.is_dir) {
                return b.is_dir ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
        });

        // Add file entries
        sortedFiles.forEach((file, index) => {
            const row = this.createFileRow(panel, file, index);
            tbody.appendChild(row);
        });

        // If empty directory
        if (sortedFiles.length === 0 && panelData.currentPath === '/') {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="4" class="empty-state">Empty directory</td>';
            tbody.appendChild(emptyRow);
        }

        // Notify drag drop manager to attach handlers
        document.dispatchEvent(new CustomEvent('panelRefreshed', { detail: { panel } }));
        this.dragDropManager.attachPanelHandlers(panel);
    }

    createFileRow(panel, file, index) {
        const row = document.createElement('tr');
        row.dataset.index = index;
        row.dataset.name = file.name;

        const isSelected = this.panels[panel].selectedFiles.has(file.name);
        if (isSelected) {
            row.classList.add('selected');
        }

        // Checkbox cell
        const checkCell = document.createElement('td');
        checkCell.className = 'col-select';
        if (!file.isParent) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'file-checkbox';
            checkbox.checked = isSelected;
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleSelection(panel, file.name);
            });
            checkCell.appendChild(checkbox);
        }
        row.appendChild(checkCell);

        // Name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'col-name';

        const fileEntry = document.createElement('div');
        fileEntry.className = 'file-entry';

        // Add icon based on type
        const icon = document.createElement('span');
        icon.className = 'file-icon';
        icon.textContent = file.is_dir ? '📁' : this.getFileIcon(file.name);
        fileEntry.appendChild(icon);

        // Add name
        const nameSpan = document.createElement('span');
        nameSpan.className = file.is_dir ? 'folder-name' : 'file-regular';
        nameSpan.textContent = file.name;
        fileEntry.appendChild(nameSpan);

        nameCell.appendChild(fileEntry);
        row.appendChild(nameCell);

        // Size cell
        const sizeCell = document.createElement('td');
        sizeCell.className = 'col-size';
        sizeCell.textContent = file.is_dir ? '-' : this.app.formatFileSize(file.size);
        row.appendChild(sizeCell);

        // Modified cell
        const modifiedCell = document.createElement('td');
        modifiedCell.className = 'col-modified';
        modifiedCell.textContent = file.isParent ? '' : this.app.formatDate(file.modified);
        row.appendChild(modifiedCell);

        // Event listeners
        row.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                this.handleFileClick(panel, file, index, e);
            }
        });

        row.addEventListener('dblclick', () => {
            this.handleFileDoubleClick(panel, file);
        });

        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleFileRightClick(panel, file, e);
        });

        // Attach file preview on hover (only for files, not directories or parent)
        if (!file.isParent && !file.is_dir) {
            this.filePreview.attachToFileItem(row, file, panel);
        }

        return row;
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            // Archives
            zip: '📦',
            tar: '📦',
            gz: '📦',
            '7z': '📦',
            rar: '📦',
            // Images
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            svg: '🖼️',
            // Documents
            pdf: '📄',
            doc: '📄',
            docx: '📄',
            txt: '📄',
            md: '📄',
            // Code
            js: '📜',
            ts: '📜',
            jsx: '📜',
            tsx: '📜',
            html: '📜',
            css: '📜',
            go: '📜',
            py: '📜',
            java: '📜',
            c: '📜',
            // Media
            mp3: '🎵',
            mp4: '🎬',
            avi: '🎬',
            mkv: '🎬',
            // Config
            json: '⚙️',
            xml: '⚙️',
            yml: '⚙️',
            yaml: '⚙️',
            ini: '⚙️'
        };

        return iconMap[ext] || '📄';
    }

    handleFileClick(panel, file, index, event) {
        this.app.setActivePanel(panel);
        const panelData = this.panels[panel];

        if (event.ctrlKey || event.metaKey) {
            // Toggle selection
            this.toggleSelection(panel, file.name);
        } else if (event.shiftKey) {
            // Range selection
            this.selectRange(panel, panelData.focusedIndex, index);
        } else {
            // Single selection
            panelData.selectedFiles.clear();
            if (!file.isParent) {
                panelData.selectedFiles.add(file.name);
            }
            panelData.focusedIndex = index;
            this.updateSelectionUI(panel);
        }
    }

    handleFileDoubleClick(panel, file) {
        if (file.is_dir) {
            let newPath;
            if (file.isParent) {
                // Go to parent directory
                const parts = this.panels[panel].currentPath.split('/').filter((p) => p);
                parts.pop();
                newPath = `/${parts.join('/')}`;
            } else {
                // Enter directory
                newPath = this.panels[panel].currentPath;
                if (!newPath.endsWith('/')) {
                    newPath += '/';
                }
                newPath += file.name;
            }
            this.loadDirectory(panel, newPath);
        } else {
            // View file
            this.app.fileOps.viewFile(panel, file);
        }
    }

    handleFileRightClick(panel, file, event) {
        event.preventDefault();
        event.stopPropagation();

        // Select the file if not already selected
        if (!file.isParent && !this.panels[panel].selectedFiles.has(file.name)) {
            this.panels[panel].selectedFiles.clear();
            this.panels[panel].selectedFiles.add(file.name);
            this.updateSelectionUI(panel);
        }

        // Show context menu
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;

        // Store context for menu actions
        contextMenu.dataset.panel = panel;
        contextMenu.dataset.fileName = file.name;
        contextMenu.dataset.isDir = file.is_dir;

        // Hide certain options for directories
        const editItem = contextMenu.querySelector('[data-action="edit"]');
        if (editItem) {
            editItem.style.display = file.is_dir ? 'none' : 'block';
        }

        // Setup menu item handlers
        this.setupContextMenuHandlers(panel, file);

        // Hide menu on click outside
        const hideMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
                document.removeEventListener('click', hideMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', hideMenu), 100);
    }

    setupContextMenuHandlers(panel, file) {
        const contextMenu = document.getElementById('context-menu');
        const items = contextMenu.querySelectorAll('.context-menu-item');

        items.forEach((item) => {
            // Clone to remove old event listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);

            newItem.addEventListener('click', () => {
                const action = newItem.dataset.action;
                contextMenu.style.display = 'none';

                switch (action) {
                    case 'view':
                        if (!file.is_dir) {
                            window.app.fileOps.viewFile(panel, file);
                        }
                        break;
                    case 'edit':
                        if (!file.is_dir) {
                            window.app.fileOps.editFile(panel, file);
                        }
                        break;
                    case 'copy':
                        window.app.fileOps.copyFiles(panel);
                        break;
                    case 'move':
                        window.app.fileOps.moveFiles(panel);
                        break;
                    case 'rename':
                        window.app.fileOps.renameFile(panel);
                        break;
                    case 'compress':
                        window.app.fileOps.compressFiles(panel);
                        break;
                    case 'delete':
                        window.app.fileOps.deleteFiles(panel);
                        break;
                }
            });
        });
    }

    toggleSelection(panel, filename) {
        const panelData = this.panels[panel];

        if (panelData.selectedFiles.has(filename)) {
            panelData.selectedFiles.delete(filename);
        } else {
            panelData.selectedFiles.add(filename);
        }

        this.updateSelectionUI(panel);
    }

    selectRange(panel, fromIndex, toIndex) {
        const panelData = this.panels[panel];
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);

        panelData.selectedFiles.clear();

        for (let i = start; i <= end; i++) {
            if (i >= 0 && i < panelData.files.length) {
                panelData.selectedFiles.add(panelData.files[i].name);
            }
        }

        this.updateSelectionUI(panel);
    }

    selectAll(panel) {
        const panelData = this.panels[panel];
        panelData.files.forEach((file) => {
            panelData.selectedFiles.add(file.name);
        });
        this.updateSelectionUI(panel);
    }

    deselectAll(panel) {
        const panelData = this.panels[panel];
        panelData.selectedFiles.clear();
        this.updateSelectionUI(panel);
    }

    updateSelectionUI(panel) {
        const tbody = document.getElementById(`files-${panel}`);
        const panelData = this.panels[panel];

        // Update row selection state
        tbody.querySelectorAll('tr').forEach((row) => {
            const filename = row.dataset.name;
            const isSelected = panelData.selectedFiles.has(filename);
            row.classList.toggle('selected', isSelected);

            const checkbox = row.querySelector('.file-checkbox');
            if (checkbox) {
                checkbox.checked = isSelected;
            }
        });

        // Update selection count
        const count = panelData.selectedFiles.size;
        document.getElementById(`selected-count-${panel}`).textContent =
            count === 0 ? '0 selected' : `${count} selected`;
    }

    updatePanelInfo(panel, data) {
        // Update item count
        const itemCount = data.files ? data.files.length : 0;
        document.getElementById(`item-count-${panel}`).textContent =
            `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

        // Update space info
        const spaceInfo = document.getElementById(`space-info-${panel}`);
        if (data.available && data.total) {
            const available = this.app.formatFileSize(data.available);
            const total = this.app.formatFileSize(data.total);
            spaceInfo.textContent = `${available} / ${total}`;
        } else {
            spaceInfo.textContent = '-- / --';
        }
    }

    showLoading(panel, show) {
        const tbody = document.getElementById(`files-${panel}`);

        if (show) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-state">
                        <div class="spinner"></div>
                        Loading...
                    </td>
                </tr>
            `;
        }
    }

    navigateUp(panel) {
        const panelData = this.panels[panel];
        if (panelData.focusedIndex > 0) {
            panelData.focusedIndex--;
            this.updateFocus(panel);
        }
    }

    navigateDown(panel) {
        const panelData = this.panels[panel];
        if (panelData.focusedIndex < panelData.files.length - 1) {
            panelData.focusedIndex++;
            this.updateFocus(panel);
        }
    }

    updateFocus(panel) {
        const tbody = document.getElementById(`files-${panel}`);
        const rows = tbody.querySelectorAll('tr');

        rows.forEach((row, index) => {
            row.classList.toggle('focused', index === this.panels[panel].focusedIndex);
        });

        // Scroll into view if needed
        if (rows[this.panels[panel].focusedIndex]) {
            rows[this.panels[panel].focusedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    getCurrentPath(panel) {
        return this.panels[panel].currentPath;
    }

    getCurrentStorage(panel) {
        return this.panels[panel].storage;
    }

    getSelectedFiles(panel) {
        return Array.from(this.panels[panel].selectedFiles);
    }

    refresh(panel) {
        const currentPath = this.panels[panel].currentPath;
        this.loadDirectory(panel, currentPath);
    }

    refreshBoth() {
        this.refresh('left');
        this.refresh('right');
    }
}
