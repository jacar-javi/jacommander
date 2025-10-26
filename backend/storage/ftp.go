//go:build !basic
// +build !basic

package storage

import (
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"path"
	"strings"

	"github.com/jlaffaye/ftp"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
)

// FTPStorage implements FileSystem interface for FTP/SFTP servers
type FTPStorage struct {
	protocol   string // "ftp" or "sftp"
	ftpClient  *ftp.ServerConn
	sftpClient *sftp.Client
	sshClient  *ssh.Client
	host       string
	port       string
	username   string
	password   string
	rootPath   string
}

// NewFTPStorage creates a new FTP/SFTP filesystem
func NewFTPStorage(protocol, host, port, username, password, rootPath string) (*FTPStorage, error) {
	fs := &FTPStorage{
		protocol: protocol,
		host:     host,
		port:     port,
		username: username,
		password: password,
		rootPath: rootPath,
	}

	if err := fs.connect(); err != nil {
		return nil, err
	}

	return fs, nil
}

func (f *FTPStorage) connect() error {
	if f.protocol == "sftp" {
		return f.connectSFTP()
	}
	return f.connectFTP()
}

func (f *FTPStorage) connectFTP() error {
	addr := fmt.Sprintf("%s:%s", f.host, f.port)

	conn, err := ftp.Dial(addr)
	if err != nil {
		return fmt.Errorf("failed to connect to FTP server: %v", err)
	}

	if err := conn.Login(f.username, f.password); err != nil {
		if quitErr := conn.Quit(); quitErr != nil {
			log.Printf("Error closing FTP connection after login failure: %v", quitErr)
		}
		return fmt.Errorf("FTP login failed: %v", err)
	}

	f.ftpClient = conn
	return nil
}

// getHostKeyCallback returns an appropriate SSH host key callback
// based on environment configuration
func getHostKeyCallback() ssh.HostKeyCallback {
	// Check for SSH_INSECURE env var (for development/testing only)
	if os.Getenv("SSH_INSECURE") == "true" {
		log.Println("WARNING: SSH host key verification disabled (SSH_INSECURE=true)")
		return ssh.InsecureIgnoreHostKey()
	}

	// Try to use known_hosts file for verification
	knownHostsPath := os.Getenv("SSH_KNOWN_HOSTS")
	if knownHostsPath == "" {
		// Default to user's known_hosts file
		homeDir, err := os.UserHomeDir()
		if err == nil {
			knownHostsPath = homeDir + "/.ssh/known_hosts"
		}
	}

	// If known_hosts file exists, use it for verification
	if knownHostsPath != "" {
		if _, err := os.Stat(knownHostsPath); err == nil {
			callback, err := knownhosts.New(knownHostsPath)
			if err == nil {
				log.Printf("Using SSH known_hosts file: %s", knownHostsPath)
				return callback
			}
			log.Printf("Warning: Failed to load known_hosts file: %v", err)
		}
	}

	// Fallback: Accept any key but log a warning
	log.Println("WARNING: No SSH known_hosts file found, accepting any host key")
	return func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		log.Printf("SSH: Accepting host key from %s (fingerprint: %s)", hostname, ssh.FingerprintSHA256(key))
		return nil
	}
}

func (f *FTPStorage) connectSFTP() error {
	addr := fmt.Sprintf("%s:%s", f.host, f.port)

	config := &ssh.ClientConfig{
		User: f.username,
		Auth: []ssh.AuthMethod{
			ssh.Password(f.password),
		},
		HostKeyCallback: getHostKeyCallback(),
	}

	sshClient, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return fmt.Errorf("failed to connect to SSH server: %v", err)
	}

	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		if err := sshClient.Close(); err != nil {
			log.Printf("Error closing SSH client: %v", err)
		}
		return fmt.Errorf("failed to create SFTP client: %v", err)
	}

	f.sshClient = sshClient
	f.sftpClient = sftpClient
	return nil
}

// List lists files in a directory
func (f *FTPStorage) List(dirPath string) ([]FileInfo, error) {
	fullPath := f.getFullPath(dirPath)

	if f.protocol == "sftp" {
		return f.listSFTP(fullPath)
	}
	return f.listFTP(fullPath)
}

func (f *FTPStorage) listFTP(dirPath string) ([]FileInfo, error) {
	entries, err := f.ftpClient.List(dirPath)
	if err != nil {
		return nil, fmt.Errorf("failed to list directory: %v", err)
	}

	var files []FileInfo
	for _, entry := range entries {
		files = append(files, FileInfo{
			Name:    entry.Name,
			Size:    int64(entry.Size),
			IsDir:   entry.Type == ftp.EntryTypeFolder,
			ModTime: entry.Time,
			Path:    path.Join(dirPath, entry.Name),
		})
	}

	return files, nil
}

