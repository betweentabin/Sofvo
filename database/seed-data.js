#!/usr/bin/env node

/**
 * Sample Data Seeding Script for Railway PostgreSQL
 * 
 * テスト用のサンプルデータを投入します
 */

import { Client } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;

// Helper function to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedData() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL_EXTERNAL or DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('railway.app') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('🌱 Starting data seeding...\n');
    await client.connect();

    // Start transaction
    await client.query('BEGIN');

    // 1. Create test users
    console.log('👤 Creating test users...');
    const users = [
      { email: 'taro@example.com', password: 'password123', name: '山田太郎' },
      { email: 'hanako@example.com', password: 'password123', name: '鈴木花子' },
      { email: 'ichiro@example.com', password: 'password123', name: '佐藤一郎' },
      { email: 'yuki@example.com', password: 'password123', name: '田中ゆき' },
      { email: 'ken@example.com', password: 'password123', name: '高橋健' }
    ];

    const userIds = [];
    for (const user of users) {
      const result = await client.query(`
        INSERT INTO users (email, encrypted_password, email_confirmed_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id
      `, [user.email, hashPassword(user.password)]);
      
      const userId = result.rows[0].id;
      userIds.push(userId);

      await client.query(`
        INSERT INTO profiles (id, username, display_name, bio, sport_type)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name
      `, [
        userId,
        user.email.split('@')[0],
        user.name,
        `${user.name}です。よろしくお願いします！`,
        'バレーボール'
      ]);
    }
    console.log(`   ✅ Created ${users.length} users`);

    // 2. Create follows relationships
    console.log('👥 Creating follow relationships...');
    // Everyone follows the first user (Taro)
    for (let i = 1; i < userIds.length; i++) {
      await client.query(`
        INSERT INTO follows (follower_id, following_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [userIds[i], userIds[0]]);
    }
    // First user follows back some people
    await client.query(`
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [userIds[0], userIds[1]]);
    await client.query(`
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [userIds[0], userIds[2]]);
    console.log('   ✅ Created follow relationships');

    // 3. Create teams
    console.log('🏐 Creating teams...');
    const teams = [
      { name: 'チーム炎', description: '熱い戦いを繰り広げるチーム', sport: 'バレーボール', owner: userIds[0] },
      { name: 'ブルーウェーブ', description: '波のような攻撃が特徴', sport: 'バレーボール', owner: userIds[1] },
      { name: 'サンダーボルト', description: '雷のような速攻チーム', sport: 'バレーボール', owner: userIds[2] }
    ];

    const teamIds = [];
    for (const team of teams) {
      const result = await client.query(`
        INSERT INTO teams (name, description, sport_type, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [team.name, team.description, team.sport, team.owner]);
      
      if (result.rows.length > 0) {
        const teamId = result.rows[0].id;
        teamIds.push(teamId);

        // Add owner as team member
        await client.query(`
          INSERT INTO team_members (team_id, user_id, role)
          VALUES ($1, $2, 'owner')
          ON CONFLICT DO NOTHING
        `, [teamId, team.owner]);
      }
    }
    console.log(`   ✅ Created ${teams.length} teams`);

    // 4. Add team members
    console.log('👥 Adding team members...');
    if (teamIds.length > 0) {
      // Add some members to first team
      await client.query(`
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, 'member')
        ON CONFLICT DO NOTHING
      `, [teamIds[0], userIds[3]]);
      await client.query(`
        INSERT INTO team_members (team_id, user_id, role)
        VALUES ($1, $2, 'member')
        ON CONFLICT DO NOTHING
      `, [teamIds[0], userIds[4]]);
    }
    console.log('   ✅ Added team members');

    // 5. Create tournaments
    console.log('🏆 Creating tournaments...');
    const tournaments = [
      {
        name: '春季バレーボール大会',
        description: '春の訪れを祝うバレーボール大会',
        sport: 'バレーボール',
        location: '静岡県掛川市総合体育館',
        organizer: userIds[0]
      },
      {
        name: '夏季ビーチバレー大会',
        description: '夏の海で開催されるビーチバレー',
        sport: 'ビーチバレー',
        location: '静岡県下田市白浜海岸',
        organizer: userIds[1]
      },
      {
        name: '秋季混合バレーボール大会',
        description: '男女混合チームによる大会',
        sport: 'バレーボール',
        location: '東京都渋谷区体育館',
        organizer: userIds[2]
      }
    ];

    const tournamentIds = [];
    for (const [index, tournament] of tournaments.entries()) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (index + 1) * 30); // 30, 60, 90 days from now
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      const deadline = new Date(startDate);
      deadline.setDate(deadline.getDate() - 14); // 2 weeks before

      const result = await client.query(`
        INSERT INTO tournaments (
          name, description, sport_type, location, 
          start_date, end_date, registration_deadline,
          max_participants, organizer_id, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        tournament.name,
        tournament.description,
        tournament.sport,
        tournament.location,
        startDate,
        endDate,
        deadline,
        16, // max teams
        tournament.organizer,
        'upcoming'
      ]);

      if (result.rows.length > 0) {
        tournamentIds.push(result.rows[0].id);
      }
    }
    console.log(`   ✅ Created ${tournaments.length} tournaments`);

    // 6. Create tournament participants
    if (tournamentIds.length > 0 && teamIds.length > 0) {
      console.log('🎯 Adding tournament participants...');
      // Register first team to first tournament
      await client.query(`
        INSERT INTO tournament_participants (tournament_id, team_id, status)
        VALUES ($1, $2, 'registered')
        ON CONFLICT DO NOTHING
      `, [tournamentIds[0], teamIds[0]]);
      console.log('   ✅ Added tournament participants');
    }

    // 7. Create notifications
    console.log('🔔 Creating notifications...');
    for (const userId of userIds.slice(0, 3)) {
      await client.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [
        userId,
        'welcome',
        'Sofvoへようこそ！',
        'Sofvoへの登録ありがとうございます。素晴らしいスポーツ体験をお楽しみください！'
      ]);
    }
    console.log('   ✅ Created welcome notifications');

    // 8. Create sample messages/conversations
    console.log('💬 Creating sample conversations...');
    if (userIds.length >= 2) {
      // Create a conversation between first two users
      const convResult = await client.query(`
        INSERT INTO conversations (type, name)
        VALUES ('direct', NULL)
        ON CONFLICT DO NOTHING
        RETURNING id
      `);

      if (convResult.rows.length > 0) {
        const convId = convResult.rows[0].id;
        
        // Add participants
        await client.query(`
          INSERT INTO conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [convId, userIds[0]]);
        
        await client.query(`
          INSERT INTO conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [convId, userIds[1]]);

        // Add sample messages
        await client.query(`
          INSERT INTO messages (conversation_id, sender_id, content)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [convId, userIds[0], 'こんにちは！今度の大会、一緒に参加しませんか？']);
        
        await client.query(`
          INSERT INTO messages (conversation_id, sender_id, content)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [convId, userIds[1], 'いいですね！ぜひ参加したいです！']);
      }
    }
    console.log('   ✅ Created sample conversations');

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n✨ Data seeding completed successfully!');
    
    // Show summary
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    const teamCount = await client.query('SELECT COUNT(*) as count FROM teams');
    const tournamentCount = await client.query('SELECT COUNT(*) as count FROM tournaments');
    
    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Teams: ${teamCount.rows[0].count}`);
    console.log(`   Tournaments: ${tournamentCount.rows[0].count}`);
    
    console.log('\n📝 Test Accounts:');
    users.forEach(user => {
      console.log(`   Email: ${user.email} / Password: password123`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Seeding complete!');
  }
}

// Run seeding
seedData();