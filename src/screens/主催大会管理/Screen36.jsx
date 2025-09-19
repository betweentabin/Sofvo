import React, { useState } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen36 = () => {
  const mainContentTop = useHeaderOffset();

  
  const tournaments = [
    { name: "第15回 〇〇カップ", date: "2025年5月18日（日）", region: "静岡県", place: "〇〇体育館", address: "静岡県〇〇市〇〇町1-2-3", ball: "ミカサ", type: "混合フリー", method: "〇〇〇〇〇〇", ranking: "〇〇〇〇〇〇", showButton: true },
    { name: "第16回 △△大会", date: "2025年6月10日（火）", region: "静岡県", place: "△△アリーナ", address: "静岡県△△市△△町4-5-6", ball: "モルテン", type: "男子6人制", method: "予選リーグ＋決勝トーナメント", ranking: "勝率→得失点差", showButton: true },
    { name: "第17回 ××カップ", date: "2025年7月5日（土）", region: "東京都", place: "××ドーム", address: "東京都××区××1-2-3", ball: "モルテン", type: "女子6人制", method: "リーグ戦", ranking: "勝率→得失点差", showButton: true },
    { name: "第18回 ◎◎大会", date: "2025年8月20日（水）", region: "大阪府", place: "◎◎体育館", address: "大阪府◎◎市◎◎町4-5-6", ball: "ミカサ", type: "混合フリー", method: "トーナメント戦", ranking: "勝率→得失点差", showButton: true },
    { name: "第19回 □□カップ", date: "2025年9月15日（日）", region: "愛知県", place: "□□アリーナ", address: "愛知県□□市□□町7-8-9", ball: "モルテン", type: "男子6人制", method: "予選リーグ＋決勝トーナメント", ranking: "勝率→得失点差", showButton: true }
  ];

  return (
    <div className="screen-36">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        <div className="frame-166">
          <div className="text-wrapper-96-2">大会管理</div>
        </div>

        {/* 検索バー部分はそのまま */}
        <div className="frame-21">
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
              <div className="text-wrapper-39">大会を検索（チーム参加）</div>
            </div>

            <div className="frame-24">
              <div className="frame-box1">
                <label className="dropdown-label" htmlFor="select-year-month">年月</label>
                <select id="select-year-month" className="custom-select">
                  <option>2025年5月</option>
                  <option>2025年6月</option>
                  <option>2025年7月</option>
                </select>
              </div>

              <div className="frame-box2">
                <label className="dropdown-label" htmlFor="select-day">日</label>
                <select id="select-day" className="custom-select">
                  <option>18日</option>
                  <option>19日</option>
                  <option>20日</option>
                </select>
              </div>
            </div>

            <div className="frame-30">
              <div className="text-wrapper-43">検索</div>
            </div>
          </div>
        </div>

        {/* 大会リスト部分 */}
        <div className="frame-167">
          <div className="frame-168">
            {tournaments.map((tournament, index) => (
              <details key={index} className="tournament-item">
                <summary className="tournament-name">{tournament.name}</summary>
                <div className="tournament-details">
                  <p><strong>開催日時：</strong>{tournament.date}</p>
                  <p><strong>開催地域：</strong>{tournament.region}</p>
                  <p><strong>開催場所：</strong>{tournament.place}</p>
                  <p><strong>住所：</strong>{tournament.address}</p>
                  <div className="custom-hr" />
                  <p><strong>試合球：</strong>{tournament.ball}</p>
                  <p><strong>種別：</strong>{tournament.type}</p>
                  <p><strong>競技方法：</strong>{tournament.method}</p>
                  <p><strong>順位方法：</strong>{tournament.ranking}</p>
                </div>

                {tournament.showButton && (
                  <div className="frame-628" style={{ display: "flex", gap: "10px" }}>
                    <div className="frame-631">
                      <div className="text-wrapper-312">編集</div>
                    </div>
                    <div className="frame-629">
                      <div className="text-wrapper-312">削除</div>
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
