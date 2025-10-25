/**
 * Advanced Search Module
 * Provides sophisticated search capabilities with filters and regex support
 */

export class AdvancedSearch {
    constructor(app) {
        this.app = app;
        this.searchResults = [];
        this.currentSearchId = null;
        this.searchWorker = null;
        this.isSearching = false;

        this.filters = {
            name: '',
            type: 'all', // all, files, directories
            size: { min: null, max: null },
            modified: { from: null, to: null },
            content: '',
            regex: false,
            caseSensitive: false,
            includeHidden: false,
            depth: 3, // Directory depth
            extensions: [],
            excludePaths: []
        };

        this.init();
    }

    init() {
        this.createSearchModal();
        this.setupEventListeners();
        this.initSearchWorker();
    }

    createSearchModal() {
        const modal = document.createElement('div');
        modal.id = 'advanced-search-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content advanced-search">
                <div class="modal-header">
                    <h2>Advanced Search</h2>
                    <button class="close-btn">&times;</button>
                </div>

                <div class="search-tabs">
                    <button class="tab-btn active" data-tab="basic">Basic</button>
                    <button class="tab-btn" data-tab="filters">Filters</button>
                    <button class="tab-btn" data-tab="content">Content</button>
                    <button class="tab-btn" data-tab="results">Results</button>
                </div>

                <div class="search-content">
                    <!-- Basic Search Tab -->
                    <div class="tab-content active" id="basic-tab">
                        <div class="search-field">
                            <label>Search Pattern:</label>
                            <input type="text" id="search-pattern" placeholder="Enter search pattern...">
                            <div class="search-options">
                                <label><input type="checkbox" id="use-regex"> Regular Expression</label>
                                <label><input type="checkbox" id="case-sensitive"> Case Sensitive</label>
                                <label><input type="checkbox" id="include-hidden"> Include Hidden Files</label>
                            </div>
                        </div>

                        <div class="search-field">
                            <label>Search In:</label>
                            <div class="search-location">
                                <input type="text" id="search-path" value="/" readonly>
                                <button id="select-path">Browse...</button>
                            </div>
                        </div>

                        <div class="search-field">
                            <label>Search Type:</label>
                            <select id="search-type">
                                <option value="all">All</option>
                                <option value="files">Files Only</option>
                                <option value="directories">Directories Only</option>
                            </select>
                        </div>

                        <div class="search-field">
                            <label>Max Depth:</label>
                            <input type="number" id="search-depth" min="1" max="10" value="3">
                        </div>
                    </div>

                    <!-- Filters Tab -->
                    <div class="tab-content" id="filters-tab">
                        <div class="search-field">
                            <label>File Extensions:</label>
                            <input type="text" id="file-extensions" placeholder=".txt, .js, .html">
                            <small>Comma-separated list of extensions</small>
                        </div>

                        <div class="search-field">
                            <label>Size Range:</label>
                            <div class="range-input">
                                <input type="number" id="size-min" placeholder="Min (bytes)">
                                <span>to</span>
                                <input type="number" id="size-max" placeholder="Max (bytes)">
                            </div>
                            <div class="size-presets">
                                <button data-size="small">&lt; 1MB</button>
                                <button data-size="medium">1MB - 10MB</button>
                                <button data-size="large">&gt; 10MB</button>
                            </div>
                        </div>

                        <div class="search-field">
                            <label>Modified Date:</label>
                            <div class="range-input">
                                <input type="date" id="date-from">
                                <span>to</span>
                                <input type="date" id="date-to">
                            </div>
                            <div class="date-presets">
                                <button data-date="today">Today</button>
                                <button data-date="week">This Week</button>
                                <button data-date="month">This Month</button>
                                <button data-date="year">This Year</button>
                            </div>
                        </div>

                        <div class="search-field">
                            <label>Exclude Paths:</label>
                            <textarea id="exclude-paths" rows="3" placeholder="node_modules/&#10;.git/&#10;dist/"></textarea>
                            <small>One path pattern per line</small>
                        </div>
                    </div>

                    <!-- Content Search Tab -->
                    <div class="tab-content" id="content-tab">
                        <div class="search-field">
                            <label>Search in File Content:</label>
                            <input type="text" id="content-search" placeholder="Text to search in files...">
                            <div class="content-options">
                                <label><input type="checkbox" id="content-regex"> Use Regular Expression</label>
                                <label><input type="checkbox" id="content-case"> Case Sensitive</label>
                                <label><input type="checkbox" id="binary-files"> Include Binary Files</label>
                            </div>
                        </div>

                        <div class="search-field">
                            <label>File Types for Content Search:</label>
                            <select id="content-types" multiple size="5">
                                <option value="text" selected>Text Files (.txt, .md)</option>
                                <option value="code" selected>Source Code (.js, .py, .go, .java)</option>
                                <option value="config" selected>Config Files (.json, .xml, .yml)</option>
                                <option value="web">Web Files (.html, .css)</option>
                                <option value="all">All Files</option>
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                        </div>

                        <div class="search-field">
                            <label>Context Lines:</label>
                            <input type="number" id="context-lines" min="0" max="10" value="2">
                            <small>Number of lines to show before/after matches</small>
                        </div>
                    </div>

                    <!-- Results Tab -->
                    <div class="tab-content" id="results-tab">
                        <div class="results-header">
                            <span id="results-count">No results yet</span>
                            <div class="results-actions">
                                <button id="export-results">Export</button>
                                <button id="clear-results">Clear</button>
                            </div>
                        </div>

                        <div class="results-list" id="search-results">
                            <!-- Results will be populated here -->
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <div class="search-status" id="search-status"></div>
                    <div class="modal-actions">
                        <button id="save-search">Save Search</button>
                        <button id="load-search">Load Search</button>
                        <button id="start-search" class="primary">Start Search</button>
                        <button id="stop-search" style="display: none;" class="danger">Stop</button>
                        <button id="close-search">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
        this.applyStyles();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #advanced-search-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
            }

