import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { HeaderTabs } from "../../components/HeaderTabs";
import { Footer } from "../../components/Footer";
import { FloatingPostButton } from "../../components/FloatingPostButton";
import { PostComposer } from "../../components/PostComposer";
import PostCard from "../../components/PostCard";
// Supabase removed: Railway-only
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

const TIMELINE_LIMIT = 50;

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < 0) {
    return date.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  if (diff < minute) {
    const seconds = Math.max(0, Math.floor(diff / 1000));
    return `${seconds}秒前`;
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}時間前`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}日前`;
  }
  return date.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const resolveDisplayName = (profile) => profile?.display_name || profile?.username || "アカウント名";

const resolveAvatarInitial = (profile) => {
  const name = resolveDisplayName(profile);
  return name.trim().charAt(0).toUpperCase() || "S";
};

export const HomeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("following"); // 'following' or 'recommend'
  const mainContentTop = useHeaderOffset();
  const [likedPosts, setLikedPosts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [followingPosts, setFollowingPosts] = useState([]);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [recommendedDiaries, setRecommendedDiaries] = useState([]);
  const [timelinePosts, setTimelinePosts] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCreatedPosts, setUserCreatedPosts] = useState([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false); // tournament composer (existing)
  const [isQuickComposerOpen, setIsQuickComposerOpen] = useState(false); // simple post composer
  const [quickContent, setQuickContent] = useState('');
  const [quickFile, setQuickFile] = useState(null);
  const USE_RAILWAY = true;
  const RUNTIME = typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {};
  const RAILWAY_TEST_USER = RUNTIME.testUserId || import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;
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

  // Fetch following posts
  const fetchFollowingPosts = async () => {
    if (!user) return;

    try {
      const asUserId = RAILWAY_TEST_USER || user.id;
      const { data } = await api.railwayHome.getFollowing(asUserId, 10);
      setFollowingPosts(data || []);
    } catch (error) {
      console.error('Error fetching following posts:', error);
      setFollowingPosts([]);
    }
  };

  // Fetch recommended posts (latest tournament results)
  const fetchRecommendedPosts = async () => {
    try {
      const { data } = await api.railwayHome.getRecommended(10);
      setRecommendedPosts(data || []);
    } catch (error) {
      console.error('Error fetching recommended posts:', error);
      setRecommendedPosts([]);
    }
  };

  // Fetch recommended diaries (placeholder for now - could be a future feature)
  const fetchRecommendedDiaries = async () => {
    try {
      const { data } = await api.railwayHome.getRecommendedDiaries(3);
      setRecommendedDiaries(data || []);
    } catch (error) {
      console.error('Error fetching recommended diaries:', error);
      setRecommendedDiaries([]);
    }
  };

  useEffect(() => {
    let isActive = true;
    const loadTimeline = async () => {
      setTimelineLoading(true);
      try {
        const { data } = await api.railwayPosts.latest(30);
        if (isActive) setTimelinePosts(data || []);
      } catch (error) {
        if (isActive) {
          console.error('Error loading timeline posts:', error);
          setTimelinePosts([]);
        }
      } finally {
        if (isActive) setTimelineLoading(false);
      }
    };
    loadTimeline();
    return () => { isActive = false; };
  }, []);

  // Realtime for posts is disabled (SSE not implemented for posts)

  
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

  // いいねボタンのハンドラー
  const handleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
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


  const openQuickComposer = () => setIsQuickComposerOpen(true);
  const closeQuickComposer = () => setIsQuickComposerOpen(false);

  const handleQuickPostSubmit = async (text, file = null) => {
    if (!user?.id) {
      alert('ログインが必要です');
      return;
    }
    try {
      const asUserId = RAILWAY_TEST_USER || user.id;
      let fileUrl = null;
      if (file) {
        try {
          const up = await api.media.upload(file, 'image');
          fileUrl = up?.data?.url || null;
        } catch (e) {
          console.error('Image upload failed:', e);
        }
      }
      const { data: newPost } = await api.railwayPosts.create(asUserId, text, 'public', fileUrl || null);
      setTimelinePosts((prev) => {
        const filtered = prev.filter((post) => post.id !== newPost.id);
        return [newPost, ...filtered].slice(0, TIMELINE_LIMIT);
      });
    } catch (error) {
      console.error('Error creating post:', error);
      if (true) {
        const fallbackPost = {
          id: `local-${Date.now()}`,
          content: text,
          created_at: new Date().toISOString(),
          profiles: {
            display_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'あなた',
            username: user?.email || 'あなた',
            avatar_url: user?.user_metadata?.avatar_url || null,
          },
          isLocal: true,
        };

        setTimelinePosts((prev) => [fallbackPost, ...prev].slice(0, TIMELINE_LIMIT));
        if (!USE_RAILWAY) alert('投稿テーブルがまだセットアップされていないためローカル表示のみ行いました。\nSupabaseのSQLエディタでpostsテーブルを作成してください。');
        return;
      }

      alert('投稿に失敗しました');
    }
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

      {/* 本文セクション - ヘッダーとフッターの間 */}
      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {activeTab === "following" ? (
          // フォロー中の内容
          <div className="following-content">
            <div className="quick-post-section">
              <div className="quick-post-section-header">
                <div className="quick-post-title">みんなの投稿</div>
                <button type="button" className="quick-post-action" onClick={openQuickComposer}>
                  いま投稿する
                </button>
              </div>
              {isQuickComposerOpen && (
                <div className="frame-75 home-post-composer">
                  <form className="frame-76 home-post-composer-form" onSubmit={(e) => { e.preventDefault(); /* handled below */ }}>
                    <div className="home-post-composer-header">
                      <div className="frame-77">
                        <div className="frame-78" />
                        <div className="text-wrapper-63">{user?.email?.split('@')[0] || 'あなた'}</div>
                      </div>
                      <button type="button" className="home-post-composer-close" onClick={() => { setQuickContent(''); setQuickFile(null); closeQuickComposer(); }}>
                        閉じる
                      </button>
                    </div>
                    <div className="frame-79 home-post-composer-body">
                      <label className="composer-label">
                        <textarea
                          className="home-post-textarea"
                          rows={3}
                          value={quickContent}
                          onChange={(e) => setQuickContent(e.target.value)}
                          placeholder="いまどうしてる？（テキスト）"
                        />
                      </label>
                      <div className="home-post-inline">
                        <label className="composer-label">
                          <span style={{ fontSize: 12, color: '#7a8ca5' }}>画像（任意）</span>
                          <input type="file" accept="image/*" className="home-post-input" onChange={(e) => setQuickFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      {quickFile && (
                        <div className="quick-post-image-wrap">
                          <img src={URL.createObjectURL(quickFile)} alt="プレビュー" className="quick-post-image" />
                        </div>
                      )}
                    </div>
                    <div className="home-post-composer-actions">
                      <button type="button" className="home-post-cancel" onClick={() => { setQuickContent(''); setQuickFile(null); closeQuickComposer(); }}>
                        キャンセル
                      </button>
                      <div className="home-post-submit">
                        <div
                          className="frame-82"
                          onClick={async () => {
                            if (!quickContent.trim()) return;
                            await handleQuickPostSubmit(quickContent.trim(), quickFile);
                            setQuickContent(''); setQuickFile(null); closeQuickComposer();
                          }}
                          style={{ cursor: quickContent.trim() ? 'pointer' : 'not-allowed', opacity: quickContent.trim() ? 1 : 0.6 }}
                        >
                          <div className="text-wrapper-66">投稿する</div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}
                {timelineLoading ? (
                  <div className="quick-post-message">読み込み中...</div>
                ) : timelinePosts.length > 0 ? (
                  <div className="quick-post-list">
                    {timelinePosts.map((post) => (
                      <PostCard key={post.id} post={post} liked={!!likedPosts[post.id]} onLike={() => handleLike(post.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="quick-post-empty">
                    まだ投稿がありません。
                    <button type="button" className="quick-post-inline-action" onClick={openQuickComposer}>
                      最初の投稿をする
                    </button>
                  </div>
                )}
              </div>

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
            ) : [...userCreatedPosts, ...followingPosts].length > 0 ? (
              [...userCreatedPosts, ...followingPosts].map((post) => (
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
                  大会を検索
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
                    onKeyDown={(e) => {
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
                ) : recommendedPosts.length > 0 ? (
                  recommendedPosts.slice(0, 3).map((post) => (
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
                    <div
                      className="recommend-item"
                      key={diary.id}
                      onClick={() => navigate(`/profile/${diary.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
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
        <FloatingPostButton onClick={openQuickComposer} />
      )}

      {/* 旧ボトムシートコンポーザは非表示に切替（カードUIへ統一） */}

      <Footer currentPage="home" />
    </div>
  );
};
