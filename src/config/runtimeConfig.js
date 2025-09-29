// Loads runtime config from /app-config.json (overrides Vite env at runtime)
// Exposes window.__APP_CONFIG__ for modules to read

const defaults = {
  nodeApiUrl: import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api',
  railwayData: true,
  railwayChatTest: true,
  testUserId: import.meta.env.VITE_RAILWAY_TEST_USER_ID || ''
};

export async function loadAppConfig() {
  try {
    const res = await fetch('/app-config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const merged = { ...defaults, ...json };
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
