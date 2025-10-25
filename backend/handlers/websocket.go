package handlers

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Message types for WebSocket communication
const (
	MessageTypeProgress     = "progress"
	MessageTypeOperation    = "operation"
	MessageTypeNotification = "notification"
	MessageTypeError        = "error"
	MessageTypePing         = "ping"
	MessageTypePong         = "pong"
)

// WebSocketMessage represents a message sent via WebSocket
type WebSocketMessage struct {
	Type      string      `json:"type"`
	ID        string      `json:"id,omitempty"`
	Operation string      `json:"operation,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// ProgressData represents progress information
type ProgressData struct {
	OperationID string  `json:"operation_id"`
	Operation   string  `json:"operation"`
	Current     int64   `json:"current"`
	Total       int64   `json:"total"`
	Percentage  float64 `json:"percentage"`
	Speed       int64   `json:"speed,omitempty"`     // bytes per second
	Remaining   int64   `json:"remaining,omitempty"` // seconds
	File        string  `json:"file,omitempty"`
	Status      string  `json:"status"` // "running", "completed", "error", "cancelled"
}

// Client represents a connected WebSocket client
type Client struct {
	conn *websocket.Conn
	send chan WebSocketMessage
	hub  *Hub
	id   string
	mu   sync.Mutex
}

// Hub maintains the set of active clients
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan WebSocketMessage
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub *Hub
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler() *WebSocketHandler {
	hub := &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan WebSocketMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}

	// Start the hub
	go hub.run()

	return &WebSocketHandler{
		hub: hub,
	}
}

// Handle handles WebSocket connections
func (wsh *WebSocketHandler) Handle(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket connection: %v", err)
		return
	}

	client := &Client{
		conn: conn,
		send: make(chan WebSocketMessage, 256),
		hub:  wsh.hub,
		id:   generateClientID(),
	}

	// Register the client
	client.hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()

	// Send initial connection success message
	client.send <- WebSocketMessage{
		Type:      MessageTypeNotification,
		Data:      map[string]string{"message": "Connected to JaCommander WebSocket"},
		Timestamp: time.Now().Unix(),
	}
}

// SendProgress sends progress update to all connected clients
func (wsh *WebSocketHandler) SendProgress(progress ProgressData) {
	message := WebSocketMessage{
		Type:      MessageTypeProgress,
		Data:      progress,
		Timestamp: time.Now().Unix(),
	}
	wsh.hub.broadcast <- message
}

// SendNotification sends a notification to all connected clients
func (wsh *WebSocketHandler) SendNotification(notification string) {
	message := WebSocketMessage{
		Type:      MessageTypeNotification,
		Data:      map[string]string{"message": notification},
		Timestamp: time.Now().Unix(),
	}
	wsh.hub.broadcast <- message
}

// SendError sends an error message to all connected clients
func (wsh *WebSocketHandler) SendError(err string) {
	message := WebSocketMessage{
		Type:      MessageTypeError,
		Error:     err,
		Timestamp: time.Now().Unix(),
	}
	wsh.hub.broadcast <- message
}

// run starts the hub's main event loop
func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("Client connected: %s", client.id)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				h.mu.Unlock()
				log.Printf("Client disconnected: %s", client.id)
			} else {
				h.mu.Unlock()
			}

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					// Client's send channel is full, close it
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// readPump pumps messages from the websocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	// Set read deadline and pong handler
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var message WebSocketMessage
		err := c.conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle different message types
		switch message.Type {
		case MessageTypePing:
			// Respond with pong
			c.send <- WebSocketMessage{
				Type:      MessageTypePong,
				Timestamp: time.Now().Unix(),
			}

		case MessageTypeOperation:
			// Handle operation requests (e.g., cancel operation)
			c.handleOperation(message)

		default:
			log.Printf("Unknown message type from client %s: %s", c.id, message.Type)
		}
	}
}

// writePump pumps messages from the hub to the websocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// The hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleOperation handles operation requests from the client
func (c *Client) handleOperation(message WebSocketMessage) {
	switch message.Operation {
	case "cancel":
		// Handle cancel operation
		if id, ok := message.Data.(map[string]interface{})["operation_id"].(string); ok {
			// TODO: Implement operation cancellation
			log.Printf("Client %s requested to cancel operation: %s", c.id, id)
		}

	default:
		log.Printf("Unknown operation from client %s: %s", c.id, message.Operation)
	}
}

// generateClientID generates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString generates a random string of given length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

// ProgressTracker helps track and report progress for operations
type ProgressTracker struct {
	operationID string
	operation   string
	total       int64
	current     int64
	startTime   time.Time
	lastUpdate  time.Time
	handler     *WebSocketHandler
	mu          sync.Mutex
}

// NewProgressTracker creates a new progress tracker
func NewProgressTracker(handler *WebSocketHandler, operationID, operation string, total int64) *ProgressTracker {
	return &ProgressTracker{
		operationID: operationID,
		operation:   operation,
		total:       total,
		handler:     handler,
		startTime:   time.Now(),
		lastUpdate:  time.Now(),
	}
}

// Update updates the progress and sends an update if needed
func (pt *ProgressTracker) Update(current int64) {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	pt.current = current

	// Only send updates every 100ms to avoid flooding
	if time.Since(pt.lastUpdate) < 100*time.Millisecond && current < pt.total {
		return
	}

	pt.lastUpdate = time.Now()

	// Calculate percentage
	percentage := float64(0)
	if pt.total > 0 {
		percentage = float64(current) / float64(pt.total) * 100
	}

	// Calculate speed
	elapsed := time.Since(pt.startTime).Seconds()
	speed := int64(0)
	if elapsed > 0 {
		speed = int64(float64(current) / elapsed)
	}

	// Calculate remaining time
	remaining := int64(0)
	if speed > 0 && pt.total > current {
		remaining = int64(float64(pt.total-current) / float64(speed))
	}

	// Send progress update
	progress := ProgressData{
		OperationID: pt.operationID,
		Operation:   pt.operation,
		Current:     current,
		Total:       pt.total,
		Percentage:  percentage,
		Speed:       speed,
		Remaining:   remaining,
		Status:      "running",
	}

	if current >= pt.total {
		progress.Status = "completed"
		progress.Percentage = 100
	}

	pt.handler.SendProgress(progress)
}

// Complete marks the operation as completed
func (pt *ProgressTracker) Complete() {
	pt.Update(pt.total)
}

// Error marks the operation as errored
func (pt *ProgressTracker) Error(err error) {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	progress := ProgressData{
		OperationID: pt.operationID,
		Operation:   pt.operation,
		Current:     pt.current,
		Total:       pt.total,
		Percentage:  float64(pt.current) / float64(pt.total) * 100,
		Status:      "error",
	}

	pt.handler.SendProgress(progress)
	pt.handler.SendError(err.Error())
}
