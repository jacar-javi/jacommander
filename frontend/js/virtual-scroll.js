/**
 * Virtual Scrolling Module
 * Efficiently renders large lists by only displaying visible items
 */

export class VirtualScroll {
    constructor(container, options = {}) {
        this.container = container;
        this.items = [];
        this.itemHeight = options.itemHeight || 24;
        this.bufferSize = options.bufferSize || 5;
        this.renderCallback = options.renderCallback || (() => {});

        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;

        this.scrollHandler = null;
        this.resizeHandler = null;
        this.animationFrame = null;

        this.init();
    }

    init() {
        // Create virtual scroll structure
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-scroll-viewport';
        this.viewport.style.cssText = `
            position: relative;
            height: 100%;
            overflow-y: auto;
        `;

        this.content = document.createElement('div');
        this.content.className = 'virtual-scroll-content';
        this.content.style.cssText = `
            position: relative;
            width: 100%;
        `;

        this.visibleArea = document.createElement('div');
        this.visibleArea.className = 'virtual-scroll-visible';
        this.visibleArea.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
        `;

        this.content.appendChild(this.visibleArea);
        this.viewport.appendChild(this.content);

        // Replace container content
        this.container.innerHTML = '';
        this.container.appendChild(this.viewport);

        // Setup event listeners
        this.scrollHandler = this.throttle(this.handleScroll.bind(this), 10);
        this.resizeHandler = this.debounce(this.handleResize.bind(this), 150);

        this.viewport.addEventListener('scroll', this.scrollHandler, { passive: true });
        window.addEventListener('resize', this.resizeHandler);

        // Initial measurements
        this.updateMeasurements();
    }

    setItems(items) {
        this.items = items;
        this.totalHeight = items.length * this.itemHeight;
        this.content.style.height = `${this.totalHeight}px`;
        this.render();
    }

    updateMeasurements() {
        const rect = this.viewport.getBoundingClientRect();
        this.containerHeight = rect.height;
        this.calculateVisibleRange();
    }

    calculateVisibleRange() {
        this.visibleStart = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
        this.visibleEnd = Math.min(
            this.items.length,
            Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.bufferSize
        );
    }

    handleScroll(_e) {
        this.scrollTop = this.viewport.scrollTop;
        this.calculateVisibleRange();

        // Cancel any pending animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Schedule render on next animation frame
        this.animationFrame = requestAnimationFrame(() => {
            this.render();
        });
    }

    handleResize() {
        this.updateMeasurements();
        this.render();
    }

    render() {
        const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);
        const offsetY = this.visibleStart * this.itemHeight;

        // Update visible area position
        this.visibleArea.style.transform = `translateY(${offsetY}px)`;

        // Clear and render visible items
        this.visibleArea.innerHTML = '';

        visibleItems.forEach((item, index) => {
            const element = this.renderCallback(item, this.visibleStart + index);
            if (element) {
                element.style.position = 'absolute';
                element.style.top = `${index * this.itemHeight}px`;
                element.style.left = '0';
                element.style.right = '0';
                element.style.height = `${this.itemHeight}px`;
                this.visibleArea.appendChild(element);
            }
        });

        // Emit render event
        this.container.dispatchEvent(
            new CustomEvent('virtualscroll:rendered', {
                detail: {
                    start: this.visibleStart,
                    end: this.visibleEnd,
                    total: this.items.length
                }
            })
        );
    }

    scrollToIndex(index) {
        const targetScroll = Math.max(0, Math.min(index * this.itemHeight, this.totalHeight - this.containerHeight));
        this.viewport.scrollTop = targetScroll;
    }

    scrollToItem(item) {
        const index = this.items.indexOf(item);
        if (index >= 0) {
            this.scrollToIndex(index);
        }
    }

    refresh() {
        this.updateMeasurements();
        this.render();
    }

    destroy() {
        if (this.viewport) {
            this.viewport.removeEventListener('scroll', this.scrollHandler);
        }
        window.removeEventListener('resize', this.resizeHandler);

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.container.innerHTML = '';
    }

    // Utility functions
    throttle(func, wait) {
        let timeout;
        let previous = 0;

        return function executedFunction(...args) {
            const now = Date.now();
            const remaining = wait - (now - previous);

            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func(...args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    previous = Date.now();
                    timeout = null;
                    func(...args);
                }, remaining);
            }
        };
    }

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

    // Performance monitoring
    getMetrics() {
        return {
            totalItems: this.items.length,
            visibleItems: this.visibleEnd - this.visibleStart,
            scrollPosition: this.scrollTop,
            containerHeight: this.containerHeight,
            totalHeight: this.totalHeight,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    estimateMemoryUsage() {
        // Rough estimate of DOM nodes in memory
        const visibleNodes = this.visibleEnd - this.visibleStart;
        const nodeSize = 1024; // Estimated bytes per DOM node
        return visibleNodes * nodeSize;
    }
}

// Export for use in panels
window.VirtualScroll = VirtualScroll;
