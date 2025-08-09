import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen30 = () => {
  const [mainContentTop, setMainContentTop] = useState(0);

  // 4つのトグル状態を個別管理
  const [isOn1, setIsOn1] = useState(false);
  const [isOn2, setIsOn2] = useState(false);
  const [isOn3, setIsOn3] = useState(false);
  const [isOn4, setIsOn4] = useState(false);

  // トグル関数もそれぞれ作る
  const toggle1 = () => setIsOn1(prev => !prev);
  const toggle2 = () => setIsOn2(prev => !prev);
  const toggle3 = () => setIsOn3(prev => !prev);
  const toggle4 = () => setIsOn4(prev => !prev);

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
    <div className="screen-30">
      <HeaderContent />
      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="screen-30">
          <div className="frame-439">
            <div className="frame-440">
              <div className="frame-466">
                <div className="text-wrapper-226">通知設定</div>
              </div>

              <div className="frame-441">
                {/* 4つの設定項目 */}
                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">お知らせ</div>
                  </div>
                  <button
                    className={`toggle-switch ${isOn1 ? "on" : "off"}`}
                    onClick={toggle1}
                    aria-pressed={isOn1}
                    aria-label="アカウントネームの通知設定"
                    type="button"
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>

                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">大会開催通知</div>
                  </div>
                  <button
                    className={`toggle-switch ${isOn2 ? "on" : "off"}`}
                    onClick={toggle2}
                    aria-pressed={isOn2}
                    aria-label="メール通知設定"
                    type="button"
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>

                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">いいね大会の募集期限</div>
                  </div>
                  <button
                    className={`toggle-switch ${isOn3 ? "on" : "off"}`}
                    onClick={toggle3}
                    aria-pressed={isOn3}
                    aria-label="プッシュ通知設定"
                    type="button"
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>

                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">ニュースの受け取り</div>
                  </div>
                  <button
                    className={`toggle-switch ${isOn4 ? "on" : "off"}`}
                    onClick={toggle4}
                    aria-pressed={isOn4}
                    aria-label="サウンド通知設定"
                    type="button"
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer currentPage="team-create" />
    </div>
  );
};
