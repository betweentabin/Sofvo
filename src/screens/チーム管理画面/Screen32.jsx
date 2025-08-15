import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen32 = () => {
  const [mainContentTop, setMainContentTop] = useState(0);

  useEffect(() => {
    const updateMainContentPosition = () => {
      const header = document.querySelector(".header-content-outer");
      if (header) {
        const rect = header.getBoundingClientRect();
        setMainContentTop(rect.bottom);
      }
    };

    setTimeout(updateMainContentPosition, 200);
    window.addEventListener("resize", updateMainContentPosition);
    return () => window.removeEventListener("resize", updateMainContentPosition);
  }, []);

  return (
    <div className="screen-32">
      <HeaderContent />

      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px", // フッターの高さ
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="frame-351">
          <div className="text-wrapper-179">チーム管理画面</div>
        </div>

        <div className="frame-350">
          <Link to="/team-create" className="text-wrapper-178">・チームプロフィールを編集する</Link>
          <Link to="/member-manage" className="text-wrapper-178">・メンバー管理</Link>
          <Link to="/tournament-host-manage" className="text-wrapper-178">・主催大会管理</Link>
          <Link to="/tournament-host" className="text-wrapper-178">・大会を主催する</Link>
          <Link to="/team-disband" className="text-wrapper-178">・チームを解散する</Link>
        </div>


        
      </div>

      <Footer currentPage="settings" />
    </div>
  );
};
