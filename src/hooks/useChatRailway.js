import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// Lightweight chat hook that talks to Railway-backed Node API
export const useChatRailway = (conversationId, asUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const esRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !asUserId) return;
    try {
      setLoading(true);
      const { data } = await api.railwayChat.getMessages(conversationId, asUserId, { limit: 100 });
      setMessages(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, asUserId]);

  const sendMessage = async (content, type = 'text') => {
    if (!conversationId || !asUserId) return;
    const { data } = await api.railwayChat.sendMessage(conversationId, asUserId, content, type);
    setMessages(prev => [...prev, data]);
    return data;
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // SSE realtime subscription
  useEffect(() => {
    if (!conversationId || !asUserId) return;
    const cfg = typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {};
    const upstream = (cfg.nodeApiUrl || import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api');
    const baseRoot = upstream.replace(/\/?api\/?$/, '');
    const token = localStorage.getItem('JWT');
    const url = `${baseRoot}/api/realtime/chat?conversation_id=${encodeURIComponent(conversationId)}&as_user=${encodeURIComponent(asUserId)}&token=${encodeURIComponent(token || '')}`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;
    es.addEventListener('message', (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setMessages(prev => [...prev, data]);
      } catch {}
    });
    es.addEventListener('notification', () => {});
    es.addEventListener('error', (ev) => {
      // keep silent; browser will reconnect
    });
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [conversationId, asUserId]);

  return { messages, loading, error, sendMessage, refetch: fetchMessages };
};

export default useChatRailway;
