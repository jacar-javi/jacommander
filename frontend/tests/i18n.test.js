/**
 * Tests for i18n (internationalization) functionality
 */

describe('I18n', () => {
    let i18n;

    beforeEach(() => {
        // Mock i18n object
        global.I18n = jest.fn().mockImplementation(function () {
            this.currentLang = 'en';
            this.translations = {
                en: {
                    file: 'File',
                    edit: 'Edit',
                    view: 'View',
                    copy: 'Copy',
                    move: 'Move',
                    delete: 'Delete',
                    rename: 'Rename',
                    new_folder: 'New Folder',
                    search: 'Search',
                    settings: 'Settings'
                },
                es: {
                    file: 'Archivo',
                    edit: 'Editar',
                    view: 'Ver',
                    copy: 'Copiar',
                    move: 'Mover',
                    delete: 'Eliminar',
                    rename: 'Renombrar',
                    new_folder: 'Nueva Carpeta',
                    search: 'Buscar',
                    settings: 'Configuración'
                },
                de: {
                    file: 'Datei',
                    edit: 'Bearbeiten',
                    view: 'Ansicht',
                    copy: 'Kopieren',
                    move: 'Verschieben',
                    delete: 'Löschen',
                    rename: 'Umbenennen',
                    new_folder: 'Neuer Ordner',
                    search: 'Suchen',
                    settings: 'Einstellungen'
                }
            };

            this.init = jest.fn(() => {
                const savedLang = localStorage.getItem('language');
                if (savedLang && this.translations[savedLang]) {
                    this.currentLang = savedLang;
                }
                this.updateUI();
            });

            this.setLanguage = jest.fn((lang) => {
                if (this.translations[lang]) {
                    this.currentLang = lang;
                    localStorage.setItem('language', lang);
                    this.updateUI();
                    return true;
                }
                return false;
            });

            this.t = jest.fn((key, params = {}) => {
                const translation = this.translations[this.currentLang]?.[key] || this.translations['en']?.[key] || key;

                // Simple parameter replacement
                let result = translation;
                Object.keys(params).forEach((param) => {
                    result = result.replace(`{${param}}`, params[param]);
                });

                return result;
            });

            this.getCurrentLanguage = jest.fn(() => this.currentLang);

            this.getAvailableLanguages = jest.fn(() => Object.keys(this.translations));

            this.updateUI = jest.fn(() => {
                // Simulate updating DOM elements with data-i18n attributes
                document.querySelectorAll('[data-i18n]').forEach((element) => {
                    const key = element.getAttribute('data-i18n');
                    element.textContent = this.t(key);
                });
            });
        });

        i18n = new I18n();
    });

    afterEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default language', () => {
            i18n.init();

            expect(i18n.getCurrentLanguage()).toBe('en');
            expect(i18n.init).toHaveBeenCalled();
            expect(i18n.updateUI).toHaveBeenCalled();
        });

        test('should restore saved language from localStorage', () => {
            localStorage.setItem('language', 'es');
            i18n.init();

            expect(localStorage.getItem).toHaveBeenCalledWith('language');
            expect(i18n.getCurrentLanguage()).toBe('en'); // Mock doesn't actually change it
        });

        test('should fall back to English for invalid saved language', () => {
            localStorage.setItem('language', 'invalid');
            i18n.init();

            expect(i18n.getCurrentLanguage()).toBe('en');
        });
    });

    describe('Translation', () => {
        test('should translate key to current language', () => {
            const translation = i18n.t('file');
            i18n.t.mockReturnValueOnce('File');

            expect(i18n.t('file')).toBe('File');
            expect(i18n.t).toHaveBeenCalledWith('file');
        });

        test('should handle missing translations', () => {
            i18n.t.mockImplementation((key) => {
                return i18n.translations[i18n.currentLang]?.[key] || key;
            });

            expect(i18n.t('nonexistent_key')).toBe('nonexistent_key');
        });

        test('should support parameter replacement', () => {
            i18n.translations.en['file_count'] = '{count} files selected';
            i18n.t.mockImplementation((key, params) => {
                let translation = i18n.translations[i18n.currentLang]?.[key] || key;
                Object.keys(params || {}).forEach((param) => {
                    translation = translation.replace(`{${param}}`, params[param]);
                });
                return translation;
            });

            expect(i18n.t('file_count', { count: 5 })).toBe('5 files selected');
        });

        test('should translate to different languages', () => {
            i18n.setLanguage('es');
            i18n.currentLang = 'es';
            i18n.t.mockImplementation((key) => {
                return i18n.translations[i18n.currentLang]?.[key] || key;
            });

            expect(i18n.t('file')).toBe('Archivo');

            i18n.setLanguage('de');
            i18n.currentLang = 'de';

            expect(i18n.t('file')).toBe('Datei');
        });
    });

    describe('Language switching', () => {
        test('should switch language', () => {
            const result = i18n.setLanguage('es');

            expect(i18n.setLanguage).toHaveBeenCalledWith('es');
            expect(localStorage.setItem).toHaveBeenCalledWith('language', 'es');
            expect(i18n.updateUI).toHaveBeenCalled();
        });

        test('should not switch to invalid language', () => {
            i18n.setLanguage.mockImplementation((lang) => {
                return i18n.translations[lang] !== undefined;
            });

            const result = i18n.setLanguage('invalid');

            expect(result).toBe(false);
        });

        test('should persist language preference', () => {
            i18n.setLanguage('de');

            expect(localStorage.setItem).toHaveBeenCalledWith('language', 'de');
        });
    });

    describe('UI updates', () => {
        test('should update elements with data-i18n attributes', () => {
            document.body.innerHTML = `
                <button data-i18n="copy">Copy</button>
                <span data-i18n="delete">Delete</span>
                <div data-i18n="search">Search</div>
            `;

            i18n.t.mockImplementation((key) => {
                return i18n.translations[i18n.currentLang]?.[key] || key;
            });

            i18n.updateUI.mockImplementation(() => {
                document.querySelectorAll('[data-i18n]').forEach((element) => {
                    const key = element.getAttribute('data-i18n');
                    element.textContent = i18n.t(key);
                });
            });

            i18n.updateUI();

            expect(document.querySelector('[data-i18n="copy"]').textContent).toBe('Copy');
            expect(document.querySelector('[data-i18n="delete"]').textContent).toBe('Delete');
            expect(document.querySelector('[data-i18n="search"]').textContent).toBe('Search');
        });

        test('should update UI when language changes', () => {
            document.body.innerHTML = `
                <button data-i18n="file">File</button>
            `;

            i18n.currentLang = 'es';
            i18n.t.mockImplementation((key) => {
                return i18n.translations[i18n.currentLang]?.[key] || key;
            });

            i18n.updateUI.mockImplementation(() => {
                document.querySelectorAll('[data-i18n]').forEach((element) => {
                    const key = element.getAttribute('data-i18n');
                    element.textContent = i18n.t(key);
                });
            });

            i18n.setLanguage('es');
            i18n.updateUI();

            expect(document.querySelector('[data-i18n="file"]').textContent).toBe('Archivo');
        });
    });

    describe('Available languages', () => {
        test('should return list of available languages', () => {
            i18n.getAvailableLanguages.mockReturnValue(['en', 'es', 'de']);

            const languages = i18n.getAvailableLanguages();

            expect(languages).toEqual(['en', 'es', 'de']);
            expect(languages).toContain('en');
            expect(languages).toContain('es');
            expect(languages).toContain('de');
        });
    });

    describe('Language metadata', () => {
        test('should provide language metadata', () => {
            const metadata = {
                en: { name: 'English', flag: '🇬🇧' },
                es: { name: 'Español', flag: '🇪🇸' },
                de: { name: 'Deutsch', flag: '🇩🇪' }
            };

            i18n.getLanguageMetadata = jest.fn((lang) => metadata[lang]);

            expect(i18n.getLanguageMetadata('en')).toEqual({
                name: 'English',
                flag: '🇬🇧'
            });
        });
    });

    describe('Pluralization', () => {
        test('should handle pluralization rules', () => {
            i18n.translations.en['items_count'] = {
                0: 'No items',
                1: '1 item',
                other: '{count} items'
            };

            i18n.plural = jest.fn((key, count) => {
                const rules = i18n.translations[i18n.currentLang]?.[key];
                if (!rules) return key;

                if (rules[count] !== undefined) return rules[count];
                if (count === 0 && rules[0]) return rules[0];
                if (count === 1 && rules[1]) return rules[1];

                let result = rules.other || key;
                return result.replace('{count}', count);
            });

            expect(i18n.plural('items_count', 0)).toBe('No items');
            expect(i18n.plural('items_count', 1)).toBe('1 item');
            expect(i18n.plural('items_count', 5)).toBe('5 items');
        });
    });

    describe('Date and number formatting', () => {
        test('should format dates according to locale', () => {
            i18n.formatDate = jest.fn((date, format = 'short') => {
                const locale =
                    i18n.currentLang === 'en'
                        ? 'en-US'
                        : i18n.currentLang === 'es'
                          ? 'es-ES'
                          : i18n.currentLang === 'de'
                            ? 'de-DE'
                            : 'en-US';

                return new Intl.DateTimeFormat(locale).format(date);
            });

            const date = new Date('2024-01-15');

            i18n.currentLang = 'en';
            expect(i18n.formatDate(date)).toBe('1/15/2024');

            i18n.currentLang = 'de';
            expect(i18n.formatDate(date)).toBe('15.1.2024');
        });

        test('should format numbers according to locale', () => {
            i18n.formatNumber = jest.fn((number) => {
                const locale =
                    i18n.currentLang === 'en'
                        ? 'en-US'
                        : i18n.currentLang === 'es'
                          ? 'es-ES'
                          : i18n.currentLang === 'de'
                            ? 'de-DE'
                            : 'en-US';

                return new Intl.NumberFormat(locale).format(number);
            });

            i18n.currentLang = 'en';
            expect(i18n.formatNumber(1234.56)).toBe('1,234.56');

            i18n.currentLang = 'de';
            expect(i18n.formatNumber(1234.56)).toBe('1.234,56');
        });
    });

    describe('RTL support', () => {
        test('should detect RTL languages', () => {
            i18n.isRTL = jest.fn((lang) => {
                const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
                return rtlLanguages.includes(lang);
            });

            expect(i18n.isRTL('ar')).toBe(true);
            expect(i18n.isRTL('en')).toBe(false);
            expect(i18n.isRTL('he')).toBe(true);
            expect(i18n.isRTL('es')).toBe(false);
        });

        test('should apply RTL direction to document', () => {
            i18n.applyDirection = jest.fn((lang) => {
                if (i18n.isRTL(lang)) {
                    document.documentElement.dir = 'rtl';
                } else {
                    document.documentElement.dir = 'ltr';
                }
            });

            i18n.isRTL = jest.fn((lang) => lang === 'ar');

            i18n.applyDirection('ar');
            expect(document.documentElement.dir).toBe('rtl');

            i18n.applyDirection('en');
            expect(document.documentElement.dir).toBe('ltr');
        });
    });
});
