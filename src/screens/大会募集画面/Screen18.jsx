import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen18 = () => {
  const navigate = useNavigate();
  const [mainContentTop, setMainContentTop] = useState(201);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(10);
  const [entryStatus, setEntryStatus] = useState("not_entered"); // not_entered, entering, entered
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const updateMainContentPosition = () => {
      const header = document.querySelector(".header-content-outer");
      if (header) {
        const headerRect = header.getBoundingClientRect();
        const headerBottom = headerRect.bottom;
        setMainContentTop(headerBottom);
      }
    };

    const timer = setTimeout(updateMainContentPosition, 200);
    window.addEventListener("resize", updateMainContentPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateMainContentPosition);
    };
  }, []);

  // いいねボタンの処理
  const handleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikeCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  // エントリー処理
  const handleEntry = () => {
    if (entryStatus === "entered") {
      alert("既にエントリー済みです");
      return;
    }
    setShowConfirmModal(true);
  };

  // エントリー確認処理
  const confirmEntry = () => {
    setEntryStatus("entering");
    setShowConfirmModal(false);
    
    // デモ用：2秒後にエントリー完了
    setTimeout(() => {
      setEntryStatus("entered");
      alert("エントリーが完了しました！");
    }, 2000);
  };

  // お問い合わせ処理
  const handleInquiry = () => {
    navigate("/contact");
  };

  return (
    <div className="screen-18">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {/* エントリー受付中 */}
        <div className="frame-164">
          <div className="text-wrapper-96">エントリー受付中</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="gray-box"></div>

            <div className="frame-161">
              <div className="text-wrapper-93-1">大会名：第15回 〇〇カップ</div>
              <div className="text-wrapper-93-2">開催日時：2025年5月18日（日）</div>
              <div className="text-wrapper-93-3">開催地域：静岡県</div>
              <div className="text-wrapper-93-4">開催場所：〇〇体育館</div>
              <div className="text-wrapper-93-5">住所：静岡県〇〇市〇〇町1-2-3</div>
              <div className="text-wrapper-93-6">主催者：〇〇〇〇〇〇</div>
            </div>

            <div className="gray-box2"></div>

            <div 
              className="frame-84"
              onClick={handleLike}
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <div className="heart-2" style={{ color: isLiked ? "#ff0066" : "inherit" }}>
                    <img 
                      className="vector-16" 
                      alt="Vector" 
                      src="/img/vector-25.svg" 
                      style={{ filter: isLiked ? "brightness(0) saturate(100%) invert(34%) sepia(82%) saturate(6000%) hue-rotate(330deg) brightness(100%) contrast(101%)" : "none" }}
                    />
              </div>
              <div className="text-wrapper-67">{likeCount} いいね</div>
            </div>

          </div>
        </div>

        {/* スケジュール */}
        <div className="frame-164">
          <div className="text-wrapper-96">スケジュール</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="frame-161">
              <div className="text-wrapper-94-1">8:00　開場</div>
              <div className="text-wrapper-94-2">8:00　代表者会議</div>
              <div className="text-wrapper-94-3">8:00　試合開始</div>
            </div>
          </div>
        </div>

        {/* 概要 */}
        <div className="frame-164">
          <div className="text-wrapper-96">概要</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="frame-161">
              <div className="text-wrapper-95-1">試合球：ミカサ</div>
              <div className="text-wrapper-95-2">種別：混合フリー</div>
              <div className="text-wrapper-95-3">順位方法：〇〇〇〇〇〇</div>
              <div className="frame-170">
                <div className="text-wrapper-93-3">順位方法：</div>
                <div className="text-wrapper-95-5">
                  〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇
                </div>
              </div>
              <div className="frame-170">
                <div className="text-wrapper-96-1">獲得ポイント：</div>
                <div
                  className="text-wrapper-95-6"
                  dangerouslySetInnerHTML={{
                    __html: "1位→100P<br/>2位→80P<br/>3位→70P",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 大会結果 */}
        <div className="frame-164">
          <div className="text-wrapper-96">大会結果</div>
        </div>

        <div className="frame-180-1">
          <div className="frame-181">

            {/* 1行目：横幅いっぱい */}
            <div className="row row-1">
              <div className="cell-1">本選</div>
            </div>

            {/* 2行目：左列は3列分の幅 */}
            <div className="row row-2">
              <div className="cell-span-2">対戦相手</div>
              <div className="cell-2">スコア</div>
            </div>

            {/* 3行目 */}
            <div className="row row-3" key={3}>
              <div className="sub-row">
                <div className="sub-cell-3-1">3-1-1</div>
                <div className="sub-cell-3-2">VS</div>
                <div className="sub-cell-3-3">3-1-3</div>
              </div>
              <div className="cell-3">3-2</div>
            </div>

            {/* 4行目 */}
            <div className="row row-4" key={4}>
              <div className="sub-row">
                <div className="sub-cell-4-1">4-1-1</div>
                <div className="sub-cell-4-2">VS</div>
                <div className="sub-cell-4-3">4-1-3</div>
              </div>
              <div className="cell-4">4-2</div>
            </div>

            {/* 5行目 */}
            <div className="row row-5" key={5}>
              <div className="sub-row">
                <div className="sub-cell-5-1">5-1-1</div>
                <div className="sub-cell-5-2">VS</div>
                <div className="sub-cell-5-3">5-1-3</div>
              </div>
              <div className="cell-5">5-2</div>
            </div>

            {/* 6行目 */}
            <div className="row row-6" key={6}>
              <div className="sub-row">
                <div className="sub-cell-6-1">6-1-1</div>
                <div className="sub-cell-6-2">VS</div>
                <div className="sub-cell-6-3">6-1-3</div>
              </div>
              <div className="cell-6">6-2</div>
            </div>
          </div>
        </div>

        <div className="frame-182">
          <div className="frame-181">
            {/* 1行目：横幅いっぱい */}
            <div className="row row-7">
              <div className="cell-7">予選</div>
            </div>

            {/* 2行目：左列は3列分の幅 */}
            <div className="row row-8">
              <div className="cell-span-8">対戦相手</div>
              <div className="cell-8">スコア</div>
            </div>

            {/* 3行目 */}
            <div className="row row-9" key={3}>
              <div className="sub-row">
                <div className="sub-cell-9-1">3-1-1</div>
                <div className="sub-cell-9-2">VS</div>
                <div className="sub-cell-9-3">3-1-3</div>
              </div>
              <div className="cell-9">3-2</div>
            </div>

            {/* 4行目 */}
            <div className="row row-10" key={4}>
              <div className="sub-row">
                <div className="sub-cell-10-1">4-1-1</div>
                <div className="sub-cell-10-2">VS</div>
                <div className="sub-cell-10-3">4-1-3</div>
              </div>
              <div className="cell-10">4-2</div>
            </div>

            {/* 5行目 */}
            <div className="row row-11" key={5}>
              <div className="sub-row">
                <div className="sub-cell-11-1">5-1-1</div>
                <div className="sub-cell-11-2">VS</div>
                <div className="sub-cell-11-3">5-1-3</div>
              </div>
              <div className="cell-11">5-2</div>
            </div>

            {/* 6行目 */}
            <div className="row row-12" key={6}>
              <div className="sub-row">
                <div className="sub-cell-12-1">6-1-1</div>
                <div className="sub-cell-12-2">VS</div>
                <div className="sub-cell-12-3">6-1-3</div>
              </div>
              <div className="cell-12">6-2</div>
            </div>
          </div>
        </div>

        <div className="frame-309">
          <button 
            onClick={handleEntry}
            className="frame-310"
            style={{ 
              border: "none", 
              cursor: entryStatus === "entering" ? "wait" : "pointer",
              opacity: entryStatus === "entered" ? 0.7 : 1,
              backgroundColor: entryStatus === "entered" ? "#28a745" : ""
            }}
            disabled={entryStatus === "entering"}
          >
            <div className="text-wrapper-206">
              {entryStatus === "not_entered" && "エントリー"}
              {entryStatus === "entering" && "処理中..."}
              {entryStatus === "entered" && "エントリー済み"}
            </div>
          </button>

          <button 
            onClick={handleInquiry}
            className="frame-311"
            style={{ border: "none", cursor: "pointer" }}
          >
            <div className="text-wrapper-207">お問い合わせ</div>
          </button>
        </div>

        {/* エントリー確認モーダル */}
        {showConfirmModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "400px",
              width: "90%"
            }}>
              <h3 style={{ marginBottom: "20px" }}>エントリー確認</h3>
              <p style={{ marginBottom: "30px" }}>
                「第15回 〇〇カップ」にエントリーしますか？
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  キャンセル
                </button>
                <button 
                  onClick={confirmEntry}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "5px",
                    backgroundColor: "#007bff",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  エントリーする
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer currentPage="schedule" />
      </div>
    </div>
  );
};
