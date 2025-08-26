import React from "react";
import { Link } from "react-router-dom";
import "./HeaderContent.css";

export const HeaderContent = () => {
  return (
    <div className="header-content-outer">
      <div className="header-content-inner">
        <div className="header-content-content">
          <Link to="/" className="header-content-text" style={{ textDecoration: 'none' }}>Sofvo</Link>
          <div className="header-content-icon">
            <div className="header-content-icons">
              <Link to="/notifications">
                <img className="header-content-icon-img" alt="通知" src="/img/通知.png" />
              </Link>
              <Link to="/dm">
                <img className="header-content-icon-img" alt="メッセージ" src="/img/メッセージ.png" />
              </Link>
              <Link to="/settings">
                <img className="header-content-icon-img" alt="歯車" src="/img/歯車.png" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 