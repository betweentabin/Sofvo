#!/usr/bin/env node
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL_EXTERNAL');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const tables = ['users','profiles','teams','tournaments','posts','post_images','comments','post_likes'];

console.log('Checking tables:');
for (const t of tables) {
  const { rows } = await client.query('SELECT to_regclass($1) IS NOT NULL AS exists', [`public.${t}`]);
  console.log(`${t}: ${rows[0].exists ? '✅' : '❌'}`);
}

await client.end();

