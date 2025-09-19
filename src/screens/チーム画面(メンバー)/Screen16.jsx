import React, { useState } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { Link } from "react-router-dom";
import "./style.css";

export const Screen16 = () => {
  const mainContentTop = useHeaderOffset();

  
  return (
    <div className="screen-16">
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
        <div className="frame-600">
          <div className="frame-601">
            <div className="frame-602">
              <div className="frame-603"/>
              <div className="frame-604">
                <div className="frame-605">
                  <div className="frame-606">
                    <div className="text-wrapper-300">〇〇〇〇チーム</div>
                    <div className="text-wrapper-301">静岡市</div>
                  </div>
                </div>
                <div className="frame-608">
                  <div className="frame-609">
                    <div className="text-wrapper-303-1">00 ポイント(一年間)</div>
                    <div className="text-wrapper-303-2">00 ポイント（通算）</div>
                  </div>
                  <div className="frame-610">
                    <div className="text-wrapper-303-3">00 フォロー</div>
                    <div className="text-wrapper-303-4">00 フォロワー</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-wrapper-304">
              自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介自己紹介
            </div>
            <div className="frame-611">
              <div className="frame-612">
                <div className="text-wrapper-305-1">所属メンバー：〇〇人</div>
                <div className="text-wrapper-305-2">チーム代表：〇〇 〇〇</div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-613">
          <div className="text-wrapper-306">本日の参加予定大会</div>
        </div>

        <div className="frame-617">
          <div className="frame-618">
            <div className="frame-619">
              <div className="text-wrapper-307-1">大会名：第15回 〇〇カップ</div>
              <div className="text-wrapper-307-2">開催日時：2025年5月18日（日）</div>
            </div>
            <div className="frame-620">
              <div className="frame-621">
                <div className="text-wrapper-308">エントリーする</div>
              </div>
              <div className="frame-622">
                <div className="frame-623">
                  <div className="text-wrapper-309">エントリー済みメンバー</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-624">
          <div className="text-wrapper-310">参加予定大会</div>
        </div>

        <div className="frame-625">
          <div className="frame-626">
            <div className="frame-627">
              <div className="text-wrapper-311-1">大会名：第15回 〇〇カップ</div>
              <div className="text-wrapper-311-2">開催日時：2025年5月18日（日）</div>
            </div>
            <div className="frame-628">
              <div className="frame-629">
                <Link to="/tournament-result-team" className="frame-38">
                  <div className="text-wrapper-312">大会概要</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="frame-690">
          <div className="frame-691">
            <div className="text-wrapper-390">活動記録</div>
          </div>
          <div className="frame-692">
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
          </div>
        </div>
      </div>

      <Footer currentPage="team-create" />
    </div>
  );
};
