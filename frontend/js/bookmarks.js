/**
 * Bookmarks/Favorites Module
 * Manages user bookmarks for quick access to favorite directories
 */

export class BookmarksManager {
    constructor(app) {
        this.app = app;
        this.bookmarks = [];
        this.categories = ['Default'];
        this.loadBookmarks();
        this.init();
    }

    init() {
        this.createBookmarksPanel();
        this.setupEventListeners();
        this.render();
    }

    createBookmarksPanel() {
        // Create bookmarks sidebar
        const sidebar = document.createElement('div');
        sidebar.id = 'bookmarks-sidebar';
        sidebar.className = 'bookmarks-sidebar';
        sidebar.innerHTML = `
            <div class="bookmarks-header">
                <h3>Bookmarks</h3>
                <div class="bookmarks-actions">
                    <button class="bookmark-btn" title="Add current directory" data-action="add">+</button>
                    <button class="bookmark-btn" title="Manage bookmarks" data-action="manage">⚙</button>
                    <button class="bookmark-btn" title="Toggle sidebar" data-action="toggle">◀</button>
                </div>
            </div>
            <div class="bookmarks-search">
                <input type="text" placeholder="Search bookmarks..." id="bookmarks-search-input">
            </div>
            <div class="bookmarks-categories">
                <select id="bookmarks-category-filter">
                    <option value="">All Categories</option>
                </select>
            </div>
            <div class="bookmarks-list" id="bookmarks-list">
                <!-- Bookmarks will be populated here -->
            </div>
            <div class="bookmarks-footer">
                <div class="bookmarks-stats">
                    <span id="bookmarks-count">0 bookmarks</span>
                </div>
            </div>
        `;

        // Create bookmarks management modal
        const modal = document.createElement('div');
        modal.id = 'bookmarks-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Manage Bookmarks</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="bookmarks-form">
                        <h3 id="bookmark-form-title">Add Bookmark</h3>
                        <input type="hidden" id="bookmark-id">
                        <div class="form-field">
                            <label>Name:</label>
                            <input type="text" id="bookmark-name" placeholder="Bookmark name">
                        </div>
                        <div class="form-field">
                            <label>Path:</label>
                            <input type="text" id="bookmark-path" placeholder="/path/to/directory">
                        </div>
                        <div class="form-field">
                            <label>Category:</label>
                            <select id="bookmark-category">
                                <option value="Default">Default</option>
                            </select>
                            <button id="add-category-btn">New Category</button>
                        </div>
                        <div class="form-field">
                            <label>Description:</label>
                            <textarea id="bookmark-description" rows="3" placeholder="Optional description"></textarea>
                        </div>
                        <div class="form-field">
                            <label>Color:</label>
                            <input type="color" id="bookmark-color" value="#007ACC">
                        </div>
                        <div class="form-field">
                            <label>Icon:</label>
                            <select id="bookmark-icon">
                                <option value="📁">📁 Folder</option>
                                <option value="⭐">⭐ Star</option>
                                <option value="🏠">🏠 Home</option>
                                <option value="💼">💼 Work</option>
                                <option value="📚">📚 Documents</option>
                                <option value="🎵">🎵 Music</option>
                                <option value="🎬">🎬 Videos</option>
                                <option value="🖼️">🖼️ Pictures</option>
                                <option value="💾">💾 Backup</option>
                                <option value="☁️">☁️ Cloud</option>
                                <option value="🔧">🔧 Tools</option>
                                <option value="📦">📦 Archive</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>
                                <input type="checkbox" id="bookmark-pin">
                                Pin to top
                            </label>
                        </div>
                        <div class="form-actions">
                            <button id="save-bookmark-btn" class="primary">Save</button>
                            <button id="cancel-bookmark-btn">Cancel</button>
                        </div>
                    </div>
                    <div class="bookmarks-table">
                        <h3>Existing Bookmarks</h3>
                        <div class="bookmarks-toolbar">
                            <button id="import-bookmarks-btn">Import</button>
                            <button id="export-bookmarks-btn">Export</button>
                            <button id="clear-bookmarks-btn" class="danger">Clear All</button>
                        </div>
                        <table id="bookmarks-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Path</th>
                                    <th>Category</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="bookmarks-table-body">
                                <!-- Bookmarks will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(sidebar);
        document.body.appendChild(modal);

        this.sidebar = sidebar;
        this.modal = modal;

        // Apply styles
        this.applyStyles();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .bookmarks-sidebar {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 250px;
                background: var(--panel-bg);
                border-right: 1px solid var(--border-color);
                display: flex;
                flex-direction: column;
                transform: translateX(0);
                transition: transform 0.3s ease;
                z-index: 100;
            }

            .bookmarks-sidebar.hidden {
                transform: translateX(-100%);
            }

            .bookmarks-header {
                padding: 10px;
                background: var(--header-bg);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .bookmarks-header h3 {
                margin: 0;
                font-size: 16px;
                color: var(--text-primary);
            }

            .bookmarks-actions {
                display: flex;
                gap: 5px;
            }

            .bookmark-btn {
                width: 24px;
                height: 24px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .bookmark-btn:hover {
                background: var(--hover-bg);
            }

            .bookmarks-search {
                padding: 10px;
                border-bottom: 1px solid var(--border-color);
            }

            .bookmarks-search input {
                width: 100%;
                padding: 6px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
            }

            .bookmarks-categories {
                padding: 10px;
                border-bottom: 1px solid var(--border-color);
            }

            .bookmarks-categories select {
                width: 100%;
                padding: 6px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
            }

            .bookmarks-list {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            }

            .bookmark-group {
                margin-bottom: 15px;
            }

            .bookmark-group-title {
                font-size: 12px;
                font-weight: bold;
                color: var(--text-secondary);
                text-transform: uppercase;
                margin-bottom: 5px;
                padding: 5px;
                background: var(--hover-bg);
                border-radius: 3px;
            }

            .bookmark-item {
                display: flex;
                align-items: center;
                padding: 8px;
                margin-bottom: 2px;
                background: var(--item-bg);
                border-radius: 3px;
                cursor: pointer;
                transition: background 0.2s;
                position: relative;
            }

            .bookmark-item:hover {
                background: var(--hover-bg);
            }

            .bookmark-item.active {
                background: var(--active-bg);
                border-left: 3px solid var(--primary-color);
            }

            .bookmark-item.pinned {
                background: var(--pinned-bg);
            }

            .bookmark-icon {
                margin-right: 8px;
                font-size: 18px;
                flex-shrink: 0;
            }

            .bookmark-info {
                flex: 1;
                min-width: 0;
            }

            .bookmark-name {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .bookmark-path {
                font-size: 11px;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .bookmark-actions-inline {
                position: absolute;
                right: 5px;
                top: 50%;
                transform: translateY(-50%);
                display: none;
                gap: 3px;
            }

            .bookmark-item:hover .bookmark-actions-inline {
                display: flex;
            }

            .bookmark-action {
                width: 20px;
                height: 20px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-secondary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .bookmark-action:hover {
                background: var(--primary-color);
                color: white;
            }

            .bookmarks-footer {
                padding: 10px;
                background: var(--footer-bg);
                border-top: 1px solid var(--border-color);
            }

            .bookmarks-stats {
                font-size: 12px;
                color: var(--text-secondary);
            }

            /* Modal Styles */
            #bookmarks-modal {
                display: none;
            }

            #bookmarks-modal.show {
                display: flex;
            }

            #bookmarks-modal .modal-content {
                width: 700px;
                max-width: 90vw;
            }

            .bookmarks-form {
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
            }

            .bookmarks-form h3 {
                margin-top: 0;
                color: var(--text-primary);
            }

            .form-field {
                margin-bottom: 15px;
            }

            .form-field label {
                display: block;
                margin-bottom: 5px;
                font-size: 13px;
                color: var(--text-secondary);
            }

            .form-field input[type="text"],
            .form-field input[type="color"],
            .form-field select,
            .form-field textarea {
                width: 100%;
                padding: 8px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                font-family: inherit;
            }

            .form-field input[type="color"] {
                width: 60px;
                height: 35px;
                padding: 2px;
            }

            .form-field input[type="checkbox"] {
                margin-right: 5px;
            }

            #add-category-btn {
                margin-left: 10px;
                padding: 6px 12px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
            }

            .form-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }

            .form-actions button {
                padding: 8px 16px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
            }

            .form-actions button.primary {
                background: var(--primary-color);
                border-color: var(--primary-color);
                color: white;
            }

            .bookmarks-table {
                padding: 20px;
            }

            .bookmarks-table h3 {
                margin-top: 0;
                color: var(--text-primary);
            }

            .bookmarks-toolbar {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .bookmarks-toolbar button {
                padding: 6px 12px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
            }

            .bookmarks-toolbar button.danger {
                background: #f44336;
                border-color: #f44336;
                color: white;
            }

            #bookmarks-table {
                width: 100%;
                border-collapse: collapse;
            }

            #bookmarks-table th {
                text-align: left;
                padding: 8px;
                background: var(--header-bg);
                border-bottom: 2px solid var(--border-color);
                color: var(--text-primary);
                font-size: 13px;
            }

