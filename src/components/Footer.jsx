import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export const Footer = ({ currentPage = 'home' }) => {
  const getIconSrc = (pageName) => {
    const icons = {
      home: '/img/home-black.png',
      search: '/img/search-black.png',
      schedule: '/img/schedule-black.png',
      recommend: '/img/recommend-black.png',
      mypage: '/img/mypage-black.png'
    };
    
    return icons[pageName] || icons[pageName.replace('黒', '')];
  };

  return (
    <div className="footer-outer">
      <div className="footer-inner">
        <div className="footer-content">
          <Link to="/home">
            <img className="footer-nav-icon" alt="ホーム" src={currentPage === 'home' ? getIconSrc('home') : '/img/home.png'} />
          </Link>
          <Link to="/tournament-search-team">
            <img className="footer-nav-icon" alt="検索" src={currentPage === 'search' ? getIconSrc('search') : '/img/search.png'} />
          </Link>
          <Link to="/tournament-schedule">
            <img className="footer-nav-icon" alt="スケジュール" src={currentPage === 'schedule' ? getIconSrc('schedule') : '/img/schedule.png'} />
          </Link>
          <Link to="/ads">
            <img className="footer-nav-icon" alt="おすすめ" src={currentPage === 'recommend' ? getIconSrc('recommend') : '/img/recommend.png'} />
          </Link>
          <Link to="/my-profile">
            <img className="footer-nav-icon" alt="マイページ" src={currentPage === 'mypage' ? getIconSrc('mypage') : '/img/mypage.png'} />
          </Link>
        </div>
      </div>
    </div>
  );
}; 
