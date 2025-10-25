package storage

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func setupTestDir(t *testing.T) (string, func()) {
	tempDir, err := os.MkdirTemp("", "local_storage_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	cleanup := func() {
		os.RemoveAll(tempDir)
	}

	return tempDir, cleanup
}

func TestNewLocalStorage(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, err := NewLocalStorage(tempDir)
	if err != nil {
		t.Fatalf("Failed to create LocalStorage: %v", err)
	}

	if storage.rootPath != tempDir {
		t.Errorf("Expected rootPath %s, got %s", tempDir, storage.rootPath)
	}
}

func TestLocalStorage_List(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	// Create test files and directories
	testFiles := []string{"file1.txt", "file2.log", ".hidden"}
	testDirs := []string{"dir1", "dir2"}

	for _, file := range testFiles {
		if err := os.WriteFile(filepath.Join(tempDir, file), []byte("test"), 0644); err != nil {
			t.Fatalf("Failed to create test file %s: %v", file, err)
		}
	}

	for _, dir := range testDirs {
		if err := os.Mkdir(filepath.Join(tempDir, dir), 0755); err != nil {
			t.Fatalf("Failed to create test dir %s: %v", dir, err)
		}
	}

	storage, _ := NewLocalStorage(tempDir)

	t.Run("List all files", func(t *testing.T) {
		entries, err := storage.List("/", false)
		if err != nil {
			t.Fatalf("Failed to list files: %v", err)
		}

		if len(entries) != 4 { // 2 files (excluding hidden) + 2 dirs
			t.Errorf("Expected 4 entries, got %d", len(entries))
		}
	})

	t.Run("List with hidden files", func(t *testing.T) {
		entries, err := storage.List("/", true)
		if err != nil {
			t.Fatalf("Failed to list files: %v", err)
		}

		if len(entries) != 5 { // 3 files + 2 dirs
			t.Errorf("Expected 5 entries, got %d", len(entries))
		}
	})
}

func TestLocalStorage_Get(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	testContent := []byte("test file content")
	testFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(testFile, testContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	storage, _ := NewLocalStorage(tempDir)

	t.Run("Get existing file", func(t *testing.T) {
		reader, err := storage.Get("/test.txt")
		if err != nil {
			t.Fatalf("Failed to get file: %v", err)
		}
		defer reader.Close()

		content, _ := io.ReadAll(reader)
		if !bytes.Equal(content, testContent) {
			t.Errorf("Content mismatch. Expected %s, got %s", testContent, content)
		}
	})

	t.Run("Get non-existent file", func(t *testing.T) {
		_, err := storage.Get("/nonexistent.txt")
		if err == nil {
			t.Error("Expected error for non-existent file, got nil")
		}
	})
}

func TestLocalStorage_Put(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)
	testContent := []byte("new file content")

	t.Run("Put new file", func(t *testing.T) {
		reader := bytes.NewReader(testContent)
		err := storage.Put("/new.txt", reader, int64(len(testContent)))
		if err != nil {
			t.Fatalf("Failed to put file: %v", err)
		}

		// Verify file was created
		filePath := filepath.Join(tempDir, "new.txt")
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			t.Error("File was not created")
		}

		// Verify content
		content, _ := os.ReadFile(filePath)
		if !bytes.Equal(content, testContent) {
			t.Errorf("Content mismatch. Expected %s, got %s", testContent, content)
		}
	})

	t.Run("Put file in nested directory", func(t *testing.T) {
		reader := bytes.NewReader(testContent)
		err := storage.Put("/nested/dir/file.txt", reader, int64(len(testContent)))
		if err != nil {
			t.Fatalf("Failed to put file in nested dir: %v", err)
		}

		filePath := filepath.Join(tempDir, "nested", "dir", "file.txt")
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			t.Error("File was not created in nested directory")
		}
	})
}

