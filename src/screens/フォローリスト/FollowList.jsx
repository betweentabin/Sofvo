import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const FollowList = () => {
  const mainContentTop = useHeaderOffset();
  const [searchParams] = useSearchParams();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const type = searchParams.get('type') || 'followers'; // 'followers' or 'following'

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(type);
  const [followingStatus, setFollowingStatus] = useState({}); // Track follow status for each user
  const [followingLoading, setFollowingLoading] = useState({});

  const isViewingOwnList = !userId || userId === user?.id;

  useEffect(() => {
    fetchUsers();
  }, [userId, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        navigate('/login');
        return;
      }

      let response;
      if (activeTab === 'followers') {
        response = await api.railwayUsers.getFollowers(targetUserId);
      } else {
        response = await api.railwayUsers.getFollowing(targetUserId);
      }

      const userList = response.data || [];
      setUsers(userList);

      // If viewing own list, check follow status for each user
      if (isViewingOwnList && user?.id) {
        const statusMap = {};
        for (const u of userList) {
          try {
            const { data: fs } = await api.railwayUsers.getFollowStatus(user.id, u.id);
            statusMap[u.id] = !!fs?.following;
          } catch (e) {
            statusMap[u.id] = false;
          }
        }
        setFollowingStatus(statusMap);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/follow-list${userId ? `/${userId}` : ''}?type=${tab}`);
  };

  const handleFollowToggle = async (targetUserId, e) => {
    e.stopPropagation(); // Prevent navigation to profile

    if (!user?.id || !isViewingOwnList) return;

    try {
      setFollowingLoading({ ...followingLoading, [targetUserId]: true });

      const isFollowing = followingStatus[targetUserId];

      if (isFollowing) {
        await api.railwayUsers.unfollow(user.id, targetUserId);
      } else {
        await api.railwayUsers.follow(user.id, targetUserId);
      }

      setFollowingStatus({
        ...followingStatus,
        [targetUserId]: !isFollowing
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('フォローの操作に失敗しました');
    } finally {
      setFollowingLoading({ ...followingLoading, [targetUserId]: false });
    }
  };

  return (
    <div className="follow-list-screen">
      <HeaderContent />

      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="follow-list-container">
          <div className="follow-list-tabs">
            <button
              className={`tab-button ${activeTab === 'followers' ? 'active' : ''}`}
              onClick={() => handleTabChange('followers')}
            >
              フォロワー
            </button>
            <button
              className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => handleTabChange('following')}
            >
              フォロー中
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <p>読み込み中...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-container">
              <p>{activeTab === 'followers' ? 'フォロワーがいません' : 'フォロー中のユーザーがいません'}</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((targetUser) => (
                <div
                  key={targetUser.id}
                  className="user-item"
                  onClick={() => handleUserClick(targetUser.id)}
                >
                  <div className="user-avatar">
                    {targetUser.avatar_url ? (
                      <img src={targetUser.avatar_url} alt={targetUser.display_name || targetUser.username} />
                    ) : (
                      <div className="avatar-placeholder">👤</div>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{targetUser.display_name || targetUser.username}</div>
                    {targetUser.bio && <div className="user-bio">{targetUser.bio}</div>}
                    <div className="user-stats">
                      <span>{targetUser.followers_count || 0} フォロワー</span>
                      <span className="separator">•</span>
                      <span>{targetUser.following_count || 0} フォロー中</span>
                    </div>
                  </div>
                  {isViewingOwnList ? (
                    <div className="user-action">
                      <button
                        className={`follow-button ${followingStatus[targetUser.id] ? 'following' : ''}`}
                        onClick={(e) => handleFollowToggle(targetUser.id, e)}
                        disabled={followingLoading[targetUser.id]}
                      >
                        {followingLoading[targetUser.id]
                          ? '処理中...'
                          : followingStatus[targetUser.id]
                            ? 'フォロー中'
                            : 'フォロー'}
                      </button>
                    </div>
                  ) : (
                    <div className="user-action">
                      <span className="arrow">›</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};
