import pg from 'pg';

const { Pool } = pg;

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  // Debug environment variables
  console.log('Environment variables:');
  console.log('- PGUSER:', process.env.PGUSER);
  console.log('- PGHOST:', process.env.PGHOST);
  console.log('- PGPORT:', process.env.PGPORT);
  console.log('- PGDATABASE:', process.env.PGDATABASE);
  console.log('- DATABASE_URL:', process.env.DATABASE_URL);
  console.log('');

  try {
    // Test with individual parameters first
    console.log('1️⃣ Testing with individual parameters...');
    const poolParams = new Pool({
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE,
      ssl: false
    });

    const client = await poolParams.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Connection successful with parameters!');
    console.log('   PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    client.release();
    await poolParams.end();

    // Test with connection string
    console.log('\n2️⃣ Testing with connection string...');
    const poolString = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    const client2 = await poolString.connect();
    const result2 = await client2.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful with string!');
    console.log('   Current time:', result2.rows[0].current_time);
    client2.release();
    await poolString.end();

    console.log('\n✅ Database connection test PASSED!');
    return true;

  } catch (error: any) {
    console.error('\n❌ Connection test FAILED:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure PostgreSQL is running:');
    console.log('   - Windows: Check Services or pgAdmin');
    console.log('   - Check if port 5432 is open');
    console.log('');
    console.log('2. Verify credentials:');
    console.log('   - Username: postgres');
    console.log('   - Password: Underbone123');
    console.log('   - Database: ChatbotDB');
    console.log('');
    console.log('3. Create database if not exists:');
    console.log('   psql -U postgres -c "CREATE DATABASE \\"ChatbotDB\\""');
    console.log('');
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
