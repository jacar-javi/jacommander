package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3Storage implements the Storage interface for Amazon S3
type S3Storage struct {
	client    *s3.Client
	bucket    string
	region    string
	prefix    string
	accessKey string
	secretKey string
	endpoint  string // For S3-compatible services
}

// NewS3Storage creates a new S3 storage instance
func NewS3Storage(bucket, region, prefix, accessKey, secretKey, endpoint string) (*S3Storage, error) {
	// Create AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	// Create S3 client
	clientOptions := []func(*s3.Options){}
	if endpoint != "" {
		clientOptions = append(clientOptions, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(endpoint)
			o.UsePathStyle = true
		})
	}

	client := s3.NewFromConfig(cfg, clientOptions...)

	// Test connection by checking if bucket exists
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucket),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to access bucket %s: %w", bucket, err)
	}

	return &S3Storage{
		client:    client,
		bucket:    bucket,
		region:    region,
		prefix:    prefix,
		accessKey: accessKey,
		secretKey: secretKey,
		endpoint:  endpoint,
	}, nil
}

// GetType returns the storage type
func (s *S3Storage) GetType() string {
	return "s3"
}

// GetID returns a unique identifier for this storage
func (s *S3Storage) GetID() string {
	return fmt.Sprintf("s3://%s/%s", s.bucket, s.prefix)
}

// List lists files and directories at the given path
func (s *S3Storage) List(dirPath string) ([]FileInfo, error) {
	// Normalize path
	fullPath := s.getFullPath(dirPath)
	if fullPath != "" && !strings.HasSuffix(fullPath, "/") {
		fullPath += "/"
	}

	ctx := context.Background()
	input := &s3.ListObjectsV2Input{
		Bucket:    aws.String(s.bucket),
		Prefix:    aws.String(fullPath),
		Delimiter: aws.String("/"),
	}

	var files []FileInfo
	paginator := s3.NewListObjectsV2Paginator(s.client, input)

	for paginator.HasMorePages() {
		output, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to list objects: %w", err)
		}

		// Add directories (common prefixes)
		for _, prefix := range output.CommonPrefixes {
			name := strings.TrimSuffix(strings.TrimPrefix(*prefix.Prefix, fullPath), "/")
			files = append(files, FileInfo{
				Name:    name,
				Path:    "/" + strings.TrimPrefix(*prefix.Prefix, s.prefix),
				IsDir:   true,
				Size:    0,
				ModTime: time.Now(),
			})
		}

		// Add files
		for _, obj := range output.Contents {
			// Skip the directory marker itself
			if *obj.Key == fullPath {
				continue
			}

			name := strings.TrimPrefix(*obj.Key, fullPath)
			// Skip nested objects
			if strings.Contains(name, "/") {
				continue
			}

			files = append(files, FileInfo{
				Name:    name,
				Path:    "/" + strings.TrimPrefix(*obj.Key, s.prefix),
				IsDir:   false,
				Size:    *obj.Size,
				ModTime: *obj.LastModified,
			})
		}
	}

	return files, nil
}

// Read reads the content of a file
func (s *S3Storage) Read(filePath string) ([]byte, error) {
	fullPath := s.getFullPath(filePath)

	ctx := context.Background()
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fullPath),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	defer func() {
		if err := result.Body.Close(); err != nil {
			log.Printf("Error closing result body: %v", err)
		}
	}()

	return io.ReadAll(result.Body)
}

// Write writes content to a file
func (s *S3Storage) Write(filePath string, content []byte) error {
	fullPath := s.getFullPath(filePath)

	ctx := context.Background()
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(fullPath),
		Body:        bytes.NewReader(content),
		ContentType: aws.String(s.getContentType(filePath)),
	})
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// CreateDirectory creates a directory
func (s *S3Storage) CreateDirectory(dirPath string) error {
	fullPath := s.getFullPath(dirPath)
	if !strings.HasSuffix(fullPath, "/") {
		fullPath += "/"
	}

	// In S3, directories are virtual, but we can create a marker
	ctx := context.Background()
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fullPath),
		Body:   bytes.NewReader([]byte{}),
	})
	if err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	return nil
}

