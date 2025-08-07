import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen29 = () => {
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
    <div className="screen-29">
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

      <div className="screen-29">
        <div className="frame-532">
          <div className="frame-533">

            <div className="frame-543">
              <div className="text-wrapper-265">お問い合わせ</div>
            </div>

            <p className="div-10">
              <span className="text-wrapper-257">① お客様情報の入力</span>

              <span className="text-wrapper-258"> - </span>

              <span className="text-wrapper-259">② 記入内容のご確認</span>

              <span className="text-wrapper-258"> - </span>

              <span className="text-wrapper-259">③ 完了</span>
            </p>

            <div className="frame-535">
              <div className="frame-536">
                <div className="text-wrapper-260">ご用件</div>
                <div className="text-wrapper-261">*</div>
              </div>

              <select className="custom-select">
                <option value="">選択してください</option>
                <option value="account">アカウントについて</option>
                <option value="payment">お支払いについて</option>
                <option value="bug">不具合の報告</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div className="frame-535">
              <div className="frame-536">
                <div className="text-wrapper-260">お名前</div>

                <div className="text-wrapper-261">*</div>
              </div>

              <div className="frame-538" />
            </div>

            <div className="frame-535">
              <div className="frame-536">
                <div className="text-wrapper-260">フリガナ</div>

                <div className="text-wrapper-261">*</div>
              </div>

              <div className="frame-538" />
            </div>

            <div className="frame-535">
              <div className="frame-536">
                <div className="text-wrapper-260">メールアドレス</div>

                <div className="text-wrapper-261">*</div>
              </div>

              <div className="frame-538" />
            </div>

            <div className="frame-535">
              <div className="frame-536">
                <div className="text-wrapper-260">電話番号</div>
              </div>

              <div className="frame-538" />
            </div>

            <div className="frame-535">
              <div className="frame-536">
                <div className="text-wrapper-260">内容</div>
              </div>

              <div className="frame-539" />
            </div>
          </div>
        </div>

        <div className="frame-540">
          <Link to="/settings" className="frame-541">
            <div className="text-wrapper-263">戻る</div>
          </Link>

          <Link to="/contact-confirm" className="frame-542">
            <div className="text-wrapper-264">確認する</div>
          </Link>
        </div>
      </div>
    </div>
    <Footer currentPage="team-create" />
  </div>
  );
};
