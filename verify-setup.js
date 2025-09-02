import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://syffsveliozjwcrvfocl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZmZzdmVsaW96andjcnZmb2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3Mjk0OSwiZXhwIjoyMDcxNzQ4OTQ5fQ.AURpLBTOv_j1WaABVr37fp5jaiPCyNrgjAF5C8riLgE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySetup() {
  console.log('🔍 セットアップ確認中...\n');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('❌ エラー:', error.message);
      return;
    }

    console.log(`✅ プロフィールテーブル確認成功！`);
    console.log(`📊 総プロフィール数: ${profiles.length}\n`);

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. 👤 ${profile.display_name} (@${profile.username})`);
      console.log(`   📍 ${profile.location || '場所未設定'}`);
      console.log(`   📝 ${profile.bio ? profile.bio.substring(0, 30) + '...' : 'Bio未設定'}`);
      console.log('');
    });

    console.log('🎉 すべてのテストプロフィールが正常に作成されました！');

  } catch (error) {
    console.error('❌ 接続エラー:', error);
  }
}

verifySetup();