func (f *FTPStorage) listSFTP(dirPath string) ([]FileInfo, error) {
	files, err := f.sftpClient.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("failed to list directory: %v", err)
	}

	var result []FileInfo
	for _, file := range files {
		result = append(result, FileInfo{
			Name:    file.Name(),
			Size:    file.Size(),
			IsDir:   file.IsDir(),
			ModTime: file.ModTime(),
			Path:    path.Join(dirPath, file.Name()),
		})
	}

	return result, nil
}

// Stat returns information about a file
func (f *FTPStorage) Stat(filePath string) (FileInfo, error) {
	fullPath := f.getFullPath(filePath)

	if f.protocol == "sftp" {
		stat, err := f.sftpClient.Stat(fullPath)
		if err != nil {
			return FileInfo{}, err
		}

		return FileInfo{
			Name:    path.Base(fullPath),
			Size:    stat.Size(),
			IsDir:   stat.IsDir(),
			ModTime: stat.ModTime(),
			Path:    filePath,
		}, nil
	}

	// FTP doesn't have a direct stat command, use list
	dir := path.Dir(fullPath)
	name := path.Base(fullPath)

	entries, err := f.ftpClient.List(dir)
	if err != nil {
		return FileInfo{}, err
	}

	for _, entry := range entries {
		if entry.Name == name {
			return FileInfo{
				Name:    entry.Name,
				Size:    int64(entry.Size),
				IsDir:   entry.Type == ftp.EntryTypeFolder,
				ModTime: entry.Time,
				Path:    filePath,
			}, nil
		}
	}

	return FileInfo{}, fmt.Errorf("file not found: %s", filePath)
}

// Read reads a file from the FTP/SFTP server
func (f *FTPStorage) Read(filePath string) (io.ReadCloser, error) {
	fullPath := f.getFullPath(filePath)

	if f.protocol == "sftp" {
		file, err := f.sftpClient.Open(fullPath)
		if err != nil {
			return nil, fmt.Errorf("failed to open file: %v", err)
		}
		return file, nil
	}

	// FTP
	reader, err := f.ftpClient.Retr(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve file: %v", err)
	}

	return reader, nil
}

// Write writes a file to the FTP/SFTP server
func (f *FTPStorage) Write(filePath string, data io.Reader) error {
	fullPath := f.getFullPath(filePath)

	if f.protocol == "sftp" {
		return f.writeSFTP(fullPath, data)
	}
	return f.writeFTP(fullPath, data)
}

func (f *FTPStorage) writeFTP(filePath string, data io.Reader) error {
	// Read all data first (FTP requires this)
	content, err := io.ReadAll(data)
	if err != nil {
		return err
	}

	err = f.ftpClient.Stor(filePath, strings.NewReader(string(content)))
	if err != nil {
		return fmt.Errorf("failed to store file: %v", err)
	}

	return nil
}

func (f *FTPStorage) writeSFTP(filePath string, data io.Reader) error {
	file, err := f.sftpClient.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer func() {
		if err := file.Close(); err != nil {
			log.Printf("Error closing SFTP file: %v", err)
		}
	}()

	_, err = io.Copy(file, data)
	if err != nil {
		return fmt.Errorf("failed to write file: %v", err)
	}

	return nil
}

// Delete deletes a file or directory
func (f *FTPStorage) Delete(filePath string) error {
	fullPath := f.getFullPath(filePath)

	// Check if it's a directory
	info, err := f.Stat(filePath)
	if err != nil {
		return err
	}

	if f.protocol == "sftp" {
		if info.IsDir {
			return f.sftpClient.RemoveDirectory(fullPath)
		}
		return f.sftpClient.Remove(fullPath)
	}

	// FTP
	if info.IsDir {
		return f.ftpClient.RemoveDir(fullPath)
	}
	return f.ftpClient.Delete(fullPath)
}

// MkDir creates a directory
func (f *FTPStorage) MkDir(dirPath string) error {
	fullPath := f.getFullPath(dirPath)

	if f.protocol == "sftp" {
		return f.sftpClient.Mkdir(fullPath)
	}

	return f.ftpClient.MakeDir(fullPath)
}

// Move moves a file or directory
func (f *FTPStorage) Move(src, dst string) error {
	srcPath := f.getFullPath(src)
	dstPath := f.getFullPath(dst)

	if f.protocol == "sftp" {
		return f.sftpClient.Rename(srcPath, dstPath)
	}

	// FTP rename
	return f.ftpClient.Rename(srcPath, dstPath)
}

