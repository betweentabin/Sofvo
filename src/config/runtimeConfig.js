// Loads runtime config from /app-config.json (overrides Vite env at runtime)
// Exposes window.__APP_CONFIG__ for modules to read

const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : '';
const inVercel = /\.vercel\.app$/.test(host) || host === 'sofvo.vercel.app';
const PROD_RAILWAY_API = 'https://sofvo-api-production.up.railway.app/api';

const defaults = {
  // Vercel本番ではビルド時の環境変数に依存せず、固定の本番APIを採用する
  nodeApiUrl: (
    (import.meta.env.PROD && inVercel)
      ? PROD_RAILWAY_API
      : (import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api')
  )?.toString().trim(),
  railwayData: true,
  railwayChatTest: true,
  // 改行や空白が混入した環境変数を安全化
  testUserId: (import.meta.env.VITE_RAILWAY_TEST_USER_ID || '')?.toString().trim()
};

export async function loadAppConfig() {
  try {
    const res = await fetch('/app-config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const merged = { ...defaults, ...json };
    // 取り込んだ設定のサニタイズ（改行や余分な空白を除去）
    if (merged.nodeApiUrl) merged.nodeApiUrl = String(merged.nodeApiUrl).trim();
    if (merged.testUserId) merged.testUserId = String(merged.testUserId).trim();
    // If running on non-localhost origin but JSON points to localhost, prefer defaults (env)
    const isLocalOrigin = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
    const isLocalApi = /localhost|127\.0\.0\.1/.test(String(merged.nodeApiUrl || ''));
    if (!isLocalOrigin && isLocalApi) {
      merged.nodeApiUrl = defaults.nodeApiUrl;
    }
    window.__APP_CONFIG__ = merged;
  } catch {
    window.__APP_CONFIG__ = { ...defaults };
  }
}

export function getAppConfig() {
  return window.__APP_CONFIG__ || { ...defaults };
}
