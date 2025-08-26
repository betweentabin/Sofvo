import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const ScreenScreen = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "test@sofvo.com", // デフォルト値でテストしやすく
    password: "testpass123"
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
      // Supabase認証を使用
      console.log("ログイン試行:", formData.email);
      await signIn(formData.email, formData.password);
      console.log("ログイン成功");
      navigate("/home");
    } catch (err) {
      console.error("ログインエラー:", err);
      setError(err.message || "ログインに失敗しました。メールアドレスとパスワードを確認してください。");
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
