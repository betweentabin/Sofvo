import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen13 = () => {
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
    <div className="screen-13">
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
      <div className="screen-13">
        <div className="frame-439">
          <div className="frame-440">

            <div className="frame-466">
              <div className="text-wrapper-226">プロフィールを編集</div>
            </div>

            <div className="frame-441">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">アカウントネーム</div>
                </div>

                <select className="custom-select2">
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <div className="frame-445" />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">年齢</div>
                </div>

                <select className="custom-select2">
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <div className="frame-445" />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">性別</div>
                </div>

                <select className="custom-select2">
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <div className="frame-445" />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">競技歴</div>
                </div>

                <select className="custom-select2">
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <select className="custom-select">
                <option value="year1">1年</option>
                <option value="year2">2年</option>
                <option value="year3">3年</option>
                <option value="year4">4年</option>
              </select>
            </div>
            
            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">所属チーム</div>
                </div>

                <select className="custom-select2">
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <div className="frame-445" />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">活動地域</div>
                </div>

                <select className="custom-select2">
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <div className="frame-445" />
            </div>

            <div className="frame-441">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">自己紹介</div>

                  <div className="text-wrapper-217">*</div>
                </div>

                <div className="frame-444">
                  <div className="text-wrapper-218">公開</div>
                </div>
              </div>

              <div className="frame-462" />
            </div>
          </div>
        </div>

        <div className="frame-463">
          <Link to="/settings" className="frame-464">
            <div className="text-wrapper-224">戻る</div>
          </Link>

          <Link to="/team-manage" className="frame-465">
            <div className="text-wrapper-225">完了</div>
          </Link>
        </div>
      </div>
    </div>
    <Footer currentPage="team-create" />
  </div>
  );
};
