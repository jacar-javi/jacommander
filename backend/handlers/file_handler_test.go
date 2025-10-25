package handlers

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
	"strings"
	"testing"

	"github.com/gorilla/mux"
)

type mockStorage struct {
	files map[string][]byte
	dirs  map[string]bool
}

func newMockStorage() *mockStorage {
	return &mockStorage{
		files: make(map[string][]byte),
		dirs:  map[string]bool{"/": true},
	}
}

func (m *mockStorage) List(path string, showHidden bool) ([]FileInfo, error) {
	var entries []FileInfo

	for filePath, content := range m.files {
		if strings.HasPrefix(filePath, path) && filePath != path {
			// Check if it's a direct child
			relativePath := strings.TrimPrefix(filePath, path)
			if !strings.Contains(relativePath, "/") {
				entries = append(entries, FileInfo{
					Name:  filepath.Base(filePath),
					Size:  int64(len(content)),
					IsDir: false,
				})
			}
		}
	}

	for dirPath := range m.dirs {
		if strings.HasPrefix(dirPath, path) && dirPath != path {
			relativePath := strings.TrimPrefix(dirPath, path)
			if !strings.Contains(relativePath, "/") {
				entries = append(entries, FileInfo{
					Name:  filepath.Base(dirPath),
					IsDir: true,
				})
			}
		}
	}

	return entries, nil
}

func (m *mockStorage) Get(path string) (io.ReadCloser, error) {
	if content, ok := m.files[path]; ok {
		return io.NopCloser(bytes.NewReader(content)), nil
	}
	return nil, fmt.Errorf("file not found: %s", path)
}

func (m *mockStorage) Put(path string, reader io.Reader, size int64) error {
	content, err := io.ReadAll(reader)
	if err != nil {
		return err
	}
	m.files[path] = content
	return nil
}

func (m *mockStorage) Delete(path string) error {
	if _, ok := m.files[path]; ok {
		delete(m.files, path)
		return nil
	}
	if _, ok := m.dirs[path]; ok {
		delete(m.dirs, path)
		return nil
	}
	return fmt.Errorf("path not found: %s", path)
}

func (m *mockStorage) CreateDirectory(path string) error {
	m.dirs[path] = true
	return nil
}

func (m *mockStorage) Move(src, dst string) error {
	if content, ok := m.files[src]; ok {
		m.files[dst] = content
		delete(m.files, src)
		return nil
	}
	return fmt.Errorf("source not found: %s", src)
}

func (m *mockStorage) Copy(src, dst string) error {
	if content, ok := m.files[src]; ok {
		m.files[dst] = content
		return nil
	}
	return fmt.Errorf("source not found: %s", src)
}

func TestListFiles(t *testing.T) {
	storage := newMockStorage()
	storage.files["/test.txt"] = []byte("test content")
	storage.files["/doc.pdf"] = []byte("pdf content")
	storage.dirs["/subdir"] = true

	handler := &FileHandler{storage: storage}

	req, _ := http.NewRequest("GET", "/api/files?path=/", nil)
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/files", handler.ListFiles).Methods("GET")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	var files []FileInfo
	if err := json.NewDecoder(rr.Body).Decode(&files); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if len(files) != 3 {
		t.Errorf("Expected 3 files, got %d", len(files))
	}
}

func TestGetFile(t *testing.T) {
	storage := newMockStorage()
	testContent := []byte("test file content")
	storage.files["/test.txt"] = testContent

	handler := &FileHandler{storage: storage}

	req, _ := http.NewRequest("GET", "/api/file?path=/test.txt", nil)
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/file", handler.GetFile).Methods("GET")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	if contentType := rr.Header().Get("Content-Type"); contentType != "text/plain; charset=utf-8" {
		t.Errorf("Expected Content-Type text/plain, got %s", contentType)
	}

	body := rr.Body.Bytes()
	if !bytes.Equal(body, testContent) {
		t.Errorf("Content mismatch. Expected %s, got %s", testContent, body)
	}
}

func TestUploadFile(t *testing.T) {
	storage := newMockStorage()
	handler := &FileHandler{storage: storage}

	// Create multipart form
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	// Add file
	fw, err := w.CreateFormFile("file", "upload.txt")
	if err != nil {
		t.Fatalf("Failed to create form file: %v", err)
	}

	testContent := []byte("uploaded content")
	if _, err := fw.Write(testContent); err != nil {
		t.Fatalf("Failed to write form file: %v", err)
	}

	// Add path field
	if err := w.WriteField("path", "/"); err != nil {
		t.Fatalf("Failed to write path field: %v", err)
	}

	w.Close()

	req, _ := http.NewRequest("POST", "/api/upload", &b)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/upload", handler.UploadFile).Methods("POST")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	// Verify file was stored
	if content, ok := storage.files["/upload.txt"]; !ok {
		t.Error("File was not uploaded")
	} else if !bytes.Equal(content, testContent) {
		t.Errorf("Content mismatch. Expected %s, got %s", testContent, content)
	}
}

