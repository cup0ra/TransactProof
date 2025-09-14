#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Checking browser setup for Puppeteer (Nixpacks)...');

// Try to find chromium in common Nixpacks locations
const possiblePaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/nix/store/*/bin/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
];

let foundPath = null;

for (const path of possiblePaths) {
  if (path && path !== 'undefined') {
    try {
      if (path.includes('*')) {
        // Handle wildcard paths for Nix
        const result = execSync('which chromium || find /nix/store -name chromium -type f 2>/dev/null | head -1', { encoding: 'utf8' });
        if (result.trim()) {
          foundPath = result.trim();
          break;
        }
      } else if (fs.existsSync(path)) {
        foundPath = path;
        break;
      }
    } catch (error) {
      console.log(`⚠️  Could not check path ${path}: ${error.message}`);
    }
  }
}

console.log(`📍 PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'not set'}`);

if (foundPath) {
  console.log(`✅ Browser executable found at: ${foundPath}`);
  
  // Try to get browser version
  try {
    const version = execSync(`${foundPath} --version`, { encoding: 'utf8' });
    console.log(`📋 Browser version: ${version.trim()}`);
  } catch (error) {
    console.log(`⚠️  Could not get browser version: ${error.message}`);
  }

  // Test browser launch
  console.log('🧪 Testing browser launch...');
  try {
    const testResult = execSync(`${foundPath} --headless --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=1000 data:text/html,<html><body>Test</body></html>`, { 
      encoding: 'utf8',
      timeout: 10000 
    });
    if (testResult.includes('Test')) {
      console.log(`✅ Browser test successful`);
    } else {
      console.log(`⚠️  Browser test returned unexpected result`);
    }
  } catch (error) {
    console.log(`❌ Browser test failed: ${error.message}`);
  }

  // Export the found path for Puppeteer
  process.env.PUPPETEER_EXECUTABLE_PATH = foundPath;
} else {
  console.log(`❌ No browser executable found in any of the expected locations`);
  console.log(`Checked paths:`, possiblePaths.filter(p => p && p !== 'undefined'));
  process.exit(1);
}

// Check other relevant environment variables
console.log(`📍 PUPPETEER_SKIP_DOWNLOAD: ${process.env.PUPPETEER_SKIP_DOWNLOAD || 'not set'}`);
console.log(`📍 CHROME_BIN: ${process.env.CHROME_BIN || 'not set'}`);
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

console.log('✅ Browser check completed');