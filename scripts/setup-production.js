#!/usr/bin/env node

/**
 * Production Setup Script
 * Automated setup untuk mode produksi
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Production Setup...\n');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  Creating .env file from .env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
  } else {
    console.log('❌ .env.example not found');
    process.exit(1);
  }
}

console.log('\n📋 Setup Checklist:');
console.log('1. ✅ .env file ready');
console.log('2. ⚠️  Update DATABASE_URL in .env');
console.log('3. ⚠️  Add GOOGLE_GEMINI_API_KEY in .env');
console.log('4. ⚠️  Run: npm run migrate');
console.log('5. ⚠️  Run: npm run activate-production');

console.log('\n🔧 Required Environment Variables:');
console.log('   DATABASE_URL="postgresql://user:pass@localhost:5432/rag_chatbot"');
console.log('   GOOGLE_GEMINI_API_KEY="your_api_key_here"');

console.log('\n📖 See PRODUCTION_SETUP.md for detailed instructions');
