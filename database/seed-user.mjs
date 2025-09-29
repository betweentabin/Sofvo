#!/usr/bin/env node
import { Client } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL_EXTERNAL or DATABASE_URL missing');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const email = process.argv[2] || 'test@sofvo.com';
const password = process.argv[3] || 'testpass123';

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function run() {
  await client.connect();
  console.log('🔌 Connected');

  // If exists, just print id
  const { rows: existing } = await client.query('SELECT u.id, u.email FROM users u WHERE u.email=$1', [email]);
  let userId;
  if (existing.length) {
    userId = existing[0].id;
    console.log(`ℹ️  User already exists: ${email} (${userId})`);
  } else {
    const { rows } = await client.query(
      `INSERT INTO users (email, encrypted_password, email_confirmed_at)
       VALUES ($1, $2, NOW()) RETURNING id`,
      [email, hash(password)]
    );
    userId = rows[0].id;
    console.log(`✅ Created user: ${email} (${userId})`);
  }

  // Ensure profile
  const { rows: prof } = await client.query('SELECT id FROM profiles WHERE id=$1', [userId]);
  if (!prof.length) {
    const username = email.split('@')[0];
    await client.query(
      `INSERT INTO profiles (id, username, display_name, bio, sport_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, username, 'テストユーザー', '初期アカウント', 'バレーボール']
    );
    console.log('✅ Created profile');
  } else {
    console.log('ℹ️  Profile already exists');
  }

  await client.end();
  console.log('🎉 Done');
}

run().catch(async (e) => { console.error('❌ Failed:', e.message); try{await client.end()}catch{}; process.exit(1); });

