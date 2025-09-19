import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen27 = () => {
  const mainContentTop = useHeaderOffset();

  // フォーム状態管理
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");

  
  return (
    <div className="screen-27">
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
        <div className="screen-27">
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

              {/* 説明文 */}
              <div className="frame-535">
                <div className="text-wrapper-260">
                  お客様のお問い合わせが、送信されました。<br />
                  弊社担当より5営業日以内に返信がございますので、今しばらくお待ちいただけますと幸いです。
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
