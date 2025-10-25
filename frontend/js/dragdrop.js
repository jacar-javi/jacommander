/**
 * Drag and Drop Module
 * Handles file drag and drop operations between panels
 */

export class DragDropManager {
    constructor(app) {
        this.app = app;
        this.draggedFiles = [];
        this.sourcePanel = null;
        this.draggedElement = null;
        this.dropTarget = null;
        this.dragImage = null;
        this.isDragging = false;

        this.init();
    }

    init() {
        // Create custom drag image element
        this.createDragImage();

        // Setup global drop zone handlers
        this.setupGlobalHandlers();

        // Listen for panel updates to reattach handlers
        document.addEventListener('panelRefreshed', (e) => {
            this.attachPanelHandlers(e.detail.panel);
        });
    }

    createDragImage() {
        this.dragImage = document.createElement('div');
        this.dragImage.className = 'drag-image';
        this.dragImage.style.position = 'absolute';
        this.dragImage.style.top = '-1000px';
        this.dragImage.style.left = '-1000px';
        this.dragImage.style.zIndex = '10000';
        this.dragImage.style.pointerEvents = 'none';
        document.body.appendChild(this.dragImage);
    }

    setupGlobalHandlers() {
        // Prevent default drag behaviors
        document.addEventListener('dragover', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                e.dataTransfer.dropEffect = this.getDropEffect(e);
            }
        });

        document.addEventListener('drop', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.handleDrop(e);
            }
        });

        document.addEventListener('dragend', (e) => {
            this.cleanup();
        });

        // Handle keyboard modifiers for copy/move
        document.addEventListener('keydown', (e) => {
            if (this.isDragging) {
                this.updateDropEffect(e);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.isDragging) {
                this.updateDropEffect(e);
            }
        });
    }

    /**
     * Attach drag and drop handlers to a panel
     */
    attachPanelHandlers(panel) {
        const tbody = document.getElementById(`files-${panel}`);
        if (!tbody) {return;}

        // Make file rows draggable
        tbody.querySelectorAll('tr').forEach((row) => {
            this.attachToFileRow(row, panel);
        });

        // Setup drop zone for the panel
        this.setupPanelDropZone(panel);
    }

    /**
     * Attach drag handlers to a file row
     */
    attachToFileRow(row, panel) {
        const fileName = row.dataset.name;
        if (!fileName || fileName === '..') {return;}

        // Make row draggable
        row.draggable = true;
        row.classList.add('draggable');

        // Drag start
        row.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, panel, row);
        });

        // Drag over (for folder targets)
        row.addEventListener('dragover', (e) => {
            const file = this.getFileFromRow(row, panel);
            if (file && file.is_dir) {
                e.preventDefault();
                e.stopPropagation();
                this.handleDragOver(e, row, panel);
            }
        });

        // Drag enter
        row.addEventListener('dragenter', (e) => {
            const file = this.getFileFromRow(row, panel);
            if (file && file.is_dir && this.isDragging) {
                row.classList.add('drag-over');
            }
        });

        // Drag leave
        row.addEventListener('dragleave', (e) => {
            if (!row.contains(e.relatedTarget)) {
                row.classList.remove('drag-over');
            }
        });

        // Drop on folder
        row.addEventListener('drop', (e) => {
            const file = this.getFileFromRow(row, panel);
            if (file && file.is_dir && this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this.handleDropOnFolder(e, panel, file);
                row.classList.remove('drag-over');
            }
        });
    }

    /**
     * Setup drop zone for entire panel
     */
    setupPanelDropZone(panel) {
        const panelElement = document.querySelector(`[data-panel="${panel}"]`);
        if (!panelElement) {return;}

        // Drag over panel
        panelElement.addEventListener('dragover', (e) => {
            if (this.isDragging && this.sourcePanel !== panel) {
                e.preventDefault();
                panelElement.classList.add('drop-target');
            }
        });

        // Drag leave panel
        panelElement.addEventListener('dragleave', (e) => {
            if (!panelElement.contains(e.relatedTarget)) {
                panelElement.classList.remove('drop-target');
            }
        });

        // Drop on panel
        panelElement.addEventListener('drop', (e) => {
            if (this.isDragging && this.sourcePanel !== panel) {
                e.preventDefault();
                panelElement.classList.remove('drop-target');
                this.handleDropOnPanel(e, panel);
            }
        });
    }

    /**
     * Handle drag start
     */
    handleDragStart(e, panel, row) {
        this.sourcePanel = panel;
        this.draggedElement = row;
        this.isDragging = true;

        const panelData = this.app.panels.panels[panel];
        const fileName = row.dataset.name;

        // Get selected files or just the dragged file
        if (panelData.selectedFiles.has(fileName)) {
            this.draggedFiles = Array.from(panelData.selectedFiles)
                .map((name) => panelData.files.find((f) => f.name === name))
                .filter(Boolean);
        } else {
            const file = this.getFileFromRow(row, panel);
            if (file) {
                this.draggedFiles = [file];
            }
        }

        // Update drag image
        this.updateDragImage();
        e.dataTransfer.setDragImage(this.dragImage, 10, 10);

        // Set drag data
        e.dataTransfer.effectAllowed = 'copyMove';
        // Mark as internal drag to distinguish from external file drops
        e.dataTransfer.setData('text/plain', `internal:${this.draggedFiles.map((f) => f.name).join('\n')}`);

        // Add dragging class
        document.body.classList.add('dragging');
        row.classList.add('dragging-source');
    }

    /**
     * Handle drag over
     */
    handleDragOver(e, element, panel) {
        if (!this.isDragging) {return;}

        e.preventDefault();
        e.dataTransfer.dropEffect = this.getDropEffect(e);

        // Show drop indicator
        const rect = element.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
            element.classList.add('drop-before');
            element.classList.remove('drop-after');
        } else {
            element.classList.add('drop-after');
            element.classList.remove('drop-before');
        }
    }

    /**
     * Handle drop on panel
     */
    async handleDropOnPanel(e, targetPanel) {
        const targetPath = this.app.panels.getCurrentPath(targetPanel);
        const operation = this.getDropEffect(e);

        await this.performFileOperation(operation, targetPath, targetPanel);
    }

    /**
     * Handle drop on folder
     */
    async handleDropOnFolder(e, targetPanel, targetFolder) {
        const panelPath = this.app.panels.getCurrentPath(targetPanel);
        const targetPath = `${panelPath}/${targetFolder.name}`;
        const operation = this.getDropEffect(e);

        await this.performFileOperation(operation, targetPath, targetPanel);
    }

    /**
     * Perform file operation (copy or move)
     */
    async performFileOperation(operation, targetPath, targetPanel) {
        const sourceStorage = this.app.panels.getCurrentStorage(this.sourcePanel);
        const targetStorage = this.app.panels.getCurrentStorage(targetPanel);
        const sourcePath = this.app.panels.getCurrentPath(this.sourcePanel);

        const filePaths = this.draggedFiles.map((file) => ({
            name: file.name,
            source: `${sourcePath}/${file.name}`.replace('//', '/'),
            target: `${targetPath}/${file.name}`.replace('//', '/')
        }));

        try {
            // Show progress notification
            const action = operation === 'copy' ? 'Copying' : 'Moving';
            this.app.showNotification(`${action} ${filePaths.length} file(s)...`, 'info');

            // Perform operation
            const endpoint = operation === 'copy' ? '/api/fs/copy' : '/api/fs/move';

            for (const file of filePaths) {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source_storage: sourceStorage,
                        target_storage: targetStorage,
                        source_path: file.source,
                        target_path: file.target
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || `Failed to ${operation} ${file.name}`);
                }
            }

            // Success notification
            this.app.showNotification(
                `Successfully ${operation === 'copy' ? 'copied' : 'moved'} ${filePaths.length} file(s)`,
                'success'
            );

            // Refresh panels
            this.app.panels.refresh(this.sourcePanel);
            if (targetPanel !== this.sourcePanel) {
                this.app.panels.refresh(targetPanel);
            }
        } catch (error) {
            console.error(`Failed to ${operation} files:`, error);
            this.app.showNotification(`Failed to ${operation} files: ${error.message}`, 'error');
        }
    }

    /**
     * Get file data from row
     */
    getFileFromRow(row, panel) {
        const fileName = row.dataset.name;
        if (!fileName) {return null;}

        const panelData = this.app.panels.panels[panel];
        return panelData.files.find((f) => f.name === fileName);
    }

    /**
     * Get drop effect based on keyboard modifiers
     */
    getDropEffect(e) {
        // Ctrl/Cmd = copy, default = move
        return e.ctrlKey || e.metaKey ? 'copy' : 'move';
    }

    /**
     * Update drop effect indicator
     */
    updateDropEffect(e) {
        const panels = document.querySelectorAll('[data-panel]');
        panels.forEach((panel) => {
            if (panel.classList.contains('drop-target')) {
                const effect = this.getDropEffect(e);
                panel.dataset.dropEffect = effect;
            }
        });
    }

    /**
     * Update custom drag image
     */
    updateDragImage() {
        const count = this.draggedFiles.length;
        const names = this.draggedFiles
            .slice(0, 3)
            .map((f) => {
                const icon = f.is_dir ? '📁' : this.getFileIcon(f.name);
                return `<div class="drag-item">${icon} ${f.name}</div>`;
            })
            .join('');

        const more = count > 3 ? `<div class="drag-more">... and ${count - 3} more</div>` : '';

        this.dragImage.innerHTML = `
            <div class="drag-content">
                <div class="drag-count">${count} item${count > 1 ? 's' : ''}</div>
                ${names}
                ${more}
            </div>
        `;
    }

    /**
     * Get file icon
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            js: '📜',
            ts: '📘',
            json: '📋',
            html: '🌐',
            css: '🎨',
            py: '🐍',
            go: '🐹',
            zip: '📦',
            tar: '📦',
            jpg: '🖼️',
            png: '🖼️',
            pdf: '📄',
            txt: '📝'
        };
        return iconMap[ext] || '📄';
    }

    /**
     * Cleanup after drag operation
     */
    cleanup() {
        this.isDragging = false;
        this.draggedFiles = [];
        this.sourcePanel = null;
        this.draggedElement = null;

        // Remove classes
        document.body.classList.remove('dragging');
        document.querySelectorAll('.dragging-source').forEach((el) => {
            el.classList.remove('dragging-source');
        });
        document.querySelectorAll('.drag-over').forEach((el) => {
            el.classList.remove('drag-over');
        });
        document.querySelectorAll('.drop-target').forEach((el) => {
            el.classList.remove('drop-target');
        });
        document.querySelectorAll('.drop-before, .drop-after').forEach((el) => {
            el.classList.remove('drop-before', 'drop-after');
        });

        // Clear drag image
        this.dragImage.innerHTML = '';
    }

    /**
     * Handle external file drop (for upload)
     */
    handleExternalDrop(e, panel) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0) {
            // This will be handled by the upload module
            const event = new CustomEvent('filesDropped', {
                detail: { files, panel }
            });
            document.dispatchEvent(event);
        }
    }
}
