#!/usr/bin/env node

/**
 * Telegram Bot Test Script
 * Validates configuration and connectivity before starting the bot
 */

import dotenv from 'dotenv';
import { testDatabaseConnection } from './src/services/database.js';
import axios from 'axios';

// Load environment variables
dotenv.config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(colors.green, `✅ ${message}`);
}

function error(message) {
  log(colors.red, `❌ ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

/**
 * Test environment variables
 */
function testEnvironment() {
  console.log('\n🔧 Testing Environment Configuration...');
  
  const required = [
    'BOT_TOKEN',
    'DB_HOST',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_NAME'
  ];
  
  const optional = [
    'API_BASE_URL',
    'WEBDAV_URL',
    'WEBDAV_USER',
    'WEBDAV_PASSWORD'
  ];
  
  let allRequired = true;
  
  // Check required variables
  required.forEach(envVar => {
    if (process.env[envVar]) {
      success(`${envVar}: configured`);
    } else {
      error(`${envVar}: missing (required)`);
      allRequired = false;
    }
  });
  
  // Check optional variables
  optional.forEach(envVar => {
    if (process.env[envVar]) {
      success(`${envVar}: configured`);
    } else {
      warning(`${envVar}: not set (optional)`);
    }
  });
  
  return allRequired;
}

/**
 * Test Telegram Bot API connection
 */
async function testTelegramAPI() {
  console.log('\n🤖 Testing Telegram Bot API...');
  
  const token = process.env.BOT_TOKEN;
  if (!token) {
    error('Bot token not found');
    return false;
  }
  
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    
    if (response.data.ok) {
      const bot = response.data.result;
      success(`Bot connected: @${bot.username} (${bot.first_name})`);
      success(`Bot ID: ${bot.id}`);
      return true;
    } else {
      error('Bot API returned error');
      return false;
    }
  } catch (err) {
    error(`Bot API connection failed: ${err.message}`);
    return false;
  }
}

/**
 * Test backend API connection
 */
async function testBackendAPI() {
  console.log('\n🔗 Testing Backend API...');
  
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  try {
    // Test basic connectivity
    const response = await axios.get(`${apiUrl}/api/terms`, { timeout: 5000 });
    success(`Backend API connected: ${apiUrl}`);
    success(`Response status: ${response.status}`);
    
    if (Array.isArray(response.data)) {
      success(`API returned ${response.data.length} terms`);
    }
    
    return true;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      error(`Backend API not running at ${apiUrl}`);
    } else {
      error(`Backend API error: ${err.message}`);
    }
    return false;
  }
}

/**
 * Test WebDAV connectivity
 */
async function testWebDAV() {
  console.log('\n☁️  Testing WebDAV Connection...');
  
  const webdavUrl = process.env.WEBDAV_URL;
  const webdavUser = process.env.WEBDAV_USER;
  const webdavPassword = process.env.WEBDAV_PASSWORD;
  
  if (!webdavUrl || !webdavUser || !webdavPassword) {
    warning('WebDAV credentials not fully configured');
    return false;
  }
  
  try {
    // Test via backend API
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const response = await axios.get(`${apiUrl}/api/files/cloud/list?path=/`, { timeout: 10000 });
    
    success('WebDAV connection working via backend API');
    
    if (Array.isArray(response.data)) {
      success(`Found ${response.data.length} items in root directory`);
    }
    
    return true;
  } catch (err) {
    error(`WebDAV test failed: ${err.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Running Telegram Bot Configuration Tests');
  console.log('='.repeat(50));
  
  const results = {
    environment: testEnvironment(),
    telegram: await testTelegramAPI(),
    database: await testDatabaseConnection(),
    backend: await testBackendAPI(),
    webdav: await testWebDAV()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(30));
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      success(`${test}: PASSED`);
    } else {
      error(`${test}: FAILED`);
    }
  });
  
  const allPassed = Object.values(results).every(Boolean);
  const criticalPassed = results.environment && results.telegram && results.database;
  
  console.log('\n🎯 Final Status:');
  console.log('='.repeat(20));
  
  if (allPassed) {
    success('All tests passed! Bot is ready to start.');
  } else if (criticalPassed) {
    warning('Critical tests passed. Bot can start but some features may be limited.');
  } else {
    error('Critical tests failed. Please fix configuration before starting bot.');
    process.exit(1);
  }
  
  console.log('\n🚀 To start the bot:');
  info('npm run dev');
  console.log('\n📚 To see help:');
  info('npm run start');
}

// Run tests
runTests().catch(err => {
  error(`Test runner failed: ${err.message}`);
  process.exit(1);
});