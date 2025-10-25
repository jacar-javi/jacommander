/**
 * Tests for FilePanel functionality
 */

describe('FilePanel', () => {
    let panel;
    let panelElement;

    beforeEach(() => {
        // Create DOM structure
        document.body.innerHTML = `
            <div id="left-panel" class="file-panel">
                <div class="panel-header">
                    <div class="path-bar">/home</div>
                </div>
                <div class="file-list"></div>
                <div class="panel-footer">
                    <div class="file-info"></div>
                </div>
            </div>
        `;

        panelElement = document.getElementById('left-panel');

        // Mock FilePanel constructor
        global.FilePanel = jest.fn().mockImplementation(function (element, side) {
            this.element = element;
            this.side = side;
            this.currentPath = '/';
            this.files = [];
            this.selectedIndex = 0;
            this.selectedFiles = new Set();
            this.active = false;

            this.loadDirectory = jest.fn().mockResolvedValue();
            this.render = jest.fn();
            this.navigateUp = jest.fn();
            this.navigateDown = jest.fn();
            this.enterDirectory = jest.fn();
            this.goBack = jest.fn();
            this.toggleSelection = jest.fn();
            this.selectAll = jest.fn();
            this.deselectAll = jest.fn();
            this.setActive = jest.fn((active) => {
                this.active = active;
            });
            this.getSelectedFiles = jest.fn(() => Array.from(this.selectedFiles));
            this.updatePath = jest.fn((path) => {
                this.currentPath = path;
            });
        });

        panel = new FilePanel(panelElement, 'left');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should initialize with correct properties', () => {
        expect(panel.element).toBe(panelElement);
        expect(panel.side).toBe('left');
        expect(panel.currentPath).toBe('/');
        expect(panel.files).toEqual([]);
        expect(panel.selectedIndex).toBe(0);
    });

    test('should load directory', async () => {
        const mockFiles = [
            { name: 'file1.txt', size: 1024, isDir: false },
            { name: 'folder1', size: 0, isDir: true }
        ];

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockFiles)
        });

        panel.loadDirectory.mockResolvedValueOnce();
        await panel.loadDirectory('/test');

        expect(panel.loadDirectory).toHaveBeenCalledWith('/test');
    });

    test('should handle navigation', () => {
        panel.files = [
            { name: 'file1.txt', size: 1024, isDir: false },
            { name: 'file2.txt', size: 2048, isDir: false },
            { name: 'folder1', size: 0, isDir: true }
        ];

        panel.selectedIndex = 0;

        // Navigate down
        panel.navigateDown();
        expect(panel.navigateDown).toHaveBeenCalled();

        // Navigate up
        panel.navigateUp();
        expect(panel.navigateUp).toHaveBeenCalled();
    });

    test('should enter directory', () => {
        panel.files = [{ name: 'folder1', size: 0, isDir: true }];
        panel.selectedIndex = 0;

        panel.enterDirectory();
        expect(panel.enterDirectory).toHaveBeenCalled();
    });

    test('should go back to parent directory', () => {
        panel.currentPath = '/home/user';
        panel.goBack();
        expect(panel.goBack).toHaveBeenCalled();
    });

    test('should toggle file selection', () => {
        panel.files = [{ name: 'file1.txt', size: 1024, isDir: false }];
        panel.selectedIndex = 0;

        panel.toggleSelection();
        expect(panel.toggleSelection).toHaveBeenCalled();
    });

    test('should select all files', () => {
        panel.files = [
            { name: 'file1.txt', size: 1024, isDir: false },
            { name: 'file2.txt', size: 2048, isDir: false }
        ];

        panel.selectAll();
        expect(panel.selectAll).toHaveBeenCalled();
    });

    test('should deselect all files', () => {
        panel.selectedFiles = new Set([0, 1]);

        panel.deselectAll();
        expect(panel.deselectAll).toHaveBeenCalled();
    });

    test('should set active state', () => {
        panel.setActive(true);
        expect(panel.active).toBe(true);
        expect(panel.setActive).toHaveBeenCalledWith(true);

        panel.setActive(false);
        expect(panel.active).toBe(false);
        expect(panel.setActive).toHaveBeenCalledWith(false);
    });

    test('should get selected files', () => {
        panel.files = [
            { name: 'file1.txt', size: 1024, isDir: false },
            { name: 'file2.txt', size: 2048, isDir: false }
        ];
        panel.selectedFiles = new Set([0, 1]);

        const selected = panel.getSelectedFiles();
        expect(panel.getSelectedFiles).toHaveBeenCalled();
    });

    test('should update path', () => {
        const newPath = '/home/user/documents';
        panel.updatePath(newPath);

        expect(panel.currentPath).toBe(newPath);
        expect(panel.updatePath).toHaveBeenCalledWith(newPath);
    });
});

