import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen31 = () => {
  const mainContentTop = useHeaderOffset();

  
  return (
    <div className="screen-31">
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
      <div className="screen-31">
        <div className="frame-300">
          <div className="frame-301">

            <div className="frame-302">
              <div className="text-wrapper-200">退会手続き</div>
            </div>

            <div className="frame-303">
              <div className="frame-304">
                <div className="text-wrapper-201">アカウントの退会についてご確認ください</div>
              </div>

              <div className="frame-305">
                <div className="text-wrapper-202">退会手続きを行うと、以下の内容がすべて削除され、元に戻すことはできません。</div>
              </div>

              <div className="frame-306">
                <ul className="text-wrapper-203">
                  <li>・ご利用中のデータ（履歴・ポイント・設定など）</li>
                  <li>・アカウント情報</li>
                  <li>・その他すべての個人データ</li>
                </ul>
              </div>

              <div className="frame-307">
                <div className="text-wrapper-204">退会後は、同じメールアドレスでの再登録時にも過去のデータは引き継がれませんのでご注意ください。</div>
              </div>

              <div className="frame-308">
                <div className="text-wrapper-205">Sofvoアカウントを削除すると、アカウントにログインできなくなります。アカウントを削除しますか？</div>
              </div>
              
            </div>

          </div>
        </div>

        <div className="frame-309">
          <Link to="/settings" className="frame-310">
            <div className="text-wrapper-206">戻る</div>
          </Link>

          <Link to="/settings" className="frame-311">
            <div className="text-wrapper-207">退会する</div>
          </Link>
        </div>
      </div>
    </div>
    <Footer currentPage="team-create" />
  </div>
  );
};
