import React, { useEffect } from "react";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import pushNotificationService from "./services/pushNotification";
import { DivWrapper } from "./screens/アカウント作成/DivWrapper";
import { SearchScreen } from "./screens/さがす";
import { Dm } from "./screens/DM/Dm";
import { HomeScreen } from "./screens/ホーム/HomeScreen";
import { NumberCircleFive } from "./screens/空コンポーネント/NumberCircleFive";
import { Screen } from "./screens/スプラッシュ/Screen";
import { Screen6 } from "./screens/プロフィール作成/Screen6";
import { Screen7 } from "./screens/アドミン/Screen7";
import { Screen10 } from "./screens/おすすめ/Screen10";
import { Screen11 } from "./screens/参加予定大会（本日参加）/Screen11";
import { Screen13 } from "./screens/プロフィール編集/Screen13";
import { Screen14 } from "./screens/マイページ/Screen14";
import { Screen15 } from "./screens/お知らせ/Screen15";
import { Screen16 } from "./screens/チーム画面(メンバー)/Screen16";
import { Screen17 } from "./screens/チーム画面(管理者)/Screen17";
import { Screen18 } from "./screens/大会募集画面/Screen18";
import { Screen19 } from "./screens/設定画面/Screen19";
import { Screen20 } from "./screens/大会結果個別画面/Screen20";
import { Screen21 } from "./screens/大会結果総合画面/Screen21";
import { Screen22 } from "./screens/登録情報変更/Screen22";
import { Screen23 } from "./screens/利用規約/Screen23";
import { Screen24 } from "./screens/チームプロフィール編集/Screen24";
import { Screen26 as Screen25 } from "./screens/プライバシーポリシー/Screen26";
import { Screen27 } from "./screens/お問い合わせ（送信）/Screen27";
import { Screen28 } from "./screens/お問い合わせ（完了）/Screen28";
import { Screen29 } from "./screens/お問い合わせ（記入）/Screen29";
import { Screen30 } from "./screens/通知設定/Screen30"; 
import { Screen31 } from "./screens/退会/Screen31";
import { Screen32 } from "./screens/チーム管理画面/Screen32";
import { Screen33 } from "./screens/チーム作成/Screen33";
import { Screen34 } from "./screens/チーム解散/Screen34";
import { Screen35 } from "./screens/メンバー管理/Screen35";
import { Screen36 } from "./screens/主催大会管理/Screen36";
import { Screen37 } from "./screens/大会を主催/Screen37";
import { Screen38 } from "./screens/大会を編集/Screen38";
import { ScreenScreen } from "./screens/ログイン/ScreenScreen";
import { ResetPassword } from "./screens/パスワードリセット/ResetPassword";

const router = createHashRouter([
  {
    path: "/",
    element: <ScreenScreen />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/splash",
    element: <Screen />,
  },
  {
    path: "/login",
    element: <ScreenScreen />,
  },
  {
    path: "/signup",
    element: <DivWrapper />,
  },
  {
    path: "/profile-create",
    element: <Screen6 />,
  },
  {
    path: "/home",
    element: <AuthGuard><HomeScreen /></AuthGuard>,
  },
  {
    path: "/admin",
    element: <AuthGuard><Screen7 /></AuthGuard>,
  },
  {
    path: "/ads",
    element: <AuthGuard><Screen10 /></AuthGuard>,
  },
  {
    path: "/tournament-schedule",
    element: <AuthGuard><Screen11 /></AuthGuard>,
  },
  {
    path: "/tournament-search",
    element: <AuthGuard><SearchScreen /></AuthGuard>,
  },
  {
    path: "/tournament-search-team",
    element: <AuthGuard><SearchScreen /></AuthGuard>,
  },
  {
    path: "/tournament-detail/:tournamentId?",
    element: <AuthGuard><Screen18 /></AuthGuard>,
  },
  {
    path: "/tournament-result-team",
    element: <AuthGuard><Screen20 /></AuthGuard>,
  },
  {
    path: "/tournament-result-all",
    element: <AuthGuard><Screen21 /></AuthGuard>,
  },
  {
    path: "/my-page",
    element: <AuthGuard><Screen14 /></AuthGuard>,
  },
  // Alias: legacy link target used across components
  {
    path: "/my-profile",
    element: <AuthGuard><Screen14 /></AuthGuard>,
  },
  {
    path: "/profile-edit",
    element: <AuthGuard><Screen13 /></AuthGuard>,
  },
  {
    path: "/notifications",
    element: <AuthGuard><Screen15 /></AuthGuard>,
  },
  {
    path: "/dm",
    element: <AuthGuard><Dm /></AuthGuard>,
  },
  {
    path: "/dm/:conversationId",
    element: <AuthGuard><Dm /></AuthGuard>,
  },
  {
    path: "/team-member",
    element: <AuthGuard><Screen16 /></AuthGuard>,
  },
  {
    path: "/team-admin",
    element: <AuthGuard><Screen17 /></AuthGuard>,
  },
  {
    path: "/team-create",
    element: <AuthGuard><Screen33 /></AuthGuard>,
  },
  {
    path: "/team-profile-edit",
    element: <AuthGuard><Screen24 /></AuthGuard>,
  },
  {
    path: "/team-management",
    element: <AuthGuard><Screen32 /></AuthGuard>,
  },
  {
    path: "/team-members",
    element: <AuthGuard><Screen35 /></AuthGuard>,
  },
  {
    path: "/team-disband",
    element: <AuthGuard><Screen34 /></AuthGuard>,
  },
  {
    path: "/tournament-host",
    element: <AuthGuard><Screen37 /></AuthGuard>,
  },
  {
    path: "/tournament-edit",
    element: <AuthGuard><Screen38 /></AuthGuard>,
  },
  {
    path: "/tournament-manage",
    element: <AuthGuard><Screen36 /></AuthGuard>,
  },
  {
    path: "/settings",
    element: <AuthGuard><Screen19 /></AuthGuard>,
  },
  {
    path: "/notification-settings",
    element: <AuthGuard><Screen30 /></AuthGuard>,
  },
  {
    path: "/account-info",
    element: <AuthGuard><Screen22 /></AuthGuard>,
  },
  {
    path: "/account-delete",
    element: <AuthGuard><Screen31 /></AuthGuard>,
  },
  {
    path: "/contact",
    element: <AuthGuard><Screen29 /></AuthGuard>,
  },
  {
    path: "/contact-input",
    element: <AuthGuard><Screen29 /></AuthGuard>,
  },
  {
    path: "/contact-confirm",
    element: <AuthGuard><Screen28 /></AuthGuard>,
  },
  {
    path: "/contact-complete",
    element: <AuthGuard><Screen27 /></AuthGuard>,
  },
  {
    path: "/contact-send",
    element: <AuthGuard><Screen27 /></AuthGuard>,
  },
  {
    path: "/terms",
    element: <AuthGuard><Screen23 /></AuthGuard>,
  },
  {
    path: "/privacy",
    element: <AuthGuard><Screen25 /></AuthGuard>,
  },
]);

export const App = () => {
  useEffect(() => {
    // プッシュ通知の初期化
    pushNotificationService.initialize();
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};