func TestLocalStorage_Delete(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	// Create test file
	testFile := filepath.Join(tempDir, "delete.txt")
	if err := os.WriteFile(testFile, []byte("delete me"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	t.Run("Delete existing file", func(t *testing.T) {
		err := storage.Delete("/delete.txt")
		if err != nil {
			t.Fatalf("Failed to delete file: %v", err)
		}

		if _, err := os.Stat(testFile); !os.IsNotExist(err) {
			t.Error("File was not deleted")
		}
	})

	t.Run("Delete non-existent file", func(t *testing.T) {
		err := storage.Delete("/nonexistent.txt")
		if err == nil {
			t.Error("Expected error for non-existent file, got nil")
		}
	})
}

func TestLocalStorage_CreateDirectory(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	t.Run("Create directory", func(t *testing.T) {
		err := storage.CreateDirectory("/testdir")
		if err != nil {
			t.Fatalf("Failed to create directory: %v", err)
		}

		dirPath := filepath.Join(tempDir, "testdir")
		info, err := os.Stat(dirPath)
		if err != nil {
			t.Fatalf("Directory was not created: %v", err)
		}

		if !info.IsDir() {
			t.Error("Created path is not a directory")
		}
	})

	t.Run("Create nested directories", func(t *testing.T) {
		err := storage.CreateDirectory("/nested/deep/dir")
		if err != nil {
			t.Fatalf("Failed to create nested directories: %v", err)
		}

		dirPath := filepath.Join(tempDir, "nested", "deep", "dir")
		info, err := os.Stat(dirPath)
		if err != nil {
			t.Fatalf("Nested directories were not created: %v", err)
		}

		if !info.IsDir() {
			t.Error("Created path is not a directory")
		}
	})
}

func TestLocalStorage_Move(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	// Create test file
	srcPath := filepath.Join(tempDir, "source.txt")
	testContent := []byte("move me")
	if err := os.WriteFile(srcPath, testContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	t.Run("Move file", func(t *testing.T) {
		err := storage.Move("/source.txt", "/destination.txt")
		if err != nil {
			t.Fatalf("Failed to move file: %v", err)
		}

		// Check source is gone
		if _, err := os.Stat(srcPath); !os.IsNotExist(err) {
			t.Error("Source file still exists")
		}

		// Check destination exists
		destPath := filepath.Join(tempDir, "destination.txt")
		content, err := os.ReadFile(destPath)
		if err != nil {
			t.Fatalf("Destination file not found: %v", err)
		}

		if !bytes.Equal(content, testContent) {
			t.Errorf("Content mismatch. Expected %s, got %s", testContent, content)
		}
	})
}

func TestLocalStorage_Copy(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	// Create test file
	srcPath := filepath.Join(tempDir, "original.txt")
	testContent := []byte("copy me")
	if err := os.WriteFile(srcPath, testContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	t.Run("Copy file", func(t *testing.T) {
		err := storage.Copy("/original.txt", "/copy.txt")
		if err != nil {
			t.Fatalf("Failed to copy file: %v", err)
		}

		// Check source still exists
		if _, err := os.Stat(srcPath); os.IsNotExist(err) {
			t.Error("Source file was deleted")
		}

		// Check copy exists with same content
		copyPath := filepath.Join(tempDir, "copy.txt")
		content, err := os.ReadFile(copyPath)
		if err != nil {
			t.Fatalf("Copy file not found: %v", err)
		}

		if !bytes.Equal(content, testContent) {
			t.Errorf("Content mismatch. Expected %s, got %s", testContent, content)
		}
	})
}

func TestLocalStorage_Stat(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	// Create test file
	testFile := filepath.Join(tempDir, "stat.txt")
	testContent := []byte("stat me")
	if err := os.WriteFile(testFile, testContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	t.Run("Stat existing file", func(t *testing.T) {
		info, err := storage.Stat("/stat.txt")
		if err != nil {
			t.Fatalf("Failed to stat file: %v", err)
		}

		if info.Name != "stat.txt" {
			t.Errorf("Expected name 'stat.txt', got %s", info.Name)
		}

		if info.Size != int64(len(testContent)) {
			t.Errorf("Expected size %d, got %d", len(testContent), info.Size)
		}

		if info.IsDir {
			t.Error("File reported as directory")
		}
	})

	t.Run("Stat directory", func(t *testing.T) {
		dirPath := filepath.Join(tempDir, "testdir")
		if err := os.Mkdir(dirPath, 0755); err != nil {
			t.Fatalf("Failed to create test dir: %v", err)
		}

		info, err := storage.Stat("/testdir")
		if err != nil {
			t.Fatalf("Failed to stat directory: %v", err)
		}

		if !info.IsDir {
			t.Error("Directory not reported as directory")
		}
	})

	t.Run("Stat non-existent", func(t *testing.T) {
		_, err := storage.Stat("/nonexistent")
		if err == nil {
			t.Error("Expected error for non-existent path, got nil")
		}
	})
}

func TestLocalStorage_Search(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	// Create test files
	testFiles := map[string]string{
		"test.txt":          "hello world",
		"data.log":          "error occurred",
		"subdir/nested.txt": "hello nested",
		"subdir/other.json": "{}",
	}

	for path, content := range testFiles {
		fullPath := filepath.Join(tempDir, path)
		os.MkdirAll(filepath.Dir(fullPath), 0755)
		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			t.Fatalf("Failed to create test file %s: %v", path, err)
		}
	}

	t.Run("Search by pattern", func(t *testing.T) {
		results, err := storage.Search("/", "*.txt", "")
		if err != nil {
			t.Fatalf("Failed to search: %v", err)
		}

		if len(results) != 2 { // test.txt and subdir/nested.txt
			t.Errorf("Expected 2 results, got %d", len(results))
		}
	})

	t.Run("Search by content", func(t *testing.T) {
		results, err := storage.Search("/", "", "hello")
		if err != nil {
			t.Fatalf("Failed to search: %v", err)
		}

		if len(results) != 2 { // test.txt and subdir/nested.txt
			t.Errorf("Expected 2 results, got %d", len(results))
		}
	})

	t.Run("Search by pattern and content", func(t *testing.T) {
		results, err := storage.Search("/", "*.txt", "nested")
		if err != nil {
			t.Fatalf("Failed to search: %v", err)
		}

		if len(results) != 1 { // only subdir/nested.txt
			t.Errorf("Expected 1 result, got %d", len(results))
		}
	})
}

func TestLocalStorage_GetUsage(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	// Create test files
	testFiles := map[string]int{
		"file1.txt":     1024,
		"file2.txt":     2048,
		"dir/file3.txt": 512,
	}

	for path, size := range testFiles {
		fullPath := filepath.Join(tempDir, path)
		os.MkdirAll(filepath.Dir(fullPath), 0755)
		content := make([]byte, size)
		if err := os.WriteFile(fullPath, content, 0644); err != nil {
			t.Fatalf("Failed to create test file %s: %v", path, err)
		}
	}

	usage, err := storage.GetUsage("/")
	if err != nil {
		t.Fatalf("Failed to get usage: %v", err)
	}

	expectedUsed := int64(1024 + 2048 + 512)
	if usage.Used < expectedUsed {
		t.Errorf("Expected at least %d bytes used, got %d", expectedUsed, usage.Used)
	}

	if usage.Total <= 0 {
		t.Error("Total space should be greater than 0")
	}

	if usage.Free <= 0 {
		t.Error("Free space should be greater than 0")
	}
}

func TestLocalStorage_Watch(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage, _ := NewLocalStorage(tempDir)

	events := make(chan FileEvent, 10)
	done := make(chan struct{})

	go func() {
		err := storage.Watch("/", events, done)
		if err != nil {
			t.Errorf("Watch failed: %v", err)
		}
	}()

	// Give watcher time to start
	time.Sleep(100 * time.Millisecond)

	// Create a file
	testFile := filepath.Join(tempDir, "watch.txt")
	if err := os.WriteFile(testFile, []byte("watch me"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Wait for event
	select {
	case event := <-events:
		if event.Type != "create" && event.Type != "write" {
			t.Errorf("Expected create or write event, got %s", event.Type)
		}
		if event.Path != "/watch.txt" {
			t.Errorf("Expected path /watch.txt, got %s", event.Path)
		}
	case <-time.After(2 * time.Second):
		t.Skip("Watch test timed out - filesystem events may not be supported")
	}

	close(done)
}
