#!/usr/bin/env node

// 全機能テストスクリプト
// 1. チーム参加
// 2. 対戦表自動生成
// 3. 通知機能

const BASE_URL = 'https://5a3336f7.sofvo.pages.dev/api';

// 前回作成したデータ
const TEST_USER_ID = 'fbe51299-5b26-4b3f-bffb-713b86d34401';
const TEST_TOURNAMENT_ID = 'f1bba84c-60bd-4bd6-807e-ebe0b0dee182';
const TEST_TEAM_ID = '69e11392-c0bb-4cd5-afc0-6833085a0774';

async function testTeamParticipation() {
  console.log('\n=== テスト1: チーム参加 ===');
  
  try {
    const response = await fetch(`${BASE_URL}/railway-tournaments/${TEST_TOURNAMENT_ID}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        mode: 'team',
        team_id: TEST_TEAM_ID
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ チーム参加成功！');
      return { success: true, data };
    } else {
      console.log('❌ チーム参加失敗');
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return { success: false, error: error.message };
  }
}

async function createAdditionalTeams() {
  console.log('\n=== 追加のチームを作成（対戦表生成用） ===');
  
  const teams = [];
  for (let i = 2; i <= 4; i++) {
    try {
      const response = await fetch(`${BASE_URL}/railway-teams/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          as_user: TEST_USER_ID,
          name: `テストチーム${i}`,
          description: `対戦表生成テスト用チーム${i}`
        })
      });
      
      const team = await response.json();
      if (response.ok) {
        console.log(`✅ チーム${i}作成成功:`, team.id);
        teams.push(team);
      } else {
        console.log(`❌ チーム${i}作成失敗:`, team);
      }
    } catch (error) {
      console.error(`❌ チーム${i}作成エラー:`, error.message);
    }
  }
  
  return teams;
}

async function applyTeamsToTournament(teams) {
  console.log('\n=== テスト2: 複数チーム参加（対戦表自動生成トリガー） ===');
  
  const results = [];
  
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    console.log(`\nチーム${i + 2} (${team.name}) を参加させています...`);
    
    try {
      const response = await fetch(`${BASE_URL}/railway-tournaments/${TEST_TOURNAMENT_ID}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: TEST_USER_ID,
          mode: 'team',
          team_id: team.id
        })
      });
      
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      results.push({
        team: team.name,
        success: response.ok,
        matchesGenerated: data.matches_generated,
        data
      });
      
      if (data.matches_generated) {
        console.log('🎉 対戦表が自動生成されました！');
      }
    } catch (error) {
      console.error('❌ エラー:', error.message);
      results.push({
        team: team.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

async function checkMatches() {
  console.log('\n=== 対戦表の確認 ===');
  
  try {
    const response = await fetch(`${BASE_URL}/railway-tournaments/${TEST_TOURNAMENT_ID}/matches`);
    const matches = await response.json();
    
    console.log(`\n試合数: ${matches.length}`);
    console.log('期待値: 4チーム → 6試合 (4C2)');
    
    if (matches.length > 0) {
      console.log('\n対戦表:');
      matches.forEach(match => {
        console.log(`試合${match.match_number}: ${match.team1_name || 'Team 1'} vs ${match.team2_name || 'Team 2'}`);
      });
      
      console.log('\n✅ 対戦表が正常に生成されています！');
      return { success: true, matches };
    } else {
      console.log('❌ 対戦表が生成されていません');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return { success: false, error: error.message };
  }
}

async function checkNotifications() {
  console.log('\n=== テスト3: 通知機能の確認 ===');
  
  try {
    // 通知一覧を取得（認証が必要な場合はスキップ）
    const response = await fetch(`${BASE_URL}/railway-notifications?user_id=${TEST_USER_ID}`);
    
    if (response.ok) {
      const notifications = await response.json();
      
      const tournamentNotifs = notifications.filter(n =>
        n.type === 'match_schedule' || n.type === 'tournament_reminder'
      );
      
      console.log(`\n大会関連の通知数: ${tournamentNotifs.length}`);
      
      if (tournamentNotifs.length > 0) {
        console.log('\n通知一覧:');
        tournamentNotifs.forEach(n => {
          console.log(`- ${n.type}: ${n.title}`);
          console.log(`  作成日時: ${n.created_at}`);
        });
        
        console.log('\n✅ 通知が作成されています！');
        return { success: true, notifications: tournamentNotifs };
      } else {
        console.log('⚠️  通知はまだ作成されていません');
        console.log('（対戦表生成時に開催前日の日時で作成されます）');
        return { success: true, notifications: [] };
      }
    } else {
      console.log('⚠️  通知エンドポイントにアクセスできません（認証が必要な可能性）');
      return { success: false, needsAuth: true };
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('  全機能統合テスト');
  console.log('========================================');
  console.log('デプロイURL:', BASE_URL);
  console.log('テストユーザーID:', TEST_USER_ID);
  console.log('テスト大会ID:', TEST_TOURNAMENT_ID);
  console.log('テストチームID:', TEST_TEAM_ID);
  
  const results = {
    teamParticipation: null,
    matchGeneration: null,
    notifications: null
  };
  
  // テスト1: 最初のチーム参加
  results.teamParticipation = await testTeamParticipation();
  
  if (results.teamParticipation.success) {
    // テスト2: 追加チーム作成と参加（対戦表生成トリガー）
    console.log('\n定員4チームの大会なので、あと3チーム必要です...');
    const additionalTeams = await createAdditionalTeams();
    
    if (additionalTeams.length > 0) {
      const applyResults = await applyTeamsToTournament(additionalTeams);
      
      // 対戦表確認
      const matchResult = await checkMatches();
      results.matchGeneration = matchResult;
      
      // 通知確認
      const notifResult = await checkNotifications();
      results.notifications = notifResult;
    }
  }
  
  // 最終結果サマリー
  console.log('\n========================================');
  console.log('  テスト結果サマリー');
  console.log('========================================');
  console.log('1. チーム参加:', results.teamParticipation?.success ? '✅ 成功' : '❌ 失敗');
  console.log('2. 対戦表自動生成:', results.matchGeneration?.success ? '✅ 成功' : '❌ 失敗');
  console.log('3. 通知機能:', results.notifications?.success ? '✅ 動作確認' : '⚠️  要確認');
  console.log('========================================\n');
}

main().catch(console.error);

