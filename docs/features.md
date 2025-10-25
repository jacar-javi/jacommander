# Features Guide

## Core Features

### Dual-Panel Interface

**Navigate two directories simultaneously**

- **Independent Panels**: Each panel maintains its own directory, selection, and state
- **Quick Switching**: Use `Tab` to move focus between panels
- **Synchronized Operations**: Copy, move, and compare files between panels
- **Panel Swap**: Exchange panel contents instantly
- **Equal/Custom Sizing**: Resize panels to your preference

**Usage:**
```
Tab              - Switch between panels
Ctrl+U           - Swap panel contents
Ctrl+R           - Refresh active panel
F10              - Toggle menu bar
```

### Keyboard-First Navigation

**Complete keyboard control for maximum efficiency**

#### Function Keys (F1-F12)
- **F1**: Show help and keyboard shortcuts
- **F2**: Open integrated terminal
- **F3**: View file content (supports text, images, PDFs)
- **F4**: Edit file in browser
- **F5**: Copy selected files to opposite panel
- **F6**: Move/rename files
- **F7**: Create new directory
- **F8**: Delete selected files
- **F9**: Open settings panel
- **F10**: Toggle menu bar
- **F11**: Toggle fullscreen mode
- **F12**: Open developer tools (browser)

#### Navigation Keys
- **Arrow Keys**: Navigate file list
- **Enter**: Open directory or file
- **Backspace**: Go to parent directory
- **Home**: Jump to first item
- **End**: Jump to last item
- **Page Up/Down**: Scroll one page

#### Selection Keys
- **Insert**: Toggle selection and move down
- **Space**: Quick select with size calculation
- **Ctrl+A**: Select all files in panel
- **Ctrl+\\**: Deselect all files
- **Shift+Arrow**: Range selection

#### Advanced Shortcuts
- **Ctrl+S**: Advanced search (name, content, pattern)
- **Ctrl+Tab**: Switch to next tab
- **Ctrl+W**: Close current tab
- **Alt+F5**: Compress selected files
- **Alt+F6**: Extract archive

### Multi-Storage Support

**Access multiple storage backends from one interface**

#### Local Filesystem
- Direct access to server filesystem
- Multiple mount points support
- Symbolic link handling
- Permission management

#### Cloud Storage
- **AWS S3**: Full S3 API compatibility
  - Multipart uploads for large files
  - Bucket management
  - Access control lists

- **Google Drive**: OAuth2 integration
  - Shared drives support
  - File sharing and permissions
  - Team drive access

- **Microsoft OneDrive**: Graph API integration
  - Personal and business accounts
  - SharePoint integration
  - Real-time collaboration

#### Remote Protocols
- **FTP/SFTP**: Legacy and secure transfers
  - Multiple server support
  - Key-based authentication
  - Resume broken transfers

- **WebDAV**: Standards-based access
  - Nextcloud/ownCloud compatibility
  - CalDAV/CardDAV support
  - HTTP digest authentication

- **NFS**: Enterprise network storage
  - NFSv3 and NFSv4 support
  - Kerberos authentication
  - High-performance transfers

#### Database Storage
- **Redis**: In-memory file storage
  - Distributed cache
  - Session storage
  - High-speed access

### Theme System

**Customizable visual experience**

#### Built-in Themes
- **Dark Mode**: Easy on the eyes for extended use
- **Light Mode**: High contrast for bright environments
- **Auto**: Follows system preference

#### Customization
- CSS variable-based theming
- Custom color schemes
- Font selection
- Panel opacity
- Syntax highlighting themes

**Toggle Theme:**
```
F9 → Appearance → Theme
```

### Internationalization (i18n)

**Support for 14+ languages**

#### Supported Languages
- English (en)
- Spanish (es)
- German (de)
- French (fr)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Hindi (hi)
- Turkish (tr)

#### Features
- Right-to-left (RTL) support for Arabic
- Date/time localization
- Number formatting
- Dynamic language switching
- User preference persistence

**Change Language:**
```
F9 → Language → Select
```

## File Operations

### Basic Operations

#### Copy Files
**Copy selected files to target panel**

```
F5                - Copy to opposite panel
Ctrl+C            - Copy selection (internal clipboard)
```

Features:
- Progress tracking for large files
- Conflict resolution (skip, overwrite, rename)
- Preserve timestamps and permissions
- Recursive directory copying

#### Move/Rename Files
**Move files or rename in place**

```
F6                - Move/rename dialog
Ctrl+X            - Cut selection
```

Features:
- Batch rename support
- Pattern-based renaming
- Cross-storage moves
- Atomic operations

#### Delete Files
**Safely remove files and directories**

```
F8                - Delete selected
Delete            - Delete key shortcut
```

Features:
- Confirmation dialog
- Recursive directory deletion
- Secure deletion option
- Trash/recycle bin support

### Advanced Operations

#### Archive Management

**Create and extract compressed archives**

**Supported Formats:**
- ZIP (compress and extract)
- TAR (compress and extract)
- TAR.GZ (compress and extract)
- GZ (extract only)
- BZ2 (extract only)

**Compress:**
```
Alt+F5            - Create archive from selection
```

Options:
- Choose compression format
- Set compression level
- Preserve directory structure
- Password protection (ZIP)

**Extract:**
```
Alt+F6            - Extract archive to current directory
```

Options:
- Extract to custom location
- Preserve permissions
- Overwrite handling
- Selective extraction

#### Batch Rename

**Rename multiple files with patterns**

**Access:** `F6 → Batch Rename`

