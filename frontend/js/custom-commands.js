/**
 * Custom Commands Module
 * Allows users to define and execute custom shell commands
 */

export class CustomCommands {
    constructor(app) {
        this.app = app;
        this.commands = [];
        this.variables = {};
        this.executing = false;
        this.commandHistory = [];

        this.init();
    }

    init() {
        this.createUI();
        this.setupEventListeners();
        this.loadCommands();
        this.initializeVariables();
        this.applyStyles();
    }

    createUI() {
        // Create command palette modal
        const modal = document.createElement('div');
        modal.id = 'command-palette';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content command-palette">
                <div class="command-header">
                    <input type="text" id="command-input" placeholder="Type command or search..." autocomplete="off">
                    <button class="command-settings-btn" title="Settings">⚙</button>
                </div>
                <div class="command-suggestions" id="command-suggestions">
                    <!-- Suggestions will appear here -->
                </div>
                <div class="command-output" id="command-output" style="display: none;">
                    <pre id="output-text"></pre>
                    <button id="close-output">Close</button>
                </div>
            </div>
        `;

        // Create command management modal
        const settingsModal = document.createElement('div');
        settingsModal.id = 'command-settings';
        settingsModal.className = 'modal';
        settingsModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Custom Commands Management</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="command-form">
                        <h3>Add/Edit Command</h3>
                        <input type="hidden" id="cmd-id">
                        <div class="form-field">
                            <label>Name:</label>
                            <input type="text" id="cmd-name" placeholder="Command name">
                        </div>
                        <div class="form-field">
                            <label>Description:</label>
                            <input type="text" id="cmd-description" placeholder="What this command does">
                        </div>
                        <div class="form-field">
                            <label>Command:</label>
                            <textarea id="cmd-command" rows="3" placeholder="Shell command to execute"></textarea>
                            <small>Available variables: {file}, {files}, {dir}, {selection}, {input}</small>
                        </div>
                        <div class="form-field">
                            <label>Category:</label>
                            <select id="cmd-category">
                                <option value="general">General</option>
                                <option value="file">File Operations</option>
                                <option value="system">System</option>
                                <option value="development">Development</option>
                                <option value="git">Git</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Hotkey:</label>
                            <input type="text" id="cmd-hotkey" placeholder="e.g., Ctrl+Shift+G">
                        </div>
                        <div class="form-field">
                            <label>Icon:</label>
                            <select id="cmd-icon">
                                <option value="⚡">⚡ Lightning</option>
                                <option value="🔧">🔧 Wrench</option>
                                <option value="📦">📦 Package</option>
                                <option value="🚀">🚀 Rocket</option>
                                <option value="💻">💻 Computer</option>
                                <option value="📝">📝 Document</option>
                                <option value="🔍">🔍 Search</option>
                                <option value="⚙️">⚙️ Gear</option>
                                <option value="🎯">🎯 Target</option>
                                <option value="📊">📊 Chart</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Options:</label>
                            <div class="command-options">
                                <label><input type="checkbox" id="cmd-confirm"> Require confirmation</label>
                                <label><input type="checkbox" id="cmd-output"> Show output</label>
                                <label><input type="checkbox" id="cmd-background"> Run in background</label>
                                <label><input type="checkbox" id="cmd-reload"> Reload panel after</label>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button id="save-command" class="primary">Save Command</button>
                            <button id="test-command">Test</button>
                            <button id="reset-command">Reset</button>
                        </div>
                    </div>

                    <div class="commands-list">
                        <h3>Existing Commands</h3>
                        <div class="commands-toolbar">
                            <button id="import-commands">Import</button>
                            <button id="export-commands">Export</button>
                            <button id="reset-defaults">Reset to Defaults</button>
                        </div>
                        <div id="commands-table">
                            <!-- Commands will be listed here -->
                        </div>
                    </div>

                    <div class="predefined-commands">
                        <h3>Predefined Commands</h3>
                        <div id="predefined-list">
                            <!-- Predefined commands will be listed here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create quick access toolbar
        const toolbar = document.createElement('div');
        toolbar.id = 'command-toolbar';
        toolbar.className = 'command-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-commands" id="toolbar-commands">
                <!-- Pinned commands will appear here -->
            </div>
            <button class="toolbar-toggle" title="Toggle Command Bar">≡</button>
        `;

        document.body.appendChild(modal);
        document.body.appendChild(settingsModal);
        document.body.appendChild(toolbar);

        this.palette = modal;
        this.settings = settingsModal;
        this.toolbar = toolbar;
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Command Palette */
            #command-palette {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                align-items: flex-start;
                padding-top: 100px;
            }

