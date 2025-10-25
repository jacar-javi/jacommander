// terminal.js - Integrated terminal emulator for JaCommander
export class TerminalIntegration {
    constructor(app) {
        this.app = app;
        this.terminal = null;
        this.fitAddon = null;
        this.webLinksAddon = null;
        this.searchAddon = null;
        this.container = null;
        this.isVisible = false;
        this.socket = null;
        this.terminalId = null;
        this.currentPath = '/';
        this.history = [];
        this.historyIndex = -1;

        this.init();
        this.bindKeyboardShortcuts();
    }

    init() {
        // Create terminal container
        this.createTerminalUI();

        // Load xterm.js library dynamically
        this.loadXterm();

        // Inject terminal styles
        this.injectTerminalStyles();
    }

    createTerminalUI() {
        const existingTerminal = document.querySelector('.terminal-container');
        if (existingTerminal) {
            existingTerminal.remove();
        }

        const terminalContainer = document.createElement('div');
        terminalContainer.className = 'terminal-container';
        terminalContainer.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-tabs">
                    <div class="terminal-tab active">
                        <span class="terminal-tab-icon">💻</span>
                        <span class="terminal-tab-title">Terminal 1</span>
                        <button class="terminal-tab-close">×</button>
                    </div>
                    <button class="terminal-tab-add" title="New Terminal">+</button>
                </div>
                <div class="terminal-controls">
                    <button class="terminal-btn" title="Clear (Ctrl+L)" data-action="clear">
                        <span>Clear</span>
                    </button>
                    <button class="terminal-btn" title="Search (Ctrl+Shift+F)" data-action="search">
                        <span>🔍</span>
                    </button>
                    <button class="terminal-btn" title="Split Horizontal" data-action="split-h">
                        <span>⬌</span>
                    </button>
                    <button class="terminal-btn" title="Split Vertical" data-action="split-v">
                        <span>⬍</span>
                    </button>
                    <button class="terminal-btn" title="Settings" data-action="settings">
                        <span>⚙️</span>
                    </button>
                    <button class="terminal-btn terminal-close" title="Close Terminal" data-action="close">
                        <span>✕</span>
                    </button>
                </div>
            </div>
            <div class="terminal-body">
                <div id="terminal"></div>
            </div>
            <div class="terminal-status-bar">
                <span class="terminal-status-path">${this.currentPath}</span>
                <span class="terminal-status-size">80×24</span>
                <span class="terminal-status-encoding">UTF-8</span>
            </div>
        `;

        document.body.appendChild(terminalContainer);
        this.container = terminalContainer;

        // Bind control buttons
        this.bindControlButtons();

        // Make terminal resizable
        this.makeResizable();
    }

    loadXterm() {
        // Check if xterm.js is already loaded
        if (window.Terminal) {
            this.initializeTerminal();
            return;
        }

        // Load xterm.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js';
        script.onload = () => {
            // Load xterm CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css';
            document.head.appendChild(link);

            // Load addons
            this.loadXtermAddons();
        };
        document.head.appendChild(script);
    }

    loadXtermAddons() {
        Promise.all([
            this.loadScript('https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js'),
            this.loadScript(
                'https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.min.js'
            ),
            this.loadScript('https://cdn.jsdelivr.net/npm/xterm-addon-search@0.13.0/lib/xterm-addon-search.min.js')
        ]).then(() => {
            this.initializeTerminal();
        });
    }

    loadScript(src) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    initializeTerminal() {
        if (!window.Terminal) {
            console.error('xterm.js not loaded');
            return;
        }

        // Create terminal instance
        this.terminal = new window.Terminal({
            cols: 80,
            rows: 24,
            fontFamily: '"Cascadia Code", "Monaco", "Consolas", monospace',
            fontSize: 14,
            theme: {
                background: '#1e1e1e',
                foreground: '#cccccc',
                cursor: '#ffffff',
                selection: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#cd3131',
                green: '#0dbc79',
                yellow: '#e5e510',
                blue: '#2472c8',
                magenta: '#bc3fbc',
                cyan: '#11a8cd',
                white: '#e5e5e5',
                brightBlack: '#666666',
                brightRed: '#f14c4c',
                brightGreen: '#23d18b',
                brightYellow: '#f5f543',
                brightBlue: '#3b8eea',
                brightMagenta: '#d670d6',
                brightCyan: '#29b8db',
                brightWhite: '#ffffff'
            },
            cursorBlink: true,
            cursorStyle: 'block',
            bellStyle: 'sound',
            scrollback: 10000,
            tabStopWidth: 8,
            windowsMode: navigator.platform.includes('Win')
        });

        // Initialize addons
        if (window.FitAddon) {
            this.fitAddon = new window.FitAddon.FitAddon();
            this.terminal.loadAddon(this.fitAddon);
        }

        if (window.WebLinksAddon) {
            this.webLinksAddon = new window.WebLinksAddon.WebLinksAddon();
            this.terminal.loadAddon(this.webLinksAddon);
        }

        if (window.SearchAddon) {
            this.searchAddon = new window.SearchAddon.SearchAddon();
            this.terminal.loadAddon(this.searchAddon);
        }

        // Open terminal in container
        const terminalElement = document.getElementById('terminal');
        if (terminalElement) {
            this.terminal.open(terminalElement);
            this.fitAddon?.fit();
        }

        // Connect to backend
        this.connectWebSocket();

        // Handle terminal input
        this.terminal.onData((data) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(
                    JSON.stringify({
                        type: 'input',
                        data: data,
                        id: this.terminalId
                    })
                );
            }
        });

        // Handle terminal resize
        this.terminal.onResize((size) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(
                    JSON.stringify({
                        type: 'resize',
                        cols: size.cols,
                        rows: size.rows,
                        id: this.terminalId
                    })
                );
            }
            this.updateStatusBar();
        });

        // Welcome message
        this.terminal.writeln('🚀 JaCommander Terminal v1.0');
        this.terminal.writeln('Type "help" for available commands\n');
        this.terminal.write(`\x1b[32m${this.currentPath}\x1b[0m$ `);
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/terminal`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            // Request new terminal session
            this.socket.send(
                JSON.stringify({
                    type: 'create',
                    cols: this.terminal.cols,
                    rows: this.terminal.rows,
                    cwd: this.currentPath
                })
            );
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'created':
                    this.terminalId = message.id;
                    break;
                case 'output':
                    this.terminal.write(message.data);
                    break;
                case 'exit':
                    this.terminal.writeln('\n\x1b[33mTerminal session ended\x1b[0m');
                    break;
                case 'error':
                    this.terminal.writeln(`\x1b[31mError: ${message.message}\x1b[0m`);
                    break;
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.terminal.writeln('\x1b[31mConnection error. Terminal running in local mode.\x1b[0m');
            this.setupLocalMode();
        };

        this.socket.onclose = () => {
            this.terminal.writeln('\n\x1b[33mDisconnected from server\x1b[0m');
            this.setupLocalMode();
        };
    }

    setupLocalMode() {
        // Fallback to local command simulation
        let currentLine = '';

        this.terminal.onData((data) => {
            const code = data.charCodeAt(0);

            // Handle special keys
            if (code === 127) {
                // Backspace
                if (currentLine.length > 0) {
                    currentLine = currentLine.slice(0, -1);
                    this.terminal.write('\b \b');
                }
            } else if (code === 13) {
                // Enter
                this.terminal.writeln('');
                this.handleLocalCommand(currentLine);
                currentLine = '';
                this.terminal.write(`\x1b[32m${this.currentPath}\x1b[0m$ `);
            } else if (code === 3) {
                // Ctrl+C
                currentLine = '';
                this.terminal.write('^C\n');
                this.terminal.write(`\x1b[32m${this.currentPath}\x1b[0m$ `);
            } else if (code >= 32) {
                // Regular characters
                currentLine += data;
                this.terminal.write(data);
            }
        });
    }

    handleLocalCommand(command) {
        const parts = command.trim().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        // Add to history
        this.history.push(command);
        this.historyIndex = this.history.length;

        // Simulate basic commands
        switch (cmd) {
            case '':
                break;
            case 'help':
                this.terminal.writeln('Available commands:');
                this.terminal.writeln('  help     - Show this help message');
                this.terminal.writeln('  clear    - Clear the terminal');
                this.terminal.writeln('  pwd      - Print working directory');
                this.terminal.writeln('  cd       - Change directory');
                this.terminal.writeln('  ls       - List directory contents');
                this.terminal.writeln('  echo     - Echo text');
                this.terminal.writeln('  exit     - Close terminal');
                break;
            case 'clear':
                this.terminal.clear();
                break;
            case 'pwd':
                this.terminal.writeln(this.currentPath);
                break;
            case 'cd':
                if (args.length > 0) {
                    this.changeDirectory(args[0]);
                } else {
                    this.currentPath = '/';
                    this.updateStatusBar();
                }
                break;
            case 'ls':
                this.listDirectory();
                break;
            case 'echo':
                this.terminal.writeln(args.join(' '));
                break;
            case 'exit':
                this.hide();
                break;
            default:
                this.terminal.writeln(`Command not found: ${cmd}`);
                this.terminal.writeln('Type "help" for available commands');
        }
    }

    changeDirectory(path) {
        // Simulate directory change
        if (path === '..') {
            const parts = this.currentPath.split('/').filter((p) => p);
            parts.pop();
            this.currentPath = `/${parts.join('/')}`;
        } else if (path.startsWith('/')) {
            this.currentPath = path;
        } else {
            this.currentPath = `${this.currentPath.replace(/\/$/, '')}/${path}`;
        }
        this.updateStatusBar();
    }

    listDirectory() {
        // Get files from the active panel
        const panel = this.app.focusedPanel === 'right' ? this.app.rightPanel : this.app.leftPanel;
        if (panel && panel.files) {
            panel.files.forEach((file) => {
                const icon = file.isDir ? '📁' : '📄';
                const size = file.isDir ? '' : ` (${this.formatSize(file.size)})`;
                this.terminal.writeln(`${icon} ${file.name}${size}`);
            });
        }
    }

    formatSize(bytes) {
        if (bytes === 0) {
            return '0 B';
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    bindControlButtons() {
        this.container.querySelectorAll('.terminal-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Tab controls
        this.container.querySelector('.terminal-tab-close')?.addEventListener('click', () => {
            this.hide();
        });

        this.container.querySelector('.terminal-tab-add')?.addEventListener('click', () => {
            this.app.showNotification('Multiple terminals coming soon!', 'info');
        });
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.terminal?.clear();
                break;
            case 'search':
                this.showSearchDialog();
                break;
            case 'split-h':
                this.app.showNotification('Split terminal coming soon!', 'info');
                break;
            case 'split-v':
                this.app.showNotification('Split terminal coming soon!', 'info');
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'close':
                this.hide();
                break;
        }
    }

    showSearchDialog() {
        if (!this.searchAddon) {
            return;
        }

        const searchTerm = prompt('Search in terminal:');
        if (searchTerm) {
            this.searchAddon.findNext(searchTerm);
        }
    }

    showSettings() {
        // TODO: Implement terminal settings dialog
        this.app.showNotification('Terminal settings coming soon!', 'info');
    }

    makeResizable() {
        const container = this.container;
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'terminal-resize-handle';
        container.appendChild(resizeHandle);

        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = container.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) {
                return;
            }

            const deltaY = startY - e.clientY;
            const newHeight = Math.min(Math.max(startHeight + deltaY, 150), window.innerHeight - 100);
            container.style.height = `${newHeight}px`;

            if (this.fitAddon) {
                this.fitAddon.fit();
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    }

    updateStatusBar() {
        const pathElement = this.container.querySelector('.terminal-status-path');
        const sizeElement = this.container.querySelector('.terminal-status-size');

        if (pathElement) {
            pathElement.textContent = this.currentPath;
        }

        if (sizeElement && this.terminal) {
            sizeElement.textContent = `${this.terminal.cols}×${this.terminal.rows}`;
        }
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+` or Ctrl+Shift+` - Toggle terminal
            if (e.ctrlKey && (e.key === '`' || (e.shiftKey && e.key === '~'))) {
                e.preventDefault();
                this.toggle();
            }

            // When terminal is visible
            if (this.isVisible) {
                // Ctrl+L - Clear terminal
                if (e.ctrlKey && e.key === 'l') {
                    e.preventDefault();
                    this.terminal?.clear();
                }

                // Ctrl+Shift+F - Search in terminal
                if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                    e.preventDefault();
                    this.showSearchDialog();
                }

                // Escape - Hide terminal
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.hide();
                }
            }
        });
    }

    show() {
        if (!this.container) {
            return;
        }

        this.container.classList.add('visible');
        this.isVisible = true;

        // Focus terminal
        this.terminal?.focus();

        // Fit terminal to container
        if (this.fitAddon) {
            setTimeout(() => {
                this.fitAddon.fit();
            }, 100);
        }

        // Update path from current panel
        const panel = this.app.focusedPanel === 'right' ? this.app.rightPanel : this.app.leftPanel;
        if (panel) {
            this.currentPath = panel.currentPath || '/';
            this.updateStatusBar();
        }
    }

    hide() {
        if (!this.container) {
            return;
        }

        this.container.classList.remove('visible');
        this.isVisible = false;

        // Return focus to file panel
        const panel = this.app.focusedPanel === 'right' ? this.app.rightPanel : this.app.leftPanel;
        panel?.focus();
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    injectTerminalStyles() {
        const styleId = 'terminal-integration-styles';
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .terminal-container {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 300px;
                background: #1e1e1e;
                border-top: 2px solid var(--border-color);
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                transform: translateY(100%);
                transition: transform 0.3s ease;
            }

            .terminal-container.visible {
                transform: translateY(0);
            }

            .terminal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #2d2d2d;
                border-bottom: 1px solid #3e3e3e;
                padding: 4px 10px;
                min-height: 32px;
            }

            .terminal-tabs {
                display: flex;
                align-items: center;
                gap: 4px;
                flex: 1;
            }

            .terminal-tab {
                display: flex;
                align-items: center;
                padding: 4px 10px;
                background: #1e1e1e;
                border: 1px solid #3e3e3e;
                border-radius: 4px 4px 0 0;
                cursor: pointer;
                font-size: 13px;
                color: #cccccc;
                gap: 6px;
            }

            .terminal-tab.active {
                background: #1e1e1e;
                border-bottom-color: #1e1e1e;
            }

            .terminal-tab-icon {
                font-size: 12px;
            }

            .terminal-tab-title {
                white-space: nowrap;
            }

            .terminal-tab-close {
                background: none;
                border: none;
                color: #cccccc;
                cursor: pointer;
                padding: 0 2px;
                opacity: 0.6;
                font-size: 16px;
            }

            .terminal-tab-close:hover {
                opacity: 1;
            }

            .terminal-tab-add {
                background: none;
                border: 1px solid #3e3e3e;
                color: #cccccc;
                cursor: pointer;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 16px;
            }

            .terminal-tab-add:hover {
                background: #3e3e3e;
            }

            .terminal-controls {
                display: flex;
                gap: 4px;
            }

            .terminal-btn {
                background: none;
                border: 1px solid transparent;
                color: #cccccc;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .terminal-btn:hover {
                background: #3e3e3e;
                border-color: #4e4e4e;
            }

            .terminal-btn span {
                line-height: 1;
            }

            .terminal-close {
                color: #f48771;
            }

            .terminal-body {
                flex: 1;
                overflow: hidden;
                padding: 10px;
            }

            #terminal {
                width: 100%;
                height: 100%;
            }

            .terminal-status-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #2d2d2d;
                border-top: 1px solid #3e3e3e;
                padding: 2px 10px;
                font-size: 11px;
                color: #8c8c8c;
            }

            .terminal-resize-handle {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 5px;
                cursor: ns-resize;
                background: transparent;
            }

            .terminal-resize-handle:hover {
                background: var(--primary-color);
                opacity: 0.3;
            }

            /* Adjust main container when terminal is visible */
            body.terminal-open .container {
                padding-bottom: 310px;
            }
        `;

        document.head.appendChild(style);
    }

    dispose() {
        // Clean up resources
        if (this.socket) {
            this.socket.close();
        }

        if (this.terminal) {
            this.terminal.dispose();
        }

        if (this.container) {
            this.container.remove();
        }
    }
}

// Export for use in main app
export default TerminalIntegration;