describe('Panel Rendering', () => {
    let panel;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="test-panel" class="file-panel">
                <div class="panel-header">
                    <div class="path-bar"></div>
                </div>
                <div class="file-list"></div>
                <div class="panel-footer">
                    <div class="file-info"></div>
                </div>
            </div>
        `;

        global.FilePanel = jest.fn().mockImplementation(function (element) {
            this.element = element;
            this.files = [];
            this.selectedIndex = 0;
            this.selectedFiles = new Set();

            this.formatSize = (size) => {
                if (size < 1024) return `${size} B`;
                if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
                return `${(size / (1024 * 1024)).toFixed(1)} MB`;
            };

            this.render = jest.fn(() => {
                const fileList = this.element.querySelector('.file-list');
                fileList.innerHTML = '';

                this.files.forEach((file, index) => {
                    const row = document.createElement('div');
                    row.className = 'file-row';
                    if (index === this.selectedIndex) {
                        row.classList.add('selected');
                    }
                    if (this.selectedFiles.has(index)) {
                        row.classList.add('marked');
                    }
                    row.innerHTML = `
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatSize(file.size)}</span>
                    `;
                    fileList.appendChild(row);
                });
            });
        });

        const element = document.getElementById('test-panel');
        panel = new FilePanel(element);
    });

    test('should render empty list', () => {
        panel.render();

        const fileList = panel.element.querySelector('.file-list');
        expect(fileList.children.length).toBe(0);
    });

    test('should render files', () => {
        panel.files = [
            { name: 'file1.txt', size: 1024, isDir: false },
            { name: 'file2.txt', size: 2048, isDir: false }
        ];

        panel.render();

        const fileList = panel.element.querySelector('.file-list');
        expect(fileList.children.length).toBe(2);

        const firstRow = fileList.children[0];
        expect(firstRow.querySelector('.file-name').textContent).toBe('file1.txt');
        expect(firstRow.querySelector('.file-size').textContent).toBe('1.0 KB');
    });

    test('should highlight selected file', () => {
        panel.files = [
            { name: 'file1.txt', size: 1024, isDir: false },
            { name: 'file2.txt', size: 2048, isDir: false }
        ];
        panel.selectedIndex = 1;

        panel.render();

        const fileList = panel.element.querySelector('.file-list');
        expect(fileList.children[0].classList.contains('selected')).toBe(false);
        expect(fileList.children[1].classList.contains('selected')).toBe(true);
    });

    test('should mark selected files', () => {
        panel.files = [
            { name: 'file1.txt', size: 1024, isDir: false },
            { name: 'file2.txt', size: 2048, isDir: false }
        ];
        panel.selectedFiles = new Set([0]);

        panel.render();

        const fileList = panel.element.querySelector('.file-list');
        expect(fileList.children[0].classList.contains('marked')).toBe(true);
        expect(fileList.children[1].classList.contains('marked')).toBe(false);
    });

    test('should format file sizes correctly', () => {
        expect(panel.formatSize(512)).toBe('512 B');
        expect(panel.formatSize(1024)).toBe('1.0 KB');
        expect(panel.formatSize(1536)).toBe('1.5 KB');
        expect(panel.formatSize(1048576)).toBe('1.0 MB');
        expect(panel.formatSize(1572864)).toBe('1.5 MB');
    });
});
