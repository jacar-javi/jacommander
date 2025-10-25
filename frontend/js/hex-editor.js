/**
 * Hex Editor Module
 * Provides hex viewing and editing capabilities for binary files
 */

export class HexEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.data = null;
        this.file = null;
        this.offset = 0;
        this.bytesPerRow = options.bytesPerRow || 16;
        this.rowsPerPage = options.rowsPerPage || 32;
        this.readOnly = options.readOnly || false;

        // Edit tracking
        this.modifications = new Map(); // offset -> byte value
        this.undoStack = [];
        this.redoStack = [];

        // Selection
        this.selectionStart = -1;
        this.selectionEnd = -1;
        this.cursorPosition = 0;
        this.editMode = 'hex'; // 'hex' or 'ascii'

        // UI elements
        this.elements = {};
        this.init();
    }

    init() {
        // Create hex editor structure
        this.container.innerHTML = `
            <div class="hex-editor">
                <div class="hex-toolbar">
                    <button class="hex-btn" data-action="save" title="Save changes">
                        <span class="icon">💾</span> Save
                    </button>
                    <button class="hex-btn" data-action="undo" title="Undo">
                        <span class="icon">↶</span> Undo
                    </button>
                    <button class="hex-btn" data-action="redo" title="Redo">
                        <span class="icon">↷</span> Redo
                    </button>
                    <button class="hex-btn" data-action="find" title="Find">
                        <span class="icon">🔍</span> Find
                    </button>
                    <button class="hex-btn" data-action="goto" title="Go to offset">
                        <span class="icon">📍</span> Go To
                    </button>
                    <div class="hex-info">
                        <span class="hex-offset">Offset: <span id="current-offset">0x00000000</span></span>
                        <span class="hex-value">Value: <span id="current-value">00</span></span>
                        <span class="hex-selection">Selection: <span id="selection-info">None</span></span>
                    </div>
                </div>
                <div class="hex-search-bar" style="display: none;">
                    <input type="text" class="hex-search-input" placeholder="Enter hex values (e.g., FF 00 1A) or text">
                    <select class="hex-search-type">
                        <option value="hex">Hex</option>
                        <option value="text">Text</option>
                    </select>
                    <button class="hex-search-btn" data-action="search-next">Next</button>
                    <button class="hex-search-btn" data-action="search-prev">Previous</button>
                    <button class="hex-search-btn" data-action="search-close">Close</button>
                </div>
                <div class="hex-content">
                    <div class="hex-addresses"></div>
                    <div class="hex-bytes"></div>
                    <div class="hex-ascii"></div>
                </div>
                <div class="hex-statusbar">
                    <span class="hex-file-info"></span>
                    <span class="hex-position"></span>
                    <span class="hex-modified"></span>
                </div>
            </div>
        `;

        // Store element references
        this.elements = {
            toolbar: this.container.querySelector('.hex-toolbar'),
            searchBar: this.container.querySelector('.hex-search-bar'),
            searchInput: this.container.querySelector('.hex-search-input'),
            searchType: this.container.querySelector('.hex-search-type'),
            addresses: this.container.querySelector('.hex-addresses'),
            bytes: this.container.querySelector('.hex-bytes'),
            ascii: this.container.querySelector('.hex-ascii'),
            fileInfo: this.container.querySelector('.hex-file-info'),
            position: this.container.querySelector('.hex-position'),
            modified: this.container.querySelector('.hex-modified'),
            currentOffset: this.container.querySelector('#current-offset'),
            currentValue: this.container.querySelector('#current-value'),
            selectionInfo: this.container.querySelector('#selection-info')
        };

        // Apply styles
        this.applyStyles();

        // Setup event listeners
        this.setupEventListeners();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .hex-editor {
                display: flex;
                flex-direction: column;
                height: 100%;
                font-family: 'Consolas', 'Monaco', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
            }

            .hex-toolbar {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: #252526;
                border-bottom: 1px solid #3c3c3c;
            }

            .hex-btn {
                padding: 4px 8px;
                background: #3c3c3c;
                border: 1px solid #4a4a4a;
                color: #d4d4d4;
                cursor: pointer;
                border-radius: 3px;
            }

            .hex-btn:hover {
                background: #4a4a4a;
            }

            .hex-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .hex-info {
                margin-left: auto;
                display: flex;
                gap: 20px;
                font-size: 12px;
            }

            .hex-search-bar {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: #2d2d30;
                border-bottom: 1px solid #3c3c3c;
            }

            .hex-search-input {
                flex: 1;
                padding: 4px 8px;
                background: #3c3c3c;
                border: 1px solid #4a4a4a;
                color: #d4d4d4;
            }

            .hex-content {
                flex: 1;
                display: flex;
                overflow: auto;
                padding: 8px;
            }

            .hex-addresses {
                width: 100px;
                margin-right: 16px;
                color: #858585;
                text-align: right;
                user-select: none;
            }

            .hex-bytes {
                flex: 2;
                margin-right: 16px;
            }

            .hex-ascii {
                flex: 1;
                border-left: 1px solid #3c3c3c;
                padding-left: 16px;
            }

            .hex-row {
                height: 20px;
                line-height: 20px;
                white-space: pre;
            }

            .hex-byte {
                display: inline-block;
                width: 24px;
                text-align: center;
                cursor: pointer;
                padding: 0 2px;
            }

            .hex-byte:hover {
                background: #2a2d2e;
            }

            .hex-byte.selected {
                background: #264f78;
                color: #ffffff;
            }

            .hex-byte.modified {
                color: #ff9900;
                font-weight: bold;
            }

            .hex-byte.cursor {
                outline: 2px solid #007acc;
            }

            .hex-ascii-char {
                display: inline-block;
                width: 10px;
                text-align: center;
                cursor: pointer;
            }

            .hex-ascii-char:hover {
                background: #2a2d2e;
            }

            .hex-ascii-char.selected {
                background: #264f78;
                color: #ffffff;
            }

            .hex-ascii-char.non-printable {
                color: #585858;
            }

            .hex-statusbar {
                display: flex;
                justify-content: space-between;
                padding: 4px 8px;
                background: #252526;
                border-top: 1px solid #3c3c3c;
                font-size: 12px;
            }

            .hex-modified::before {
                content: '●';
                color: #ff9900;
                margin-right: 4px;
            }
        `;

        if (!document.querySelector('#hex-editor-styles')) {
            style.id = 'hex-editor-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Toolbar actions
        this.elements.toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn) {
                const action = btn.dataset.action;
                this.handleAction(action);
            }
        });

        // Search bar actions
        this.elements.searchBar.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn) {
                const action = btn.dataset.action;
                this.handleSearchAction(action);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.container.contains(document.activeElement)) {
                return;
            }

            if (e.ctrlKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.save();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.showSearch();
                        break;
                    case 'g':
                        e.preventDefault();
                        this.showGoTo();
                        break;
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            } else {
                this.handleKeyPress(e);
            }
        });
    }

    async loadFile(file) {
        this.file = file;
        this.data = new Uint8Array(await file.arrayBuffer());
        this.modifications.clear();
        this.undoStack = [];
        this.redoStack = [];
        this.offset = 0;

        this.render();
        this.updateStatus();
    }

    async loadFromPath(path, storageId) {
        try {
            const response = await fetch(`/api/fs/download?storage=${storageId}&path=${encodeURIComponent(path)}`);
            if (!response.ok) {
                throw new Error('Failed to load file');
            }

            const blob = await response.blob();
            this.file = new File([blob], path.split('/').pop());
            this.data = new Uint8Array(await blob.arrayBuffer());
            this.modifications.clear();
            this.undoStack = [];
            this.redoStack = [];
            this.offset = 0;

            this.render();
            this.updateStatus();
        } catch (error) {
            console.error('Failed to load file:', error);
            throw error;
        }
    }

    render() {
        if (!this.data) {
            return;
        }

        const bytesPerPage = this.bytesPerRow * this.rowsPerPage;
        const startOffset = this.offset;
        const endOffset = Math.min(startOffset + bytesPerPage, this.data.length);

        // Clear content
        this.elements.addresses.innerHTML = '';
        this.elements.bytes.innerHTML = '';
        this.elements.ascii.innerHTML = '';

        // Generate rows
        for (let i = startOffset; i < endOffset; i += this.bytesPerRow) {
            const rowEnd = Math.min(i + this.bytesPerRow, this.data.length);

            // Address column
            const addressDiv = document.createElement('div');
            addressDiv.className = 'hex-row';
            addressDiv.textContent = this.formatAddress(i);
            this.elements.addresses.appendChild(addressDiv);

            // Hex bytes column
            const bytesDiv = document.createElement('div');
            bytesDiv.className = 'hex-row';
            for (let j = i; j < rowEnd; j++) {
                const byte = this.getByteValue(j);
                const span = document.createElement('span');
                span.className = 'hex-byte';
                span.dataset.offset = j;
                span.textContent = byte.toString(16).padStart(2, '0').toUpperCase();

                if (this.modifications.has(j)) {
                    span.classList.add('modified');
                }
                if (j >= this.selectionStart && j <= this.selectionEnd) {
                    span.classList.add('selected');
                }
                if (j === this.cursorPosition) {
                    span.classList.add('cursor');
                }

                span.addEventListener('click', () => this.onByteClick(j));
                bytesDiv.appendChild(span);

                // Add space after every 8 bytes
                if ((j - i) % 8 === 7 && j < rowEnd - 1) {
                    bytesDiv.appendChild(document.createTextNode(' '));
                }
            }
            this.elements.bytes.appendChild(bytesDiv);

            // ASCII column
            const asciiDiv = document.createElement('div');
            asciiDiv.className = 'hex-row';
            for (let j = i; j < rowEnd; j++) {
                const byte = this.getByteValue(j);
                const span = document.createElement('span');
                span.className = 'hex-ascii-char';
                span.dataset.offset = j;

                if (byte >= 32 && byte <= 126) {
                    span.textContent = String.fromCharCode(byte);
                } else {
                    span.textContent = '.';
                    span.classList.add('non-printable');
                }

                if (j >= this.selectionStart && j <= this.selectionEnd) {
                    span.classList.add('selected');
                }

                span.addEventListener('click', () => this.onByteClick(j));
                asciiDiv.appendChild(span);
            }
            this.elements.ascii.appendChild(asciiDiv);
        }
    }

    formatAddress(offset) {
        return `0x${offset.toString(16).padStart(8, '0').toUpperCase()}`;
    }

    getByteValue(offset) {
        return this.modifications.has(offset) ? this.modifications.get(offset) : this.data[offset];
    }

    onByteClick(offset) {
        this.cursorPosition = offset;
        this.updateCursorInfo();
        this.render();
    }

    updateCursorInfo() {
        const byte = this.getByteValue(this.cursorPosition);
        this.elements.currentOffset.textContent = this.formatAddress(this.cursorPosition);
        this.elements.currentValue.textContent = byte.toString(16).padStart(2, '0').toUpperCase();

        if (this.selectionStart >= 0 && this.selectionEnd >= 0) {
            const length = this.selectionEnd - this.selectionStart + 1;
            this.elements.selectionInfo.textContent = `${length} bytes`;
        } else {
            this.elements.selectionInfo.textContent = 'None';
        }
    }

    updateStatus() {
        // File info
        this.elements.fileInfo.textContent = `${this.file.name} (${this.formatSize(this.data.length)})`;

        // Position
        const percent = Math.round((this.offset / this.data.length) * 100);
        this.elements.position.textContent = `${percent}% | ${this.offset}/${this.data.length}`;

        // Modified indicator
        if (this.modifications.size > 0) {
            this.elements.modified.textContent = `Modified (${this.modifications.size} changes)`;
            this.elements.modified.style.display = 'block';
        } else {
            this.elements.modified.style.display = 'none';
        }
    }

    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    handleAction(action) {
        switch (action) {
            case 'save':
                this.save();
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'find':
                this.showSearch();
                break;
            case 'goto':
                this.showGoTo();
                break;
        }
    }

    handleSearchAction(action) {
        switch (action) {
            case 'search-next':
                this.searchNext();
                break;
            case 'search-prev':
                this.searchPrevious();
                break;
            case 'search-close':
                this.hideSearch();
                break;
        }
    }

    handleKeyPress(e) {
        if (this.readOnly) {
            return;
        }

        const key = e.key;
        if (this.editMode === 'hex') {
            // Hex edit mode
            if (/[0-9a-fA-F]/.test(key)) {
                e.preventDefault();
                this.editHexNibble(key);
            }
        } else {
            // ASCII edit mode
            if (key.length === 1) {
                e.preventDefault();
                this.editAscii(key);
            }
        }

        // Navigation
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.moveCursor(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveCursor(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveCursor(-this.bytesPerRow);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveCursor(this.bytesPerRow);
                break;
            case 'PageUp':
                e.preventDefault();
                this.scrollPage(-1);
                break;
            case 'PageDown':
                e.preventDefault();
                this.scrollPage(1);
                break;
            case 'Home':
                e.preventDefault();
                if (e.ctrlKey) {
                    this.cursorPosition = 0;
                    this.offset = 0;
                } else {
                    this.cursorPosition = Math.floor(this.cursorPosition / this.bytesPerRow) * this.bytesPerRow;
                }
                this.render();
                break;
            case 'End':
                e.preventDefault();
                if (e.ctrlKey) {
                    this.cursorPosition = this.data.length - 1;
                    this.offset = Math.floor(this.data.length / this.bytesPerRow) * this.bytesPerRow;
                } else {
                    const rowStart = Math.floor(this.cursorPosition / this.bytesPerRow) * this.bytesPerRow;
                    this.cursorPosition = Math.min(rowStart + this.bytesPerRow - 1, this.data.length - 1);
                }
                this.render();
                break;
        }
    }

    editHexNibble(nibble) {
        const value = parseInt(nibble, 16);
        const currentByte = this.getByteValue(this.cursorPosition);

        // Toggle between high and low nibble
        if (this.lastEditWasHighNibble) {
            // Edit low nibble
            const newByte = (currentByte & 0xf0) | value;
            this.modifyByte(this.cursorPosition, newByte);
            this.moveCursor(1);
            this.lastEditWasHighNibble = false;
        } else {
            // Edit high nibble
            const newByte = (value << 4) | (currentByte & 0x0f);
            this.modifyByte(this.cursorPosition, newByte);
            this.lastEditWasHighNibble = true;
        }
    }

    editAscii(char) {
        const newByte = char.charCodeAt(0);
        this.modifyByte(this.cursorPosition, newByte);
        this.moveCursor(1);
    }

    modifyByte(offset, value) {
        if (offset < 0 || offset >= this.data.length) {
            return;
        }

        // Save to undo stack
        const oldValue = this.getByteValue(offset);
        this.undoStack.push({ offset, oldValue, newValue: value });
        this.redoStack = [];

        // Apply modification
        this.modifications.set(offset, value);
        this.render();
        this.updateStatus();
        this.updateCursorInfo();
    }

    moveCursor(delta) {
        this.cursorPosition = Math.max(0, Math.min(this.cursorPosition + delta, this.data.length - 1));

        // Adjust offset if cursor moves out of view
        const bytesPerPage = this.bytesPerRow * this.rowsPerPage;
        if (this.cursorPosition < this.offset) {
            this.offset = Math.floor(this.cursorPosition / this.bytesPerRow) * this.bytesPerRow;
        } else if (this.cursorPosition >= this.offset + bytesPerPage) {
            this.offset =
                Math.floor((this.cursorPosition - bytesPerPage + this.bytesPerRow) / this.bytesPerRow) *
                this.bytesPerRow;
        }

        this.render();
        this.updateCursorInfo();
    }

    scrollPage(direction) {
        const bytesPerPage = this.bytesPerRow * this.rowsPerPage;
        this.offset = Math.max(0, Math.min(this.offset + direction * bytesPerPage, this.data.length - bytesPerPage));
        this.cursorPosition = Math.max(this.offset, Math.min(this.cursorPosition, this.offset + bytesPerPage - 1));
        this.render();
        this.updateCursorInfo();
    }

    undo() {
        if (this.undoStack.length === 0) {
            return;
        }

        const action = this.undoStack.pop();
        this.redoStack.push(action);

        if (action.oldValue === this.data[action.offset]) {
            this.modifications.delete(action.offset);
        } else {
            this.modifications.set(action.offset, action.oldValue);
        }

        this.render();
        this.updateStatus();
    }

    redo() {
        if (this.redoStack.length === 0) {
            return;
        }

        const action = this.redoStack.pop();
        this.undoStack.push(action);
        this.modifications.set(action.offset, action.newValue);

        this.render();
        this.updateStatus();
    }

    async save() {
        if (this.modifications.size === 0) {
            return;
        }

        // Apply modifications to data
        const newData = new Uint8Array(this.data);
        for (const [offset, value] of this.modifications) {
            newData[offset] = value;
        }

        // Create blob and trigger download
        const blob = new Blob([newData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.file.name;
        a.click();
        URL.revokeObjectURL(url);

        // Clear modifications
        this.data = newData;
        this.modifications.clear();
        this.undoStack = [];
        this.redoStack = [];
        this.render();
        this.updateStatus();
    }

    showSearch() {
        this.elements.searchBar.style.display = 'flex';
        this.elements.searchInput.focus();
    }

    hideSearch() {
        this.elements.searchBar.style.display = 'none';
    }

    searchNext() {
        const searchText = this.elements.searchInput.value;
        const searchType = this.elements.searchType.value;

        if (!searchText) {
            return;
        }

        let searchBytes;
        if (searchType === 'hex') {
            searchBytes = this.parseHexString(searchText);
        } else {
            searchBytes = new TextEncoder().encode(searchText);
        }

        const foundOffset = this.findBytes(searchBytes, this.cursorPosition + 1);
        if (foundOffset >= 0) {
            this.cursorPosition = foundOffset;
            this.selectionStart = foundOffset;
            this.selectionEnd = foundOffset + searchBytes.length - 1;
            this.scrollToCursor();
            this.render();
            this.updateCursorInfo();
        }
    }

    searchPrevious() {
        const searchText = this.elements.searchInput.value;
        const searchType = this.elements.searchType.value;

        if (!searchText) {
            return;
        }

        let searchBytes;
        if (searchType === 'hex') {
            searchBytes = this.parseHexString(searchText);
        } else {
            searchBytes = new TextEncoder().encode(searchText);
        }

        const foundOffset = this.findBytesReverse(searchBytes, this.cursorPosition - 1);
        if (foundOffset >= 0) {
            this.cursorPosition = foundOffset;
            this.selectionStart = foundOffset;
            this.selectionEnd = foundOffset + searchBytes.length - 1;
            this.scrollToCursor();
            this.render();
            this.updateCursorInfo();
        }
    }

    parseHexString(hexStr) {
        const hex = hexStr.replace(/\s+/g, '');
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    findBytes(needle, startOffset = 0) {
        for (let i = startOffset; i <= this.data.length - needle.length; i++) {
            let match = true;
            for (let j = 0; j < needle.length; j++) {
                if (this.getByteValue(i + j) !== needle[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i;
            }
        }
        return -1;
    }

    findBytesReverse(needle, startOffset) {
        if (startOffset === undefined) {
            startOffset = this.data.length - needle.length;
        }

        for (let i = startOffset; i >= 0; i--) {
            let match = true;
            for (let j = 0; j < needle.length; j++) {
                if (this.getByteValue(i + j) !== needle[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i;
            }
        }
        return -1;
    }

    scrollToCursor() {
        const bytesPerPage = this.bytesPerRow * this.rowsPerPage;
        if (this.cursorPosition < this.offset || this.cursorPosition >= this.offset + bytesPerPage) {
            this.offset = Math.floor(this.cursorPosition / this.bytesPerRow) * this.bytesPerRow;
        }
    }

    showGoTo() {
        const offsetStr = prompt('Enter offset (decimal or hex with 0x prefix):');
        if (!offsetStr) {
            return;
        }

        let offset;
        if (offsetStr.startsWith('0x')) {
            offset = parseInt(offsetStr.substr(2), 16);
        } else {
            offset = parseInt(offsetStr, 10);
        }

        if (!isNaN(offset) && offset >= 0 && offset < this.data.length) {
            this.cursorPosition = offset;
            this.scrollToCursor();
            this.render();
            this.updateCursorInfo();
        }
    }
}

// Export for global use
window.HexEditor = HexEditor;
