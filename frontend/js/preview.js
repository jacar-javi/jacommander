/**
 * File Preview Module
 * Provides quick file preview on hover functionality
 */

import { SyntaxHighlighter } from './syntax.js';

export class FilePreview {
    constructor(app) {
        this.app = app;
        this.syntaxHighlighter = new SyntaxHighlighter();
        this.previewElement = null;
        this.currentPreview = null;
        this.hoverTimer = null;
        this.fetchController = null;
        this.cache = new Map();
        this.maxCacheSize = 50;
        this.previewDelay = 500; // ms before showing preview
        this.maxPreviewLines = 15;
        this.maxFileSize = 100 * 1024; // 100KB max for preview

        this.init();
    }

    init() {
        // Create preview element
        this.createPreviewElement();

        // Setup global event listeners
        this.setupEventListeners();

        // Set syntax highlighter theme
        const theme = document.body.className.replace('theme-', '');
        this.syntaxHighlighter.setTheme(theme === 'high-contrast' ? 'highContrast' : theme);
    }

    createPreviewElement() {
        // Create preview container
        this.previewElement = document.createElement('div');
        this.previewElement.className = 'file-preview';
        this.previewElement.style.display = 'none';
        this.previewElement.innerHTML = `
            <div class="preview-header">
                <span class="preview-icon"></span>
                <span class="preview-title"></span>
                <span class="preview-badge"></span>
            </div>
            <div class="preview-content"></div>
            <div class="preview-footer">
                <span class="preview-size"></span>
                <span class="preview-modified"></span>
                <span class="preview-permissions"></span>
            </div>
        `;
        document.body.appendChild(this.previewElement);
    }

