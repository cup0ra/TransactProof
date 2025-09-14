#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Checking browser setup for Puppeteer...');

// Check if PUPPETEER_EXECUTABLE_PATH is set
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
console.log(`📍 PUPPETEER_EXECUTABLE_PATH: ${executablePath || 'not set'}`);

// Check if the executable exists
if (executablePath) {
  try {
    if (fs.existsSync(executablePath)) {
      console.log(`✅ Browser executable found at: ${executablePath}`);
      
      // Try to get browser version
      try {
        const version = execSync(`${executablePath} --version`, { encoding: 'utf8' });
        console.log(`📋 Browser version: ${version.trim()}`);
      } catch (error) {
        console.log(`⚠️  Could not get browser version: ${error.message}`);
      }

      // Test browser launch
      console.log('🧪 Testing browser launch...');
      try {
        const testResult = execSync(`${executablePath} --headless --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=1000 data:text/html,<html><body>Test</body></html>`, { 
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
    } else {
      console.log(`❌ Browser executable not found at: ${executablePath}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Error checking browser: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log('⚠️  No PUPPETEER_EXECUTABLE_PATH set, will use default Puppeteer browser');
}

// Check other relevant environment variables
console.log(`📍 PUPPETEER_SKIP_DOWNLOAD: ${process.env.PUPPETEER_SKIP_DOWNLOAD || 'not set'}`);
console.log(`📍 CHROME_BIN: ${process.env.CHROME_BIN || 'not set'}`);
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

console.log('✅ Browser check completed');