// Theme Manager Module
/* eslint-disable no-console */

export class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.themes = ['dark', 'light', 'high-contrast'];
        this.init();
    }

    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('jacommander-theme');

        if (savedTheme && this.themes.includes(savedTheme)) {
            this.currentTheme = savedTheme;
        } else {
            // Try to detect system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }

        // Apply the theme
        this.apply(this.currentTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('jacommander-theme-manual') !== 'true') {
                this.apply(e.matches ? 'dark' : 'light');
            }
        });
    }

    apply(theme) {
        if (!this.themes.includes(theme)) {
            console.error('Invalid theme:', theme);
            return;
        }

        // Remove all theme classes
        this.themes.forEach((t) => {
            document.body.classList.remove(`theme-${t}`);
        });

        // Add new theme class
        document.body.classList.add(`theme-${theme}`);
        this.currentTheme = theme;

        // Save to localStorage
        localStorage.setItem('jacommander-theme', theme);

        // Update theme button icon
        this.updateThemeButton();

        console.log('Theme applied:', theme);
    }

    toggle() {
        // Cycle through themes: dark -> light -> high-contrast -> dark
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];

        // Mark as manually set
        localStorage.setItem('jacommander-theme-manual', 'true');

        this.apply(nextTheme);

        // Show notification
        const themeNames = {
            dark: 'Dark',
            light: 'Light',
            'high-contrast': 'High Contrast'
        };

        if (window.app) {
            window.app.showNotification(`Theme: ${themeNames[nextTheme]}`, 'info');
        }
    }

    setTheme(theme) {
        if (this.themes.includes(theme)) {
            // Mark as manually set
            localStorage.setItem('jacommander-theme-manual', 'true');
            this.apply(theme);
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    updateThemeButton() {
        const button = document.getElementById('theme-btn');
        if (button) {
            // Use simple icon for now
            button.textContent = '◐';

            // Update tooltip
            const themeNames = {
                dark: 'Dark',
                light: 'Light',
                'high-contrast': 'High Contrast'
            };

            const currentName = themeNames[this.currentTheme];
            const nextIndex = (this.themes.indexOf(this.currentTheme) + 1) % this.themes.length;
            const nextName = themeNames[this.themes[nextIndex]];

            button.title = `Current: ${currentName} (Click for ${nextName})`;
        }
    }

    // Get computed style value for CSS variable
    getCSSVariable(variable) {
        return getComputedStyle(document.body).getPropertyValue(variable).trim();
    }

    // Set custom CSS variable
    setCSSVariable(variable, value) {
        document.body.style.setProperty(variable, value);
    }

    // Create custom theme
    createCustomTheme(name, variables) {
        // Store custom theme in localStorage
        const customThemes = JSON.parse(localStorage.getItem('jacommander-custom-themes') || '{}');
        customThemes[name] = variables;
        localStorage.setItem('jacommander-custom-themes', JSON.stringify(customThemes));

        // Add to available themes
        if (!this.themes.includes(name)) {
            this.themes.push(name);
        }
    }

    // Apply custom theme
    applyCustomTheme(name) {
        const customThemes = JSON.parse(localStorage.getItem('jacommander-custom-themes') || '{}');

        if (customThemes[name]) {
            // First apply base theme (for any missing variables)
            this.apply('dark');

            // Then override with custom variables
            Object.entries(customThemes[name]).forEach(([variable, value]) => {
                this.setCSSVariable(variable, value);
            });

            this.currentTheme = name;
            localStorage.setItem('jacommander-theme', name);
            localStorage.setItem('jacommander-theme-manual', 'true');
        }
    }

    // Export current theme as JSON
    exportTheme() {
        const variables = [
            '--main-bg',
            '--header-bg',
            '--footer-bg',
            '--panel-bg',
            '--modal-bg',
            '--editor-bg',
            '--input-bg',
            '--button-bg',
            '--hover-bg',
            '--active-bg',
            '--selected-bg',
            '--text-primary',
            '--text-secondary',
            '--text-disabled',
            '--border-color',
            '--focus-border',
            '--accent-color',
            '--accent-hover',
            '--accent-light',
            '--success-color',
            '--warning-color',
            '--danger-color',
            '--danger-hover',
            '--info-color',
            '--folder-color',
            '--file-color',
            '--link-color',
            '--executable-color',
            '--panel-active-border',
            '--panel-inactive-border',
            '--row-hover',
            '--row-selected'
        ];

        const theme = {};
        variables.forEach((v) => {
            theme[v] = this.getCSSVariable(v);
        });

        return {
            name: this.currentTheme,
            variables: theme
        };
    }

    // Import theme from JSON
    importTheme(themeData) {
        if (themeData && themeData.name && themeData.variables) {
            this.createCustomTheme(themeData.name, themeData.variables);
            this.applyCustomTheme(themeData.name);
            return true;
        }
        return false;
    }
}