    setupEventListeners() {
        // Hide preview on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hidePreview();
            }
        });

        // Hide preview on scroll
        document.querySelectorAll('.file-list').forEach((list) => {
            list.addEventListener(
                'scroll',
                () => {
                    this.hidePreview();
                },
                { passive: true }
            );
        });

        // Update theme when it changes
        const observer = new MutationObserver(() => {
            const theme = document.body.className.replace('theme-', '');
            this.syntaxHighlighter.setTheme(theme === 'high-contrast' ? 'highContrast' : theme);
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    /**
     * Attach preview functionality to a file item
     */
    attachToFileItem(element, file, panel) {
        // Skip directories and special files
        if (file.is_dir || file.name.startsWith('.')) {
            return;
        }

        // Mouse enter - start timer
        element.addEventListener('mouseenter', (e) => {
            // Clear any existing timer
            this.clearHoverTimer();

            // Don't show preview if a modal is open
            if (document.querySelector('.modal[style*="block"]')) {
                return;
            }

            // Start hover timer
            this.hoverTimer = setTimeout(() => {
                this.showPreview(file, panel, e.currentTarget);
            }, this.previewDelay);
        });

        // Mouse leave - clear timer and hide preview
        element.addEventListener('mouseleave', () => {
            this.clearHoverTimer();

            // Hide preview after a short delay
            setTimeout(() => {
                if (!this.previewElement.matches(':hover')) {
                    this.hidePreview();
                }
            }, 100);
        });

        // Keep preview open when hovering over it
        this.previewElement.addEventListener('mouseenter', () => {
            this.clearHoverTimer();
        });

        this.previewElement.addEventListener('mouseleave', () => {
            this.hidePreview();
        });
    }

    /**
     * Show file preview
     */
    async showPreview(file, panel, element) {
        // Don't show for large files
        if (file.size > this.maxFileSize) {
            this.showMetadataOnly(file, element);
            return;
        }

        const storage = this.app.panels.getCurrentStorage(panel);
        const path = `${this.app.panels.getCurrentPath(panel)}/${file.name}`;
        const cacheKey = `${storage}:${path}`;

        try {
            let content;

            // Check cache first
            if (this.cache.has(cacheKey)) {
                content = this.cache.get(cacheKey);
            } else {
                // Cancel any pending request
                if (this.fetchController) {
                    this.fetchController.abort();
                }

                // Create new abort controller
                this.fetchController = new AbortController();

                // Fetch file content
                const response = await fetch(
                    `/api/fs/download?storage=${storage}&path=${encodeURIComponent(path.replace('//', '/'))}`,
                    { signal: this.fetchController.signal }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch file');
                }

                content = await response.text();

                // Cache the content
                this.addToCache(cacheKey, content);
            }

            // Display preview
            this.displayPreview(file, content, element);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Preview error:', error);
                this.showMetadataOnly(file, element);
            }
        }
    }

    /**
     * Display the preview with content
     */
    displayPreview(file, content, element) {
        // Update header
        const icon = file.is_dir ? '📁' : this.getFileIcon(file.name);
        this.previewElement.querySelector('.preview-icon').textContent = icon;
        this.previewElement.querySelector('.preview-title').textContent = file.name;

        // Detect language and show badge
        const language = this.syntaxHighlighter.detectLanguage(file.name);
        const badge = this.previewElement.querySelector('.preview-badge');
        if (language !== 'plaintext') {
            badge.textContent = language.toUpperCase();
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }

        // Prepare content for preview
        const lines = content.split('\n');
        const previewLines = lines.slice(0, this.maxPreviewLines);
        let previewContent = previewLines.join('\n');

        if (lines.length > this.maxPreviewLines) {
            previewContent += '\n...';
        }

        // Apply syntax highlighting for code files
        const contentElement = this.previewElement.querySelector('.preview-content');
        if (this.isTextFile(file.name)) {
            if (language !== 'plaintext') {
                // Apply syntax highlighting
                contentElement.innerHTML = this.syntaxHighlighter.highlight(previewContent, language);
                contentElement.classList.add('highlighted');
            } else {
                // Plain text
                contentElement.textContent = previewContent;
                contentElement.classList.remove('highlighted');
            }
        } else if (this.isImageFile(file.name)) {
            // For images, show a thumbnail
            contentElement.innerHTML = `<div class="preview-image">🖼️ Image file (${this.formatFileSize(file.size)})</div>`;
            contentElement.classList.remove('highlighted');
        } else {
            // Binary or unknown file type
            contentElement.innerHTML = `<div class="preview-binary">Binary file (${this.formatFileSize(file.size)})</div>`;
            contentElement.classList.remove('highlighted');
        }

        // Update footer
        this.updateFooter(file);

        // Position and show
        this.positionPreview(element);
        this.previewElement.style.display = 'block';
        this.previewElement.classList.add('preview-visible');
    }

    /**
     * Show only metadata for large files
     */
    showMetadataOnly(file, element) {
        // Update header
        const icon = file.is_dir ? '📁' : this.getFileIcon(file.name);
        this.previewElement.querySelector('.preview-icon').textContent = icon;
        this.previewElement.querySelector('.preview-title').textContent = file.name;

        // Hide badge
        this.previewElement.querySelector('.preview-badge').style.display = 'none';

        // Show file info instead of content
        const contentElement = this.previewElement.querySelector('.preview-content');
        contentElement.innerHTML = `
            <div class="preview-info">
                <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${this.getFileType(file.name)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Size:</span>
                    <span class="info-value">${this.formatFileSize(file.size)}</span>
                </div>
                ${
    file.size > this.maxFileSize
        ? `
                <div class="info-note">
                    File too large for preview (>${this.formatFileSize(this.maxFileSize)})
                </div>`
        : ''
}
            </div>
        `;
        contentElement.classList.remove('highlighted');

        // Update footer
        this.updateFooter(file);

        // Position and show
        this.positionPreview(element);
        this.previewElement.style.display = 'block';
        this.previewElement.classList.add('preview-visible');
    }

    /**
     * Update preview footer with file metadata
     */
    updateFooter(file) {
        const sizeElement = this.previewElement.querySelector('.preview-size');
        const modifiedElement = this.previewElement.querySelector('.preview-modified');
        const permissionsElement = this.previewElement.querySelector('.preview-permissions');

        sizeElement.textContent = this.formatFileSize(file.size);
        modifiedElement.textContent = this.formatDate(file.modified);
        permissionsElement.textContent = file.permissions || 'rw-r--r--';
    }

    /**
     * Position preview near the hovered element
     */
    positionPreview(element) {
        const rect = element.getBoundingClientRect();
        const previewRect = this.previewElement.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Determine best position (prefer right, fallback to left)
        let left, top;

        // Try to position to the right of the element
        if (rect.right + previewRect.width + 20 < windowWidth) {
            left = rect.right + 10;
        } else if (rect.left - previewRect.width - 20 > 0) {
            // Position to the left
            left = rect.left - previewRect.width - 10;
        } else {
            // Center horizontally
            left = (windowWidth - previewRect.width) / 2;
        }

        // Vertical position (align with element, but keep in viewport)
        top = rect.top;

        // Ensure preview doesn't go below viewport
        if (top + previewRect.height > windowHeight - 20) {
            top = windowHeight - previewRect.height - 20;
        }

        // Ensure preview doesn't go above viewport
        if (top < 20) {
            top = 20;
        }

        this.previewElement.style.left = `${left}px`;
        this.previewElement.style.top = `${top}px`;
    }

    /**
     * Hide preview
     */
    hidePreview() {
        this.clearHoverTimer();
        if (this.fetchController) {
            this.fetchController.abort();
            this.fetchController = null;
        }
        this.previewElement.classList.remove('preview-visible');
        setTimeout(() => {
            if (!this.previewElement.classList.contains('preview-visible')) {
                this.previewElement.style.display = 'none';
            }
        }, 200);
    }

    /**
     * Clear hover timer
     */
    clearHoverTimer() {
        if (this.hoverTimer) {
            clearTimeout(this.hoverTimer);
            this.hoverTimer = null;
        }
    }

    /**
     * Add content to cache with size limit
     */
    addToCache(key, content) {
        // Remove oldest items if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, content);
    }

    /**
     * Clear preview cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Check if file is a text file
     */
    isTextFile(filename) {
        const textExtensions = [
            'txt',
            'md',
            'js',
            'ts',
            'jsx',
            'tsx',
            'json',
            'html',
            'css',
            'scss',
            'py',
            'go',
            'rs',
            'java',
            'c',
            'cpp',
            'h',
            'hpp',
            'cs',
            'php',
            'rb',
            'sh',
            'bash',
            'yaml',
            'yml',
            'toml',
            'ini',
            'conf',
            'cfg',
            'xml',
            'svg',
            'sql',
            'log',
            'env',
            'gitignore',
            'dockerfile',
            'makefile',
            'vue',
            'jsx'
        ];

        const ext = filename.split('.').pop().toLowerCase();
        return (
            textExtensions.includes(ext) ||
            filename.toLowerCase() === 'dockerfile' ||
            filename.toLowerCase() === 'makefile'
        );
    }

    /**
     * Check if file is an image
     */
    isImageFile(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
        const ext = filename.split('.').pop().toLowerCase();
        return imageExtensions.includes(ext);
    }

    /**
     * Get file type description
     */
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const typeMap = {
            js: 'JavaScript',
            ts: 'TypeScript',
            py: 'Python',
            go: 'Go',
            rs: 'Rust',
            java: 'Java',
            html: 'HTML',
            css: 'CSS',
            json: 'JSON',
            md: 'Markdown',
            txt: 'Text',
            pdf: 'PDF Document',
            zip: 'ZIP Archive',
            tar: 'TAR Archive',
            gz: 'Gzip Archive'
        };

        return typeMap[ext] || `${ext.toUpperCase()} File`;
    }

    /**
     * Get appropriate icon for file type
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            js: '📜',
            ts: '📘',
            json: '📋',
            html: '🌐',
            css: '🎨',
            scss: '🎨',
            py: '🐍',
            go: '🐹',
            rs: '🦀',
            java: '☕',
            c: '📄',
            cpp: '📄',
            md: '📝',
            txt: '📄',
            pdf: '📕',
            zip: '📦',
            tar: '📦',
            gz: '📦',
            jpg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            mp3: '🎵',
            mp4: '🎬',
            avi: '🎬',
            exe: '⚙️',
            dll: '⚙️',
            so: '⚙️'
        };

        return iconMap[ext] || '📄';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) {return '0 B';}
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) {return 'Unknown';}

        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // If today, show time
        if (diff < 86400000 && date.getDate() === now.getDate()) {
            return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // If this year, show month and day
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        // Otherwise show full date
        return date.toLocaleDateString();
    }
}