            #bookmarks-table td {
                padding: 8px;
                border-bottom: 1px solid var(--border-color);
                color: var(--text-primary);
                font-size: 13px;
            }

            #bookmarks-table tr:hover {
                background: var(--hover-bg);
            }

            .table-actions {
                display: flex;
                gap: 5px;
            }

            .table-action {
                padding: 4px 8px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 12px;
            }

            /* Drag and drop styles */
            .bookmark-item.dragging {
                opacity: 0.5;
            }

            .bookmark-item.drag-over {
                border-top: 2px solid var(--primary-color);
            }

            /* Responsive adjustments */
            body.bookmarks-visible #main-container {
                margin-left: 250px;
                transition: margin-left 0.3s ease;
            }

            /* Quick access bar */
            .bookmarks-quickbar {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 40px;
                background: var(--panel-bg);
                border-top: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                padding: 0 10px;
                gap: 10px;
                overflow-x: auto;
                z-index: 99;
            }

            .quickbar-item {
                display: flex;
                align-items: center;
                padding: 5px 10px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
                white-space: nowrap;
                font-size: 13px;
            }

            .quickbar-item:hover {
                background: var(--hover-bg);
            }

            .quickbar-item .icon {
                margin-right: 5px;
            }
        `;

        if (!document.querySelector('#bookmarks-styles')) {
            style.id = 'bookmarks-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Sidebar actions
        this.sidebar.querySelector('[data-action="add"]').addEventListener('click', () => {
            this.addCurrentDirectory();
        });

        this.sidebar.querySelector('[data-action="manage"]').addEventListener('click', () => {
            this.showModal();
        });

        this.sidebar.querySelector('[data-action="toggle"]').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Search functionality
        this.sidebar.querySelector('#bookmarks-search-input').addEventListener('input', (e) => {
            this.filterBookmarks(e.target.value);
        });

        // Category filter
        this.sidebar.querySelector('#bookmarks-category-filter').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Modal actions
        this.modal.querySelector('.close-btn').addEventListener('click', () => {
            this.hideModal();
        });

        this.modal.querySelector('#save-bookmark-btn').addEventListener('click', () => {
            this.saveBookmark();
        });

        this.modal.querySelector('#cancel-bookmark-btn').addEventListener('click', () => {
            this.resetForm();
        });

        this.modal.querySelector('#add-category-btn').addEventListener('click', () => {
            this.addCategory();
        });

        this.modal.querySelector('#import-bookmarks-btn').addEventListener('click', () => {
            this.importBookmarks();
        });

        this.modal.querySelector('#export-bookmarks-btn').addEventListener('click', () => {
            this.exportBookmarks();
        });

        this.modal.querySelector('#clear-bookmarks-btn').addEventListener('click', () => {
            this.clearAllBookmarks();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.addCurrentDirectory();
            }
        });

        // Close modal on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    loadBookmarks() {
        const saved = localStorage.getItem('jacommander_bookmarks');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.bookmarks = data.bookmarks || [];
                this.categories = data.categories || ['Default'];
            } catch (e) {
                console.error('Failed to load bookmarks:', e);
                this.bookmarks = [];
                this.categories = ['Default'];
            }
        }
    }

    saveBookmarksToStorage() {
        const data = {
            bookmarks: this.bookmarks,
            categories: this.categories
        };
        localStorage.setItem('jacommander_bookmarks', JSON.stringify(data));
    }

    addCurrentDirectory() {
        const activePanel = this.app.panels[this.app.activePanel];
        if (!activePanel) {
            return;
        }

        const path = activePanel.currentPath;
        const name = path === '/' ? 'Root' : path.split('/').pop();

        // Check if already bookmarked
        if (this.bookmarks.some((b) => b.path === path)) {
            alert('This directory is already bookmarked');
            return;
        }

        // Show modal with pre-filled path
        this.showModal();
        this.modal.querySelector('#bookmark-name').value = name;
        this.modal.querySelector('#bookmark-path').value = path;
        this.modal.querySelector('#bookmark-form-title').textContent = 'Add Bookmark';
    }

    showModal() {
        this.modal.classList.add('show');
        this.renderBookmarksTable();
        this.updateCategoryOptions();
    }

    hideModal() {
        this.modal.classList.remove('show');
        this.resetForm();
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('hidden');
        document.body.classList.toggle('bookmarks-visible');
    }

    resetForm() {
        this.modal.querySelector('#bookmark-id').value = '';
        this.modal.querySelector('#bookmark-name').value = '';
        this.modal.querySelector('#bookmark-path').value = '';
        this.modal.querySelector('#bookmark-category').value = 'Default';
        this.modal.querySelector('#bookmark-description').value = '';
        this.modal.querySelector('#bookmark-color').value = '#007ACC';
        this.modal.querySelector('#bookmark-icon').value = '📁';
        this.modal.querySelector('#bookmark-pin').checked = false;
        this.modal.querySelector('#bookmark-form-title').textContent = 'Add Bookmark';
    }

    saveBookmark() {
        const id = this.modal.querySelector('#bookmark-id').value;
        const name = this.modal.querySelector('#bookmark-name').value.trim();
        const path = this.modal.querySelector('#bookmark-path').value.trim();
        const category = this.modal.querySelector('#bookmark-category').value;
        const description = this.modal.querySelector('#bookmark-description').value.trim();
        const color = this.modal.querySelector('#bookmark-color').value;
        const icon = this.modal.querySelector('#bookmark-icon').value;
        const pinned = this.modal.querySelector('#bookmark-pin').checked;

        if (!name || !path) {
            alert('Please enter both name and path');
            return;
        }

        const bookmark = {
            id: id || Date.now().toString(),
            name,
            path,
            category,
            description,
            color,
            icon,
            pinned,
            created: id ? undefined : new Date().toISOString(),
            lastUsed: null,
            useCount: 0
        };

        if (id) {
            // Update existing bookmark
            const index = this.bookmarks.findIndex((b) => b.id === id);
            if (index >= 0) {
                bookmark.created = this.bookmarks[index].created;
                bookmark.lastUsed = this.bookmarks[index].lastUsed;
                bookmark.useCount = this.bookmarks[index].useCount;
                this.bookmarks[index] = bookmark;
            }
        } else {
            // Add new bookmark
            this.bookmarks.push(bookmark);
        }

        this.saveBookmarksToStorage();
        this.render();
        this.renderBookmarksTable();
        this.resetForm();
        this.showNotification('Bookmark saved successfully');
    }

    deleteBookmark(id) {
        if (!confirm('Delete this bookmark?')) {
            return;
        }

        this.bookmarks = this.bookmarks.filter((b) => b.id !== id);
        this.saveBookmarksToStorage();
        this.render();
        this.renderBookmarksTable();
    }

    editBookmark(id) {
        const bookmark = this.bookmarks.find((b) => b.id === id);
        if (!bookmark) {
            return;
        }

        this.modal.querySelector('#bookmark-id').value = bookmark.id;
        this.modal.querySelector('#bookmark-name').value = bookmark.name;
        this.modal.querySelector('#bookmark-path').value = bookmark.path;
        this.modal.querySelector('#bookmark-category').value = bookmark.category;
        this.modal.querySelector('#bookmark-description').value = bookmark.description || '';
        this.modal.querySelector('#bookmark-color').value = bookmark.color;
        this.modal.querySelector('#bookmark-icon').value = bookmark.icon;
        this.modal.querySelector('#bookmark-pin').checked = bookmark.pinned;
        this.modal.querySelector('#bookmark-form-title').textContent = 'Edit Bookmark';
    }

    openBookmark(bookmark) {
        const activePanel = this.app.panels[this.app.activePanel];
        if (activePanel) {
            activePanel.navigate(bookmark.path);

            // Update usage stats
            bookmark.lastUsed = new Date().toISOString();
            bookmark.useCount = (bookmark.useCount || 0) + 1;
            this.saveBookmarksToStorage();
        }
    }

    render() {
        const listContainer = this.sidebar.querySelector('#bookmarks-list');
        listContainer.innerHTML = '';

        // Sort bookmarks
        const sorted = [...this.bookmarks].sort((a, b) => {
            if (a.pinned && !b.pinned) {
                return -1;
            }
            if (!a.pinned && b.pinned) {
                return 1;
            }
            return a.name.localeCompare(b.name);
        });

        // Group by category
        const groups = {};
        sorted.forEach((bookmark) => {
            const category = bookmark.category || 'Default';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(bookmark);
        });

        // Render groups
        Object.entries(groups).forEach(([category, bookmarks]) => {
            const group = document.createElement('div');
            group.className = 'bookmark-group';

            const title = document.createElement('div');
            title.className = 'bookmark-group-title';
            title.textContent = category;
            group.appendChild(title);

            bookmarks.forEach((bookmark) => {
                const item = document.createElement('div');
                item.className = 'bookmark-item';
                if (bookmark.pinned) {
                    item.classList.add('pinned');
                }

                item.innerHTML = `
                    <span class="bookmark-icon">${bookmark.icon}</span>
                    <div class="bookmark-info">
                        <div class="bookmark-name">${bookmark.name}</div>
                        <div class="bookmark-path">${bookmark.path}</div>
                    </div>
                    <div class="bookmark-actions-inline">
                        <button class="bookmark-action" data-action="edit" data-id="${bookmark.id}" title="Edit">✏</button>
                        <button class="bookmark-action" data-action="delete" data-id="${bookmark.id}" title="Delete">🗑</button>
                    </div>
                `;

                // Click to open
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.bookmark-actions-inline')) {
                        this.openBookmark(bookmark);
                    }
                });

                // Inline actions
                item.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editBookmark(bookmark.id);
                    this.showModal();
                });

                item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteBookmark(bookmark.id);
                });

                // Drag and drop
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('bookmark-id', bookmark.id);
                    item.classList.add('dragging');
                });

                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                });

                group.appendChild(item);
            });

            listContainer.appendChild(group);
        });

        // Update count
        this.sidebar.querySelector('#bookmarks-count').textContent =
            `${this.bookmarks.length} bookmark${this.bookmarks.length === 1 ? '' : 's'}`;

        // Update category filter
        this.updateCategoryFilter();
    }

    renderBookmarksTable() {
        const tbody = this.modal.querySelector('#bookmarks-table-body');
        tbody.innerHTML = '';

        this.bookmarks.forEach((bookmark) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${bookmark.icon} ${bookmark.name}</td>
                <td>${bookmark.path}</td>
                <td>${bookmark.category}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-action" data-action="edit" data-id="${bookmark.id}">Edit</button>
                        <button class="table-action" data-action="delete" data-id="${bookmark.id}">Delete</button>
                    </div>
                </td>
            `;

            tr.querySelector('[data-action="edit"]').addEventListener('click', () => {
                this.editBookmark(bookmark.id);
            });

            tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
                this.deleteBookmark(bookmark.id);
            });

            tbody.appendChild(tr);
        });
    }

    updateCategoryOptions() {
        const select = this.modal.querySelector('#bookmark-category');
        const currentValue = select.value;
        select.innerHTML = '';

        this.categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });

        select.value = currentValue || 'Default';
    }

    updateCategoryFilter() {
        const select = this.sidebar.querySelector('#bookmarks-category-filter');
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Categories</option>';

        this.categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });

        select.value = currentValue;
    }

    addCategory() {
        const name = prompt('Enter new category name:');
        if (name && !this.categories.includes(name)) {
            this.categories.push(name);
            this.saveBookmarksToStorage();
            this.updateCategoryOptions();
            this.modal.querySelector('#bookmark-category').value = name;
        }
    }

    filterBookmarks(query) {
        const items = this.sidebar.querySelectorAll('.bookmark-item');
        const lowerQuery = query.toLowerCase();

        items.forEach((item) => {
            const name = item.querySelector('.bookmark-name').textContent.toLowerCase();
            const path = item.querySelector('.bookmark-path').textContent.toLowerCase();
            const matches = name.includes(lowerQuery) || path.includes(lowerQuery);
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    filterByCategory(category) {
        const groups = this.sidebar.querySelectorAll('.bookmark-group');

        groups.forEach((group) => {
            const title = group.querySelector('.bookmark-group-title').textContent;
            group.style.display = !category || title === category ? 'block' : 'none';
        });
    }

    importBookmarks() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (data.bookmarks && Array.isArray(data.bookmarks)) {
                    this.bookmarks = [...this.bookmarks, ...data.bookmarks];
                    if (data.categories) {
                        data.categories.forEach((cat) => {
                            if (!this.categories.includes(cat)) {
                                this.categories.push(cat);
                            }
                        });
                    }
                    this.saveBookmarksToStorage();
                    this.render();
                    this.renderBookmarksTable();
                    this.showNotification('Bookmarks imported successfully');
                }
            } catch (error) {
                alert(`Failed to import bookmarks: ${error.message}`);
            }
        });

        input.click();
    }

    exportBookmarks() {
        const data = {
            bookmarks: this.bookmarks,
            categories: this.categories,
            exported: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearAllBookmarks() {
        if (!confirm('Are you sure you want to delete all bookmarks? This cannot be undone.')) {
            return;
        }

        this.bookmarks = [];
        this.categories = ['Default'];
        this.saveBookmarksToStorage();
        this.render();
        this.renderBookmarksTable();
        this.showNotification('All bookmarks cleared');
    }

    showNotification(message) {
        // TODO: Implement toast notification system
        console.log('Notification:', message);
    }

    // Create quick access bar for frequently used bookmarks
    createQuickAccessBar() {
        const bar = document.createElement('div');
        bar.className = 'bookmarks-quickbar';

        // Get top 5 most used bookmarks
        const topBookmarks = [...this.bookmarks]
            .filter((b) => b.useCount > 0)
            .sort((a, b) => b.useCount - a.useCount)
            .slice(0, 5);

        topBookmarks.forEach((bookmark) => {
            const item = document.createElement('div');
            item.className = 'quickbar-item';
            item.innerHTML = `
                <span class="icon">${bookmark.icon}</span>
                <span>${bookmark.name}</span>
            `;
            item.addEventListener('click', () => this.openBookmark(bookmark));
            bar.appendChild(item);
        });

        return bar;
    }
}

// Export for global use
window.BookmarksManager = BookmarksManager;
