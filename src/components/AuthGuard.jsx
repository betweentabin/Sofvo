import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();

  // ローディング中は何も表示しない（スプラッシュはアプリレベルで処理）
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>読み込み中...</div>;
  }

  // ログインしていない場合はログイン画面にリダイレクト
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ログイン済みの場合は子コンポーネントを表示
  return children;
};
