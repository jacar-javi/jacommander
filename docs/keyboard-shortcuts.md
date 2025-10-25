# Keyboard Shortcuts Reference

## Function Keys (F1-F12)

### F1 - Help
**Display keyboard shortcuts and help**

- **Action**: Opens help overlay with all shortcuts
- **Context**: Available everywhere
- **Tip**: Press `Esc` to close help

---

### F2 - Terminal
**Open integrated terminal**

- **Action**: Opens xterm.js terminal emulator
- **Context**: Available in file panel
- **Features**:
  - Opens in current directory
  - Full terminal emulation
  - Copy/paste support
  - Resizable window
- **Close**: `Esc` or close button

---

### F3 - View File
**View file content**

- **Action**: Opens file viewer
- **Context**: File selected in panel
- **Supports**:
  - Text files (syntax highlighting)
  - Images (JPEG, PNG, GIF, SVG, WebP)
  - PDFs (embedded viewer)
  - Binary files (hex editor)
- **Navigation**:
  - `↑/↓`: Scroll
  - `Page Up/Down`: Page scroll
  - `Home/End`: Jump to start/end
- **Close**: `Esc` or `F3` again

---

### F4 - Edit File
**Edit file in browser**

- **Action**: Opens file editor
- **Context**: File selected in panel
- **Features**:
  - Syntax highlighting
  - Line numbers
  - Auto-save option
  - Search/replace
- **Save**: `Ctrl+S`
- **Close**: `Esc` without saving, or save and close

---

### F5 - Copy
**Copy selected files**

- **Action**: Copy to opposite panel
- **Context**: Files selected in panel
- **Behavior**:
  - Shows progress dialog
  - Handles conflicts (skip/overwrite/rename)
  - Preserves timestamps
  - Recursive for directories
- **Cancel**: `Esc` during operation

---

### F6 - Move/Rename
**Move or rename files**

- **Action**: Move to opposite panel or rename
- **Context**: Files selected in panel
- **Modes**:
  - Single file: Shows rename dialog
  - Multiple files: Shows move/batch rename dialog
- **Options**:
  - Simple rename
  - Batch rename with patterns
  - Move to custom path
- **Cancel**: `Esc`

---

### F7 - Create Directory
**Create new folder**

- **Action**: Shows directory creation dialog
- **Context**: Available in panel
- **Features**:
  - Create single directory
  - Create nested paths (mkdir -p)
  - Set permissions (optional)
- **Confirm**: `Enter`
- **Cancel**: `Esc`

---

### F8 - Delete
**Delete selected files**

- **Action**: Delete with confirmation
- **Context**: Files selected in panel
- **Features**:
  - Confirmation dialog
  - Shows file count and size
  - Recursive deletion
  - Secure deletion option
- **Confirm**: `Enter` or `Y`
- **Cancel**: `Esc` or `N`

---

### F9 - Settings
**Open settings panel**

- **Action**: Shows application settings
- **Context**: Available everywhere
- **Settings**:
  - Language
  - Theme
  - Date/time format
  - File size display
  - Panel layout
  - Keyboard shortcuts
  - Cloud storage
  - Security
- **Apply**: Click "Save" or `Ctrl+S`
- **Close**: `Esc`

---

### F10 - Menu
**Toggle menu bar**

- **Action**: Show/hide menu bar
- **Context**: Available everywhere
- **Menu Items**:
  - File operations
  - View options
  - Settings
  - Help

---

### F11 - Fullscreen
**Toggle fullscreen mode**

- **Action**: Enter/exit fullscreen
- **Context**: Available everywhere
- **Note**: Browser-dependent, may require permission
- **Exit**: `F11` or `Esc` (in some browsers)

---

### F12 - Developer Tools
**Open browser developer tools**

- **Action**: Opens browser DevTools
- **Context**: Available everywhere
- **Note**: Browser feature, not application-specific

---

## Navigation Shortcuts

### Arrow Keys
**Navigate file list**

- **↑**: Move selection up
- **↓**: Move selection down
- **←**: Collapse directory (tree view)
- **→**: Expand directory (tree view)

### Enter
**Open item**

- **On Directory**: Enter directory
- **On File**: Open with default viewer (F3)
- **On Archive**: Browse archive contents

### Backspace
**Go to parent directory**

- **Action**: Navigate up one level
- **Equivalent**: Click ".." entry

### Home
**Jump to first item**

- **Action**: Select first file/directory in list
- **Fast Navigation**: Scroll to top

### End
**Jump to last item**

- **Action**: Select last file/directory in list
- **Fast Navigation**: Scroll to bottom

### Page Up
**Scroll up one page**

- **Action**: Move selection up by visible items count
- **Keeps**: Selection visible

