import axios from 'axios';
// Supabase removed: Railway-only implementation

// Node.js バックエンドAPI設定（runtime config優先）
function getRuntimeCfg() {
  try {
    return (typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {});
  } catch {
    return {};
  }
}

export function resolveBaseUrl() {
  const isBrowser = typeof window !== 'undefined';
  const host = isBrowser ? window.location.hostname : '';
  const inVercel = /\.vercel\.app$/.test(host) || host === 'sofvo.vercel.app';
  const runtimeCfg = getRuntimeCfg();
  // Treat as native Capacitor only when platform is not 'web'
  const isCapacitor = isBrowser && (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.Capacitor?.getPlatform && window.Capacitor.getPlatform() !== 'web')
  );

  if (isCapacitor) {
    return runtimeCfg.nodeApiUrl || 'http://localhost:5000/api';
  }

  // On Vercel production, force relative path to use rewrites and avoid CORS
  if (inVercel) {
    // Use runtime override or relative path; avoid build-time env inlining
    return runtimeCfg.nodeApiUrl || '/api';
  }

  return runtimeCfg.nodeApiUrl || 'http://localhost:5000/api';
}

const nodeAPI = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' }
});

// リクエストインターセプター（認証トークン自動付与）
const USE_RAILWAY_AUTH = true; // Railway-only

nodeAPI.interceptors.request.use(async (config) => {
  // Refresh baseURL every request in case runtime config loaded late
  try {
    config.baseURL = resolveBaseUrl();
  } catch {}
  // Ensure headers object exists
  if (!config.headers) config.headers = {};
  // Attach JWT if present
  const token = localStorage.getItem('JWT');
  if (token) {
    // Set for case-sensitive and lowercase keys to avoid adapter differences
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.authorization = `Bearer ${token}`;
  }
  // Debug logging (masked)
  try {
    if (localStorage.getItem('DEBUG_API') === '1') {
      const masked = token ? (token.slice(0, 6) + '...' + token.slice(-4)) : 'none';
      // Avoid logging large bodies
      const summary = {
        method: (config.method || 'get').toUpperCase(),
        url: (config.baseURL || '') + (config.url || ''),
        params: config.params || undefined,
        hasData: !!config.data,
        token: masked
      };
      // eslint-disable-next-line no-console
      console.log('[API] request', summary);
    }
  } catch {}
  return config;
}, (error) => Promise.reject(error));

// レスポンスインターセプター（エラーハンドリング）
nodeAPI.interceptors.response.use((r) => {
  try {
    if (localStorage.getItem('DEBUG_API') === '1') {
      // eslint-disable-next-line no-console
      console.log('[API] response', { status: r.status, url: r.config?.url });
    }
  } catch {}
  return r;
}, async (error) => {
  try {
    if (localStorage.getItem('DEBUG_API') === '1') {
      // eslint-disable-next-line no-console
      console.warn('[API] error', { status: error?.response?.status, url: error?.config?.url, msg: error?.message });
    }
  } catch {}
  return Promise.reject(error);
});

