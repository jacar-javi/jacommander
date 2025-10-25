// File Operations Module
import { SyntaxHighlighter } from './syntax.js';

export class FileOperations {
    constructor(app) {
        this.app = app;
        this.syntaxHighlighter = new SyntaxHighlighter();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Copy modal
        document.getElementById('copy-confirm').addEventListener('click', () => {
            this.performCopy();
        });

        // Move modal
        // Note: We'll reuse the copy modal for move operations

        // Create directory modal
        document.getElementById('mkdir-confirm').addEventListener('click', () => {
            this.performMkdir();
        });

        // Delete modal
        document.getElementById('delete-confirm').addEventListener('click', () => {
            this.performDelete();
        });

        // Compress modal
        document.getElementById('compress-confirm').addEventListener('click', () => {
            this.performCompress();
        });

        // Edit modal save
        document.getElementById('edit-save').addEventListener('click', () => {
            this.saveEditedFile();
        });

        // Handle Enter key in mkdir input
        document.getElementById('mkdir-name').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('mkdir-confirm').click();
            }
        });
    }

    // View file (F3)
    async viewFile(panel, file) {
        if (!file || file.is_dir) {
            return;
        }

        const storage = this.app.panels.getCurrentStorage(panel);
        const path = `${this.app.panels.getCurrentPath(panel)}/${file.name}`;

        try {
            // For now, fetch file content via download endpoint
            // In a real implementation, we'd have a separate view endpoint
            const response = await fetch(
                `/api/fs/download?storage=${storage}&path=${encodeURIComponent(path.replace('//', '/'))}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch file');
            }

            const content = await response.text();

            // Show in view modal
            document.getElementById('view-title').textContent = `View: ${file.name}`;
            const viewContent = document.getElementById('view-content');

            // Apply syntax highlighting based on file type
            const language = this.syntaxHighlighter.detectLanguage(file.name);

            // Set theme based on current app theme
            const currentTheme = document.body.className.replace('theme-', '');
            this.syntaxHighlighter.setTheme(currentTheme === 'high-contrast' ? 'highContrast' : currentTheme);

            // Apply highlighting
            viewContent.innerHTML = this.syntaxHighlighter.highlight(content, language);

            // Add language badge
            if (language !== 'plaintext') {
                const badge = document.createElement('div');
                badge.className = 'language-badge';
                badge.textContent = language.toUpperCase();
                viewContent.parentElement.appendChild(badge);
            }

            this.app.showModal('view-modal');
        } catch (error) {
            console.error('Failed to view file:', error);
            this.app.showNotification(`Failed to view file: ${error.message}`, 'error');
        }
    }

    // Edit file (F4)
    async editFile(panel, file) {
        if (!file || file.is_dir) {
            return;
        }

        const storage = this.app.panels.getCurrentStorage(panel);
        const path = `${this.app.panels.getCurrentPath(panel)}/${file.name}`;

        try {
            const response = await fetch(
                `/api/fs/download?storage=${storage}&path=${encodeURIComponent(path.replace('//', '/'))}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch file');
            }

            const content = await response.text();

            // Show in edit modal
            document.getElementById('edit-title').textContent = `Edit: ${file.name}`;
            document.getElementById('edit-content').value = content;
            document.getElementById('edit-content').dataset.storage = storage;
            document.getElementById('edit-content').dataset.path = path.replace('//', '/');
            document.getElementById('edit-content').dataset.panel = panel;
            this.app.showModal('edit-modal');

            // Focus on editor
            setTimeout(() => {
                document.getElementById('edit-content').focus();
            }, 100);
        } catch (error) {
            console.error('Failed to edit file:', error);
            this.app.showNotification(`Failed to edit file: ${error.message}`, 'error');
        }
    }

    // Save edited file
    async saveEditedFile() {
        const editor = document.getElementById('edit-content');
        const storage = editor.dataset.storage;
        const path = editor.dataset.path;
        const panel = editor.dataset.panel;
        const content = editor.value;

        try {
            // Create a form data object for file upload
            const formData = new FormData();
            formData.append('storage', storage);
            formData.append('path', path.substring(0, path.lastIndexOf('/')));

            const blob = new Blob([content], { type: 'text/plain' });
            const filename = path.substring(path.lastIndexOf('/') + 1);
            formData.append('file', blob, filename);

            const response = await fetch('/api/fs/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('File saved successfully', 'success');
                this.app.closeModal('edit-modal');

                // Refresh the panel
                this.app.panels.refresh(panel);
            } else {
                throw new Error(data.error?.message || 'Failed to save file');
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            this.app.showNotification(`Failed to save file: ${error.message}`, 'error');
        }
    }

    // Create new file (Shift+F4)
    async createNewFile(panel) {
        const filename = prompt('Enter filename:');
        if (!filename) {
            return;
        }

        const storage = this.app.panels.getCurrentStorage(panel);
        const path = this.app.panels.getCurrentPath(panel);

        try {
            // Create an empty file
            const formData = new FormData();
            formData.append('storage', storage);
            formData.append('path', path);

            const blob = new Blob([''], { type: 'text/plain' });
            formData.append('file', blob, filename);

            const response = await fetch('/api/fs/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('File created successfully', 'success');
                this.app.panels.refresh(panel);

                // Open for editing
                const file = { name: filename, is_dir: false };
                this.editFile(panel, file);
            } else {
                throw new Error(data.error?.message || 'Failed to create file');
            }
        } catch (error) {
            console.error('Failed to create file:', error);
            this.app.showNotification(`Failed to create file: ${error.message}`, 'error');
        }
    }

    // Copy files (F5)
    copyFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const otherPanel = panel === 'left' ? 'right' : 'left';
        const destPath = this.app.panels.getCurrentPath(otherPanel);

        // Show copy modal
        document.getElementById('copy-title').textContent = 'Copy Files';
        document.getElementById('copy-message').textContent = 'Copy selected files to:';
        document.getElementById('copy-destination').value = destPath;
        document.getElementById('copy-destination').dataset.operation = 'copy';
        document.getElementById('copy-destination').dataset.sourcePanel = panel;
        document.getElementById('copy-confirm').textContent = 'Copy';

        // Show file list
        const filesList = document.getElementById('copy-files-list');
        filesList.innerHTML = selectedFiles.map((f) => `<div class="file-list-preview-item">${f}</div>`).join('');

        this.app.showModal('copy-modal');
    }

    // Move files (F6)
    moveFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const otherPanel = panel === 'left' ? 'right' : 'left';
        const destPath = this.app.panels.getCurrentPath(otherPanel);

        // Show move modal (reusing copy modal)
        document.getElementById('copy-title').textContent = 'Move Files';
        document.getElementById('copy-message').textContent = 'Move selected files to:';
        document.getElementById('copy-destination').value = destPath;
        document.getElementById('copy-destination').dataset.operation = 'move';
        document.getElementById('copy-destination').dataset.sourcePanel = panel;
        document.getElementById('copy-confirm').textContent = 'Move';

        // Show file list
        const filesList = document.getElementById('copy-files-list');
        filesList.innerHTML = selectedFiles.map((f) => `<div class="file-list-preview-item">${f}</div>`).join('');

        this.app.showModal('copy-modal');
    }

    // Perform copy/move operation
    async performCopy() {
        const destinationInput = document.getElementById('copy-destination');
        const operation = destinationInput.dataset.operation;
        const sourcePanel = destinationInput.dataset.sourcePanel;
        const destPath = destinationInput.value;

        const selectedFiles = this.app.panels.getSelectedFiles(sourcePanel);
        const srcStorage = this.app.panels.getCurrentStorage(sourcePanel);
        const srcPath = this.app.panels.getCurrentPath(sourcePanel);

        // Determine destination panel and storage
        const otherPanel = sourcePanel === 'left' ? 'right' : 'left';
        let dstStorage = this.app.panels.getCurrentStorage(otherPanel);

        // If destination path looks like it's for the other panel, use that storage
        if (destPath === this.app.panels.getCurrentPath(otherPanel)) {
            dstStorage = this.app.panels.getCurrentStorage(otherPanel);
        } else {
            // Otherwise, use the same storage as source
            dstStorage = srcStorage;
        }

        try {
            const endpoint = operation === 'copy' ? '/api/fs/copy' : '/api/fs/move';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    src_storage: srcStorage,
                    dst_storage: dstStorage,
                    files: selectedFiles,
                    src_path: srcPath,
                    dst_path: destPath
                })
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification(`Files ${operation === 'copy' ? 'copied' : 'moved'} successfully`, 'success');
                this.app.closeModal('copy-modal');

                // Refresh both panels
                this.app.panels.refreshBoth();
            } else {
                throw new Error(data.error?.message || `Failed to ${operation} files`);
            }
        } catch (error) {
            console.error(`Failed to ${operation} files:`, error);
            this.app.showNotification(`Failed to ${operation} files: ${error.message}`, 'error');
        }
    }

    // Rename file (Shift+F6)
    async renameFile(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        if (selectedFiles.length !== 1) {
            return;
        }

        const oldName = selectedFiles[0];
        const newName = prompt('Rename to:', oldName);

        if (!newName || newName === oldName) {
            return;
        }

        const storage = this.app.panels.getCurrentStorage(panel);
        const path = this.app.panels.getCurrentPath(panel);

        try {
            const response = await fetch('/api/fs/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    src_storage: storage,
                    dst_storage: storage,
                    files: [oldName],
                    src_path: path,
                    dst_path: path
                })
            });

            // Rename the file in the destination
            const srcFullPath = `${path}/${oldName}`;
            const dstFullPath = `${path}/${newName}`;

            const renameResponse = await fetch('/api/fs/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    src_storage: storage,
                    dst_storage: storage,
                    files: [oldName],
                    src_path: path,
                    dst_path: path.substring(0, path.lastIndexOf('/') + 1) + newName
                })
            });

            const data = await renameResponse.json();

            if (data.success) {
                this.app.showNotification('File renamed successfully', 'success');
                this.app.panels.refresh(panel);
            } else {
                throw new Error(data.error?.message || 'Failed to rename file');
            }
        } catch (error) {
            console.error('Failed to rename file:', error);
            this.app.showNotification(`Failed to rename file: ${error.message}`, 'error');
        }
    }

    // Create directory (F7)
    createDirectory(panel) {
        // Clear the input and show modal
        document.getElementById('mkdir-name').value = '';
        document.getElementById('mkdir-name').dataset.panel = panel;
        this.app.showModal('mkdir-modal');
    }

    // Perform mkdir
    async performMkdir() {
        const input = document.getElementById('mkdir-name');
        const dirName = input.value.trim();
        const panel = input.dataset.panel;

        if (!dirName) {
            this.app.showNotification('Please enter a directory name', 'warning');
            return;
        }

        const storage = this.app.panels.getCurrentStorage(panel);
        const currentPath = this.app.panels.getCurrentPath(panel);
        const fullPath = currentPath + (currentPath.endsWith('/') ? '' : '/') + dirName;

        try {
            const response = await fetch('/api/fs/mkdir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storage: storage,
                    path: fullPath
                })
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('Directory created successfully', 'success');
                this.app.closeModal('mkdir-modal');
                this.app.panels.refresh(panel);
            } else {
                throw new Error(data.error?.message || 'Failed to create directory');
            }
        } catch (error) {
            console.error('Failed to create directory:', error);
            this.app.showNotification(`Failed to create directory: ${error.message}`, 'error');
        }
    }

    // Delete files (F8)
    deleteFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        if (selectedFiles.length === 0) {
            return;
        }

        // Show delete confirmation modal
        const filesList = document.getElementById('delete-files-list');
        filesList.innerHTML = selectedFiles.map((f) => `<div class="file-list-preview-item">${f}</div>`).join('');

        document.getElementById('delete-confirm').dataset.panel = panel;
        this.app.showModal('delete-modal');
    }

    // Perform delete
    async performDelete() {
        const panel = document.getElementById('delete-confirm').dataset.panel;
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const storage = this.app.panels.getCurrentStorage(panel);
        const path = this.app.panels.getCurrentPath(panel);

        try {
            const response = await fetch('/api/fs/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storage: storage,
                    files: selectedFiles,
                    path: path
                })
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('Files deleted successfully', 'success');
                this.app.closeModal('delete-modal');
                this.app.panels.refresh(panel);
            } else {
                throw new Error(data.error?.message || 'Failed to delete files');
            }
        } catch (error) {
            console.error('Failed to delete files:', error);
            this.app.showNotification(`Failed to delete files: ${error.message}`, 'error');
        }
    }

    // Compress files (Alt+F5)
    compressFiles(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        if (selectedFiles.length === 0) {
            return;
        }

        // Show compress modal
        document.getElementById('compress-name').value = 'archive.zip';
        document.getElementById('compress-format').value = 'zip';

        const filesList = document.getElementById('compress-files-list');
        filesList.innerHTML = selectedFiles.map((f) => `<div class="file-list-preview-item">${f}</div>`).join('');

        document.getElementById('compress-confirm').dataset.panel = panel;
        this.app.showModal('compress-modal');
    }

    // Perform compress
    async performCompress() {
        const panel = document.getElementById('compress-confirm').dataset.panel;
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        const storage = this.app.panels.getCurrentStorage(panel);
        const basePath = this.app.panels.getCurrentPath(panel);

        const archiveName = document.getElementById('compress-name').value.trim();
        const format = document.getElementById('compress-format').value;

        if (!archiveName) {
            this.app.showNotification('Please enter an archive name', 'warning');
            return;
        }

        // Determine output path (in the opposite panel)
        const otherPanel = panel === 'left' ? 'right' : 'left';
        const outputPath = `${this.app.panels.getCurrentPath(otherPanel)}/${archiveName}`;

        try {
            const response = await fetch('/api/fs/compress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storage: storage,
                    files: selectedFiles,
                    base_path: basePath,
                    output_path: outputPath.replace('//', '/'),
                    format: format
                })
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('Compression started', 'success');
                this.app.closeModal('compress-modal');

                // Refresh the other panel after a delay
                setTimeout(() => {
                    this.app.panels.refresh(otherPanel);
                }, 2000);
            } else {
                throw new Error(data.error?.message || 'Failed to compress files');
            }
        } catch (error) {
            console.error('Failed to compress files:', error);
            this.app.showNotification(`Failed to compress files: ${error.message}`, 'error');
        }
    }

    // Decompress file (Alt+F6)
    async decompressFile(panel) {
        const selectedFiles = this.app.panels.getSelectedFiles(panel);
        if (selectedFiles.length !== 1) {
            return;
        }

        const archiveName = selectedFiles[0];
        const storage = this.app.panels.getCurrentStorage(panel);
        const archivePath = `${this.app.panels.getCurrentPath(panel)}/${archiveName}`;

        // Determine output path (in the opposite panel)
        const otherPanel = panel === 'left' ? 'right' : 'left';
        const outputPath = this.app.panels.getCurrentPath(otherPanel);

        const createFolder = confirm(`Extract "${archiveName}" to a new folder?`);

        try {
            const response = await fetch('/api/fs/decompress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storage: storage,
                    archive_path: archivePath.replace('//', '/'),
                    output_path: outputPath,
                    create_folder: createFolder
                })
            });

            const data = await response.json();

            if (data.success) {
                this.app.showNotification('Decompression started', 'success');

                // Refresh the other panel after a delay
                setTimeout(() => {
                    this.app.panels.refresh(otherPanel);
                }, 2000);
            } else {
                throw new Error(data.error?.message || 'Failed to decompress file');
            }
        } catch (error) {
            console.error('Failed to decompress file:', error);
            this.app.showNotification(`Failed to decompress file: ${error.message}`, 'error');
        }
    }
}
