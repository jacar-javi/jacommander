/**
 * Navigation History Module
 * Manages backward/forward navigation history for each panel
 */

export class NavigationHistory {
    constructor(panel) {
        this.panel = panel;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 100;
        this.isNavigating = false;

        // UI Elements
        this.navBar = null;
        this.backButton = null;
        this.forwardButton = null;
        this.historyDropdown = null;
        this.breadcrumbs = null;

        this.init();
    }

    init() {
        this.createNavigationBar();
        this.setupEventListeners();
        this.loadHistory();
    }

    createNavigationBar() {
        // Create navigation bar for the panel
        const navBar = document.createElement('div');
        navBar.className = 'navigation-bar';
        navBar.innerHTML = `
            <div class="nav-controls">
                <button class="nav-btn" id="nav-back-${this.panel.id}" title="Back (Alt+Left)" disabled>
                    <span class="nav-icon">◀</span>
                </button>
                <button class="nav-btn" id="nav-forward-${this.panel.id}" title="Forward (Alt+Right)" disabled>
                    <span class="nav-icon">▶</span>
                </button>
                <button class="nav-btn" id="nav-up-${this.panel.id}" title="Parent Directory (Alt+Up)">
                    <span class="nav-icon">▲</span>
                </button>
                <button class="nav-btn" id="nav-refresh-${this.panel.id}" title="Refresh (F5)">
                    <span class="nav-icon">↻</span>
                </button>
                <button class="nav-btn nav-dropdown-btn" id="nav-history-${this.panel.id}" title="History">
                    <span class="nav-icon">▼</span>
                </button>
            </div>
            <div class="nav-breadcrumbs" id="breadcrumbs-${this.panel.id}">
                <!-- Breadcrumbs will be populated here -->
            </div>
            <div class="nav-history-dropdown" id="history-dropdown-${this.panel.id}" style="display: none;">
                <div class="history-section">
                    <div class="history-title">Recent Locations</div>
                    <div class="history-list" id="recent-list-${this.panel.id}"></div>
                </div>
                <div class="history-section">
                    <div class="history-title">Frequently Visited</div>
                    <div class="history-list" id="frequent-list-${this.panel.id}"></div>
                </div>
                <div class="history-actions">
                    <button class="history-action" id="clear-history-${this.panel.id}">Clear History</button>
                </div>
            </div>
        `;

        // Insert navigation bar into panel
        const panelElement = document.querySelector(`#${this.panel.id}`);
        if (panelElement) {
            const header = panelElement.querySelector('.panel-header');
            if (header) {
                header.insertAdjacentElement('afterend', navBar);
            }
        }

        this.navBar = navBar;
        this.backButton = navBar.querySelector(`#nav-back-${this.panel.id}`);
        this.forwardButton = navBar.querySelector(`#nav-forward-${this.panel.id}`);
        this.historyDropdown = navBar.querySelector(`#history-dropdown-${this.panel.id}`);
        this.breadcrumbs = navBar.querySelector(`#breadcrumbs-${this.panel.id}`);

        this.applyStyles();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .navigation-bar {
                display: flex;
                align-items: center;
                padding: 5px;
                background: var(--panel-bg);
                border-bottom: 1px solid var(--border-color);
                position: relative;
            }

            .nav-controls {
                display: flex;
                gap: 5px;
                margin-right: 10px;
            }

            .nav-btn {
                width: 28px;
                height: 28px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .nav-btn:hover:not(:disabled) {
                background: var(--hover-bg);
                border-color: var(--primary-color);
            }

            .nav-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .nav-btn:active:not(:disabled) {
                transform: scale(0.95);
            }

            .nav-icon {
                font-size: 12px;
            }

            .nav-dropdown-btn {
                position: relative;
            }

            .nav-breadcrumbs {
                flex: 1;
                display: flex;
                align-items: center;
                overflow: hidden;
                font-size: 13px;
            }

            .breadcrumb-item {
                display: inline-flex;
                align-items: center;
                color: var(--text-primary);
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 3px;
                transition: background 0.2s;
                white-space: nowrap;
            }

            .breadcrumb-item:hover {
                background: var(--hover-bg);
            }

            .breadcrumb-separator {
                color: var(--text-secondary);
                margin: 0 4px;
            }

            .breadcrumb-icon {
                margin-right: 4px;
            }

            .nav-history-dropdown {
                position: absolute;
                top: 100%;
                left: 5px;
                right: 5px;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-height: 400px;
                overflow-y: auto;
            }

            .history-section {
                padding: 10px;
                border-bottom: 1px solid var(--border-color);
            }

            .history-section:last-child {
                border-bottom: none;
            }

            .history-title {
                font-size: 12px;
                font-weight: bold;
                color: var(--text-secondary);
                text-transform: uppercase;
                margin-bottom: 8px;
            }

            .history-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .history-item {
                display: flex;
                align-items: center;
                padding: 6px 8px;
                background: var(--item-bg);
                border-radius: 3px;
                cursor: pointer;
                transition: background 0.2s;
                font-size: 13px;
            }

            .history-item:hover {
                background: var(--hover-bg);
            }

            .history-item-icon {
                margin-right: 8px;
            }

            .history-item-path {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: var(--text-primary);
            }

            .history-item-count {
                margin-left: 8px;
                font-size: 11px;
                color: var(--text-secondary);
                background: var(--badge-bg);
                padding: 2px 6px;
                border-radius: 10px;
            }

            .history-item-time {
                margin-left: 8px;
                font-size: 11px;
                color: var(--text-secondary);
            }

            .history-actions {
                padding: 10px;
                display: flex;
                justify-content: flex-end;
            }

            .history-action {
                padding: 6px 12px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 12px;
            }

            .history-action:hover {
                background: var(--hover-bg);
            }

            /* Path autocomplete */
            .path-autocomplete {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-top: none;
                border-radius: 0 0 4px 4px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 999;
            }

            .autocomplete-item {
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                font-size: 13px;
            }

            .autocomplete-item:hover,
            .autocomplete-item.selected {
                background: var(--hover-bg);
            }

            .autocomplete-icon {
                margin-right: 8px;
            }

            .autocomplete-match {
                font-weight: bold;
                color: var(--primary-color);
            }

            /* History graph visualization */
            .history-graph {
                padding: 10px;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                margin: 10px;
            }

            .history-graph-title {
                font-size: 14px;
                font-weight: bold;
                color: var(--text-primary);
                margin-bottom: 10px;
            }

            .history-graph-canvas {
                width: 100%;
                height: 150px;
                background: var(--input-bg);
                border-radius: 3px;
            }

            /* Animations */
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .nav-history-dropdown.show {
                animation: slideDown 0.2s ease-out;
            }

            /* Tooltips */
            .nav-btn[title]:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                padding: 4px 8px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                font-size: 11px;
                border-radius: 3px;
                white-space: nowrap;
                pointer-events: none;
                margin-bottom: 5px;
            }
        `;

        if (!document.querySelector('#navigation-history-styles')) {
            style.id = 'navigation-history-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Navigation buttons
        this.backButton.addEventListener('click', () => this.goBack());
        this.forwardButton.addEventListener('click', () => this.goForward());

        // Parent directory button
        this.navBar.querySelector(`#nav-up-${this.panel.id}`).addEventListener('click', () => {
            this.navigateToParent();
        });

        // Refresh button
        this.navBar.querySelector(`#nav-refresh-${this.panel.id}`).addEventListener('click', () => {
            this.panel.refresh();
        });

        // History dropdown
        const historyBtn = this.navBar.querySelector(`#nav-history-${this.panel.id}`);
        historyBtn.addEventListener('click', () => {
            this.toggleHistoryDropdown();
        });

        // Clear history
        const clearBtn = this.historyDropdown.querySelector(`#clear-history-${this.panel.id}`);
        clearBtn.addEventListener('click', () => {
            this.clearHistory();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.panel.isActive) {
                return;
            }

            if (e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.goBack();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.goForward();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.navigateToParent();
                        break;
                }
            }

            if (e.key === 'F5' && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                this.panel.refresh();
            }
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!this.navBar.contains(e.target)) {
                this.historyDropdown.style.display = 'none';
            }
        });
    }

    addToHistory(path) {
        if (this.isNavigating) {
            return;
        }

        // Remove any forward history when navigating to new path
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new path
        const entry = {
            path: path,
            timestamp: Date.now(),
            title: this.getDirectoryName(path)
        };

        this.history.push(entry);

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        // Update visit frequency
        this.updateVisitFrequency(path);

        // Update UI
        this.updateNavigationButtons();
        this.updateBreadcrumbs();
        this.saveHistory();
    }

    goBack() {
        if (this.currentIndex > 0) {
            this.isNavigating = true;
            this.currentIndex--;
            const entry = this.history[this.currentIndex];
            this.panel.navigate(entry.path);
            this.updateNavigationButtons();
            this.updateBreadcrumbs();
            this.isNavigating = false;
        }
    }

    goForward() {
        if (this.currentIndex < this.history.length - 1) {
            this.isNavigating = true;
            this.currentIndex++;
            const entry = this.history[this.currentIndex];
            this.panel.navigate(entry.path);
            this.updateNavigationButtons();
            this.updateBreadcrumbs();
            this.isNavigating = false;
        }
    }

    navigateToParent() {
        const currentPath = this.panel.currentPath;
        if (currentPath === '/') {
            return;
        }

        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
        this.panel.navigate(parentPath);
    }

    updateNavigationButtons() {
        this.backButton.disabled = this.currentIndex <= 0;
        this.forwardButton.disabled = this.currentIndex >= this.history.length - 1;
    }

    updateBreadcrumbs() {
        if (!this.breadcrumbs || this.currentIndex < 0) {
            return;
        }

        const currentEntry = this.history[this.currentIndex];
        if (!currentEntry) {
            return;
        }

        const path = currentEntry.path;
        const parts = path === '/' ? [''] : path.split('/').filter(Boolean);

        this.breadcrumbs.innerHTML = '';

        // Root
        const rootItem = document.createElement('span');
        rootItem.className = 'breadcrumb-item';
        rootItem.innerHTML = '<span class="breadcrumb-icon">🏠</span>Root';
        rootItem.addEventListener('click', () => this.panel.navigate('/'));
        this.breadcrumbs.appendChild(rootItem);

        // Build path progressively
        let currentPath = '';
        parts.forEach((part, index) => {
            // Separator
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '›';
            this.breadcrumbs.appendChild(separator);

            // Path part
            currentPath += `/${part}`;
            const partPath = currentPath;

            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            item.textContent = part;
            item.addEventListener('click', () => this.panel.navigate(partPath));
            this.breadcrumbs.appendChild(item);
        });
    }

    toggleHistoryDropdown() {
        const isVisible = this.historyDropdown.style.display === 'block';

        if (!isVisible) {
            this.populateHistoryDropdown();
            this.historyDropdown.style.display = 'block';
            this.historyDropdown.classList.add('show');
        } else {
            this.historyDropdown.style.display = 'none';
            this.historyDropdown.classList.remove('show');
        }
    }

    populateHistoryDropdown() {
        // Recent locations
        const recentList = this.historyDropdown.querySelector(`#recent-list-${this.panel.id}`);
        recentList.innerHTML = '';

        const recentHistory = [...this.history].reverse().slice(0, 10);
        recentHistory.forEach((entry) => {
            const item = this.createHistoryItem(entry);
            recentList.appendChild(item);
        });

        // Frequently visited
        const frequentList = this.historyDropdown.querySelector(`#frequent-list-${this.panel.id}`);
        frequentList.innerHTML = '';

        const frequencies = this.getVisitFrequencies();
        const topFrequent = Object.entries(frequencies)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);

        topFrequent.forEach(([path, data]) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-item-icon">📁</span>
                <span class="history-item-path">${path}</span>
                <span class="history-item-count">${data.count}</span>
            `;
            item.addEventListener('click', () => {
                this.panel.navigate(path);
                this.historyDropdown.style.display = 'none';
            });
            frequentList.appendChild(item);
        });
    }

    createHistoryItem(entry) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const timeAgo = this.formatTimeAgo(entry.timestamp);

        item.innerHTML = `
            <span class="history-item-icon">📁</span>
            <span class="history-item-path">${entry.path}</span>
            <span class="history-item-time">${timeAgo}</span>
        `;

        item.addEventListener('click', () => {
            this.panel.navigate(entry.path);
            this.historyDropdown.style.display = 'none';
        });

        return item;
    }

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) {
            return 'just now';
        }
        if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}m ago`;
        }
        if (seconds < 86400) {
            return `${Math.floor(seconds / 3600)}h ago`;
        }
        if (seconds < 604800) {
            return `${Math.floor(seconds / 86400)}d ago`;
        }

        return new Date(timestamp).toLocaleDateString();
    }

    getDirectoryName(path) {
        if (path === '/') {
            return 'Root';
        }
        return path.split('/').pop() || 'Unknown';
    }

    updateVisitFrequency(path) {
        const key = `nav_freq_${this.panel.id}`;
        const frequencies = JSON.parse(localStorage.getItem(key) || '{}');

        if (!frequencies[path]) {
            frequencies[path] = { count: 0, lastVisit: null };
        }

        frequencies[path].count++;
        frequencies[path].lastVisit = Date.now();

        localStorage.setItem(key, JSON.stringify(frequencies));
    }

    getVisitFrequencies() {
        const key = `nav_freq_${this.panel.id}`;
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    clearHistory() {
        if (!confirm('Clear all navigation history?')) {
            return;
        }

        this.history = [];
        this.currentIndex = -1;

        // Clear frequency data
        const key = `nav_freq_${this.panel.id}`;
        localStorage.removeItem(key);

        // Clear saved history
        localStorage.removeItem(`nav_history_${this.panel.id}`);

        this.updateNavigationButtons();
        this.updateBreadcrumbs();
        this.historyDropdown.style.display = 'none';
    }

    saveHistory() {
        // Save only recent history to localStorage
        const toSave = this.history.slice(-50); // Last 50 entries
        const data = {
            history: toSave,
            currentIndex: Math.min(this.currentIndex, toSave.length - 1)
        };

        localStorage.setItem(`nav_history_${this.panel.id}`, JSON.stringify(data));
    }

    loadHistory() {
        const saved = localStorage.getItem(`nav_history_${this.panel.id}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.history = data.history || [];
                this.currentIndex = data.currentIndex || -1;
                this.updateNavigationButtons();
                this.updateBreadcrumbs();
            } catch (e) {
                console.error('Failed to load navigation history:', e);
            }
        }
    }

    // Integration with search results
    navigateToSearchResult(path) {
        const dirPath = path.substring(0, path.lastIndexOf('/')) || '/';
        this.panel.navigate(dirPath);
        // TODO: Highlight the specific file
    }

    // Path prediction based on history
    predictNextPath() {
        if (this.history.length < 2) {
            return null;
        }

        const currentPath = this.history[this.currentIndex]?.path;
        const frequencies = this.getVisitFrequencies();

        // Find paths frequently visited after current path
        const candidates = Object.entries(frequencies)
            .filter(([path]) => path !== currentPath)
            .sort((a, b) => b[1].count - a[1].count);

        return candidates[0]?.[0] || null;
    }

    // Export history for analysis
    exportHistory() {
        const data = {
            history: this.history,
            frequencies: this.getVisitFrequencies(),
            exported: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `navigation_history_${this.panel.id}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Get navigation statistics
    getStatistics() {
        const frequencies = this.getVisitFrequencies();
        const totalVisits = Object.values(frequencies).reduce((sum, f) => sum + f.count, 0);
        const uniquePaths = Object.keys(frequencies).length;
        const mostVisited = Object.entries(frequencies).sort((a, b) => b[1].count - a[1].count)[0];

        return {
            totalNavigations: this.history.length,
            totalVisits,
            uniquePaths,
            mostVisited: mostVisited ? { path: mostVisited[0], count: mostVisited[1].count } : null,
            averageVisitsPerPath: uniquePaths > 0 ? (totalVisits / uniquePaths).toFixed(1) : 0
        };
    }
}

// Export for global use
window.NavigationHistory = NavigationHistory;
