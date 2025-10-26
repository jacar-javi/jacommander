// simple-i18n.js - Multi-language support for JaCommander
/* global twemoji */
/* eslint-disable no-console */
import { languagePack, languageMetadata } from './language-pack.js';

export class SimpleI18n {
    constructor(app) {
        this.app = app;
        this.currentLang = 'en';
        this.translations = {
            en: {
                // Header
                'app.title': 'JaCommander',
                menu: 'Menu',
                'keyboard.shortcuts': 'Keyboard Shortcuts',
                configuration: 'Configuration',
                'toggle.theme': 'Toggle Theme',

                // Footer buttons
                'f1.help': 'F1 Help',
                'f2.menu': 'F2 Menu',
                'f3.view': 'F3 View',
                'f4.edit': 'F4 Edit',
                'f5.copy': 'F5 Copy',
                'f6.move': 'F6 Move',
                'f7.mkdir': 'F7 MkDir',
                'f8.delete': 'F8 Delete',
                'f9.menu': 'F9 Menu',
                'f10.exit': 'F10 Exit',
                'f11.terminal': 'F11 Term',
                'f12.settings': 'F12 Settings',

                // Panel headers
                name: 'Name',
                size: 'Size',
                modified: 'Modified',
                items: 'items',
                selected: 'selected',

                // Operations
                copy: 'Copy',
                move: 'Move',
                delete: 'Delete',
                rename: 'Rename',
                'new.folder': 'New Folder',
                'new.file': 'New File',
                refresh: 'Refresh',
                search: 'Search',
                'select.all': 'Select All',
                'deselect.all': 'Deselect All',

                // File operations
                copying: 'Copying',
                moving: 'Moving',
                deleting: 'Deleting',
                creating: 'Creating',
                extracting: 'Extracting',
                compressing: 'Compressing',

                // Dialogs
                confirm: 'Confirm',
                cancel: 'Cancel',
                ok: 'OK',
                yes: 'Yes',
                no: 'No',
                error: 'Error',
                warning: 'Warning',
                info: 'Information',
                success: 'Success',

                // Messages
                'file.exists': 'File already exists',
                'overwrite.confirm': 'Do you want to overwrite?',
                'delete.confirm': 'Are you sure you want to delete?',
                'operation.complete': 'Operation completed',
                'operation.failed': 'Operation failed',

                // Context menu
                open: 'Open',
                'open.with': 'Open With',
                cut: 'Cut',
                'copy.to': 'Copy To',
                'move.to': 'Move To',
                properties: 'Properties',

                // Search
                'search.placeholder': 'Search files...',
                'search.results': 'Search Results',
                'no.results': 'No results found',

                // Settings
                settings: 'Settings',
                language: 'Language',
                theme: 'Theme',
                'font.size': 'Font Size',
                'show.hidden': 'Show Hidden Files',
                'confirm.delete': 'Confirm Delete',
                save: 'Save',

                // Terminal
                terminal: 'Terminal',
                clear: 'Clear',
                close: 'Close',

                // Tabs
                'tabs.max_reached': 'Maximum number of tabs reached',
                'tabs.cannot_close_last': 'Cannot close the last tab',
                'tabs.no_recently_closed': 'No recently closed tabs',
                'tabs.max_allowed': 'Maximum {max} tabs allowed per panel',
                'tabs.path_copied': 'Path copied to clipboard',
                'tabs.close_all': 'Close All Tabs',
                'tabs.close_all_confirm': 'Close all tabs except the first one?',

                // Cloud Storage
                'storage.fill_required': 'Please fill in all required fields',
                'storage.added': 'Cloud storage added successfully',
                'storage.add_failed': 'Failed to add storage',
                'storage.default_updated': 'Default storage updated',
                'storage.default_failed': 'Failed to set default storage',
                'storage.removed': 'Storage removed successfully',
                'storage.remove_failed': 'Failed to remove storage',
                'storage.remove_confirm': 'Remove Storage',
                'storage.remove_message': 'Are you sure you want to remove this storage?',
                'storage.remove_button': 'Remove',

                // Docker
                'docker.starting': 'Starting {name}...',
                'docker.stopping': 'Stopping {name}...',
                'docker.restarting': 'Restarting {name}...',
                'docker.terminal_unavailable': 'Terminal not available',
                'docker.added_to_storage': 'Added {name} to storage',
                'docker.starting_containers': 'Starting {count} containers...',
                'docker.stopping_containers': 'Stopping {count} containers...',
                'docker.removed_containers': 'Removed {count} containers',
                'docker.remove_container': 'Remove Container',
                'docker.remove_confirm': 'Remove container {name}?',
                'docker.remove_stopped': 'Remove Stopped Containers',
                'docker.remove_stopped_confirm': 'Remove {count} stopped containers?',

                // Drag & Drop
                'dragdrop.operation': '{action} {count} file(s)...',
                'dragdrop.failed': 'Failed to {operation} files',

                // WebSocket
                'ws.connection_lost': 'Connection lost. Please refresh the page.',
                'ws.operation_completed': '{operation} completed',
                'ws.operation_failed': '{operation} failed',
                'ws.operation_cancelled': '{operation} cancelled',

                // Theme
                'theme.switched': 'Theme: {theme}',

                // Breadcrumb
                'breadcrumb.path_copied': 'Path copied: {path}',
                'breadcrumb.syncing': 'Syncing with {panel} panel...',
                'breadcrumb.sync_success': 'Panels synced successfully',
                'breadcrumb.sync_failed': 'Failed to sync panels',
                'breadcrumb.no_storage': 'Other panel has no storage',
                'breadcrumb.refreshing': 'Refreshing directory...',

                // Navigation History
                'history.clear': 'Clear History',
                'history.clear_confirm': 'Clear all navigation history?',

                // Custom Commands
                'commands.execute': 'Execute Command',
                'commands.execute_confirm': 'Execute command: {name}?',
                'commands.delete': 'Delete Command',
                'commands.delete_confirm': 'Delete this command?',
                'commands.reset': 'Reset Commands',
                'commands.reset_confirm': 'Reset all commands to defaults? This will delete all custom commands.',
                'commands.name_required': 'Name and command are required',
                'commands.enter_to_test': 'Enter a command to test',
                'commands.import_failed': 'Failed to import commands: {error}',
                'commands.executed': 'Command "{name}" executed successfully',
                'commands.saved': 'Command saved successfully',
                'commands.imported': 'Commands imported successfully',
                'commands.reset_done': 'Commands reset to defaults',

                // Modals - Titles & Content
                'modal.keyboard_shortcuts': 'Keyboard Shortcuts',
                'modal.view_file': 'View File',
                'modal.edit_file': 'Edit File',
                'modal.copy_files': 'Copy Files',
                'modal.create_directory': 'Create Directory',
                'modal.confirm_delete': 'Confirm Delete',
                'modal.compress_files': 'Compress Files',
                'modal.search_files': 'Search Files',
                'modal.confirm_title': 'Confirm',
                'modal.delete_message': 'Are you sure you want to delete the following files?',
                'modal.copy_message': 'Copy selected files to:',
                'modal.directory_name_label': 'Directory name:',
                'modal.archive_name_label': 'Archive name:',
                'modal.format_label': 'Format:',
                'modal.search_for_label': 'Search for:',
                'modal.results_label': 'Results:',
                'modal.confirm_message_default': 'Are you sure?',
                'modal.loading': 'Loading...',

                // Buttons
                'button.save': 'Save',
                'button.close_esc': 'Close (ESC)',
                'button.save_ctrl_s': 'Save (Ctrl+S)',
                'button.create': 'Create',
                'button.compress': 'Compress',
                'button.search': 'Search',
                'button.copy': 'Copy',
                'button.move': 'Move',
                'button.delete': 'Delete',
                'button.yes': 'Yes',
                'button.no': 'No',
                'button.cancel': 'Cancel',

                // Tooltips - Header
                'tooltip.menu_f9': 'Menu (F9)',
                'tooltip.keyboard_shortcuts_ctrlk': 'Keyboard Shortcuts (Ctrl+K)',
                'tooltip.configuration': 'Configuration',
                'tooltip.toggle_theme': 'Toggle Theme',
                'tooltip.backend_connected': 'Backend Connected',
                'tooltip.backend_error': 'Backend Error',
                'tooltip.backend_disconnected': 'Backend Disconnected',
                'tooltip.backend_status': 'Backend Connection Status',

                // Tooltips - Footer
                'tooltip.help': 'Help',
                'tooltip.menu': 'Menu',
                'tooltip.view': 'View',
                'tooltip.edit': 'Edit',
                'tooltip.copy': 'Copy',
                'tooltip.move': 'Move',
                'tooltip.new_folder': 'New Folder',
                'tooltip.delete': 'Delete',
                'tooltip.exit': 'Exit',
                'tooltip.terminal': 'Terminal',
                'tooltip.settings': 'Settings',

                // Tooltips - Bookmarks
                'tooltip.bookmarks_add': 'Add current directory',
                'tooltip.bookmarks_manage': 'Manage bookmarks',
                'tooltip.bookmarks_toggle': 'Toggle sidebar',
                'tooltip.bookmarks_edit': 'Edit',
                'tooltip.bookmarks_delete': 'Delete',

                // Tooltips - Navigation
                'tooltip.nav_back': 'Back (Alt+Left)',
                'tooltip.nav_forward': 'Forward (Alt+Right)',
                'tooltip.nav_up': 'Parent Directory (Alt+Up)',
                'tooltip.nav_refresh': 'Refresh (F5)',
                'tooltip.nav_history': 'History',
                'tooltip.breadcrumb_refresh': 'Refresh directory (F5)',
                'tooltip.breadcrumb_sync': 'Sync storage and path with other panel',

                // Tooltips - Terminal
                'tooltip.terminal_new': 'New Terminal',
                'tooltip.terminal_clear': 'Clear (Ctrl+L)',
                'tooltip.terminal_search': 'Search (Ctrl+Shift+F)',
                'tooltip.terminal_split_h': 'Split Horizontal',
                'tooltip.terminal_split_v': 'Split Vertical',
                'tooltip.terminal_settings': 'Settings',
                'tooltip.terminal_close': 'Close Terminal',

                // Tooltips - Hex Editor
                'tooltip.hex_save': 'Save changes',
                'tooltip.hex_undo': 'Undo',
                'tooltip.hex_redo': 'Redo',
                'tooltip.hex_find': 'Find',
                'tooltip.hex_goto': 'Go to offset',

                // Tooltips - Docker
                'tooltip.docker_title': 'Docker Containers (Ctrl+D)',
                'tooltip.docker_refresh': 'Refresh',
                'tooltip.docker_stop': 'Stop',
                'tooltip.docker_restart': 'Restart',
                'tooltip.docker_pause': 'Pause',
                'tooltip.docker_unpause': 'Unpause',
                'tooltip.docker_logs': 'Logs',
                'tooltip.docker_terminal': 'Terminal',
                'tooltip.docker_start': 'Start',
                'tooltip.docker_remove': 'Remove',
                'tooltip.docker_inspect': 'Inspect',
                'tooltip.docker_files': 'Browse Files',

                // Tooltips - Tabs
                'tooltip.tab_new': 'New Tab (Ctrl+T)',
                'tooltip.tab_menu': 'Tab Menu',
                'tooltip.tab_close': 'Close Tab',
                'tooltip.tab_close_ctrl_w': 'Close Tab (Ctrl+W)',

                // Tooltips - Custom Commands
                'tooltip.commands_settings': 'Settings',
                'tooltip.commands_toggle': 'Toggle Command Bar',

                // Context Menu
                'context.view_f3': 'View (F3)',
                'context.edit_f4': 'Edit (F4)',
                'context.copy_f5': 'Copy (F5)',
                'context.cut_f6': 'Cut (F6)',
                'context.rename': 'Rename',
                'context.compress': 'Compress',
                'context.delete_f8': 'Delete (F8)',

                // Search Options
                'search.case_sensitive': 'Case sensitive',
                'search.use_regex': 'Use regex',
                'search.include_subdirs': 'Include subdirectories',

                // Bookmarks
                'bookmarks.already_exists': 'This directory is already bookmarked',
                'bookmarks.enter_name_and_path': 'Please enter both name and path',
                'bookmarks.enter_category': 'Enter new category name:',
                'bookmarks.import_failed': 'Failed to import bookmarks: {error}',
                'bookmarks.imported': 'Bookmarks imported successfully',
                'bookmarks.all_cleared': 'All bookmarks cleared',
                'bookmarks.saved': 'Bookmark saved successfully',

                // File Operations
                'fileops.no_file_selected': 'No file selected',
                'fileops.no_files_selected': 'No files selected',
                'fileops.select_one_to_rename': 'Select exactly one file to rename',
                'fileops.select_one_archive': 'Select exactly one archive to decompress',
                'fileops.enter_filename': 'Enter filename:',
                'fileops.rename_to': 'Rename to:',
                'fileops.enter_directory_name': 'Please enter a directory name',
                'fileops.enter_archive_name': 'Please enter an archive name',
                'fileops.view_failed': 'Failed to view file: {error}',
                'fileops.edit_failed': 'Failed to edit file: {error}',
                'fileops.save_success': 'File saved successfully',
                'fileops.save_failed': 'Failed to save file: {error}',
                'fileops.create_success': 'File created successfully',
                'fileops.create_failed': 'Failed to create file: {error}',
                'fileops.copy_success': 'Files copied successfully',
                'fileops.move_success': 'Files moved successfully',
                'fileops.operation_failed': 'Failed to {operation} files: {error}',
                'fileops.rename_success': 'File renamed successfully',
                'fileops.rename_failed': 'Failed to rename file: {error}',
                'fileops.mkdir_success': 'Directory created successfully',
                'fileops.mkdir_failed': 'Failed to create directory: {error}',
                'fileops.delete_success': 'Files deleted successfully',
                'fileops.delete_failed': 'Failed to delete files: {error}',
                'fileops.compress_started': 'Compression started',
                'fileops.compress_failed': 'Failed to compress files: {error}',
                'fileops.decompress_started': 'Decompression started',
                'fileops.decompress_failed': 'Failed to decompress file: {error}',
                'fileops.load_directory_failed': 'Failed to load directory: {error}',
                'fileops.copy_with_options': 'Copy with options not implemented yet',
                'fileops.close_browser_tab': 'Please close the browser tab to exit',

                // Keyboard Shortcuts
                'shortcuts.help': 'Help',
                'shortcuts.user_menu': 'User Menu',
                'shortcuts.view_file': 'View File',
                'shortcuts.edit_file': 'Edit File',
                'shortcuts.copy_files': 'Copy Files',
                'shortcuts.move_rename': 'Move/Rename',
                'shortcuts.create_directory': 'Create Directory',
                'shortcuts.delete': 'Delete',
                'shortcuts.menu': 'Menu',
                'shortcuts.exit': 'Exit',
                'shortcuts.switch_panel': 'Switch Panel',
                'shortcuts.select_item': 'Select Item',
                'shortcuts.select_all': 'Select All',
                'shortcuts.deselect_all': 'Deselect All',
                'shortcuts.refresh': 'Refresh',
                'shortcuts.search': 'Search',
                'shortcuts.compress': 'Compress',
                'shortcuts.decompress': 'Decompress',
                'shortcuts.new_file': 'New File',
                'shortcuts.rename': 'Rename',
                'shortcuts.customize': 'Customize Shortcuts',
                'shortcuts.new_tab': 'New Tab',
                'shortcuts.close_tab': 'Close Tab',
                'shortcuts.next_tab': 'Next Tab',
                'shortcuts.prev_tab': 'Previous Tab',
                'shortcuts.goto_tab_n': 'Go to Tab N',
                'shortcuts.saved': 'Shortcuts saved successfully',
                'shortcuts.save_failed': 'Failed to save shortcuts',
                'shortcuts.reset': 'Shortcuts reset to defaults',
                'shortcuts.exported': 'Shortcuts exported successfully',
                'shortcuts.imported': 'Shortcuts imported successfully',
                'shortcuts.import_failed': 'Failed to import shortcuts',

                // Keyboard Messages
                'keyboard.user_menu_not_implemented': 'User menu not implemented yet',
                'keyboard.search_term_required': 'Please enter a search term',
                'keyboard.search_results': 'Found {count} result(s)',
                'keyboard.search_failed': 'Search failed',

                // Batch Rename
                'rename.no_files': 'No files to rename',
                'rename.success': 'Successfully renamed {count} files',
                'rename.partial_success': 'Renamed {success} files, {failed} failed',

                // Terminal
                'terminal.search_prompt': 'Search in terminal:',
                'terminal.multiple_coming_soon': 'Multiple terminals coming soon!',
                'terminal.split_coming_soon': 'Split terminal coming soon!',
                'terminal.settings_coming_soon': 'Terminal settings coming soon!',

                // Hex Editor
                'hex.enter_offset_prompt': 'Enter offset (decimal or hex with 0x prefix):',

                // Advanced Search
                'advanced_search.enter_path': 'Enter search path:',
                'advanced_search.enter_name': 'Enter name for saved search:',
                'advanced_search.saved': 'Search saved successfully!',
                'advanced_search.no_saved': 'No saved searches found',
                'advanced_search.select_prompt': 'Select saved search:\n{names}',
                'advanced_search.loaded': 'Search loaded successfully!',

                // Security
                'security.local_ips_enabled': 'Local IP connections enabled',
                'security.local_ips_blocked': 'Local IP connections blocked',
                'security.update_failed': 'Failed to update security settings',

                // Upload
                'upload.no_valid_files': 'No valid files to upload',
                'upload.success': '✅ Uploaded {name}',
                'upload.failed': '❌ Failed to upload {name}: {error}',

                // App
                'app.menu_not_implemented': 'Menu not implemented yet',
                'app.config_not_implemented': 'Configuration not implemented yet',

                // Drag & Drop
                'dragdrop.copy_label': 'COPY',
                'dragdrop.move_label': 'MOVE',
                'dragdrop.drop_to_upload': '📥 Drop files here to upload',
                'dragdrop.success': 'Successfully {operation} {count} file(s)',

                // Placeholders
                'placeholder.new_folder': 'New Folder',
                'placeholder.archive_zip': 'archive.zip',
                'placeholder.search_pattern': 'Enter filename or pattern...',
                'placeholder.rename_prefix': 'e.g., IMG_',
                'placeholder.rename_suffix': 'e.g., _backup',
                'placeholder.rename_find': 'Text to find',
                'placeholder.rename_replace': 'Replacement text',
                'placeholder.rename_extension': 'e.g., jpg',
                'placeholder.bookmarks_search': 'Search bookmarks...',
                'placeholder.bookmark_name': 'Bookmark name',
                'placeholder.bookmark_path': '/path/to/directory',
                'placeholder.bookmark_description': 'Optional description',
                'placeholder.command_search': 'Type command or search...',
                'placeholder.command_name': 'Command name',
                'placeholder.command_description': 'What this command does',
                'placeholder.command_command': 'Shell command to execute',
                'placeholder.command_hotkey': 'e.g., Ctrl+Shift+G',
                'placeholder.search_pattern_advanced': 'Enter search pattern...',
                'placeholder.file_extensions': '.txt, .js, .html',
                'placeholder.size_min': 'Min (bytes)',
                'placeholder.size_max': 'Max (bytes)',
                'placeholder.exclude_paths': 'node_modules/\n.git/\ndist/',
                'placeholder.content_search': 'Text to search in files...',
                'placeholder.docker_filter': 'Filter containers...',
                'placeholder.hex_search': 'Enter hex values (e.g., FF 00 1A) or text',
                'placeholder.security_test': 'Enter URL or IP address',
                'placeholder.cloud_storage_name': 'My S3 Storage',
                'placeholder.s3_bucket': 'my-bucket',
                'placeholder.s3_access_key': 'AKIAIOSFODNN7EXAMPLE',
                'placeholder.s3_secret_key': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                'placeholder.s3_prefix': 'folder/subfolder',
                'placeholder.s3_endpoint': 'https://s3.example.com'
            },

            es: {
                // Header
                'app.title': 'JaCommander',
                menu: 'Menú',
                'keyboard.shortcuts': 'Atajos de Teclado',
                configuration: 'Configuración',
                'toggle.theme': 'Cambiar Tema',

                // Footer buttons
                'f1.help': 'F1 Ayuda',
                'f2.menu': 'F2 Menú',
                'f3.view': 'F3 Ver',
                'f4.edit': 'F4 Editar',
                'f5.copy': 'F5 Copiar',
                'f6.move': 'F6 Mover',
                'f7.mkdir': 'F7 Crear Dir',
                'f8.delete': 'F8 Borrar',
                'f9.menu': 'F9 Menú',
                'f10.exit': 'F10 Salir',
                'f11.terminal': 'F11 Terminal',
                'f12.settings': 'F12 Config',

                // Panel headers
                name: 'Nombre',
                size: 'Tamaño',
                modified: 'Modificado',
                items: 'elementos',
                selected: 'seleccionado(s)',

                // Operations
                copy: 'Copiar',
                move: 'Mover',
                delete: 'Eliminar',
                rename: 'Renombrar',
                'new.folder': 'Nueva Carpeta',
                'new.file': 'Nuevo Archivo',
                refresh: 'Actualizar',
                search: 'Buscar',
                'select.all': 'Seleccionar Todo',
                'deselect.all': 'Deseleccionar Todo',

                // File operations
                copying: 'Copiando',
                moving: 'Moviendo',
                deleting: 'Eliminando',
                creating: 'Creando',
                extracting: 'Extrayendo',
                compressing: 'Comprimiendo',

                // Dialogs
                confirm: 'Confirmar',
                cancel: 'Cancelar',
                ok: 'Aceptar',
                yes: 'Sí',
                no: 'No',
                error: 'Error',
                warning: 'Advertencia',
                info: 'Información',
                success: 'Éxito',

                // Messages
                'file.exists': 'El archivo ya existe',
                'overwrite.confirm': '¿Desea sobrescribir?',
                'delete.confirm': '¿Está seguro de que desea eliminar?',
                'operation.complete': 'Operación completada',
                'operation.failed': 'La operación falló',

                // Context menu
                open: 'Abrir',
                'open.with': 'Abrir Con',
                cut: 'Cortar',
                'copy.to': 'Copiar A',
                'move.to': 'Mover A',
                properties: 'Propiedades',

                // Search
                'search.placeholder': 'Buscar archivos...',
                'search.results': 'Resultados de Búsqueda',
                'no.results': 'No se encontraron resultados',

                // Settings
                settings: 'Configuración',
                language: 'Idioma',
                theme: 'Tema',
                'font.size': 'Tamaño de Fuente',
                'show.hidden': 'Mostrar Archivos Ocultos',
                'confirm.delete': 'Confirmar Eliminación',
                save: 'Guardar',

                // Terminal
                terminal: 'Terminal',
                clear: 'Limpiar',
                close: 'Cerrar',

                // Tabs
                'tabs.max_reached': 'Número máximo de pestañas alcanzado',
                'tabs.cannot_close_last': 'No se puede cerrar la última pestaña',
                'tabs.no_recently_closed': 'No hay pestañas cerradas recientemente',
                'tabs.max_allowed': 'Máximo {max} pestañas permitidas por panel',
                'tabs.path_copied': 'Ruta copiada al portapapeles',
                'tabs.close_all': 'Cerrar Todas las Pestañas',
                'tabs.close_all_confirm': '¿Cerrar todas las pestañas excepto la primera?',

                // Cloud Storage
                'storage.fill_required': 'Por favor complete todos los campos requeridos',
                'storage.added': 'Almacenamiento en la nube agregado con éxito',
                'storage.add_failed': 'Error al agregar almacenamiento',
                'storage.default_updated': 'Almacenamiento predeterminado actualizado',
                'storage.default_failed': 'Error al establecer almacenamiento predeterminado',
                'storage.removed': 'Almacenamiento eliminado con éxito',
                'storage.remove_failed': 'Error al eliminar almacenamiento',
                'storage.remove_confirm': 'Eliminar Almacenamiento',
                'storage.remove_message': '¿Está seguro de que desea eliminar este almacenamiento?',
                'storage.remove_button': 'Eliminar',

                // Docker
                'docker.starting': 'Iniciando {name}...',
                'docker.stopping': 'Deteniendo {name}...',
                'docker.restarting': 'Reiniciando {name}...',
                'docker.terminal_unavailable': 'Terminal no disponible',
                'docker.added_to_storage': '{name} agregado al almacenamiento',
                'docker.starting_containers': 'Iniciando {count} contenedores...',
                'docker.stopping_containers': 'Deteniendo {count} contenedores...',
                'docker.removed_containers': '{count} contenedores eliminados',
                'docker.remove_container': 'Eliminar Contenedor',
                'docker.remove_confirm': '¿Eliminar contenedor {name}?',
                'docker.remove_stopped': 'Eliminar Contenedores Detenidos',
                'docker.remove_stopped_confirm': '¿Eliminar {count} contenedores detenidos?',

                // Drag & Drop
                'dragdrop.operation': '{action} {count} archivo(s)...',
                'dragdrop.failed': 'Error al {operation} archivos',

                // WebSocket
                'ws.connection_lost': 'Conexión perdida. Por favor recargue la página.',
                'ws.operation_completed': '{operation} completada',
                'ws.operation_failed': '{operation} falló',
                'ws.operation_cancelled': '{operation} cancelada',

                // Theme
                'theme.switched': 'Tema: {theme}',

                // Breadcrumb
                'breadcrumb.path_copied': 'Ruta copiada: {path}',
                'breadcrumb.syncing': 'Sincronizando con panel {panel}...',
                'breadcrumb.sync_success': 'Paneles sincronizados con éxito',
                'breadcrumb.sync_failed': 'Error al sincronizar paneles',
                'breadcrumb.no_storage': 'El otro panel no tiene almacenamiento',
                'breadcrumb.refreshing': 'Actualizando directorio...',

                // Navigation History
                'history.clear': 'Limpiar Historial',
                'history.clear_confirm': '¿Limpiar todo el historial de navegación?',

                // Custom Commands
                'commands.execute': 'Ejecutar Comando',
                'commands.execute_confirm': '¿Ejecutar comando: {name}?',
                'commands.delete': 'Eliminar Comando',
                'commands.delete_confirm': '¿Eliminar este comando?',
                'commands.reset': 'Restablecer Comandos',
                'commands.reset_confirm':
                    '¿Restablecer todos los comandos a los predeterminados? Esto eliminará todos los comandos personalizados.',
                'commands.name_required': 'Nombre y comando son obligatorios',
                'commands.enter_to_test': 'Ingrese un comando para probar',
                'commands.import_failed': 'Error al importar comandos: {error}',
                'commands.executed': 'Comando "{name}" ejecutado correctamente',
                'commands.saved': 'Comando guardado correctamente',
                'commands.imported': 'Comandos importados correctamente',
                'commands.reset_done': 'Comandos restablecidos a los predeterminados',

                // Modals - Títulos y Contenido
                'modal.keyboard_shortcuts': 'Atajos de Teclado',
                'modal.view_file': 'Ver Archivo',
                'modal.edit_file': 'Editar Archivo',
                'modal.copy_files': 'Copiar Archivos',
                'modal.create_directory': 'Crear Directorio',
                'modal.confirm_delete': 'Confirmar Eliminación',
                'modal.compress_files': 'Comprimir Archivos',
                'modal.search_files': 'Buscar Archivos',
                'modal.confirm_title': 'Confirmar',
                'modal.delete_message': '¿Está seguro de que desea eliminar los siguientes archivos?',
                'modal.copy_message': 'Copiar archivos seleccionados a:',
                'modal.directory_name_label': 'Nombre del directorio:',
                'modal.archive_name_label': 'Nombre del archivo:',
                'modal.format_label': 'Formato:',
                'modal.search_for_label': 'Buscar:',
                'modal.results_label': 'Resultados:',
                'modal.confirm_message_default': '¿Está seguro?',
                'modal.loading': 'Cargando...',

                // Botones
                'button.save': 'Guardar',
                'button.close_esc': 'Cerrar (ESC)',
                'button.save_ctrl_s': 'Guardar (Ctrl+S)',
                'button.create': 'Crear',
                'button.compress': 'Comprimir',
                'button.search': 'Buscar',
                'button.copy': 'Copiar',
                'button.move': 'Mover',
                'button.delete': 'Eliminar',
                'button.yes': 'Sí',
                'button.no': 'No',
                'button.cancel': 'Cancelar',

                // Tooltips - Encabezado
                'tooltip.menu_f9': 'Menú (F9)',
                'tooltip.keyboard_shortcuts_ctrlk': 'Atajos de Teclado (Ctrl+K)',
                'tooltip.configuration': 'Configuración',
                'tooltip.toggle_theme': 'Cambiar Tema',
                'tooltip.backend_connected': 'Backend Conectado',
                'tooltip.backend_error': 'Error de Backend',
                'tooltip.backend_disconnected': 'Backend Desconectado',
                'tooltip.backend_status': 'Estado de Conexión del Backend',

                // Tooltips - Pie de página
                'tooltip.help': 'Ayuda',
                'tooltip.menu': 'Menú',
                'tooltip.view': 'Ver',
                'tooltip.edit': 'Editar',
                'tooltip.copy': 'Copiar',
                'tooltip.move': 'Mover',
                'tooltip.new_folder': 'Nueva Carpeta',
                'tooltip.delete': 'Eliminar',
                'tooltip.exit': 'Salir',
                'tooltip.terminal': 'Terminal',
                'tooltip.settings': 'Configuración',

                // Tooltips - Marcadores
                'tooltip.bookmarks_add': 'Agregar directorio actual',
                'tooltip.bookmarks_manage': 'Administrar marcadores',
                'tooltip.bookmarks_toggle': 'Alternar barra lateral',
                'tooltip.bookmarks_edit': 'Editar',
                'tooltip.bookmarks_delete': 'Eliminar',

                // Tooltips - Navegación
                'tooltip.nav_back': 'Atrás (Alt+Izquierda)',
                'tooltip.nav_forward': 'Adelante (Alt+Derecha)',
                'tooltip.nav_up': 'Directorio Superior (Alt+Arriba)',
                'tooltip.nav_refresh': 'Actualizar (F5)',
                'tooltip.nav_history': 'Historial',
                'tooltip.breadcrumb_refresh': 'Actualizar directorio (F5)',
                'tooltip.breadcrumb_sync': 'Sincronizar almacenamiento y ruta con el otro panel',

                // Tooltips - Terminal
                'tooltip.terminal_new': 'Nueva Terminal',
                'tooltip.terminal_clear': 'Limpiar (Ctrl+L)',
                'tooltip.terminal_search': 'Buscar (Ctrl+Shift+F)',
                'tooltip.terminal_split_h': 'Dividir Horizontal',
                'tooltip.terminal_split_v': 'Dividir Vertical',
                'tooltip.terminal_settings': 'Configuración',
                'tooltip.terminal_close': 'Cerrar Terminal',

                // Tooltips - Editor Hexadecimal
                'tooltip.hex_save': 'Guardar cambios',
                'tooltip.hex_undo': 'Deshacer',
                'tooltip.hex_redo': 'Rehacer',
                'tooltip.hex_find': 'Buscar',
                'tooltip.hex_goto': 'Ir a desplazamiento',

                // Tooltips - Docker
                'tooltip.docker_title': 'Contenedores Docker (Ctrl+D)',
                'tooltip.docker_refresh': 'Actualizar',
                'tooltip.docker_stop': 'Detener',
                'tooltip.docker_restart': 'Reiniciar',
                'tooltip.docker_pause': 'Pausar',
                'tooltip.docker_unpause': 'Reanudar',
                'tooltip.docker_logs': 'Registros',
                'tooltip.docker_terminal': 'Terminal',
                'tooltip.docker_start': 'Iniciar',
                'tooltip.docker_remove': 'Eliminar',
                'tooltip.docker_inspect': 'Inspeccionar',
                'tooltip.docker_files': 'Explorar Archivos',

                // Tooltips - Pestañas
                'tooltip.tab_new': 'Nueva Pestaña (Ctrl+T)',
                'tooltip.tab_menu': 'Menú de Pestañas',
                'tooltip.tab_close': 'Cerrar Pestaña',
                'tooltip.tab_close_ctrl_w': 'Cerrar Pestaña (Ctrl+W)',

                // Tooltips - Comandos Personalizados
                'tooltip.commands_settings': 'Configuración',
                'tooltip.commands_toggle': 'Alternar Barra de Comandos',

                // Menú Contextual
                'context.view_f3': 'Ver (F3)',
                'context.edit_f4': 'Editar (F4)',
                'context.copy_f5': 'Copiar (F5)',
                'context.cut_f6': 'Cortar (F6)',
                'context.rename': 'Renombrar',
                'context.compress': 'Comprimir',
                'context.delete_f8': 'Eliminar (F8)',

                // Opciones de Búsqueda
                'search.case_sensitive': 'Distinguir mayúsculas',
                'search.use_regex': 'Usar expresiones regulares',
                'search.include_subdirs': 'Incluir subdirectorios',

                // Marcadores
                'bookmarks.already_exists': 'Este directorio ya está marcado',
                'bookmarks.enter_name_and_path': 'Por favor ingrese nombre y ruta',
                'bookmarks.enter_category': 'Ingrese nombre de nueva categoría:',
                'bookmarks.import_failed': 'Error al importar marcadores: {error}',
                'bookmarks.imported': 'Marcadores importados correctamente',
                'bookmarks.all_cleared': 'Todos los marcadores eliminados',
                'bookmarks.saved': 'Marcador guardado correctamente',

                // Operaciones de Archivos
                'fileops.no_file_selected': 'Ningún archivo seleccionado',
                'fileops.no_files_selected': 'Ningún archivo seleccionado',
                'fileops.select_one_to_rename': 'Seleccione exactamente un archivo para renombrar',
                'fileops.select_one_archive': 'Seleccione exactamente un archivo para descomprimir',
                'fileops.enter_filename': 'Ingrese nombre de archivo:',
                'fileops.rename_to': 'Renombrar a:',
                'fileops.enter_directory_name': 'Por favor ingrese un nombre de directorio',
                'fileops.enter_archive_name': 'Por favor ingrese un nombre de archivo',
                'fileops.view_failed': 'Error al ver archivo: {error}',
                'fileops.edit_failed': 'Error al editar archivo: {error}',
                'fileops.save_success': 'Archivo guardado correctamente',
                'fileops.save_failed': 'Error al guardar archivo: {error}',
                'fileops.create_success': 'Archivo creado correctamente',
                'fileops.create_failed': 'Error al crear archivo: {error}',
                'fileops.copy_success': 'Archivos copiados correctamente',
                'fileops.move_success': 'Archivos movidos correctamente',
                'fileops.operation_failed': 'Error al {operation} archivos: {error}',
                'fileops.rename_success': 'Archivo renombrado correctamente',
                'fileops.rename_failed': 'Error al renombrar archivo: {error}',
                'fileops.mkdir_success': 'Directorio creado correctamente',
                'fileops.mkdir_failed': 'Error al crear directorio: {error}',
                'fileops.delete_success': 'Archivos eliminados correctamente',
                'fileops.delete_failed': 'Error al eliminar archivos: {error}',
                'fileops.compress_started': 'Compresión iniciada',
                'fileops.compress_failed': 'Error al comprimir archivos: {error}',
                'fileops.decompress_started': 'Descompresión iniciada',
                'fileops.decompress_failed': 'Error al descomprimir archivo: {error}',
                'fileops.load_directory_failed': 'Error al cargar directorio: {error}',
                'fileops.copy_with_options': 'Copiar con opciones no implementado aún',
                'fileops.close_browser_tab': 'Por favor cierre la pestaña del navegador para salir',

                // Atajos de Teclado
                'shortcuts.help': 'Ayuda',
                'shortcuts.user_menu': 'Menú de Usuario',
                'shortcuts.view_file': 'Ver Archivo',
                'shortcuts.edit_file': 'Editar Archivo',
                'shortcuts.copy_files': 'Copiar Archivos',
                'shortcuts.move_rename': 'Mover/Renombrar',
                'shortcuts.create_directory': 'Crear Directorio',
                'shortcuts.delete': 'Eliminar',
                'shortcuts.menu': 'Menú',
                'shortcuts.exit': 'Salir',
                'shortcuts.switch_panel': 'Cambiar Panel',
                'shortcuts.select_item': 'Seleccionar Elemento',
                'shortcuts.select_all': 'Seleccionar Todo',
                'shortcuts.deselect_all': 'Deseleccionar Todo',
                'shortcuts.refresh': 'Actualizar',
                'shortcuts.search': 'Buscar',
                'shortcuts.compress': 'Comprimir',
                'shortcuts.decompress': 'Descomprimir',
                'shortcuts.new_file': 'Nuevo Archivo',
                'shortcuts.rename': 'Renombrar',
                'shortcuts.customize': 'Personalizar Atajos',
                'shortcuts.new_tab': 'Nueva Pestaña',
                'shortcuts.close_tab': 'Cerrar Pestaña',
                'shortcuts.next_tab': 'Siguiente Pestaña',
                'shortcuts.prev_tab': 'Pestaña Anterior',
                'shortcuts.goto_tab_n': 'Ir a Pestaña N',
                'shortcuts.saved': 'Atajos guardados correctamente',
                'shortcuts.save_failed': 'Error al guardar atajos',
                'shortcuts.reset': 'Atajos restablecidos a los predeterminados',
                'shortcuts.exported': 'Atajos exportados correctamente',
                'shortcuts.imported': 'Atajos importados correctamente',
                'shortcuts.import_failed': 'Error al importar atajos',

                // Mensajes de Teclado
                'keyboard.user_menu_not_implemented': 'Menú de usuario no implementado aún',
                'keyboard.search_term_required': 'Por favor ingrese un término de búsqueda',
                'keyboard.search_results': 'Se encontraron {count} resultado(s)',
                'keyboard.search_failed': 'Búsqueda fallida',

                // Renombrado por Lotes
                'rename.no_files': 'No hay archivos para renombrar',
                'rename.success': 'Se renombraron {count} archivos correctamente',
                'rename.partial_success': 'Se renombraron {success} archivos, {failed} fallaron',

                // Terminal
                'terminal.search_prompt': 'Buscar en terminal:',
                'terminal.multiple_coming_soon': '¡Múltiples terminales próximamente!',
                'terminal.split_coming_soon': '¡Terminal dividida próximamente!',
                'terminal.settings_coming_soon': '¡Configuración de terminal próximamente!',

                // Editor Hexadecimal
                'hex.enter_offset_prompt': 'Ingrese desplazamiento (decimal o hex con prefijo 0x):',

                // Búsqueda Avanzada
                'advanced_search.enter_path': 'Ingrese ruta de búsqueda:',
                'advanced_search.enter_name': 'Ingrese nombre para búsqueda guardada:',
                'advanced_search.saved': '¡Búsqueda guardada correctamente!',
                'advanced_search.no_saved': 'No se encontraron búsquedas guardadas',
                'advanced_search.select_prompt': 'Seleccione búsqueda guardada:\n{names}',
                'advanced_search.loaded': '¡Búsqueda cargada correctamente!',

                // Seguridad
                'security.local_ips_enabled': 'Conexiones IP locales habilitadas',
                'security.local_ips_blocked': 'Conexiones IP locales bloqueadas',
                'security.update_failed': 'Error al actualizar configuración de seguridad',

                // Carga
                'upload.no_valid_files': 'No hay archivos válidos para cargar',
                'upload.success': '✅ Cargado {name}',
                'upload.failed': '❌ Error al cargar {name}: {error}',

                // Aplicación
                'app.menu_not_implemented': 'Menú no implementado aún',
                'app.config_not_implemented': 'Configuración no implementada aún',

                // Arrastrar y Soltar
                'dragdrop.copy_label': 'COPIAR',
                'dragdrop.move_label': 'MOVER',
                'dragdrop.drop_to_upload': '📥 Suelte archivos aquí para cargar',
                'dragdrop.success': '{operation} {count} archivo(s) correctamente',

                // Marcadores de Posición
                'placeholder.new_folder': 'Nueva Carpeta',
                'placeholder.archive_zip': 'archivo.zip',
                'placeholder.search_pattern': 'Ingrese nombre de archivo o patrón...',
                'placeholder.rename_prefix': 'ej., IMG_',
                'placeholder.rename_suffix': 'ej., _backup',
                'placeholder.rename_find': 'Texto a buscar',
                'placeholder.rename_replace': 'Texto de reemplazo',
                'placeholder.rename_extension': 'ej., jpg',
                'placeholder.bookmarks_search': 'Buscar marcadores...',
                'placeholder.bookmark_name': 'Nombre del marcador',
                'placeholder.bookmark_path': '/ruta/al/directorio',
                'placeholder.bookmark_description': 'Descripción opcional',
                'placeholder.command_search': 'Escriba comando o buscar...',
                'placeholder.command_name': 'Nombre del comando',
                'placeholder.command_description': 'Qué hace este comando',
                'placeholder.command_command': 'Comando de shell a ejecutar',
                'placeholder.command_hotkey': 'ej., Ctrl+Shift+G',
                'placeholder.search_pattern_advanced': 'Ingrese patrón de búsqueda...',
                'placeholder.file_extensions': '.txt, .js, .html',
                'placeholder.size_min': 'Mín (bytes)',
                'placeholder.size_max': 'Máx (bytes)',
                'placeholder.exclude_paths': 'node_modules/\n.git/\ndist/',
                'placeholder.content_search': 'Texto a buscar en archivos...',
                'placeholder.docker_filter': 'Filtrar contenedores...',
                'placeholder.hex_search': 'Ingrese valores hex (ej., FF 00 1A) o texto',
                'placeholder.security_test': 'Ingrese URL o dirección IP',
                'placeholder.cloud_storage_name': 'Mi Almacenamiento S3',
                'placeholder.s3_bucket': 'mi-bucket',
                'placeholder.s3_access_key': 'AKIAIOSFODNN7EXAMPLE',
                'placeholder.s3_secret_key': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                'placeholder.s3_prefix': 'carpeta/subcarpeta',
                'placeholder.s3_endpoint': 'https://s3.ejemplo.com'
            },

            de: {
                // Header
                'app.title': 'JaCommander',
                menu: 'Menü',
                'keyboard.shortcuts': 'Tastenkombinationen',
                configuration: 'Konfiguration',
                'toggle.theme': 'Thema Umschalten',

                // Footer buttons
                'f1.help': 'F1 Hilfe',
                'f2.menu': 'F2 Menü',
                'f3.view': 'F3 Ansicht',
                'f4.edit': 'F4 Bearbeiten',
                'f5.copy': 'F5 Kopieren',
                'f6.move': 'F6 Verschieben',
                'f7.mkdir': 'F7 Ordner',
                'f8.delete': 'F8 Löschen',
                'f9.menu': 'F9 Menü',
                'f10.exit': 'F10 Beenden',
                'f11.terminal': 'F11 Terminal',
                'f12.settings': 'F12 Einstellungen',

                // Panel headers
                name: 'Name',
                size: 'Größe',
                modified: 'Geändert',
                items: 'Elemente',
                selected: 'ausgewählt',

                // Operations
                copy: 'Kopieren',
                move: 'Verschieben',
                delete: 'Löschen',
                rename: 'Umbenennen',
                'new.folder': 'Neuer Ordner',
                'new.file': 'Neue Datei',
                refresh: 'Aktualisieren',
                search: 'Suchen',
                'select.all': 'Alles Auswählen',
                'deselect.all': 'Auswahl Aufheben',

                // File operations
                copying: 'Kopieren',
                moving: 'Verschieben',
                deleting: 'Löschen',
                creating: 'Erstellen',
                extracting: 'Extrahieren',
                compressing: 'Komprimieren',

                // Dialogs
                confirm: 'Bestätigen',
                cancel: 'Abbrechen',
                ok: 'OK',
                yes: 'Ja',
                no: 'Nein',
                error: 'Fehler',
                warning: 'Warnung',
                info: 'Information',
                success: 'Erfolg',

                // Messages
                'file.exists': 'Datei existiert bereits',
                'overwrite.confirm': 'Möchten Sie überschreiben?',
                'delete.confirm': 'Sind Sie sicher, dass Sie löschen möchten?',
                'operation.complete': 'Vorgang abgeschlossen',
                'operation.failed': 'Vorgang fehlgeschlagen',

                // Context menu
                open: 'Öffnen',
                'open.with': 'Öffnen Mit',
                cut: 'Ausschneiden',
                'copy.to': 'Kopieren Nach',
                'move.to': 'Verschieben Nach',
                properties: 'Eigenschaften',

                // Search
                'search.placeholder': 'Dateien suchen...',
                'search.results': 'Suchergebnisse',
                'no.results': 'Keine Ergebnisse gefunden',

                // Settings
                settings: 'Einstellungen',
                language: 'Sprache',
                theme: 'Thema',
                'font.size': 'Schriftgröße',
                'show.hidden': 'Versteckte Dateien Anzeigen',
                'confirm.delete': 'Löschen Bestätigen',
                save: 'Speichern',

                // Terminal
                terminal: 'Terminal',
                clear: 'Löschen',
                close: 'Schließen',

                // Tabs
                'tabs.max_reached': 'Maximale Anzahl an Tabs erreicht',
                'tabs.cannot_close_last': 'Letzter Tab kann nicht geschlossen werden',
                'tabs.no_recently_closed': 'Keine kürzlich geschlossenen Tabs',
                'tabs.max_allowed': 'Maximal {max} Tabs pro Panel erlaubt',
                'tabs.path_copied': 'Pfad in Zwischenablage kopiert',
                'tabs.close_all': 'Alle Tabs Schließen',
                'tabs.close_all_confirm': 'Alle Tabs außer dem ersten schließen?',

                // Cloud Storage
                'storage.fill_required': 'Bitte füllen Sie alle Pflichtfelder aus',
                'storage.added': 'Cloud-Speicher erfolgreich hinzugefügt',
                'storage.add_failed': 'Fehler beim Hinzufügen des Speichers',
                'storage.default_updated': 'Standardspeicher aktualisiert',
                'storage.default_failed': 'Fehler beim Festlegen des Standardspeichers',
                'storage.removed': 'Speicher erfolgreich entfernt',
                'storage.remove_failed': 'Fehler beim Entfernen des Speichers',
                'storage.remove_confirm': 'Speicher Entfernen',
                'storage.remove_message': 'Möchten Sie diesen Speicher wirklich entfernen?',
                'storage.remove_button': 'Entfernen',

                // Docker
                'docker.starting': '{name} wird gestartet...',
                'docker.stopping': '{name} wird gestoppt...',
                'docker.restarting': '{name} wird neugestartet...',
                'docker.terminal_unavailable': 'Terminal nicht verfügbar',
                'docker.added_to_storage': '{name} zum Speicher hinzugefügt',
                'docker.starting_containers': '{count} Container werden gestartet...',
                'docker.stopping_containers': '{count} Container werden gestoppt...',
                'docker.removed_containers': '{count} Container entfernt',
                'docker.remove_container': 'Container Entfernen',
                'docker.remove_confirm': 'Container {name} entfernen?',
                'docker.remove_stopped': 'Gestoppte Container Entfernen',
                'docker.remove_stopped_confirm': '{count} gestoppte Container entfernen?',

                // Drag & Drop
                'dragdrop.operation': '{action} {count} Datei(en)...',
                'dragdrop.failed': 'Fehler beim {operation} von Dateien',

                // WebSocket
                'ws.connection_lost': 'Verbindung verloren. Bitte laden Sie die Seite neu.',
                'ws.operation_completed': '{operation} abgeschlossen',
                'ws.operation_failed': '{operation} fehlgeschlagen',
                'ws.operation_cancelled': '{operation} abgebrochen',

                // Theme
                'theme.switched': 'Thema: {theme}',

                // Breadcrumb
                'breadcrumb.path_copied': 'Pfad kopiert: {path}',
                'breadcrumb.syncing': 'Synchronisiere mit {panel} Panel...',
                'breadcrumb.sync_success': 'Panels erfolgreich synchronisiert',
                'breadcrumb.sync_failed': 'Fehler beim Synchronisieren der Panels',
                'breadcrumb.no_storage': 'Anderes Panel hat keinen Speicher',
                'breadcrumb.refreshing': 'Verzeichnis wird aktualisiert...',

                // Navigation History
                'history.clear': 'Verlauf Löschen',
                'history.clear_confirm': 'Gesamten Navigationsverlauf löschen?',

                // Custom Commands
                'commands.execute': 'Befehl Ausführen',
                'commands.execute_confirm': 'Befehl ausführen: {name}?',
                'commands.delete': 'Befehl Löschen',
                'commands.delete_confirm': 'Diesen Befehl löschen?',
                'commands.reset': 'Befehle Zurücksetzen',
                'commands.reset_confirm':
                    'Alle Befehle auf Standardwerte zurücksetzen? Dies löscht alle benutzerdefinierten Befehle.',
                'commands.name_required': 'Name und Befehl sind erforderlich',
                'commands.enter_to_test': 'Geben Sie einen Befehl zum Testen ein',
                'commands.import_failed': 'Fehler beim Importieren von Befehlen: {error}',
                'commands.executed': 'Befehl "{name}" erfolgreich ausgeführt',
                'commands.saved': 'Befehl erfolgreich gespeichert',
                'commands.imported': 'Befehle erfolgreich importiert',
                'commands.reset_done': 'Befehle auf Standardwerte zurückgesetzt',

                // Modals - Titel und Inhalt
                'modal.keyboard_shortcuts': 'Tastenkombinationen',
                'modal.view_file': 'Datei Anzeigen',
                'modal.edit_file': 'Datei Bearbeiten',
                'modal.copy_files': 'Dateien Kopieren',
                'modal.create_directory': 'Verzeichnis Erstellen',
                'modal.confirm_delete': 'Löschen Bestätigen',
                'modal.compress_files': 'Dateien Komprimieren',
                'modal.search_files': 'Dateien Suchen',
                'modal.confirm_title': 'Bestätigen',
                'modal.delete_message': 'Sind Sie sicher, dass Sie die folgenden Dateien löschen möchten?',
                'modal.copy_message': 'Ausgewählte Dateien kopieren nach:',
                'modal.directory_name_label': 'Verzeichnisname:',
                'modal.archive_name_label': 'Archivname:',
                'modal.format_label': 'Format:',
                'modal.search_for_label': 'Suchen nach:',
                'modal.results_label': 'Ergebnisse:',
                'modal.confirm_message_default': 'Sind Sie sicher?',
                'modal.loading': 'Wird geladen...',

                // Schaltflächen
                'button.save': 'Speichern',
                'button.close_esc': 'Schließen (ESC)',
                'button.save_ctrl_s': 'Speichern (Strg+S)',
                'button.create': 'Erstellen',
                'button.compress': 'Komprimieren',
                'button.search': 'Suchen',
                'button.copy': 'Kopieren',
                'button.move': 'Verschieben',
                'button.delete': 'Löschen',
                'button.yes': 'Ja',
                'button.no': 'Nein',
                'button.cancel': 'Abbrechen',

                // Tooltips - Kopfzeile
                'tooltip.menu_f9': 'Menü (F9)',
                'tooltip.keyboard_shortcuts_ctrlk': 'Tastenkombinationen (Strg+K)',
                'tooltip.configuration': 'Konfiguration',
                'tooltip.toggle_theme': 'Thema Umschalten',
                'tooltip.backend_connected': 'Backend Verbunden',
                'tooltip.backend_error': 'Backend Fehler',
                'tooltip.backend_disconnected': 'Backend Getrennt',
                'tooltip.backend_status': 'Backend Verbindungsstatus',

                // Tooltips - Fußzeile
                'tooltip.help': 'Hilfe',
                'tooltip.menu': 'Menü',
                'tooltip.view': 'Anzeigen',
                'tooltip.edit': 'Bearbeiten',
                'tooltip.copy': 'Kopieren',
                'tooltip.move': 'Verschieben',
                'tooltip.new_folder': 'Neuer Ordner',
                'tooltip.delete': 'Löschen',
                'tooltip.exit': 'Beenden',
                'tooltip.terminal': 'Terminal',
                'tooltip.settings': 'Einstellungen',

                // Tooltips - Lesezeichen
                'tooltip.bookmarks_add': 'Aktuelles Verzeichnis hinzufügen',
                'tooltip.bookmarks_manage': 'Lesezeichen verwalten',
                'tooltip.bookmarks_toggle': 'Seitenleiste umschalten',
                'tooltip.bookmarks_edit': 'Bearbeiten',
                'tooltip.bookmarks_delete': 'Löschen',

                // Tooltips - Navigation
                'tooltip.nav_back': 'Zurück (Alt+Links)',
                'tooltip.nav_forward': 'Vorwärts (Alt+Rechts)',
                'tooltip.nav_up': 'Übergeordnetes Verzeichnis (Alt+Oben)',
                'tooltip.nav_refresh': 'Aktualisieren (F5)',
                'tooltip.nav_history': 'Verlauf',
                'tooltip.breadcrumb_refresh': 'Verzeichnis aktualisieren (F5)',
                'tooltip.breadcrumb_sync': 'Speicher und Pfad mit anderem Panel synchronisieren',

                // Tooltips - Terminal
                'tooltip.terminal_new': 'Neues Terminal',
                'tooltip.terminal_clear': 'Löschen (Strg+L)',
                'tooltip.terminal_search': 'Suchen (Strg+Shift+F)',
                'tooltip.terminal_split_h': 'Horizontal Teilen',
                'tooltip.terminal_split_v': 'Vertikal Teilen',
                'tooltip.terminal_settings': 'Einstellungen',
                'tooltip.terminal_close': 'Terminal Schließen',

                // Tooltips - Hex-Editor
                'tooltip.hex_save': 'Änderungen speichern',
                'tooltip.hex_undo': 'Rückgängig',
                'tooltip.hex_redo': 'Wiederholen',
                'tooltip.hex_find': 'Suchen',
                'tooltip.hex_goto': 'Zu Offset gehen',

                // Tooltips - Docker
                'tooltip.docker_title': 'Docker Container (Strg+D)',
                'tooltip.docker_refresh': 'Aktualisieren',
                'tooltip.docker_stop': 'Stoppen',
                'tooltip.docker_restart': 'Neu starten',
                'tooltip.docker_pause': 'Pausieren',
                'tooltip.docker_unpause': 'Fortsetzen',
                'tooltip.docker_logs': 'Protokolle',
                'tooltip.docker_terminal': 'Terminal',
                'tooltip.docker_start': 'Starten',
                'tooltip.docker_remove': 'Entfernen',
                'tooltip.docker_inspect': 'Untersuchen',
                'tooltip.docker_files': 'Dateien Durchsuchen',

                // Tooltips - Registerkarten
                'tooltip.tab_new': 'Neue Registerkarte (Strg+T)',
                'tooltip.tab_menu': 'Registerkarten Menü',
                'tooltip.tab_close': 'Registerkarte Schließen',
                'tooltip.tab_close_ctrl_w': 'Registerkarte Schließen (Strg+W)',

                // Tooltips - Benutzerdefinierte Befehle
                'tooltip.commands_settings': 'Einstellungen',
                'tooltip.commands_toggle': 'Befehlsleiste Umschalten',

                // Kontextmenü
                'context.view_f3': 'Anzeigen (F3)',
                'context.edit_f4': 'Bearbeiten (F4)',
                'context.copy_f5': 'Kopieren (F5)',
                'context.cut_f6': 'Ausschneiden (F6)',
                'context.rename': 'Umbenennen',
                'context.compress': 'Komprimieren',
                'context.delete_f8': 'Löschen (F8)',

                // Suchoptionen
                'search.case_sensitive': 'Groß-/Kleinschreibung beachten',
                'search.use_regex': 'Regex verwenden',
                'search.include_subdirs': 'Unterverzeichnisse einschließen',

                // Lesezeichen
                'bookmarks.already_exists': 'Dieses Verzeichnis ist bereits als Lesezeichen vorhanden',
                'bookmarks.enter_name_and_path': 'Bitte geben Sie Name und Pfad ein',
                'bookmarks.enter_category': 'Neuen Kategorienamen eingeben:',
                'bookmarks.import_failed': 'Fehler beim Importieren von Lesezeichen: {error}',
                'bookmarks.imported': 'Lesezeichen erfolgreich importiert',
                'bookmarks.all_cleared': 'Alle Lesezeichen gelöscht',
                'bookmarks.saved': 'Lesezeichen erfolgreich gespeichert',

                // Dateioperationen
                'fileops.no_file_selected': 'Keine Datei ausgewählt',
                'fileops.no_files_selected': 'Keine Dateien ausgewählt',
                'fileops.select_one_to_rename': 'Wählen Sie genau eine Datei zum Umbenennen',
                'fileops.select_one_archive': 'Wählen Sie genau ein Archiv zum Dekomprimieren',
                'fileops.enter_filename': 'Dateinamen eingeben:',
                'fileops.rename_to': 'Umbenennen in:',
                'fileops.enter_directory_name': 'Bitte geben Sie einen Verzeichnisnamen ein',
                'fileops.enter_archive_name': 'Bitte geben Sie einen Archivnamen ein',
                'fileops.view_failed': 'Fehler beim Anzeigen der Datei: {error}',
                'fileops.edit_failed': 'Fehler beim Bearbeiten der Datei: {error}',
                'fileops.save_success': 'Datei erfolgreich gespeichert',
                'fileops.save_failed': 'Fehler beim Speichern der Datei: {error}',
                'fileops.create_success': 'Datei erfolgreich erstellt',
                'fileops.create_failed': 'Fehler beim Erstellen der Datei: {error}',
                'fileops.copy_success': 'Dateien erfolgreich kopiert',
                'fileops.move_success': 'Dateien erfolgreich verschoben',
                'fileops.operation_failed': 'Fehler beim {operation} von Dateien: {error}',
                'fileops.rename_success': 'Datei erfolgreich umbenannt',
                'fileops.rename_failed': 'Fehler beim Umbenennen der Datei: {error}',
                'fileops.mkdir_success': 'Verzeichnis erfolgreich erstellt',
                'fileops.mkdir_failed': 'Fehler beim Erstellen des Verzeichnisses: {error}',
                'fileops.delete_success': 'Dateien erfolgreich gelöscht',
                'fileops.delete_failed': 'Fehler beim Löschen der Dateien: {error}',
                'fileops.compress_started': 'Komprimierung gestartet',
                'fileops.compress_failed': 'Fehler beim Komprimieren der Dateien: {error}',
                'fileops.decompress_started': 'Dekomprimierung gestartet',
                'fileops.decompress_failed': 'Fehler beim Dekomprimieren der Datei: {error}',
                'fileops.load_directory_failed': 'Fehler beim Laden des Verzeichnisses: {error}',
                'fileops.copy_with_options': 'Kopieren mit Optionen noch nicht implementiert',
                'fileops.close_browser_tab': 'Bitte schließen Sie den Browser-Tab zum Beenden',

                // Tastenkombinationen
                'shortcuts.help': 'Hilfe',
                'shortcuts.user_menu': 'Benutzermenü',
                'shortcuts.view_file': 'Datei Anzeigen',
                'shortcuts.edit_file': 'Datei Bearbeiten',
                'shortcuts.copy_files': 'Dateien Kopieren',
                'shortcuts.move_rename': 'Verschieben/Umbenennen',
                'shortcuts.create_directory': 'Verzeichnis Erstellen',
                'shortcuts.delete': 'Löschen',
                'shortcuts.menu': 'Menü',
                'shortcuts.exit': 'Beenden',
                'shortcuts.switch_panel': 'Panel Wechseln',
                'shortcuts.select_item': 'Element Auswählen',
                'shortcuts.select_all': 'Alles Auswählen',
                'shortcuts.deselect_all': 'Auswahl Aufheben',
                'shortcuts.refresh': 'Aktualisieren',
                'shortcuts.search': 'Suchen',
                'shortcuts.compress': 'Komprimieren',
                'shortcuts.decompress': 'Dekomprimieren',
                'shortcuts.new_file': 'Neue Datei',
                'shortcuts.rename': 'Umbenennen',
                'shortcuts.customize': 'Tastenkombinationen Anpassen',
                'shortcuts.new_tab': 'Neue Registerkarte',
                'shortcuts.close_tab': 'Registerkarte Schließen',
                'shortcuts.next_tab': 'Nächste Registerkarte',
                'shortcuts.prev_tab': 'Vorherige Registerkarte',
                'shortcuts.goto_tab_n': 'Zu Registerkarte N Gehen',
                'shortcuts.saved': 'Tastenkombinationen erfolgreich gespeichert',
                'shortcuts.save_failed': 'Fehler beim Speichern der Tastenkombinationen',
                'shortcuts.reset': 'Tastenkombinationen auf Standardwerte zurückgesetzt',
                'shortcuts.exported': 'Tastenkombinationen erfolgreich exportiert',
                'shortcuts.imported': 'Tastenkombinationen erfolgreich importiert',
                'shortcuts.import_failed': 'Fehler beim Importieren der Tastenkombinationen',

                // Tastatur-Nachrichten
                'keyboard.user_menu_not_implemented': 'Benutzermenü noch nicht implementiert',
                'keyboard.search_term_required': 'Bitte geben Sie einen Suchbegriff ein',
                'keyboard.search_results': '{count} Ergebnis(se) gefunden',
                'keyboard.search_failed': 'Suche fehlgeschlagen',

                // Massen-Umbenennung
                'rename.no_files': 'Keine Dateien zum Umbenennen',
                'rename.success': '{count} Dateien erfolgreich umbenannt',
                'rename.partial_success': '{success} Dateien umbenannt, {failed} fehlgeschlagen',

                // Terminal
                'terminal.search_prompt': 'In Terminal suchen:',
                'terminal.multiple_coming_soon': 'Mehrere Terminals demnächst verfügbar!',
                'terminal.split_coming_soon': 'Geteiltes Terminal demnächst verfügbar!',
                'terminal.settings_coming_soon': 'Terminal-Einstellungen demnächst verfügbar!',

                // Hex-Editor
                'hex.enter_offset_prompt': 'Offset eingeben (dezimal oder hex mit 0x-Präfix):',

                // Erweiterte Suche
                'advanced_search.enter_path': 'Suchpfad eingeben:',
                'advanced_search.enter_name': 'Namen für gespeicherte Suche eingeben:',
                'advanced_search.saved': 'Suche erfolgreich gespeichert!',
                'advanced_search.no_saved': 'Keine gespeicherten Suchen gefunden',
                'advanced_search.select_prompt': 'Gespeicherte Suche auswählen:\n{names}',
                'advanced_search.loaded': 'Suche erfolgreich geladen!',

                // Sicherheit
                'security.local_ips_enabled': 'Lokale IP-Verbindungen aktiviert',
                'security.local_ips_blocked': 'Lokale IP-Verbindungen blockiert',
                'security.update_failed': 'Fehler beim Aktualisieren der Sicherheitseinstellungen',

                // Hochladen
                'upload.no_valid_files': 'Keine gültigen Dateien zum Hochladen',
                'upload.success': '✅ {name} hochgeladen',
                'upload.failed': '❌ Fehler beim Hochladen von {name}: {error}',

                // Anwendung
                'app.menu_not_implemented': 'Menü noch nicht implementiert',
                'app.config_not_implemented': 'Konfiguration noch nicht implementiert',

                // Ziehen und Ablegen
                'dragdrop.copy_label': 'KOPIEREN',
                'dragdrop.move_label': 'VERSCHIEBEN',
                'dragdrop.drop_to_upload': '📥 Dateien hier ablegen zum Hochladen',
                'dragdrop.success': '{operation} {count} Datei(en) erfolgreich',

                // Platzhalter
                'placeholder.new_folder': 'Neuer Ordner',
                'placeholder.archive_zip': 'archiv.zip',
                'placeholder.search_pattern': 'Dateiname oder Muster eingeben...',
                'placeholder.rename_prefix': 'z.B. IMG_',
                'placeholder.rename_suffix': 'z.B. _backup',
                'placeholder.rename_find': 'Zu suchender Text',
                'placeholder.rename_replace': 'Ersetzungstext',
                'placeholder.rename_extension': 'z.B. jpg',
                'placeholder.bookmarks_search': 'Lesezeichen suchen...',
                'placeholder.bookmark_name': 'Lesezeichenname',
                'placeholder.bookmark_path': '/pfad/zum/verzeichnis',
                'placeholder.bookmark_description': 'Optionale Beschreibung',
                'placeholder.command_search': 'Befehl eingeben oder suchen...',
                'placeholder.command_name': 'Befehlsname',
                'placeholder.command_description': 'Was dieser Befehl tut',
                'placeholder.command_command': 'Auszuführender Shell-Befehl',
                'placeholder.command_hotkey': 'z.B. Strg+Shift+G',
                'placeholder.search_pattern_advanced': 'Suchmuster eingeben...',
                'placeholder.file_extensions': '.txt, .js, .html',
                'placeholder.size_min': 'Min (Bytes)',
                'placeholder.size_max': 'Max (Bytes)',
                'placeholder.exclude_paths': 'node_modules/\n.git/\ndist/',
                'placeholder.content_search': 'In Dateien zu suchender Text...',
                'placeholder.docker_filter': 'Container filtern...',
                'placeholder.hex_search': 'Hex-Werte eingeben (z.B. FF 00 1A) oder Text',
                'placeholder.security_test': 'URL oder IP-Adresse eingeben',
                'placeholder.cloud_storage_name': 'Mein S3 Speicher',
                'placeholder.s3_bucket': 'mein-bucket',
                'placeholder.s3_access_key': 'AKIAIOSFODNN7EXAMPLE',
                'placeholder.s3_secret_key': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                'placeholder.s3_prefix': 'ordner/unterordner',
                'placeholder.s3_endpoint': 'https://s3.beispiel.com'
            }
        };

        // Merge additional languages from language pack
        Object.assign(this.translations, languagePack);

        // Store language metadata
        this.languageMetadata = languageMetadata;

        this.init();
    }

