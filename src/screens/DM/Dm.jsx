import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Dm = () => {
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
    <div className="Dm">
      <HeaderContent />
    <div
      className="main-content"
      style={{
        position: "absolute",
        top: `${mainContentTop}px`,
        overflowY: "auto",
        width: "100%",
      }}
    >
      <div className="Dm">

        <div className="frame-270">
          <div className="frame-271">
            <div className="frame-272">
              <div className="frame-273" />
              <div className="text-wrapper-135">アカウント前</div>
            </div>
          </div>
        </div>

        <div className="middle-box">
          {/* メッセージがあればここに表示。なければ空白のまま */}
        </div>

        <div className="frame-274">
          <div className="frame-275">
            <div className="frame-276">
              <div className="frame-277">
                <div className="text-wrapper-136">メッセージを作成</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  );
};
