// WebSocket Client Module for Progress Tracking
/* eslint-disable no-console */

export class WebSocketClient {
    constructor() {
        this.ws = null;
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.activeOperations = new Map();
        this.pingInterval = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/api/ws`;

                console.log('Connecting to WebSocket:', wsUrl);
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;
                    this.startPing();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.stopPing();
                    this.reconnect();
                };

                // Set up progress cancel button listener
                document.getElementById('progress-cancel').addEventListener('click', () => {
                    this.cancelCurrentOperation();
                });
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }

    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            window.app?.showNotification('Connection lost. Please refresh the page.', 'error');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect().catch((error) => {
                console.error('Reconnection failed:', error);
            });
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }

    startPing() {
        // Send ping every 30 seconds to keep connection alive
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, 30000);
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
        }
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'progress':
                    this.handleProgress(message.data);
                    break;

                case 'notification':
                    this.handleNotification(message.data);
                    break;

                case 'error':
                    this.handleError(message.error);
                    break;

                case 'pong':
                    // Pong received, connection is alive
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    handleProgress(data) {
        if (!data || !data.operation_id) {
            return;
        }

        // Store operation info
        this.activeOperations.set(data.operation_id, data);

        // Update progress UI
        const container = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const operationText = document.getElementById('progress-operation');
        const percentageText = document.getElementById('progress-percentage');
        const speedText = document.getElementById('progress-speed');
        const remainingText = document.getElementById('progress-remaining');

        // Show progress container
        container.style.display = 'block';

        // Update operation text
        operationText.textContent = data.operation || 'Processing...';

        // Update progress bar
        const percentage = data.percentage || 0;
        progressBar.style.width = `${percentage}%`;
        percentageText.textContent = `${Math.round(percentage)}%`;

        // Update speed if available
        if (data.speed) {
            const speedMB = (data.speed / (1024 * 1024)).toFixed(2);
            speedText.textContent = `${speedMB} MB/s`;
        } else {
            speedText.textContent = '';
        }

        // Update remaining time if available
        if (data.remaining) {
            const minutes = Math.floor(data.remaining / 60);
            const seconds = data.remaining % 60;
            if (minutes > 0) {
                remainingText.textContent = `${minutes}m ${seconds}s remaining`;
            } else {
                remainingText.textContent = `${seconds}s remaining`;
            }
        } else {
            remainingText.textContent = '';
        }

        // Handle completion
        if (data.status === 'completed') {
            setTimeout(() => {
                this.hideProgress();
                window.app?.showNotification(`${data.operation} completed`, 'success');
                // Refresh panels
                window.app?.panels.refreshBoth();
            }, 1000);

            // Remove from active operations
            this.activeOperations.delete(data.operation_id);
        }

        // Handle error
        if (data.status === 'error') {
            this.hideProgress();
            window.app?.showNotification(`${data.operation} failed`, 'error');

            // Remove from active operations
            this.activeOperations.delete(data.operation_id);
        }

        // Handle cancelled
        if (data.status === 'cancelled') {
            this.hideProgress();
            window.app?.showNotification(`${data.operation} cancelled`, 'info');

            // Remove from active operations
            this.activeOperations.delete(data.operation_id);
        }
    }

    handleNotification(data) {
        if (data && data.message) {
            window.app?.showNotification(data.message, 'info');
        }
    }

    handleError(error) {
        console.error('WebSocket error message:', error);
        window.app?.showNotification(error, 'error');
    }

    hideProgress() {
        const container = document.getElementById('progress-container');
        container.style.display = 'none';

        // Reset progress bar
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('progress-percentage').textContent = '0%';
        document.getElementById('progress-speed').textContent = '';
        document.getElementById('progress-remaining').textContent = '';
    }

    cancelCurrentOperation() {
        // Get the first active operation
        const operations = Array.from(this.activeOperations.values());
        if (operations.length > 0) {
            const operation = operations[0];
            this.send({
                type: 'operation',
                operation: 'cancel',
                data: {
                    operation_id: operation.operation_id
                },
                timestamp: Date.now()
            });

            // Hide progress immediately
            this.hideProgress();
        }
    }

    disconnect() {
        this.stopPing();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
