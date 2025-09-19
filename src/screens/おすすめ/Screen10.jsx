import React, { useState } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen10 = () => {
  const mainContentTop = useHeaderOffset();

  
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
