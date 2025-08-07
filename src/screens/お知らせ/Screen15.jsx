import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen15 = () => {
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
    <div className="screen-15">
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
      <div className="screen-15">
        <div className="frame-259">
          <div className="frame-261">

            <div className="frame-262">
              <div className="text-wrapper-134">通知</div>
            </div>

            <div className="frame-260">
              <div className="frame-257">
                <div className="frame-263">
                  <div className="frame-264" />

                  <div className="text-wrapper-135">Sofvo公式</div>
                </div>

                <div className="text-wrapper-136">1時間</div>
              </div>

              <div className="text-wrapper-137">
                お知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせお知らせ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer currentPage="notifications" />
  </div>
  );
};
