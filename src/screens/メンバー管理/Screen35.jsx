import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen35 = () => {
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

  // メンバー配列に showButton を追加
  const members = [
    { name: "山田 太郎（ヤマダ タロウ）", age: 30, gender: "男", history: 5, area: "静岡市", showButton: true },
    { name: "鈴木 花子（スズキ ハナコ）", age: 28, gender: "女", history: 3, area: "浜松市", showButton: true },
    { name: "佐藤 一郎（サトウ イチロウ）", age: 35, gender: "男", history: 10, area: "静岡市", showButton: true },
    { name: "田中 美咲（タナカ ミサキ）", age: 27, gender: "女", history: 4, area: "浜松市", showButton: true },
    { name: "高橋 健（タカハシ ケン）", age: 32, gender: "男", history: 7, area: "静岡市", showButton: true },
    { name: "中村 奈々（ナカムラ ナナ）", age: 29, gender: "女", history: 6, area: "浜松市", showButton: true },
    { name: "小林 翔（コバヤシ ショウ）", age: 31, gender: "男", history: 8, area: "静岡市", showButton: true },
    { name: "松本 さくら（マツモト サクラ）", age: 26, gender: "女", history: 3, area: "浜松市", showButton: true },
    { name: "伊藤 大輔（イトウ ダイスケ）", age: 33, gender: "男", history: 9, area: "静岡市", showButton: true },
    { name: "林 美優（ハヤシ ミユ）", age: 25, gender: "女", history: 2, area: "浜松市", showButton: true },
  ];

  return (
    <div className="screen-35">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        <div className="frame-166">
          <div className="text-wrapper-96-2">メンバー管理</div>
        </div>

        <div className="frame-21">
          <div className="frame-22">
            <div className="frame-23">
              <div className="magnifying-glass-wrapper">
                <div className="magnifying-glass">
                  <img
                    className="search-icon"
                    alt="検索"
                    src="/images/300ppi/検索黒.png"
                  />
                </div>
              </div>
              <div className="text-wrapper-39">大会を検索（チーム参加）</div>
            </div>

            <div className="frame-24">
              <div className="frame-box1">
                <input
                  type="text"
                  id="search-year-month"
                  className="custom-input"
                />
              </div>
            </div>

            <div className="frame-30">
              <div className="text-wrapper-43">検索</div>
            </div>
          </div>
        </div>

        <div className="frame-167">
          <div className="frame-168">
            {members.map((member, index) => (
              <details key={index} className="member-item">
                <summary className="member-name">{member.name}</summary>
                <div className="member-details">
                  <p><strong>年齢：</strong>{member.age}歳</p>
                  <p><strong>性別：</strong>{member.gender}</p>
                  <p><strong>競技歴：</strong>{member.history}年</p>
                  <p><strong>活動地域：</strong>{member.area}</p>
                </div>

                {member.showButton && (
                  <div className="frame-628">
                    <div className="frame-629">
                      <div className="text-wrapper-312">チームから削除</div>
                    </div>
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      </div>

      <Footer currentPage="schedule" />
    </div>
  );
};
