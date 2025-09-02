import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://syffsveliozjwcrvfocl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZmZzdmVsaW96andjcnZmb2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3Mjk0OSwiZXhwIjoyMDcxNzQ4OTQ5fQ.AURpLBTOv_j1WaABVr37fp5jaiPCyNrgjAF5C8riLgE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function checkTestData() {
  console.log('🔍 Supabaseのテストデータを確認中...\n');

  try {
    // 1. 認証ユーザー一覧を確認
    console.log('1️⃣ 認証ユーザー一覧:');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('認証ユーザー取得エラー:', usersError);
    } else {
      console.log(`   📊 総ユーザー数: ${users.users.length}`);
      users.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      });
    }

    console.log('\n2️⃣ プロフィールテーブル:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('プロフィール取得エラー:', profilesError);
    } else {
      console.log(`   📊 プロフィール数: ${profiles.length}`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.display_name || profile.username} (${profile.username})`);
        if (profile.bio) {
          console.log(`      📝 Bio: ${profile.bio.substring(0, 50)}...`);
        }
        if (profile.sport_type) {
          console.log(`      🏆 Sport: ${profile.sport_type}`);
        }
      });
    }

    console.log('\n3️⃣ 特定テストユーザー詳細:');
    const testEmails = ['test@sofvo.com', 'test@example.com', 'player1@sofvo.com'];
    
    for (const email of testEmails) {
      const { data: userDetail, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) continue;
      
      const user = userDetail.users.find(u => u.email === email);
      if (user) {
        console.log(`   📧 ${email}:`);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log(`     ❌ プロフィール未作成`);
        } else {
          console.log(`     ✅ プロフィール作成済み`);
          console.log(`     👤 表示名: ${profile.display_name || 'なし'}`);
          console.log(`     🏷️ ユーザー名: ${profile.username || 'なし'}`);
          console.log(`     📍 場所: ${profile.location || 'なし'}`);
          console.log(`     📝 Bio: ${profile.bio ? profile.bio.substring(0, 30) + '...' : 'なし'}`);
        }
      } else {
        console.log(`   📧 ${email}: ❌ ユーザー未作成`);
      }
    }

    console.log('\n4️⃣ テーブル存在確認:');
    const tables = ['profiles', 'teams', 'tournaments', 'follows', 'messages'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${table}: エラー - ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${count}件のレコード`);
        }
      } catch (e) {
        console.log(`   ❌ ${table}: テーブル未作成`);
      }
    }

  } catch (error) {
    console.error('❌ 全体エラー:', error);
  }

  console.log('\n🎉 データ確認完了！');
}

checkTestData();
