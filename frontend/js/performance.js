/**
 * Performance Optimization Module
 * Provides various performance enhancements for JaCommander
 */

export class PerformanceOptimizer {
    constructor(app) {
        this.app = app;

        // Performance metrics
        this.metrics = {
            renderTime: [],
            apiCallTime: [],
            memoryUsage: [],
            frameRate: [],
            inputLatency: []
        };

        // Cache systems
        this.caches = {
            fileList: new Map(),
            thumbnails: new Map(),
            searchResults: new Map(),
            apiResponses: new Map()
        };

        // Request queues
        this.requestQueue = [];
        this.batchQueue = [];
        this.isProcessing = false;

        // Performance settings
        this.settings = {
            enableVirtualization: true,
            enableLazyLoading: true,
            enableCaching: true,
            enableBatching: true,
            enableWebWorkers: true,
            enableGPUAcceleration: true,
            maxCacheSize: 100 * 1024 * 1024, // 100MB
            maxCacheAge: 5 * 60 * 1000, // 5 minutes
            batchSize: 50,
            batchDelay: 100,
            virtualScrollBuffer: 5,
            imageOptimization: true,
            prefetchDistance: 3
        };

        // Web Workers
        this.workers = {
            search: null,
            compression: null,
            imageProcessor: null,
            dataProcessor: null
        };

        // Observers
        this.intersectionObserver = null;
        this.resizeObserver = null;
        this.performanceObserver = null;

        this.init();
    }

    init() {
        this.setupPerformanceMonitoring();
        this.setupObservers();
        this.setupWebWorkers();
        this.setupCacheManagement();
        this.setupOptimizations();
        this.createPerformancePanel();
    }

