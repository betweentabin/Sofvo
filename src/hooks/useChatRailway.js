import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Lightweight chat hook that talks to Railway-backed Node API
export const useChatRailway = (conversationId, asUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return { messages, loading, error, sendMessage, refetch: fetchMessages };
};

export default useChatRailway;

