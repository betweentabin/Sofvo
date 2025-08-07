import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { HeaderTabs } from "../../components/HeaderTabs";
import { HeaderShare } from "../../components/HeaderShare";
import { Footer } from "../../components/Footer";
import "./style.css";

export const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState('following'); // 'following' or 'recommend'
  const [mainContentTop, setMainContentTop] = useState(201);

  useEffect(() => {
    const updateMainContentPosition = () => {
      const headerShare = document.querySelector('.header-share-outer');
      if (headerShare) {
        const headerShareRect = headerShare.getBoundingClientRect();
        const headerShareBottom = headerShareRect.bottom;
        console.log('HomeScreen - headerShareRect:', headerShareRect);
        console.log('HomeScreen - headerShareBottom:', headerShareBottom);
        setMainContentTop(headerShareBottom);
      } else {
        console.log('HomeScreen - header-share-outer not found');
      }
    };

    // 少し遅延させてDOMが完全に読み込まれてから実行
    const timer = setTimeout(updateMainContentPosition, 200);
    window.addEventListener('resize', updateMainContentPosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateMainContentPosition);
    };
  }, []);

  console.log('HomeScreen - current mainContentTop:', mainContentTop);

  return (
    <div className="HOME-screen">
      <HeaderContent />
      <HeaderTabs onTabChange={setActiveTab} activeTab={activeTab} />
      <HeaderShare />
      
      {/* 本文セクション - ヘッダーとフッターの間 */}
      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {activeTab === 'following' ? (
          // フォロー中の内容
          <div className="following-content">
        <div className="frame-75">
          <div className="frame-76">
            <div className="frame-77">
              <div className="frame-78" />
              <div className="text-wrapper-63">アカウント名</div>
            </div>

            <div className="frame-79">
              <div className="text-wrapper-65">大会名：第15回 〇〇カップ</div>
                  <div className="text-wrapper-65">開催日時：2025年5月18日（日）</div>
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
              <div className="frame-82">
                <div className="text-wrapper-66">大会概要</div>
              </div>

              <div className="frame-83">
                <div className="frame-84">
                  <div className="heart-2">
                        <img className="vector-16" alt="Vector" src="/img/vector-25.svg" />
                  </div>
                  <div className="text-wrapper-67">10 いいね</div>
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
            <div className="recommend-section">
              <div className="recommend-header">
                <div className="text-wrapper-77">おすすめの日記</div>
                <div className="text-wrapper-78">もっと見る</div>
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