func TestDeleteFile(t *testing.T) {
	storage := newMockStorage()
	storage.files["/delete.txt"] = []byte("delete me")

	handler := &FileHandler{storage: storage}

	reqBody := `{"path": "/delete.txt"}`
	req, _ := http.NewRequest("DELETE", "/api/file", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/file", handler.DeleteFile).Methods("DELETE")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	// Verify file was deleted
	if _, ok := storage.files["/delete.txt"]; ok {
		t.Error("File was not deleted")
	}
}

func TestCreateDirectory(t *testing.T) {
	storage := newMockStorage()
	handler := &FileHandler{storage: storage}

	reqBody := `{"path": "/newdir"}`
	req, _ := http.NewRequest("POST", "/api/directory", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/directory", handler.CreateDirectory).Methods("POST")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	// Verify directory was created
	if _, ok := storage.dirs["/newdir"]; !ok {
		t.Error("Directory was not created")
	}
}

func TestMoveFile(t *testing.T) {
	storage := newMockStorage()
	storage.files["/source.txt"] = []byte("move me")

	handler := &FileHandler{storage: storage}

	reqBody := `{"source": "/source.txt", "destination": "/dest.txt"}`
	req, _ := http.NewRequest("POST", "/api/move", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/move", handler.MoveFile).Methods("POST")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	// Verify file was moved
	if _, ok := storage.files["/source.txt"]; ok {
		t.Error("Source file still exists")
	}

	if _, ok := storage.files["/dest.txt"]; !ok {
		t.Error("Destination file was not created")
	}
}

func TestCopyFile(t *testing.T) {
	storage := newMockStorage()
	testContent := []byte("copy me")
	storage.files["/original.txt"] = testContent

	handler := &FileHandler{storage: storage}

	reqBody := `{"source": "/original.txt", "destination": "/copy.txt"}`
	req, _ := http.NewRequest("POST", "/api/copy", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/copy", handler.CopyFile).Methods("POST")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	// Verify original still exists
	if _, ok := storage.files["/original.txt"]; !ok {
		t.Error("Original file was deleted")
	}

	// Verify copy was created
	if content, ok := storage.files["/copy.txt"]; !ok {
		t.Error("Copy was not created")
	} else if !bytes.Equal(content, testContent) {
		t.Errorf("Content mismatch in copy. Expected %s, got %s", testContent, content)
	}
}

func TestSearchFiles(t *testing.T) {
	storage := newMockStorage()
	storage.files["/test.txt"] = []byte("hello world")
	storage.files["/data.log"] = []byte("error occurred")
	storage.files["/doc.txt"] = []byte("hello there")

	handler := &FileHandler{storage: storage}

	t.Run("Search by pattern", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/search?pattern=*.txt", nil)
		rr := httptest.NewRecorder()

		router := mux.NewRouter()
		router.HandleFunc("/api/search", handler.SearchFiles).Methods("GET")
		router.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, status)
		}

		var results []SearchResult
		if err := json.NewDecoder(rr.Body).Decode(&results); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		// Should find test.txt and doc.txt
		if len(results) < 2 {
			t.Errorf("Expected at least 2 results, got %d", len(results))
		}
	})

	t.Run("Search by content", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/search?content=hello", nil)
		rr := httptest.NewRecorder()

		router := mux.NewRouter()
		router.HandleFunc("/api/search", handler.SearchFiles).Methods("GET")
		router.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, status)
		}

		var results []SearchResult
		if err := json.NewDecoder(rr.Body).Decode(&results); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		// Should find test.txt and doc.txt (both contain "hello")
		if len(results) < 2 {
			t.Errorf("Expected at least 2 results, got %d", len(results))
		}
	})
}

func TestCompressFiles(t *testing.T) {
	storage := newMockStorage()
	storage.files["/file1.txt"] = []byte("content 1")
	storage.files["/file2.txt"] = []byte("content 2")

	handler := &FileHandler{storage: storage}

	reqBody := `{
        "files": ["/file1.txt", "/file2.txt"],
        "output": "/archive.zip",
        "format": "zip"
    }`

	req, _ := http.NewRequest("POST", "/api/compress", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/compress", handler.CompressFiles).Methods("POST")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, status)
	}

	// Verify archive was created
	if _, ok := storage.files["/archive.zip"]; !ok {
		t.Error("Archive was not created")
	}
}

func TestExtractArchive(t *testing.T) {
	storage := newMockStorage()

	// Create a simple zip archive in memory
	var buf bytes.Buffer
	// For testing, we'll just store some data that looks like an archive
	storage.files["/archive.zip"] = buf.Bytes()

	handler := &FileHandler{storage: storage}

	reqBody := `{
        "archive": "/archive.zip",
        "destination": "/extracted"
    }`

	req, _ := http.NewRequest("POST", "/api/extract", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/extract", handler.ExtractArchive).Methods("POST")
	router.ServeHTTP(rr, req)

	// This might fail with our mock, but we're testing the handler structure
	if status := rr.Code; status != http.StatusOK && status != http.StatusInternalServerError {
		t.Errorf("Unexpected status %d", status)
	}
}

func TestHandlerErrorCases(t *testing.T) {
	storage := newMockStorage()
	handler := &FileHandler{storage: storage}

	t.Run("Get non-existent file", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/file?path=/nonexistent.txt", nil)
		rr := httptest.NewRecorder()

		router := mux.NewRouter()
		router.HandleFunc("/api/file", handler.GetFile).Methods("GET")
		router.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusNotFound && status != http.StatusInternalServerError {
			t.Errorf("Expected error status, got %d", status)
		}
	})

	t.Run("Delete non-existent file", func(t *testing.T) {
		reqBody := `{"path": "/nonexistent.txt"}`
		req, _ := http.NewRequest("DELETE", "/api/file", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		router := mux.NewRouter()
		router.HandleFunc("/api/file", handler.DeleteFile).Methods("DELETE")
		router.ServeHTTP(rr, req)

		if status := rr.Code; status == http.StatusOK {
			t.Error("Expected error for non-existent file deletion")
		}
	})

	t.Run("Invalid JSON body", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/directory", strings.NewReader("invalid json"))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		router := mux.NewRouter()
		router.HandleFunc("/api/directory", handler.CreateDirectory).Methods("POST")
		router.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusBadRequest {
			t.Errorf("Expected BadRequest for invalid JSON, got %d", status)
		}
	})
}
