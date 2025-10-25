# JaCommander Documentation

Welcome to the JaCommander documentation!

## Quick Links

- [API Documentation](api.html)
- [Contributing Guide](contributing.html)
- [Security Policy](security.html)
- [Main Repository](https://github.com/jacar-javi/jacommander)

## Enabling GitHub Pages

To enable GitHub Pages for this repository:

1. Go to your repository settings: https://github.com/jacar-javi/jacommander/settings/pages
2. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
3. Save the changes

The `.github/workflows/pages.yml` workflow will automatically build and deploy your documentation site.

Your site will be available at: `https://jacar-javi.github.io/jacommander/`

## Documentation Structure

```
docs/
├── README.md          # This file
└── (add more docs here)
```

## Adding Documentation

1. Create new markdown files in the `docs/` directory
2. They will be automatically included in the GitHub Pages site
3. Update the navigation in `.github/workflows/pages.yml` if needed

## Local Preview

To preview the documentation locally, you can use any static server:

```bash
# Using Python
cd docs
python3 -m http.server 8000

# Using Node.js
npx http-server docs

# Using Go
cd docs
go run -m http.server
```

Then open http://localhost:8000 in your browser.