// Copy copies a file
func (f *FTPStorage) Copy(src, dst string, progress ProgressCallback) error {
	// Read source file
	srcReader, err := f.Read(src)
	if err != nil {
		return err
	}
	defer func() {
		if err := srcReader.Close(); err != nil {
			log.Printf("Error closing source reader: %v", err)
		}
	}()

	// Get file size for progress
	info, err := f.Stat(src)
	if err != nil {
		return err
	}

	// Report initial progress
	if progress != nil {
		progress(0, info.Size)
	}

	// Read content
	content, err := io.ReadAll(srcReader)
	if err != nil {
		return err
	}

	// Report middle progress
	if progress != nil {
		progress(info.Size/2, info.Size)
	}

	// Write to destination
	err = f.Write(dst, strings.NewReader(string(content)))
	if err != nil {
		return err
	}

	// Report completion
	if progress != nil {
		progress(info.Size, info.Size)
	}

	return nil
}

// GetType returns the storage type
func (f *FTPStorage) GetType() string {
	return f.protocol
}

// GetRootPath returns the root path
func (f *FTPStorage) GetRootPath() string {
	return f.rootPath
}

// GetAvailableSpace returns available and total space (not supported for FTP/SFTP)
func (f *FTPStorage) GetAvailableSpace() (available, total int64, err error) {
	// Most FTP/SFTP servers don't provide space information
	return -1, -1, nil
}

// IsValidPath checks if a path is valid
func (f *FTPStorage) IsValidPath(filePath string) bool {
	// Basic validation
	return !strings.Contains(filePath, "")
}

// JoinPath joins path parts
func (f *FTPStorage) JoinPath(parts ...string) string {
	return path.Join(parts...)
}

// ResolvePath resolves a path
func (f *FTPStorage) ResolvePath(filePath string) string {
	return path.Clean(filePath)
}

// GetFileContent reads file content
func (f *FTPStorage) GetFileContent(filePath string) ([]byte, error) {
	reader, err := f.Read(filePath)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := reader.Close(); err != nil {
			log.Printf("Error closing file reader: %v", err)
		}
	}()

	return io.ReadAll(reader)
}

// PutFileContent writes file content
func (f *FTPStorage) PutFileContent(filePath string, content []byte) error {
	return f.Write(filePath, strings.NewReader(string(content)))
}

// Search searches for files
func (f *FTPStorage) Search(query string, options map[string]interface{}) ([]FileInfo, error) {
	// Start from root and search recursively
	return f.searchRecursive(f.rootPath, query, options)
}

func (f *FTPStorage) searchRecursive(dirPath, query string, options map[string]interface{}) ([]FileInfo, error) {
	files, err := f.List(dirPath)
	if err != nil {
		return nil, err
	}

	var results []FileInfo
	queryLower := strings.ToLower(query)

	for _, file := range files {
		// Check if name matches
		if strings.Contains(strings.ToLower(file.Name), queryLower) {
			results = append(results, file)
		}

		// Recursively search directories
		if file.IsDir {
			subResults, _ := f.searchRecursive(file.Path, query, options)
			results = append(results, subResults...)
		}

		// Limit results
		if len(results) >= 100 {
			break
		}
	}

	return results, nil
}

// Helper functions

func (f *FTPStorage) getFullPath(filePath string) string {
	if filePath == "" || filePath == "/" {
		return f.rootPath
	}

	if strings.HasPrefix(filePath, "/") {
		return path.Join(f.rootPath, filePath)
	}

	return path.Join(f.rootPath, "/", filePath)
}

// Close closes the connection
func (f *FTPStorage) Close() error {
	if f.ftpClient != nil {
		return f.ftpClient.Quit()
	}

	if f.sftpClient != nil {
		if err := f.sftpClient.Close(); err != nil {
			log.Printf("Error closing SFTP client: %v", err)
		}
	}

	if f.sshClient != nil {
		if err := f.sshClient.Close(); err != nil {
			log.Printf("Error closing SSH client: %v", err)
		}
	}

	return nil
}

// FTPAdapter adapts FTPStorage to implement FileSystem interface
type FTPAdapter struct {
	*FTPStorage
}

// NewFTPAdapter creates a new FTP/SFTP adapter
func NewFTPAdapter(protocol, host, port, username, password, rootPath string) (FileSystem, error) {
	storage, err := NewFTPStorage(protocol, host, port, username, password, rootPath)
	if err != nil {
		return nil, err
	}
	return &FTPAdapter{storage}, nil
}