// Delete deletes a file or directory
func (s *S3Storage) Delete(filePath string) error {
	fullPath := s.getFullPath(filePath)

	// Check if it's a directory
	isDir := false
	if strings.HasSuffix(fullPath, "/") {
		isDir = true
	} else {
		// Check if path represents a directory
		ctx := context.Background()
		listResult, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
			Bucket:  aws.String(s.bucket),
			Prefix:  aws.String(fullPath + "/"),
			MaxKeys: aws.Int32(1),
		})
		if err == nil && len(listResult.Contents) > 0 {
			isDir = true
			fullPath += "/"
		}
	}

	if isDir {
		// Delete all objects with this prefix
		ctx := context.Background()
		paginator := s3.NewListObjectsV2Paginator(s.client, &s3.ListObjectsV2Input{
			Bucket: aws.String(s.bucket),
			Prefix: aws.String(fullPath),
		})

		var objectsToDelete []types.ObjectIdentifier
		for paginator.HasMorePages() {
			output, err := paginator.NextPage(ctx)
			if err != nil {
				return fmt.Errorf("failed to list objects for deletion: %w", err)
			}

			for _, obj := range output.Contents {
				objectsToDelete = append(objectsToDelete, types.ObjectIdentifier{
					Key: obj.Key,
				})
			}
		}

		if len(objectsToDelete) > 0 {
			// Delete in batches of 1000 (S3 limit)
			for i := 0; i < len(objectsToDelete); i += 1000 {
				end := i + 1000
				if end > len(objectsToDelete) {
					end = len(objectsToDelete)
				}

				_, err := s.client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
					Bucket: aws.String(s.bucket),
					Delete: &types.Delete{
						Objects: objectsToDelete[i:end],
						Quiet:   aws.Bool(true),
					},
				})
				if err != nil {
					return fmt.Errorf("failed to delete objects: %w", err)
				}
			}
		}
	} else {
		// Delete single file
		ctx := context.Background()
		_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(fullPath),
		})
		if err != nil {
			return fmt.Errorf("failed to delete file: %w", err)
		}
	}

	return nil
}

// Copy copies a file
func (s *S3Storage) Copy(srcPath, dstPath string) error {
	srcFullPath := s.getFullPath(srcPath)
	dstFullPath := s.getFullPath(dstPath)

	ctx := context.Background()
	copySource := fmt.Sprintf("%s/%s", s.bucket, srcFullPath)

	_, err := s.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(s.bucket),
		CopySource: aws.String(copySource),
		Key:        aws.String(dstFullPath),
	})
	if err != nil {
		return fmt.Errorf("failed to copy file: %w", err)
	}

	return nil
}

// Move moves a file
func (s *S3Storage) Move(srcPath, dstPath string) error {
	// Copy first
	if err := s.Copy(srcPath, dstPath); err != nil {
		return err
	}

	// Then delete source
	return s.Delete(srcPath)
}

// Exists checks if a file or directory exists
func (s *S3Storage) Exists(filePath string) (bool, error) {
	fullPath := s.getFullPath(filePath)

	ctx := context.Background()

	// Check as file
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fullPath),
	})
	if err == nil {
		return true, nil
	}

	// Check as directory
	if !strings.HasSuffix(fullPath, "/") {
		fullPath += "/"
	}

	result, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket:  aws.String(s.bucket),
		Prefix:  aws.String(fullPath),
		MaxKeys: aws.Int32(1),
	})
	if err != nil {
		return false, fmt.Errorf("failed to check existence: %w", err)
	}

	return len(result.Contents) > 0 || len(result.CommonPrefixes) > 0, nil
}