    init() {
        // Get saved language or detect from browser
        this.currentLang = localStorage.getItem('jacommander-language') || this.detectLanguage();

        // Set up custom dropdown
        this.setupCustomDropdown();

        // Apply initial translations
        this.updateUI();
    }

    setupCustomDropdown() {
        const trigger = document.getElementById('dropdown-trigger');
        const menu = document.getElementById('dropdown-menu');

        console.log('setupCustomDropdown called');
        console.log('trigger:', trigger);
        console.log('menu:', menu);

        if (!trigger || !menu) {
            console.error('Dropdown elements not found!');
            return;
        }

        // Clear and rebuild the dropdown menu with all languages
        menu.innerHTML = '';
        Object.keys(this.languageMetadata).forEach((langCode) => {
            const langData = this.languageMetadata[langCode];
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.lang = langCode;
            if (langCode === this.currentLang) {
                item.classList.add('active');
            }
            item.innerHTML = `
                <span class="item-flag">${langData.flag}</span>
                <span class="item-text">${langData.nativeName || langData.name}</span>
            `;
            menu.appendChild(item);
        });

        // Convert flag emojis to Twemoji images for cross-platform compatibility
        this.convertEmojisToImages(menu);

        const items = menu.querySelectorAll('.dropdown-item');
        console.log('Added', items.length, 'language items to dropdown');
        console.log('Menu HTML:', menu.innerHTML.substring(0, 200));

        // Set initial display
        this.updateDropdownDisplay(this.languageMetadata[this.currentLang]);

        // Toggle dropdown on click
        trigger.addEventListener('click', (e) => {
            console.log('Dropdown trigger clicked!');
            e.stopPropagation();
            const isOpen = menu.classList.contains('show');
            console.log('Is dropdown open?', isOpen);

            if (isOpen) {
                this.closeDropdown(trigger, menu);
            } else {
                this.openDropdown(trigger, menu);
            }
        });

        // Handle item selection
        items.forEach((item) => {
            const lang = item.dataset.lang;

            // Set initial active state
            item.classList.toggle('active', lang === this.currentLang);

            // Handle click
            item.addEventListener('click', (e) => {
                e.stopPropagation();

                // Update language
                this.setLanguage(lang);

                // Update display
                this.updateDropdownDisplay(this.languageMetadata[lang]);

                // Update active states
                items.forEach((i) => {
                    i.classList.toggle('active', i.dataset.lang === lang);
                });

                // Add selection animation
                item.classList.add('selected');
                setTimeout(() => item.classList.remove('selected'), 300);

                // Close dropdown
                this.closeDropdown(trigger, menu);
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            this.closeDropdown(trigger, menu);
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown(trigger, menu);
            }
        });
    }

    updateDropdownDisplay(langData) {
        const flag = document.querySelector('.dropdown-flag');
        const text = document.querySelector('.dropdown-text');
        const trigger = document.getElementById('dropdown-trigger');

        if (flag) {
            flag.textContent = langData.flag;
            // Convert emoji to image
            this.convertEmojisToImages(flag);
        }
        // Hide the text element since we only want to show the flag
        if (text) {
            text.style.display = 'none';
        }
        // Set tooltip with language name
        if (trigger) {
            trigger.title = langData.nativeName || langData.name;
        }
    }

    // Convert flag emojis to Twemoji SVG images for cross-platform compatibility
    convertEmojisToImages(element) {
        // Load Twemoji library if not already loaded
        if (typeof twemoji === 'undefined') {
            if (!this.twemojiLoading) {
                this.twemojiLoading = true;
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js';
                script.crossOrigin = 'anonymous';
                script.onload = () => {
                    this.twemojiLoaded = true;
                    // Parse all elements that were waiting
                    document.querySelectorAll('.item-flag, .dropdown-flag').forEach((el) => {
                        twemoji.parse(el, {
                            folder: 'svg',
                            ext: '.svg'
                        });
                    });
                };
                document.head.appendChild(script);
            }
            return;
        }

        // Twemoji is loaded, parse the element
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(element, {
                folder: 'svg',
                ext: '.svg'
            });
        }
    }

