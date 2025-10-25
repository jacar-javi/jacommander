// spacebar-select.js - Spacebar selection with folder size calculation
export class SpacebarSelect {
    constructor(app) {
        this.app = app;
        this.calculating = new Set(); // Track folders being calculated
        this.sizeCache = new Map(); // Cache calculated sizes
        this.bindKeyboardHandler();
    }

    bindKeyboardHandler() {
        document.addEventListener('keydown', async (e) => {
            // Check if spacebar is pressed and not in an input field
            if (e.code === 'Space' && !this.isInputFocused()) {
                e.preventDefault();
                await this.handleSpacebarPress();
            }
        });
    }

    isInputFocused() {
        const activeElement = document.activeElement;
        return (
            activeElement &&
            (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true')
        );
    }

    async handleSpacebarPress() {
        const panel = this.app.focusedPanel === 'right' ? this.app.rightPanel : this.app.leftPanel;
        if (!panel) {return;}

        const selectedFile = panel.getCurrentFile();
        if (!selectedFile) {return;}

        // Toggle selection
        const isSelected = panel.toggleFileSelection(selectedFile);

        // If it's a folder and was just selected, calculate its size
        if (selectedFile.isDir && isSelected) {
            await this.calculateFolderSize(selectedFile, panel);
        }

        // Update UI to show selection
        this.updateFileDisplay(selectedFile, panel, isSelected);

        // Move to next item (like Insert key behavior)
        panel.moveToNextFile();
    }

    async calculateFolderSize(folder, panel) {
        const folderPath = folder.path;

        // Check if already calculating
        if (this.calculating.has(folderPath)) {return;}

        // Check cache first
        if (this.sizeCache.has(folderPath)) {
            const cachedSize = this.sizeCache.get(folderPath);
            this.displayFolderSize(folder, cachedSize, panel);
            return;
        }

        // Mark as calculating
        this.calculating.add(folderPath);

        // Show loading indicator
        this.showCalculatingIndicator(folder, panel);

        try {
            // Call backend API to calculate folder size
            const response = await fetch('/api/folder-size', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: folderPath,
                    storageId: panel.storageId || 'local'
                })
            });

