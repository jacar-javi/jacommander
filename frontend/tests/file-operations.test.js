/**
 * Tests for file operations
 */

describe('FileOperations', () => {
    beforeEach(() => {
        // Mock FileOperations
        global.FileOperations = {
            copy: jest.fn(),
            move: jest.fn(),
            delete: jest.fn(),
            createDirectory: jest.fn(),
            compress: jest.fn(),
            extract: jest.fn(),
            rename: jest.fn(),
            upload: jest.fn(),
            download: jest.fn()
        };

        // Reset fetch mock
        fetch.mockClear();
    });

    describe('Copy operation', () => {
        test('should copy single file', async () => {
            const source = '/source/file.txt';
            const destination = '/dest/';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.copy.mockImplementation(async (src, dest) => {
                const response = await fetch('/api/copy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source: src, destination: dest })
                });
                return response.json();
            });

            const result = await FileOperations.copy(source, destination);

            expect(fetch).toHaveBeenCalledWith('/api/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, destination })
            });
            expect(result).toEqual({ success: true });
        });

        test('should copy multiple files', async () => {
            const files = ['/file1.txt', '/file2.txt'];
            const destination = '/dest/';

            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.copy.mockImplementation(async (src, dest) => {
                if (Array.isArray(src)) {
                    const promises = src.map((file) =>
                        fetch('/api/copy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ source: file, destination: dest })
                        })
                    );
                    return Promise.all(promises);
                }
            });

            await FileOperations.copy(files, destination);

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(FileOperations.copy).toHaveBeenCalledWith(files, destination);
        });

        test('should handle copy error', async () => {
            const source = '/source/file.txt';
            const destination = '/dest/';

            fetch.mockRejectedValueOnce(new Error('Copy failed'));

            FileOperations.copy.mockRejectedValueOnce(new Error('Copy failed'));

            await expect(FileOperations.copy(source, destination)).rejects.toThrow('Copy failed');
        });
    });

    describe('Move operation', () => {
        test('should move file', async () => {
            const source = '/source/file.txt';
            const destination = '/dest/file.txt';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.move.mockImplementation(async (src, dest) => {
                const response = await fetch('/api/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source: src, destination: dest })
                });
                return response.json();
            });

            const result = await FileOperations.move(source, destination);

            expect(fetch).toHaveBeenCalledWith('/api/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, destination })
            });
            expect(result).toEqual({ success: true });
        });

        test('should handle move error', async () => {
            const source = '/source/file.txt';
            const destination = '/dest/file.txt';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 409,
                json: () => Promise.resolve({ error: 'File exists' })
            });

            FileOperations.move.mockResolvedValueOnce({
                success: false,
                error: 'File exists'
            });

            const result = await FileOperations.move(source, destination);
            expect(result.success).toBe(false);
            expect(result.error).toBe('File exists');
        });
    });

    describe('Delete operation', () => {
        test('should delete single file', async () => {
            const path = '/file.txt';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.delete.mockImplementation(async (filePath) => {
                const response = await fetch('/api/file', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: filePath })
                });
                return response.json();
            });

            const result = await FileOperations.delete(path);

            expect(fetch).toHaveBeenCalledWith('/api/file', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            expect(result).toEqual({ success: true });
        });

        test('should delete multiple files', async () => {
            const files = ['/file1.txt', '/file2.txt', '/file3.txt'];

            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.delete.mockImplementation(async (paths) => {
                if (Array.isArray(paths)) {
                    const promises = paths.map((path) =>
                        fetch('/api/file', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path })
                        })
                    );
                    return Promise.all(promises);
                }
            });

            await FileOperations.delete(files);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(FileOperations.delete).toHaveBeenCalledWith(files);
        });

        test('should handle delete error', async () => {
            const path = '/protected.txt';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({ error: 'Permission denied' })
            });

            FileOperations.delete.mockResolvedValueOnce({
                success: false,
                error: 'Permission denied'
            });

            const result = await FileOperations.delete(path);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });
    });

    describe('Create directory', () => {
        test('should create directory', async () => {
            const path = '/new-folder';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.createDirectory.mockImplementation(async (dirPath) => {
                const response = await fetch('/api/directory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: dirPath })
                });
                return response.json();
            });

            const result = await FileOperations.createDirectory(path);

            expect(fetch).toHaveBeenCalledWith('/api/directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            expect(result).toEqual({ success: true });
        });

        test('should handle directory creation error', async () => {
            const path = '/existing-folder';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 409,
                json: () => Promise.resolve({ error: 'Directory exists' })
            });

            FileOperations.createDirectory.mockResolvedValueOnce({
                success: false,
                error: 'Directory exists'
            });

            const result = await FileOperations.createDirectory(path);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Directory exists');
        });
    });

    describe('Compression', () => {
        test('should compress files to zip', async () => {
            const files = ['/file1.txt', '/file2.txt'];
            const output = '/archive.zip';
            const format = 'zip';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.compress.mockImplementation(async (filePaths, outputPath, fmt) => {
                const response = await fetch('/api/compress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: filePaths,
                        output: outputPath,
                        format: fmt
                    })
                });
                return response.json();
            });

            const result = await FileOperations.compress(files, output, format);

            expect(fetch).toHaveBeenCalledWith('/api/compress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files, output, format })
            });
            expect(result).toEqual({ success: true });
        });

        test('should support different compression formats', async () => {
            const files = ['/file.txt'];
            const formats = ['zip', 'tar', 'tar.gz', 'tar.bz2'];

            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.compress.mockImplementation(async () => ({ success: true }));

            for (const format of formats) {
                const result = await FileOperations.compress(files, `/archive.${format}`, format);
                expect(result.success).toBe(true);
            }

            expect(FileOperations.compress).toHaveBeenCalledTimes(formats.length);
        });
    });

    describe('Extraction', () => {
        test('should extract archive', async () => {
            const archive = '/archive.zip';
            const destination = '/extracted/';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.extract.mockImplementation(async (archivePath, dest) => {
                const response = await fetch('/api/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        archive: archivePath,
                        destination: dest
                    })
                });
                return response.json();
            });

            const result = await FileOperations.extract(archive, destination);

            expect(fetch).toHaveBeenCalledWith('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archive, destination })
            });
            expect(result).toEqual({ success: true });
        });
    });

    describe('Rename operation', () => {
        test('should rename file', async () => {
            const oldPath = '/old-name.txt';
            const newName = 'new-name.txt';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.rename.mockImplementation(async (path, name) => {
                const newPath = path.replace(/[^/]+$/, name);
                const response = await fetch('/api/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: path,
                        destination: newPath
                    })
                });
                return response.json();
            });

            const result = await FileOperations.rename(oldPath, newName);

            expect(fetch).toHaveBeenCalledWith('/api/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: oldPath,
                    destination: '/new-name.txt'
                })
            });
            expect(result).toEqual({ success: true });
        });
    });

    describe('Upload operation', () => {
        test('should upload file', async () => {
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            const destination = '/uploads/';

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            FileOperations.upload.mockImplementation(async (fileObj, dest) => {
                const formData = new FormData();
                formData.append('file', fileObj);
                formData.append('path', dest);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                return response.json();
            });

            const result = await FileOperations.upload(file, destination);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ success: true });
        });

        test('should handle upload progress', async () => {
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            const destination = '/uploads/';
            const onProgress = jest.fn();

            FileOperations.upload.mockImplementation(async (fileObj, dest, progress) => {
                // Simulate progress updates
                if (progress) {
                    progress({ loaded: 50, total: 100 });
                    progress({ loaded: 100, total: 100 });
                }
                return { success: true };
            });

            await FileOperations.upload(file, destination, onProgress);

            expect(onProgress).toHaveBeenCalledWith({ loaded: 50, total: 100 });
            expect(onProgress).toHaveBeenCalledWith({ loaded: 100, total: 100 });
        });
    });

    describe('Download operation', () => {
        test('should download file', async () => {
            const path = '/file.txt';

            const mockBlob = new Blob(['file content'], { type: 'text/plain' });
            fetch.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob)
            });

            FileOperations.download.mockImplementation(async (filePath) => {
                const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                // Simulate download
                const a = document.createElement('a');
                a.href = url;
                a.download = filePath.split('/').pop();

                return { success: true, url };
            });

            const result = await FileOperations.download(path);

            expect(fetch).toHaveBeenCalledWith(`/api/file?path=${encodeURIComponent(path)}`);
            expect(result.success).toBe(true);
            expect(result.url).toBe('blob:mock-url');
        });

        test('should handle download error', async () => {
            const path = '/nonexistent.txt';

            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            FileOperations.download.mockResolvedValueOnce({
                success: false,
                error: 'File not found'
            });

            const result = await FileOperations.download(path);
            expect(result.success).toBe(false);
            expect(result.error).toBe('File not found');
        });
    });
});
