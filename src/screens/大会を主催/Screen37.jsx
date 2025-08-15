import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen37 = () => {
  const [mainContentTop, setMainContentTop] = useState(0);

  // フォーム状態管理
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");

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
    <div className="screen-37">
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
        <div className="screen-37">
          <div className="frame-532">
            <div className="frame-533">

              <div className="frame-466">
                <div className="text-wrapper-226">プロフィールを編集</div>
              </div>


              {/* 大会名 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">大会名</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 開催日時 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">開催日時</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="text"
                  value={furigana}
                  onChange={(e) => setFurigana(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 開催地域 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">開催地域</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <select
                  className="custom-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">選択してください</option>
                  <option value="アカウントについて">アカウントについて</option>
                  <option value="お支払いについて">お支払いについて</option>
                  <option value="不具合の報告">不具合の報告</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              {/* 開催場所 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">開催場所</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 住所 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">住所</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 試合球 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">試合球</div>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 種別 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">種別</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 競技方法 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">競技方法</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 順位方法 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">順位方法</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

            </div>
          </div>

          <div className="frame-540">
            <Link to="/team-management" className="frame-541">
              <div className="text-wrapper-263">戻る</div>
            </Link>

            <Link
              to="/contact-confirm"
              state={{ subject, name, furigana, email, phone, content }}
              className="frame-542"
            >
              <div className="text-wrapper-264">完了</div>
            </Link>
          </div>
        </div>
      </div>
      <Footer currentPage="team-create" />
    </div>
  );
};
