import pg from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

async function addTeamMembers() {
  try {
    await client.connect();
    console.log('✅ データベースに接続しました');

    // 既存のチームを確認
    const teamsResult = await client.query(`
      SELECT t.*, tm.user_id as owner_id
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.role = 'owner'
      ORDER BY t.created_at DESC
      LIMIT 1
    `);

    if (teamsResult.rows.length === 0) {
      console.log('❌ チームが見つかりません。先にチームを作成してください。');
      return;
    }

    const team = teamsResult.rows[0];
    console.log(`\n📋 チーム情報:`);
    console.log(`   名前: ${team.name}`);
    console.log(`   ID: ${team.id}`);
    console.log(`   オーナーID: ${team.owner_id}`);

    // 既存のメンバーを確認
    const existingMembersResult = await client.query(`
      SELECT tm.user_id, p.username, p.display_name, tm.role
      FROM team_members tm
      LEFT JOIN profiles p ON tm.user_id = p.id
      WHERE tm.team_id = $1
    `, [team.id]);

    console.log(`\n現在のメンバー数: ${existingMembersResult.rows.length}人`);
    existingMembersResult.rows.forEach(m => {
      console.log(`   - ${m.display_name || m.username || m.user_id} (${m.role})`);
    });

    const existingMemberIds = new Set(existingMembersResult.rows.map(m => m.user_id));

    // オーナー以外のユーザーを取得
    const usersResult = await client.query(`
      SELECT id, username, display_name, age, gender, experience_years, location
      FROM profiles
      WHERE id != $1
      LIMIT 5
    `, [team.owner_id]);

    console.log(`\n追加可能なユーザー: ${usersResult.rows.length}人`);

    if (usersResult.rows.length === 0) {
      console.log('❌ 追加できるユーザーが見つかりません。');
      return;
    }

    // メンバーを追加
    let addedCount = 0;
    for (const user of usersResult.rows) {
      // 既にメンバーの場合はスキップ
      if (existingMemberIds.has(user.id)) {
        console.log(`⏭️  ${user.display_name || user.username} は既にメンバーです`);
        continue;
      }

      const memberId = randomUUID();
      const now = new Date().toISOString();

      await client.query(`
        INSERT INTO team_members (id, team_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, 'member', $4)
      `, [memberId, team.id, user.id, now]);

      console.log(`✅ 追加: ${user.display_name || user.username || user.id} (${user.age || '?'}歳, ${user.gender || '?'}, ${user.location || '?'})`);
      addedCount++;
    }

    if (addedCount > 0) {
      console.log(`\n✅ ${addedCount}人のメンバーを追加しました！`);

      // 最終的なメンバーリストを表示
      const finalMembersResult = await client.query(`
        SELECT tm.user_id, p.username, p.display_name, p.age, p.gender, p.location, tm.role
        FROM team_members tm
        LEFT JOIN profiles p ON tm.user_id = p.id
        WHERE tm.team_id = $1
        ORDER BY
          CASE tm.role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            ELSE 3
          END,
          tm.joined_at ASC
      `, [team.id]);

      console.log(`\n📋 最終メンバーリスト (${finalMembersResult.rows.length}人):`);
      finalMembersResult.rows.forEach((m, i) => {
        const roleLabel = m.role === 'owner' ? '代表' : m.role === 'admin' ? '管理者' : 'メンバー';
        const info = `${m.display_name || m.username || m.user_id}`;
        const details = `${m.age || '?'}歳, ${m.gender || '?'}, ${m.location || '?'}`;
        console.log(`   ${i + 1}. ${info} (${roleLabel}) - ${details}`);
      });
    } else {
      console.log('\n⚠️  新しいメンバーは追加されませんでした（全員既にメンバーです）');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ データベース接続を終了しました');
  }
}

addTeamMembers().catch(console.error);
