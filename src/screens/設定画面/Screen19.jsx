import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const Screen19 = () => {
  const mainContentTop = useHeaderOffset();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      alert('ログアウトに失敗しました。時間をおいて再度お試しください。');
    }
  };

  return (
    <div className="screen-19">
      <HeaderContent />

      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px", // フッターの高さ
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="frame-351">
          <div className="text-wrapper-179">設定画面</div>
        </div>

        <div className="frame-350 settings-container">
          {/* アカウント */}
          <section className="settings-section">
            <div className="settings-section-title">アカウント</div>
            <div className="settings-list">
              <Link to="/account-info" className="text-wrapper-178">・登録情報変更</Link>
              <Link to="/account-delete" className="text-wrapper-178">・退会する</Link>
              <button type="button" className="text-wrapper-178 logout-button" onClick={handleLogout}>・ログアウト</button>
            </div>
          </section>

          {/* チーム */}
          <section className="settings-section">
            <div className="settings-section-title">チーム</div>
            <div className="settings-list">
              <Link to="/team-create" className="text-wrapper-178">・チームを作成する</Link>
              <Link to="/team-member" className="text-wrapper-178">・参加チーム詳細</Link>
              <Link to="/team-management" className="text-wrapper-178">・作成チーム詳細</Link>
            </div>
          </section>

          {/* 通知 */}
          <section className="settings-section">
            <div className="settings-section-title">通知</div>
            <div className="settings-list">
              <Link to="/notification-settings" className="text-wrapper-178">・通知設定</Link>
            </div>
          </section>

          {/* サポート・情報 */}
          <section className="settings-section">
            <div className="settings-section-title">サポート・情報</div>
            <div className="settings-list">
              <Link to="/contact" className="text-wrapper-178">・お問い合わせ</Link>
              <Link to="/terms" className="text-wrapper-178">・利用規約</Link>
              <Link to="/privacy" className="text-wrapper-178">・プライバシーポリシー</Link>
              <Link to="/oss-licenses" className="text-wrapper-178">・オープンソースライセンス</Link>
            </div>
          </section>
        </div>


        
      </div>

      <Footer currentPage="settings" />
    </div>
  );
};
