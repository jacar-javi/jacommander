package tests

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "testing"
    "time"

    "github.com/gorilla/mux"
    "github.com/gorilla/websocket"
)

// TestServer represents a test server instance
type TestServer struct {
    Server *httptest.Server
    Router *mux.Router
    TempDir string
}

// NewTestServer creates a new test server
func NewTestServer(t *testing.T) *TestServer {
    tempDir, err := os.MkdirTemp("", "integration_test")
    if err != nil {
        t.Fatalf("Failed to create temp dir: %v", err)
    }

    router := mux.NewRouter()

    // Setup routes (simplified for testing)
    setupRoutes(router, tempDir)

    server := httptest.NewServer(router)

    return &TestServer{
        Server:  server,
        Router:  router,
        TempDir: tempDir,
    }
}

// Cleanup removes test resources
func (ts *TestServer) Cleanup() {
    ts.Server.Close()
    os.RemoveAll(ts.TempDir)
}

// TestFileListingIntegration tests the complete file listing flow
func TestFileListingIntegration(t *testing.T) {
    ts := NewTestServer(t)
    defer ts.Cleanup()

    // Create test files
    testFiles := []string{"file1.txt", "file2.log", "file3.md"}
    for _, file := range testFiles {
        path := filepath.Join(ts.TempDir, file)
        if err := os.WriteFile(path, []byte("test content"), 0644); err != nil {
            t.Fatalf("Failed to create test file: %v", err)
        }
    }

    // Create test directory
    if err := os.Mkdir(filepath.Join(ts.TempDir, "subdir"), 0755); err != nil {
        t.Fatalf("Failed to create test directory: %v", err)
    }

    // Make request to list files
    resp, err := http.Get(fmt.Sprintf("%s/api/files?path=/", ts.Server.URL))
    if err != nil {
        t.Fatalf("Failed to make request: %v", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        t.Errorf("Expected status 200, got %d", resp.StatusCode)
    }

    // Parse response
    var files []map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&files); err != nil {
        t.Fatalf("Failed to decode response: %v", err)
    }

    // Verify response contains expected files
    if len(files) != 4 { // 3 files + 1 directory
        t.Errorf("Expected 4 items, got %d", len(files))
    }

    // Check for specific file
    found := false
    for _, file := range files {
        if file["name"] == "file1.txt" {
            found = true
            break
        }
    }
    if !found {
        t.Error("Expected file1.txt in response")
    }
}

// TestFileUploadDownloadIntegration tests upload and download flow
func TestFileUploadDownloadIntegration(t *testing.T) {
    ts := NewTestServer(t)
    defer ts.Cleanup()

    // Prepare file upload
    var b bytes.Buffer
    w := multipart.NewWriter(&b)

    fw, err := w.CreateFormFile("file", "upload.txt")
    if err != nil {
        t.Fatalf("Failed to create form file: %v", err)
    }

    testContent := []byte("uploaded test content")
    if _, err := fw.Write(testContent); err != nil {
        t.Fatalf("Failed to write form file: %v", err)
    }

    if err := w.WriteField("path", "/"); err != nil {
        t.Fatalf("Failed to write path field: %v", err)
    }

    w.Close()

    // Upload file
    uploadResp, err := http.Post(
        fmt.Sprintf("%s/api/upload", ts.Server.URL),
        w.FormDataContentType(),
        &b,
    )
    if err != nil {
        t.Fatalf("Failed to upload file: %v", err)
    }
    defer uploadResp.Body.Close()

    if uploadResp.StatusCode != http.StatusOK {
        t.Errorf("Upload failed with status %d", uploadResp.StatusCode)
    }

    // Download the uploaded file
    downloadResp, err := http.Get(
        fmt.Sprintf("%s/api/file?path=/upload.txt", ts.Server.URL),
    )
    if err != nil {
        t.Fatalf("Failed to download file: %v", err)
    }
    defer downloadResp.Body.Close()

    if downloadResp.StatusCode != http.StatusOK {
        t.Errorf("Download failed with status %d", downloadResp.StatusCode)
    }

    // Verify downloaded content
    downloadedContent, err := io.ReadAll(downloadResp.Body)
    if err != nil {
        t.Fatalf("Failed to read downloaded content: %v", err)
    }

    if !bytes.Equal(downloadedContent, testContent) {
        t.Errorf("Downloaded content mismatch. Expected %s, got %s",
            testContent, downloadedContent)
    }
}

