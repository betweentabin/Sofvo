import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // 最低限のログ。将来的にサーバ送信に差し替え可能
    console.error("Unhandled UI error:", error, info);
  }

  handleReload = () => {
    // 画面をリロードして復旧を試みる
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isProd = process.env.NODE_ENV === 'production';
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0B0B',
          color: '#fff',
          padding: 16
        }}>
          <div style={{
            width: '100%',
            maxWidth: 560,
            background: '#121212',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>問題が発生しました</h2>
            <p style={{ marginTop: 0, marginBottom: 16, color: '#c7c7c7' }}>
              一時的な不具合の可能性があります。ページを再読み込みしてください。
            </p>
            {!isProd && this.state.error && (
              <pre style={{
                background: '#1a1a1a',
                padding: 12,
                borderRadius: 8,
                color: '#e0e0e0',
                maxHeight: 220,
                overflow: 'auto',
                fontSize: 12
              }}>
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
            <button onClick={this.handleReload} style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#1db954',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer'
            }}>再読み込み</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

