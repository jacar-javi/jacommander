// simple-i18n.js - Multi-language support for JaCommander
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
                close: 'Close'
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
                close: 'Cerrar'
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
                close: 'Schließen'
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

        if (!trigger || !menu) {return;}

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

        const items = menu.querySelectorAll('.dropdown-item');

        // Set initial display
        this.updateDropdownDisplay(this.languageMetadata[this.currentLang]);

        // Toggle dropdown on click
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.contains('show');

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

        if (flag) {flag.textContent = langData.flag;}
        if (text) {text.textContent = langData.code;}
    }

    openDropdown(trigger, menu) {
        trigger.classList.add('active');
        menu.classList.add('show');
    }

    closeDropdown(trigger, menu) {
        trigger.classList.remove('active');
        menu.classList.remove('show');
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
        if (menuBtn) {menuBtn.title = `${this.translate('menu')} (F9)`;}

        const shortcutsBtn = document.getElementById('shortcuts-btn');
        if (shortcutsBtn) {shortcutsBtn.title = `${this.translate('keyboard.shortcuts')} (Ctrl+K)`;}

        const configBtn = document.getElementById('config-btn');
        if (configBtn) {configBtn.title = this.translate('configuration');}

        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {themeBtn.title = this.translate('toggle.theme');}

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
