#!/usr/bin/env node

// Seed a few test posts into Railway Postgres

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL_EXTERNAL or DATABASE_URL missing');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log('🔌 Connected');

  // Pick some profiles and a team if available
  const { rows: profiles } = await client.query(
    `SELECT id, username, display_name FROM profiles ORDER BY created_at LIMIT 3`
  );
  if (profiles.length === 0) {
    console.error('❌ No profiles found. Seed users first (node database/seed-data.js).');
    process.exit(1);
  }

  const { rows: teams } = await client.query(
    `SELECT id, name FROM teams ORDER BY created_at LIMIT 1`
  );

  const p1 = profiles[0].id;
  const p2 = profiles[1]?.id || profiles[0].id;
  const p3 = profiles[2]?.id || profiles[0].id;
  const teamId = teams[0]?.id || null;

  const posts = [
    { user: p1, team: null, type: 'post', visibility: 'public', content: 'テスト投稿: Sofvoの世界へようこそ！' },
    { user: p2, team: teamId, type: 'announcement', visibility: teamId ? 'team' : 'public', content: teamId ? 'チームのお知らせ: 今週の練習は19時開始です。' : 'お知らせテスト' },
    { user: p3, team: null, type: 'diary', visibility: 'followers', content: '日記: 今日はレシーブ練習を重点的にやりました。' }
  ];

  await client.query('BEGIN');
  try {
    console.log('📝 Inserting test posts...');
    const postIds = [];
    for (const post of posts) {
      const res = await client.query(
        `INSERT INTO posts (user_id, team_id, content, type, visibility)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [post.user, post.team, post.content, post.type, post.visibility]
      );
      postIds.push(res.rows[0].id);
    }

    // Attach an image to the first post if table exists
    const { rows: hasPostImages } = await client.query(
      `SELECT to_regclass('public.post_images') IS NOT NULL AS exists`
    );
    if (hasPostImages[0].exists) {
      await client.query(
        `INSERT INTO post_images (post_id, image_url, caption, display_order)
         VALUES ($1, $2, $3, 0)`,
        [postIds[0], 'https://picsum.photos/seed/sofvo/800/600', 'テスト画像']
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Inserted ${postIds.length} posts`);

    const { rows: recent } = await client.query(
      `SELECT id, content, visibility, created_at FROM posts ORDER BY created_at DESC LIMIT 5`
    );
    console.log('\n📋 Recent posts:');
    for (const r of recent) {
      console.log(`- ${r.id} | ${r.visibility} | ${r.content}`);
    }
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed posts:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
