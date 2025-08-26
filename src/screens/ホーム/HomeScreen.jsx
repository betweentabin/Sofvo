import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { HeaderTabs } from "../../components/HeaderTabs";
import { HeaderShare } from "../../components/HeaderShare";
import { Footer } from "../../components/Footer";
import "./style.css";

export const HomeScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("following"); // 'following' or 'recommend'
  const [mainContentTop, setMainContentTop] = useState(201);
  const [likedPosts, setLikedPosts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

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

  console.log("HomeScreen - current mainContentTop:", mainContentTop);

  // いいねボタンのハンドラー
  const handleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // 検索ハンドラー
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/tournament-search-team?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="HOME-screen">
      <HeaderContent />
      <HeaderTabs onTabChange={setActiveTab} activeTab={activeTab} />
      <HeaderShare />

      {/* 本文セクション - ヘッダーとフッターの間 */}
      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {activeTab === "following" ? (
          // フォロー中の内容
          <div className="following-content">
            <div className="frame-75">
              <div className="frame-76">
                <div className="frame-77">
                  <div className="frame-78" />
                  <div className="text-wrapper-63">アカウント名</div>
                </div>

                <div className="frame-79">
                  <div className="text-wrapper-65">
                    大会名：第15回 〇〇カップ
                  </div>
                  <div className="text-wrapper-65">
                    開催日時：2025年5月18日（日）
                  </div>
                  <div className="text-wrapper-65">試合結果：第1位</div>
                  <div className="text-wrapper-65">獲得ポイント：100P</div>
                </div>

                <div className="frame-80">
                  <div className="rectangle-4" />
                  <div className="rectangle-4" />
                  <div className="rectangle-4" />
                  <div className="rectangle-4" />
                  <div className="rectangle-4" />
                </div>

                <div className="frame-81">
                  <div className="frame-82" onClick={() => navigate('/tournament-detail')} style={{ cursor: 'pointer' }}>
                    <div className="text-wrapper-66">大会概要</div>
                  </div>

                  <div className="frame-83">
                    <div className="frame-84" 
                         onClick={() => handleLike('post1')}
                         style={{ cursor: 'pointer' }}>
                      <div className="heart-2">
                        <img
                          className="vector-16"
                          alt="Vector"
                          src="/img/vector-25.svg"
                          style={{ filter: likedPosts['post1'] ? 'invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' : 'none' }}
                        />
                      </div>
                      <div className="text-wrapper-67">{likedPosts['post1'] ? '11' : '10'} いいね</div>
                    </div>
                  </div>
                </div>
              </div>
              <img className="img-3" alt="Element" src="/img/2-1.svg" />
            </div>
            {/* 他のフォロー中のコンテンツ... */}
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
                <div className="text-wrapper-77">おすすめの日記</div>
                <div className="text-wrapper-78" onClick={() => navigate('/ads')} style={{ cursor: 'pointer' }}>もっと見る</div>
              </div>

              <div className="activity-items">
                <div className="activity-item">
                  <div className="rectangle-6" />
                  <div className="activity-item-content">
                    <div className="activity-item-header">
                      <div className="frame-117" />
                      <div className="text-wrapper-79">アカウント名</div>
                    </div>
                    <div className="text-wrapper-80-group">
                      <div className="text-wrapper-80 title">第15回 〇〇カップ</div>
                      <div className="text-wrapper-80 date">2025年5月18日（日）</div>
                      <div className="text-wrapper-80 result">試合結果：第1位</div>
                      <div className="text-wrapper-80 points">獲得ポイント：100P</div>
                    </div>
                    <div className="frame-90" onClick={() => navigate('/tournament-detail')} style={{ cursor: 'pointer' }}>
                      <div className="text-wrapper-44">大会概要</div>
                    </div>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="rectangle-6" />
                  <div className="activity-item-content">
                    <div className="activity-item-header">
                      <div className="frame-117" />
                      <div className="text-wrapper-79">アカウント名</div>
                    </div>
                    <div className="text-wrapper-80-group">
                      <div className="text-wrapper-80 title">第15回 〇〇カップ</div>
                      <div className="text-wrapper-80 date">2025年5月18日（日）</div>
                      <div className="text-wrapper-80 result">試合結果：第1位</div>
                      <div className="text-wrapper-80 points">獲得ポイント：100P</div>
                    </div>
                    <div className="frame-90" onClick={() => navigate('/tournament-detail')} style={{ cursor: 'pointer' }}>
                      <div className="text-wrapper-44">大会概要</div>
                    </div>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="rectangle-6" />
                  <div className="activity-item-content">
                    <div className="activity-item-header">
                      <div className="frame-117" />
                      <div className="text-wrapper-79">アカウント名</div>
                    </div>
                    <div className="text-wrapper-80-group">
                      <div className="text-wrapper-80 title">第15回 〇〇カップ</div>
                      <div className="text-wrapper-80 date">2025年5月18日（日）</div>
                      <div className="text-wrapper-80 result">試合結果：第1位</div>
                      <div className="text-wrapper-80 points">獲得ポイント：100P</div>
                    </div>
                    <div className="frame-90" onClick={() => navigate('/tournament-detail')} style={{ cursor: 'pointer' }}>
                      <div className="text-wrapper-44">大会概要</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            <div className="recommend-section">
              <div className="recommend-header">
                <div className="text-wrapper-77">おすすめの日記</div>
                <div className="text-wrapper-78" onClick={() => navigate('/ads')} style={{ cursor: 'pointer' }}>もっと見る</div>
              </div>

              <div className="recommend-items">
                <div className="recommend-item">
                  <div className="rectangle-6" />
                  <div className="recommend-item-content">
                    <div className="recommend-item-header">
                      <div className="frame-117" />
                      <div className="text-wrapper-79">アカウント名</div>
                    </div>
                    <div className="text-wrapper-80">
                      コメントコメントコメントコメントコメントコメントコメントコメントコメントコメントコメント
                    </div>
                  </div>
                </div>

                <div className="recommend-item">
                  <div className="rectangle-6" />
                  <div className="recommend-item-content">
                    <div className="recommend-item-header">
                      <div className="frame-117" />
                      <div className="text-wrapper-79">アカウント名</div>
                    </div>
                    <div className="text-wrapper-80">
                      コメントコメントコメントコメントコメントコメントコメントコメントコメントコメントコメント
                    </div>
                  </div>
                </div>

                <div className="recommend-item">
                  <div className="rectangle-6" />
                  <div className="recommend-item-content">
                    <div className="recommend-item-header">
                      <div className="frame-117" />
                      <div className="text-wrapper-79">アカウント名</div>
                    </div>
                    <div className="text-wrapper-80">
                      コメントコメントコメントコメントコメントコメントコメントコメントコメントコメントコメント
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      

      <Footer currentPage="home" />
    </div>
  );
};
