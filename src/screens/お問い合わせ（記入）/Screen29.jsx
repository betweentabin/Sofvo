import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen29 = () => {
  const mainContentTop = useHeaderOffset();

  // フォーム状態管理
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");

  
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

              {/* ご用件 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">ご用件</div>
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

              {/* お名前 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">お名前</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* フリガナ */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">フリガナ</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="text"
                  value={furigana}
                  onChange={(e) => setFurigana(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* メールアドレス */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">メールアドレス</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 電話番号 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">電話番号</div>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* 内容 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">内容</div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="textarea-field"
                />
              </div>
            </div>
          </div>

          <div className="frame-540">
            <Link to="/settings" className="frame-541">
              <div className="text-wrapper-263">戻る</div>
            </Link>

            <Link
              to="/contact-confirm"
              state={{ subject, name, furigana, email, phone, content }}
              className="frame-542"
            >
              <div className="text-wrapper-264">確認する</div>
            </Link>
          </div>
        </div>
      </div>
      <Footer currentPage="team-create" />
    </div>
  );
};
