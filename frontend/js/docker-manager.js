// docker-manager.js - Docker container management for JaCommander
export class DockerManager {
    constructor(app) {
        this.app = app;
        this.containers = [];
        this.modal = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        // Add Docker management to the menu
        this.addMenuItem();
        this.bindKeyboardShortcut();
    }

    addMenuItem() {
        // Add to main menu or toolbar
        const menuButton = document.createElement('button');
        menuButton.className = 'docker-menu-btn header-btn';
        menuButton.title = 'Docker Containers (Ctrl+D)';
        menuButton.innerHTML = '🐳';
        menuButton.addEventListener('click', () => this.openDockerManager());

        // Add to header
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.insertBefore(menuButton, headerRight.firstChild);
        }
    }

    bindKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+D for Docker manager
            if (e.ctrlKey && e.altKey && e.key === 'd') {
                e.preventDefault();
                this.openDockerManager();
            }
        });
    }

    async openDockerManager() {
        // Create and show modal
        this.createModal();
        await this.loadContainers();

        // Start auto-refresh
        this.startAutoRefresh();
    }

    createModal() {
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'docker-modal modal';
        this.modal.innerHTML = `
            <div class="modal-content docker-content">
                <div class="modal-header">
                    <h2>🐳 Docker Container Manager</h2>
                    <div class="docker-controls">
                        <button class="btn-small" id="docker-refresh" title="Refresh">🔄</button>
                        <label class="auto-refresh">
                            <input type="checkbox" id="docker-auto-refresh" checked>
                            Auto-refresh
                        </label>
                        <button class="modal-close" id="docker-close">✕</button>
                    </div>
                </div>

                <div class="modal-body">
                    <div class="docker-toolbar">
                        <button class="docker-btn" id="docker-start-all">▶️ Start All</button>
                        <button class="docker-btn" id="docker-stop-all">⏹️ Stop All</button>
                        <button class="docker-btn" id="docker-remove-stopped">🗑️ Remove Stopped</button>
                        <div class="docker-filter">
                            <input type="text" id="docker-search" placeholder="Filter containers...">
                            <select id="docker-status-filter">
                                <option value="">All Status</option>
                                <option value="running">Running</option>
                                <option value="stopped">Stopped</option>
                                <option value="paused">Paused</option>
                            </select>
                        </div>
                    </div>

                    <div class="docker-containers" id="docker-container-list">
                        <div class="loading">Loading containers...</div>
                    </div>

                    <!-- Container Details Panel -->
                    <div class="container-details" id="container-details" style="display: none;">
                        <h3>Container Details</h3>
                        <div class="details-content" id="details-content"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.modal.style.display = 'flex';

        this.bindModalEvents();
    }

    bindModalEvents() {
        // Close button
        this.modal.querySelector('#docker-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Refresh button
        this.modal.querySelector('#docker-refresh').addEventListener('click', () => {
            this.loadContainers();
        });

        // Auto-refresh checkbox
        this.modal.querySelector('#docker-auto-refresh').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        // Toolbar buttons
        this.modal.querySelector('#docker-start-all').addEventListener('click', () => {
            this.startAllContainers();
        });

        this.modal.querySelector('#docker-stop-all').addEventListener('click', () => {
            this.stopAllContainers();
        });

        this.modal.querySelector('#docker-remove-stopped').addEventListener('click', () => {
            this.removeStoppedContainers();
        });

        // Filter inputs
        const searchInput = this.modal.querySelector('#docker-search');
        const statusFilter = this.modal.querySelector('#docker-status-filter');

        searchInput.addEventListener('input', () => this.filterContainers());
        statusFilter.addEventListener('change', () => this.filterContainers());

        // Close on escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    async loadContainers() {
        try {
            const response = await fetch('/api/docker/containers');
            if (response.ok) {
                this.containers = await response.json();
                this.renderContainers();
            } else {
                this.showError('Failed to load containers');
            }
        } catch (error) {
            console.error('Error loading containers:', error);
            this.showError('Docker not available or not configured');
        }
    }

    renderContainers() {
        const listElement = this.modal.querySelector('#docker-container-list');

        if (this.containers.length === 0) {
            listElement.innerHTML = `
                <div class="no-containers">
                    <p>No Docker containers found</p>
                    <small>Make sure Docker is running and accessible</small>
                </div>
            `;
            return;
        }

        listElement.innerHTML = `
            <table class="container-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Name</th>
                        <th>Image</th>
                        <th>Created</th>
                        <th>Ports</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.containers.map((container) => this.renderContainer(container)).join('')}
                </tbody>
            </table>
        `;

        // Bind container action events
        this.bindContainerEvents();
    }

    renderContainer(container) {
        const status = this.getContainerStatus(container);
        const statusIcon = this.getStatusIcon(status);
        const ports = this.formatPorts(container.Ports);

        return `
            <tr class="container-row ${status}" data-container-id="${container.Id}">
                <td class="container-status">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${status}</span>
                </td>
                <td class="container-name">
                    <strong>${container.Names[0]?.replace('/', '') || container.Id.substr(0, 12)}</strong>
                    ${
    container.Labels?.['com.docker.compose.project']
        ? `<small class="compose-project">${container.Labels['com.docker.compose.project']}</small>`
        : ''
}
                </td>
                <td class="container-image" title="${container.Image}">
                    ${container.Image.length > 30 ? `${container.Image.substr(0, 30)}...` : container.Image}
                </td>
                <td class="container-created">${this.formatTime(container.Created)}</td>
                <td class="container-ports">${ports}</td>
                <td class="container-actions">
                    ${this.renderContainerActions(container, status)}
                </td>
            </tr>
        `;
    }

    renderContainerActions(container, status) {
        const actions = [];

        if (status === 'running') {
            actions.push(`
                <button class="action-btn" data-action="stop" data-id="${container.Id}" title="Stop">⏹️</button>
                <button class="action-btn" data-action="restart" data-id="${container.Id}" title="Restart">🔄</button>
                <button class="action-btn" data-action="pause" data-id="${container.Id}" title="Pause">⏸️</button>
                <button class="action-btn" data-action="logs" data-id="${container.Id}" title="Logs">📋</button>
                <button class="action-btn" data-action="exec" data-id="${container.Id}" title="Terminal">💻</button>
            `);
        } else if (status === 'stopped') {
            actions.push(`
                <button class="action-btn" data-action="start" data-id="${container.Id}" title="Start">▶️</button>
                <button class="action-btn" data-action="remove" data-id="${container.Id}" title="Remove">🗑️</button>
                <button class="action-btn" data-action="logs" data-id="${container.Id}" title="Logs">📋</button>
            `);
        } else if (status === 'paused') {
            actions.push(`
                <button class="action-btn" data-action="unpause" data-id="${container.Id}" title="Unpause">▶️</button>
                <button class="action-btn" data-action="stop" data-id="${container.Id}" title="Stop">⏹️</button>
            `);
        }

        actions.push(`
            <button class="action-btn" data-action="inspect" data-id="${container.Id}" title="Inspect">🔍</button>
            <button class="action-btn" data-action="files" data-id="${container.Id}" title="Browse Files">📁</button>
        `);

        return actions.join('');
    }

    bindContainerEvents() {
        this.modal.querySelectorAll('.action-btn').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                const containerId = e.target.dataset.id;
                await this.handleContainerAction(action, containerId);
            });
        });

        // Container row click for details
        this.modal.querySelectorAll('.container-row').forEach((row) => {
            row.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    this.showContainerDetails(row.dataset.containerId);
                }
            });
        });
    }

    async handleContainerAction(action, containerId) {
        const container = this.containers.find((c) => c.Id === containerId);
        const containerName = container?.Names[0]?.replace('/', '') || containerId.substr(0, 12);

        switch (action) {
            case 'start':
                await this.startContainer(containerId);
                this.app.showNotification(`Starting ${containerName}...`, 'info');
                break;
            case 'stop':
                await this.stopContainer(containerId);
                this.app.showNotification(`Stopping ${containerName}...`, 'info');
                break;
            case 'restart':
                await this.restartContainer(containerId);
                this.app.showNotification(`Restarting ${containerName}...`, 'info');
                break;
            case 'pause':
                await this.pauseContainer(containerId);
                break;
            case 'unpause':
                await this.unpauseContainer(containerId);
                break;
            case 'remove': {
                const confirmed = await this.app.confirmAction({
                    title: 'Remove Container',
                    message: `Remove container ${containerName}?`,
                    confirmText: 'Remove',
                    cancelText: 'Cancel',
                    dangerAction: true
                });
                if (confirmed) {
                    await this.removeContainer(containerId);
                }
                break;
            }
            case 'logs':
                this.showContainerLogs(containerId);
                break;
            case 'exec':
                this.openContainerTerminal(containerId);
                break;
            case 'inspect':
                this.inspectContainer(containerId);
                break;
            case 'files':
                this.browseContainerFiles(containerId);
                break;
        }

        // Refresh container list
        setTimeout(() => this.loadContainers(), 1000);
    }

    async startContainer(containerId) {
        await fetch(`/api/docker/containers/${containerId}/start`, { method: 'POST' });
    }

    async stopContainer(containerId) {
        await fetch(`/api/docker/containers/${containerId}/stop`, { method: 'POST' });
    }

    async restartContainer(containerId) {
        await fetch(`/api/docker/containers/${containerId}/restart`, { method: 'POST' });
    }

    async pauseContainer(containerId) {
        await fetch(`/api/docker/containers/${containerId}/pause`, { method: 'POST' });
    }

    async unpauseContainer(containerId) {
        await fetch(`/api/docker/containers/${containerId}/unpause`, { method: 'POST' });
    }

    async removeContainer(containerId) {
        await fetch(`/api/docker/containers/${containerId}`, { method: 'DELETE' });
    }

    async showContainerLogs(containerId) {
        const container = this.containers.find((c) => c.Id === containerId);
        const containerName = container?.Names[0]?.replace('/', '') || containerId.substr(0, 12);

        const logsModal = document.createElement('div');
        logsModal.className = 'logs-modal modal';
        logsModal.innerHTML = `
            <div class="modal-content logs-content">
                <div class="modal-header">
                    <h3>📋 Logs: ${containerName}</h3>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="logs-options">
                        <label>
                            <input type="checkbox" id="logs-follow" checked>
                            Follow logs
                        </label>
                        <label>
                            Lines: <input type="number" id="logs-lines" value="100" min="10" max="1000">
                        </label>
                        <button id="logs-clear">Clear</button>
                    </div>
                    <pre class="logs-output" id="logs-output">Loading logs...</pre>
                </div>
            </div>
        `;

        document.body.appendChild(logsModal);
        logsModal.style.display = 'flex';

        // Load logs
        const response = await fetch(`/api/docker/containers/${containerId}/logs?tail=100`);
        if (response.ok) {
            const logs = await response.text();
            logsModal.querySelector('#logs-output').textContent = logs;
        }

        // Close button
        logsModal.querySelector('.modal-close').addEventListener('click', () => {
            logsModal.remove();
        });
    }

    openContainerTerminal(containerId) {
        const container = this.containers.find((c) => c.Id === containerId);
        const containerName = container?.Names[0]?.replace('/', '') || containerId.substr(0, 12);

        // Open terminal with docker exec
        if (this.app.terminal) {
            this.app.terminal.show();
            this.app.terminal.executeCommand(`docker exec -it ${containerName} /bin/bash`);
        } else {
            this.app.showNotification('Terminal not available', 'warning');
        }
    }

    async inspectContainer(containerId) {
        const response = await fetch(`/api/docker/containers/${containerId}/inspect`);
        if (response.ok) {
            const data = await response.json();
            this.showInspectModal(data);
        }
    }

    showInspectModal(data) {
        const modal = document.createElement('div');
        modal.className = 'inspect-modal modal';
        modal.innerHTML = `
            <div class="modal-content inspect-content">
                <div class="modal-header">
                    <h3>🔍 Container Inspection</h3>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <pre class="inspect-data">${JSON.stringify(data, null, 2)}</pre>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
    }

    browseContainerFiles(containerId) {
        const container = this.containers.find((c) => c.Id === containerId);
        const containerName = container?.Names[0]?.replace('/', '') || containerId.substr(0, 12);

        // Add container as a storage backend
        this.app.storageManager?.addTemporaryStorage({
            id: `docker-${containerId}`,
            type: 'docker',
            displayName: `🐳 ${containerName}`,
            config: {
                containerId: containerId
            }
        });

        this.app.showNotification(`Added ${containerName} to storage`, 'success');
        this.closeModal();
    }

    showContainerDetails(containerId) {
        const container = this.containers.find((c) => c.Id === containerId);
        if (!container) {
            return;
        }

        const detailsPanel = this.modal.querySelector('#container-details');
        const detailsContent = this.modal.querySelector('#details-content');

        detailsContent.innerHTML = `
            <h4>${container.Names[0]?.replace('/', '') || container.Id.substr(0, 12)}</h4>
            <dl>
                <dt>ID:</dt>
                <dd>${container.Id.substr(0, 12)}</dd>

                <dt>Image:</dt>
                <dd>${container.Image}</dd>

                <dt>Command:</dt>
                <dd>${container.Command}</dd>

                <dt>Created:</dt>
                <dd>${new Date(container.Created * 1000).toLocaleString()}</dd>

                <dt>Status:</dt>
                <dd>${container.Status}</dd>

                <dt>State:</dt>
                <dd>${container.State}</dd>

                <dt>Ports:</dt>
                <dd>${this.formatPorts(container.Ports) || 'None'}</dd>

                <dt>Networks:</dt>
                <dd>${Object.keys(container.NetworkSettings?.Networks || {}).join(', ') || 'None'}</dd>

                <dt>Mounts:</dt>
                <dd>${
    container.Mounts?.length
        ? container.Mounts.map((m) => `${m.Source} → ${m.Destination}`).join('<br>')
        : 'None'
}</dd>
            </dl>
        `;

        detailsPanel.style.display = 'block';
    }

    filterContainers() {
        const searchTerm = this.modal.querySelector('#docker-search').value.toLowerCase();
        const statusFilter = this.modal.querySelector('#docker-status-filter').value;

        const rows = this.modal.querySelectorAll('.container-row');
        rows.forEach((row) => {
            const name = row.querySelector('.container-name').textContent.toLowerCase();
            const image = row.querySelector('.container-image').textContent.toLowerCase();
            const status = row.classList.contains('running')
                ? 'running'
                : row.classList.contains('stopped')
                    ? 'stopped'
                    : row.classList.contains('paused')
                        ? 'paused'
                        : '';

            const matchesSearch = !searchTerm || name.includes(searchTerm) || image.includes(searchTerm);
            const matchesStatus = !statusFilter || status === statusFilter;

            row.style.display = matchesSearch && matchesStatus ? '' : 'none';
        });
    }

    async startAllContainers() {
        const stopped = this.containers.filter((c) => c.State === 'exited');
        for (const container of stopped) {
            await this.startContainer(container.Id);
        }
        this.app.showNotification(`Starting ${stopped.length} containers...`, 'info');
        setTimeout(() => this.loadContainers(), 2000);
    }

    async stopAllContainers() {
        const running = this.containers.filter((c) => c.State === 'running');
        for (const container of running) {
            await this.stopContainer(container.Id);
        }
        this.app.showNotification(`Stopping ${running.length} containers...`, 'info');
        setTimeout(() => this.loadContainers(), 2000);
    }

    async removeStoppedContainers() {
        const stopped = this.containers.filter((c) => c.State === 'exited');
        const confirmed = await this.app.confirmAction({
            title: 'Remove Stopped Containers',
            message: `Remove ${stopped.length} stopped containers?`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            dangerAction: true
        });

        if (confirmed) {
            for (const container of stopped) {
                await this.removeContainer(container.Id);
            }
            this.app.showNotification(`Removed ${stopped.length} containers`, 'success');
            setTimeout(() => this.loadContainers(), 1000);
        }
    }

    getContainerStatus(container) {
        if (container.State === 'running') {
            return 'running';
        }
        if (container.State === 'paused') {
            return 'paused';
        }
        return 'stopped';
    }

    getStatusIcon(status) {
        switch (status) {
            case 'running':
                return '🟢';
            case 'stopped':
                return '🔴';
            case 'paused':
                return '🟡';
            default:
                return '⚪';
        }
    }

    formatPorts(ports) {
        if (!ports || ports.length === 0) {
            return '-';
        }
        return ports
            .map((p) => {
                if (p.PublicPort) {
                    return `${p.PublicPort}→${p.PrivatePort}`;
                }
                return `${p.PrivatePort}`;
            })
            .join(', ');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'Just now';
        }
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}m ago`;
        }
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}h ago`;
        }
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    showError(message) {
        const listElement = this.modal.querySelector('#docker-container-list');
        listElement.innerHTML = `
            <div class="docker-error">
                <p>⚠️ ${message}</p>
                <small>Make sure Docker is installed and running</small>
            </div>
        `;
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            return;
        }

        this.refreshInterval = setInterval(() => {
            this.loadContainers();
        }, 5000); // Refresh every 5 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    closeModal() {
        this.stopAutoRefresh();
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

