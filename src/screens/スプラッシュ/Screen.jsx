import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

export const Screen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 2秒後にログイン画面へ自動遷移
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    // コンポーネントがアンマウントされた時にタイマーをクリア
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="screen">
      <div className="div-2">
        <img className="element-17" alt="Element" src="/img/1001.png" />

        <div className="text-wrapper-20">Sofvo</div>

        <img
          className="phonelogo-x"
          alt="Phonelogo"
          src="/img/phonelogo-300x-4.png"
        />

        <div className="overlap-group-2">
          <img className="bird" alt="Bird" src="/img/bird-300x-2.png" />

          <img className="bird-2" alt="Bird" src="/img/bird4-1.png" />
        </div>
      </div>
    </div>
  );
};
