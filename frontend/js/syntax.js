/**
 * Syntax Highlighter Module
 * Provides syntax highlighting for various file types
 */

export class SyntaxHighlighter {
    constructor() {
        // Language detection patterns
        this.languageMap = {
            // Programming languages
            js: 'javascript',
            mjs: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            go: 'go',
            rs: 'rust',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            h: 'c',
            hpp: 'cpp',
            cs: 'csharp',
            php: 'php',
            rb: 'ruby',
            swift: 'swift',
            kt: 'kotlin',
            scala: 'scala',
            r: 'r',
            lua: 'lua',
            dart: 'dart',

            // Web languages
            html: 'html',
            htm: 'html',
            xml: 'xml',
            svg: 'xml',
            css: 'css',
            scss: 'scss',
            sass: 'scss',
            less: 'less',

            // Data formats
            json: 'json',
            yaml: 'yaml',
            yml: 'yaml',
            toml: 'toml',
            ini: 'ini',
            conf: 'conf',
            cfg: 'conf',

            // Shell scripts
            sh: 'bash',
            bash: 'bash',
            zsh: 'bash',
            fish: 'bash',
            ps1: 'powershell',
            bat: 'batch',
            cmd: 'batch',

            // Markup
            md: 'markdown',
            markdown: 'markdown',
            rst: 'rst',
            tex: 'latex',

            // Database
            sql: 'sql',

            // Config files
            dockerfile: 'dockerfile',
            makefile: 'makefile',
            gitignore: 'gitignore',
            env: 'env'
        };

        // Syntax patterns for different languages
        this.patterns = {
            javascript: {
                keywords:
                    /\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g,
                strings: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
                comments: /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm,
                numbers: /\b(\d+\.?\d*([eE][+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)\b/g,
                functions: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
                operators: /([+\-*/%=!<>&|^~?:]+)/g,
                brackets: /([{}[\]()])/g
            },
            python: {
                keywords:
                    /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/g,
                strings: /(["'])(?:(?=(\\?))\2.)*?\1|'''[\s\S]*?'''|"""[\s\S]*?"""/g,
                comments: /(#.*$)/gm,
                numbers: /\b(\d+\.?\d*([eE][+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)\b/g,
                functions: /\b(def|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
                decorators: /(@[a-zA-Z_][a-zA-Z0-9_]*)/g,
                operators: /([+\-*/%=!<>&|^~]+)/g,
                brackets: /([{}[\]()])/g
            },
            go: {
                keywords:
                    /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/g,
                strings: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
                comments: /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm,
                numbers: /\b(\d+\.?\d*([eE][+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)\b/g,
                types: /\b(bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/g,
                functions: /\b(func)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
                operators: /([+\-*/%=!<>&|^]+|:=)/g,
                brackets: /([{}[\]()])/g
            },
            json: {
                keys: /"([^"]+)"(?=\s*:)/g,
                strings: /"([^"]*)"/g,
                numbers: /\b(-?\d+\.?\d*([eE][+-]?\d+)?)\b/g,
                booleans: /\b(true|false|null)\b/g,
                brackets: /([{}[\],:])/g
            },
            html: {
                tags: /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
                attributes: /\s([a-zA-Z-]+)(?==)/g,
                strings: /(["'])(?:(?=(\\?))\2.)*?\1/g,
                comments: /<!--[\s\S]*?-->/g,
                doctype: /<!DOCTYPE[^>]*>/gi
            },
            css: {
                selectors: /([.#]?[a-zA-Z][a-zA-Z0-9-_]*|:[a-zA-Z-]+|\[[^\]]+\])/g,
                properties: /([a-zA-Z-]+)(?=\s*:)/g,
                values: /:\s*([^;]+)/g,
                comments: /\/\*[\s\S]*?\*\//g,
                strings: /(["'])(?:(?=(\\?))\2.)*?\1/g,
                numbers: /\b(\d+\.?\d*(px|em|rem|%|vh|vw|pt|cm|mm|in|pc|ex|ch)?)\b/g,
                colors: /#[0-9a-fA-F]{3,8}\b|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g
            },
            sql: {
                keywords:
                    /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|ALTER|DROP|INDEX|VIEW|PROCEDURE|FUNCTION|TRIGGER|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|NOT|NULL|DEFAULT|AUTO_INCREMENT|ORDER|BY|GROUP|HAVING|JOIN|INNER|LEFT|RIGHT|OUTER|ON|AS|AND|OR|IN|EXISTS|BETWEEN|LIKE|LIMIT|OFFSET|UNION|ALL)\b/gi,
                strings: /(["'])(?:(?=(\\?))\2.)*?\1/g,
                comments: /(--.*$)|(\/\*[\s\S]*?\*\/)/gm,
                numbers: /\b(\d+\.?\d*)\b/g,
                operators: /([=<>!]+|AND|OR|NOT)/gi
            },
            markdown: {
                headers: /^(#{1,6})\s+(.*)$/gm,
                bold: /\*\*([^*]+)\*\*|__([^_]+)__/g,
                italic: /\*([^*]+)\*|_([^_]+)_/g,
                code: /`([^`]+)`/g,
                codeblock: /```[\s\S]*?```/g,
                links: /\[([^\]]+)\]\(([^)]+)\)/g,
                lists: /^(\s*[-*+]|\s*\d+\.)\s+/gm,
                blockquote: /^>\s+(.*)$/gm,
                hr: /^---+$/gm
            },
            yaml: {
                keys: /^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/gm,
                strings: /(["'])(?:(?=(\\?))\2.)*?\1/g,
                comments: /(#.*$)/gm,
                numbers: /\b(-?\d+\.?\d*([eE][+-]?\d+)?)\b/g,
                booleans: /\b(true|false|yes|no|on|off|null)\b/gi,
                arrays: /^(\s*)-\s+/gm
            }
        };

        // Color themes
        this.themes = {
            dark: {
                keyword: '#C586C0',
                string: '#CE9178',
                comment: '#6A9955',
                number: '#B5CEA8',
                function: '#DCDCAA',
                type: '#4EC9B0',
                operator: '#D4D4D4',
                bracket: '#FFD700',
                decorator: '#C586C0',
                tag: '#569CD6',
                attribute: '#9CDCFE',
                selector: '#D7BA7D',
                property: '#9CDCFE',
                value: '#CE9178',
                key: '#9CDCFE',
                boolean: '#569CD6',
                default: '#D4D4D4'
            },
            light: {
                keyword: '#0000FF',
                string: '#A31515',
                comment: '#008000',
                number: '#098658',
                function: '#795E26',
                type: '#267F99',
                operator: '#000000',
                bracket: '#000000',
                decorator: '#0000FF',
                tag: '#800000',
                attribute: '#FF0000',
                selector: '#800000',
                property: '#FF0000',
                value: '#0000FF',
                key: '#0451A5',
                boolean: '#0000FF',
                default: '#000000'
            },
            highContrast: {
                keyword: '#569CD6',
                string: '#CE9178',
                comment: '#608B4E',
                number: '#B5CEA8',
                function: '#DCDCAA',
                type: '#4EC9B0',
                operator: '#FFFFFF',
                bracket: '#FFD700',
                decorator: '#569CD6',
                tag: '#569CD6',
                attribute: '#9CDCFE',
                selector: '#D7BA7D',
                property: '#9CDCFE',
                value: '#CE9178',
                key: '#9CDCFE',
                boolean: '#569CD6',
                default: '#FFFFFF'
            }
        };

        // Current theme
        this.currentTheme = 'dark';
    }

    /**
     * Detect language from file extension
     */
    detectLanguage(filename) {
        const ext = filename.split('.').pop().toLowerCase();

        // Special cases for files without extensions
        const specialFiles = {
            dockerfile: 'dockerfile',
            makefile: 'makefile',
            '.gitignore': 'gitignore',
            '.env': 'env'
        };

        const baseFilename = filename.toLowerCase();
        if (specialFiles[baseFilename]) {
            return specialFiles[baseFilename];
        }

        return this.languageMap[ext] || 'plaintext';
    }

    /**
     * Set the color theme
     */
    setTheme(theme) {
        if (this.themes[theme]) {
            this.currentTheme = theme;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Apply syntax highlighting to text
     */
    highlight(text, language) {
        if (!text) {return '';}

        // First escape HTML to prevent XSS
        let highlighted = this.escapeHtml(text);

        // Get patterns for the language
        const patterns = this.patterns[language];
        if (!patterns) {
            // No patterns for this language, return with basic styling
            return `<span class="syntax-default">${highlighted}</span>`;
        }

        // Get theme colors
        const colors = this.themes[this.currentTheme];

        // Store replacements to avoid overlapping
        const replacements = [];
        let placeholderIndex = 0;

        // Helper function to add replacement
        const addReplacement = (match, className, color) => {
            const placeholder = `__HIGHLIGHT_${placeholderIndex++}__`;
            replacements.push({
                placeholder,
                html: `<span class="syntax-${className}" style="color: ${color}">${this.escapeHtml(match)}</span>`
            });
            return placeholder;
        };

        // Apply highlighting patterns based on language
        if (language === 'json') {
            // JSON-specific highlighting
            highlighted = highlighted.replace(patterns.keys, (match, key) => {
                return addReplacement(match, 'key', colors.key);
            });
            highlighted = highlighted.replace(patterns.strings, (match) => {
                return addReplacement(match, 'string', colors.string);
            });
            highlighted = highlighted.replace(patterns.numbers, (match) => {
                return addReplacement(match, 'number', colors.number);
            });
            highlighted = highlighted.replace(patterns.booleans, (match) => {
                return addReplacement(match, 'boolean', colors.boolean);
            });
        } else if (language === 'html' || language === 'xml') {
            // HTML/XML highlighting
            highlighted = highlighted.replace(patterns.comments, (match) => {
                return addReplacement(match, 'comment', colors.comment);
            });
            highlighted = highlighted.replace(patterns.tags, (match) => {
                return addReplacement(match, 'tag', colors.tag);
            });
            highlighted = highlighted.replace(patterns.attributes, (match) => {
                return addReplacement(match, 'attribute', colors.attribute);
            });
            highlighted = highlighted.replace(patterns.strings, (match) => {
                return addReplacement(match, 'string', colors.string);
            });
        } else if (language === 'css' || language === 'scss' || language === 'less') {
            // CSS highlighting
            highlighted = highlighted.replace(patterns.comments, (match) => {
                return addReplacement(match, 'comment', colors.comment);
            });
            highlighted = highlighted.replace(patterns.selectors, (match) => {
                return addReplacement(match, 'selector', colors.selector);
            });
            highlighted = highlighted.replace(patterns.properties, (match) => {
                return addReplacement(match, 'property', colors.property);
            });
            highlighted = highlighted.replace(patterns.strings, (match) => {
                return addReplacement(match, 'string', colors.string);
            });
            highlighted = highlighted.replace(patterns.colors, (match) => {
                return addReplacement(match, 'color', colors.value);
            });
            highlighted = highlighted.replace(patterns.numbers, (match) => {
                return addReplacement(match, 'number', colors.number);
            });
        } else if (language === 'markdown') {
            // Markdown highlighting
            highlighted = highlighted.replace(patterns.codeblock, (match) => {
                return addReplacement(match, 'codeblock', colors.string);
            });
            highlighted = highlighted.replace(patterns.headers, (match) => {
                return addReplacement(match, 'header', colors.keyword);
            });
            highlighted = highlighted.replace(patterns.bold, (match) => {
                return addReplacement(match, 'bold', colors.function);
            });
            highlighted = highlighted.replace(patterns.italic, (match) => {
                return addReplacement(match, 'italic', colors.string);
            });
            highlighted = highlighted.replace(patterns.code, (match) => {
                return addReplacement(match, 'code', colors.string);
            });
            highlighted = highlighted.replace(patterns.links, (match) => {
                return addReplacement(match, 'link', colors.type);
            });
            highlighted = highlighted.replace(patterns.lists, (match) => {
                return addReplacement(match, 'list', colors.operator);
            });
            highlighted = highlighted.replace(patterns.blockquote, (match) => {
                return addReplacement(match, 'blockquote', colors.comment);
            });
        } else if (language === 'sql') {
            // SQL highlighting
            highlighted = highlighted.replace(patterns.comments, (match) => {
                return addReplacement(match, 'comment', colors.comment);
            });
            highlighted = highlighted.replace(patterns.strings, (match) => {
                return addReplacement(match, 'string', colors.string);
            });
            highlighted = highlighted.replace(patterns.keywords, (match) => {
                return addReplacement(match, 'keyword', colors.keyword);
            });
            highlighted = highlighted.replace(patterns.numbers, (match) => {
                return addReplacement(match, 'number', colors.number);
            });
        } else if (language === 'yaml') {
            // YAML highlighting
            highlighted = highlighted.replace(patterns.comments, (match) => {
                return addReplacement(match, 'comment', colors.comment);
            });
            highlighted = highlighted.replace(patterns.keys, (match) => {
                return addReplacement(match, 'key', colors.key);
            });
            highlighted = highlighted.replace(patterns.strings, (match) => {
                return addReplacement(match, 'string', colors.string);
            });
            highlighted = highlighted.replace(patterns.numbers, (match) => {
                return addReplacement(match, 'number', colors.number);
            });
            highlighted = highlighted.replace(patterns.booleans, (match) => {
                return addReplacement(match, 'boolean', colors.boolean);
            });
            highlighted = highlighted.replace(patterns.arrays, (match) => {
                return addReplacement(match, 'array', colors.operator);
            });
        } else {
            // Generic programming language highlighting
            // Order matters: comments and strings first to avoid highlighting keywords inside them
            if (patterns.comments) {
                highlighted = highlighted.replace(patterns.comments, (match) => {
                    return addReplacement(match, 'comment', colors.comment);
                });
            }
            if (patterns.strings) {
                highlighted = highlighted.replace(patterns.strings, (match) => {
                    return addReplacement(match, 'string', colors.string);
                });
            }
            if (patterns.decorators) {
                highlighted = highlighted.replace(patterns.decorators, (match) => {
                    return addReplacement(match, 'decorator', colors.decorator);
                });
            }
            if (patterns.keywords) {
                highlighted = highlighted.replace(patterns.keywords, (match) => {
                    return addReplacement(match, 'keyword', colors.keyword);
                });
            }
            if (patterns.types) {
                highlighted = highlighted.replace(patterns.types, (match) => {
                    return addReplacement(match, 'type', colors.type);
                });
            }
            if (patterns.functions) {
                highlighted = highlighted.replace(patterns.functions, (match, keyword, name) => {
                    if (name) {
                        return addReplacement(match, 'function', colors.function);
                    }
                    return match;
                });
            }
            if (patterns.numbers) {
                highlighted = highlighted.replace(patterns.numbers, (match) => {
                    return addReplacement(match, 'number', colors.number);
                });
            }
            if (patterns.operators) {
                highlighted = highlighted.replace(patterns.operators, (match) => {
                    return addReplacement(match, 'operator', colors.operator);
                });
            }
            if (patterns.brackets) {
                highlighted = highlighted.replace(patterns.brackets, (match) => {
                    return addReplacement(match, 'bracket', colors.bracket);
                });
            }
        }

        // Replace all placeholders with actual HTML
        replacements.forEach(({ placeholder, html }) => {
            highlighted = highlighted.replace(new RegExp(placeholder, 'g'), html);
        });

        // Add line numbers
        const lines = highlighted.split('\n');
        const numberedLines = lines
            .map((line, index) => {
                const lineNumber = index + 1;
                return `<span class="line-number">${lineNumber.toString().padStart(4, ' ')}</span><span class="line-content">${line || ' '}</span>`;
            })
            .join('\n');

        return `<pre class="syntax-highlighted" data-language="${language}"><code>${numberedLines}</code></pre>`;
    }

    /**
     * Apply highlighting to a text element
     */
    highlightElement(element, filename) {
        const language = this.detectLanguage(filename);
        const text = element.textContent;
        element.innerHTML = this.highlight(text, language);
    }

    /**
     * Get supported languages list
     */
    getSupportedLanguages() {
        return Object.keys(this.patterns);
    }

    /**
     * Check if a language is supported
     */
    isLanguageSupported(language) {
        return !!this.patterns[language];
    }
}
