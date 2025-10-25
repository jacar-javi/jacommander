/**
 * Multi-Tab Support Module
 * Manages multiple tabs per panel for different directory views
 */

export class TabManager {
    constructor(app) {
        this.app = app;
        this.tabs = {
            left: [],
            right: []
        };
        this.activeTab = {
            left: 0,
            right: 0
        };
        this.maxTabs = 10; // Maximum tabs per panel
        this.tabIdCounter = 0;
        this.init();
    }

    /**
     * Initialize tab manager
     */
    init() {
        this.setupTabBars();
        this.loadSavedTabs();
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
    }

    /**
     * Setup tab bars in the UI
     */
    setupTabBars() {
        // Create tab bars for both panels
        ['left', 'right'].forEach((panel) => {
            const panelEl = document.getElementById(`panel-${panel}`);
            const tabBar = this.createTabBar(panel);

            // Insert tab bar after panel header
            const panelHeader = panelEl.querySelector('.panel-header');
            panelHeader.insertAdjacentElement('afterend', tabBar);
        });
    }

    /**
     * Create tab bar element
     */
    createTabBar(panel) {
        const tabBar = document.createElement('div');
        tabBar.className = 'tab-bar';
        tabBar.id = `tab-bar-${panel}`;
        tabBar.innerHTML = `
            <div class="tab-list" id="tab-list-${panel}">
                <!-- Tabs will be added here -->
            </div>
            <div class="tab-actions">
                <button class="tab-new" id="tab-new-${panel}" title="New Tab (Ctrl+T)">+</button>
                <button class="tab-menu" id="tab-menu-${panel}" title="Tab Menu">⋮</button>
            </div>
        `;

        // Add event listeners
        tabBar.querySelector(`#tab-new-${panel}`).addEventListener('click', () => {
            this.addTab(panel);
        });

        tabBar.querySelector(`#tab-menu-${panel}`).addEventListener('click', (e) => {
            this.showTabMenu(panel, e);
        });

        return tabBar;
    }

    /**
     * Add a new tab
     */
    addTab(panel, path = '/', storage = null) {
        if (this.tabs[panel].length >= this.maxTabs) {
            this.app.showNotification(`Maximum ${this.maxTabs} tabs allowed per panel`, 'warning');
            return null;
        }

        const tab = {
            id: ++this.tabIdCounter,
            panel,
            path,
            storage: storage || this.app.panels.getCurrentStorage(panel),
            title: this.getTabTitle(path),
            state: {
                selectedFiles: new Set(),
                focusedIndex: 0,
                scrollPosition: 0
            }
        };

        this.tabs[panel].push(tab);
        this.renderTabs(panel);
        this.switchToTab(panel, this.tabs[panel].length - 1);
        this.saveTabs();

        return tab;
    }

    /**
     * Close a tab
     */
    closeTab(panel, index) {
        const tabs = this.tabs[panel];

        // Don't close if it's the last tab
        if (tabs.length <= 1) {
            this.app.showNotification('Cannot close the last tab', 'warning');
            return;
        }

        // Save current tab state before closing
        this.saveTabState(panel);

        // Remove tab
        tabs.splice(index, 1);

        // Adjust active tab if needed
        if (this.activeTab[panel] >= tabs.length) {
            this.activeTab[panel] = tabs.length - 1;
        } else if (this.activeTab[panel] > index) {
            this.activeTab[panel]--;
        }

        this.renderTabs(panel);
        this.switchToTab(panel, this.activeTab[panel]);
        this.saveTabs();
    }

    /**
     * Switch to a specific tab
     */
    switchToTab(panel, index) {
        if (index < 0 || index >= this.tabs[panel].length) {
            return;
        }

        // Save current tab state
        this.saveTabState(panel);

        // Switch to new tab
        this.activeTab[panel] = index;
        const tab = this.tabs[panel][index];

        // Load tab directory
        this.app.panels.loadDirectory(panel, tab.path, tab.storage);

        // Restore tab state
        this.restoreTabState(panel, tab);

        // Update UI
        this.renderTabs(panel);
        this.saveTabs();

        // Dispatch event
        document.dispatchEvent(
            new CustomEvent('tabChanged', {
                detail: { panel, tab, index }
            })
        );
    }

    /**
     * Save current tab state
     */
    saveTabState(panel) {
        const currentTab = this.tabs[panel][this.activeTab[panel]];
        if (!currentTab) {return;}

        const panelData = this.app.panels.panels[panel];
        currentTab.state = {
            selectedFiles: new Set(panelData.selectedFiles),
            focusedIndex: panelData.focusedIndex,
            scrollPosition: this.getScrollPosition(panel)
        };

        // Update path and storage
        currentTab.path = panelData.currentPath;
        currentTab.storage = panelData.storage;
        currentTab.title = this.getTabTitle(currentTab.path);
    }

