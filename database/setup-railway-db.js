#!/usr/bin/env node

/**
 * Railway PostgreSQL Database Setup Script
 * 
 * このスクリプトはRailway PostgreSQLデータベースに
 * 必要なテーブル、インデックス、トリガーをセットアップします
 * 
 * 使用方法:
 * 1. .envファイルにDATABASE_URL_EXTERNALを設定
 * 2. npm install pg dotenv
 * 3. node database/setup-railway-db.js
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 接続設定
const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL_EXTERNAL or DATABASE_URL not found in environment variables');
  console.error('Please set up your .env file with Railway PostgreSQL connection string');
  process.exit(1);
}

// Railway内部URLの場合は警告
if (connectionString.includes('railway.internal')) {
  console.warn('⚠️  Warning: Using internal Railway URL. This will only work when deployed on Railway.');
  console.warn('For local development, use the external URL from Railway dashboard.');
}

async function setupDatabase() {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('railway.app') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Get database info
    const dbInfo = await client.query(`
      SELECT current_database() as database,
             current_user as user,
             version() as version
    `);
    console.log('📊 Database Information:');
    console.log(`   Database: ${dbInfo.rows[0].database}`);
    console.log(`   User: ${dbInfo.rows[0].user}`);
    console.log(`   PostgreSQL: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    // Read and execute SQL setup scripts
    console.log('📝 Reading setup scripts...');
    const mainSqlPath = path.join(__dirname, 'railway-setup.sql');
    const additionalSqlPath = path.join(__dirname, 'additional-tables.sql');
    
    const mainSqlContent = await fs.readFile(mainSqlPath, 'utf8');
    const additionalSqlContent = await fs.readFile(additionalSqlPath, 'utf8').catch(() => '');
    
    const sqlContent = mainSqlContent + '\n\n' + additionalSqlContent;

    // Split SQL into individual statements (basic split, might need refinement)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📦 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (!statement.trim() || statement.trim().startsWith('--')) {
        continue;
      }

      // Extract statement type for logging
      const stmtType = statement.trim().split(/\s+/)[0].toUpperCase();
      const stmtName = extractObjectName(statement);

      try {
        await client.query(statement);
        successCount++;
        console.log(`✅ [${i + 1}/${statements.length}] ${stmtType} ${stmtName || ''}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ [${i + 1}/${statements.length}] ${stmtType} ${stmtName || ''}: ${error.message}`);
        
        // Continue on error for CREATE IF NOT EXISTS statements
        if (!statement.includes('IF NOT EXISTS') && !statement.includes('ON CONFLICT')) {
          console.error('Critical error, stopping execution.');
          throw error;
        }
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Success: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Skipped: ${errorCount} statements (already exist)`);
    }

    // Verify tables were created
    console.log('\n🔍 Verifying database objects...');
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log(`\n📋 Tables created (${tables.rows.length}):`);
    tables.rows.forEach(row => {
      console.log(`   • ${row.tablename}`);
    });

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY indexname;
    `);

    console.log(`\n🔍 Indexes created (${indexes.rows.length}):`);
    if (indexes.rows.length > 0) {
      indexes.rows.slice(0, 5).forEach(row => {
        console.log(`   • ${row.indexname}`);
      });
      if (indexes.rows.length > 5) {
        console.log(`   ... and ${indexes.rows.length - 5} more`);
      }
    }

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Update your .env file with the connection details');
    console.log('   2. Run sample data script if needed: node database/seed-data.js');
    console.log('   3. Test the connection: node database/test-connection.js');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Disconnected from database');
  }
}

// Helper function to extract object name from SQL statement
function extractObjectName(statement) {
  const patterns = [
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i,
    /CREATE\s+(?:OR\s+REPLACE\s+)?(?:VIEW|FUNCTION|TRIGGER)\s+(\w+)/i,
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i,
    /INSERT\s+INTO\s+(\w+)/i,
    /ALTER\s+TABLE\s+(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = statement.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return '';
}

// Run the setup
console.log('🚀 Starting Railway PostgreSQL Setup\n');
console.log('═'.repeat(50));

setupDatabase().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});