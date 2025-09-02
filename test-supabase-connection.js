// Supabase接続テスト用スクリプト
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase設定チェック:')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? '設定済み' : '未設定')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません')
  console.log('1. .envファイルを作成してください')
  console.log('2. VITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください')
  process.exit(1)
}

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🚀 Supabase接続テスト開始...')
    
    // 基本的な接続テスト
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ 接続エラー:', error.message)
      return false
    }
    
    console.log('✅ Supabase接続成功!')
    console.log('✅ profilesテーブルにアクセス可能')
    
    // その他のテーブルもチェック
    const tables = ['teams', 'tournaments', 'conversations', 'messages']
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (tableError) {
        console.error(`❌ ${table}テーブルエラー:`, tableError.message)
      } else {
        console.log(`✅ ${table}テーブルアクセス可能`)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase設定完了! アプリケーションを使用できます。')
  } else {
    console.log('\n⚠️  設定に問題があります。上記のエラーを確認してください。')
  }
})
