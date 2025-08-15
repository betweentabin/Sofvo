import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen20 = () => {
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
    <div className="screen-20">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {/* エントリー受付中 */}
        <div className="frame-164">
          <div className="text-wrapper-96">大会終了</div>
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

            <div className="frame-84">
              <div className="heart-2">
                    <img className="vector-16" alt="Vector" src="/img/vector-25.svg" />
              </div>
              <div className="text-wrapper-67">10 いいね</div>
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
              <div className="text-wrapper-94-1">試合球：ミカサ</div>
              <div className="text-wrapper-94-2">種別：混合フリー</div>
              <div className="text-wrapper-94-3">競技方法：〇〇〇〇〇〇</div>
              <div className="text-wrapper-94-4">順位方法：〇〇〇〇〇〇</div>
            </div>
          </div>
        </div>

        {/* 大会結果 */}
        <div className="frame-164">
          <div className="text-wrapper-96">大会結果</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="frame-161">
              <div className="text-wrapper-95-1">第〇位：〇〇〇〇〇〇〇〇〇〇〇〇</div>
            </div>
          </div>
        </div>

        {/* 大会結果 */}

        <div className="frame-180">
          <div className="frame-181">

            {/* 1行目 */}
            <div className="row row-1">
              <div className="cell-1">本選</div>
            </div>

            {/* 2行目 */}
            <div className="row row-2" key={2}>
              <div className="sub-row">
                <div className="sub-cell-2-1"></div>
                <div className="sub-cell-2-2">対戦相手</div>
                <div className="sub-cell-2-3">スコア</div>
              </div>
              <div className="cell-2">結果</div>
            </div>

            {/* 3行目 */}
            <div className="row row-3" key={3}>
              <div className="sub-row">
                <div className="sub-cell-3-1">第1試合</div>
                <div className="sub-cell-3-2">〇〇〇〇〇〇〇〇</div>
                <div className="sub-cell-3-3">〇〇-〇〇</div>
              </div>
              <div className="cell-3">〇</div>
            </div>

            {/* 4行目 */}
            <div className="row row-4" key={4}>
              <div className="sub-row">
                <div className="sub-cell-4-1">第2試合</div>
                <div className="sub-cell-4-2">〇〇〇〇〇〇〇〇</div>
                <div className="sub-cell-4-3">〇〇-〇〇</div>
              </div>
              <div className="cell-4">×</div>
            </div>

            {/* 5行目 */}
            <div className="row row-5" key={5}>
              <div className="sub-row">
                <div className="sub-cell-5-1">第3試合</div>
                <div className="sub-cell-5-2">〇〇〇〇〇〇〇〇</div>
                <div className="sub-cell-5-3">〇〇-〇〇</div>
              </div>
              <div className="cell-5">×</div>
            </div>
          </div>
        </div>

        <div className="frame-182">
          <div className="frame-181">
            {/* 1行目 */}
            <div className="row row-6">
              <div className="cell-6">順位決定戦</div>
            </div>

            {/* 2行目 */}
            <div className="row row-7" key={2}>
              <div className="sub-row">
                <div className="sub-cell-7-1"></div>
                <div className="sub-cell-7-2">対戦相手</div>
                <div className="sub-cell-7-3">スコア</div>
              </div>
              <div className="cell-7">結果</div>
            </div>

            {/* 3行目 */}
            <div className="row row-8" key={3}>
              <div className="sub-row">
                <div className="sub-cell-8-1">第1試合</div>
                <div className="sub-cell-8-2">〇〇〇〇〇〇〇〇</div>
                <div className="sub-cell-8-3">〇〇-〇〇</div>
              </div>
              <div className="cell-8">〇</div>
            </div>

            {/* 4行目 */}
            <div className="row row-9" key={4}>
              <div className="sub-row">
                <div className="sub-cell-9-1">第2試合</div>
                <div className="sub-cell-9-2">〇〇〇〇〇〇〇〇</div>
                <div className="sub-cell-9-3">〇〇-〇〇</div>
              </div>
              <div className="cell-9">×</div>
            </div>

            {/* 5行目 */}
            <div className="row row-10" key={5}>
              <div className="sub-row">
                <div className="sub-cell-10-1">第3試合</div>
                <div className="sub-cell-10-2">〇〇〇〇〇〇〇〇</div>
                <div className="sub-cell-10-3">〇〇-〇〇</div>
              </div>
              <div className="cell-10">×</div>
            </div>
          </div>
        </div>

        <Footer currentPage="schedule" />
      </div>
    </div>
  );
};
