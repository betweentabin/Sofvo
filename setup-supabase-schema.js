import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://syffsveliozjwcrvfocl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZmZzdmVsaW96andjcnZmb2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3Mjk0OSwiZXhwIjoyMDcxNzQ4OTQ5fQ.AURpLBTOv_j1WaABVr37fp5jaiPCyNrgjAF5C8riLgE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function setupSchema() {
  console.log('🚀 Supabaseスキーマセットアップを開始...\n');

  try {
    // 1. 基本的なprofilesテーブルを作成
    console.log('1️⃣ profilesテーブル作成中...');
    
    const createProfilesSQL = `
    -- Users table (extends Supabase auth.users)
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      sport_type TEXT,
      location TEXT,
      age INTEGER,
      gender TEXT,
      experience_years TEXT,
      team_name TEXT,
      privacy_settings JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable Row Level Security
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);

    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    -- Function to handle new user registration
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, username, display_name)
      VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger for new user
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: schemaError } = await supabase.rpc('exec', { sql: createProfilesSQL });
    
    if (schemaError) {
      console.error('❌ スキーマ作成エラー:', schemaError);
      // 直接SQLを実行してみる
      console.log('📝 個別にテーブル作成を試行...');
      
      // profilesテーブルのみ作成
      const { error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (error && error.code === 'PGRST204') {
        console.log('❌ profilesテーブルが存在しません');
        console.log('⚠️  手動でSupabaseダッシュボードのSQLエディターで以下を実行してください:');
        console.log('\n--- ここから ---');
        console.log(createProfilesSQL);
        console.log('--- ここまで ---\n');
      }
    } else {
      console.log('✅ スキーマ作成成功');
    }

    // 2. 既存ユーザーのプロフィール作成
    console.log('\n2️⃣ 既存ユーザーのプロフィール作成中...');
    
    const { data: users } = await supabase.auth.admin.listUsers();
    
    for (const user of users.users) {
      const testUserProfiles = {
        'test@sofvo.com': {
          display_name: 'テストユーザー',
          username: 'testuser',
          bio: 'Sofvoのテストアカウントです',
          sport_type: 'ソフトテニス',
          location: '東京都'
        },
        'player1@sofvo.com': {
          display_name: '山田太郎',
          username: 'yamada',
          bio: 'ソフトテニス歴5年です',
          sport_type: 'ソフトテニス',
          location: '神奈川県'
        },
        'coach@sofvo.com': {
          display_name: '田中コーチ',
          username: 'tanaka',
          bio: '指導歴10年のコーチです',
          sport_type: 'ソフトテニス',
          location: '埼玉県'
        },
        'organizer@sofvo.com': {
          display_name: '大会運営者',
          username: 'organizer',
          bio: '各地で大会を運営しています',
          sport_type: 'ソフトテニス',
          location: '千葉県'
        }
      };

      const profileData = testUserProfiles[user.email] || {
        display_name: user.email.split('@')[0],
        username: user.email.replace('@', '_').replace('.', '_'),
        bio: '新規ユーザーです',
        sport_type: 'ソフトテニス'
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log(`❌ ${user.email}: プロフィール作成失敗 - ${profileError.message}`);
      } else {
        console.log(`✅ ${user.email}: プロフィール作成成功`);
      }
    }

    // 3. 結果確認
    console.log('\n3️⃣ 作成結果確認...');
    const { data: profiles, error: checkError } = await supabase
      .from('profiles')
      .select('*');

    if (checkError) {
      console.error('❌ 確認エラー:', checkError);
    } else {
      console.log(`✅ プロフィール数: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`   👤 ${profile.display_name} (@${profile.username})`);
      });
    }

  } catch (error) {
    console.error('❌ セットアップエラー:', error);
  }

  console.log('\n🎉 セットアップ完了！');
}

setupSchema();
