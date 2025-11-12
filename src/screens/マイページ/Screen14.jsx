import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// Supabase removed: Railway-only
import api from "../../services/api";
import "./style.css";

export const Screen14 = () => {
  const mainContentTop = useHeaderOffset();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followStatus, setFollowStatus] = useState(false);
  const [stats, setStats] = useState({
    yearlyPoints: 0,
    totalPoints: 0,
    followingCount: 0,
    followersCount: 0,
    tournamentCount: 0,
    teamCount: 0,
    awardsCount: 0,
    badgesCount: 0
  });
  const [tournaments, setTournaments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  
  const { userId } = useParams(); // URLからユーザーIDを取得
  const navigate = useNavigate();
  const { user } = useAuth();
  const USE_RAILWAY = true;
  const RUNTIME = typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {};
  const RAILWAY_TEST_USER = RUNTIME.testUserId || import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;

  
  useEffect(() => {
    fetchProfile();
  }, [userId, user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let targetUserId = USE_RAILWAY ? (userId || RAILWAY_TEST_USER || user?.id) : (userId || user?.id);
      if (!targetUserId) {
        navigate('/login');
        return;
      }

      // Remove any whitespace characters (including newlines) from user_id
      targetUserId = targetUserId.trim().replace(/[\r\n\t]/g, '');

      const { data } = await api.railwayUsers.getProfile(targetUserId);
      setProfile(data);
      const currentRailId = RAILWAY_TEST_USER || user?.id;
      const isOwn = targetUserId === currentRailId;
      setIsOwnProfile(isOwn);
      if (!isOwn && currentRailId) {
        const { data: fs } = await api.railwayUsers.getFollowStatus(currentRailId, targetUserId);
        setFollowStatus(!!fs?.following);
      }

      await fetchStats(targetUserId);
      await fetchTournaments(targetUserId);
      await fetchActivities(targetUserId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (targetUserId) => {
    try {
      const { data } = await api.railwayUsers.getStats(targetUserId);
      setStats({
        yearlyPoints: data.yearlyPoints || 0,
        totalPoints: data.totalPoints || 0,
        followingCount: data.followingCount || 0,
        followersCount: data.followersCount || 0,
        tournamentCount: data.tournamentCount || 0,
        teamCount: data.teamCount || 0,
        awardsCount: data.awardsCount || 0,
        badgesCount: data.badgesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTournaments = async (targetUserId) => {
    try {
      const { data } = await api.railwayUsers.getTournaments(targetUserId, 5);
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  // 最近の活動（投稿）を取得し、対象ユーザーのものだけに絞り込み
  const fetchActivities = async (targetUserId) => {
    try {
      setActivitiesLoading(true);
      // 直近の投稿から自分の投稿のみを抽出（最大10件）
      const { data } = await api.railwayPosts.latest(50);
      const mine = (data || []).filter(p => p.user_id === targetUserId).slice(0, 10);
      setActivities(mine);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      const currentRailId = RAILWAY_TEST_USER || user?.id;
      if (!currentRailId || !profile?.id) return;
      if (followStatus) {
        await api.railwayUsers.unfollow(currentRailId, profile.id);
      } else {
        await api.railwayUsers.follow(currentRailId, profile.id);
      }
      setFollowStatus(!followStatus);
      await fetchStats(profile.id);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="screen-14">
        <HeaderContent />
        <div className="main-content" style={{ position: "absolute", top: `${mainContentTop}px` }}>
          <div className="loading-container">
            <p>読み込み中...</p>
          </div>
        </div>
        <Footer currentPage="mypage" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="screen-14">
        <HeaderContent />
        <div className="main-content" style={{ position: "absolute", top: `${mainContentTop}px` }}>
          <div className="error-container">
            <p>プロフィールが見つかりません</p>
          </div>
        </div>
        <Footer currentPage="mypage" />
      </div>
    );
  }

  return (
    <div className="screen-14">
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
        <div className="frame-227">
          <div className="frame-228">
            <div className="frame-229">
              <div className="frame-230">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                ) : null}
              </div>
              <div className="frame-231">
                <div className="frame-232">
                  <div className="frame-233">
                    <div className="text-wrapper-121">{profile.display_name || profile.username || "名前未設定"}</div>
                    <div className="text-wrapper-122">{profile.location || "地域未設定"}</div>
                  </div>
                  {isOwnProfile ? (
                    <Link to="/profile-edit" className="frame-234">
                      <div className="text-wrapper-123">編集</div>
                    </Link>
                  ) : (
                    <button onClick={handleFollow} className="frame-234 follow-button">
                      <div className="text-wrapper-123">{followStatus ? "フォロー中" : "フォロー"}</div>
                    </button>
                  )}
                </div>
                <div className="frame-235">
                  <div className="frame-236">
                    <div className="text-wrapper-124-1">{stats.yearlyPoints} ポイント(一年間)</div>
                    <div className="text-wrapper-124-2">{stats.totalPoints} ポイント（通算）</div>
                  </div>
                  <div className="frame-236">
                    <div className="text-wrapper-124-3">{stats.followingCount} フォロー</div>
                    <div className="text-wrapper-124-4">{stats.followersCount} フォロワー</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-wrapper-125">
              {profile.bio || "自己紹介が設定されていません"}
            </div>
            <div className="frame-237">
              <div className="frame-238">
                <div className="text-wrapper-126-1">参加大会：{stats.tournamentCount}試合</div>
                <div className="text-wrapper-126-2">所属チーム：{stats.teamCount}チーム</div>
                <div className="text-wrapper-126-3">受賞数：{stats.awardsCount}回</div>
                <div className="text-wrapper-126-4">バッジ数：{stats.badgesCount}個</div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-246">
          <div className="text-wrapper-129">大会参加履歴</div>
        </div>

        {tournaments.length > 0 ? (
          tournaments.map((item, index) => (
            <div key={index} className="frame-247">
              <div className="frame-228">
                <div className="frame-248">
                  <div className="text-wrapper-127-1">大会名：{item.tournaments?.name || "不明"}</div>
                  <div className="text-wrapper-127-2">
                    開催日時：{item.tournaments?.start_date ? new Date(item.tournaments.start_date).toLocaleDateString('ja-JP') : "未定"}
                  </div>
                  <div className="text-wrapper-127-3">
                    試合結果：{item.tournament_results?.[0]?.position ? `第${item.tournament_results[0].position}位` : "未確定"}
                  </div>
                  <div className="text-wrapper-127-4">
                    獲得ポイント：{item.tournament_results?.[0]?.points || 0}P
                  </div>
                </div>
                <div className="frame-249">
                  <div className="frame-250">
                    <Link to={`/tournament-detail/${item.tournament_id}`} className="frame-38">
                      <div className="text-wrapper-130">大会概要</div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-tournaments">
            <p>大会参加履歴がありません</p>
          </div>
        )}
        
        <div className="frame-245">
          <div className="frame-244">
            <div className="text-wrapper-129">活動記録</div>
          </div>
          <div className="frame-240">
            {activitiesLoading ? (
              <div className="activity-loading">読み込み中...</div>
            ) : activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="activity-card">
                  <div className="activity-header">
                    <span className="activity-time">{new Date(act.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div className="activity-content">{act.content}</div>
                </div>
              ))
            ) : (
              <div className="activity-empty">まだ活動記録がありません</div>
            )}
          </div>
        </div>
      </div>

      <Footer currentPage={isOwnProfile ? "mypage" : ""} />
    </div>
  );
};