    /**
     * Restore tab state
     */
    restoreTabState(panel, tab) {
        const panelData = this.app.panels.panels[panel];

        // Restore selection and focus
        panelData.selectedFiles = new Set(tab.state.selectedFiles);
        panelData.focusedIndex = tab.state.focusedIndex;

        // Restore scroll position (after content loads)
        setTimeout(() => {
            this.setScrollPosition(panel, tab.state.scrollPosition);
        }, 100);
    }

    /**
     * Get scroll position for panel
     */
    getScrollPosition(panel) {
        const content = document.querySelector(`#panel-${panel} .panel-content`);
        return content ? content.scrollTop : 0;
    }

    /**
     * Set scroll position for panel
     */
    setScrollPosition(panel, position) {
        const content = document.querySelector(`#panel-${panel} .panel-content`);
        if (content) {
            content.scrollTop = position;
        }
    }

    /**
     * Render tabs for a panel
     */
    renderTabs(panel) {
        const tabList = document.getElementById(`tab-list-${panel}`);
        const tabs = this.tabs[panel];

        tabList.innerHTML = tabs
            .map(
                (tab, index) => `
            <div class="tab ${index === this.activeTab[panel] ? 'active' : ''}"
                 data-panel="${panel}"
                 data-index="${index}"
                 data-tab-id="${tab.id}"
                 draggable="true"
                 title="${tab.path}">
                <span class="tab-icon">📁</span>
                <span class="tab-title">${tab.title}</span>
                ${
    tabs.length > 1
        ? `
                    <button class="tab-close" data-panel="${panel}" data-index="${index}" title="Close Tab">×</button>
                `
        : ''
}
            </div>
        `
            )
            .join('');

        // Add event listeners
        tabList.querySelectorAll('.tab').forEach((tabEl) => {
            const index = parseInt(tabEl.dataset.index);

            // Click to switch
            tabEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    this.switchToTab(panel, index);
                }
            });

            // Middle click to close
            tabEl.addEventListener('mousedown', (e) => {
                if (e.button === 1) {
                    // Middle mouse button
                    e.preventDefault();
                    this.closeTab(panel, index);
                }
            });

