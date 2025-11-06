import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import ChatRoom from "../../components/Chat/ChatRoom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Dm = () => {
  const mainContentTop = useHeaderOffset();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Viewer (=ログインユーザー) のIDは常に user.id を使用
  const viewerUserId = user?.id || null;
  // Railway chat test mode（UIは非表示）
  const [railwayUserId] = useState(null);
  const [railwayConversations, setRailwayConversations] = useState([]);
  const [railwayLoading, setRailwayLoading] = useState(false);
  // Safely derive TEST_RAILWAY flag from runtime/app config and env
  const TEST_RAILWAY = false;

  
  // Fetch test accounts (Railway) when test mode enabled
  // Test accounts UI removed

  // Fetch railway conversations for selected test user
  useEffect(() => {
    const loadConvs = async () => {
      if (!viewerUserId) return;
      setRailwayLoading(true);
      setLoading(true);
      try {
        const { data } = await api.railwayChat.getConversations(viewerUserId);
        setRailwayConversations(data || []);
      } catch (e) {
        console.error('Failed to load railway conversations:', e);
      } finally {
        setRailwayLoading(false);
        setLoading(false);
      }
    };
    loadConvs();
  }, [viewerUserId]);

  // 取得済みの Railway 会話一覧を既存の描画用 state に同期
  useEffect(() => {
    setConversations(railwayConversations || []);
  }, [railwayConversations]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      setSelectedConversation(conversation);
    }
  }, [conversationId, conversations]);

  const handleSearchUser = async () => {
    if (!searchUser.trim()) return;
    try {
      const { data } = await api.railwayUsers.search(searchUser.trim(), 10, {
        mutualOnly: true,
        as_user: viewerUserId,
      });
      const list = (data || []).filter(u => u.id !== viewerUserId);
      setSearchResults(list);
    } catch (e) {
      console.error('User search failed:', e);
      setSearchResults([]);
    }
  };

  const handleStartConversation = async (recipientId) => {
    try {
      // Node/Railway API で会話作成（as_user は常にログインユーザー）
      if (!viewerUserId) return;
      setRailwayLoading(true);
      try {
        const { data } = await api.railwayChat.createConversation(viewerUserId, [recipientId], 'direct', null);
        const newId = data?.conversation_id || data?.conversation?.id;
        if (newId) {
          const { data: convs } = await api.railwayChat.getConversations(viewerUserId);
          setRailwayConversations(convs || []);
          navigate(`/dm/${newId}`);
          setSelectedConversation((convs || []).find(c => c.id === newId) || { id: newId, type: 'direct' });
        }
      } catch (err) {
        if (err?.response?.status === 403) {
          alert('メッセージを送るには相互フォローが必要です');
        } else {
          console.error('Failed to create conversation:', err);
          alert('会話の作成に失敗しました');
        }
      } finally {
        setRailwayLoading(false);
      }

      // 共通: モーダルと検索状態のリセット
      setShowNewMessage(false);
      setSearchUser("");
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(
        p => p.user.id !== user?.id
      );
      return otherParticipant?.user?.display_name || otherParticipant?.user?.username || 'Unknown User';
    }
    return conversation.name || 'グループチャット';
  };

  const getRailwayConversationName = (conv) => {
    if (conv.type === 'direct') {
      // Show name of the other participant
      const other = (conv.participants || []).find(p => p.user_id !== viewerUserId);
      return other?.display_name || other?.username || 'DM';
    }
    return conv.name || 'グループチャット';
  };

  if (!user) {
    return (
      <div className="Dm">
        <HeaderContent />
        <div className="main-content" style={{ position: "absolute", top: `${mainContentTop}px` }}>
          <div className="auth-message">
            <p>メッセージ機能を使用するにはログインしてください</p>
            <button onClick={() => navigate('/login')} className="login-button">
              ログインする
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="Dm">
      <HeaderContent />
      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          height: `calc(100vh - ${mainContentTop}px)`,
          width: "100%",
          display: "flex",
        }}
      >
        <div className="dm-container">
          <div className="conversations-sidebar">
            <div className="conversations-header">
              <h2>メッセージ</h2>
              <button 
                onClick={() => setShowNewMessage(true)}
                className="new-message-button"
              >
                新規作成
              </button>
            </div>
            
            <div className="conversations-list">
              {loading ? (
                <div className="loading">読み込み中...</div>
              ) : conversations.length === 0 ? (
                <div className="no-conversations">
                  <p>メッセージはまだありません</p>
                  <button onClick={() => setShowNewMessage(true)}>
                    新しい会話を始める
                  </button>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      navigate(`/dm/${conversation.id}`);
                    }}
                  >
                    <div className="conversation-avatar">
                      {getConversationName(conversation).charAt(0).toUpperCase()}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">
                        {getConversationName(conversation)}
                      </div>
                      {conversation.last_message && (
                        <div className="conversation-last-message">
                          {conversation.last_message.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-area">
            {(selectedConversation || conversationId) ? (
              <ChatRoom conversationId={selectedConversation?.id || conversationId} asUserId={viewerUserId} />
            ) : (
              <div className="no-conversation-selected">
                <p>会話を選択するか、新しい会話を始めてください</p>
              </div>
            )}
          </div>
        </div>

        {showNewMessage && (
          <div className="new-message-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>新しいメッセージ</h3>
                <button onClick={() => setShowNewMessage(false)}>×</button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  placeholder="ユーザー名を検索..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <button onClick={handleSearchUser}>検索</button>
                
                <div className="search-results">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="user-result"
                      onClick={() => handleStartConversation(user.id)}
                    >
                      <div className="user-avatar">
                        {user.display_name?.charAt(0) || user.username.charAt(0)}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.display_name || user.username}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