    openDropdown(trigger, menu) {
        console.log('Opening dropdown...');
        trigger.classList.add('active');
        menu.classList.add('show');

        // Force styles via JavaScript to override any CSS issues
        menu.style.setProperty('opacity', '1', 'important');
        menu.style.setProperty('visibility', 'visible', 'important');
        menu.style.setProperty('transform', 'translateY(0)', 'important');
        menu.style.setProperty('display', 'block', 'important');

        console.log('Dropdown menu classes:', menu.className);
        console.log('Inline styles set:', menu.style.cssText);

        // Debug: Check computed styles and positioning after a tiny delay
        setTimeout(() => {
            const styles = window.getComputedStyle(menu);
            const rect = menu.getBoundingClientRect();
            const triggerRect = trigger.getBoundingClientRect();

            console.log('=== DROPDOWN DEBUG INFO ===');
            console.log('Computed styles:', {
                display: styles.display,
                opacity: styles.opacity,
                visibility: styles.visibility,
                zIndex: styles.zIndex,
                position: styles.position,
                top: styles.top,
                right: styles.right,
                left: styles.left,
                height: styles.height,
                width: styles.width,
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                overflow: styles.overflow
            });

            console.log('Dropdown position (pixels from viewport):', {
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                x: rect.x,
                y: rect.y
            });

            console.log('Trigger position:', {
                top: triggerRect.top,
                right: triggerRect.right,
                bottom: triggerRect.bottom,
                left: triggerRect.left
            });

            console.log('Viewport size:', {
                width: window.innerWidth,
                height: window.innerHeight
            });

            // Check if dropdown is within viewport
            const inViewport =
                rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;

            console.log('Is dropdown within viewport?', inViewport);
            if (!inViewport) {
                console.warn('⚠️ DROPDOWN IS OUTSIDE VIEWPORT!');
                if (rect.top < 0) {console.warn('  - Too far up');}
                if (rect.bottom > window.innerHeight) {console.warn('  - Too far down');}
                if (rect.left < 0) {console.warn('  - Too far left');}
                if (rect.right > window.innerWidth) {console.warn('  - Too far right');}
            }

            // Check parent overflow
            let parent = menu.parentElement;
            let level = 0;
            console.log('Checking parent overflow:');
            while (parent && level < 5) {
                const parentStyles = window.getComputedStyle(parent);
                console.log(`  Parent ${level} (${parent.tagName}.${parent.className}):`, {
                    overflow: parentStyles.overflow,
                    overflowX: parentStyles.overflowX,
                    overflowY: parentStyles.overflowY,
                    position: parentStyles.position
                });
                parent = parent.parentElement;
                level++;
            }

            // Check if menu has any content
            console.log('Menu innerHTML length:', menu.innerHTML.length);
            console.log('Menu children count:', menu.children.length);
            console.log('First 300 chars of menu HTML:', menu.innerHTML.substring(0, 300));

            console.log('=== END DEBUG INFO ===');
        }, 100);
    }

