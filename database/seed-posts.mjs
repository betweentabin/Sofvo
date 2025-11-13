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

  // Pick all profiles
  const { rows: profiles } = await client.query(
    `SELECT id, username, display_name FROM profiles ORDER BY created_at LIMIT 20`
  );
  if (profiles.length === 0) {
    console.error('❌ No profiles found. Seed users first (node database/seed-data.js).');
    process.exit(1);
  }

  console.log(`📝 Found ${profiles.length} profiles`);

  // 投稿内容のテンプレート
  const postTemplates = [
    "今日の練習は充実していました！新しい技を習得できて嬉しいです 💪",
    "チームメイトと一緒にトレーニング。みんなで成長できることが何より楽しい！",
    "大会に向けて準備中。目標に向かって頑張ります！",
    "今週末の試合が楽しみです。ベストを尽くします！",
    "新しい戦術を試してみました。なかなか良い感じです👍",
    "朝練習からスタート。良い汗をかきました☀️",
    "コーチからアドバイスをもらって改善点が見えてきました",
    "仲間と切磋琢磨できる環境に感謝です",
    "次の目標に向けて計画を立てています📝",
    "今日の反省点を活かして明日も頑張ります！",
    "基礎練習の大切さを改めて実感しました",
    "試合で学んだことをチームで共有しました",
    "メンタルトレーニングも取り入れています🧘",
    "体調管理も競技の一部。しっかりケアします",
    "目標達成に向けて一歩ずつ前進中！"
  ];

  const posts = [];
  // 各ユーザーに3つの投稿を作成
  for (const profile of profiles) {
    const shuffled = [...postTemplates].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) {
      const daysAgo = i; // 0, 1, 2 days ago
      posts.push({
        user: profile.id,
        content: shuffled[i],
        visibility: 'public',
        daysAgo
      });
    }
  }

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