            if (response.ok) {
                const data = await response.json();
                const size = data.size || 0;
                const fileCount = data.fileCount || 0;
                const folderCount = data.folderCount || 0;

                // Cache the result
                const sizeInfo = { size, fileCount, folderCount };
                this.sizeCache.set(folderPath, sizeInfo);

                // Display the size
                this.displayFolderSize(folder, sizeInfo, panel);
            }
        } catch (error) {
            console.error('Error calculating folder size:', error);
            this.showSizeError(folder, panel);
        } finally {
            this.calculating.delete(folderPath);
        }
    }

    showCalculatingIndicator(folder, panel) {
        const fileRow = this.findFileRow(folder, panel);
        if (!fileRow) {return;}

        const sizeCell = fileRow.querySelector('.file-size');
        if (sizeCell) {
            sizeCell.innerHTML = `
                <span class="size-calculating">
                    <span class="spinner">⏳</span>
                    Calculating...
                </span>
            `;
        }
    }

    displayFolderSize(folder, sizeInfo, panel) {
        const fileRow = this.findFileRow(folder, panel);
        if (!fileRow) {return;}

        const sizeCell = fileRow.querySelector('.file-size');
        if (sizeCell) {
            const formattedSize = this.formatSize(sizeInfo.size);
            const tooltip = `${sizeInfo.fileCount} files, ${sizeInfo.folderCount} folders`;

            sizeCell.innerHTML = `
                <span class="folder-size calculated" title="${tooltip}">
                    <span class="size-value">${formattedSize}</span>
                    <span class="size-details">
                        (${sizeInfo.fileCount}f, ${sizeInfo.folderCount}d)
                    </span>
                </span>
            `;
        }
    }

    showSizeError(folder, panel) {
        const fileRow = this.findFileRow(folder, panel);
        if (!fileRow) {return;}

        const sizeCell = fileRow.querySelector('.file-size');
        if (sizeCell) {
            sizeCell.innerHTML = '<span class="size-error">Error</span>';
        }
    }

    findFileRow(file, panel) {
        const panelElement = panel.container;
        const rows = panelElement.querySelectorAll('.file-row');

        for (const row of rows) {
            if (row.dataset.path === file.path) {
                return row;
            }
        }
        return null;
    }

    updateFileDisplay(file, panel, isSelected) {
        const fileRow = this.findFileRow(file, panel);
        if (!fileRow) {return;}

        // Update checkbox
        const checkbox = fileRow.querySelector('.file-select-checkbox');
        if (checkbox) {
            checkbox.checked = isSelected;
        }

        // Update row style
        if (isSelected) {
            fileRow.classList.add('selected');
        } else {
            fileRow.classList.remove('selected');

            // If deselected, clear cached size for folders
            if (file.isDir) {
                const sizeCell = fileRow.querySelector('.file-size');
                if (sizeCell && sizeCell.querySelector('.calculated')) {
                    sizeCell.innerHTML = '<span class="folder-size">--</span>';
                }
            }
        }

        // Update selection count
        this.updateSelectionCount(panel);
    }

    updateSelectionCount(panel) {
        const selectedCount = panel.selectedFiles.size;
        let totalSize = 0;

        // Calculate total size of selected items
        for (const file of panel.selectedFiles) {
            if (file.isDir && this.sizeCache.has(file.path)) {
                totalSize += this.sizeCache.get(file.path).size;
            } else if (!file.isDir) {
                totalSize += file.size || 0;
            }
        }

        // Update footer
        const footer = panel.container.querySelector('.panel-footer');
        if (footer) {
            const countElement = footer.querySelector('.selected-count');
            const sizeElement = footer.querySelector('.selected-size');

            if (countElement) {
                countElement.textContent = `${selectedCount} selected`;
            }

            if (sizeElement || selectedCount > 0) {
                const formattedSize = this.formatSize(totalSize);
                if (!sizeElement) {
                    // Create size element if it doesn't exist
                    const sizeSpan = document.createElement('span');
                    sizeSpan.className = 'selected-size';
                    sizeSpan.textContent = ` (${formattedSize})`;
                    countElement.parentNode.insertBefore(sizeSpan, countElement.nextSibling);
                } else {
                    sizeElement.textContent = ` (${formattedSize})`;
                }
            }
        }
    }

    formatSize(bytes) {
        if (bytes === 0) {return '0 B';}

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
    }

    // Clear cache for a specific path
    clearCache(path) {
        this.sizeCache.delete(path);

        // Also clear child paths
        for (const [cachedPath] of this.sizeCache) {
            if (cachedPath.startsWith(`${path}/`)) {
                this.sizeCache.delete(cachedPath);
            }
        }
    }

    // Clear all cached sizes
    clearAllCache() {
        this.sizeCache.clear();
    }

    // Get cached size for a path
    getCachedSize(path) {
        return this.sizeCache.get(path);
    }
}

// CSS styles for the spacebar selection feature
export const spacebarSelectStyles = `
    .size-calculating {
        color: var(--text-secondary);
        font-style: italic;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .size-calculating .spinner {
        animation: spin 1s linear infinite;
        display: inline-block;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .folder-size.calculated {
        color: var(--primary-color);
        font-weight: 500;
    }

    .size-details {
        font-size: 0.85em;
        color: var(--text-secondary);
        margin-left: 4px;
    }

    .size-error {
        color: var(--danger-color);
        font-style: italic;
    }

    .file-row.selected {
        background: var(--selected-bg) !important;
    }

    .selected-size {
        color: var(--primary-color);
        font-weight: 500;
    }

    /* Visual feedback for spacebar press */
    .file-row.spacebar-pressed {
        animation: spacebarPulse 0.3s ease;
    }

    @keyframes spacebarPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); background: var(--primary-bg-light); }
        100% { transform: scale(1); }
    }
`;

export default SpacebarSelect;
