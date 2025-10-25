/**
 * File Upload Module
 * Handles file uploads via drag and drop from the desktop
 */

export class FileUploader {
    constructor(app) {
        this.app = app;
        this.uploadQueue = [];
        this.activeUploads = new Map();
        this.maxConcurrentUploads = 3;
        this.init();
    }

    init() {
        this.setupDropZones();
        this.setupEventListeners();
    }

    /**
     * Setup drop zones for external files
     */
    setupDropZones() {
        // Add drop zone styling
        const style = document.createElement('style');
        style.textContent = `
            .panel.drop-hover {
                background: var(--primary-bg-alpha);
                border: 2px dashed var(--primary);
            }

            .panel.drop-hover::before {
                content: '📥 Drop files here to upload';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 24px;
                font-weight: 600;
                color: var(--primary);
                pointer-events: none;
                z-index: 1000;
                background: var(--bg-primary);
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
        `;
        document.head.appendChild(style);

        // Setup drop zones on both panels
        this.setupPanelDropZone('left');
        this.setupPanelDropZone('right');
    }

    /**
     * Setup drop zone for a specific panel
     */
    setupPanelDropZone(panel) {
        const panelEl = document.getElementById(`panel-${panel}`);
        let dragCounter = 0;

        // Handle drag enter
        panelEl.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;

            // Check if dragging external files
            if (this.isDraggingExternalFiles(e)) {
                panelEl.classList.add('drop-hover');
                this.app.setActivePanel(panel);
            }
        });

        // Handle drag over
        panelEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.isDraggingExternalFiles(e)) {
                e.dataTransfer.dropEffect = 'copy';
            }
        });

        // Handle drag leave
        panelEl.addEventListener('dragleave', (e) => {
            dragCounter--;
            if (dragCounter === 0) {
                panelEl.classList.remove('drop-hover');
            }
        });

        // Handle drop
        panelEl.addEventListener('drop', async (e) => {
            e.preventDefault();
            dragCounter = 0;
            panelEl.classList.remove('drop-hover');

            // Check if dropping external files
            if (this.isDraggingExternalFiles(e) && e.dataTransfer.files.length > 0) {
                await this.handleFileDrop(e.dataTransfer.files, panel);
            }
        });
    }

    /**
     * Check if dragging external files (not internal drag and drop)
     */
    isDraggingExternalFiles(e) {
        // Check if the drag is from outside the browser
        const types = Array.from(e.dataTransfer.types);
        return types.includes('Files') && !e.dataTransfer.getData('text/plain').startsWith('internal:');
    }

    /**
     * Handle file drop
     */
    async handleFileDrop(files, panel) {
        const targetPath = this.app.panels.getCurrentPath(panel);
        const storage = this.app.panels.getCurrentStorage(panel);

        // Convert FileList to array
        const fileArray = Array.from(files);

        // Filter out directories (browsers don't support directory upload via drag and drop)
        const validFiles = fileArray.filter((file) => file.size > 0);

        if (validFiles.length === 0) {
            this.app.showNotification('No valid files to upload', 'warning');
            return;
        }

        // Show confirmation modal
        const confirmed = await this.showUploadConfirmation(validFiles, targetPath);
        if (!confirmed) {return;}

        // Add files to upload queue
        for (const file of validFiles) {
            this.addToQueue({
                file,
                targetPath,
                storage,
                panel
            });
        }

        // Start processing queue
        this.processQueue();
    }

    /**
     * Show upload confirmation modal
     */
    async showUploadConfirmation(files, targetPath) {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';

            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            const formatSize = (size) => {
                const units = ['B', 'KB', 'MB', 'GB'];
                let i = 0;
                while (size >= 1024 && i < units.length - 1) {
                    size /= 1024;
                    i++;
                }
                return `${size.toFixed(2)} ${units[i]}`;
            };

            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Upload Files</h2>
                        <button class="modal-close">✕</button>
                    </div>
                    <div class="modal-body">
                        <p>Upload ${files.length} file(s) to:</p>
                        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; margin: 10px 0;">
                            <code>${targetPath}</code>
                        </div>
                        <div class="file-list-preview" style="max-height: 200px; overflow-y: auto;">
                            ${files
        .map(
            (file) => `
                                <div style="padding: 4px 0;">
                                    📄 ${file.name} (${formatSize(file.size)})
                                </div>
                            `
        )
        .join('')}
                        </div>
                        <p style="margin-top: 10px;">
                            <strong>Total size:</strong> ${formatSize(totalSize)}
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary" id="upload-confirm">Upload</button>
                        <button class="btn-cancel">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Handle buttons
            modal.querySelector('.modal-close').onclick = () => {
                modal.remove();
                resolve(false);
            };

            modal.querySelector('.btn-cancel').onclick = () => {
                modal.remove();
                resolve(false);
            };

            modal.querySelector('#upload-confirm').onclick = () => {
                modal.remove();
                resolve(true);
            };
        });
    }

    /**
     * Add file to upload queue
     */
    addToQueue(uploadInfo) {
        uploadInfo.id = Date.now() + Math.random();
        uploadInfo.status = 'pending';
        uploadInfo.progress = 0;
        this.uploadQueue.push(uploadInfo);
    }

    /**
     * Process upload queue
     */
    async processQueue() {
        while (this.uploadQueue.length > 0) {
            // Wait if max concurrent uploads reached
            while (this.activeUploads.size >= this.maxConcurrentUploads) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            const upload = this.uploadQueue.find((u) => u.status === 'pending');
            if (!upload) {break;}

            upload.status = 'uploading';
            this.uploadFile(upload);
        }
    }

    /**
     * Upload a single file
     */
    async uploadFile(upload) {
        const { file, targetPath, storage, panel } = upload;

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', targetPath);
        formData.append('storage', storage || 'local');

        // Create progress container
        const progressId = this.showUploadProgress(file.name, upload.id);

        try {
            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            this.activeUploads.set(upload.id, xhr);

            // Setup progress tracking
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    this.updateProgress(upload.id, percentComplete);
                }
            });

            // Setup completion handlers
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            resolve(response);
                        } else {
                            reject(new Error(response.error?.message || 'Upload failed'));
                        }
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload cancelled'));
                });
            });

            // Start upload
            xhr.open('POST', '/api/fs/upload');
            xhr.send(formData);

            // Wait for completion
            const response = await uploadPromise;

            // Success
            upload.status = 'completed';
            this.hideProgress(upload.id);
            this.app.showNotification(`✅ Uploaded ${file.name}`, 'success');

            // Refresh the panel to show the new file
            this.app.panels.refresh(panel);
        } catch (error) {
            // Error
            upload.status = 'failed';
            this.hideProgress(upload.id);
            this.app.showNotification(`❌ Failed to upload ${file.name}: ${error.message}`, 'error');
            console.error('Upload error:', error);
        } finally {
            // Clean up
            this.activeUploads.delete(upload.id);
            const index = this.uploadQueue.indexOf(upload);
            if (index > -1) {
                this.uploadQueue.splice(index, 1);
            }
        }
    }

    /**
     * Show upload progress
     */
    showUploadProgress(filename, uploadId) {
        // Check if progress container exists
        let container = document.getElementById('upload-progress-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'upload-progress-container';
            container.style.cssText = `
                position: fixed;
                bottom: 60px;
                right: 20px;
                width: 300px;
                z-index: 10000;
            `;
            document.body.appendChild(container);
        }

        // Create progress item
        const progressItem = document.createElement('div');
        progressItem.id = `upload-${uploadId}`;
        progressItem.className = 'upload-progress-item';
        progressItem.style.cssText = `
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;

        progressItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
                    📤 ${filename}
                </span>
                <button onclick="this.closest('.upload-progress-item').remove()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;">✕</button>
            </div>
            <div style="background: var(--bg-secondary); border-radius: 2px; height: 4px; overflow: hidden;">
                <div class="upload-progress-bar" style="background: var(--primary); height: 100%; width: 0%; transition: width 0.3s;"></div>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">
                <span class="upload-progress-text">0%</span>
            </div>
        `;

        container.appendChild(progressItem);
        return uploadId;
    }

    /**
     * Update progress
     */
    updateProgress(uploadId, percent) {
        const item = document.getElementById(`upload-${uploadId}`);
        if (item) {
            const bar = item.querySelector('.upload-progress-bar');
            const text = item.querySelector('.upload-progress-text');
            if (bar) {bar.style.width = `${percent}%`;}
            if (text) {text.textContent = `${Math.round(percent)}%`;}
        }
    }

    /**
     * Hide progress
     */
    hideProgress(uploadId) {
        setTimeout(() => {
            const item = document.getElementById(`upload-${uploadId}`);
            if (item) {
                item.style.transition = 'opacity 0.3s';
                item.style.opacity = '0';
                setTimeout(() => item.remove(), 300);
            }

            // Remove container if empty
            const container = document.getElementById('upload-progress-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 2000); // Show success for 2 seconds
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Cancel all uploads on page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.activeUploads.size > 0) {
                e.preventDefault();
                e.returnValue = 'Uploads in progress. Are you sure you want to leave?';
            }
        });
    }

    /**
     * Cancel upload
     */
    cancelUpload(uploadId) {
        const xhr = this.activeUploads.get(uploadId);
        if (xhr) {
            xhr.abort();
            this.activeUploads.delete(uploadId);
        }
    }

    /**
     * Cancel all uploads
     */
    cancelAllUploads() {
        for (const [id, xhr] of this.activeUploads) {
            xhr.abort();
        }
        this.activeUploads.clear();
        this.uploadQueue = [];
    }
}