            // Close button
            const closeBtn = tabEl.querySelector('.tab-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeTab(panel, index);
                });
            }

            // Drag and drop
            this.setupTabDragAndDrop(tabEl);
        });
    }

    /**
     * Setup drag and drop for a tab
     */
    setupTabDragAndDrop(tabEl) {
        let draggedTab = null;

        tabEl.addEventListener('dragstart', (e) => {
            draggedTab = tabEl;
            tabEl.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tabEl.dataset.tabId);
        });

        tabEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(tabEl.parentElement, e.clientX);
            if (afterElement == null) {
                tabEl.parentElement.appendChild(draggedTab);
            } else {
                tabEl.parentElement.insertBefore(draggedTab, afterElement);
            }
        });

        tabEl.addEventListener('drop', (e) => {
            e.preventDefault();
            this.reorderTabs(tabEl.dataset.panel);
        });

        tabEl.addEventListener('dragend', () => {
            tabEl.classList.remove('dragging');
            draggedTab = null;
        });
    }

    /**
     * Get element after which to insert dragged tab
     */
    getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.tab:not(.dragging)')];

        return draggableElements.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = x - box.left - box.width / 2;

                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            { offset: Number.NEGATIVE_INFINITY }
        ).element;
    }

    /**
     * Reorder tabs after drag and drop
     */
    reorderTabs(panel) {
        const tabList = document.getElementById(`tab-list-${panel}`);
        const newOrder = Array.from(tabList.querySelectorAll('.tab')).map((el) => parseInt(el.dataset.index));

        const oldTabs = this.tabs[panel];
        const newTabs = newOrder.map((i) => oldTabs[i]);

        // Update active tab index
        const activeTabId = oldTabs[this.activeTab[panel]].id;
        this.activeTab[panel] = newTabs.findIndex((tab) => tab.id === activeTabId);

        this.tabs[panel] = newTabs;
        this.renderTabs(panel);
        this.saveTabs();
    }

    /**
     * Get tab title from path
     */
    getTabTitle(path) {
        if (path === '/') {
            return 'Root';
        }
        const parts = path.split('/');
        return parts[parts.length - 1] || parts[parts.length - 2] || 'Root';
    }

    /**
     * Show tab context menu
     */
    showTabMenu(panel, event) {
        const menu = document.createElement('div');
        menu.className = 'tab-context-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;

        menu.innerHTML = `
            <div class="menu-item" data-action="close-all">Close All Tabs</div>
            <div class="menu-item" data-action="close-others">Close Other Tabs</div>
            <div class="menu-separator"></div>
            <div class="menu-item" data-action="duplicate">Duplicate Tab</div>
            <div class="menu-item" data-action="refresh">Refresh Tab</div>
            <div class="menu-separator"></div>
            <div class="menu-item" data-action="copy-path">Copy Path</div>
        `;

        // Add event listeners
        menu.querySelectorAll('.menu-item').forEach((item) => {
            item.addEventListener('click', () => {
                this.handleTabMenuAction(panel, item.dataset.action);
                menu.remove();
            });
        });

        // Close menu on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };

        document.body.appendChild(menu);
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    /**
     * Handle tab menu action
     */
    handleTabMenuAction(panel, action) {
        const activeIndex = this.activeTab[panel];
        const activeTab = this.tabs[panel][activeIndex];

        switch (action) {
            case 'close-all':
                if (confirm('Close all tabs except the first one?')) {
                    while (this.tabs[panel].length > 1) {
                        this.tabs[panel].pop();
                    }
                    this.activeTab[panel] = 0;
                    this.renderTabs(panel);
                    this.switchToTab(panel, 0);
                }
                break;

            case 'close-others':
                if (this.tabs[panel].length > 1) {
                    this.tabs[panel] = [activeTab];
                    this.activeTab[panel] = 0;
                    this.renderTabs(panel);
                    this.switchToTab(panel, 0);
                }
                break;

            case 'duplicate':
                this.addTab(panel, activeTab.path, activeTab.storage);
                break;

            case 'refresh':
                this.app.panels.refresh(panel);
                break;

            case 'copy-path':
                navigator.clipboard.writeText(activeTab.path);
                this.app.showNotification('Path copied to clipboard', 'success');
                break;
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const panel = this.app.getActivePanel();

            // Ctrl+T: New tab
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.addTab(panel);
            }

            // Ctrl+W: Close tab
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                this.closeTab(panel, this.activeTab[panel]);
            }

            // Ctrl+Tab: Next tab
            if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.nextTab(panel);
            }

            // Ctrl+Shift+Tab: Previous tab
            if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                this.previousTab(panel);
            }

            // Ctrl+1-9: Switch to tab by number
            if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (index < this.tabs[panel].length) {
                    this.switchToTab(panel, index);
                }
            }
        });
    }

    /**
     * Switch to next tab
     */
    nextTab(panel) {
        const nextIndex = (this.activeTab[panel] + 1) % this.tabs[panel].length;
        this.switchToTab(panel, nextIndex);
    }

    /**
     * Switch to previous tab
     */
    previousTab(panel) {
        const prevIndex = this.activeTab[panel] === 0 ? this.tabs[panel].length - 1 : this.activeTab[panel] - 1;
        this.switchToTab(panel, prevIndex);
    }

    /**
     * Initialize tab drag and drop
     */
    setupDragAndDrop() {
        // Additional global drag and drop setup if needed
        document.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('text/plain')) {
                e.preventDefault();
            }
        });
    }

    /**
     * Save tabs to localStorage
     */
    saveTabs() {
        try {
            const tabData = {
                left: this.tabs.left.map((tab) => ({
                    path: tab.path,
                    storage: tab.storage,
                    title: tab.title
                })),
                right: this.tabs.right.map((tab) => ({
                    path: tab.path,
                    storage: tab.storage,
                    title: tab.title
                })),
                activeTab: this.activeTab,
                timestamp: Date.now()
            };

            localStorage.setItem('jacommander-tabs', JSON.stringify(tabData));
        } catch (error) {
            console.error('Failed to save tabs:', error);
        }
    }

    /**
     * Load saved tabs
     */
    loadSavedTabs() {
        try {
            const saved = localStorage.getItem('jacommander-tabs');
            if (saved) {
                const tabData = JSON.parse(saved);

                // Check if data is not too old (24 hours)
                const dayInMs = 24 * 60 * 60 * 1000;
                if (Date.now() - tabData.timestamp < dayInMs) {
                    // Restore tabs
                    ['left', 'right'].forEach((panel) => {
                        if (tabData[panel] && tabData[panel].length > 0) {
                            tabData[panel].forEach((tab) => {
                                this.addTab(panel, tab.path, tab.storage);
                            });
                            if (tabData.activeTab && tabData.activeTab[panel] !== undefined) {
                                this.switchToTab(panel, tabData.activeTab[panel]);
                            }
                        } else {
                            // Create default tab if none saved
                            this.addTab(panel, '/');
                        }
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to load saved tabs:', error);
        }

        // Create default tabs if loading failed
        this.addTab('left', '/');
        this.addTab('right', '/');
    }

    /**
     * Clear all tabs
     */
    clearAllTabs() {
        this.tabs = { left: [], right: [] };
        this.activeTab = { left: 0, right: 0 };
        localStorage.removeItem('jacommander-tabs');
    }

    /**
     * Get current tab for panel
     */
    getCurrentTab(panel) {
        return this.tabs[panel][this.activeTab[panel]];
    }

    /**
     * Update current tab path
     */
    updateCurrentTabPath(panel, path) {
        const tab = this.getCurrentTab(panel);
        if (tab) {
            tab.path = path;
            tab.title = this.getTabTitle(path);
            this.renderTabs(panel);
            this.saveTabs();
        }
    }
}
