/**
 * Breadcrumb Navigation Module
 * Provides clickable path navigation for each panel
 */

export class BreadcrumbNav {
    constructor(app) {
        this.app = app;
        this.breadcrumbs = {
            left: null,
            right: null
        };
        this.init();
    }

    init() {
        // Create breadcrumb containers for both panels
        this.createBreadcrumb('left');
        this.createBreadcrumb('right');

        // Listen for path changes
        document.addEventListener('pathChanged', (e) => {
            this.updateBreadcrumb(e.detail.panel, e.detail.path, e.detail.storage);
        });

        // Listen for storage changes
        document.addEventListener('storageChanged', (e) => {
            this.updateBreadcrumb(e.detail.panel, e.detail.path, e.detail.storage);
        });
    }

    /**
     * Create breadcrumb container for a panel
     */
    createBreadcrumb(panel) {
        const panelHeader = document.querySelector(`#panel-${panel} .panel-header`);
        const pathInput = panelHeader.querySelector('.path-input');
        const storageSelector = panelHeader.querySelector('.storage-selector');

        // Create storage selector row container (for storage dropdown + buttons)
        const storageSelectorRow = document.createElement('div');
        storageSelectorRow.className = 'storage-selector-row';
        storageSelectorRow.id = `storage-row-${panel}`;

        // Move storage selector into the row
        storageSelector.parentElement.insertBefore(storageSelectorRow, storageSelector);
        storageSelectorRow.appendChild(storageSelector);

        // Create actions container (for refresh and tab buttons)
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'storage-actions';
        actionsContainer.id = `storage-actions-${panel}`;

        // Create refresh button
        const refreshButton = document.createElement('button');
        refreshButton.className = 'breadcrumb-refresh';
        refreshButton.id = `breadcrumb-refresh-${panel}`;
        refreshButton.innerHTML = '↻';
        refreshButton.title = 'Refresh directory (F5)';
        refreshButton.addEventListener('click', () => {
            this.refreshDirectory(panel);
        });

        // Create sync button
        const syncButton = document.createElement('button');
        syncButton.className = 'breadcrumb-sync';
        syncButton.id = `breadcrumb-sync-${panel}`;
        syncButton.innerHTML = '⇄';
        syncButton.title = 'Sync storage and path with other panel';
        syncButton.addEventListener('click', () => {
            this.syncWithOtherPanel(panel);
        });

        actionsContainer.appendChild(refreshButton);
        actionsContainer.appendChild(syncButton);
        storageSelectorRow.appendChild(actionsContainer);

        // Create breadcrumb container (navigation only)
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'breadcrumb-container';
        breadcrumbContainer.id = `breadcrumb-${panel}`;

        // Create breadcrumb navigation
        const breadcrumbNav = document.createElement('nav');
        breadcrumbNav.className = 'breadcrumb-nav';
        breadcrumbNav.setAttribute('aria-label', `Breadcrumb navigation for ${panel} panel`);

        // Create ordered list for semantic HTML
        const breadcrumbList = document.createElement('ol');
        breadcrumbList.className = 'breadcrumb-list';

        breadcrumbNav.appendChild(breadcrumbList);
        breadcrumbContainer.appendChild(breadcrumbNav);

        // Insert breadcrumb container after storage selector row
        panelHeader.insertBefore(breadcrumbContainer, storageSelectorRow.nextSibling);

        // Hide original path input
        pathInput.parentElement.style.display = 'none';

        // Store reference
        this.breadcrumbs[panel] = {
            container: breadcrumbContainer,
            list: breadcrumbList,
            actions: actionsContainer
        };

        // Add keyboard navigation
        this.setupKeyboardNavigation(panel, breadcrumbList);
    }

