import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen34 = () => {
  const mainContentTop = useHeaderOffset();

  
  return (
    <div className="screen-34">
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
      <div className="screen-34">
        <div className="frame-300">
          <div className="frame-301">

            <div className="frame-302">
              <div className="text-wrapper-200">チーム解散</div>
            </div>

            <div className="frame-303">
              <div className="frame-304">
                <div className="text-wrapper-201">チーム解散についてご確認ください</div>
              </div>

              <div className="frame-305">
                <div className="text-wrapper-202">チームを解散すると、以下の内容がすべて削除され、元に戻すことはできません。</div>
              </div>

              <div className="frame-306">
                <ul className="text-wrapper-203">
                  <li>・チーム情報（チーム名・プロフィール・設定など）</li>
                  <li>・チームに紐づく試合記録などのデータ</li>
                  <li>・その他すべての個人データ</li>
                </ul>
              </div>

              <div className="frame-307">
                <div className="text-wrapper-204">チーム解散後に、同じチーム名で新たにチームを作成することは可能ですが、過去のデータは一切引き継がれず、すべて再設定が必要になります。</div>
              </div>

              <div className="frame-308">
                <div className="text-wrapper-205">チームを解散すると、そのチームに関連するすべてのデータにアクセスできなくなります。
                本当にチームを解散しますか？</div>
              </div>
              
            </div>

          </div>
        </div>

        <div className="frame-309">
          <Link to="/team-management" className="frame-310">
            <div className="text-wrapper-206">戻る</div>
          </Link>

          <Link to="/settings" className="frame-311">
            <div className="text-wrapper-207">解散する</div>
          </Link>
        </div>
      </div>
    </div>
    <Footer currentPage="team-create" />
  </div>
  );
};