// CSS for Docker manager
export const dockerManagerStyles = `
    .docker-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .docker-content {
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        background: var(--panel-bg);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .docker-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .auto-refresh {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
    }

    .docker-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--hover-bg);
        border-radius: 4px;
        margin-bottom: 16px;
    }

    .docker-btn {
        padding: 6px 12px;
        background: var(--button-bg);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .docker-btn:hover {
        background: var(--primary-color);
        color: white;
    }

    .docker-filter {
        display: flex;
        gap: 8px;
    }

    .docker-filter input,
    .docker-filter select {
        padding: 6px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--input-bg);
        color: var(--text-primary);
    }

    .docker-containers {
        flex: 1;
        overflow-y: auto;
        padding: 0 12px;
    }

    .container-table {
        width: 100%;
        border-collapse: collapse;
    }

    .container-table th {
        text-align: left;
        padding: 8px;
        border-bottom: 2px solid var(--border-color);
        font-weight: 600;
    }

    .container-table td {
        padding: 8px;
        border-bottom: 1px solid var(--border-light);
    }

    .container-row {
        cursor: pointer;
        transition: background 0.2s;
    }

    .container-row:hover {
        background: var(--hover-bg);
    }

    .container-row.running .status-text {
        color: var(--success-color);
    }

    .container-row.stopped .status-text {
        color: var(--danger-color);
    }

    .container-row.paused .status-text {
        color: var(--warning-color);
    }

    .compose-project {
        display: block;
        color: var(--text-secondary);
        font-size: 11px;
    }

    .container-actions {
        display: flex;
        gap: 4px;
    }

    .action-btn {
        padding: 4px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 16px;
        transition: transform 0.2s;
    }

    .action-btn:hover {
        transform: scale(1.2);
    }

    .container-details {
        margin-top: 20px;
        padding: 16px;
        background: var(--hover-bg);
        border-radius: 4px;
    }

    .container-details dl {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 8px;
        margin: 0;
    }

    .container-details dt {
        font-weight: 600;
    }

    .container-details dd {
        margin: 0;
        word-break: break-all;
    }

    .logs-content,
    .inspect-content {
        width: 80%;
        max-width: 900px;
    }

    .logs-output,
    .inspect-data {
        background: #1e1e1e;
        color: #cccccc;
        padding: 12px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
        max-height: 400px;
        overflow: auto;
        white-space: pre-wrap;
    }

    .logs-options {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
    }

    .docker-error,
    .no-containers {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
    }

    .docker-menu-btn {
        font-size: 20px;
    }
`;

export default DockerManager;