    /**
     * Update breadcrumb for a panel
     */
    updateBreadcrumb(panel, path, storage) {
        if (!this.breadcrumbs[panel]) {
            return;
        }

        const list = this.breadcrumbs[panel].list;

        // Parse path into segments
        const segments = this.parsePath(path);

        // Calculate total items needed (root + segments)
        const totalItems = segments.length + 1;
        const existingItems = list.children;

        // Update or create root item
        if (existingItems.length > 0) {
            this.updateBreadcrumbItem(
                existingItems[0],
                {
                    label: storage || 'local',
                    path: '/',
                    isRoot: true,
                    isLast: segments.length === 0
                },
                panel
            );
        } else {
            const storageItem = this.createBreadcrumbItem(
                {
                    label: storage || 'local',
                    path: '/',
                    isRoot: true,
                    isLast: segments.length === 0
                },
                panel
            );
            list.appendChild(storageItem);
        }

        // Update or create path segment items
        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const itemIndex = index + 1;

            if (existingItems.length > itemIndex) {
                // Update existing item
                this.updateBreadcrumbItem(
                    existingItems[itemIndex],
                    {
                        label: segment,
                        path: currentPath.replace('//', '/'),
                        isRoot: false,
                        isLast: index === segments.length - 1
                    },
                    panel
                );
            } else {
                // Create new item
                const item = this.createBreadcrumbItem(
                    {
                        label: segment,
                        path: currentPath.replace('//', '/'),
                        isRoot: false,
                        isLast: index === segments.length - 1
                    },
                    panel
                );
                list.appendChild(item);
            }
        });

        // Remove extra items if path is shorter
        while (list.children.length > totalItems) {
            list.removeChild(list.lastChild);
        }

        // Add scroll buttons if needed
        this.checkOverflow(panel);
    }

    /**
     * Update an existing breadcrumb item
     */
    updateBreadcrumbItem(itemElement, config, panel) {
        const { label, path, isRoot, isLast } = config;

        // Clear existing content
        itemElement.innerHTML = '';
        itemElement.className = 'breadcrumb-item';
        if (isLast) {
            itemElement.classList.add('current');
        }

        if (!isLast) {
            // Create clickable link
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'breadcrumb-link';
            link.setAttribute('data-path', path);
            link.setAttribute('role', 'button');
            link.setAttribute('aria-label', `Navigate to ${label}`);

            if (isRoot) {
                const icon = document.createElement('span');
                icon.className = 'breadcrumb-icon';
                icon.textContent = '🏠';
                link.appendChild(icon);
            }

            const text = document.createElement('span');
            text.className = 'breadcrumb-text';
            text.textContent = label;
            link.appendChild(text);

            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPath(panel, path);
            });

            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.navigateToPath(panel, path);
                }
            });

            itemElement.appendChild(link);

            // Add separator
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '/';
            separator.setAttribute('aria-hidden', 'true');
            itemElement.appendChild(separator);
        } else {
            // Current item (not clickable)
            const current = document.createElement('span');
            current.className = 'breadcrumb-current';
            current.setAttribute('aria-current', 'page');

            if (isRoot) {
                const icon = document.createElement('span');
                icon.className = 'breadcrumb-icon';
                icon.textContent = '🏠';
                current.appendChild(icon);
            }

            const text = document.createElement('span');
            text.className = 'breadcrumb-text';
            text.textContent = label;
            current.appendChild(text);

            itemElement.appendChild(current);
        }
    }

    /**
     * Create a breadcrumb item
     */
    createBreadcrumbItem(config, panel) {
        const { label, path, isRoot, isLast } = config;

        const item = document.createElement('li');
        item.className = 'breadcrumb-item';
        if (isLast) {
            item.classList.add('current');
        }

        if (!isLast) {
            // Create clickable link for non-current items
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'breadcrumb-link';
            link.setAttribute('data-path', path);
            link.setAttribute('role', 'button');
            link.setAttribute('aria-label', `Navigate to ${label}`);

            // Add icon for root
            if (isRoot) {
                const icon = document.createElement('span');
                icon.className = 'breadcrumb-icon';
                icon.textContent = '🏠';
                link.appendChild(icon);
            }

            const text = document.createElement('span');
            text.className = 'breadcrumb-text';
            text.textContent = label;
            link.appendChild(text);

            // Add click handler
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPath(panel, path);
            });

            // Add keyboard support
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.navigateToPath(panel, path);
                }
            });

            item.appendChild(link);

            // Add separator
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '/';
            separator.setAttribute('aria-hidden', 'true');
            item.appendChild(separator);
        } else {
            // Current item (not clickable)
            const current = document.createElement('span');
            current.className = 'breadcrumb-current';
            current.setAttribute('aria-current', 'page');

            if (isRoot) {
                const icon = document.createElement('span');
                icon.className = 'breadcrumb-icon';
                icon.textContent = '🏠';
                current.appendChild(icon);
            }

            const text = document.createElement('span');
            text.className = 'breadcrumb-text';
            text.textContent = label;
            current.appendChild(text);

            item.appendChild(current);
        }

        return item;
    }

    /**
     * Parse path into segments
     */
    parsePath(path) {
        if (!path || path === '/') {
            return [];
        }

        return path.split('/').filter((segment) => segment.length > 0);
    }

    /**
     * Navigate to a path
     */
    navigateToPath(panel, path) {
        // Set active panel
        this.app.setActivePanel(panel);

        // Load directory
        this.app.panels.loadDirectory(panel, path);
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation(panel, list) {
        list.addEventListener('keydown', (e) => {
            const links = Array.from(list.querySelectorAll('.breadcrumb-link'));
            const currentIndex = links.indexOf(document.activeElement);

            switch (e.key) {
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        e.preventDefault();
                        links[currentIndex - 1].focus();
                    }
                    break;
                case 'ArrowRight':
                    if (currentIndex < links.length - 1) {
                        e.preventDefault();
                        links[currentIndex + 1].focus();
                    }
                    break;
                case 'Home':
                    if (links.length > 0) {
                        e.preventDefault();
                        links[0].focus();
                    }
                    break;
                case 'End':
                    if (links.length > 0) {
                        e.preventDefault();
                        links[links.length - 1].focus();
                    }
                    break;
            }
        });
    }

    /**
     * Check for overflow and add scroll buttons if needed
     */
    checkOverflow(panel) {
        const container = this.breadcrumbs[panel].container;
        const nav = container.querySelector('.breadcrumb-nav');
        const list = container.querySelector('.breadcrumb-list');

        // Remove existing scroll buttons
        container.querySelectorAll('.breadcrumb-scroll').forEach((btn) => btn.remove());

        // Check if content overflows
        if (list.scrollWidth > nav.clientWidth) {
            // Add scroll buttons
            const leftBtn = document.createElement('button');
            leftBtn.className = 'breadcrumb-scroll breadcrumb-scroll-left';
            leftBtn.innerHTML = '‹';
            leftBtn.setAttribute('aria-label', 'Scroll breadcrumb left');
            leftBtn.addEventListener('click', () => this.scrollBreadcrumb(panel, 'left'));

            const rightBtn = document.createElement('button');
            rightBtn.className = 'breadcrumb-scroll breadcrumb-scroll-right';
            rightBtn.innerHTML = '›';
            rightBtn.setAttribute('aria-label', 'Scroll breadcrumb right');
            rightBtn.addEventListener('click', () => this.scrollBreadcrumb(panel, 'right'));

            container.appendChild(leftBtn);
            container.appendChild(rightBtn);

            // Update button visibility
            this.updateScrollButtons(panel);

            // Add scroll listener
            nav.addEventListener('scroll', () => {
                this.updateScrollButtons(panel);
            });
        }
    }

    /**
     * Scroll breadcrumb navigation
     */
    scrollBreadcrumb(panel, direction) {
        const nav = this.breadcrumbs[panel].container.querySelector('.breadcrumb-nav');
        const scrollAmount = 200;

        if (direction === 'left') {
            nav.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        } else {
            nav.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Update scroll button visibility
     */
    updateScrollButtons(panel) {
        const container = this.breadcrumbs[panel].container;
        const nav = container.querySelector('.breadcrumb-nav');
        const leftBtn = container.querySelector('.breadcrumb-scroll-left');
        const rightBtn = container.querySelector('.breadcrumb-scroll-right');

        if (leftBtn && rightBtn) {
            // Hide/show left button
            if (nav.scrollLeft <= 0) {
                leftBtn.style.display = 'none';
            } else {
                leftBtn.style.display = 'block';
            }

            // Hide/show right button
            if (nav.scrollLeft >= nav.scrollWidth - nav.clientWidth - 1) {
                rightBtn.style.display = 'none';
            } else {
                rightBtn.style.display = 'block';
            }
        }
    }

    /**
     * Get current path from breadcrumb
     */
    getCurrentPath(panel) {
        const current = this.breadcrumbs[panel]?.list.querySelector('.breadcrumb-current');
        if (current) {
            const items = Array.from(this.breadcrumbs[panel].list.querySelectorAll('.breadcrumb-item'));
            const segments = items
                .slice(1)
                .map((item) => {
                    const link = item.querySelector('.breadcrumb-link, .breadcrumb-current');
                    return link?.querySelector('.breadcrumb-text')?.textContent || '';
                })
                .filter(Boolean);

            return `/${segments.join('/')}`;
        }
        return '/';
    }

    /**
     * Copy path to clipboard
     */
    copyPath(panel) {
        const path = this.getCurrentPath(panel);
        navigator.clipboard
            .writeText(path)
            .then(() => {
                this.app.showNotification(`Path copied: ${path}`, 'success');
            })
            .catch((err) => {
                console.error('Failed to copy path:', err);
                this.app.showNotification('Failed to copy path', 'error');
            });
    }

    /**
     * Refresh current directory, clearing cache
     */
    refreshDirectory(panel) {
        if (!this.app.panels || !this.app.panels.refresh) {
            console.warn('Panel refresh not available');
            return;
        }

        // Show notification
        this.app.showNotification('Refreshing directory...', 'info');

        // Call panel refresh which will reload the directory
        this.app.panels.refresh(panel);
    }

    async syncWithOtherPanel(panel) {
        if (!this.app.panels) {
            console.warn('Panels not available');
            return;
        }

        // Determine the other panel
        const otherPanel = panel === 'left' ? 'right' : 'left';

        // Get other panel's storage and path
        const otherStorage = this.app.panels.getCurrentStorage(otherPanel);
        const otherPath = this.app.panels.getCurrentPath(otherPanel);

        if (!otherStorage) {
            this.app.showNotification('Other panel has no storage', 'error');
            return;
        }

        try {
            // Show notification
            this.app.showNotification(`Syncing with ${otherPanel} panel...`, 'info');

            // Change storage and load the same path
            await this.app.panels.changeStorage(panel, otherStorage, true);
            await this.app.panels.loadDirectory(panel, otherPath);

            this.app.showNotification('Panels synced successfully', 'success');
        } catch (error) {
            console.error('Failed to sync panels:', error);
            this.app.showNotification('Failed to sync panels', 'error');
        }
    }
}
