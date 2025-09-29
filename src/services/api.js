import axios from 'axios';
// Supabase removed: Railway-only implementation

// Node.js バックエンドAPI設定（runtime config優先）
const runtimeCfg = typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {};

function resolveBaseUrl() {
  const isBrowser = typeof window !== 'undefined';
  const host = isBrowser ? window.location.hostname : '';
  const inVercel = /\.vercel\.app$/.test(host) || host === 'sofvo.vercel.app';
  // Treat as native Capacitor only when platform is not 'web'
  const isCapacitor = isBrowser && (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.Capacitor?.getPlatform && window.Capacitor.getPlatform() !== 'web')
  );

  if (isCapacitor) {
    return runtimeCfg.nodeApiUrl || import.meta.env.VITE_MOBILE_API_URL || import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';
  }

  // On Vercel production, force relative path to use rewrites and avoid CORS
  if (inVercel) {
    return '/api';
  }

  return runtimeCfg.nodeApiUrl || import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';
}

const BASE_URL = resolveBaseUrl();
const nodeAPI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// リクエストインターセプター（認証トークン自動付与）
const USE_RAILWAY_AUTH = true; // Railway-only

nodeAPI.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('JWT');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// レスポンスインターセプター（エラーハンドリング）
nodeAPI.interceptors.response.use((r) => r, async (error) => Promise.reject(error));

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
      const base = (import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api').replace(/\/?api\/?$/, '');
      const token = localStorage.getItem('JWT') || '';
      return `${base}/api/realtime/notifications?as_user=${encodeURIComponent(asUserId)}&token=${encodeURIComponent(token)}`;
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
    getRecommended: (limit = 10) => nodeAPI.get('/railway-home/recommended', { params: { limit } }),
    getRecommendedDiaries: (limit = 3) => nodeAPI.get('/railway-home/recommended-diaries', { params: { limit } }),
  },
  // ===== Railway (PostgreSQL) Posts =====
  railwayPosts: {
    latest: (limit = 30) => nodeAPI.get('/railway-posts/latest', { params: { limit } }),
    following: (asUserId, limit = 30) => nodeAPI.get('/railway-posts/following', { params: { as_user: asUserId, limit } }),
    create: (asUserId, content, visibility = 'public') => nodeAPI.post('/railway-posts/create', { as_user: asUserId, content, visibility }),
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
    search: (term, limit = 10) => nodeAPI.get('/railway-users/search', { params: { term, limit } }),
  },
  // ===== Railway (PostgreSQL) Teams =====
  railwayTeams: {
    getOwnerTeam: (asUserId) => nodeAPI.get('/railway-teams/owner', { params: { as_user: asUserId, limit: 1 } }),
    createTeam: (asUserId, { name, description, sport_type }) => nodeAPI.post('/railway-teams/create', { as_user: asUserId, name, description, sport_type }),
    getMembers: (teamId) => nodeAPI.get('/railway-teams/members', { params: { team_id: teamId } }),
    removeMember: (asUserId, teamId, userId) => nodeAPI.delete('/railway-teams/members', { data: { as_user: asUserId, team_id: teamId, user_id: userId } }),
  },
  // ===== Railway (PostgreSQL) Tournaments =====
  railwayTournaments: {
    create: (asUserId, payload) => nodeAPI.post('/railway-tournaments/create', { as_user: asUserId, ...payload }),
    listMyHosted: (asUserId) => nodeAPI.get('/railway-tournaments/my-hosted', { params: { as_user: asUserId } }),
    search: (params = {}) => nodeAPI.get('/railway-tournaments/search', { params }),
  }
};

export default api;
