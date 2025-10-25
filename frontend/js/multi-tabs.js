// multi-tabs.js - Multi-tab support for JaCommander
export class TabManager {
    constructor(app) {
        this.app = app;
        this.tabs = [];
        this.activeTabId = null;
        this.tabIdCounter = 0;
        this.maxTabs = 10;
        this.tabContainer = null;
        this.panelContainer = null;

        this.init();
        this.bindKeyboardShortcuts();
    }

    init() {
        // Create tab UI structure
        this.createTabUI();

        // Create initial tab
        this.createTab('/', 'Home', true);
    }

    createTabUI() {
        // Create tab bar container
        const existingTabBar = document.querySelector('.tab-bar-container');
        if (existingTabBar) {
            existingTabBar.remove();
        }

        const tabBarContainer = document.createElement('div');
        tabBarContainer.className = 'tab-bar-container';
        tabBarContainer.innerHTML = `
            <div class="tab-bar">
                <div class="tab-list" role="tablist"></div>
                <button class="tab-add-btn" title="New Tab (Ctrl+T)">
                    <span class="tab-add-icon">+</span>
                </button>
            </div>
        `;

        // Insert tab bar before main container
        const mainContainer = document.querySelector('.container');
        mainContainer.parentNode.insertBefore(tabBarContainer, mainContainer);

        this.tabContainer = tabBarContainer.querySelector('.tab-list');
        this.panelContainer = mainContainer;

        // Bind add tab button
        tabBarContainer.querySelector('.tab-add-btn').addEventListener('click', () => {
            this.createTab();
        });

        // Add CSS styles for tabs
        this.injectTabStyles();
    }

