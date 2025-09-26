#!/usr/bin/env node
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL_EXTERNAL or DATABASE_URL missing');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function ensureTournament() {
  const { rows } = await client.query(`SELECT id, name FROM tournaments ORDER BY created_at ASC LIMIT 1`);
  if (rows.length) return rows[0];
  const { rows: ins } = await client.query(
    `INSERT INTO tournaments (name, description, sport_type, start_date, location, organizer_id, status)
     VALUES ('テスト大会', '自動作成のテスト大会', 'バレーボール', NOW()::date + 7, '東京都渋谷区体育館', NULL, 'upcoming')
     RETURNING id, name`
  );
  return ins[0];
}

async function ensureParticipant(tournamentId, userId) {
  const { rows } = await client.query(
    `SELECT id FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2 LIMIT 1`,
    [tournamentId, userId]
  );
  if (rows.length) return rows[0].id;
  const { rows: ins } = await client.query(
    `INSERT INTO tournament_participants (tournament_id, user_id, status)
     VALUES ($1, $2, 'registered') RETURNING id`,
    [tournamentId, userId]
  );
  return ins[0].id;
}

async function ensureResult(tournamentId, participantId, position, points, notes) {
  const { rows } = await client.query(
    `SELECT id FROM tournament_results WHERE tournament_id = $1 AND participant_id = $2 LIMIT 1`,
    [tournamentId, participantId]
  );
  if (rows.length) return rows[0].id;
  const { rows: ins } = await client.query(
    `INSERT INTO tournament_results (tournament_id, participant_id, position, points, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [tournamentId, participantId, position, points, notes]
  );
  return ins[0].id;
}

async function run() {
  await client.connect();
  console.log('🔌 Connected');

  // fetch some known users
  const { rows: users } = await client.query(
    `SELECT id, username, display_name FROM profiles WHERE username IN ('hanako','ichiro') ORDER BY username`
  );
  if (users.length === 0) {
    console.error('❌ Required users not found (hanako, ichiro). Run seed-data first.');
    process.exit(2);
  }

  const t = await ensureTournament();
  console.log('🎯 Tournament:', t.name, t.id);

  const created = [];
  for (const [idx, u] of users.entries()) {
    const pid = await ensureParticipant(t.id, u.id);
    const rid = await ensureResult(
      t.id,
      pid,
      idx + 1,
      10 * (users.length - idx),
      `${u.display_name}のテスト結果`
    );
    created.push({ user: u.username, participantId: pid, resultId: rid });
  }

  console.log('✅ Seeded tournament results:');
  for (const c of created) {
    console.log(`  - ${c.user}: participant=${c.participantId}, result=${c.resultId}`);
  }

  // show a short feed for following endpoint shape
  const { rows: feed } = await client.query(
    `SELECT tr.id, tr.tournament_id, tr.position, tr.points, tr.created_at,
            p.username, p.display_name
       FROM tournament_results tr
       JOIN tournament_participants tp ON tp.id = tr.participant_id
       JOIN profiles p ON p.id = tp.user_id
       ORDER BY tr.created_at DESC LIMIT 5`
  );
  console.log('\n📋 Recent results:');
  for (const r of feed) {
    console.log(`  - ${r.username} ${r.position}位 ${r.points}pt (${r.tournament_id})`);
  }

  await client.end();
}

run().catch(async (e) => {
  console.error('❌ Failed:', e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});