// TestFileOperationsIntegration tests copy, move, and delete operations
func TestFileOperationsIntegration(t *testing.T) {
    ts := NewTestServer(t)
    defer ts.Cleanup()

    // Create initial file
    originalPath := filepath.Join(ts.TempDir, "original.txt")
    testContent := []byte("original content")
    if err := os.WriteFile(originalPath, testContent, 0644); err != nil {
        t.Fatalf("Failed to create test file: %v", err)
    }

    // Test Copy
    t.Run("Copy operation", func(t *testing.T) {
        copyReq := map[string]string{
            "source":      "/original.txt",
            "destination": "/copy.txt",
        }

        body, _ := json.Marshal(copyReq)
        resp, err := http.Post(
            fmt.Sprintf("%s/api/copy", ts.Server.URL),
            "application/json",
            bytes.NewReader(body),
        )
        if err != nil {
            t.Fatalf("Copy request failed: %v", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
            t.Errorf("Copy failed with status %d", resp.StatusCode)
        }

        // Verify both files exist
        if _, err := os.Stat(originalPath); os.IsNotExist(err) {
            t.Error("Original file was deleted after copy")
        }

        copyPath := filepath.Join(ts.TempDir, "copy.txt")
        if _, err := os.Stat(copyPath); os.IsNotExist(err) {
            t.Error("Copy was not created")
        }
    })

    // Test Move
    t.Run("Move operation", func(t *testing.T) {
        moveReq := map[string]string{
            "source":      "/copy.txt",
            "destination": "/moved.txt",
        }

        body, _ := json.Marshal(moveReq)
        resp, err := http.Post(
            fmt.Sprintf("%s/api/move", ts.Server.URL),
            "application/json",
            bytes.NewReader(body),
        )
        if err != nil {
            t.Fatalf("Move request failed: %v", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
            t.Errorf("Move failed with status %d", resp.StatusCode)
        }

        // Verify old file doesn't exist
        copyPath := filepath.Join(ts.TempDir, "copy.txt")
        if _, err := os.Stat(copyPath); !os.IsNotExist(err) {
            t.Error("Source file still exists after move")
        }

        // Verify new file exists
        movedPath := filepath.Join(ts.TempDir, "moved.txt")
        if _, err := os.Stat(movedPath); os.IsNotExist(err) {
            t.Error("Moved file was not created")
        }
    })

    // Test Delete
    t.Run("Delete operation", func(t *testing.T) {
        deleteReq := map[string]string{
            "path": "/moved.txt",
        }

        body, _ := json.Marshal(deleteReq)
        req, _ := http.NewRequest("DELETE",
            fmt.Sprintf("%s/api/file", ts.Server.URL),
            bytes.NewReader(body),
        )
        req.Header.Set("Content-Type", "application/json")

        client := &http.Client{}
        resp, err := client.Do(req)
        if err != nil {
            t.Fatalf("Delete request failed: %v", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
            t.Errorf("Delete failed with status %d", resp.StatusCode)
        }

        // Verify file was deleted
        movedPath := filepath.Join(ts.TempDir, "moved.txt")
        if _, err := os.Stat(movedPath); !os.IsNotExist(err) {
            t.Error("File was not deleted")
        }
    })
}

// TestDirectoryOperationsIntegration tests directory creation and navigation
func TestDirectoryOperationsIntegration(t *testing.T) {
    ts := NewTestServer(t)
    defer ts.Cleanup()

    // Create directory
    createReq := map[string]string{
        "path": "/newdir",
    }

    body, _ := json.Marshal(createReq)
    resp, err := http.Post(
        fmt.Sprintf("%s/api/directory", ts.Server.URL),
        "application/json",
        bytes.NewReader(body),
    )
    if err != nil {
        t.Fatalf("Create directory request failed: %v", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        t.Errorf("Create directory failed with status %d", resp.StatusCode)
    }

    // Verify directory was created
    dirPath := filepath.Join(ts.TempDir, "newdir")
    info, err := os.Stat(dirPath)
    if os.IsNotExist(err) {
        t.Fatal("Directory was not created")
    }

    if !info.IsDir() {
        t.Error("Created path is not a directory")
    }

    // Create file in directory
    filePath := filepath.Join(dirPath, "file.txt")
    if err := os.WriteFile(filePath, []byte("content"), 0644); err != nil {
        t.Fatalf("Failed to create file in directory: %v", err)
    }

    // List directory contents
    listResp, err := http.Get(
        fmt.Sprintf("%s/api/files?path=/newdir", ts.Server.URL),
    )
    if err != nil {
        t.Fatalf("List directory request failed: %v", err)
    }
    defer listResp.Body.Close()

    if listResp.StatusCode != http.StatusOK {
        t.Errorf("List directory failed with status %d", listResp.StatusCode)
    }

    var files []map[string]interface{}
    if err := json.NewDecoder(listResp.Body).Decode(&files); err != nil {
        t.Fatalf("Failed to decode directory listing: %v", err)
    }

    if len(files) != 1 {
        t.Errorf("Expected 1 file in directory, got %d", len(files))
    }
}

// TestSearchIntegration tests search functionality
func TestSearchIntegration(t *testing.T) {
    ts := NewTestServer(t)
    defer ts.Cleanup()

    // Create test files with different content
    testFiles := map[string]string{
        "match1.txt":        "hello world",
        "match2.txt":        "hello universe",
        "nomatch.txt":       "goodbye",
        "subdir/match3.txt": "hello again",
    }

    os.Mkdir(filepath.Join(ts.TempDir, "subdir"), 0755)

    for path, content := range testFiles {
        fullPath := filepath.Join(ts.TempDir, path)
        if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
            t.Fatalf("Failed to create test file %s: %v", path, err)
        }
    }

    // Search by content
    t.Run("Search by content", func(t *testing.T) {
        resp, err := http.Get(
            fmt.Sprintf("%s/api/search?content=hello", ts.Server.URL),
        )
        if err != nil {
            t.Fatalf("Search request failed: %v", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
            t.Errorf("Search failed with status %d", resp.StatusCode)
        }

        var results []map[string]interface{}
        if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
            t.Fatalf("Failed to decode search results: %v", err)
        }

        if len(results) != 3 { // Should find 3 files with "hello"
            t.Errorf("Expected 3 search results, got %d", len(results))
        }
    })

    // Search by pattern
    t.Run("Search by pattern", func(t *testing.T) {
        resp, err := http.Get(
            fmt.Sprintf("%s/api/search?pattern=match*.txt", ts.Server.URL),
        )
        if err != nil {
            t.Fatalf("Search request failed: %v", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
            t.Errorf("Search failed with status %d", resp.StatusCode)
        }

        var results []map[string]interface{}
        if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
            t.Fatalf("Failed to decode search results: %v", err)
        }

        if len(results) < 2 { // Should find at least match1.txt and match2.txt
            t.Errorf("Expected at least 2 search results, got %d", len(results))
        }
    })
}

// TestWebSocketIntegration tests WebSocket connection and progress updates
func TestWebSocketIntegration(t *testing.T) {
    ts := NewTestServer(t)
    defer ts.Cleanup()

    // Convert HTTP URL to WebSocket URL
    wsURL := "ws" + ts.Server.URL[4:] + "/ws"

    // Connect to WebSocket
    ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
    if err != nil {
        t.Fatalf("Failed to connect to WebSocket: %v", err)
    }
    defer ws.Close()

    // Send a test message
    testMsg := map[string]string{
        "type": "ping",
    }

    if err := ws.WriteJSON(testMsg); err != nil {
        t.Fatalf("Failed to send WebSocket message: %v", err)
    }

    // Read response with timeout
    done := make(chan struct{})
    go func() {
        defer close(done)

        ws.SetReadDeadline(time.Now().Add(5 * time.Second))

        var response map[string]interface{}
        err := ws.ReadJSON(&response)
        if err != nil {
            t.Errorf("Failed to read WebSocket response: %v", err)
            return
        }

        if response["type"] != "pong" {
            t.Errorf("Expected pong response, got %v", response["type"])
        }
    }()

    select {
    case <-done:
        // Test completed
    case <-time.After(10 * time.Second):
        t.Fatal("WebSocket test timed out")
    }
}

// TestCompressionIntegration tests file compression and extraction
func TestCompressionIntegration(t *testing.T) {
    ts := NewTestServer(t)
    defer ts.Cleanup()

    // Create test files to compress
    files := []string{"file1.txt", "file2.txt", "file3.txt"}
    for _, file := range files {
        path := filepath.Join(ts.TempDir, file)
        content := fmt.Sprintf("Content of %s", file)
        if err := os.WriteFile(path, []byte(content), 0644); err != nil {
            t.Fatalf("Failed to create test file: %v", err)
        }
    }

    // Compress files
    compressReq := map[string]interface{}{
        "files":  []string{"/file1.txt", "/file2.txt", "/file3.txt"},
        "output": "/archive.zip",
        "format": "zip",
    }

    body, _ := json.Marshal(compressReq)
    compressResp, err := http.Post(
        fmt.Sprintf("%s/api/compress", ts.Server.URL),
        "application/json",
        bytes.NewReader(body),
    )
    if err != nil {
        t.Fatalf("Compress request failed: %v", err)
    }
    defer compressResp.Body.Close()

    if compressResp.StatusCode != http.StatusOK {
        t.Errorf("Compress failed with status %d", compressResp.StatusCode)
    }

    // Verify archive was created
    archivePath := filepath.Join(ts.TempDir, "archive.zip")
    if _, err := os.Stat(archivePath); os.IsNotExist(err) {
        t.Fatal("Archive was not created")
    }

    // Extract archive
    extractReq := map[string]string{
        "archive":     "/archive.zip",
        "destination": "/extracted",
    }

    body, _ = json.Marshal(extractReq)
    extractResp, err := http.Post(
        fmt.Sprintf("%s/api/extract", ts.Server.URL),
        "application/json",
        bytes.NewReader(body),
    )
    if err != nil {
        t.Fatalf("Extract request failed: %v", err)
    }
    defer extractResp.Body.Close()

    if extractResp.StatusCode != http.StatusOK {
        t.Errorf("Extract failed with status %d", extractResp.StatusCode)
    }

    // Verify files were extracted
    extractDir := filepath.Join(ts.TempDir, "extracted")
    for _, file := range files {
        extractedFile := filepath.Join(extractDir, file)
        if _, err := os.Stat(extractedFile); os.IsNotExist(err) {
            t.Errorf("File %s was not extracted", file)
        }
    }
}

// Helper function to setup routes (simplified)
func setupRoutes(router *mux.Router, rootPath string) {
    // Add basic route handlers for testing
    // This would normally use the actual handlers from your application

    router.HandleFunc("/api/files", func(w http.ResponseWriter, r *http.Request) {
        // Simplified file listing handler
        files := []map[string]interface{}{}
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(files)
    }).Methods("GET")

    router.HandleFunc("/api/file", func(w http.ResponseWriter, r *http.Request) {
        // Simplified file get/delete handler
        if r.Method == "GET" {
            w.WriteHeader(http.StatusOK)
        } else if r.Method == "DELETE" {
            w.WriteHeader(http.StatusOK)
        }
    }).Methods("GET", "DELETE")

    router.HandleFunc("/api/upload", func(w http.ResponseWriter, r *http.Request) {
        // Simplified upload handler
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]bool{"success": true})
    }).Methods("POST")

    router.HandleFunc("/api/copy", func(w http.ResponseWriter, r *http.Request) {
        // Simplified copy handler
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]bool{"success": true})
    }).Methods("POST")

    router.HandleFunc("/api/move", func(w http.ResponseWriter, r *http.Request) {
        // Simplified move handler
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]bool{"success": true})
    }).Methods("POST")

    router.HandleFunc("/api/directory", func(w http.ResponseWriter, r *http.Request) {
        // Simplified directory creation handler
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]bool{"success": true})
    }).Methods("POST")

    router.HandleFunc("/api/search", func(w http.ResponseWriter, r *http.Request) {
        // Simplified search handler
        results := []map[string]interface{}{}
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(results)
    }).Methods("GET")

    router.HandleFunc("/api/compress", func(w http.ResponseWriter, r *http.Request) {
        // Simplified compress handler
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]bool{"success": true})
    }).Methods("POST")

    router.HandleFunc("/api/extract", func(w http.ResponseWriter, r *http.Request) {
        // Simplified extract handler
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]bool{"success": true})
    }).Methods("POST")

    router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        // Simplified WebSocket handler
        upgrader := websocket.Upgrader{
            CheckOrigin: func(r *http.Request) bool { return true },
        }

        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            return
        }
        defer conn.Close()

        for {
            var msg map[string]interface{}
            if err := conn.ReadJSON(&msg); err != nil {
                break
            }

            if msg["type"] == "ping" {
                conn.WriteJSON(map[string]string{"type": "pong"})
            }
        }
    })
}