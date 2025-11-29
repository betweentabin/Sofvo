/**
 * Sofvoサイトの機能確認用スクリプト
 * ブラウザのコンソールで実行して、主要機能をテストします
 */

// テストアカウント情報
const TEST_ACCOUNT = {
  email: 'test@sofvo.com',
  password: 'Sofvo123!'
};

// ログイン関数
async function testLogin() {
  console.log('🔐 ログインテスト開始...');
  
  // ログインフォームの要素を取得
  const emailInput = document.querySelector('input[type="email"]');
  const passwordInput = document.querySelector('input[type="password"]');
  const loginButton = document.querySelector('button[type="submit"]');
  
  if (!emailInput || !passwordInput || !loginButton) {
    console.error('❌ ログインフォームが見つかりません');
    return false;
  }
  
  // フォームに入力
  emailInput.value = TEST_ACCOUNT.email;
  passwordInput.value = TEST_ACCOUNT.password;
  
  // 入力イベントを発火
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  // ログインボタンをクリック
  loginButton.click();
  
  console.log('✅ ログインボタンをクリックしました');
  return true;
}

// ページの要素を確認する関数
function checkPageElements() {
  console.log('📋 ページ要素の確認...');
  
  const checks = {
    'ログインフォーム': document.querySelector('form'),
    'メールアドレス入力': document.querySelector('input[type="email"]'),
    'パスワード入力': document.querySelector('input[type="password"]'),
    'ログインボタン': document.querySelector('button[type="submit"]'),
    'アカウント作成リンク': document.querySelector('a[href*="signup"]'),
  };
  
  Object.entries(checks).forEach(([name, element]) => {
    if (element) {
      console.log(`✅ ${name}: 見つかりました`);
    } else {
      console.log(`❌ ${name}: 見つかりません`);
    }
  });
  
  return checks;
}

// ホーム画面の機能確認
function checkHomePageFeatures() {
  console.log('🏠 ホーム画面の機能確認...');
  
  const checks = {
    'ヘッダー': document.querySelector('header') || document.querySelector('[class*="header"]'),
    'フォロー中タブ': document.querySelector('[class*="tab"]') || document.querySelector('button:contains("フォロー中")'),
    'おすすめタブ': document.querySelector('button:contains("おすすめ")'),
    '投稿ボタン': document.querySelector('button:contains("投稿")') || document.querySelector('[class*="post"]'),
    'フッター': document.querySelector('footer') || document.querySelector('[class*="footer"]'),
  };
  
  Object.entries(checks).forEach(([name, element]) => {
    if (element) {
      console.log(`✅ ${name}: 見つかりました`);
    } else {
      console.log(`❌ ${name}: 見つかりません`);
    }
  });
  
  return checks;
}

// ナビゲーション機能の確認
function checkNavigation() {
  console.log('🧭 ナビゲーション機能の確認...');
  
  const links = document.querySelectorAll('a[href]');
  const routes = Array.from(links).map(link => link.getAttribute('href'));
  
  console.log(`✅ 見つかったリンク数: ${routes.length}`);
  console.log('リンク一覧:', routes.slice(0, 10)); // 最初の10個を表示
  
  return routes;
}

// API接続の確認
async function checkApiConnection() {
  console.log('🌐 API接続の確認...');
  
  try {
    const config = window.__APP_CONFIG__ || {};
    const apiUrl = config.nodeApiUrl || 'http://localhost:5000/api';
    
    console.log(`API URL: ${apiUrl}`);
    
    // ヘルスチェック（存在する場合）
    try {
      const response = await fetch(`${apiUrl}/health`, { method: 'GET' });
      console.log(`✅ API接続成功: ${response.status}`);
    } catch (error) {
      console.log(`⚠️ ヘルスチェックエンドポイントが見つかりません: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ API接続エラー:', error);
    return false;
  }
}

// メイン実行関数
async function runTests() {
  console.log('🚀 Sofvoサイトの機能確認を開始します...\n');
  
  // 現在のURLを確認
  console.log(`📍 現在のURL: ${window.location.href}`);
  console.log(`📍 現在のパス: ${window.location.hash || window.location.pathname}\n`);
  
  // ページ要素の確認
  checkPageElements();
  console.log('');
  
  // ナビゲーションの確認
  checkNavigation();
  console.log('');
  
  // API接続の確認
  await checkApiConnection();
  console.log('');
  
  // ログインページの場合、ログインテストを実行
  if (window.location.hash.includes('/login') || window.location.pathname.includes('/login')) {
    console.log('ログインページを検出しました。ログインテストを実行します...\n');
    await testLogin();
    
    // ログイン後のリダイレクトを待つ
    setTimeout(() => {
      console.log('\n📍 ログイン後のURL:', window.location.href);
      if (window.location.hash.includes('/home') || window.location.pathname.includes('/home')) {
        console.log('✅ ホーム画面にリダイレクトされました');
        checkHomePageFeatures();
      }
    }, 3000);
  } else if (window.location.hash.includes('/home') || window.location.pathname.includes('/home')) {
    console.log('ホーム画面を検出しました。\n');
    checkHomePageFeatures();
  }
  
  console.log('\n✅ 機能確認が完了しました');
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testLogin, checkPageElements, checkHomePageFeatures, checkNavigation, checkApiConnection };
} else {
  // ブラウザで直接実行
  runTests();
}