    closeDropdown(trigger, menu) {
        console.log('Closing dropdown...');
        trigger.classList.remove('active');
        menu.classList.remove('show');

        // Force hide via JavaScript
        menu.style.opacity = '0';
        menu.style.visibility = 'hidden';
        menu.style.transform = 'translateY(-10px)';
    }

    detectLanguage() {
        const browserLang = navigator.language.substring(0, 2);
        return this.translations[browserLang] ? browserLang : 'en';
    }

    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`Language '${lang}' not supported`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('jacommander-language', lang);
        document.documentElement.lang = lang;
        this.updateUI();
    }

    translate(key) {
        return this.translations[this.currentLang][key] || this.translations['en'][key] || key;
    }

    updateUI() {
        // Update footer buttons
        document.querySelectorAll('.function-key').forEach((btn) => {
            const key = btn.dataset.key?.toLowerCase();
            if (key) {
                const translationKey = `${key}.${btn.textContent.split(' ')[1]?.toLowerCase()}`;
                const translation = this.translate(translationKey);
                if (translation !== translationKey) {
                    btn.textContent = translation;
                }
            }
        });

        // Update header buttons
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.title = `${this.translate('menu')} (F9)`;
        }

        const shortcutsBtn = document.getElementById('shortcuts-btn');
        if (shortcutsBtn) {
            shortcutsBtn.title = `${this.translate('keyboard.shortcuts')} (Ctrl+K)`;
        }

        const configBtn = document.getElementById('config-btn');
        if (configBtn) {
            configBtn.title = this.translate('configuration');
        }

        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.title = this.translate('toggle.theme');
        }

        // Update table headers
        document.querySelectorAll('th.col-name').forEach((th) => {
            th.textContent = this.translate('name');
        });
        document.querySelectorAll('th.col-size').forEach((th) => {
            th.textContent = this.translate('size');
        });
        document.querySelectorAll('th.col-modified').forEach((th) => {
            th.textContent = this.translate('modified');
        });

        // Update panel footers
        this.updatePanelInfo();

        // Update search placeholders
        document.querySelectorAll('input[type="search"]').forEach((input) => {
            input.placeholder = this.translate('search.placeholder');
        });

        // Notify app of language change
        if (this.app) {
            this.app.onLanguageChange?.(this.currentLang);
        }
    }

    updatePanelInfo() {
        // This will be called when file counts change
        ['left', 'right'].forEach((side) => {
            const itemCount = document.getElementById(`item-count-${side}`);
            const selectedCount = document.getElementById(`selected-count-${side}`);

            if (itemCount) {
                const count = itemCount.dataset.count || '0';
                itemCount.textContent = `${count} ${this.translate('items')}`;
            }

            if (selectedCount) {
                const count = selectedCount.dataset.count || '0';
                selectedCount.textContent = `${count} ${this.translate('selected')}`;
            }
        });
    }

    // Helper method to format file sizes with localized units
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        // Use locale-specific number formatting
        const formatter = new Intl.NumberFormat(this.currentLang, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        return `${formatter.format(size)} ${units[unitIndex]}`;
    }

    // Helper method to format dates
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        return new Intl.DateTimeFormat(this.currentLang, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLang;
    }

    // Get all available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Export for use in main app
export default SimpleI18n;
