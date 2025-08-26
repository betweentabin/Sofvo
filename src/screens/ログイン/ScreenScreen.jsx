import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

export const ScreenScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 入力変更ハンドラー
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError("");
  };

  // ログイン処理
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    // バリデーション
    if (!formData.email || !formData.password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("有効なメールアドレスを入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // デモ用：成功と仮定してホーム画面へ
      console.log("ログイン試行:", formData);
      setTimeout(() => {
        setLoading(false);
        navigate("/home");
      }, 1000);
    } catch (err) {
      setError("ログインに失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="screen-screen">
      <div className="screen-2">
        <form className="overlap-group-3" onSubmit={handleLogin}>
          <input
            type="email"
            className="element-18 login-input"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="メールアドレスを入力"
            disabled={loading}
          />

          <input
            type="password"
            className="element-19 login-input"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="パスワードを入力"
            disabled={loading}
          />

          {error && (
            <div className="error-message" style={{
              position: "absolute",
              top: "280px",
              left: "20px",
              right: "20px",
              color: "red",
              fontSize: "12px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="overlap-4"
            disabled={loading}
            style={{ cursor: loading ? "not-allowed" : "pointer" }}
          >
            <div className="element-20" />
            <div className="text-wrapper-21">
              {loading ? "ログイン中..." : "ログイン"}
            </div>
          </button>

          <Link to="/reset-password" className="text-wrapper-22">
            パスワードをお忘れですか？
          </Link>

          <div className="text-wrapper-23">メールアドレス</div>

          <div className="text-wrapper-24">パスワード</div>

          <Link to="/signup" className="text-wrapper-25">アカウントを作成</Link>

          <div className="overlap-5">
            <div className="text-wrapper-26">Sofvo</div>

            <img className="bird-3" alt="Bird" src="/img/bird4-1.png" />
          </div>
        </form>
      </div>
    </div>
  );
};
