import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import { Link } from "react-router-dom";
import "./style.css";

export const Screen14 = () => {
  const [mainContentTop, setMainContentTop] = useState(201);

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

  return (
    <div className="screen-14">
      <HeaderContent />

      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px", // フッター高さ
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="frame-227">
          <div className="frame-228">
            <div className="frame-229">
              <div className="frame-230" />
              <div className="frame-231">
                <div className="frame-232">
                  <div className="frame-233">
                    <div className="text-wrapper-121">アカウント名</div>
                    <div className="text-wrapper-122">静岡市</div>
                  </div>
                  <Link to="/profile-edit" className="frame-234">
                    <div className="text-wrapper-123">編集</div>
                  </Link>
                </div>
                <div className="frame-235">
                  <div className="frame-236">
                    <div className="text-wrapper-124-1">00 ポイント(一年間)</div>
                    <div className="text-wrapper-124-2">00 ポイント（通算）</div>
                  </div>
                  <div className="frame-236">
                    <div className="text-wrapper-124-3">00 フォロー</div>
                    <div className="text-wrapper-124-4">00 フォロワー</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-wrapper-125">
              自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介
            </div>
            <div className="frame-237">
              <div className="frame-238">
                <div className="text-wrapper-126-1">開催日時：〇〇試合</div>
                <div className="text-wrapper-126-2">所属チーム：〇〇〇〇チーム</div>
                <div className="text-wrapper-126-3">受賞数：〇回</div>
                <div className="text-wrapper-126-4">バッジ数：〇〇個</div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-246">
          <div className="text-wrapper-129">大会参加履歴</div>
        </div>

        {/* 大会履歴1 */}
        <div className="frame-247">
          <div className="frame-228">
            <div className="frame-248">
              <div className="text-wrapper-127-1">大会名：第15回 〇〇カップ</div>
              <div className="text-wrapper-127-2">開催日時：2025年5月18日（日）</div>
              <div className="text-wrapper-127-3">試合結果：第1位</div>
              <div className="text-wrapper-127-4">獲得ポイント：100P</div>
            </div>
            <div className="frame-249">
              <div className="frame-250">
                <div className="text-wrapper-130">大会概要</div>
              </div>
              <div className="frame-251">
                <div className="frame-252">
                  <div className="heart-8">
                    <img className="vector-38" alt="Vector" src="/img/vector-7.svg" />
                  </div>
                  <div className="text-wrapper-131">10 いいね</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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

      <Footer currentPage="mypage" />
    </div>
  );
};
