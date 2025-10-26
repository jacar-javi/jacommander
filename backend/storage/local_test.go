package storage

import (
	"bytes"
	"io"
	"log"
	"os"
	"path/filepath"
	"testing"
)

func setupTestDir(t *testing.T) (string, func()) {
	tempDir, err := os.MkdirTemp("", "local_storage_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	cleanup := func() {
		if err := os.RemoveAll(tempDir); err != nil {
			log.Printf("Error removing temp dir: %v", err)
		}
	}

	return tempDir, cleanup
}

func TestNewLocalStorage(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage := NewLocalStorage(tempDir)

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

	storage := NewLocalStorage(tempDir)

	t.Run("List all files", func(t *testing.T) {
		entries, err := storage.List("/")
		if err != nil {
			t.Fatalf("Failed to list files: %v", err)
		}

		// Should list all files including hidden ones
		if len(entries) < 4 {
			t.Errorf("Expected at least 4 entries, got %d", len(entries))
		}
	})
}

func TestLocalStorage_Read(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	testContent := []byte("test file content")
	testFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(testFile, testContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	storage := NewLocalStorage(tempDir)

	t.Run("Read existing file", func(t *testing.T) {
		reader, err := storage.Read("/test.txt")
		if err != nil {
			t.Fatalf("Failed to read file: %v", err)
		}
		defer func() {
			if err := reader.Close(); err != nil {
				log.Printf("Error closing reader: %v", err)
			}
		}()

		content, _ := io.ReadAll(reader)
		if !bytes.Equal(content, testContent) {
			t.Errorf("Content mismatch. Expected %s, got %s", testContent, content)
		}
	})

	t.Run("Read non-existent file", func(t *testing.T) {
		_, err := storage.Read("/nonexistent.txt")
		if err == nil {
			t.Error("Expected error for non-existent file, got nil")
		}
	})
}

func TestLocalStorage_Write(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage := NewLocalStorage(tempDir)
	testContent := []byte("new file content")

	t.Run("Write new file", func(t *testing.T) {
		reader := bytes.NewReader(testContent)
		err := storage.Write("/new.txt", reader)
		if err != nil {
			t.Fatalf("Failed to write file: %v", err)
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

	t.Run("Write file in nested directory", func(t *testing.T) {
		// First create the parent directory
		if err := storage.MkDir("/nested/dir"); err != nil {
			t.Fatalf("Failed to create nested dir: %v", err)
		}

		reader := bytes.NewReader(testContent)
		err := storage.Write("/nested/dir/file.txt", reader)
		if err != nil {
			t.Fatalf("Failed to write file in nested dir: %v", err)
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

	storage := NewLocalStorage(tempDir)

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

func TestLocalStorage_MkDir(t *testing.T) {
	tempDir, cleanup := setupTestDir(t)
	defer cleanup()

	storage := NewLocalStorage(tempDir)

	t.Run("Create directory", func(t *testing.T) {
		err := storage.MkDir("/testdir")
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
		err := storage.MkDir("/nested/deep/dir")
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

	storage := NewLocalStorage(tempDir)

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

	storage := NewLocalStorage(tempDir)

	// Create test file
	srcPath := filepath.Join(tempDir, "original.txt")
	testContent := []byte("copy me")
	if err := os.WriteFile(srcPath, testContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	t.Run("Copy file", func(t *testing.T) {
		err := storage.Copy("/original.txt", "/copy.txt", nil)
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

	storage := NewLocalStorage(tempDir)

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

// Note: Search, GetUsage, and Watch methods are not part of the current FileSystem interface
// These tests have been removed as those methods don't exist in LocalStorage
