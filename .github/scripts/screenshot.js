#!/usr/bin/env node

/**
 * Screenshot Generator for JaCommander
 *
 * This script generates screenshots of the JaCommander interface
 * for use in documentation, social media previews, and marketing materials.
 *
 * Requirements:
 * - Node.js 18+
 * - Playwright: npm install -D playwright
 *
 * Usage:
 *   node screenshot.js
 *   node screenshot.js --url http://localhost:8080 --output screenshots/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  url: process.argv.includes('--url')
    ? process.argv[process.argv.indexOf('--url') + 1]
    : 'http://localhost:8080',
  outputDir: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : path.join(__dirname, '../../screenshots'),
  viewport: {
    width: 1280,
    height: 720
  },
  socialPreview: {
    width: 1280,
    height: 640
  }
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

async function takeScreenshots() {
  console.log('🚀 Starting JaCommander screenshot generation...');
  console.log(`📍 URL: ${config.url}`);
  console.log(`📁 Output: ${config.outputDir}`);

  const browser = await chromium.launch();

  try {
    // Create a new page
    const page = await browser.newPage({
      viewport: config.viewport
    });

    // Navigate to the application
    console.log('\n📸 Navigating to application...');
    await page.goto(config.url, { waitUntil: 'networkidle' });

    // Wait for the application to load
    await page.waitForTimeout(2000);

    // Screenshot 1: Main interface
    console.log('📸 Capturing main interface...');
    await page.screenshot({
      path: path.join(config.outputDir, '01-main-interface.png'),
      fullPage: false
    });

    // Screenshot 2: Dual panel view
    console.log('📸 Capturing dual-panel view...');
    await page.screenshot({
      path: path.join(config.outputDir, '02-dual-panel.png'),
      fullPage: false
    });

    // Screenshot 3: Social media preview (1280x640)
    console.log('📸 Capturing social media preview...');
    await page.setViewportSize(config.socialPreview);
    await page.screenshot({
      path: path.join(config.outputDir, 'social-preview.png'),
      fullPage: false
    });

    // Screenshot 4: Dark theme
    console.log('📸 Capturing dark theme...');
    await page.setViewportSize(config.viewport);
    await page.screenshot({
      path: path.join(config.outputDir, '03-dark-theme.png'),
      fullPage: false
    });

    // Screenshot 5: File operations
    console.log('📸 Capturing file operations...');
    // Try to open context menu or file operations
    await page.keyboard.press('F1'); // Help menu
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(config.outputDir, '04-help-menu.png'),
      fullPage: false
    });

    // Screenshot 6: Full page
    console.log('📸 Capturing full page...');
    await page.keyboard.press('Escape'); // Close help
    await page.screenshot({
      path: path.join(config.outputDir, '05-full-page.png'),
      fullPage: true
    });

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Saved to: ${config.outputDir}`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Main execution
(async () => {
  try {
    // Check if playwright is installed
    try {
      require.resolve('playwright');
    } catch (e) {
      console.error('❌ Playwright is not installed!');
      console.error('📦 Install with: npm install -D playwright');
      console.error('🔧 Or: npx playwright install chromium');
      process.exit(1);
    }

    await takeScreenshots();
  } catch (error) {
    console.error('❌ Failed to generate screenshots:', error);
    process.exit(1);
  }
})();
