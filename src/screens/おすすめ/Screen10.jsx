import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen10 = () => {
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
    <div className="screen-10">
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
        <div className="frame-133">
          <div className="frame-134">
            <div className="frame-135">
              <div className="frame-136" />
              <div className="text-wrapper-85">企業名</div>
            </div>
            <div className="text-wrapper-86">広告</div>
          </div>

          <div className="rectangle-7" />

          <div className="frame-137">
            <div className="frame-138">
              <div className="frame-139">
                <div className="heart-4">
                  <img className="vector-24" alt="Vector" src="/img/1001.png" />
                </div>
                <div className="text-wrapper-87">10 いいね</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer currentPage="recommend" />
    </div>
  );
};
