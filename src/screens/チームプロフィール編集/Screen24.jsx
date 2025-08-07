import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen24 = () => {
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
    <div className="screen-24">
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
      <div className="screen-24">
        <div className="frame-439">
          <div className="frame-440">

            <div className="frame-466">
              <div className="text-wrapper-226">チーム作成</div>
            </div>

            <div className="frame-441">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">チーム名</div>

                  <div className="text-wrapper-217">*</div>
                </div>

                <div className="frame-444">
                  <div className="text-wrapper-218">公開</div>
                </div>
              </div>

              <div className="frame-445" />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">活動地域</div>
                  <div className="text-wrapper-217">*</div>
                </div>

                <select className="custom-select2">
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>

              <select className="custom-select">
                <option value="">選択してください</option>
                <option value="shizuoka">静岡市</option>
                <option value="hamamatsu">浜松市</option>
                <option value="fuji">富士市</option>
                <option value="numazu">沼津市</option>
              </select>
            </div>

            <div className="frame-441">
              <div className="frame-448">
                <div className="frame-443">
                  <div className="text-wrapper-216">限定設定</div>

                  <div className="text-wrapper-217">*</div>
                </div>
              </div>

              <div className="frame-449">
                <div className="frame-450">
                  <div className="frame-451">
                    <div className="frame-452" />

                    <div className="frame-453">
                      <div className="text-wrapper-220-1">代表</div>
                    </div>

                    <div className="frame-454">
                      <div className="text-wrapper-220-2">副代表</div>
                    </div>

                    <div className="frame-455">
                      <div className="text-wrapper-220-3">メンバー</div>
                    </div>
                  </div>
                </div>

                <div className="frame-456">
                  <div className="frame-451">
                    <div className="frame-457">
                      <div className="text-wrapper-222">管理者任命</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-459">
                      <div className="text-wrapper-223">〇</div>
                    </div>

                    <div className="frame-460" />
                  </div>
                </div>

                <div className="frame-456">
                  <div className="frame-451">
                    <div className="frame-457">
                      <div className="text-wrapper-222">プロフィール変更</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-459">
                      <div className="text-wrapper-223">●</div>
                    </div>

                    <div className="frame-460" />
                  </div>
                </div>

                <div className="frame-456">
                  <div className="frame-451">
                    <div className="frame-457">
                      <div className="text-wrapper-222">大会エントリー</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-459">
                      <div className="text-wrapper-223">●</div>
                    </div>

                    <div className="frame-460" />
                  </div>
                </div>

                <div className="frame-456">
                  <div className="frame-451">
                    <div className="frame-457">
                      <div className="text-wrapper-222">大会主催</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-459">
                      <div className="text-wrapper-223">●</div>
                    </div>

                    <div className="frame-460" />
                  </div>
                </div>

                <div className="frame-456">
                  <div className="frame-451">
                    <div className="frame-457">
                      <div className="text-wrapper-222">加入承認</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-459">
                      <div className="text-wrapper-223">〇</div>
                    </div>
                  </div>
                </div>

                <div className="frame-461">
                  <div className="frame-451">
                    <div className="frame-457">
                      <div className="text-wrapper-222">メンバー招待</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-458">
                      <div className="text-wrapper-222">●</div>
                    </div>

                    <div className="frame-459">
                      <div className="text-wrapper-223">●</div>
                    </div>
                  </div>
                </div>
              </div>
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
