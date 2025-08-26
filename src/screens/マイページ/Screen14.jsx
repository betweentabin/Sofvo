import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import "./style.css";

export const Screen14 = () => {
  const [mainContentTop, setMainContentTop] = useState(201);
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
  
  const { userId } = useParams(); // URLからユーザーIDを取得
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const updateMainContentPosition = () => {
      const header = document.querySelector(".header-content-outer");
      if (header) {
        const headerRect = header.getBoundingClientRect();
        setMainContentTop(headerRect.bottom);
      }
    };

    const timer = setTimeout(updateMainContentPosition, 200);
    window.addEventListener("resize", updateMainContentPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateMainContentPosition);
    };
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // URLにuserIdがない場合は自分のプロフィールを表示
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        navigate('/login');
        return;
      }

      console.log('Fetching profile for user:', targetUserId);

      // プロフィール情報を取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // プロフィールが存在しない場合は作成
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: targetUserId,
              display_name: user?.email?.split('@')[0] || 'ユーザー',
              username: user?.email?.split('@')[0] || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Profile creation error:', createError);
            throw createError;
          }
          
          setProfile(newProfile);
        } else {
          throw profileError;
        }
      } else {
        console.log('Profile data received:', profileData);
        setProfile(profileData);
      }
      setIsOwnProfile(targetUserId === user?.id);

      // フォロー状態を確認（他人のプロフィールの場合）
      if (!isOwnProfile && user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single();
        
        setFollowStatus(!!followData);
      }

      // 統計情報を取得
      await fetchStats(targetUserId);
      
      // 大会履歴を取得
      await fetchTournaments(targetUserId);

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (targetUserId) => {
    try {
      // フォロー・フォロワー数を取得
      const { data: followingData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', targetUserId);
      
      const { data: followersData } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', targetUserId);

      // 大会参加数を取得
      const { data: tournamentsData } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('user_id', targetUserId);

      // チーム所属数を取得
      const { data: teamsData } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', targetUserId);

      // ポイント計算（仮の実装）
      const { data: resultsData } = await supabase
        .from('tournament_results')
        .select('points')
        .eq('user_id', targetUserId);

      const totalPoints = resultsData?.reduce((sum, result) => sum + (result.points || 0), 0) || 0;
      
      // 今年のポイント（仮の実装）
      const currentYear = new Date().getFullYear();
      const { data: yearlyResultsData } = await supabase
        .from('tournament_results')
        .select('points, created_at')
        .eq('user_id', targetUserId)
        .gte('created_at', `${currentYear}-01-01`);

      const yearlyPoints = yearlyResultsData?.reduce((sum, result) => sum + (result.points || 0), 0) || 0;

      setStats({
        yearlyPoints,
        totalPoints,
        followingCount: followingData?.length || 0,
        followersCount: followersData?.length || 0,
        tournamentCount: tournamentsData?.length || 0,
        teamCount: teamsData?.length || 0,
        awardsCount: 0, // 受賞数（実装待ち）
        badgesCount: 0  // バッジ数（実装待ち）
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTournaments = async (targetUserId) => {
    try {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select(`
          tournament_id,
          tournaments (
            id,
            name,
            start_date,
            end_date
          ),
          tournament_results (
            position,
            points
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (followStatus) {
        // アンフォロー
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
      } else {
        // フォロー
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          });
      }
      
      setFollowStatus(!followStatus);
      await fetchStats(profile.id); // フォロワー数を更新
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
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
          </div>
        </div>
      </div>

      <Footer currentPage={isOwnProfile ? "mypage" : ""} />
    </div>
  );
};