import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ScreenScreen } from '../screens/ログイン';
import { Screen } from '../screens/スプラッシュ';

export const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();

  // ローディング中はスプラッシュ画面を表示
  if (loading) {
    return <Screen />;
  }

  // ログインしていない場合はログイン画面を表示
  if (!user) {
    return <ScreenScreen />;
  }

  // ログイン済みの場合は子コンポーネントを表示
  return children;
};
