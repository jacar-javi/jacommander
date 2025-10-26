/**
 * Table Enhancements Module
 * Adds select-all checkbox and column sorting functionality
 */

export class TableEnhancements {
    constructor(app) {
        this.app = app;
        this.sortState = {
            left: { column: null, direction: null },
            right: { column: null, direction: null }
        };
        this.init();
    }

    init() {
        // Setup event listeners for both panels after directory loads
        ['left', 'right'].forEach((panel) => {
            this.setupSelectAllCheckbox(panel);
            this.setupColumnSorting(panel);
        });

        // Re-setup when panel refreshes (directory loads)
        document.addEventListener('panelRefreshed', (e) => {
            this.setupSelectAllCheckbox(e.detail.panel);
            this.setupColumnSorting(e.detail.panel);
        });
    }

    /**
     * Setup select-all checkbox in table header
     */
    setupSelectAllCheckbox(panel) {
        const table = document.getElementById(`file-list-${panel}`);
        const checkbox = table?.querySelector('.select-all-checkbox');

        if (!checkbox) {return;}

        // Skip if already set up (prevent duplicate listeners)
        if (checkbox.dataset.selectAllSetup === 'true') {return;}

        checkbox.dataset.selectAllSetup = 'true';

        // Add event listener
        checkbox.addEventListener('change', (e) => {
            this.handleSelectAll(panel, e.target.checked);
        });

        // Update checkbox state when selection changes
        document.addEventListener('selectionChanged', (e) => {
            if (e.detail.panel === panel) {
                this.updateSelectAllCheckbox(panel);
            }
        });
    }

    /**
     * Handle select/deselect all files
     */
    handleSelectAll(panel, checked) {
        const panelData = this.app.panels.panels[panel];

        if (!panelData || !panelData.files) {
            console.warn('Panel data not initialized yet');
            return;
        }

        if (checked) {
            // Select all files - use filenames instead of indexes
            panelData.files.forEach((file) => {
                panelData.selectedFiles.add(file.name);
            });
        } else {
            // Deselect all files
            panelData.selectedFiles.clear();
        }

        // Update UI
        this.app.panels.updateSelectionUI(panel);
        this.app.panels.updatePanelInfo(panel);
    }

    /**
     * Update select-all checkbox state
     */
    updateSelectAllCheckbox(panel) {
        const table = document.getElementById(`file-list-${panel}`);
        const checkbox = table?.querySelector('.select-all-checkbox');

        if (!checkbox) {return;}

        const panelData = this.app.panels.panels[panel];
        if (!panelData || !panelData.files) {return;}

        const totalFiles = panelData.files.length;
        const selectedCount = panelData.selectedFiles.size;

        if (selectedCount === 0) {
            checkbox.checked = false;
            checkbox.indeterminate = false;
        } else if (selectedCount === totalFiles) {
            checkbox.checked = true;
            checkbox.indeterminate = false;
        } else {
            checkbox.checked = false;
            checkbox.indeterminate = true;
        }
    }

    /**
     * Setup column sorting
     */
    setupColumnSorting(panel) {
        const table = document.getElementById(`file-list-${panel}`);
        const headers = table.querySelectorAll('th');

        headers.forEach((header, index) => {
            // Skip the checkbox column
            if (index === 0) {return;}

            // Skip if already set up (prevent duplicate listeners)
            if (header.dataset.sortingSetup === 'true') {return;}

            header.classList.add('sortable');
            header.dataset.sortingSetup = 'true';

            header.addEventListener('click', () => {
                const column = this.getColumnName(index);
                this.sortByColumn(panel, column, header);
            });
        });
    }

    /**
     * Get column name from index
     */
    getColumnName(index) {
        const columns = ['select', 'name', 'size', 'modified'];
        return columns[index] || null;
    }

    /**
     * Sort files by column
     */
    sortByColumn(panel, column, headerElement) {
        const currentSort = this.sortState[panel];

        // Determine sort direction
        let direction = 'asc';
        if (currentSort.column === column && currentSort.direction === 'asc') {
            direction = 'desc';
        }

        // Update sort state
        this.sortState[panel] = { column, direction };

        // Remove sort indicators from all headers
        const table = document.getElementById(`file-list-${panel}`);
        table.querySelectorAll('th').forEach((th) => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });

        // Add sort indicator to current header
        headerElement.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');

        // Apply the sort
        this.applySortToPanel(panel);

        // Re-render the file list
        this.app.panels.renderFileList(panel);

        // Restore selection and focus
        this.app.panels.updateSelectionUI(panel);
        this.app.panels.updateFocus(panel);
    }

    /**
     * Apply current sort state to panel's files (or default name sort if no sort state)
     */
    applySortToPanel(panel) {
        const panelData = this.app.panels.panels[panel];
        const currentSort = this.sortState[panel];

        // Use default sort (name ascending) if no sort state
        const column = currentSort.column || 'name';
        const direction = currentSort.direction || 'asc';

        // Sort the files array: directories first, then files, sorted by column
        const files = [...panelData.files];
        files.sort((a, b) => {
            // First, ensure directories come before files
            if (a.is_dir !== b.is_dir) {
                return b.is_dir ? 1 : -1; // directories (true) before files (false)
            }

            // Then sort by the selected column within each group
            let comparison = 0;

            switch (column) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
                case 'modified': {
                    const dateA = new Date(a.modified || 0);
                    const dateB = new Date(b.modified || 0);
                    comparison = dateA - dateB;
                    break;
                }
            }

            return direction === 'asc' ? comparison : -comparison;
        });

        // Update panel data
        panelData.files = files;
    }

    /**
     * Update sort indicators in table header
     */
    updateSortIndicators(panel) {
        const currentSort = this.sortState[panel];

        // Remove sort indicators from all headers
        const table = document.getElementById(`file-list-${panel}`);
        if (!table) {return;}

        table.querySelectorAll('th').forEach((th) => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });

        // Add sort indicator to current header if there's an active sort
        if (currentSort.column) {
            const columnIndex = this.getColumnIndex(currentSort.column);
            const header = table.querySelectorAll('th')[columnIndex];
            if (header) {
                header.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        }
    }

    /**
     * Get column index from name
     */
    getColumnIndex(column) {
        const columns = ['select', 'name', 'size', 'modified'];
        return columns.indexOf(column);
    }
}
