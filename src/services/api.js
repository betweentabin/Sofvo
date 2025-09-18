import axios from 'axios';
import { supabase } from '../lib/supabase';

// Node.js バックエンドAPI設定
const nodeAPI = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// リクエストインターセプター（認証トークン自動付与）
nodeAPI.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// レスポンスインターセプター（エラーハンドリング）
nodeAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // トークン期限切れの場合、リフレッシュを試みる
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        // リトライ
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return nodeAPI.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // ===== Supabase直接使用（リアルタイム機能） =====
  chat: {
    // メッセージ送信
    sendMessage: async (conversationId, content, type = 'text') => {
      const { data: { user } } = await supabase.auth.getUser();
      return supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          type
        })
        .select()
        .single();
    },
    
    // メッセージ取得
    getMessages: (conversationId) => {
      return supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, username, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    },
    
    // 会話作成
    createConversation: async (recipientId) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 既存の会話をチェック
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'direct')
        .contains('participants', [user.id, recipientId]);
      
      if (existing?.length > 0) {
        return { data: existing[0] };
      }
      
      // 新規作成
      const { data: conversation } = await supabase
        .from('conversations')
        .insert({ type: 'direct' })
        .select()
        .single();
      
      // 参加者追加
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: recipientId }
        ]);
      
      return { data: conversation };
    }
  },
  
  notifications: {
    // リアルタイム通知の購読
    subscribe: (userId, callback) => {
      return supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          callback
        )
        .subscribe();
    }
  },
  
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
  }
};

export default api;
