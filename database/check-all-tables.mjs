#!/usr/bin/env node
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Missing DATABASE_URL_EXTERNAL or DATABASE_URL');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const required = [
  'users',
  'profiles',
  'follows',
  'teams',
  'team_members',
  'conversations',
  'conversation_participants',
  'messages',
  'tournaments',
  'tournament_participants',
  'tournament_results',
  'tournament_categories',
  'tournament_matches',
  'tournament_announcements',
  'activities',
  'user_achievements',
  'point_transactions',
  'notification_settings',
  'notifications',
  'posts',
  'post_images',
  'comments',
  'post_likes',
  'likes',
  'reports'
];

async function main() {
  await client.connect();
  const { rows } = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
  );
  const all = rows.map(r => r.tablename);
  console.log(`📋 Public tables (${all.length}):`);
  for (const t of all) console.log('  •', t);

  console.log('\n🔍 Checking required tables:');
  const results = [];
  for (const t of required) {
    const { rows: r } = await client.query('SELECT to_regclass($1) IS NOT NULL AS exists', [`public.${t}`]);
    const exists = r[0]?.exists;
    results.push({ t, exists });
  }
  for (const r of results) {
    console.log(`  ${r.t}: ${r.exists ? '✅' : '❌'}`);
  }

  const missing = results.filter(r => !r.exists).map(r => r.t);
  if (missing.length) {
    console.log(`\n⚠️  Missing tables: ${missing.join(', ')}`);
    process.exitCode = 2;
  } else {
    console.log('\n✅ All required tables are present.');
  }

  await client.end();
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

