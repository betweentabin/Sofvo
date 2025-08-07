import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen11 = () => {
  const [mainContentTop, setMainContentTop] = useState(201);

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

  return (
    <div className="screen-11">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
  <div className="frame-164">
    <div className="text-wrapper-96">本日の大会</div>
  </div>

  <div className="frame-159">
    <div className="frame-160">
      <div className="frame-161">
        <div className="text-wrapper-93-1">大会名：第15回 〇〇カップ</div>
        <div className="text-wrapper-93-2">開催日時：2025年5月18日（日）</div>
        <div className="text-wrapper-93-3">チーム名：〇〇〇〇チーム</div>
      </div>

      <div className="frame-151">
        <div className="frame-162-1">
          <div className="text-wrapper-92">大会概要</div>
        </div>

        <div className="frame-163">
          <div className="text-wrapper-95">チェックインを取り消す</div>
        </div>
      </div>
    </div>
  </div>

  <div className="frame-166">
    <div className="text-wrapper-96-2">参加予定の大会</div>
  </div>

　<div className="frame-21">
    <div className="frame-22">
      <div className="frame-23">
        <div className="magnifying-glass-wrapper">
          <div className="magnifying-glass">
            <img className="search-icon" alt="検索" src="/images/300ppi/検索黒.png" />
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

        <div className="frame-box3">
          <label className="dropdown-label" htmlFor="select-area">地域</label>
          <select id="select-area" className="custom-select">
            <option>静岡県</option>
            <option>東京都</option>
            <option>大阪府</option>
          </select>
        </div>
      </div>


      <div className="frame-29">
        <input type="checkbox" id="follow-checkbox" className="rectangle-3" />
        <label htmlFor="follow-checkbox" className="text-wrapper-42">フォロー中</label>
      </div>


      <div className="frame-30">
        <div className="text-wrapper-43">検索</div>
      </div>
    </div>
  </div>



  <div className="frame-167">
    <div className="frame-160-1">
      <div className="frame-168">
        <div className="text-wrapper-89">第15回 〇〇カップ</div>
        <div className="frame-169">
          <div className="frame-35">
            <div className="text-wrapper-95-2">レディース</div>
          </div>
        </div>
      </div>

      <div className="frame-170">
        <div className="text-wrapper-94-1">開催日時：2025年5月18日（日）</div>
        <div className="text-wrapper-94-2">開催地：静岡県掛川市</div>
        <div className="text-wrapper-94-3">チーム名：〇〇〇〇チーム</div>
        <div className="text-wrapper-94-4">大会参加費：5,000円</div>
      </div>

      <div className="frame-171">
        <div className="frame-162-2">
          <div className="text-wrapper-92-1">大会概要</div>
        </div>
        <div className="frame-162-3">
          <div className="text-wrapper-92-2">大会エントリーをキャンセル</div>
        </div>
        <div className="frame-162-4">
          <div className="text-wrapper-92-3">個人エントリーをキャンセル</div>
        </div>
      </div>
    </div>
  </div>
</div>



      <Footer currentPage="schedule" />
    </div>
  );
};
