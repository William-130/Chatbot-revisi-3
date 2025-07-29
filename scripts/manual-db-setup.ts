import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Manual .env loader
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/"/g, '');
      envVars[key.trim()] = value.trim();
    }
  });
  
  return envVars;
}

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection with manual env loading...\n');
  
  const env = loadEnv();
  console.log('Loaded environment variables:');
  console.log('- PGUSER:', env.PGUSER);
  console.log('- PGHOST:', env.PGHOST);
  console.log('- PGPORT:', env.PGPORT);
  console.log('- PGDATABASE:', env.PGDATABASE);
  console.log('- DATABASE_URL:', env.DATABASE_URL);
  console.log('');

  try {
    // Test with individual parameters
    console.log('1️⃣ Testing with individual parameters...');
    const poolParams = new Pool({
      user: env.PGUSER,
      password: env.PGPASSWORD,
      host: env.PGHOST,
      port: parseInt(env.PGPORT || '5432'),
      database: env.PGDATABASE,
      ssl: false
    });

    const client = await poolParams.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Connection successful with parameters!');
    console.log('   PostgreSQL version:', result.rows[0].version);
    client.release();
    await poolParams.end();

    console.log('\n✅ Database connection test PASSED!');
    console.log('\n🚀 Now running database setup...');
    
    // Run database setup
    await setupDatabase(env);
    
    return true;

  } catch (error: any) {
    console.error('\n❌ Connection test FAILED:', error.message);
    console.log('\n🔧 Quick fixes to try:');
    console.log('1. Make sure PostgreSQL service is running');
    console.log('2. Create database: createdb -U postgres ChatbotDB');
    console.log('3. Test login: psql -U postgres -d ChatbotDB');
    console.log('');
    return false;
  }
}

async function setupDatabase(env: Record<string, string>) {
  console.log('\n📋 Setting up database schema...');
  
  const pool = new Pool({
    user: env.PGUSER,
    password: env.PGPASSWORD,
    host: env.PGHOST,
    port: parseInt(env.PGPORT || '5432'),
    database: env.PGDATABASE,
    ssl: false
  });

  try {
    // Create websites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS websites (
        id VARCHAR(255) PRIMARY KEY,
        domain VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_crawled_at TIMESTAMP,
        crawl_status VARCHAR(50) DEFAULT 'pending',
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ websites table created');

    // Create chat_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(255) PRIMARY KEY,
        website_id VARCHAR(255) REFERENCES websites(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      )
    `);
    console.log('✅ chat_sessions table created');

    // Create chat_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      )
    `);
    console.log('✅ chat_messages table created');

    // Create documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        website_id VARCHAR(255) REFERENCES websites(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        url VARCHAR(1000) NOT NULL,
        indexed_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}',
        UNIQUE(website_id, url)
      )
    `);
    console.log('✅ documents table created');

    // Insert demo data
    await pool.query(`
      INSERT INTO websites (id, domain, name, api_key, settings)
      VALUES (
        'production-website-id',
        'localhost:3000',
        'Production Website',
        'prod-api-key-12345',
        '{"crawl_depth": 3, "max_pages": 100}'::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW()
    `);
    console.log('✅ Demo website created');

    await pool.end();
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message);
    await pool.end();
    throw error;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🚀 Ready to test chatbot!');
    console.log('Run: npm run dev');
  }
  process.exit(success ? 0 : 1);
});
