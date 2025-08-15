import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

export const ScreenScreen = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/');
  };

  return (
    <div className="screen-screen">
      <div className="screen-2">
        <div className="overlap-group-3">
          <div className="element-18" />

          <div className="element-19" />

          <div className="overlap-4" onClick={handleLogin}>
            <button
              className="element-20"
            />

            <div className="text-wrapper-21">ログイン</div>
          </div>

          <div className="text-wrapper-22">パスワードをお忘れですか？</div>

          <div className="text-wrapper-23">メールアドレス</div>

          <div className="text-wrapper-24">パスワード</div>

          <Link to="/signup" className="text-wrapper-25">アカウントを作成</Link>

          <div className="overlap-5">
            <div className="text-wrapper-26">Sofvo</div>

            <img className="bird-3" alt="Bird" src="/img/bird4-1.png" />
          </div>
        </div>
      </div>
    </div>
  );
};
