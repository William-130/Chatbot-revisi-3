import { getPool } from '../src/lib/database';
import fs from 'fs/promises';
import path from 'path';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log('   Current time:', result.rows[0].current_time);
    
    // Test pgvector extension
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension available');
    } catch (error) {
      console.log('⚠️  pgvector extension not available:', error.message);
      console.log('   Installing pgvector extension...');
      try {
        // Try alternative installation
        await pool.query('CREATE EXTENSION IF NOT EXISTS "vector"');
        console.log('✅ pgvector extension installed');
      } catch (error2) {
        console.log('⚠️  pgvector not available. Continuing without vector support...');
        console.log('   Note: Some features may be limited without pgvector');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Pastikan PostgreSQL berjalan');
    console.log('2. Pastikan database "ChatbotDB" sudah dibuat');
    console.log('3. Periksa username dan password di .env');
    console.log('\n💡 Quick fix commands:');
    console.log('   createdb ChatbotDB');
    console.log('   atau gunakan pgAdmin untuk membuat database');
    return false;
  }
}

async function runMigrations() {
  console.log('\n🚀 Starting database migrations...');
  
  try {
    const pool = getPool();
    
    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    await pool.query(schema);
    
    console.log('✅ Database migrations completed successfully');
    
    // Verify tables created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

async function seedDatabase() {
  console.log('\n🌱 Seeding database with initial data...');
  
  try {
    const pool = getPool();
    
    // Create demo website
    const website = await pool.query(`
      INSERT INTO websites (id, domain, name, api_key, settings)
      VALUES (
        'demo-website-id',
        'localhost:3000',
        'Demo Website',
        'demo-api-key-' || substr(md5(random()::text), 1, 8),
        '{"crawl_depth": 3, "max_pages": 100}'::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW()
      RETURNING *
    `);
    
    console.log('✅ Demo website created:', website.rows[0].name);
    
    // Create demo session
    await pool.query(`
      INSERT INTO chat_sessions (id, website_id, user_id, metadata)
      VALUES (
        'demo-session-' || substr(md5(random()::text), 1, 8),
        'demo-website-id',
        'demo-user',
        '{"source": "demo", "created_at": "' || NOW() || '"}'::jsonb
      )
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Database seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up production database...\n');
  
  // Test connection first
  const connected = await testDatabaseConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Run migrations
  const migrated = await runMigrations();
  if (!migrated) {
    process.exit(1);
  }
  
  // Seed database
  const seeded = await seedDatabase();
  if (!seeded) {
    process.exit(1);
  }
  
  console.log('\n🎉 Production database setup completed!');
  console.log('📝 Next steps:');
  console.log('   1. Run: npm run activate-production');
  console.log('   2. Test the chat interface');
  console.log('   3. Add your own content via crawler or manual input');
  
  process.exit(0);
}

main();