// GetInfo gets information about a file or directory
func (s *S3Storage) GetInfo(filePath string) (*FileInfo, error) {
	fullPath := s.getFullPath(filePath)

	ctx := context.Background()

	// Try as file first
	headResult, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fullPath),
	})
	if err == nil {
		return &FileInfo{
			Name:    path.Base(filePath),
			Path:    filePath,
			IsDir:   false,
			Size:    aws.ToInt64(headResult.ContentLength),
			ModTime: aws.ToTime(headResult.LastModified),
		}, nil
	}

	// Check as directory
	if !strings.HasSuffix(fullPath, "/") {
		fullPath += "/"
	}

	result, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket:  aws.String(s.bucket),
		Prefix:  aws.String(fullPath),
		MaxKeys: aws.Int32(1),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get info: %w", err)
	}

	if len(result.Contents) > 0 || len(result.CommonPrefixes) > 0 {
		return &FileInfo{
			Name:    path.Base(strings.TrimSuffix(filePath, "/")),
			Path:    filePath,
			IsDir:   true,
			Size:    0,
			ModTime: time.Now(),
		}, nil
	}

	return nil, fmt.Errorf("file not found: %s", filePath)
}

// Search searches for files matching a pattern
func (s *S3Storage) Search(dirPath, pattern string, caseSensitive, isRegex bool) ([]FileInfo, error) {
	// List all files recursively
	allFiles, err := s.listRecursive(dirPath)
	if err != nil {
		return nil, err
	}

	// Filter based on pattern
	matcher, err := createMatcher(pattern, caseSensitive, isRegex)
	if err != nil {
		return nil, err
	}

	var results []FileInfo
	for _, file := range allFiles {
		if matcher(file.Name) {
			results = append(results, file)
		}
	}

	return results, nil
}

// Helper functions

// createMatcher creates a function to match file names based on pattern
func createMatcher(pattern string, caseSensitive, isRegex bool) (func(string) bool, error) {
	if isRegex {
		flags := ""
		if !caseSensitive {
			flags = "(?i)"
		}
		re, err := regexp.Compile(flags + pattern)
		if err != nil {
			return nil, fmt.Errorf("invalid regex pattern: %w", err)
		}
		return func(name string) bool {
			return re.MatchString(name)
		}, nil
	}

	// Simple pattern matching
	if !caseSensitive {
		pattern = strings.ToLower(pattern)
		return func(name string) bool {
			return strings.Contains(strings.ToLower(name), pattern)
		}, nil
	}
	return func(name string) bool {
		return strings.Contains(name, pattern)
	}, nil
}

func (s *S3Storage) getFullPath(p string) string {
	// Remove leading slash
	p = strings.TrimPrefix(p, "/")

	// Combine with prefix
	if s.prefix != "" {
		if p != "" {
			return path.Join(s.prefix, p)
		}
		return s.prefix
	}
	return p
}

func (s *S3Storage) listRecursive(dirPath string) ([]FileInfo, error) {
	fullPath := s.getFullPath(dirPath)
	if fullPath != "" && !strings.HasSuffix(fullPath, "/") {
		fullPath += "/"
	}

	ctx := context.Background()
	var files []FileInfo

	paginator := s3.NewListObjectsV2Paginator(s.client, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucket),
		Prefix: aws.String(fullPath),
	})

	for paginator.HasMorePages() {
		output, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to list objects: %w", err)
		}

		for _, obj := range output.Contents {
			// Skip directory markers
			if strings.HasSuffix(*obj.Key, "/") {
				continue
			}

			relativePath := strings.TrimPrefix(*obj.Key, s.prefix)
			files = append(files, FileInfo{
				Name:    path.Base(*obj.Key),
				Path:    "/" + relativePath,
				IsDir:   false,
				Size:    *obj.Size,
				ModTime: *obj.LastModified,
			})
		}
	}

	return files, nil
}

func (s *S3Storage) getContentType(filePath string) string {
	ext := strings.ToLower(path.Ext(filePath))
	switch ext {
	case ".html", ".htm":
		return "text/html"
	case ".css":
		return "text/css"
	case ".js":
		return "application/javascript"
	case ".json":
		return "application/json"
	case ".xml":
		return "application/xml"
	case ".pdf":
		return "application/pdf"
	case ".zip":
		return "application/zip"
	case ".tar":
		return "application/x-tar"
	case ".gz":
		return "application/gzip"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	case ".mp4":
		return "video/mp4"
	case ".mp3":
		return "audio/mpeg"
	case ".txt":
		return "text/plain"
	default:
		return "application/octet-stream"
	}
}
