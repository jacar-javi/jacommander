/**
 * Internationalization (i18n) Module
 * Provides multi-language support for JaCommander
 */

export class I18n {
    constructor(app) {
        this.app = app;
        this.currentLang = 'en';
        this.translations = {};
        this.fallbackLang = 'en';
        this.supportedLanguages = [
            { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
            { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
            { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
            { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
            { code: 'pt', name: 'Português', flag: '🇵🇹', dir: 'ltr' },
            { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
            { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' },
            { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
            { code: 'ko', name: '한국어', flag: '🇰🇷', dir: 'ltr' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
            { code: 'he', name: 'עברית', flag: '🇮🇱', dir: 'rtl' }
        ];

        this.dateFormats = {
            en: { short: 'MM/DD/YYYY', long: 'MMMM DD, YYYY', time: '12h' },
            es: { short: 'DD/MM/YYYY', long: 'DD de MMMM de YYYY', time: '24h' },
            fr: { short: 'DD/MM/YYYY', long: 'DD MMMM YYYY', time: '24h' },
            de: { short: 'DD.MM.YYYY', long: 'DD. MMMM YYYY', time: '24h' },
            ja: { short: 'YYYY年MM月DD日', long: 'YYYY年MM月DD日', time: '24h' },
            zh: { short: 'YYYY年MM月DD日', long: 'YYYY年MM月DD日', time: '24h' }
        };

        this.numberFormats = {
            en: { decimal: '.', thousands: ',', currency: '$' },
            es: { decimal: ',', thousands: '.', currency: '€' },
            fr: { decimal: ',', thousands: ' ', currency: '€' },
            de: { decimal: ',', thousands: '.', currency: '€' },
            ja: { decimal: '.', thousands: ',', currency: '¥' },
            zh: { decimal: '.', thousands: ',', currency: '¥' }
        };

        this.init();
    }

    init() {
        this.loadTranslations();
        this.detectLanguage();
        this.createLanguageSelector();
        this.applyLanguage();
    }

    loadTranslations() {
        // English (Default)
        this.translations.en = {
            // File operations
            'file.copy': 'Copy',
            'file.move': 'Move',
            'file.delete': 'Delete',
            'file.rename': 'Rename',
            'file.create': 'Create',
            'file.open': 'Open',
            'file.edit': 'Edit',
            'file.view': 'View',
            'file.properties': 'Properties',
            'file.compress': 'Compress',
            'file.extract': 'Extract',
            'file.download': 'Download',
            'file.upload': 'Upload',

            // Navigation
            'nav.back': 'Back',
            'nav.forward': 'Forward',
            'nav.up': 'Parent Directory',
            'nav.refresh': 'Refresh',
            'nav.home': 'Home',
            'nav.bookmarks': 'Bookmarks',
            'nav.history': 'History',

            // Panels
            'panel.left': 'Left Panel',
            'panel.right': 'Right Panel',
            'panel.switch': 'Switch Panel',
            'panel.sync': 'Sync Panels',

            // Search
            'search.placeholder': 'Search files...',
            'search.advanced': 'Advanced Search',
            'search.results': 'Search Results',
            'search.no_results': 'No results found',
            'search.searching': 'Searching...',

            // Dialogs
            'dialog.confirm': 'Confirm',
            'dialog.cancel': 'Cancel',
            'dialog.ok': 'OK',
            'dialog.yes': 'Yes',
            'dialog.no': 'No',
            'dialog.save': 'Save',
            'dialog.discard': 'Discard',
            'dialog.apply': 'Apply',
            'dialog.close': 'Close',

            // Messages
            'msg.confirm_delete': 'Are you sure you want to delete {count} item(s)?',
            'msg.confirm_overwrite': 'File already exists. Overwrite?',
            'msg.operation_success': 'Operation completed successfully',
            'msg.operation_failed': 'Operation failed: {error}',
            'msg.loading': 'Loading...',
            'msg.please_wait': 'Please wait...',
            'msg.copied_clipboard': 'Copied to clipboard',

            // Settings
            'settings.title': 'Settings',
            'settings.language': 'Language',
            'settings.theme': 'Theme',
            'settings.font_size': 'Font Size',
            'settings.show_hidden': 'Show Hidden Files',
            'settings.confirm_delete': 'Confirm Before Delete',
            'settings.double_click': 'Double Click to Open',
            'settings.date_format': 'Date Format',
            'settings.reset': 'Reset to Defaults',

            // File types
            'type.file': 'File',
            'type.folder': 'Folder',
            'type.image': 'Image',
            'type.video': 'Video',
            'type.audio': 'Audio',
            'type.document': 'Document',
            'type.archive': 'Archive',
            'type.executable': 'Executable',
            'type.unknown': 'Unknown',

            // Size units
            'size.bytes': 'bytes',
            'size.kb': 'KB',
            'size.mb': 'MB',
            'size.gb': 'GB',
            'size.tb': 'TB',

            // Time
            'time.today': 'Today',
            'time.yesterday': 'Yesterday',
            'time.this_week': 'This Week',
            'time.last_week': 'Last Week',
            'time.this_month': 'This Month',
            'time.last_month': 'Last Month',
            'time.this_year': 'This Year',
            'time.modified': 'Modified',
            'time.created': 'Created',
            'time.accessed': 'Accessed',

            // Toolbar
            'toolbar.new_folder': 'New Folder',
            'toolbar.new_file': 'New File',
            'toolbar.cut': 'Cut',
            'toolbar.copy': 'Copy',
            'toolbar.paste': 'Paste',
            'toolbar.select_all': 'Select All',
            'toolbar.deselect_all': 'Deselect All',
            'toolbar.invert_selection': 'Invert Selection',

            // Context menu
            'context.open_with': 'Open With...',
            'context.copy_path': 'Copy Path',
            'context.open_terminal': 'Open Terminal Here',
            'context.add_bookmark': 'Add to Bookmarks',
            'context.share': 'Share',
            'context.permissions': 'Permissions',

            // Shortcuts help
            'help.shortcuts': 'Keyboard Shortcuts',
            'help.about': 'About JaCommander',
            'help.documentation': 'Documentation',
            'help.report_issue': 'Report Issue',

            // Status
            'status.ready': 'Ready',
            'status.selected': '{count} selected',
            'status.total_size': 'Total: {size}',
            'status.free_space': 'Free: {space}',
            'status.items': '{count} items',

            // Errors
            'error.access_denied': 'Access Denied',
            'error.file_not_found': 'File Not Found',
            'error.path_not_found': 'Path Not Found',
            'error.disk_full': 'Disk Full',
            'error.network_error': 'Network Error',
            'error.invalid_operation': 'Invalid Operation',
            'error.unknown': 'Unknown Error'
        };

        // Spanish
        this.translations.es = {
            'file.copy': 'Copiar',
            'file.move': 'Mover',
            'file.delete': 'Eliminar',
            'file.rename': 'Renombrar',
            'file.create': 'Crear',
            'file.open': 'Abrir',
            'file.edit': 'Editar',
            'file.view': 'Ver',
            'file.properties': 'Propiedades',
            'file.compress': 'Comprimir',
            'file.extract': 'Extraer',
            'file.download': 'Descargar',
            'file.upload': 'Subir',

            'nav.back': 'Atrás',
            'nav.forward': 'Adelante',
            'nav.up': 'Directorio Padre',
            'nav.refresh': 'Actualizar',
            'nav.home': 'Inicio',
            'nav.bookmarks': 'Marcadores',
            'nav.history': 'Historial',

            'panel.left': 'Panel Izquierdo',
            'panel.right': 'Panel Derecho',
            'panel.switch': 'Cambiar Panel',
            'panel.sync': 'Sincronizar Paneles',

            'search.placeholder': 'Buscar archivos...',
            'search.advanced': 'Búsqueda Avanzada',
            'search.results': 'Resultados de Búsqueda',
            'search.no_results': 'No se encontraron resultados',
            'search.searching': 'Buscando...',

            'dialog.confirm': 'Confirmar',
            'dialog.cancel': 'Cancelar',
            'dialog.ok': 'Aceptar',
            'dialog.yes': 'Sí',
            'dialog.no': 'No',
            'dialog.save': 'Guardar',
            'dialog.discard': 'Descartar',
            'dialog.apply': 'Aplicar',
            'dialog.close': 'Cerrar',

            'msg.confirm_delete': '¿Está seguro de eliminar {count} elemento(s)?',
            'msg.confirm_overwrite': 'El archivo ya existe. ¿Sobrescribir?',
            'msg.operation_success': 'Operación completada con éxito',
            'msg.operation_failed': 'Operación fallida: {error}',
            'msg.loading': 'Cargando...',
            'msg.please_wait': 'Por favor espere...',
            'msg.copied_clipboard': 'Copiado al portapapeles',

            'settings.title': 'Configuración',
            'settings.language': 'Idioma',
            'settings.theme': 'Tema',
            'settings.font_size': 'Tamaño de Fuente',
            'settings.show_hidden': 'Mostrar Archivos Ocultos',
            'settings.confirm_delete': 'Confirmar Antes de Eliminar',
            'settings.double_click': 'Doble Clic para Abrir',
            'settings.date_format': 'Formato de Fecha',
            'settings.reset': 'Restablecer Valores',

            'type.file': 'Archivo',
            'type.folder': 'Carpeta',
            'type.image': 'Imagen',
            'type.video': 'Video',
            'type.audio': 'Audio',
            'type.document': 'Documento',
            'type.archive': 'Archivo',
            'type.executable': 'Ejecutable',
            'type.unknown': 'Desconocido'
        };

        // French
        this.translations.fr = {
            'file.copy': 'Copier',
            'file.move': 'Déplacer',
            'file.delete': 'Supprimer',
            'file.rename': 'Renommer',
            'file.create': 'Créer',
            'file.open': 'Ouvrir',
            'file.edit': 'Modifier',
            'file.view': 'Afficher',
            'file.properties': 'Propriétés',
            'file.compress': 'Compresser',
            'file.extract': 'Extraire',

            'nav.back': 'Retour',
            'nav.forward': 'Avant',
            'nav.up': 'Dossier Parent',
            'nav.refresh': 'Actualiser',
            'nav.home': 'Accueil',
            'nav.bookmarks': 'Favoris',
            'nav.history': 'Historique',

            'search.placeholder': 'Rechercher des fichiers...',
            'search.advanced': 'Recherche Avancée',
            'search.results': 'Résultats de Recherche',
            'search.no_results': 'Aucun résultat trouvé',
            'search.searching': 'Recherche...',

            'dialog.confirm': 'Confirmer',
            'dialog.cancel': 'Annuler',
            'dialog.ok': 'OK',
            'dialog.yes': 'Oui',
            'dialog.no': 'Non',
            'dialog.save': 'Enregistrer',
            'dialog.close': 'Fermer',

            'settings.title': 'Paramètres',
            'settings.language': 'Langue',
            'settings.theme': 'Thème'
        };

        // German
        this.translations.de = {
            'file.copy': 'Kopieren',
            'file.move': 'Verschieben',
            'file.delete': 'Löschen',
            'file.rename': 'Umbenennen',
            'file.create': 'Erstellen',
            'file.open': 'Öffnen',
            'file.edit': 'Bearbeiten',
            'file.view': 'Ansehen',
            'file.properties': 'Eigenschaften',
            'file.compress': 'Komprimieren',
            'file.extract': 'Extrahieren',

            'nav.back': 'Zurück',
            'nav.forward': 'Vorwärts',
            'nav.up': 'Übergeordneter Ordner',
            'nav.refresh': 'Aktualisieren',
            'nav.home': 'Startseite',
            'nav.bookmarks': 'Lesezeichen',
            'nav.history': 'Verlauf',

            'search.placeholder': 'Dateien suchen...',
            'search.advanced': 'Erweiterte Suche',
            'search.results': 'Suchergebnisse',
            'search.no_results': 'Keine Ergebnisse gefunden',
            'search.searching': 'Suche...',

            'dialog.confirm': 'Bestätigen',
            'dialog.cancel': 'Abbrechen',
            'dialog.ok': 'OK',
            'dialog.yes': 'Ja',
            'dialog.no': 'Nein',
            'dialog.save': 'Speichern',
            'dialog.close': 'Schließen',

            'settings.title': 'Einstellungen',
            'settings.language': 'Sprache',
            'settings.theme': 'Thema'
        };

        // Japanese
        this.translations.ja = {
            'file.copy': 'コピー',
            'file.move': '移動',
            'file.delete': '削除',
            'file.rename': '名前変更',
            'file.create': '作成',
            'file.open': '開く',
            'file.edit': '編集',
            'file.view': '表示',
            'file.properties': 'プロパティ',
            'file.compress': '圧縮',
            'file.extract': '展開',

            'nav.back': '戻る',
            'nav.forward': '進む',
            'nav.up': '親ディレクトリ',
            'nav.refresh': '更新',
            'nav.home': 'ホーム',
            'nav.bookmarks': 'ブックマーク',
            'nav.history': '履歴',

            'search.placeholder': 'ファイルを検索...',
            'search.advanced': '詳細検索',
            'search.results': '検索結果',
            'search.no_results': '結果が見つかりません',
            'search.searching': '検索中...',

            'dialog.confirm': '確認',
            'dialog.cancel': 'キャンセル',
            'dialog.ok': 'OK',
            'dialog.yes': 'はい',
            'dialog.no': 'いいえ',
            'dialog.save': '保存',
            'dialog.close': '閉じる',

            'settings.title': '設定',
            'settings.language': '言語',
            'settings.theme': 'テーマ'
        };

        // Chinese
        this.translations.zh = {
            'file.copy': '复制',
            'file.move': '移动',
            'file.delete': '删除',
            'file.rename': '重命名',
            'file.create': '创建',
            'file.open': '打开',
            'file.edit': '编辑',
            'file.view': '查看',
            'file.properties': '属性',
            'file.compress': '压缩',
            'file.extract': '解压',

            'nav.back': '后退',
            'nav.forward': '前进',
            'nav.up': '上级目录',
            'nav.refresh': '刷新',
            'nav.home': '主页',
            'nav.bookmarks': '书签',
            'nav.history': '历史',

            'search.placeholder': '搜索文件...',
            'search.advanced': '高级搜索',
            'search.results': '搜索结果',
            'search.no_results': '未找到结果',
            'search.searching': '搜索中...',

            'dialog.confirm': '确认',
            'dialog.cancel': '取消',
            'dialog.ok': '确定',
            'dialog.yes': '是',
            'dialog.no': '否',
            'dialog.save': '保存',
            'dialog.close': '关闭',

            'settings.title': '设置',
            'settings.language': '语言',
            'settings.theme': '主题'
        };

        // Add more languages as needed...
    }

    detectLanguage() {
        // Try to get saved language
        const saved = localStorage.getItem('jacommander_language');
        if (saved && this.isSupported(saved)) {
            this.currentLang = saved;
            return;
        }

        // Detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];

        if (this.isSupported(langCode)) {
            this.currentLang = langCode;
        } else {
            this.currentLang = this.fallbackLang;
        }
    }

    isSupported(langCode) {
        return this.supportedLanguages.some((lang) => lang.code === langCode);
    }

    createLanguageSelector() {
        const selector = document.createElement('div');
        selector.id = 'language-selector';
        selector.className = 'language-selector';
        selector.innerHTML = `
            <button class="lang-btn" title="Change Language">
                <span class="lang-flag">${this.getCurrentFlag()}</span>
                <span class="lang-code">${this.currentLang.toUpperCase()}</span>
            </button>
            <div class="lang-dropdown">
                ${this.supportedLanguages
                    .map(
                        (lang) => `
                    <div class="lang-option ${lang.code === this.currentLang ? 'active' : ''}" data-lang="${lang.code}">
                        <span class="lang-flag">${lang.flag}</span>
                        <span class="lang-name">${lang.name}</span>
                    </div>
                `
                    )
                    .join('')}
            </div>
        `;

        // Add to header
        const header = document.querySelector('.header');
        if (header) {
            header.appendChild(selector);
        }

        // Apply styles
        const style = document.createElement('style');
        style.textContent = `
            .language-selector {
                position: relative;
                margin-left: auto;
                margin-right: 10px;
            }

            .lang-btn {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 6px 12px;
                background: var(--button-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
            }

            .lang-btn:hover {
                background: var(--hover-bg);
            }

            .lang-flag {
                font-size: 18px;
            }

            .lang-code {
                font-weight: 500;
            }

            .lang-dropdown {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                min-width: 200px;
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
                margin-top: 5px;
            }

            .lang-dropdown.show {
                display: block;
            }

            .lang-option {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 15px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .lang-option:hover {
                background: var(--hover-bg);
            }

            .lang-option.active {
                background: var(--active-bg);
                color: var(--primary-color);
            }

            .lang-option .lang-flag {
                font-size: 20px;
            }

            .lang-option .lang-name {
                font-size: 14px;
            }

            /* RTL Support */
            [dir="rtl"] {
                direction: rtl;
                text-align: right;
            }

            [dir="rtl"] .language-selector {
                margin-left: 10px;
                margin-right: auto;
            }

            [dir="rtl"] .lang-dropdown {
                left: 0;
                right: auto;
            }

            [dir="rtl"] .panels {
                flex-direction: row-reverse;
            }

            /* Tooltip translations */
            .i18n-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 10000;
            }
        `;

        if (!document.querySelector('#i18n-styles')) {
            style.id = 'i18n-styles';
            document.head.appendChild(style);
        }

        // Event listeners
        const btn = selector.querySelector('.lang-btn');
        const dropdown = selector.querySelector('.lang-dropdown');

        btn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.lang-option');
            if (option) {
                const lang = option.dataset.lang;
                this.setLanguage(lang);
                dropdown.classList.remove('show');
            }
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        this.selector = selector;
    }

    getCurrentFlag() {
        const lang = this.supportedLanguages.find((l) => l.code === this.currentLang);
        return lang ? lang.flag : '🌐';
    }

    setLanguage(langCode) {
        if (!this.isSupported(langCode)) {
            console.error(`Language ${langCode} not supported`);
            return;
        }

        this.currentLang = langCode;
        localStorage.setItem('jacommander_language', langCode);
        this.applyLanguage();

        // Update selector
        if (this.selector) {
            const btn = this.selector.querySelector('.lang-btn');
            btn.querySelector('.lang-flag').textContent = this.getCurrentFlag();
            btn.querySelector('.lang-code').textContent = langCode.toUpperCase();

            // Update active state
            this.selector.querySelectorAll('.lang-option').forEach((option) => {
                option.classList.toggle('active', option.dataset.lang === langCode);
            });
        }

        // Notify app of language change
        this.app?.onLanguageChange?.(langCode);
    }

    applyLanguage() {
        const lang = this.supportedLanguages.find((l) => l.code === this.currentLang);
        if (lang) {
            document.documentElement.setAttribute('dir', lang.dir);
            document.documentElement.setAttribute('lang', this.currentLang);
        }

        // Update all translated elements
        this.translatePage();
    }

    translatePage() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach((element) => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Translate elements with data-i18n-alt attribute
        document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
            const key = element.getAttribute('data-i18n-alt');
            element.alt = this.t(key);
        });
    }

    t(key, params = {}) {
        // Get translation for current language
        let translation = this.translations[this.currentLang]?.[key];

        // Fallback to default language
        if (!translation) {
            translation = this.translations[this.fallbackLang]?.[key];
        }

        // If still not found, return key
        if (!translation) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        // Replace parameters
        Object.keys(params).forEach((param) => {
            const regex = new RegExp(`\\{${param}\\}`, 'g');
            translation = translation.replace(regex, params[param]);
        });

        return translation;
    }

    // Pluralization support
    plural(key, count) {
        const baseKey = `${key}.${count === 1 ? 'one' : 'other'}`;
        return this.t(baseKey, { count });
    }

    // Format date according to current locale
    formatDate(date, format = 'short') {
        const dateFormat = this.dateFormats[this.currentLang] || this.dateFormats.en;

        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        // Use Intl.DateTimeFormat for proper localization
        const options =
            format === 'long'
                ? { year: 'numeric', month: 'long', day: 'numeric' }
                : { year: 'numeric', month: '2-digit', day: '2-digit' };

        return new Intl.DateTimeFormat(this.currentLang, options).format(date);
    }

    // Format number according to current locale
    formatNumber(number, decimals = 0) {
        const format = this.numberFormats[this.currentLang] || this.numberFormats.en;

        // Use Intl.NumberFormat for proper localization
        return new Intl.NumberFormat(this.currentLang, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    // Format file size
    formatFileSize(bytes) {
        const units = ['size.bytes', 'size.kb', 'size.mb', 'size.gb', 'size.tb'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${this.formatNumber(size, unitIndex > 0 ? 2 : 0)} ${this.t(units[unitIndex])}`;
    }

    // Format relative time
    formatRelativeTime(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return this.t('time.today');
        }
        if (days === 1) {
            return this.t('time.yesterday');
        }
        if (days < 7) {
            return this.t('time.this_week');
        }
        if (days < 14) {
            return this.t('time.last_week');
        }
        if (days < 30) {
            return this.t('time.this_month');
        }
        if (days < 60) {
            return this.t('time.last_month');
        }
        if (days < 365) {
            return this.t('time.this_year');
        }

        return this.formatDate(date);
    }

    // Get all available languages
    getLanguages() {
        return this.supportedLanguages;
    }

    // Get current language
    getLanguage() {
        return this.currentLang;
    }

    // Check if RTL language
    isRTL() {
        const lang = this.supportedLanguages.find((l) => l.code === this.currentLang);
        return lang?.dir === 'rtl';
    }

    // Export translations for external use
    exportTranslations() {
        return {
            current: this.currentLang,
            translations: this.translations,
            languages: this.supportedLanguages
        };
    }

    // Import custom translations
    importTranslations(langCode, translations) {
        if (!this.translations[langCode]) {
            this.translations[langCode] = {};
        }

        Object.assign(this.translations[langCode], translations);
    }

    // Add new language support
    addLanguage(langConfig) {
        if (!langConfig.code || !langConfig.name) {
            console.error('Invalid language configuration');
            return;
        }

        // Add to supported languages
        this.supportedLanguages.push({
            code: langConfig.code,
            name: langConfig.name,
            flag: langConfig.flag || '🌐',
            dir: langConfig.dir || 'ltr'
        });

        // Add translations
        if (langConfig.translations) {
            this.translations[langConfig.code] = langConfig.translations;
        }

        // Add formats
        if (langConfig.dateFormat) {
            this.dateFormats[langConfig.code] = langConfig.dateFormat;
        }
        if (langConfig.numberFormat) {
            this.numberFormats[langConfig.code] = langConfig.numberFormat;
        }
    }

    // Create a translation helper for dynamic content
    createTranslator() {
        return (key, params) => this.t(key, params);
    }
}

// Export for global use
window.I18n = I18n;