    setupPerformanceMonitoring() {
        // Performance Observer
        if ('PerformanceObserver' in window) {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(entry);
                }
            });

            // Observe different performance entry types
            try {
                this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
            } catch (e) {
                console.warn('Some performance entry types not supported:', e);
            }
        }

        // FPS monitoring
        this.startFPSMonitoring();

        // Memory monitoring
        this.startMemoryMonitoring();
    }

    setupObservers() {
        // Intersection Observer for lazy loading
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.lazyLoad(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px'
            }
        );

        // Resize Observer for responsive optimizations
        this.resizeObserver = new ResizeObserver(
            this.debounce((entries) => {
                this.handleResize(entries);
            }, 250)
        );

        // Mutation Observer for DOM changes
        this.mutationObserver = new MutationObserver(
            this.throttle((mutations) => {
                this.optimizeDOMChanges(mutations);
            }, 100)
        );
    }

    setupWebWorkers() {
        if (!this.settings.enableWebWorkers || !window.Worker) {
            return;
        }

        // Create search worker
        const searchWorkerCode = `
            self.onmessage = function(e) {
                const { type, data } = e.data;

                switch(type) {
                    case 'search':
                        const results = performSearch(data);
                        self.postMessage({ type: 'searchResults', results });
                        break;
                    case 'filter':
                        const filtered = performFilter(data);
                        self.postMessage({ type: 'filterResults', results: filtered });
                        break;
                }
            };

            function performSearch(data) {
                const { items, query, options } = data;
                const regex = options.regex ? new RegExp(query, options.caseSensitive ? 'g' : 'gi') : null;

                return items.filter(item => {
                    if (regex) {
                        return regex.test(item.name);
                    } else {
                        const name = options.caseSensitive ? item.name : item.name.toLowerCase();
                        const searchQuery = options.caseSensitive ? query : query.toLowerCase();
                        return name.includes(searchQuery);
                    }
                });
            }

            function performFilter(data) {
                const { items, filters } = data;

                return items.filter(item => {
                    // Apply multiple filters
                    if (filters.type && item.type !== filters.type) return false;
                    if (filters.minSize && item.size < filters.minSize) return false;
                    if (filters.maxSize && item.size > filters.maxSize) return false;
                    if (filters.extension && !item.name.endsWith(filters.extension)) return false;
                    return true;
                });
            }
        `;

        const blob = new Blob([searchWorkerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.workers.search = new Worker(workerUrl);

        // Create data processor worker
        const dataWorkerCode = `
            self.onmessage = function(e) {
                const { type, data } = e.data;

                switch(type) {
                    case 'sort':
                        const sorted = performSort(data);
                        self.postMessage({ type: 'sortResults', results: sorted });
                        break;
                    case 'process':
                        const processed = processData(data);
                        self.postMessage({ type: 'processResults', results: processed });
                        break;
                }
            };

            function performSort(data) {
                const { items, field, direction } = data;

                return items.sort((a, b) => {
                    const aVal = a[field];
                    const bVal = b[field];

                    if (direction === 'asc') {
                        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                    } else {
                        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                    }
                });
            }

            function processData(data) {
                // Heavy data processing
                const { items, operation } = data;

                switch(operation) {
                    case 'transform':
                        return items.map(item => ({
                            ...item,
                            displayName: item.name.toUpperCase(),
                            sizeFormatted: formatSize(item.size)
                        }));
                    default:
                        return items;
                }
            }

            function formatSize(bytes) {
                const units = ['B', 'KB', 'MB', 'GB'];
                let size = bytes;
                let unitIndex = 0;

                while (size >= 1024 && unitIndex < units.length - 1) {
                    size /= 1024;
                    unitIndex++;
                }

                return size.toFixed(2) + ' ' + units[unitIndex];
            }
        `;

        const dataBlob = new Blob([dataWorkerCode], { type: 'application/javascript' });
        const dataWorkerUrl = URL.createObjectURL(dataBlob);
        this.workers.dataProcessor = new Worker(dataWorkerUrl);
    }

    setupCacheManagement() {
        // Periodic cache cleanup
        setInterval(() => {
            this.cleanupCaches();
        }, 60000); // Every minute

        // Cache size monitoring
        this.monitorCacheSize();
    }

    setupOptimizations() {
        // Enable GPU acceleration
        if (this.settings.enableGPUAcceleration) {
            this.enableGPUAcceleration();
        }

        // Enable request batching
        if (this.settings.enableBatching) {
            this.setupRequestBatching();
        }

        // Enable image optimization
        if (this.settings.imageOptimization) {
            this.setupImageOptimization();
        }

        // Enable prefetching
        this.setupPrefetching();

        // Optimize animations
        this.optimizeAnimations();

        // Optimize event handlers
        this.optimizeEventHandlers();
    }

    createPerformancePanel() {
        const panel = document.createElement('div');
        panel.id = 'performance-panel';
        panel.className = 'performance-panel';
        panel.innerHTML = `
            <div class="perf-header">
                <h3>Performance Monitor</h3>
                <button class="perf-toggle">−</button>
            </div>
            <div class="perf-content">
                <div class="perf-metric">
                    <span class="metric-label">FPS:</span>
                    <span class="metric-value" id="fps-value">60</span>
                </div>
                <div class="perf-metric">
                    <span class="metric-label">Memory:</span>
                    <span class="metric-value" id="memory-value">0 MB</span>
                </div>
                <div class="perf-metric">
                    <span class="metric-label">Cache:</span>
                    <span class="metric-value" id="cache-value">0 MB</span>
                </div>
                <div class="perf-metric">
                    <span class="metric-label">API Latency:</span>
                    <span class="metric-value" id="latency-value">0 ms</span>
                </div>
                <div class="perf-metric">
                    <span class="metric-label">Render Time:</span>
                    <span class="metric-value" id="render-value">0 ms</span>
                </div>
                <button id="perf-clear-cache">Clear Cache</button>
                <button id="perf-gc">Force GC</button>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .performance-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 250px;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 9999;
                font-size: 12px;
                display: none;
            }

            .performance-panel.show {
                display: block;
            }

            .perf-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: var(--header-bg);
                border-bottom: 1px solid var(--border-color);
                border-radius: 8px 8px 0 0;
            }

            .perf-header h3 {
                margin: 0;
                font-size: 14px;
                color: var(--text-primary);
            }

            .perf-toggle {
                width: 20px;
                height: 20px;
                background: none;
                border: none;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 16px;
            }

            .perf-content {
                padding: 10px;
            }

            .perf-content.hidden {
                display: none;
            }

            .perf-metric {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .metric-label {
                color: var(--text-secondary);
            }

            .metric-value {
                color: var(--text-primary);
                font-weight: bold;
                font-family: monospace;
            }

            .perf-content button {
                width: 100%;
                padding: 6px;
                margin-top: 5px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 12px;
            }

            .perf-content button:hover {
                background: var(--hover-bg);
            }

            /* Performance Indicators */
            .perf-good { color: #4CAF50; }
            .perf-warning { color: #FF9800; }
            .perf-bad { color: #F44336; }
        `;

        if (!document.querySelector('#performance-styles')) {
            style.id = 'performance-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(panel);

        // Event listeners
        panel.querySelector('.perf-toggle').addEventListener('click', () => {
            const content = panel.querySelector('.perf-content');
            content.classList.toggle('hidden');
            panel.querySelector('.perf-toggle').textContent = content.classList.contains('hidden') ? '+' : '−';
        });

        panel.querySelector('#perf-clear-cache').addEventListener('click', () => {
            this.clearAllCaches();
        });

        panel.querySelector('#perf-gc').addEventListener('click', () => {
            this.forceGarbageCollection();
        });

        // Show panel with Ctrl+Shift+P
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                panel.classList.toggle('show');
            }
        });

        this.perfPanel = panel;
    }

    // Performance Monitoring Methods
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        let fps = 60;

        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;

                // Update display
                if (this.perfPanel) {
                    const fpsElement = this.perfPanel.querySelector('#fps-value');
                    if (fpsElement) {
                        fpsElement.textContent = fps;
                        fpsElement.className = fps >= 50 ? 'perf-good' : fps >= 30 ? 'perf-warning' : 'perf-bad';
                    }
                }

                this.metrics.frameRate.push(fps);
                if (this.metrics.frameRate.length > 60) {
                    this.metrics.frameRate.shift();
                }
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    startMemoryMonitoring() {
        if (!performance.memory) {
            return;
        }

        setInterval(() => {
            const memory = performance.memory.usedJSHeapSize / 1048576; // Convert to MB

            if (this.perfPanel) {
                const memElement = this.perfPanel.querySelector('#memory-value');
                if (memElement) {
                    memElement.textContent = `${memory.toFixed(2)} MB`;
                    memElement.className = memory < 50 ? 'perf-good' : memory < 100 ? 'perf-warning' : 'perf-bad';
                }
            }

            this.metrics.memoryUsage.push(memory);
            if (this.metrics.memoryUsage.length > 60) {
                this.metrics.memoryUsage.shift();
            }
        }, 1000);
    }

    recordMetric(entry) {
        if (entry.entryType === 'measure') {
            if (entry.name.includes('render')) {
                this.metrics.renderTime.push(entry.duration);
                this.updateMetricDisplay('render', entry.duration);
            } else if (entry.name.includes('api')) {
                this.metrics.apiCallTime.push(entry.duration);
                this.updateMetricDisplay('latency', entry.duration);
            }
        }
    }

    updateMetricDisplay(type, value) {
        if (!this.perfPanel) {
            return;
        }

        const element = this.perfPanel.querySelector(`#${type}-value`);
        if (element) {
            element.textContent = `${value.toFixed(2)} ms`;
            element.className = value < 100 ? 'perf-good' : value < 300 ? 'perf-warning' : 'perf-bad';
        }
    }

    // Optimization Methods
    enableGPUAcceleration() {
        // Add CSS for GPU acceleration
        const style = document.createElement('style');
        style.textContent = `
            .gpu-accelerated {
                transform: translateZ(0);
                will-change: transform;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
            }

            .panel-content,
            .virtual-scroll-content,
            .modal-content {
                transform: translateZ(0);
            }
        `;
        document.head.appendChild(style);

        // Apply to performance-critical elements
        document.querySelectorAll('.panel-content, .modal-content').forEach((el) => {
            el.classList.add('gpu-accelerated');
        });
    }

    setupRequestBatching() {
        setInterval(() => {
            if (this.batchQueue.length > 0) {
                this.processBatch();
            }
        }, this.settings.batchDelay);
    }

    addToBatch(request) {
        this.batchQueue.push(request);

        if (this.batchQueue.length >= this.settings.batchSize) {
            this.processBatch();
        }
    }

    async processBatch() {
        if (this.isProcessing || this.batchQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const batch = this.batchQueue.splice(0, this.settings.batchSize);

        try {
            const responses = await Promise.all(batch.map((req) => this.executeRequest(req)));

            batch.forEach((req, index) => {
                if (req.callback) {
                    req.callback(responses[index]);
                }
            });
        } catch (error) {
            console.error('Batch processing error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async executeRequest(request) {
        const cacheKey = this.getCacheKey(request);

        // Check cache
        if (this.settings.enableCaching && this.caches.apiResponses.has(cacheKey)) {
            const cached = this.caches.apiResponses.get(cacheKey);
            if (Date.now() - cached.timestamp < this.settings.maxCacheAge) {
                return cached.data;
            }
        }

        // Execute request
        const response = await fetch(request.url, request.options);
        const data = await response.json();

        // Cache response
        if (this.settings.enableCaching) {
            this.caches.apiResponses.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }

        return data;
    }

    getCacheKey(request) {
        return `${request.url}:${JSON.stringify(request.options)}`;
    }

    setupImageOptimization() {
        // Create image loading queue
        this.imageQueue = [];
        this.loadingImages = 0;
        this.maxConcurrentImages = 3;

        // Optimize existing images
        document.querySelectorAll('img').forEach((img) => {
            this.optimizeImage(img);
        });

        // Observe new images
        const imgObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'IMG') {
                        this.optimizeImage(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach((img) => {
                            this.optimizeImage(img);
                        });
                    }
                });
            });
        });

        imgObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    optimizeImage(img) {
        // Set loading lazy
        img.loading = 'lazy';

        // Use intersection observer for lazy loading
        if (this.settings.enableLazyLoading) {
            this.intersectionObserver.observe(img);
        }

        // Add to queue for progressive loading
        this.imageQueue.push(img);
        this.processImageQueue();
    }

    processImageQueue() {
        while (this.loadingImages < this.maxConcurrentImages && this.imageQueue.length > 0) {
            const img = this.imageQueue.shift();
            this.loadImage(img);
        }
    }

    loadImage(img) {
        this.loadingImages++;

        const loader = new Image();
        loader.onload = () => {
            img.src = loader.src;
            this.loadingImages--;
            this.processImageQueue();
        };

        loader.onerror = () => {
            this.loadingImages--;
            this.processImageQueue();
        };

        loader.src = img.dataset.src || img.src;
    }

    setupPrefetching() {
        // Prefetch adjacent panels content
        if (this.app.panels) {
            this.app.panels.forEach((panel) => {
                this.observePanelScrolling(panel);
            });
        }
    }

    observePanelScrolling(panel) {
        const scrollElement = panel.contentElement;
        if (!scrollElement) {
            return;
        }

        let scrollTimeout;
        scrollElement.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.prefetchNearbyContent(panel);
            }, 200);
        });
    }

    prefetchNearbyContent(panel) {
        // Calculate visible range
        const scrollTop = panel.contentElement.scrollTop;
        const scrollHeight = panel.contentElement.clientHeight;
        const itemHeight = 30; // Approximate item height

        const visibleStart = Math.floor(scrollTop / itemHeight);
        const visibleEnd = Math.ceil((scrollTop + scrollHeight) / itemHeight);

        // Prefetch range
        const prefetchStart = Math.max(0, visibleStart - this.settings.prefetchDistance);
        const prefetchEnd = visibleEnd + this.settings.prefetchDistance;

        // Trigger prefetch for items in range
        for (let i = prefetchStart; i < prefetchEnd; i++) {
            if (panel.items && panel.items[i]) {
                this.prefetchItem(panel.items[i]);
            }
        }
    }

    prefetchItem(item) {
        // Prefetch thumbnails
        if (item.type === 'image' && !this.caches.thumbnails.has(item.path)) {
            this.prefetchThumbnail(item.path);
        }

        // Prefetch file metadata
        if (!this.caches.fileList.has(item.path)) {
            this.prefetchMetadata(item.path);
        }
    }

    async prefetchThumbnail(_path) {
        // Implementation would fetch thumbnail in background
        // This is a placeholder
    }

    async prefetchMetadata(_path) {
        // Implementation would fetch metadata in background
        // This is a placeholder
    }

    optimizeAnimations() {
        // Use CSS animations instead of JS where possible
        const style = document.createElement('style');
        style.textContent = `
            .optimized-transition {
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                           opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeEventHandlers() {
        // Delegate events to reduce listeners
        document.body.addEventListener('click', this.handleGlobalClick.bind(this));
        document.body.addEventListener('mouseover', this.throttle(this.handleGlobalHover.bind(this), 50));
    }

    handleGlobalClick(e) {
        // Handle delegated clicks
        const target = e.target;

        if (target.matches('.file-item')) {
            // Handle file click
            e.preventDefault();
            // ... handle file click
        }
    }

    handleGlobalHover(e) {
        // Handle delegated hovers
        const target = e.target;

        if (target.matches('.thumbnail-container')) {
            // Trigger thumbnail loading
            this.lazyLoad(target);
        }
    }

    lazyLoad(element) {
        if (element.dataset.loaded === 'true') {
            return;
        }

        const src = element.dataset.src;
        if (!src) {
            return;
        }

        // Load content
        if (element.tagName === 'IMG') {
            element.src = src;
        } else {
            // Load other content types
            this.loadContent(element, src);
        }

        element.dataset.loaded = 'true';
        this.intersectionObserver.unobserve(element);
    }

    loadContent(element, src) {
        // Load content based on type
        fetch(src)
            .then((response) => response.text())
            .then((content) => {
                element.innerHTML = content;
            })
            .catch((error) => {
                console.error('Failed to load content:', error);
            });
    }

    handleResize(entries) {
        entries.forEach((entry) => {
            // Optimize layout on resize
            this.optimizeLayout(entry.target);
        });
    }

    optimizeLayout(element) {
        // Trigger layout optimization
        if (element.classList.contains('panel')) {
            this.optimizePanelLayout(element);
        }
    }

    optimizePanelLayout(panel) {
        // Calculate optimal item count
        const height = panel.clientHeight;
        const itemHeight = 30;
        const visibleItems = Math.ceil(height / itemHeight);

        // Update virtual scrolling if enabled
        if (this.settings.enableVirtualization) {
            panel.dataset.visibleItems = visibleItems;
        }
    }

    optimizeDOMChanges(mutations) {
        // Batch DOM changes
        let needsReflow = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                needsReflow = true;
            }
        });

        if (needsReflow) {
            // Schedule reflow optimization
            requestAnimationFrame(() => {
                this.optimizeReflow();
            });
        }
    }

    optimizeReflow() {
        // Batch read/write operations
        const reads = [];

        // Collect read operations
        document.querySelectorAll('.needs-measure').forEach((el) => {
            reads.push(() => {
                return {
                    element: el,
                    height: el.offsetHeight,
                    width: el.offsetWidth
                };
            });
        });

        // Execute reads
        const measurements = reads.map((read) => read());

        // Execute writes
        requestAnimationFrame(() => {
            measurements.forEach((measurement) => {
                measurement.element.style.height = `${measurement.height}px`;
                measurement.element.classList.remove('needs-measure');
            });
        });
    }

    // Cache Management
    cleanupCaches() {
        const now = Date.now();
        let totalSize = 0;

        // Clean expired cache entries
        for (const cache of Object.values(this.caches)) {
            if (cache instanceof Map) {
                for (const [cacheKey, value] of cache.entries()) {
                    if (value.timestamp && now - value.timestamp > this.settings.maxCacheAge) {
                        cache.delete(cacheKey);
                    } else if (value.size) {
                        totalSize += value.size;
                    }
                }
            }
        }

        // If cache is too large, remove oldest entries
        if (totalSize > this.settings.maxCacheSize) {
            this.reduceCacheSize();
        }

        // Update display
        this.updateCacheDisplay(totalSize);
    }

    reduceCacheSize() {
        // Get all cache entries with timestamps
        const allEntries = [];

        for (const cache of Object.values(this.caches)) {
            if (cache instanceof Map) {
                for (const [cacheKey, value] of cache.entries()) {
                    allEntries.push({
                        cache,
                        key: cacheKey,
                        timestamp: value.timestamp || 0,
                        size: value.size || 0
                    });
                }
            }
        }

        // Sort by timestamp (oldest first)
        allEntries.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest entries until under size limit
        let totalSize = allEntries.reduce((sum, entry) => sum + entry.size, 0);
        let i = 0;

        while (totalSize > this.settings.maxCacheSize * 0.8 && i < allEntries.length) {
            const entry = allEntries[i];
            entry.cache.delete(entry.key);
            totalSize -= entry.size;
            i++;
        }
    }

    updateCacheDisplay(size) {
        if (this.perfPanel) {
            const element = this.perfPanel.querySelector('#cache-value');
            if (element) {
                element.textContent = `${(size / 1048576).toFixed(2)} MB`;
            }
        }
    }

    monitorCacheSize() {
        setInterval(() => {
            let totalSize = 0;

            for (const cache of Object.values(this.caches)) {
                if (cache instanceof Map) {
                    totalSize += cache.size * 1000; // Approximate size
                }
            }

            this.updateCacheDisplay(totalSize);
        }, 5000);
    }

    clearAllCaches() {
        for (const cache of Object.values(this.caches)) {
            if (cache instanceof Map) {
                cache.clear();
            }
        }

        // Clear browser caches if possible
        if ('caches' in window) {
            caches.keys().then((names) => {
                names.forEach((name) => caches.delete(name));
            });
        }

        this.updateCacheDisplay(0);
    }

    forceGarbageCollection() {
        // Clear references
        this.clearAllCaches();

        // Trigger GC if available
        if (window.gc) {
            window.gc();
        }

        // Clear timers
        const highestId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
            clearTimeout(i);
        }
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    // Performance API Methods
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
        }
    }

    measure(name, startMark, endMark) {
        if (performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
            } catch (e) {
                // Marks may not exist
            }
        }
    }

    // Get performance report
    getPerformanceReport() {
        return {
            metrics: this.metrics,
            averages: {
                fps: this.getAverage(this.metrics.frameRate),
                memory: this.getAverage(this.metrics.memoryUsage),
                renderTime: this.getAverage(this.metrics.renderTime),
                apiLatency: this.getAverage(this.metrics.apiCallTime)
            },
            cacheStats: {
                fileList: this.caches.fileList.size,
                thumbnails: this.caches.thumbnails.size,
                searchResults: this.caches.searchResults.size,
                apiResponses: this.caches.apiResponses.size
            },
            settings: this.settings
        };
    }

    getAverage(arr) {
        if (arr.length === 0) {
            return 0;
        }
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    // Export metrics for analysis
    exportMetrics() {
        const data = {
            timestamp: new Date().toISOString(),
            report: this.getPerformanceReport(),
            userAgent: navigator.userAgent,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                devicePixelRatio: window.devicePixelRatio
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance_metrics_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Export for global use
window.PerformanceOptimizer = PerformanceOptimizer;