export const api = {
  // Supabase chat removed
  // ===== Railway (PostgreSQL) Notifications =====
  railwayNotifications: {
    list: (limit = 50, offset = 0) => nodeAPI.get('/railway-notifications', { params: { limit, offset } }),
    unreadCount: () => nodeAPI.get('/railway-notifications/unread-count'),
    markRead: (id) => nodeAPI.put(`/railway-notifications/${id}/read`),
    readAll: () => nodeAPI.put('/railway-notifications/read-all'),
    delete: (id) => nodeAPI.delete(`/railway-notifications/${id}`),
    clearAll: () => nodeAPI.delete('/railway-notifications/clear-all'),
    sseUrl: (asUserId) => {
      // Prefer runtime override to ensure absolute upstream base in production
      const cfgNow = getRuntimeCfg();
      const upstreamBase = (cfgNow.nodeApiUrl || 'http://localhost:5000/api');
      const baseRoot = upstreamBase.replace(/\/?api\/?$/, '');
      const token = localStorage.getItem('JWT') || '';
      return `${baseRoot}/api/realtime/notifications?as_user=${encodeURIComponent(asUserId)}&token=${encodeURIComponent(token)}`;
    },
    saveDeviceToken: (token, platform, device_info = {}) => nodeAPI.post('/railway-notifications/device-tokens', { token, platform, device_info }),
    deleteDeviceToken: (token) => nodeAPI.delete('/railway-notifications/device-tokens', { data: { token } }),
    getSettings: () => nodeAPI.get('/railway-notifications/settings'),
    updateSettings: (settings) => nodeAPI.put('/railway-notifications/settings', settings)
  },
  // Supabase notifications removed
  
  // ===== Node.js API使用（ビジネスロジック） =====
  
  // ユーザー管理
  users: {
    getProfile: (userId) => nodeAPI.get(`/users/${userId}`),
    updateProfile: (data) => nodeAPI.put('/users/me', data),
    getSettings: () => nodeAPI.get('/users/me/settings'),
    updateSettings: (data) => nodeAPI.put('/users/me/settings', data),
    getRecommended: () => nodeAPI.get('/users/recommended'),
    deleteAccount: () => nodeAPI.delete('/users/me')
  },
  
  // チーム管理
  teams: {
    list: (params) => nodeAPI.get('/teams', { params }),
    create: (data) => nodeAPI.post('/teams', data),
    get: (id) => nodeAPI.get(`/teams/${id}`),
    update: (id, data) => nodeAPI.put(`/teams/${id}`, data),
    delete: (id) => nodeAPI.delete(`/teams/${id}`),
    
    // メンバー管理
    getMembers: (id) => nodeAPI.get(`/teams/${id}/members`),
    addMember: (id, userId, role = 'member') => 
      nodeAPI.post(`/teams/${id}/members`, { userId, role }),
    removeMember: (id, userId) => 
      nodeAPI.delete(`/teams/${id}/members/${userId}`),
    updateMemberRole: (id, userId, role) => 
      nodeAPI.put(`/teams/${id}/members/${userId}`, { role }),
    
    // 自分のチーム
    getMyTeams: () => nodeAPI.get('/teams/my-teams')
  },
  
  // 大会管理
  tournaments: {
    list: (params) => nodeAPI.get('/tournaments', { params }),
    create: (data) => nodeAPI.post('/tournaments', data),
    get: (id) => nodeAPI.get(`/tournaments/${id}`),
    update: (id, data) => nodeAPI.put(`/tournaments/${id}`, data),
    delete: (id) => nodeAPI.delete(`/tournaments/${id}`),
    
    // 参加管理
    register: (id, data) => nodeAPI.post(`/tournaments/${id}/register`, data),
    withdraw: (id) => nodeAPI.delete(`/tournaments/${id}/register`),
    getParticipants: (id) => nodeAPI.get(`/tournaments/${id}/participants`),
    
    // 結果管理
    submitResults: (id, results) => 
      nodeAPI.post(`/tournaments/${id}/results`, results),
    getResults: (id) => nodeAPI.get(`/tournaments/${id}/results`),
    
    // 検索・フィルター
    search: (query) => nodeAPI.get('/tournaments/search', { params: query }),
    getUpcoming: () => nodeAPI.get('/tournaments/upcoming'),
    getMyTournaments: () => nodeAPI.get('/tournaments/my-tournaments')
  },
  
  // お問い合わせ
  contact: {
    send: (data) => nodeAPI.post('/contact', data),
    getHistory: () => nodeAPI.get('/contact/history')
  },
  
  // メディアアップロード
  media: {
    upload: async (file, type = 'image') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      return nodeAPI.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    delete: (id) => nodeAPI.delete(`/media/${id}`)
  }
  ,
  // ===== Railway (PostgreSQL) chat test API =====
  railwayChat: {
    listTestAccounts: () => nodeAPI.get('/railway-chat/test-accounts'),
    getConversations: (asUserId) => nodeAPI.get('/railway-chat/conversations', { params: { as_user: asUserId } }),
    createConversation: (asUserId, participantIds = [], type = 'direct', name = null) =>
      nodeAPI.post('/railway-chat/conversations', { as_user: asUserId, participant_ids: participantIds, type, name }),
    getMessages: (conversationId, asUserId, params = {}) =>
      nodeAPI.get(`/railway-chat/conversations/${conversationId}/messages`, { params: { as_user: asUserId, ...params } }),
    sendMessage: (conversationId, asUserId, content, type = 'text', file_url = null) =>
      nodeAPI.post('/railway-chat/send', { as_user: asUserId, conversation_id: conversationId, content, type, file_url })
  },
  // ===== Railway (PostgreSQL) Home feed =====
  railwayHome: {
    getFollowing: (asUserId, limit = 10) => nodeAPI.get('/railway-home/following', { params: { as_user: asUserId, limit } }),
    getRecommended: (limit = 10, opts = {}) => nodeAPI.get('/railway-home/recommended', { params: { limit, ...opts } }),
    getRecommendedDiaries: (limit = 3) => nodeAPI.get('/railway-home/recommended-diaries', { params: { limit } }),
  },
  // ===== Railway (PostgreSQL) Posts =====
  railwayPosts: {
    latest: (limit = 30) => nodeAPI.get('/railway-posts/latest', { params: { limit } }),
    following: (asUserId, limit = 30) => nodeAPI.get('/railway-posts/following', { params: { as_user: asUserId, limit } }),
    // Optionally accepts fileUrl (string) and imageUrls (array)
    create: (asUserId, content, visibility = 'public', fileUrl = null, imageUrls = []) => {
      const payload = { as_user: asUserId, content, visibility };
      if (fileUrl) payload.file_url = fileUrl;
      if (imageUrls && imageUrls.length) payload.image_urls = imageUrls;
      return nodeAPI.post('/railway-posts/create', payload);
    },
    getLikes: (postId) => nodeAPI.get(`/railway-posts/${postId}/likes`),
    like: (postId) => nodeAPI.post(`/railway-posts/${postId}/like`),
    unlike: (postId) => nodeAPI.delete(`/railway-posts/${postId}/like`),
    getComments: (postId, limit = 30) => nodeAPI.get(`/railway-posts/${postId}/comments`, { params: { limit } }),
    addComment: (postId, content) => nodeAPI.post(`/railway-posts/${postId}/comments`, { content }),
  },
  // ===== Railway (PostgreSQL) Users / Profile =====
  railwayUsers: {
    getProfile: (userId) => nodeAPI.get('/railway-users/profile', { params: { user_id: userId } }),
    updateProfile: (payload) => nodeAPI.put('/railway-users/profile', payload),
    getFollowStatus: (asUser, targetId) => nodeAPI.get('/railway-users/follow-status', { params: { as_user: asUser, target_id: targetId } }),
    follow: (asUser, targetId) => nodeAPI.post('/railway-users/follow', { as_user: asUser, target_id: targetId }),
    unfollow: (asUser, targetId) => nodeAPI.delete('/railway-users/follow', { data: { as_user: asUser, target_id: targetId } }),
    getStats: (userId) => nodeAPI.get('/railway-users/stats', { params: { user_id: userId } }),
    getTournaments: (userId, limit = 5) => nodeAPI.get('/railway-users/tournaments', { params: { user_id: userId, limit } }),
    search: (term, limit = 10, opts = {}) => nodeAPI.get('/railway-users/search', { params: { term, limit, ...opts } }),
  },
  // ===== Railway (PostgreSQL) Teams =====
  railwayTeams: {
    getOwnerTeam: (asUserId) => nodeAPI.get('/railway-teams/owner', { params: { as_user: asUserId, limit: 1 } }),
    createTeam: (asUserId, { name, description, sport_type }) => nodeAPI.post('/railway-teams/create', { as_user: asUserId, name, description, sport_type }),
    getMembers: (teamId) => nodeAPI.get('/railway-teams/members', { params: { team_id: teamId } }),
    removeMember: (asUserId, teamId, userId) => nodeAPI.delete('/railway-teams/members', { data: { as_user: asUserId, team_id: teamId, user_id: userId } }),
    updateTeam: (asUserId, teamId, payload) => nodeAPI.put('/railway-teams/update', { as_user: asUserId, team_id: teamId, ...payload }),
    getStats: (teamId) => nodeAPI.get('/railway-teams/stats', { params: { team_id: teamId } }),
  },
  // ===== Railway (PostgreSQL) Tournaments =====
  railwayTournaments: {
    create: (asUserId, payload) => nodeAPI.post('/railway-tournaments/create', { as_user: asUserId, ...payload }),
    listMyHosted: (asUserId) => nodeAPI.get('/railway-tournaments/my-hosted', { params: { as_user: asUserId } }),
    getOne: (id) => nodeAPI.get(`/railway-tournaments/${id}`),
    getLikes: (id) => nodeAPI.get(`/railway-tournaments/${id}/likes`),
    like: (id) => nodeAPI.post(`/railway-tournaments/${id}/like`),
    unlike: (id) => nodeAPI.delete(`/railway-tournaments/${id}/like`),
    results: (id) => nodeAPI.get(`/railway-tournaments/${id}/results`),
    isParticipating: (id, mode = 'individual', teamId = null) => nodeAPI.get(`/railway-tournaments/${id}/is-participating`, { params: { mode, team_id: teamId } }),
    apply: (id, mode = 'individual', teamId = null) => nodeAPI.post(`/railway-tournaments/${id}/apply`, { mode, team_id: teamId }),
    withdraw: (id, mode = 'individual', teamId = null) => nodeAPI.delete(`/railway-tournaments/${id}/apply`, { data: { mode, team_id: teamId } }),
    search: (params = {}) => nodeAPI.get('/railway-tournaments/search', { params }),
  }
  ,
  // ===== Railway meta (search options) =====
  railwayMeta: {
    get: () => nodeAPI.get('/railway-meta')
  }
};

export default api;
