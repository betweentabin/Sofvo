import React, { useState } from "react";

export const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus({ type: "error", message: "有効なメールアドレスを入力してください" });
      return;
    }

    // For now, only display a friendly message.
    // Back-end reset API is not wired in this app build.
    setLoading(true);
    try {
      // Intentionally not calling API to avoid 404s in current backend
      await new Promise((r) => setTimeout(r, 600));
      setStatus({ type: "success", message: "パスワード再設定のご案内を送信しました（仮）。メールをご確認ください。" });
    } catch (_e) {
      setStatus({ type: "error", message: "送信に失敗しました。しばらくしてから再度お試しください。" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0B0B", color: "#fff", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#121212", borderRadius: 12, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img src="/img/bird4-1.png" alt="Sofvo" style={{ width: 40, height: 40 }} />
          <h1 style={{ fontSize: 20, margin: 0 }}>パスワード再設定</h1>
        </div>

        <p style={{ fontSize: 14, color: "#c7c7c7", lineHeight: 1.6, marginBottom: 16 }}>
          ご登録のメールアドレスを入力してください。再設定の手順をご案内します。
        </p>

        {status && (
          <div style={{
            background: status.type === "success" ? "#113d2b" : "#3d1111",
            border: `1px solid ${status.type === "success" ? "#1db954" : "#e74c3c"}`,
            color: status.type === "success" ? "#a6f3c1" : "#ffb3b3",
            padding: "10px 12px",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email" style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#d6d6d6" }}>
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@sofvo.com"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #2c2c2c",
              background: "#1a1a1a",
              color: "#fff",
              outline: "none",
              marginBottom: 12
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#3a3a3a" : "#1db954",
              color: "#000",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "送信中..." : "再設定メールを送信"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#a3a3a3", lineHeight: 1.6, marginTop: 12 }}>
          メールが届かない場合は迷惑メールをご確認ください。引き続き届かない場合はサポートまでお問い合わせください。
        </p>
      </div>
    </div>
  );
};

