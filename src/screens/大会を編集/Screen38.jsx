import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import api from "../../services/api";
import "./style.css";

export const Screen38 = () => {
  const location = useLocation();
  const formData = location.state || {};
  const navigate = useNavigate();

  const mainContentTop = useHeaderOffset();

  
  // プレースホルダー表示用コンポーネント
  const PlaceholderText = ({ value, placeholder }) => {
    if (value && value.trim() !== "") {
      return <>{value}</>;
    }
    return <span className="placeholder-text">{placeholder}</span>;
  };

  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await api.contact.send({
        subject: formData.subject || "",
        name: formData.name || "",
        furigana: formData.furigana || "",
        email: formData.email || "",
        phone: formData.phone || "",
        content: formData.content || "",
      });
      navigate('/contact-complete');
    } catch (e) {
      console.error('Failed to send contact form:', e);
      alert('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="screen-38">
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
        <div className="screen-38">
          <div className="frame-532">
            <div className="frame-533">
              <div className="frame-543">
                <div className="text-wrapper-265">お問い合わせ</div>
              </div>

              <p className="div-10">
                <span className="text-wrapper-257">① お客様情報の入力</span>
                <span className="text-wrapper-258"> - </span>
                <span
                  className="text-wrapper-259"
                  style={{ fontWeight: "bold", color: "#1a1a1a" }}
                >
                  ② 記入内容のご確認
                </span>
                <span className="text-wrapper-258"> - </span>
                <span className="text-wrapper-259">③ 完了</span>
              </p>

              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">ご用件</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <div className="frame-538">
                  <PlaceholderText value={formData.subject} placeholder="未選択" />
                </div>
              </div>

              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">お名前</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <div className="frame-538">
                  <PlaceholderText value={formData.name} placeholder="未入力" />
                </div>
              </div>

              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">フリガナ</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <div className="frame-538">
                  <PlaceholderText value={formData.furigana} placeholder="未入力" />
                </div>
              </div>

              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">メールアドレス</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <div className="frame-538">
                  <PlaceholderText value={formData.email} placeholder="未入力" />
                </div>
              </div>

              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">電話番号</div>
                </div>
                <div className="frame-538">
                  <PlaceholderText value={formData.phone} placeholder="未入力" />
                </div>
              </div>

              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">内容</div>
                </div>
                <div className="frame-539" style={{ whiteSpace: "pre-wrap" }}>
                  <PlaceholderText value={formData.content} placeholder="未入力" />
                </div>
              </div>
            </div>
          </div>

          <div className="frame-540">
            <Link to="/contact" state={formData} className="frame-541">
              <div className="text-wrapper-263">戻る</div>
            </Link>

            <button
              onClick={handleSend}
              className="frame-542"
              style={{ border: 'none', cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.7 : 1 }}
              disabled={sending}
              type="button"
            >
              <div className="text-wrapper-264">{sending ? '送信中...' : '送信する'}</div>
            </button>
          </div>
        </div>
      </div>
      <Footer currentPage="team-create" />
    </div>
  );
};
