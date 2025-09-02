import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export const Header = ({ onTabChange, activeTab = 'following' }) => {
  return (
    <div className="header-outer">
      <div className="header-inner">
        <div className="header-content">
          <Link to="/home" className="header-text" style={{ textDecoration: 'none' }}>Sofvo</Link>
          <div className="header-icon">
            <div className="header-icons">
              <img className="header-icon-img" alt="通知" src="/img/notification.png" />
              <img className="header-icon-img" alt="メッセージ" src="/img/message.png" />
              <img className="header-icon-img" alt="歯車" src="/img/settings.png" />
            </div>
          </div>
        </div>
      </div>
      <div className="header-tabs">
        <div 
          className={`text-wrapper-61 ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => onTabChange && onTabChange('following')}
          style={{ cursor: 'pointer' }}
        >
          フォロー中
        </div>
        <div 
          className={`text-wrapper-62 ${activeTab === 'recommend' ? 'active' : ''}`}
          onClick={() => onTabChange && onTabChange('recommend')}
          style={{ cursor: 'pointer' }}
        >
          おすすめ
        </div>
        <div className="overlap-group-8">
          <img className="vector-14" alt="Vector" src="/img/線.svg" />
          <img className={`vector-15 ${activeTab === 'recommend' ? 'recommend' : ''}`} alt="Vector" src="/img/vector-2-1.svg" />
        </div>
      </div>
      <div className="header-share-section">
        <div className="header-share-content">
          <img className="post-2" alt="Post" src="/img/post-5-1.png" />
          <div className="text-wrapper-63">気軽にみんなとシェアしよう</div>
        </div>
      </div>
    </div>
  );
}; 
