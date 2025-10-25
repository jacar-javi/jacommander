/**
 * Thumbnail Generation Module
 * Creates and caches thumbnails for image files
 */

export class ThumbnailManager {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 128;
        this.quality = options.quality || 0.8;
        this.cache = new Map();
        this.loadingQueue = [];
        this.isProcessing = false;
        this.maxConcurrent = options.maxConcurrent || 3;
        this.activeLoaders = 0;

        // Supported image formats
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff'];

        // IndexedDB for persistent cache
        this.dbName = 'jacommander_thumbnails';
        this.storeName = 'thumbnails';
        this.db = null;
        this.initDB();

        // Canvas pool for performance
        this.canvasPool = [];
        this.maxCanvasPool = 5;
    }

    async initDB() {
        try {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error('Failed to open thumbnail database');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('path', 'path', { unique: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        } catch (error) {
            console.error('IndexedDB initialization failed:', error);
        }
    }

    isImageFile(filename) {
        const ext = filename.toLowerCase().match(/\.[^.]*$/);
        return ext && this.supportedFormats.includes(ext[0]);
    }

    async getThumbnail(path, storageId) {
        const cacheKey = `${storageId}:${path}`;

        // Check memory cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Check IndexedDB cache
        const cached = await this.getFromDB(cacheKey);
        if (cached) {
            this.cache.set(cacheKey, cached.thumbnail);
            return cached.thumbnail;
        }

        // Add to loading queue
        return this.queueThumbnailGeneration(path, storageId);
    }

    async queueThumbnailGeneration(path, storageId) {
        const cacheKey = `${storageId}:${path}`;

        return new Promise((resolve) => {
            this.loadingQueue.push({
                path,
                storageId,
                cacheKey,
                resolve
            });

            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.loadingQueue.length === 0) {return;}

        this.isProcessing = true;

        while (this.loadingQueue.length > 0 && this.activeLoaders < this.maxConcurrent) {
            const item = this.loadingQueue.shift();
            this.activeLoaders++;

            this.generateThumbnail(item).finally(() => {
                this.activeLoaders--;
                if (this.loadingQueue.length > 0) {
                    this.processQueue();
                }
            });
        }

        this.isProcessing = false;
    }

    async generateThumbnail(item) {
        try {
            // Fetch image data
            const response = await fetch(
                `/api/fs/download?storage=${item.storageId}&path=${encodeURIComponent(item.path)}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Create thumbnail
            const thumbnail = await this.createThumbnail(url);
            URL.revokeObjectURL(url);

            // Cache in memory
            this.cache.set(item.cacheKey, thumbnail);

            // Cache in IndexedDB
            await this.saveToDB(item.cacheKey, item.path, thumbnail);

            item.resolve(thumbnail);
        } catch (error) {
            console.error('Failed to generate thumbnail:', error);
            // Return placeholder
            item.resolve(this.getPlaceholder());
        }
    }

    async createThumbnail(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const canvas = this.getCanvas();
                const ctx = canvas.getContext('2d');

                // Calculate dimensions maintaining aspect ratio
                const aspectRatio = img.width / img.height;
                let width = this.maxSize;
                let height = this.maxSize;

                if (aspectRatio > 1) {
                    height = this.maxSize / aspectRatio;
                } else {
                    width = this.maxSize * aspectRatio;
                }

                canvas.width = width;
                canvas.height = height;

                // Apply quality optimizations
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to data URL
                const thumbnail = canvas.toDataURL('image/webp', this.quality);

                // Return canvas to pool
                this.returnCanvas(canvas);

                resolve(thumbnail);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = imageUrl;
        });
    }

    getCanvas() {
        if (this.canvasPool.length > 0) {
            return this.canvasPool.pop();
        }
        return document.createElement('canvas');
    }

    returnCanvas(canvas) {
        if (this.canvasPool.length < this.maxCanvasPool) {
            // Clear canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.canvasPool.push(canvas);
        }
    }

    getPlaceholder() {
        // Return a simple file icon as placeholder
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                <rect x="16" y="8" width="32" height="48" fill="#e0e0e0" stroke="#999" stroke-width="2"/>
                <rect x="20" y="12" width="24" height="8" fill="#999"/>
                <rect x="20" y="24" width="24" height="2" fill="#999"/>
                <rect x="20" y="30" width="24" height="2" fill="#999"/>
                <rect x="20" y="36" width="24" height="2" fill="#999"/>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    async getFromDB(key) {
        if (!this.db) {return null;}

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                if (result && result.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) {
                    // Cache valid for 7 days
                    resolve(result);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                resolve(null);
            };
        });
    }

    async saveToDB(key, path, thumbnail) {
        if (!this.db) {return;}

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        store.put({
            id: key,
            path: path,
            thumbnail: thumbnail,
            timestamp: Date.now()
        });
    }

    async clearCache() {
        this.cache.clear();

        if (this.db) {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            store.clear();
        }
    }

    async cleanOldCache() {
        if (!this.db) {return;}

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

        const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
            }
        };
    }

    // Generate thumbnails for visible items
    async generateForItems(items, storageId) {
        const imageItems = items.filter((item) => !item.is_dir && this.isImageFile(item.name));

        // Process in batches
        for (const item of imageItems) {
            await this.getThumbnail(item.path, storageId);
        }
    }

    getMemoryUsage() {
        return {
            cacheSize: this.cache.size,
            queueLength: this.loadingQueue.length,
            activeLoaders: this.activeLoaders,
            canvasPoolSize: this.canvasPool.length
        };
    }
}

// Export for global use
window.ThumbnailManager = ThumbnailManager;
