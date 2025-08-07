import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export const Footer = ({ currentPage = 'home' }) => {
  const getIconSrc = (pageName) => {
    const icons = {
      home: '/images/300ppi/ホーム黒.png',
      search: '/images/300ppi/検索黒.png',
      schedule: '/images/300ppi/スケジュール黒.png',
      recommend: '/images/300ppi/おすすめ黒.png',
      mypage: '/images/300ppi/マイページ黒.png'
    };
    
    return icons[pageName] || icons[pageName.replace('黒', '')];
  };

  return (
    <div className="footer-outer">
      <div className="footer-inner">
        <div className="footer-content">
          <Link to="/">
            <img className="footer-nav-icon" alt="ホーム" src={currentPage === 'home' ? getIconSrc('home') : '/images/300ppi/ホーム.png'} />
          </Link>
          <Link to="/tournament-search-team">
            <img className="footer-nav-icon" alt="検索" src={currentPage === 'search' ? getIconSrc('search') : '/images/300ppi/検索.png'} />
          </Link>
          <Link to="/tournament-schedule">
            <img className="footer-nav-icon" alt="スケジュール" src={currentPage === 'schedule' ? getIconSrc('schedule') : '/images/300ppi/スケジュール.png'} />
          </Link>
          <Link to="/ads">
            <img className="footer-nav-icon" alt="おすすめ" src={currentPage === 'recommend' ? getIconSrc('recommend') : '/images/300ppi/おすすめ.png'} />
          </Link>
          <Link to="/my-profile">
            <img className="footer-nav-icon" alt="マイページ" src={currentPage === 'mypage' ? getIconSrc('mypage') : '/images/300ppi/マイページ.png'} />
          </Link>
        </div>
      </div>
    </div>
  );
}; 