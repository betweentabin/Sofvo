#!/usr/bin/env node

// Railway PostgreSQL Database Setup Script (ESM)
// - Executes database/railway-setup.sql and database/additional-tables.sql
// - Creates core tables including users/profiles and posts-related tables

import { Client } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: DATABASE_URL_EXTERNAL or DATABASE_URL not found in environment variables');
  process.exit(1);
}

function extractObjectName(stmt) {
  try {
    const m = stmt.match(/\b(CREATE|ALTER|DROP)\s+\w+\s+(IF\s+NOT\s+EXISTS\s+)?([\w\.\"]+)/i);
    return m ? m[3] : '';
  } catch {
    return '';
  }
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔌 Connecting to Railway PostgreSQL...');
  await client.connect();
  console.log('✅ Connected successfully!');

  // Load SQL files
  const mainSqlPath = path.join(__dirname, 'railway-setup.sql');
  const additionalSqlPath = path.join(__dirname, 'additional-tables.sql');
  const mainSql = await fs.readFile(mainSqlPath, 'utf8');
  let additionalSql = '';
  try {
    additionalSql = await fs.readFile(additionalSqlPath, 'utf8');
  } catch {}

  // Ensure extensions first to avoid UUID issues
  const prelude = [
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'
  ].join('\n');

  const allSql = [prelude, mainSql, additionalSql].join('\n\n');

  console.log('📦 Executing schema (single batch)...');
  await client.query(allSql);
  console.log('\n📊 Summary: executed schema successfully.\n');

  // Verify key tables
  const { rows } = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
  );
  console.log(`📋 Tables (${rows.length}):`);
  for (const r of rows) console.log('  •', r.tablename);

  console.log('\n🔍 Checking key tables exist:');
  const checkTables = ['users','profiles','posts','comments','post_likes'];
  for (const t of checkTables) {
    const res = await client.query(
      'SELECT to_regclass($1) IS NOT NULL AS exists', [ `public.${t}` ]
    );
    console.log(`  ${t}: ${res.rows[0].exists ? '✅' : '❌'}`);
  }

  await client.end();
  console.log('\n🎉 Database setup completed.');
}

main().catch(async (err) => {
  console.error('🚨 Setup failed:', err.message);
  process.exit(1);
});
