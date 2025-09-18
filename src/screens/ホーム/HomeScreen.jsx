import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { HeaderTabs } from "../../components/HeaderTabs";
import { HeaderShare } from "../../components/HeaderShare";
import { Footer } from "../../components/Footer";
import { FloatingPostButton } from "../../components/FloatingPostButton";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const HomeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("following"); // 'following' or 'recommend'
  const [mainContentTop, setMainContentTop] = useState(201);
  const [likedPosts, setLikedPosts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [followingPosts, setFollowingPosts] = useState([]);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [recommendedDiaries, setRecommendedDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCreatedPosts, setUserCreatedPosts] = useState([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const composerInitialState = {
    tournamentName: '',
    date: '',
    location: '',
    category: '',
    position: '',
    points: '',
    memo: '',
  };
  const [composerData, setComposerData] = useState(composerInitialState);
  const [filters, setFilters] = useState({
    yearMonth: 'all',
    region: 'all',
    category: 'all',
  });

  // Fetch following posts
  const fetchFollowingPosts = async () => {
    if (!user) return;
    
    try {
      // Get users that current user follows
      const { data: followingUsers, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      if (followError) throw followError;
      
      if (followingUsers && followingUsers.length > 0) {
        const followingIds = followingUsers.map(f => f.following_id);
        
        // Get tournament results from followed users
        const { data: posts, error: postsError } = await supabase
          .from('tournament_results')
          .select(`
            *,
            tournament_participants!inner(user_id, team_id),
            tournaments!inner(*),
            profiles!tournament_participants(username, display_name, avatar_url)
          `)
          .in('tournament_participants.user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (postsError) throw postsError;
        setFollowingPosts(posts || []);
      }
    } catch (error) {
      console.error('Error fetching following posts:', error);
    }
  };

  // Fetch recommended posts (latest tournament results)
  const fetchRecommendedPosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('tournament_results')
        .select(`
          *,
          tournament_participants!inner(*),
          tournaments!inner(*),
          profiles:tournament_participants(user_id).user_id(username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setRecommendedPosts(posts || []);
    } catch (error) {
      console.error('Error fetching recommended posts:', error);
    }
  };

  // Fetch recommended diaries (placeholder for now - could be a future feature)
  const fetchRecommendedDiaries = async () => {
    try {
      // For now, just fetch recent profiles with bio
      const { data: diaries, error } = await supabase
        .from('profiles')
        .select('*')
        .not('bio', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setRecommendedDiaries(diaries || []);
    } catch (error) {
      console.error('Error fetching recommended diaries:', error);
    }
  };

  useEffect(() => {
    const updateMainContentPosition = () => {
      const headerShare = document.querySelector(".header-share-outer");
      if (headerShare) {
        const headerShareRect = headerShare.getBoundingClientRect();
        const headerShareBottom = headerShareRect.bottom;
        console.log("HomeScreen - headerShareRect:", headerShareRect);
        console.log("HomeScreen - headerShareBottom:", headerShareBottom);
        setMainContentTop(headerShareBottom);
      } else {
        console.log("HomeScreen - header-share-outer not found");
      }
    };

    const timer = setTimeout(updateMainContentPosition, 200);
    window.addEventListener("resize", updateMainContentPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateMainContentPosition);
    };
  }, []);

  // Fetch data when component mounts or user changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (activeTab === 'following' && user) {
        await fetchFollowingPosts();
      } else if (activeTab === 'recommend') {
        await Promise.all([
          fetchRecommendedPosts(),
          fetchRecommendedDiaries()
        ]);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [activeTab, user]);

  console.log("HomeScreen - current mainContentTop:", mainContentTop);

  // いいねボタンのハンドラー
  const handleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const formatYearMonth = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const parseYearMonth = (label) => {
    if (!label) return 0;
    const match = label.match(/(\d{4})年(\d{1,2})月/);
    if (!match) return 0;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    return new Date(year, month).getTime();
  };

  const allPosts = useMemo(() => {
    return [...userCreatedPosts, ...followingPosts, ...recommendedPosts];
  }, [userCreatedPosts, followingPosts, recommendedPosts]);

  const yearMonthOptions = useMemo(() => {
    const values = new Set();
    allPosts.forEach((post) => {
      const label = formatYearMonth(post?.tournaments?.start_date);
      if (label) {
        values.add(label);
      }
    });
    return Array.from(values).sort((a, b) => parseYearMonth(b) - parseYearMonth(a));
  }, [allPosts]);

  const regionOptions = useMemo(() => {
    const values = new Set();
    allPosts.forEach((post) => {
      if (post?.tournaments?.location) {
        values.add(post.tournaments.location);
      }
    });
    return Array.from(values).sort();
  }, [allPosts]);

  const categoryOptions = useMemo(() => {
    const values = new Set();
    allPosts.forEach((post) => {
      if (post?.tournaments?.sport_type) {
        values.add(post.tournaments.sport_type);
      }
    });
    return Array.from(values).sort();
  }, [allPosts]);

  const matchesFilters = (post) => {
    const tournament = post?.tournaments;
    if (filters.yearMonth !== 'all') {
      const label = formatYearMonth(tournament?.start_date);
      if (label !== filters.yearMonth) {
        return false;
      }
    }

    if (filters.region !== 'all') {
      if (!tournament?.location || tournament.location !== filters.region) {
        return false;
      }
    }

    if (filters.category !== 'all') {
      if (!tournament?.sport_type || tournament.sport_type !== filters.category) {
        return false;
      }
    }

    return true;
  };

  const filteredFollowingPosts = useMemo(() => {
    const combined = [...userCreatedPosts, ...followingPosts];
    return combined.filter((post) => matchesFilters(post));
  }, [userCreatedPosts, followingPosts, filters]);

  const filteredRecommendedPosts = useMemo(() => {
    return recommendedPosts.filter((post) => matchesFilters(post));
  }, [recommendedPosts, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleComposerChange = (field) => (event) => {
    setComposerData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const resetComposer = () => {
    setComposerData(composerInitialState);
    setIsComposerOpen(false);
  };

  const handleSubmitComposer = (event) => {
    event.preventDefault();

    if (!composerData.tournamentName.trim()) {
      alert('大会名を入力してください');
      return;
    }

    const newPost = {
      id: `local-${Date.now()}`,
      isLocal: true,
      created_at: new Date().toISOString(),
      tournaments: {
        name: composerData.tournamentName.trim(),
        start_date: composerData.date ? new Date(composerData.date).toISOString() : null,
        location: composerData.location.trim() || null,
        sport_type: composerData.category.trim() || null,
      },
      position: composerData.position ? Number(composerData.position) : null,
      points: composerData.points ? Number(composerData.points) : null,
      memo: composerData.memo.trim(),
      profiles: {
        display_name: user?.email?.split('@')[0] || 'あなた',
        username: user?.email || 'あなた',
      },
    };

    setUserCreatedPosts((prev) => [newPost, ...prev]);
    resetComposer();
  };

  const handleOpenComposer = () => {
    setIsComposerOpen(true);
  };

  // 検索ハンドラー
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/tournament-search-team?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="HOME-screen">
      <HeaderContent showSettings={false} />
      <HeaderTabs onTabChange={setActiveTab} activeTab={activeTab} />
      <HeaderShare
        filters={filters}
        options={{
          yearMonths: yearMonthOptions,
          regions: regionOptions,
          categories: categoryOptions,
        }}
        onFilterChange={handleFilterChange}
      />

      {/* 本文セクション - ヘッダーとフッターの間 */}
      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {activeTab === "following" ? (
          // フォロー中の内容
          <div className="following-content">
            {isComposerOpen && (
              <div className="frame-75 home-post-composer">
                <form className="frame-76 home-post-composer-form" onSubmit={handleSubmitComposer}>
                  <div className="home-post-composer-header">
                    <div className="frame-77">
                      <div className="frame-78" />
                      <div className="text-wrapper-63">
                        {user?.email?.split('@')[0] || 'あなた'}
                      </div>
                    </div>
                    <button type="button" className="home-post-composer-close" onClick={resetComposer}>
                      閉じる
                    </button>
                  </div>

                  <div className="frame-79 home-post-composer-body">
                    <label className="composer-label">
                      <span className="text-wrapper-65">大会名</span>
                      <input
                        type="text"
                        value={composerData.tournamentName}
                        onChange={handleComposerChange('tournamentName')}
                        placeholder="大会名を入力"
                        className="home-post-input"
                        required
                      />
                    </label>

                    <label className="composer-label">
                      <span className="text-wrapper-65">開催日時</span>
                      <input
                        type="date"
                        value={composerData.date}
                        onChange={handleComposerChange('date')}
                        className="home-post-input"
                      />
                    </label>

                    <label className="composer-label">
                      <span className="text-wrapper-65">開催地域</span>
                      <input
                        type="text"
                        value={composerData.location}
                        onChange={handleComposerChange('location')}
                        placeholder="開催地域を入力"
                        className="home-post-input"
                      />
                    </label>

                    <label className="composer-label">
                      <span className="text-wrapper-65">種別</span>
                      <input
                        type="text"
                        value={composerData.category}
                        onChange={handleComposerChange('category')}
                        placeholder="種別を入力"
                        className="home-post-input"
                      />
                    </label>

                    <div className="home-post-inline">
                      <label className="composer-label">
                        <span className="text-wrapper-65">試合結果</span>
                        <input
                          type="number"
                          min="1"
                          value={composerData.position}
                          onChange={handleComposerChange('position')}
                          placeholder="順位"
                          className="home-post-input"
                        />
                      </label>

                      <label className="composer-label">
                        <span className="text-wrapper-65">獲得ポイント</span>
                        <input
                          type="number"
                          min="0"
                          value={composerData.points}
                          onChange={handleComposerChange('points')}
                          placeholder="ポイント"
                          className="home-post-input"
                        />
                      </label>
                    </div>

                    <label className="composer-label">
                      <span className="text-wrapper-65">メモ</span>
                      <textarea
                        value={composerData.memo}
                        onChange={handleComposerChange('memo')}
                        placeholder="大会のメモを入力"
                        className="home-post-textarea"
                        rows={3}
                      />
                    </label>
                  </div>

                  <div className="home-post-composer-actions">
                    <button type="button" className="frame-84 home-post-cancel" onClick={resetComposer}>
                      キャンセル
                    </button>
                    <button type="submit" className="frame-82 home-post-submit">
                      <div className="text-wrapper-66">投稿する</div>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>
            ) : filteredFollowingPosts.length > 0 ? (
              filteredFollowingPosts.map((post) => (
                <div className="frame-75" key={post.id}>
                  <div className="frame-76">
                    <div className="frame-77">
                      <div className="frame-78" />
                      <div className="text-wrapper-63">
                        {post.profiles?.display_name || post.profiles?.username || 'アカウント名'}
                      </div>
                    </div>

                    <div className="frame-79">
                      <div className="text-wrapper-65">
                        大会名：{post.tournaments?.name || '大会名未設定'}
                      </div>
                      <div className="text-wrapper-65">
                        開催日時：{post.tournaments?.start_date ? new Date(post.tournaments.start_date).toLocaleDateString('ja-JP') : '日付未定'}
                      </div>
                      <div className="text-wrapper-65">
                        試合結果：第{post.position || '-'}位
                      </div>
                      <div className="text-wrapper-65">
                        獲得ポイント：{post.points || 0}P
                      </div>
                      {post.memo && (
                        <div className="text-wrapper-65 memo-text">
                          メモ：{post.memo}
                        </div>
                      )}
                    </div>

                    <div className="frame-80">
                      <div className="rectangle-4" />
                      <div className="rectangle-4" />
                      <div className="rectangle-4" />
                      <div className="rectangle-4" />
                      <div className="rectangle-4" />
                    </div>

                    <div className="frame-81">
                      <div
                        className={`frame-82${post.isLocal ? ' disabled' : ''}`}
                        onClick={() => {
                          if (!post.tournament_id) return;
                          navigate(`/tournament-detail/${post.tournament_id}`);
                        }}
                        style={{ cursor: post.tournament_id ? 'pointer' : 'default' }}
                      >
                        <div className="text-wrapper-66">大会概要</div>
                      </div>

                      <div className="frame-83">
                        <div className="frame-84" 
                             onClick={() => handleLike(post.id)}
                             style={{ cursor: 'pointer' }}>
                          <div className="heart-2">
                            <img
                              className="vector-16"
                              alt="Vector"
                              src="/img/vector-25.svg"
                              style={{ filter: likedPosts[post.id] ? 'invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' : 'none' }}
                            />
                          </div>
                          <div className="text-wrapper-67">
                            {likedPosts[post.id] ? '1' : '0'} いいね
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <img className="img-3" alt="Element" src="/img/2-1.svg" />
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                フォロー中のユーザーの投稿がありません
              </div>
            )}
          </div>
        ) : (
          // おすすめの内容
          <div className="recommend-content">
            <div className="frame-22">
              <div className="frame-23">
                <div className="magnifying-glass-wrapper">
                  <div className="magnifying-glass">
                    <img
                      className="search-icon"
                      alt="検索"
                      src="/img/検索黒.png"
                    />
                  </div>
                </div>
                <div className="text-wrapper-39">
                  大会を検索（チーム参加）
                </div>
              </div>

              <div className="frame-24">
                <div className="frame-box1">
                  <input
                    type="text"
                    id="search-year-month"
                    className="custom-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="大会名を入力"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="frame-30" onClick={handleSearch} style={{ cursor: 'pointer' }}>
                <div className="text-wrapper-43">検索</div>
              </div>
            </div>




            <div className="activity-section">
              <div className="activity-header">
                <div className="text-wrapper-77">最新の大会結果</div>
                <div className="text-wrapper-78" onClick={() => navigate('/ads')} style={{ cursor: 'pointer' }}>もっと見る</div>
              </div>

            <div className="activity-items">
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>
                ) : filteredRecommendedPosts.length > 0 ? (
                  filteredRecommendedPosts.slice(0, 3).map((post) => (
                    <div className="activity-item" key={post.id}>
                      <div className="rectangle-6" />
                      <div className="activity-item-content">
                        <div className="activity-item-header">
                          <div className="frame-117" />
                          <div className="text-wrapper-79">
                            {post.profiles?.display_name || post.profiles?.username || 'アカウント名'}
                          </div>
                        </div>
                        <div className="text-wrapper-80-group">
                          <div className="text-wrapper-80 title">
                            {post.tournaments?.name || '大会名未設定'}
                          </div>
                          <div className="text-wrapper-80 date">
                            {post.tournaments?.start_date ? new Date(post.tournaments.start_date).toLocaleDateString('ja-JP') : '日付未定'}
                          </div>
                          <div className="text-wrapper-80 result">
                            試合結果：第{post.position || '-'}位
                          </div>
                          <div className="text-wrapper-80 points">
                            獲得ポイント：{post.points || 0}P
                          </div>
                        </div>
                        <div className="frame-90" 
                             onClick={() => navigate(`/tournament-detail/${post.tournament_id}`)} 
                             style={{ cursor: 'pointer' }}>
                          <div className="text-wrapper-44">大会概要</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    まだ大会結果がありません
                  </div>
                )}
              </div>
            </div>



            <div className="recommend-section">
              <div className="recommend-header">
                <div className="text-wrapper-77">おすすめのプロフィール</div>
                <div className="text-wrapper-78" onClick={() => navigate('/ads')} style={{ cursor: 'pointer' }}>もっと見る</div>
              </div>

              <div className="recommend-items">
                {recommendedDiaries.length > 0 ? (
                  recommendedDiaries.map((diary) => (
                    <div className="recommend-item" key={diary.id}>
                      <div className="rectangle-6" />
                      <div className="recommend-item-content">
                        <div className="recommend-item-header">
                          <div className="frame-117" />
                          <div className="text-wrapper-79">
                            {diary.display_name || diary.username || 'アカウント名'}
                          </div>
                        </div>
                        <div className="text-wrapper-80">
                          {diary.bio || 'プロフィール情報がありません'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    おすすめのプロフィールがありません
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 投稿用のフローティングボタン（トップページ #/ のみ表示） */}
      {(location.pathname === "/" || location.pathname === "/home") && (
        <FloatingPostButton onClick={handleOpenComposer} />
      )}

      <Footer currentPage="home" />
    </div>
  );
};