            #advanced-search-modal.show {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .advanced-search {
                width: 800px;
                max-width: 90vw;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
            }

            .search-tabs {
                display: flex;
                border-bottom: 2px solid var(--border-color);
                background: var(--panel-bg);
            }

            .tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }

            .tab-btn:hover {
                background: var(--hover-bg);
            }

            .tab-btn.active {
                color: var(--primary-color);
                border-bottom: 2px solid var(--primary-color);
                margin-bottom: -2px;
            }

            .search-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .search-field {
                margin-bottom: 20px;
            }

            .search-field label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--text-primary);
            }

            .search-field input[type="text"],
            .search-field input[type="number"],
            .search-field input[type="date"],
            .search-field select,
            .search-field textarea {
                width: 100%;
                padding: 8px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                font-family: inherit;
            }

            .search-field select[multiple] {
                padding: 4px;
            }

            .search-field small {
                display: block;
                margin-top: 4px;
                color: var(--text-secondary);
                font-size: 12px;
            }

            .search-options,
            .content-options {
                display: flex;
                gap: 20px;
                margin-top: 8px;
            }

            .search-options label,
            .content-options label {
                display: flex;
                align-items: center;
                gap: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .search-location {
                display: flex;
                gap: 8px;
            }

            .search-location input {
                flex: 1;
            }

            .range-input {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .range-input input {
                flex: 1;
            }

            .size-presets,
            .date-presets {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .size-presets button,
            .date-presets button {
                padding: 4px 12px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 12px;
            }

            .size-presets button:hover,
            .date-presets button:hover {
                background: var(--hover-bg);
            }

            .results-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                margin-bottom: 10px;
            }

            .results-actions {
                display: flex;
                gap: 8px;
            }

            .results-list {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--input-bg);
            }

            .result-item {
                padding: 10px;
                border-bottom: 1px solid var(--border-color);
                cursor: pointer;
                transition: background 0.2s;
            }

            .result-item:hover {
                background: var(--hover-bg);
            }

            .result-item:last-child {
                border-bottom: none;
            }

            .result-path {
                font-family: monospace;
                font-size: 13px;
                color: var(--primary-color);
                margin-bottom: 4px;
            }

            .result-details {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: var(--text-secondary);
            }

            .result-match {
                margin-top: 4px;
                padding: 4px;
                background: var(--panel-bg);
                border-left: 3px solid var(--primary-color);
                font-family: monospace;
                font-size: 12px;
            }

            .result-match mark {
                background: #ffeb3b;
                color: #000;
                font-weight: bold;
            }

            .search-status {
                flex: 1;
                display: flex;
                align-items: center;
                color: var(--text-secondary);
                font-size: 13px;
            }

            .search-status.searching::before {
                content: '';
                display: inline-block;
                width: 16px;
                height: 16px;
                margin-right: 8px;
                border: 2px solid var(--primary-color);
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .modal-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-top: 1px solid var(--border-color);
            }

            .modal-actions {
                display: flex;
                gap: 10px;
            }

            .modal-actions button {
                padding: 8px 16px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
            }

            .modal-actions button:hover {
                background: var(--hover-bg);
            }

            .modal-actions button.primary {
                background: var(--primary-color);
                border-color: var(--primary-color);
                color: white;
            }

            .modal-actions button.primary:hover {
                filter: brightness(1.1);
            }

            .modal-actions button.danger {
                background: #f44336;
                border-color: #f44336;
                color: white;
            }
        `;

        if (!document.querySelector('#advanced-search-styles')) {
            style.id = 'advanced-search-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Tab switching
        this.modal.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Close button
        this.modal.querySelector('.close-btn').addEventListener('click', () => this.hide());
        this.modal.querySelector('#close-search').addEventListener('click', () => this.hide());

        // Search actions
        this.modal.querySelector('#start-search').addEventListener('click', () => this.startSearch());
        this.modal.querySelector('#stop-search').addEventListener('click', () => this.stopSearch());
        this.modal.querySelector('#save-search').addEventListener('click', () => this.saveSearch());
        this.modal.querySelector('#load-search').addEventListener('click', () => this.loadSearch());

        // Size presets
        this.modal.querySelectorAll('.size-presets button').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.applySizePreset(e.target.dataset.size);
            });
        });

        // Date presets
        this.modal.querySelectorAll('.date-presets button').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.applyDatePreset(e.target.dataset.date);
            });
        });

        // Results actions
        this.modal.querySelector('#export-results').addEventListener('click', () => this.exportResults());
        this.modal.querySelector('#clear-results').addEventListener('click', () => this.clearResults());

        // Path selection
        this.modal.querySelector('#select-path').addEventListener('click', () => this.selectPath());

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.show();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.modal.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        this.modal.querySelectorAll('.tab-content').forEach((content) => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    show() {
        this.modal.classList.add('show');
        this.modal.querySelector('#search-pattern').focus();

        // Set current path
        const activePanel = this.app.panels[this.app.activePanel];
        if (activePanel) {
            this.modal.querySelector('#search-path').value = activePanel.currentPath;
        }
    }

    hide() {
        this.modal.classList.remove('show');
    }

    collectFilters() {
        return {
            name: this.modal.querySelector('#search-pattern').value,
            type: this.modal.querySelector('#search-type').value,
            regex: this.modal.querySelector('#use-regex').checked,
            caseSensitive: this.modal.querySelector('#case-sensitive').checked,
            includeHidden: this.modal.querySelector('#include-hidden').checked,
            path: this.modal.querySelector('#search-path').value,
            depth: parseInt(this.modal.querySelector('#search-depth').value),
            extensions: this.modal
                .querySelector('#file-extensions')
                .value.split(',')
                .map((ext) => ext.trim())
                .filter((ext) => ext),
            size: {
                min: this.modal.querySelector('#size-min').value
                    ? parseInt(this.modal.querySelector('#size-min').value)
                    : null,
                max: this.modal.querySelector('#size-max').value
                    ? parseInt(this.modal.querySelector('#size-max').value)
                    : null
            },
            modified: {
                from: this.modal.querySelector('#date-from').value || null,
                to: this.modal.querySelector('#date-to').value || null
            },
            excludePaths: this.modal
                .querySelector('#exclude-paths')
                .value.split('\n')
                .map((p) => p.trim())
                .filter((p) => p),
            content: this.modal.querySelector('#content-search').value,
            contentRegex: this.modal.querySelector('#content-regex')?.checked,
            contentCase: this.modal.querySelector('#content-case')?.checked,
            binaryFiles: this.modal.querySelector('#binary-files')?.checked,
            contextLines: parseInt(this.modal.querySelector('#context-lines')?.value || 0)
        };
    }

    async startSearch() {
        if (this.isSearching) {
            return;
        }

        this.isSearching = true;
        this.searchResults = [];
        this.currentSearchId = Date.now();

        const filters = this.collectFilters();

        // Update UI
        this.modal.querySelector('#start-search').style.display = 'none';
        this.modal.querySelector('#stop-search').style.display = 'inline-block';
        this.modal.querySelector('#search-status').textContent = 'Searching...';
        this.modal.querySelector('#search-status').classList.add('searching');

        // Switch to results tab
        this.switchTab('results');

        try {
            await this.performSearch(filters);
        } catch (error) {
            console.error('Search error:', error);
            this.showError(`Search failed: ${error.message}`);
        } finally {
            this.stopSearch();
        }
    }

    async performSearch(filters) {
        const activePanel = this.app.panels[this.app.activePanel];
        const storageId = activePanel?.storage || 'local';

        // Send search request to backend
        const response = await fetch('/api/fs/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                storage: storageId,
                ...filters
            })
        });

        if (!response.ok) {
            throw new Error('Search request failed');
        }

        // Process results as they stream in
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const result = JSON.parse(line);
                        this.addResult(result);
                    } catch (e) {
                        console.error('Failed to parse result:', e);
                    }
                }
            }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
            try {
                const result = JSON.parse(buffer);
                this.addResult(result);
            } catch (e) {
                console.error('Failed to parse final result:', e);
            }
        }

        this.updateResultsCount();
    }

    addResult(result) {
        this.searchResults.push(result);

        const resultsContainer = this.modal.querySelector('#search-results');
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <div class="result-path">${result.path}</div>
            <div class="result-details">
                <span>${result.type === 'dir' ? '📁' : '📄'} ${result.type}</span>
                <span>${this.formatSize(result.size)}</span>
                <span>${this.formatDate(result.modified)}</span>
            </div>
            ${
                result.matches
                    ? `
                <div class="result-match">
                    ${this.highlightMatches(result.matches)}
                </div>
            `
                    : ''
            }
        `;

        resultItem.addEventListener('click', () => {
            this.openResult(result);
        });

        resultsContainer.appendChild(resultItem);
        this.updateResultsCount();
    }

    updateResultsCount() {
        const count = this.searchResults.length;
        this.modal.querySelector('#results-count').textContent =
            count === 0 ? 'No results' : `${count} result${count === 1 ? '' : 's'}`;
    }

    stopSearch() {
        this.isSearching = false;
        this.modal.querySelector('#start-search').style.display = 'inline-block';
        this.modal.querySelector('#stop-search').style.display = 'none';
        this.modal.querySelector('#search-status').textContent = 'Search completed';
        this.modal.querySelector('#search-status').classList.remove('searching');
    }

    clearResults() {
        this.searchResults = [];
        this.modal.querySelector('#search-results').innerHTML = '';
        this.updateResultsCount();
    }

    async exportResults() {
        const data = this.searchResults.map((r) => ({
            path: r.path,
            type: r.type,
            size: r.size,
            modified: r.modified
        }));

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search_results_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    openResult(result) {
        const activePanel = this.app.panels[this.app.activePanel];
        if (result.type === 'dir') {
            activePanel.navigate(result.path);
        } else {
            // Navigate to parent directory and highlight file
            const parentPath = result.path.substring(0, result.path.lastIndexOf('/')) || '/';
            activePanel.navigate(parentPath);
            // TODO: Highlight the specific file
        }
        this.hide();
    }

    applySizePreset(preset) {
        const minInput = this.modal.querySelector('#size-min');
        const maxInput = this.modal.querySelector('#size-max');

        switch (preset) {
            case 'small':
                minInput.value = '';
                maxInput.value = 1048576; // 1MB
                break;
            case 'medium':
                minInput.value = 1048576;
                maxInput.value = 10485760; // 10MB
                break;
            case 'large':
                minInput.value = 10485760;
                maxInput.value = '';
                break;
        }
    }

    applyDatePreset(preset) {
        const fromInput = this.modal.querySelector('#date-from');
        const toInput = this.modal.querySelector('#date-to');
        const today = new Date();

        switch (preset) {
            case 'today':
                fromInput.value = today.toISOString().split('T')[0];
                toInput.value = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
                fromInput.value = weekAgo.toISOString().split('T')[0];
                toInput.value = today.toISOString().split('T')[0];
                break;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                fromInput.value = monthAgo.toISOString().split('T')[0];
                toInput.value = today.toISOString().split('T')[0];
                break;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                fromInput.value = yearAgo.toISOString().split('T')[0];
                toInput.value = today.toISOString().split('T')[0];
                break;
        }
    }

    selectPath() {
        // TODO: Implement directory picker
        const path = prompt('Enter search path:', this.modal.querySelector('#search-path').value);
        if (path !== null) {
            this.modal.querySelector('#search-path').value = path;
        }
    }

    saveSearch() {
        const filters = this.collectFilters();
        const name = prompt('Enter name for saved search:');
        if (!name) {
            return;
        }

        const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '{}');
        savedSearches[name] = filters;
        localStorage.setItem('savedSearches', JSON.stringify(savedSearches));

        alert('Search saved successfully!');
    }

    loadSearch() {
        const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '{}');
        const names = Object.keys(savedSearches);

        if (names.length === 0) {
            alert('No saved searches found');
            return;
        }

        const name = prompt(`Select saved search:\n${names.join('\n')}`);
        if (!name || !savedSearches[name]) {
            return;
        }

        const filters = savedSearches[name];

        // Apply loaded filters
        this.modal.querySelector('#search-pattern').value = filters.name || '';
        this.modal.querySelector('#search-type').value = filters.type || 'all';
        this.modal.querySelector('#use-regex').checked = filters.regex || false;
        this.modal.querySelector('#case-sensitive').checked = filters.caseSensitive || false;
        this.modal.querySelector('#include-hidden').checked = filters.includeHidden || false;
        this.modal.querySelector('#search-path').value = filters.path || '/';
        this.modal.querySelector('#search-depth').value = filters.depth || 3;
        this.modal.querySelector('#file-extensions').value = (filters.extensions || []).join(', ');
        this.modal.querySelector('#size-min').value = filters.size?.min || '';
        this.modal.querySelector('#size-max').value = filters.size?.max || '';
        this.modal.querySelector('#date-from').value = filters.modified?.from || '';
        this.modal.querySelector('#date-to').value = filters.modified?.to || '';
        this.modal.querySelector('#exclude-paths').value = (filters.excludePaths || []).join('\n');
        this.modal.querySelector('#content-search').value = filters.content || '';

        alert('Search loaded successfully!');
    }

    formatSize(bytes) {
        if (!bytes) {
            return '0 B';
        }
        const units = ['B', 'KB', 'MB', 'GB'];
        const index = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
    }

    formatDate(timestamp) {
        if (!timestamp) {
            return 'N/A';
        }
        const date = new Date(timestamp * 1000);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    highlightMatches(matches) {
        // TODO: Implement match highlighting
        return matches.map((m) => `Line ${m.line}: ${m.text}`).join('<br>');
    }

    showError(message) {
        this.modal.querySelector('#search-status').textContent = `Error: ${message}`;
        this.modal.querySelector('#search-status').classList.remove('searching');
    }

    initSearchWorker() {
        // TODO: Implement web worker for background searching
        // This would allow non-blocking search operations
    }
}

// Export for global use
window.AdvancedSearch = AdvancedSearch;