### Page Down
**Scroll down one page**

- **Action**: Move selection down by visible items count
- **Keeps**: Selection visible

---

## Panel Control

### Tab
**Switch between panels**

- **Action**: Toggle focus between left and right panel
- **Visual**: Highlights active panel
- **Tip**: Use before copy/move operations

### Ctrl+U
**Swap panel contents**

- **Action**: Exchange left and right panel directories
- **Use Case**: Quick panel reorganization

### Ctrl+R
**Refresh active panel**

- **Action**: Reload directory listing
- **Use Case**: After external file changes
- **Shortcut**: `F5` in some file managers

### Ctrl+\\
**Equal panel sizing**

- **Action**: Reset panels to 50/50 split
- **Use Case**: After manual resizing

---

## Selection Shortcuts

### Insert
**Toggle selection and move down**

- **Action**:
  1. Toggle current item selection
  2. Move to next item
- **Use Case**: Quickly select multiple files
- **Visual**: Selected files highlighted

### Space
**Quick select with size calculation**

- **Action**: Toggle selection with cumulative size display
- **Shows**: Total size of selected files
- **Stays**: On current item (doesn't move down)

### Ctrl+A
**Select all**

- **Action**: Select all files in active panel
- **Excludes**: Parent directory (..)
- **Visual**: All items highlighted

### Ctrl+\\ (Backslash)
**Deselect all**

- **Action**: Clear all selections in active panel
- **Use Case**: Reset after bulk operations

### Shift+↑
**Extend selection up**

- **Action**: Range select from current to previous
- **Behavior**: Extends existing selection

### Shift+↓
**Extend selection down**

- **Action**: Range select from current to next
- **Behavior**: Extends existing selection

### Ctrl+Click
**Toggle individual selection**

- **Action**: Add/remove single item from selection
- **Keeps**: Existing selections

### Shift+Click
**Range selection**

- **Action**: Select all items between last selection and click
- **Replaces**: Previous selection

---

## File Operations

### Ctrl+C
**Copy to clipboard (internal)**

- **Action**: Copy selection to internal clipboard
- **Use With**: `Ctrl+V` to paste
- **Note**: Internal to JaCommander, not OS clipboard

### Ctrl+X
**Cut to clipboard (internal)**

- **Action**: Cut selection to internal clipboard
- **Use With**: `Ctrl+V` to paste (moves files)
- **Visual**: Dimmed files indicate cut state

### Ctrl+V
**Paste from clipboard**

- **Action**: Paste copied/cut files to active panel
- **Behavior**:
  - Copy: Duplicates files
  - Cut: Moves files

### Ctrl+D
**Duplicate file**

- **Action**: Create copy in same directory
- **Naming**: Adds " - Copy" suffix
- **Works On**: Single selection

### Delete
**Delete key (alternative to F8)**

- **Action**: Delete selected files
- **Confirmation**: Shows dialog
- **Same As**: `F8`

---

## Search and Filter

### Ctrl+S
**Advanced search**

- **Action**: Opens search dialog
- **Modes**:
  - Name search (wildcards)
  - Content search (text)
  - Pattern search (regex)
- **Options**:
  - Case sensitivity
  - Subdirectories
  - File type filter
  - Date range
  - Size range
- **Navigate Results**: `↑/↓`
- **Open Result**: `Enter`
- **Close**: `Esc`

### Ctrl+F
**Quick filter (inline)**

- **Action**: Filter current directory
- **Type**: Live filtering as you type
- **Clear**: `Esc`

### /
**Quick search**

- **Action**: Jump to file starting with typed characters
- **Behavior**: Type-ahead find
- **Example**: Type "doc" to jump to "documents"

---

## Compression Shortcuts

### Alt+F5
**Compress selected files**

- **Action**: Create archive from selection
- **Formats**: ZIP, TAR, TAR.GZ
- **Options**:
  - Archive name
  - Compression level
  - Password (ZIP only)
- **Confirm**: `Enter`
- **Cancel**: `Esc`

### Alt+F6
**Extract archive**

- **Action**: Extract selected archive
- **Supports**: ZIP, TAR, TAR.GZ, GZ, BZ2
- **Options**:
  - Extraction path
  - Overwrite behavior
  - Preserve permissions
- **Confirm**: `Enter`
- **Cancel**: `Esc`

---

## Tab Management

### Ctrl+T
**New tab**

- **Action**: Open new tab in active panel
- **Location**: Current directory
- **Limit**: Unlimited tabs

### Ctrl+W
**Close tab**

- **Action**: Close active tab
- **Behavior**: Cannot close last tab
- **Confirmation**: If unsaved changes exist

### Ctrl+Tab
**Next tab**

- **Action**: Switch to next tab (right)
- **Wraps**: To first tab after last

### Ctrl+Shift+Tab
**Previous tab**

- **Action**: Switch to previous tab (left)
- **Wraps**: To last tab before first

### Ctrl+1 through Ctrl+9
**Jump to tab**

- **Action**: Switch to specific tab number
- **Range**: 1-9
- **Beyond 9**: Use `Ctrl+Tab`

---

## Bookmarks

### Ctrl+D
**Add bookmark**

- **Action**: Bookmark current directory
- **Prompts**: For bookmark name
- **Assigns**: Next available shortcut (Ctrl+1-9)

### Ctrl+B
**Show bookmarks**

- **Action**: Display bookmarks menu
- **Navigate**: `↑/↓`
- **Select**: `Enter`
- **Edit**: `E`
- **Delete**: `Delete`
- **Close**: `Esc`

### Ctrl+1 through Ctrl+9
**Go to bookmark**

- **Action**: Jump to bookmarked directory
- **Requires**: Bookmark assigned to number
- **Fast**: Direct navigation

---

## View Options

### Ctrl+H
**Toggle hidden files**

- **Action**: Show/hide dotfiles and hidden files
- **Persistent**: Saved to preferences
- **Visual**: Hidden files often dimmed

### Ctrl+L
**Toggle details view**

- **Action**: Switch between list and detailed view
- **Details Show**:
  - File size
  - Modified date
  - Permissions
  - Owner/group

### Ctrl+I
**File information**

- **Action**: Show detailed file properties
- **Displays**:
  - Full path
  - Size
  - Created/modified dates
  - Permissions
  - MIME type
  - MD5/SHA checksums (optional)

---

## Terminal Shortcuts

**When terminal is open (F2):**

### Ctrl+Shift+C
**Copy from terminal**

- **Action**: Copy selected text
- **Selection**: Click and drag to select

### Ctrl+Shift+V
**Paste to terminal**

- **Action**: Paste clipboard content
- **Source**: OS clipboard

### Ctrl+L
**Clear terminal**

- **Action**: Clear screen
- **Equivalent**: `clear` command

### Ctrl+D
**Exit terminal**

- **Action**: Send EOF, close shell
- **Behavior**: Closes terminal window

---

## Global Shortcuts

### Esc
**Cancel / Close**

- **Action**: Close dialog, cancel operation, exit mode
- **Universal**: Works in most contexts

### Ctrl+Z
**Undo (limited)**

- **Action**: Undo last rename/move operation
- **Limitation**: Not all operations support undo
- **Best Practice**: Use with caution

### Ctrl+Shift+Z
**Redo**

- **Action**: Redo undone operation
- **Requires**: Previous undo action

### Ctrl+Q
**Quit application**

- **Action**: Close JaCommander
- **Confirmation**: If operations in progress
- **Note**: Closes browser tab

---

## Customization

**Modify shortcuts:** `F9 → Settings → Keyboard`

**Custom shortcuts example:**
```json
{
  "Ctrl+Alt+C": "copyPathToClipboard",
  "Ctrl+Alt+E": "openInExternalEditor",
  "Ctrl+Alt+T": "newTerminalTab"
}
```

---

## Quick Reference Card

### Most Used
```
F5    - Copy          Tab   - Switch Panel
F6    - Move          Enter - Open
F7    - New Folder    Esc   - Cancel
F8    - Delete        Space - Select
```

### Navigation
```
↑/↓        - Navigate    Backspace - Parent Dir
Home/End   - Jump        PgUp/PgDn - Page
Ctrl+S     - Search      /         - Quick Find
```

### Selection
```
Insert  - Toggle & Move    Ctrl+A - Select All
Space   - Toggle (stay)    Ctrl+\ - Deselect All
```

### Essential
```
F3   - View      F9   - Settings
F4   - Edit      Ctrl+R - Refresh
Ctrl+Tab - Next Tab
```

---

## Platform Differences

### Windows
- `Ctrl` as modifier
- `Alt` for function variants
- `Delete` key for file deletion

### macOS
- `Cmd` instead of `Ctrl` (in some cases)
- `Option` instead of `Alt`
- `Fn+Delete` for forward delete

### Linux
- Standard `Ctrl` and `Alt`
- May vary by desktop environment
- Custom key bindings respected

---

## Tips

1. **Muscle Memory**: Learn F1-F8 first
2. **Two-Panel Workflow**: Master `Tab` + `F5`
3. **Quick Selection**: Use `Insert` for rapid multi-select
4. **Search Power**: `Ctrl+S` for complex searches
5. **Tab Efficiency**: `Ctrl+T` for parallel tasks

---

## Next Steps

- [Features Guide](features.md)
- [Configuration](configuration.md)
- [Advanced Usage](advanced.md)
