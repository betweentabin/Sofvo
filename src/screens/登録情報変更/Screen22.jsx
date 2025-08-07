import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen22 = () => {
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
    <div className="screen-22">
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

      <div className="screen-22">
        <div className="frame-415">
          <div className="frame-416">

          <div className="frame-422">
          <div className="text-wrapper-207">登録情報変更</div>
          </div>

            <div className="frame-417">
              <div className="frame-418">
                <div className="text-wrapper-205">現在のメールアドレス</div>
              </div>
              <div className="frame-419" />
            </div>

            <div className="frame-417">
              <div className="frame-418">
                <div className="text-wrapper-205">新しいメールアドレス</div>
              </div>
              <div className="frame-419" />
            </div>

            <div className="frame-417">
              <div className="frame-418">
                <div className="text-wrapper-205">現在の携帯電話番号</div>
              </div>
              <div className="frame-419" />
            </div>

            <div className="frame-417">
              <div className="frame-418">
                <div className="text-wrapper-205">新しい携帯電話番号</div>
              </div>
              <div className="frame-419" />
            </div>

            <div className="frame-417">
              <div className="frame-418">
                <div className="text-wrapper-205">現在のパスワード</div>
              </div>
              <div className="frame-419" />
              <div className="text-wrapper-206">
                8桁半角英数字で入力してください。
              </div>
            </div>

            <div className="frame-417">
              <div className="frame-418">
                <div className="text-wrapper-205">新しいパスワード</div>
              </div>
              <div className="frame-419" />
              <div className="text-wrapper-206">
                8桁半角英数字で入力してください。
              </div>
            </div>

            <div className="frame-417">
              <div className="frame-418">
                <div className="text-wrapper-205">新しいパスワード再入力</div>
              </div>
              <div className="frame-419" />
              <div className="text-wrapper-206">
                8桁半角英数字で入力してください。
              </div>
            </div>
          </div>
        </div>

        <div className="frame-427">
          <Link to="/settings" className="frame-428">
            <div className="text-wrapper-209">戻る</div>
          </Link>

          <Link to="/settings" className="frame-429">
            <div className="text-wrapper-210">保存</div>
          </Link>
        </div>
      </div>
    </div>
    <Footer currentPage="team-create" />
  </div>
  );
};
