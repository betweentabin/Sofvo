#!/usr/bin/env node

/**
 * Railway PostgreSQL Connection Test Script
 * 
 * データベース接続をテストし、基本的な情報を表示します
 */

const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;

async function testConnection() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL_EXTERNAL or DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('🔌 Testing Railway PostgreSQL connection...\n');

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('railway.app') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!\n');

    // Database info
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        pg_database_size(current_database()) as size,
        version() as version
    `);

    console.log('📊 Database Information:');
    console.log(`   Database: ${dbInfo.rows[0].database}`);
    console.log(`   User: ${dbInfo.rows[0].user}`);
    console.log(`   Size: ${formatBytes(dbInfo.rows[0].size)}`);
    console.log(`   Version: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    // Table count
    const tables = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log(`📋 Tables: ${tables.rows[0].count}`);

    // Sample table list
    const tableList = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
      LIMIT 10
    `);

    if (tableList.rows.length > 0) {
      console.log('\n📝 Sample tables:');
      tableList.rows.forEach(row => {
        console.log(`   • ${row.tablename}`);
      });
    }

    // Check for key tables
    const keyTables = ['users', 'profiles', 'teams', 'tournaments', 'follows'];
    console.log('\n🔍 Checking key tables:');
    
    for (const table of keyTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = $1
        )
      `, [table]);
      
      const icon = exists.rows[0].exists ? '✅' : '❌';
      console.log(`   ${icon} ${table}`);
    }

    // User count (if tables exist)
    try {
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      const profileCount = await client.query('SELECT COUNT(*) as count FROM profiles');
      
      console.log('\n📊 Data Statistics:');
      console.log(`   Users: ${userCount.rows[0].count}`);
      console.log(`   Profiles: ${profileCount.rows[0].count}`);
    } catch (e) {
      // Tables might not exist yet
    }

    console.log('\n✨ Connection test completed successfully!');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check if DATABASE_URL_EXTERNAL is set correctly in .env');
    console.error('2. For local development, use the external URL from Railway dashboard');
    console.error('3. Ensure your IP is allowed in Railway network settings');
    process.exit(1);
  } finally {
    await client.end();
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run test
testConnection();