    injectTabStyles() {
        const styleId = 'multi-tabs-styles';
        if (document.getElementById(styleId)) {return;}

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .tab-bar-container {
                background: var(--panel-bg);
                border-bottom: 1px solid var(--border-color);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: sticky;
                top: 0;
                z-index: 100;
            }

            .tab-bar {
                display: flex;
                align-items: center;
                padding: 0 10px;
                height: 36px;
                overflow-x: auto;
                scrollbar-width: thin;
            }

            .tab-bar::-webkit-scrollbar {
                height: 4px;
            }

            .tab-bar::-webkit-scrollbar-thumb {
                background: var(--text-secondary);
                border-radius: 2px;
            }

            .tab-list {
                display: flex;
                flex: 1;
                gap: 2px;
                margin-right: 10px;
            }

            .tab-item {
                display: flex;
                align-items: center;
                padding: 6px 12px;
                background: var(--hover-bg);
                border: 1px solid transparent;
                border-radius: 4px 4px 0 0;
                cursor: pointer;
                min-width: 120px;
                max-width: 200px;
                transition: all 0.2s ease;
                position: relative;
                user-select: none;
            }

            .tab-item:hover {
                background: var(--selected-bg);
            }

            .tab-item.active {
                background: var(--panel-bg);
                border-color: var(--border-color);
                border-bottom-color: var(--panel-bg);
                box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
            }

            .tab-icon {
                margin-right: 6px;
                font-size: 14px;
                opacity: 0.7;
            }

            .tab-title {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 13px;
                color: var(--text-primary);
            }

            .tab-close {
                margin-left: 8px;
                padding: 2px;
                border-radius: 3px;
                background: transparent;
                border: none;
                cursor: pointer;
                opacity: 0.6;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .tab-close:hover {
                opacity: 1;
                background: var(--danger-bg);
                color: white;
            }

            .tab-add-btn {
                padding: 4px 8px;
                background: transparent;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 28px;
                height: 28px;
            }

            .tab-add-btn:hover {
                background: var(--hover-bg);
                border-color: var(--primary-color);
            }

            .tab-add-icon {
                font-size: 18px;
                line-height: 1;
                color: var(--text-primary);
            }

            /* Tab context menu */
            .tab-context-menu {
                position: absolute;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                padding: 4px 0;
                z-index: 1000;
                display: none;
            }

            .tab-context-menu.show {
                display: block;
            }

            .tab-context-item {
                padding: 8px 16px;
                cursor: pointer;
                font-size: 13px;
                color: var(--text-primary);
                white-space: nowrap;
            }

            .tab-context-item:hover {
                background: var(--hover-bg);
            }

            .tab-context-item.disabled {
                opacity: 0.5;
                pointer-events: none;
            }

            /* Panel state management */
            .panel-state {
                display: none;
            }

            .panel-state.active {
                display: flex;
            }

            /* Tab number indicator */
            .tab-number {
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 10px;
                color: var(--text-secondary);
                opacity: 0.5;
            }

            /* Drag and drop indicators */
            .tab-item.dragging {
                opacity: 0.5;
            }

            .tab-item.drag-over::before {
                content: '';
                position: absolute;
                left: -2px;
                top: 0;
                bottom: 0;
                width: 3px;
                background: var(--primary-color);
            }
        `;

        document.head.appendChild(style);
    }

    createTab(path = '/', title = 'New Tab', makeActive = true) {
        if (this.tabs.length >= this.maxTabs) {
            this.app.showNotification('Maximum number of tabs reached', 'warning');
            return null;
        }

        const tabId = `tab-${++this.tabIdCounter}`;

        // Create tab data
        const tabData = {
            id: tabId,
            path: path,
            title: title || this.getDirectoryName(path),
            leftPanel: {
                path: path,
                selectedIndex: 0,
                scrollTop: 0,
                selectedFiles: []
            },
            rightPanel: {
                path: path,
                selectedIndex: 0,
                scrollTop: 0,
                selectedFiles: []
            },
            focusedPanel: 'left'
        };

        this.tabs.push(tabData);

        // Create tab element
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';
        tabElement.id = tabId;
        tabElement.draggable = true;
        tabElement.innerHTML = `
            <span class="tab-icon">📁</span>
            <span class="tab-title">${this.escapeHtml(tabData.title)}</span>
            ${this.tabs.length > 1 ? '<button class="tab-close" title="Close Tab (Ctrl+W)">×</button>' : ''}
            ${this.tabIdCounter <= 9 ? `<span class="tab-number">${this.tabIdCounter}</span>` : ''}
        `;

        // Add event listeners
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.activateTab(tabId);
            }
        });

        // Close button
        const closeBtn = tabElement.querySelector('.tab-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(tabId);
            });
        }

        // Context menu
        tabElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showTabContextMenu(e, tabId);
        });

        // Drag and drop
        this.setupTabDragDrop(tabElement, tabId);

        // Add to DOM
        this.tabContainer.appendChild(tabElement);

        // Activate if requested
        if (makeActive) {
            this.activateTab(tabId);
        }

        return tabId;
    }

    activateTab(tabId) {
        const tab = this.tabs.find((t) => t.id === tabId);
        if (!tab) {return;}

        // Save current tab state
        if (this.activeTabId) {
            this.saveTabState(this.activeTabId);
        }

        // Update UI
        document.querySelectorAll('.tab-item').forEach((el) => {
            el.classList.toggle('active', el.id === tabId);
        });

        // Switch panel content
        this.activeTabId = tabId;
        this.restoreTabState(tabId);

        // Update browser title
        document.title = `JaCommander - ${tab.title}`;
    }

    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
        if (tabIndex === -1) {return;}

        // Don't close if it's the last tab
        if (this.tabs.length === 1) {
            this.app.showNotification('Cannot close the last tab', 'warning');
            return;
        }

        // Save state before closing
        if (this.activeTabId === tabId) {
            this.saveTabState(tabId);
        }

        // Remove from array
        this.tabs.splice(tabIndex, 1);

        // Remove from DOM
        document.getElementById(tabId)?.remove();

        // If this was the active tab, activate another
        if (this.activeTabId === tabId) {
            const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
            if (newActiveTab) {
                this.activateTab(newActiveTab.id);
            }
        }
    }

    saveTabState(tabId) {
        const tab = this.tabs.find((t) => t.id === tabId);
        if (!tab) {return;}

        // Save left panel state
        const leftPanel = this.app.leftPanel;
        if (leftPanel) {
            tab.leftPanel.path = leftPanel.currentPath;
            tab.leftPanel.selectedIndex = leftPanel.selectedIndex;
            tab.leftPanel.scrollTop = leftPanel.container.scrollTop;
            tab.leftPanel.selectedFiles = [...leftPanel.selectedFiles];
        }

        // Save right panel state
        const rightPanel = this.app.rightPanel;
        if (rightPanel) {
            tab.rightPanel.path = rightPanel.currentPath;
            tab.rightPanel.selectedIndex = rightPanel.selectedIndex;
            tab.rightPanel.scrollTop = rightPanel.container.scrollTop;
            tab.rightPanel.selectedFiles = [...rightPanel.selectedFiles];
        }

        // Save focused panel
        tab.focusedPanel = this.app.focusedPanel;
    }

    restoreTabState(tabId) {
        const tab = this.tabs.find((t) => t.id === tabId);
        if (!tab) {return;}

        // Restore left panel
        const leftPanel = this.app.leftPanel;
        if (leftPanel) {
            leftPanel.navigate(tab.leftPanel.path);
            leftPanel.selectedIndex = tab.leftPanel.selectedIndex;
            leftPanel.selectedFiles = [...tab.leftPanel.selectedFiles];
            setTimeout(() => {
                leftPanel.container.scrollTop = tab.leftPanel.scrollTop;
            }, 100);
        }

        // Restore right panel
        const rightPanel = this.app.rightPanel;
        if (rightPanel) {
            rightPanel.navigate(tab.rightPanel.path);
            rightPanel.selectedIndex = tab.rightPanel.selectedIndex;
            rightPanel.selectedFiles = [...tab.rightPanel.selectedFiles];
            setTimeout(() => {
                rightPanel.container.scrollTop = tab.rightPanel.scrollTop;
            }, 100);
        }

        // Restore focus
        if (tab.focusedPanel === 'right') {
            rightPanel?.focus();
        } else {
            leftPanel?.focus();
        }
    }

    updateTabTitle(tabId, title) {
        const tab = this.tabs.find((t) => t.id === tabId);
        if (tab) {
            tab.title = title;
            const tabElement = document.getElementById(tabId);
            if (tabElement) {
                const titleElement = tabElement.querySelector('.tab-title');
                if (titleElement) {
                    titleElement.textContent = title;
                }
            }
        }
    }

    updateActiveTabPath(panel, path) {
        if (!this.activeTabId) {return;}

        const tab = this.tabs.find((t) => t.id === this.activeTabId);
        if (tab) {
            // Update the path for the specific panel
            if (panel === 'left') {
                tab.leftPanel.path = path;
            } else if (panel === 'right') {
                tab.rightPanel.path = path;
            }

            // Update tab title to show current directory
            const displayPath = this.getDirectoryName(path);
            this.updateTabTitle(this.activeTabId, displayPath);
        }
    }

    showTabContextMenu(event, tabId) {
        const existingMenu = document.querySelector('.tab-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'tab-context-menu show';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;

        const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
        const isOnlyTab = this.tabs.length === 1;

        menu.innerHTML = `
            <div class="tab-context-item" data-action="duplicate">Duplicate Tab</div>
            <div class="tab-context-item" data-action="close-others">Close Other Tabs</div>
            <div class="tab-context-item" data-action="close-right">Close Tabs to the Right</div>
            <div class="tab-context-item ${isOnlyTab ? 'disabled' : ''}" data-action="close">Close Tab</div>
        `;

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action) {return;}

            switch (action) {
                case 'duplicate':
                    this.duplicateTab(tabId);
                    break;
                case 'close':
                    if (!isOnlyTab) {this.closeTab(tabId);}
                    break;
                case 'close-others':
                    this.closeOtherTabs(tabId);
                    break;
                case 'close-right':
                    this.closeTabsToRight(tabId);
                    break;
            }

            menu.remove();
        });

        document.body.appendChild(menu);

        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    duplicateTab(tabId) {
        const tab = this.tabs.find((t) => t.id === tabId);
        if (tab) {
            const newTabId = this.createTab(tab.leftPanel.path, tab.title);
            if (newTabId) {
                const newTab = this.tabs.find((t) => t.id === newTabId);
                if (newTab) {
                    newTab.rightPanel.path = tab.rightPanel.path;
                    this.restoreTabState(newTabId);
                }
            }
        }
    }

    closeOtherTabs(keepTabId) {
        const tabsToClose = this.tabs.filter((t) => t.id !== keepTabId);
        tabsToClose.forEach((tab) => {
            this.closeTab(tab.id);
        });
    }

    closeTabsToRight(tabId) {
        const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
        if (tabIndex === -1) {return;}

        const tabsToClose = this.tabs.slice(tabIndex + 1);
        tabsToClose.forEach((tab) => {
            this.closeTab(tab.id);
        });
    }

    setupTabDragDrop(tabElement, tabId) {
        tabElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tabId);
            tabElement.classList.add('dragging');
        });

        tabElement.addEventListener('dragend', () => {
            tabElement.classList.remove('dragging');
            document.querySelectorAll('.tab-item').forEach((el) => {
                el.classList.remove('drag-over');
            });
        });

        tabElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            tabElement.classList.add('drag-over');
        });

        tabElement.addEventListener('dragleave', () => {
            tabElement.classList.remove('drag-over');
        });

        tabElement.addEventListener('drop', (e) => {
            e.preventDefault();
            tabElement.classList.remove('drag-over');

            const draggedTabId = e.dataTransfer.getData('text/plain');
            if (draggedTabId && draggedTabId !== tabId) {
                this.reorderTabs(draggedTabId, tabId);
            }
        });
    }

    reorderTabs(draggedTabId, targetTabId) {
        const draggedIndex = this.tabs.findIndex((t) => t.id === draggedTabId);
        const targetIndex = this.tabs.findIndex((t) => t.id === targetTabId);

        if (draggedIndex === -1 || targetIndex === -1) {return;}

        // Reorder in array
        const draggedTab = this.tabs.splice(draggedIndex, 1)[0];
        this.tabs.splice(targetIndex, 0, draggedTab);

        // Reorder in DOM
        const draggedElement = document.getElementById(draggedTabId);
        const targetElement = document.getElementById(targetTabId);
        if (draggedElement && targetElement) {
            targetElement.parentNode.insertBefore(draggedElement, targetElement);
        }
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+T: New tab
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.createTab();
            }

            // Ctrl+W: Close tab
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (this.activeTabId) {
                    this.closeTab(this.activeTabId);
                }
            }

            // Ctrl+Shift+T: Reopen closed tab (if we implement history)
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.reopenClosedTab();
            }

            // Ctrl+Tab: Next tab
            if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.switchToNextTab();
            }

            // Ctrl+Shift+Tab: Previous tab
            if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchToPrevTab();
            }

            // Ctrl+1-9: Switch to tab by number
            if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (index < this.tabs.length) {
                    this.activateTab(this.tabs[index].id);
                }
            }
        });
    }

    switchToNextTab() {
        if (this.tabs.length <= 1) {return;}

        const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.activateTab(this.tabs[nextIndex].id);
    }

    switchToPrevTab() {
        if (this.tabs.length <= 1) {return;}

        const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
        const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        this.activateTab(this.tabs[prevIndex].id);
    }

    reopenClosedTab() {
        // This would require implementing a closed tabs history
        // For now, just show a notification
        this.app.showNotification('No recently closed tabs', 'info');
    }

    getDirectoryName(path) {
        if (path === '/' || path === '') {return 'Home';}
        const parts = path.split('/').filter((p) => p);
        return parts[parts.length - 1] || 'Home';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Save and restore session
    saveSession() {
        const session = {
            tabs: this.tabs,
            activeTabId: this.activeTabId,
            tabIdCounter: this.tabIdCounter
        };
        localStorage.setItem('jacommander-tabs-session', JSON.stringify(session));
    }

    restoreSession() {
        const sessionData = localStorage.getItem('jacommander-tabs-session');
        if (!sessionData) {return false;}

        try {
            const session = JSON.parse(sessionData);

            // Clear existing tabs
            this.tabs = [];
            this.tabContainer.innerHTML = '';

            // Restore tabs
            session.tabs.forEach((tabData) => {
                const tabId = this.createTab(tabData.leftPanel.path, tabData.title, false);
                if (tabId) {
                    const newTab = this.tabs.find((t) => t.id === tabId);
                    if (newTab) {
                        // Copy state from saved data
                        Object.assign(newTab, tabData);
                        newTab.id = tabId; // Keep new ID
                    }
                }
            });

            // Restore active tab
            if (this.tabs.length > 0) {
                this.activateTab(this.tabs[0].id);
            }

            return true;
        } catch (err) {
            console.error('Failed to restore tab session:', err);
            return false;
        }
    }
}

// Export for use in main app
export default TabManager;
