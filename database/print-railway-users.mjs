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

const { rows } = await client.query(
  `SELECT u.email, p.id as profile_id, p.username, p.display_name
   FROM users u JOIN profiles p ON p.id = u.id
   ORDER BY p.created_at ASC LIMIT 5`
);
for (const r of rows) {
  console.log(`${r.profile_id}  | ${r.username}  | ${r.display_name}  | ${r.email}`);
}

await client.end();