Features:
- Search and replace
- Regular expressions
- Case conversion (upper, lower, title)
- Number sequences
- Date/time insertion
- Preview before applying

**Examples:**
```
Pattern: photo_*.jpg → vacation_*.jpg
Result: photo_001.jpg → vacation_001.jpg

Pattern: *.TXT → *.txt
Result: FILE.TXT → FILE.txt
```

#### Advanced Search

**Find files by name, content, or pattern**

**Access:** `Ctrl+S`

**Search Types:**

1. **Name Search**
   - Wildcards: `*.txt`, `file?.log`
   - Case sensitivity toggle
   - Subdirectory recursion

2. **Content Search**
   - Full-text search
   - Regular expressions
   - Binary file exclusion
   - Size limits

3. **Pattern Search**
   - Date modified filters
   - Size range filters
   - File type filters
   - Permission filters

**Example Patterns:**
```
*.{js,ts,jsx,tsx}          - All JavaScript/TypeScript files
file[0-9]{3}.log           - Files like file001.log, file999.log
*test*.go                  - All Go test files
```

### File Preview

**View files without opening external applications**

#### Supported Formats

**Text Files:**
- Syntax highlighting for 50+ languages
- Line numbers
- Word wrap toggle
- Search within file

**Images:**
- JPEG, PNG, GIF, SVG, WebP, BMP
- Zoom and pan
- EXIF data display
- Thumbnail generation

**Documents:**
- PDF viewing (embedded reader)
- Markdown rendering
- HTML preview
- CSV/TSV tables

**Binary Files:**
- Hex editor mode
- ASCII representation
- Address display
- Byte highlighting

**Access:** `F3` on any file

## Advanced Features

### Multi-Tab Support

**Work with multiple locations simultaneously**

**Features:**
- Unlimited tabs per panel
- Persistent tab state
- Tab reordering
- Duplicate tab
- Close all but this

**Shortcuts:**
```
Ctrl+T            - New tab
Ctrl+W            - Close current tab
Ctrl+Tab          - Next tab
Ctrl+Shift+Tab    - Previous tab
```

### Integrated Terminal

**Full xterm.js terminal emulator**

**Access:** `F2`

**Features:**
- Full terminal emulation
- Current directory sync
- Copy/paste support
- Resize terminal
- Multiple terminal tabs
- Shell customization

**Usage:**
- Opens in current panel directory
- Execute commands directly
- Scripts and automation
- System administration

### Bookmarks System

**Quick access to frequently used directories**

**Features:**
- Unlimited bookmarks
- Custom names
- Keyboard shortcuts (Ctrl+1 to Ctrl+9)
- Cross-storage support
- Import/export bookmarks

**Manage Bookmarks:**
```
Ctrl+D            - Add current directory
Ctrl+B            - Show bookmarks menu
Ctrl+1...9        - Jump to bookmark
```

### Drag and Drop

**Mouse-based file operations**

**Supported Operations:**
- Drag files between panels
- Drag to external applications
- Drop files from desktop
- Drag to upload
- Visual drop zones

**Features:**
- Progress indication
- Multi-file support
- Conflict resolution
- Cancel mid-transfer

### Docker Management

**Manage Docker containers from the interface**

**Features:**
- List running containers
- Start/stop containers
- View container logs
- Execute commands in containers
- Container resource usage
- Image management

**Access:** `F9 → Docker`

### Custom Commands

**Define reusable command sequences**

**Features:**
- Custom keyboard shortcuts
- Parameter substitution
- Multi-command sequences
- Environment variables
- Conditional execution

**Examples:**
```json
{
  "name": "Convert to WebP",
  "command": "cwebp ${file} -o ${file%.png}.webp",
  "shortcut": "Ctrl+Alt+W"
}
```

### Session Persistence

**Restore your workspace automatically**

**Saved State:**
- Panel directories
- Tab configurations
- Active selections
- Window size/position
- Theme preferences
- Language settings

**Auto-restore on:**
- Browser refresh
- Application restart
- Crash recovery

## Performance Features

### Virtual Scrolling

**Handle directories with thousands of files**

**Features:**
- Render only visible items
- Smooth scrolling
- Instant navigation
- Low memory usage
- Handles 100,000+ files

### WebSocket Updates

**Real-time operation progress**

**Provides:**
- Upload/download progress
- Compression progress
- Copy/move progress
- File count updates
- Speed calculations
- ETA estimates

### Caching

**Intelligent caching for speed**

**Cached Data:**
- Directory listings
- File thumbnails
- Preview content
- Search results
- API responses

**Configuration:**
```env
CACHE_ENABLED=true
CACHE_SIZE_MB=256
```

## Security Features

### Authentication

**Optional user authentication**

**Features:**
- JWT-based sessions
- Configurable timeout
- Password hashing
- Session management
- Remember me option

### Path Traversal Prevention

**Automatic protection against directory traversal attacks**

**Protected Operations:**
- All file reads
- Directory listings
- File uploads
- Archive extraction

### Rate Limiting

**Prevent abuse and DoS attacks**

**Limits:**
- API requests per minute
- Upload bandwidth
- Concurrent connections
- WebSocket connections

### IP Validation

**Whitelist/blacklist IP addresses**

**Configuration:**
```env
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
BLOCKED_IPS=203.0.113.0/24
```

## Next Steps

- [Learn Keyboard Shortcuts](keyboard-shortcuts.md)
- [Configure Storage Backends](storage-backends.md)
- [API Documentation](api.md)
- [Troubleshooting](troubleshooting.md)