            #command-palette.show {
                display: flex;
                justify-content: center;
            }

            .command-palette {
                width: 600px;
                max-width: 90vw;
                background: var(--panel-bg);
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                overflow: hidden;
            }

            .command-header {
                display: flex;
                align-items: center;
                padding: 0;
                border-bottom: 2px solid var(--primary-color);
            }

            #command-input {
                flex: 1;
                padding: 15px;
                background: transparent;
                border: none;
                font-size: 16px;
                color: var(--text-primary);
                outline: none;
            }

            .command-settings-btn {
                width: 40px;
                height: 40px;
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 18px;
            }

            .command-settings-btn:hover {
                color: var(--primary-color);
            }

            .command-suggestions {
                max-height: 400px;
                overflow-y: auto;
                padding: 10px;
            }

            .command-item {
                display: flex;
                align-items: center;
                padding: 10px;
                margin-bottom: 5px;
                background: var(--item-bg);
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .command-item:hover,
            .command-item.selected {
                background: var(--hover-bg);
                transform: translateX(5px);
            }

            .command-icon {
                width: 30px;
                font-size: 18px;
                text-align: center;
                margin-right: 10px;
            }

            .command-info {
                flex: 1;
            }

            .command-name {
                font-weight: 500;
                color: var(--text-primary);
                margin-bottom: 2px;
            }

            .command-desc {
                font-size: 12px;
                color: var(--text-secondary);
            }

            .command-hotkey {
                padding: 3px 8px;
                background: var(--badge-bg);
                border-radius: 3px;
                font-size: 11px;
                color: var(--text-secondary);
            }

            .command-output {
                padding: 15px;
                background: var(--panel-bg);
                border-top: 1px solid var(--border-color);
            }

            #output-text {
                max-height: 300px;
                overflow: auto;
                padding: 10px;
                background: var(--input-bg);
                border-radius: 5px;
                font-family: monospace;
                font-size: 13px;
                color: var(--text-primary);
                margin-bottom: 10px;
            }

            #close-output {
                padding: 8px 16px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
            }

            /* Command Settings */
            #command-settings .modal-content {
                width: 800px;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
            }

            .command-form {
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
            }

            .command-options {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
            }

            .command-options label {
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
            }

            .commands-list {
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
            }

            .commands-toolbar {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .commands-toolbar button {
                padding: 6px 12px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
            }

            #commands-table {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .command-row {
                display: flex;
                align-items: center;
                padding: 10px;
                background: var(--item-bg);
                border-radius: 5px;
            }

            .command-row:hover {
                background: var(--hover-bg);
            }

            .command-row-icon {
                width: 30px;
                font-size: 18px;
                text-align: center;
            }

            .command-row-info {
                flex: 1;
                margin: 0 10px;
            }

            .command-row-name {
                font-weight: 500;
                color: var(--text-primary);
            }

            .command-row-cmd {
                font-size: 11px;
                font-family: monospace;
                color: var(--text-secondary);
                margin-top: 2px;
            }

            .command-row-actions {
                display: flex;
                gap: 5px;
            }

            .command-row-actions button {
                padding: 4px 8px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 12px;
            }

            .predefined-commands {
                padding: 20px;
            }

            #predefined-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
            }

            .predefined-item {
                padding: 10px;
                background: var(--item-bg);
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .predefined-item:hover {
                background: var(--hover-bg);
                transform: scale(1.02);
            }

            .predefined-name {
                font-weight: 500;
                color: var(--primary-color);
                margin-bottom: 5px;
            }

            .predefined-desc {
                font-size: 12px;
                color: var(--text-secondary);
            }

            /* Command Toolbar */
            .command-toolbar {
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
                z-index: 98;
                transform: translateY(40px);
                transition: transform 0.3s;
            }

            .command-toolbar.visible {
                transform: translateY(0);
            }

            .toolbar-commands {
                display: flex;
                gap: 5px;
                flex: 1;
                overflow-x: auto;
            }

            .toolbar-command {
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

            .toolbar-command:hover {
                background: var(--hover-bg);
            }

            .toolbar-command-icon {
                margin-right: 5px;
            }

            .toolbar-toggle {
                width: 30px;
                height: 30px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                color: var(--text-primary);
                cursor: pointer;
            }

            /* Animations */
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .command-palette {
                animation: slideIn 0.2s ease-out;
            }

            /* Variable input dialog */
            .variable-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 20px;
                z-index: 10001;
                min-width: 300px;
            }

            .variable-dialog h3 {
                margin-top: 0;
                color: var(--text-primary);
            }

            .variable-dialog input {
                width: 100%;
                padding: 8px;
                margin: 10px 0;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
            }

            .variable-dialog-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .variable-dialog button {
                padding: 6px 12px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
            }
        `;

        if (!document.querySelector('#custom-commands-styles')) {
            style.id = 'custom-commands-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Command palette
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.togglePalette();
            }
        });

        // Command input
        const input = this.palette.querySelector('#command-input');
        input.addEventListener('input', (e) => {
            this.filterCommands(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeSelected();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectNext();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectPrevious();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hidePalette();
            }
        });

        // Settings button
        this.palette.querySelector('.command-settings-btn').addEventListener('click', () => {
            this.hidePalette();
            this.showSettings();
        });

        // Settings modal
        this.settings.querySelector('.close-btn').addEventListener('click', () => {
            this.hideSettings();
        });

        this.settings.querySelector('#save-command').addEventListener('click', () => {
            this.saveCommand();
        });

        this.settings.querySelector('#test-command').addEventListener('click', () => {
            this.testCommand();
        });

        this.settings.querySelector('#reset-command').addEventListener('click', () => {
            this.resetCommandForm();
        });

        this.settings.querySelector('#import-commands').addEventListener('click', () => {
            this.importCommands();
        });

        this.settings.querySelector('#export-commands').addEventListener('click', () => {
            this.exportCommands();
        });

        this.settings.querySelector('#reset-defaults').addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Toolbar
        this.toolbar.querySelector('.toolbar-toggle').addEventListener('click', () => {
            this.toggleToolbar();
        });

        // Close output
        this.palette.querySelector('#close-output').addEventListener('click', () => {
            this.hideOutput();
        });

        // Close modals on outside click
        this.palette.addEventListener('click', (e) => {
            if (e.target === this.palette) {
                this.hidePalette();
            }
        });

        this.settings.addEventListener('click', (e) => {
            if (e.target === this.settings) {
                this.hideSettings();
            }
        });
    }

    initializeVariables() {
        // Update variables based on current state
        const activePanel = this.app.panels[this.app.activePanel];
        if (activePanel) {
            this.variables.dir = activePanel.currentPath;
            this.variables.file = activePanel.selectedFile?.name || '';
            this.variables.files = activePanel.selectedFiles?.map((f) => f.name).join(' ') || '';
            this.variables.selection = activePanel.selectedFiles?.length || 0;
        }
    }

    getDefaultCommands() {
        return [
            {
                id: 'cmd_1',
                name: 'List Files',
                description: 'List all files in current directory',
                command: 'ls -la {dir}',
                category: 'file',
                icon: '📝',
                hotkey: '',
                options: { confirm: false, output: true, background: false, reload: false },
                pinned: false
            },
            {
                id: 'cmd_2',
                name: 'Git Status',
                description: 'Show git repository status',
                command: 'cd {dir} && git status',
                category: 'git',
                icon: '🔧',
                hotkey: 'Ctrl+Shift+G',
                options: { confirm: false, output: true, background: false, reload: false },
                pinned: true
            },
            {
                id: 'cmd_3',
                name: 'Find Large Files',
                description: 'Find files larger than 100MB',
                command: 'find {dir} -type f -size +100M -exec ls -lh {} \\;',
                category: 'file',
                icon: '🔍',
                hotkey: '',
                options: { confirm: false, output: true, background: true, reload: false },
                pinned: false
            },
            {
                id: 'cmd_4',
                name: 'Count Lines',
                description: 'Count lines in selected files',
                command: 'wc -l {files}',
                category: 'development',
                icon: '📊',
                hotkey: '',
                options: { confirm: false, output: true, background: false, reload: false },
                pinned: false
            },
            {
                id: 'cmd_5',
                name: 'Make Executable',
                description: 'Make selected files executable',
                command: 'chmod +x {files}',
                category: 'system',
                icon: '⚡',
                hotkey: '',
                options: { confirm: true, output: false, background: false, reload: true },
                pinned: false
            },
            {
                id: 'cmd_6',
                name: 'Archive Files',
                description: 'Create tar.gz archive of selected files',
                command: 'tar czf {input:Archive name?}.tar.gz {files}',
                category: 'file',
                icon: '📦',
                hotkey: '',
                options: { confirm: false, output: true, background: false, reload: true },
                pinned: false
            },
            {
                id: 'cmd_7',
                name: 'Docker PS',
                description: 'List running Docker containers',
                command: 'docker ps',
                category: 'development',
                icon: '🚀',
                hotkey: '',
                options: { confirm: false, output: true, background: false, reload: false },
                pinned: false
            },
            {
                id: 'cmd_8',
                name: 'System Info',
                description: 'Display system information',
                command: 'uname -a && df -h && free -h',
                category: 'system',
                icon: '💻',
                hotkey: '',
                options: { confirm: false, output: true, background: false, reload: false },
                pinned: false
            }
        ];
    }

    loadCommands() {
        const saved = localStorage.getItem('jacommander_commands');
        if (saved) {
            try {
                this.commands = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load commands:', e);
                this.commands = this.getDefaultCommands();
            }
        } else {
            this.commands = this.getDefaultCommands();
        }

        this.updateToolbar();
        this.registerHotkeys();
    }

    saveCommandsToStorage() {
        localStorage.setItem('jacommander_commands', JSON.stringify(this.commands));
        this.updateToolbar();
        this.registerHotkeys();
    }

    togglePalette() {
        if (this.palette.classList.contains('show')) {
            this.hidePalette();
        } else {
            this.showPalette();
        }
    }

    showPalette() {
        this.initializeVariables();
        this.palette.classList.add('show');
        this.palette.querySelector('#command-input').value = '';
        this.palette.querySelector('#command-input').focus();
        this.renderCommands();
    }

    hidePalette() {
        this.palette.classList.remove('show');
        this.hideOutput();
    }

    renderCommands(filter = '') {
        const container = this.palette.querySelector('#command-suggestions');
        container.innerHTML = '';

        let filtered = this.commands;
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            filtered = this.commands.filter(
                (cmd) =>
                    cmd.name.toLowerCase().includes(lowerFilter) ||
                    cmd.description.toLowerCase().includes(lowerFilter) ||
                    cmd.command.toLowerCase().includes(lowerFilter) ||
                    cmd.category.toLowerCase().includes(lowerFilter)
            );
        }

        // Group by category
        const groups = {};
        filtered.forEach((cmd) => {
            if (!groups[cmd.category]) {
                groups[cmd.category] = [];
            }
            groups[cmd.category].push(cmd);
        });

        // Render groups
        Object.entries(groups).forEach(([category, commands]) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'command-group';

            const title = document.createElement('div');
            title.className = 'command-group-title';
            title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            title.style.cssText =
                'font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin: 10px 0 5px 0;';
            groupDiv.appendChild(title);

            commands.forEach((cmd, index) => {
                const item = document.createElement('div');
                item.className = 'command-item';
                if (index === 0 && category === Object.keys(groups)[0]) {
                    item.classList.add('selected');
                }
                item.dataset.commandId = cmd.id;

                item.innerHTML = `
                    <span class="command-icon">${cmd.icon}</span>
                    <div class="command-info">
                        <div class="command-name">${cmd.name}</div>
                        <div class="command-desc">${cmd.description}</div>
                    </div>
                    ${cmd.hotkey ? `<span class="command-hotkey">${cmd.hotkey}</span>` : ''}
                `;

                item.addEventListener('click', () => {
                    this.executeCommand(cmd);
                });

                groupDiv.appendChild(item);
            });

            container.appendChild(groupDiv);
        });
    }

    filterCommands(query) {
        this.renderCommands(query);
    }

    selectNext() {
        const items = this.palette.querySelectorAll('.command-item');
        const current = this.palette.querySelector('.command-item.selected');
        const currentIndex = Array.from(items).indexOf(current);

        if (currentIndex < items.length - 1) {
            current?.classList.remove('selected');
            items[currentIndex + 1].classList.add('selected');
            items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
        }
    }

    selectPrevious() {
        const items = this.palette.querySelectorAll('.command-item');
        const current = this.palette.querySelector('.command-item.selected');
        const currentIndex = Array.from(items).indexOf(current);

        if (currentIndex > 0) {
            current?.classList.remove('selected');
            items[currentIndex - 1].classList.add('selected');
            items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
        }
    }

    executeSelected() {
        const selected = this.palette.querySelector('.command-item.selected');
        if (selected) {
            const commandId = selected.dataset.commandId;
            const command = this.commands.find((cmd) => cmd.id === commandId);
            if (command) {
                this.executeCommand(command);
            }
        }
    }

    async executeCommand(command) {
        if (this.executing) {return;}

        // Check for confirmation
        if (command.options.confirm) {
            if (!confirm(`Execute command: ${command.name}?`)) {
                return;
            }
        }

        this.executing = true;
        let cmd = command.command;

        // Replace variables
        cmd = await this.replaceVariables(cmd);
        if (cmd === null) {
            this.executing = false;
            return; // User cancelled
        }

        // Add to history
        this.commandHistory.push({
            command: command,
            executed: cmd,
            timestamp: Date.now()
        });

        try {
            // Execute via backend
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command: cmd,
                    background: command.options.background,
                    cwd: this.variables.dir
                })
            });

            if (!response.ok) {
                throw new Error('Command execution failed');
            }

            const result = await response.json();

            // Show output if requested
            if (command.options.output) {
                this.showOutput(result.output || result.error || 'Command executed successfully');
            } else {
                this.hidePalette();
            }

            // Reload panel if requested
            if (command.options.reload && !command.options.background) {
                const activePanel = this.app.panels[this.app.activePanel];
                if (activePanel) {
                    activePanel.refresh();
                }
            }

            // Show notification
            this.showNotification(`Command "${command.name}" executed successfully`);
        } catch (error) {
            console.error('Command execution error:', error);
            this.showOutput(`Error: ${error.message}`);
        } finally {
            this.executing = false;
        }
    }

    async replaceVariables(cmd) {
        let result = cmd;

        // Handle input variables {input:prompt?}
        const inputPattern = /\{input:([^}]+)\}/g;
        const inputs = [...result.matchAll(inputPattern)];

        for (const match of inputs) {
            const prompt = match[1];
            const value = await this.promptForInput(prompt);
            if (value === null) {return null;} // User cancelled
            result = result.replace(match[0], value);
        }

        // Replace standard variables
        result = result.replace(/\{dir\}/g, this.variables.dir || '.');
        result = result.replace(/\{file\}/g, this.variables.file || '');
        result = result.replace(/\{files\}/g, this.variables.files || '');
        result = result.replace(/\{selection\}/g, this.variables.selection || '0');

        return result;
    }

    promptForInput(prompt) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'variable-dialog';
            dialog.innerHTML = `
                <h3>${prompt}</h3>
                <input type="text" id="variable-input" autofocus>
                <div class="variable-dialog-actions">
                    <button id="variable-ok">OK</button>
                    <button id="variable-cancel">Cancel</button>
                </div>
            `;

            document.body.appendChild(dialog);

            const input = dialog.querySelector('#variable-input');
            const handleSubmit = () => {
                const value = input.value;
                document.body.removeChild(dialog);
                resolve(value);
            };

            const handleCancel = () => {
                document.body.removeChild(dialog);
                resolve(null);
            };

            dialog.querySelector('#variable-ok').addEventListener('click', handleSubmit);
            dialog.querySelector('#variable-cancel').addEventListener('click', handleCancel);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                }
            });

            input.focus();
        });
    }

    showOutput(text) {
        const outputDiv = this.palette.querySelector('#command-output');
        const outputText = this.palette.querySelector('#output-text');

        outputText.textContent = text;
        outputDiv.style.display = 'block';
    }

    hideOutput() {
        const outputDiv = this.palette.querySelector('#command-output');
        outputDiv.style.display = 'none';
    }

    showSettings() {
        this.settings.classList.add('show');
        this.renderCommandsList();
        this.renderPredefinedCommands();
    }

    hideSettings() {
        this.settings.classList.remove('show');
        this.resetCommandForm();
    }

    renderCommandsList() {
        const container = this.settings.querySelector('#commands-table');
        container.innerHTML = '';

        this.commands.forEach((cmd) => {
            const row = document.createElement('div');
            row.className = 'command-row';
            row.innerHTML = `
                <span class="command-row-icon">${cmd.icon}</span>
                <div class="command-row-info">
                    <div class="command-row-name">${cmd.name}</div>
                    <div class="command-row-cmd">${cmd.command}</div>
                </div>
                <div class="command-row-actions">
                    <button data-action="edit" data-id="${cmd.id}">Edit</button>
                    <button data-action="delete" data-id="${cmd.id}">Delete</button>
                    <button data-action="pin" data-id="${cmd.id}">${cmd.pinned ? 'Unpin' : 'Pin'}</button>
                </div>
            `;

            // Action handlers
            row.querySelector('[data-action="edit"]').addEventListener('click', () => {
                this.editCommand(cmd.id);
            });

            row.querySelector('[data-action="delete"]').addEventListener('click', () => {
                this.deleteCommand(cmd.id);
            });

            row.querySelector('[data-action="pin"]').addEventListener('click', () => {
                this.togglePin(cmd.id);
            });

            container.appendChild(row);
        });
    }

    renderPredefinedCommands() {
        const container = this.settings.querySelector('#predefined-list');
        container.innerHTML = '';

        const predefined = [
            { name: 'Node Version', desc: 'Check Node.js version', cmd: 'node --version' },
            { name: 'Python Version', desc: 'Check Python version', cmd: 'python --version' },
            { name: 'Disk Usage', desc: 'Show disk usage', cmd: 'df -h' },
            { name: 'Memory Usage', desc: 'Show memory usage', cmd: 'free -h' },
            { name: 'Network Info', desc: 'Show network interfaces', cmd: 'ip addr' },
            { name: 'Process List', desc: 'List running processes', cmd: 'ps aux | head -20' },
            { name: 'Git Log', desc: 'Show git commit history', cmd: 'git log --oneline -10' },
            { name: 'NPM List', desc: 'List installed packages', cmd: 'npm list --depth=0' }
        ];

        predefined.forEach((pre) => {
            const item = document.createElement('div');
            item.className = 'predefined-item';
            item.innerHTML = `
                <div class="predefined-name">${pre.name}</div>
                <div class="predefined-desc">${pre.desc}</div>
            `;

            item.addEventListener('click', () => {
                this.settings.querySelector('#cmd-name').value = pre.name;
                this.settings.querySelector('#cmd-description').value = pre.desc;
                this.settings.querySelector('#cmd-command').value = pre.cmd;
            });

            container.appendChild(item);
        });
    }

    saveCommand() {
        const id = this.settings.querySelector('#cmd-id').value || `cmd_${Date.now()}`;
        const name = this.settings.querySelector('#cmd-name').value;
        const description = this.settings.querySelector('#cmd-description').value;
        const command = this.settings.querySelector('#cmd-command').value;
        const category = this.settings.querySelector('#cmd-category').value;
        const hotkey = this.settings.querySelector('#cmd-hotkey').value;
        const icon = this.settings.querySelector('#cmd-icon').value;

        if (!name || !command) {
            alert('Name and command are required');
            return;
        }

        const options = {
            confirm: this.settings.querySelector('#cmd-confirm').checked,
            output: this.settings.querySelector('#cmd-output').checked,
            background: this.settings.querySelector('#cmd-background').checked,
            reload: this.settings.querySelector('#cmd-reload').checked
        };

        const cmdObj = {
            id,
            name,
            description,
            command,
            category,
            icon,
            hotkey,
            options,
            pinned: false
        };

        // Update or add
        const existingIndex = this.commands.findIndex((cmd) => cmd.id === id);
        if (existingIndex >= 0) {
            cmdObj.pinned = this.commands[existingIndex].pinned;
            this.commands[existingIndex] = cmdObj;
        } else {
            this.commands.push(cmdObj);
        }

        this.saveCommandsToStorage();
        this.renderCommandsList();
        this.resetCommandForm();
        this.showNotification('Command saved successfully');
    }

    editCommand(id) {
        const cmd = this.commands.find((c) => c.id === id);
        if (!cmd) {return;}

        this.settings.querySelector('#cmd-id').value = cmd.id;
        this.settings.querySelector('#cmd-name').value = cmd.name;
        this.settings.querySelector('#cmd-description').value = cmd.description;
        this.settings.querySelector('#cmd-command').value = cmd.command;
        this.settings.querySelector('#cmd-category').value = cmd.category;
        this.settings.querySelector('#cmd-hotkey').value = cmd.hotkey;
        this.settings.querySelector('#cmd-icon').value = cmd.icon;
        this.settings.querySelector('#cmd-confirm').checked = cmd.options.confirm;
        this.settings.querySelector('#cmd-output').checked = cmd.options.output;
        this.settings.querySelector('#cmd-background').checked = cmd.options.background;
        this.settings.querySelector('#cmd-reload').checked = cmd.options.reload;
    }

    deleteCommand(id) {
        if (!confirm('Delete this command?')) {return;}

        this.commands = this.commands.filter((cmd) => cmd.id !== id);
        this.saveCommandsToStorage();
        this.renderCommandsList();
    }

    togglePin(id) {
        const cmd = this.commands.find((c) => c.id === id);
        if (cmd) {
            cmd.pinned = !cmd.pinned;
            this.saveCommandsToStorage();
            this.renderCommandsList();
        }
    }

    resetCommandForm() {
        this.settings.querySelector('#cmd-id').value = '';
        this.settings.querySelector('#cmd-name').value = '';
        this.settings.querySelector('#cmd-description').value = '';
        this.settings.querySelector('#cmd-command').value = '';
        this.settings.querySelector('#cmd-category').value = 'general';
        this.settings.querySelector('#cmd-hotkey').value = '';
        this.settings.querySelector('#cmd-icon').value = '⚡';
        this.settings.querySelector('#cmd-confirm').checked = false;
        this.settings.querySelector('#cmd-output').checked = true;
        this.settings.querySelector('#cmd-background').checked = false;
        this.settings.querySelector('#cmd-reload').checked = false;
    }

    async testCommand() {
        const command = this.settings.querySelector('#cmd-command').value;
        if (!command) {
            alert('Enter a command to test');
            return;
        }

        const testCmd = {
            id: 'test',
            name: 'Test Command',
            description: 'Testing command',
            command: command,
            category: 'test',
            icon: '🔬',
            hotkey: '',
            options: {
                confirm: false,
                output: true,
                background: false,
                reload: false
            },
            pinned: false
        };

        await this.executeCommand(testCmd);
    }

    updateToolbar() {
        const container = this.toolbar.querySelector('#toolbar-commands');
        container.innerHTML = '';

        const pinned = this.commands.filter((cmd) => cmd.pinned);
        pinned.forEach((cmd) => {
            const btn = document.createElement('button');
            btn.className = 'toolbar-command';
            btn.innerHTML = `
                <span class="toolbar-command-icon">${cmd.icon}</span>
                ${cmd.name}
            `;
            btn.addEventListener('click', () => {
                this.executeCommand(cmd);
            });
            container.appendChild(btn);
        });

        // Show toolbar if there are pinned commands
        if (pinned.length > 0) {
            this.toolbar.classList.add('visible');
        }
    }

    toggleToolbar() {
        this.toolbar.classList.toggle('visible');
    }

    registerHotkeys() {
        // Remove existing listeners
        if (this.hotkeyListener) {
            document.removeEventListener('keydown', this.hotkeyListener);
        }

        // Create new listener
        this.hotkeyListener = (e) => {
            const hotkey = this.getHotkeyString(e);
            const command = this.commands.find((cmd) => cmd.hotkey === hotkey);

            if (command) {
                e.preventDefault();
                this.executeCommand(command);
            }
        };

        document.addEventListener('keydown', this.hotkeyListener);
    }

    getHotkeyString(e) {
        const parts = [];
        if (e.ctrlKey) {parts.push('Ctrl');}
        if (e.altKey) {parts.push('Alt');}
        if (e.shiftKey) {parts.push('Shift');}
        if (e.metaKey) {parts.push('Meta');}

        const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        parts.push(key);

        return parts.join('+');
    }

    importCommands() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) {return;}

            try {
                const text = await file.text();
                const imported = JSON.parse(text);

                if (Array.isArray(imported)) {
                    this.commands = [...this.commands, ...imported];
                    this.saveCommandsToStorage();
                    this.renderCommandsList();
                    this.showNotification('Commands imported successfully');
                } else {
                    throw new Error('Invalid format');
                }
            } catch (error) {
                alert(`Failed to import commands: ${error.message}`);
            }
        });

        input.click();
    }

    exportCommands() {
        const data = JSON.stringify(this.commands, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commands_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    resetToDefaults() {
        if (!confirm('Reset all commands to defaults? This will delete all custom commands.')) {
            return;
        }

        this.commands = this.getDefaultCommands();
        this.saveCommandsToStorage();
        this.renderCommandsList();
        this.showNotification('Commands reset to defaults');
    }

    showNotification(message) {
        // TODO: Implement toast notification
        console.log('Notification:', message);
    }

    // Get command history
    getHistory() {
        return this.commandHistory;
    }

    // Clear command history
    clearHistory() {
        this.commandHistory = [];
    }
}

// Export for global use
window.CustomCommands = CustomCommands;
