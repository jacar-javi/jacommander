// batch-rename.js - Batch rename functionality for multiple files
export class BatchRename {
    constructor(app) {
        this.app = app;
        this.modal = null;
        this.previewData = [];
        this.init();
    }

    init() {
        // Add batch rename to context menu and keyboard shortcuts
        this.addContextMenuItem();
        this.bindKeyboardShortcut();
    }

    addContextMenuItem() {
        // This will be called when context menu is shown for multiple selected files
        if (this.app.contextMenu) {
            this.app.contextMenu.addItem({
                label: 'Batch Rename',
                icon: '✏️',
                action: () => this.openBatchRenameDialog(),
                condition: () => this.getSelectedFiles().length > 1
            });
        }
    }

    bindKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+R for batch rename
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                const selectedFiles = this.getSelectedFiles();
                if (selectedFiles.length > 1) {
                    this.openBatchRenameDialog();
                }
            }
        });
    }

    getSelectedFiles() {
        const panel = this.app.focusedPanel === 'right' ? this.app.rightPanel : this.app.leftPanel;
        return panel ? Array.from(panel.selectedFiles || []) : [];
    }

    openBatchRenameDialog() {
        const selectedFiles = this.getSelectedFiles();
        if (selectedFiles.length === 0) {
            this.app.showNotification('No files selected', 'warning');
            return;
        }

        // Create modal
        this.createModal(selectedFiles);
    }

    createModal(files) {
        // Remove existing modal if any
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'batch-rename-modal modal';
        this.modal.innerHTML = `
            <div class="modal-content batch-rename-content">
                <div class="modal-header">
                    <h2>Batch Rename - ${files.length} files</h2>
                    <button class="modal-close" id="batch-rename-close">✕</button>
                </div>

                <div class="modal-body">
                    <div class="rename-tabs">
                        <button class="tab-btn active" data-tab="basic">Basic</button>
                        <button class="tab-btn" data-tab="replace">Find & Replace</button>
                        <button class="tab-btn" data-tab="case">Case Change</button>
                        <button class="tab-btn" data-tab="counter">Counter</button>
                        <button class="tab-btn" data-tab="extension">Extension</button>
                    </div>

                    <!-- Basic Tab -->
                    <div class="tab-content active" id="tab-basic">
                        <div class="rename-option">
                            <label>Add Prefix:</label>
                            <input type="text" id="rename-prefix" placeholder="e.g., IMG_">
                        </div>
                        <div class="rename-option">
                            <label>Add Suffix:</label>
                            <input type="text" id="rename-suffix" placeholder="e.g., _backup">
                        </div>
                        <div class="rename-option">
                            <label>Remove First N Characters:</label>
                            <input type="number" id="rename-remove-first" min="0" value="0">
                        </div>
                        <div class="rename-option">
                            <label>Remove Last N Characters:</label>
                            <input type="number" id="rename-remove-last" min="0" value="0">
                        </div>
                    </div>

                    <!-- Replace Tab -->
                    <div class="tab-content" id="tab-replace">
                        <div class="rename-option">
                            <label>Find:</label>
                            <input type="text" id="rename-find" placeholder="Text to find">
                        </div>
                        <div class="rename-option">
                            <label>Replace with:</label>
                            <input type="text" id="rename-replace" placeholder="Replacement text">
                        </div>
                        <div class="rename-option">
                            <label>
                                <input type="checkbox" id="rename-regex">
                                Use Regular Expression
                            </label>
                        </div>
                        <div class="rename-option">
                            <label>
                                <input type="checkbox" id="rename-case-sensitive">
                                Case Sensitive
                            </label>
                        </div>
                    </div>

                    <!-- Case Tab -->
                    <div class="tab-content" id="tab-case">
                        <div class="rename-option">
                            <label>Name Case:</label>
                            <select id="rename-name-case">
                                <option value="">No Change</option>
                                <option value="upper">UPPERCASE</option>
                                <option value="lower">lowercase</option>
                                <option value="title">Title Case</option>
                                <option value="sentence">Sentence case</option>
                            </select>
                        </div>
                        <div class="rename-option">
                            <label>Extension Case:</label>
                            <select id="rename-ext-case">
                                <option value="">No Change</option>
                                <option value="upper">UPPERCASE</option>
                                <option value="lower">lowercase</option>
                            </select>
                        </div>
                    </div>

                    <!-- Counter Tab -->
                    <div class="tab-content" id="tab-counter">
                        <div class="rename-option">
                            <label>Counter Position:</label>
                            <select id="rename-counter-position">
                                <option value="">No Counter</option>
                                <option value="prefix">At Beginning</option>
                                <option value="suffix">At End</option>
                                <option value="replace">Replace Name</option>
                            </select>
                        </div>
                        <div class="rename-option">
                            <label>Start Number:</label>
                            <input type="number" id="rename-counter-start" min="0" value="1">
                        </div>
                        <div class="rename-option">
                            <label>Increment:</label>
                            <input type="number" id="rename-counter-step" min="1" value="1">
                        </div>
                        <div class="rename-option">
                            <label>Digits (padding):</label>
                            <input type="number" id="rename-counter-digits" min="1" max="10" value="3">
                        </div>
                        <div class="rename-option">
                            <label>Separator:</label>
                            <input type="text" id="rename-counter-separator" value="_" maxlength="5">
                        </div>
                    </div>

                    <!-- Extension Tab -->
                    <div class="tab-content" id="tab-extension">
                        <div class="rename-option">
                            <label>Extension Action:</label>
                            <select id="rename-ext-action">
                                <option value="">No Change</option>
                                <option value="add">Add Extension</option>
                                <option value="remove">Remove Extension</option>
                                <option value="replace">Replace Extension</option>
                            </select>
                        </div>
                        <div class="rename-option" id="ext-value-container" style="display: none;">
                            <label>New Extension:</label>
                            <input type="text" id="rename-ext-value" placeholder="e.g., jpg">
                        </div>
                    </div>

                    <!-- Preview Section -->
                    <div class="preview-section">
                        <h3>Preview</h3>
                        <div class="preview-list" id="rename-preview">
                            ${this.generatePreview(files)}
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" id="batch-rename-cancel">Cancel</button>
                    <button class="btn btn-primary" id="batch-rename-apply">Apply Rename</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Bind events
        this.bindModalEvents(files);

        // Show modal
        this.modal.style.display = 'flex';
    }

    bindModalEvents(files) {
        // Tab switching
        this.modal.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Input changes trigger preview update
        const inputs = this.modal.querySelectorAll('input, select');
        inputs.forEach((input) => {
            input.addEventListener('input', () => {
                this.updatePreview(files);
            });
        });

        // Extension action change
        const extAction = this.modal.querySelector('#rename-ext-action');
        extAction.addEventListener('change', (e) => {
            const valueContainer = this.modal.querySelector('#ext-value-container');
            valueContainer.style.display = e.target.value === 'add' || e.target.value === 'replace' ? 'block' : 'none';
            this.updatePreview(files);
        });

        // Close button
        this.modal.querySelector('#batch-rename-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Cancel button
        this.modal.querySelector('#batch-rename-cancel').addEventListener('click', () => {
            this.closeModal();
        });

        // Apply button
        this.modal.querySelector('#batch-rename-apply').addEventListener('click', () => {
            this.applyRename(files);
        });

        // Close on escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    switchTab(tabName) {
        // Update tab buttons
        this.modal.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        this.modal.querySelectorAll('.tab-content').forEach((content) => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
    }

    generatePreview(files) {
        const newNames = this.calculateNewNames(files);

        return `
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Original Name</th>
                        <th>→</th>
                        <th>New Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${files
        .map((file, index) => {
            const newName = newNames[index];
            const hasConflict = this.checkNameConflict(newName, files, index);
            return `
                            <tr class="${hasConflict ? 'conflict' : ''}">
                                <td class="original-name">${this.escapeHtml(file.name)}</td>
                                <td class="arrow">→</td>
                                <td class="new-name ${newName === file.name ? 'unchanged' : ''}">${this.escapeHtml(newName)}</td>
                                <td class="status">
                                    ${
    hasConflict
        ? '<span class="error">⚠️ Conflict</span>'
        : newName === file.name
            ? '<span class="unchanged">No change</span>'
            : '<span class="ok">✓</span>'
}
                                </td>
                            </tr>
                        `;
        })
        .join('')}
                </tbody>
            </table>
        `;
    }

    updatePreview(files) {
        const previewDiv = this.modal.querySelector('#rename-preview');
        previewDiv.innerHTML = this.generatePreview(files);
    }

    calculateNewNames(files) {
        const options = this.getRenameOptions();
        return files.map((file, index) => {
            let name = file.name;
            let ext = '';

            // Split name and extension
            const lastDot = name.lastIndexOf('.');
            if (lastDot > 0 && !file.isDir) {
                ext = name.substring(lastDot + 1);
                name = name.substring(0, lastDot);
            }

            // Apply basic transformations
            if (options.removeFirst > 0) {
                name = name.substring(options.removeFirst);
            }
            if (options.removeLast > 0) {
                name = name.substring(0, name.length - options.removeLast);
            }
            if (options.prefix) {
                name = options.prefix + name;
            }
            if (options.suffix) {
                name = name + options.suffix;
            }

            // Apply find and replace
            if (options.find) {
                if (options.useRegex) {
                    try {
                        const flags = options.caseSensitive ? 'g' : 'gi';
                        const regex = new RegExp(options.find, flags);
                        name = name.replace(regex, options.replace);
                    } catch (e) {
                        // Invalid regex, use literal replacement
                        name = name.replace(options.find, options.replace);
                    }
                } else {
                    const flags = options.caseSensitive ? 'g' : 'gi';
                    const regex = new RegExp(this.escapeRegex(options.find), flags);
                    name = name.replace(regex, options.replace);
                }
            }

            // Apply case changes
            if (options.nameCase) {
                name = this.changeCase(name, options.nameCase);
            }

            // Apply counter
            if (options.counterPosition) {
                const counter = this.formatCounter(
                    options.counterStart + index * options.counterStep,
                    options.counterDigits
                );

                switch (options.counterPosition) {
                    case 'prefix':
                        name = counter + options.counterSeparator + name;
                        break;
                    case 'suffix':
                        name = name + options.counterSeparator + counter;
                        break;
                    case 'replace':
                        name = counter;
                        break;
                }
            }

            // Handle extension
            if (options.extAction) {
                switch (options.extAction) {
                    case 'remove':
                        ext = '';
                        break;
                    case 'add':
                        if (!ext) {
                            ext = options.extValue;
                        }
                        break;
                    case 'replace':
                        ext = options.extValue;
                        break;
                }
            }

            // Apply extension case
            if (ext && options.extCase) {
                ext = this.changeCase(ext, options.extCase);
            }

            // Combine name and extension
            return ext ? `${name}.${ext}` : name;
        });
    }

    getRenameOptions() {
        return {
            // Basic
            prefix: this.modal.querySelector('#rename-prefix').value,
            suffix: this.modal.querySelector('#rename-suffix').value,
            removeFirst: parseInt(this.modal.querySelector('#rename-remove-first').value) || 0,
            removeLast: parseInt(this.modal.querySelector('#rename-remove-last').value) || 0,

            // Replace
            find: this.modal.querySelector('#rename-find').value,
            replace: this.modal.querySelector('#rename-replace').value,
            useRegex: this.modal.querySelector('#rename-regex').checked,
            caseSensitive: this.modal.querySelector('#rename-case-sensitive').checked,

            // Case
            nameCase: this.modal.querySelector('#rename-name-case').value,
            extCase: this.modal.querySelector('#rename-ext-case').value,

            // Counter
            counterPosition: this.modal.querySelector('#rename-counter-position').value,
            counterStart: parseInt(this.modal.querySelector('#rename-counter-start').value) || 1,
            counterStep: parseInt(this.modal.querySelector('#rename-counter-step').value) || 1,
            counterDigits: parseInt(this.modal.querySelector('#rename-counter-digits').value) || 3,
            counterSeparator: this.modal.querySelector('#rename-counter-separator').value || '_',

            // Extension
            extAction: this.modal.querySelector('#rename-ext-action').value,
            extValue: this.modal.querySelector('#rename-ext-value').value
        };
    }

    changeCase(text, caseType) {
        switch (caseType) {
            case 'upper':
                return text.toUpperCase();
            case 'lower':
                return text.toLowerCase();
            case 'title':
                return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            case 'sentence':
                return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            default:
                return text;
        }
    }

    formatCounter(num, digits) {
        return num.toString().padStart(digits, '0');
    }

    checkNameConflict(newName, files, currentIndex) {
        // Check if the new name conflicts with other files
        return files.some((file, index) => {
            if (index === currentIndex) {
                return false;
            }
            const otherNewNames = this.calculateNewNames(files);
            return otherNewNames[index] === newName;
        });
    }

    async applyRename(files) {
        const newNames = this.calculateNewNames(files);
        const renameOperations = [];

        // Prepare rename operations
        files.forEach((file, index) => {
            const newName = newNames[index];
            if (newName !== file.name && !this.checkNameConflict(newName, files, index)) {
                renameOperations.push({
                    oldPath: file.path,
                    newPath: file.path.replace(file.name, newName),
                    oldName: file.name,
                    newName: newName
                });
            }
        });

        if (renameOperations.length === 0) {
            this.app.showNotification('No files to rename', 'info');
            return;
        }

        // Show progress
        this.showProgress(renameOperations.length);

        // Apply renames
        let successCount = 0;
        let errorCount = 0;

        for (const operation of renameOperations) {
            try {
                await this.renameFile(operation.oldPath, operation.newPath);
                successCount++;
                this.updateProgress(successCount, renameOperations.length);
            } catch (error) {
                console.error(`Failed to rename ${operation.oldName}:`, error);
                errorCount++;
            }
        }

        // Show result
        if (errorCount === 0) {
            this.app.showNotification(`Successfully renamed ${successCount} files`, 'success');
        } else {
            this.app.showNotification(`Renamed ${successCount} files, ${errorCount} failed`, 'warning');
        }

        // Refresh file list
        const panel = this.app.focusedPanel === 'right' ? this.app.rightPanel : this.app.leftPanel;
        if (panel) {
            panel.refresh();
        }

        // Close modal
        this.closeModal();
    }

    async renameFile(oldPath, newPath) {
        const response = await fetch('/api/fs/rename', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oldPath: oldPath,
                newPath: newPath
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to rename file: ${response.statusText}`);
        }

        return response.json();
    }

    showProgress(total) {
        const footer = this.modal.querySelector('.modal-footer');
        footer.innerHTML = `
            <div class="rename-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">Renaming: 0 / ${total}</span>
            </div>
        `;
    }

    updateProgress(current, total) {
        const fill = this.modal.querySelector('.progress-fill');
        const text = this.modal.querySelector('.progress-text');

        if (fill) {
            fill.style.width = `${(current / total) * 100}%`;
        }
        if (text) {
            text.textContent = `Renaming: ${current} / ${total}`;
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// CSS for batch rename modal
export const batchRenameStyles = `
    .batch-rename-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .batch-rename-content {
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        background: var(--panel-bg);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .rename-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        border-bottom: 2px solid var(--border-color);
    }

    .tab-btn {
        padding: 8px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        background: var(--hover-bg);
    }

    .tab-btn.active {
        border-bottom-color: var(--primary-color);
        color: var(--primary-color);
        font-weight: 600;
    }

    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }

    .rename-option {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .rename-option label {
        min-width: 150px;
        font-weight: 500;
    }

    .rename-option input,
    .rename-option select {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--input-bg);
        color: var(--text-primary);
    }

    .preview-section {
        margin-top: 20px;
        border-top: 1px solid var(--border-color);
        padding-top: 20px;
    }

    .preview-section h3 {
        margin-bottom: 12px;
        color: var(--text-primary);
    }

    .preview-list {
        max-height: 250px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 8px;
    }

    .preview-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }

    .preview-table th {
        text-align: left;
        padding: 8px;
        border-bottom: 2px solid var(--border-color);
        font-weight: 600;
    }

    .preview-table td {
        padding: 6px 8px;
        border-bottom: 1px solid var(--border-light);
    }

    .preview-table .unchanged {
        opacity: 0.6;
    }

    .preview-table .conflict {
        background: var(--danger-bg);
    }

    .preview-table .error {
        color: var(--danger-color);
    }

    .preview-table .ok {
        color: var(--success-color);
    }

    .rename-progress {
        width: 100%;
    }

    .progress-bar {
        height: 20px;
        background: var(--hover-bg);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 8px;
    }

    .progress-fill {
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
    }

    .progress-text {
        text-align: center;
        display: block;
        color: var(--text-secondary);
    }
`;

export default BatchRename;
