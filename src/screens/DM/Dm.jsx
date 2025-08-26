import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import ChatRoom from "../../components/Chat/ChatRoom";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../hooks/useChat";
import { supabase } from "../../lib/supabase";
import "./style.css";

export const Dm = () => {
  const [mainContentTop, setMainContentTop] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, loading, createDirectConversation } = useConversations();

  useEffect(() => {
    const updateMainContentPosition = () => {
      const header = document.querySelector(".header-content-outer");
      if (header) {
        const rect = header.getBoundingClientRect();
        setMainContentTop(rect.bottom);
      }
    };

    setTimeout(updateMainContentPosition, 200);
    window.addEventListener("resize", updateMainContentPosition);
    return () => window.removeEventListener("resize", updateMainContentPosition);
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      setSelectedConversation(conversation);
    }
  }, [conversationId, conversations]);

  const handleSearchUser = async () => {
    if (!searchUser.trim()) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${searchUser}%,display_name.ilike.%${searchUser}%`)
      .limit(10);
    
    setSearchResults(data || []);
  };

  const handleStartConversation = async (recipientId) => {
    try {
      const conversation = await createDirectConversation(recipientId);
      navigate(`/dm/${conversation.id}`);
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
            {selectedConversation ? (
              <ChatRoom conversationId={selectedConversation.id} />
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
