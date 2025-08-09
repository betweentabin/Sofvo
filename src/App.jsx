import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { DivWrapper } from "./screens/アカウント作成";
import { SearchScreen } from "./screens/さがす";
import { Dm } from "./screens/DM";
import { HomeScreen } from "./screens/ホーム";
import { NumberCircleFive } from "./screens/空コンポーネント";
import { Screen } from "./screens/スプラッシュ";
import { Screen6 } from "./screens/プロフィール作成";
import { Screen7 } from "./screens/アドミン";
import { Screen10 } from "./screens/おすすめ";
import { Screen11 } from "./screens/参加予定大会（本日参加）";
import { Screen13 } from "./screens/プロフィール編集";
import { Screen14 } from "./screens/マイページ";
import { Screen15 } from "./screens/お知らせ";
import { Screen16 } from "./screens/チーム画面(メンバー)";
import { Screen17 } from "./screens/チーム画面(管理者)";
import { Screen18 } from "./screens/大会募集画面";
import { Screen19 } from "./screens/設定画面";
import { Screen20 } from "./screens/大会結果個別画面";
import { Screen21 } from "./screens/大会結果総合画面";
import { Screen22 } from "./screens/登録情報変更";
import { Screen23 } from "./screens/利用規約";
import { Screen24 } from "./screens/チームプロフィール編集";
import { Screen26 as Screen25 } from "./screens/プライバシーポリシー";
import { Screen27 } from "./screens/お問い合わせ（送信）";
import { Screen28 } from "./screens/お問い合わせ（完了）";
import { Screen29 } from "./screens/お問い合わせ（記入）";
import { Screen30 } from "./screens/通知設定"; 
import { Screen31 } from "./screens/退会";
import { ScreenScreen } from "./screens/ログイン";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeScreen />,
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
    element: <HomeScreen />,
  },
  {
    path: "/admin",
    element: <Screen7 />,
  },
  {
    path: "/ads",
    element: <Screen10 />,
  },
  {
    path: "/tournament-schedule",
    element: <Screen11 />,
  },
  {
    path: "/tournament-search",
    element: <SearchScreen />,
  },
  {
    path: "/tournament-search-team",
    element: <SearchScreen />,
  },
  {
    path: "/tournament-detail",
    element: <Screen18 />,
  },
  {
    path: "/tournament-result-team",
    element: <Screen20 />,
  },
  {
    path: "/tournament-result-all",
    element: <Screen21 />,
  },
  {
    path: "/profile-edit",
    element: <Screen13 />,
  },
  {
    path: "/my-profile",
    element: <Screen14 />,
  },
  {
    path: "/team-profile",
    element: <Screen16 />,
  },
  {
    path: "/team-manage",
    element: <Screen17 />,
  },
  {
    path: "/team-create",
    element: <Screen24 />,
  },
  {
    path: "/notifications",
    element: <Screen15 />,
  },
  {
    path: "/settings",
    element: <Screen19 />,
  },
  {
    path: "/account-settings",
    element: <Screen22 />,
  },
  {
    path: "/terms",
    element: <Screen23 />,
  },
  {
    path: "/privacy",
    element: <Screen25 />,
  },
  {
    path: "/contact",
    element: <Screen29 />,
  },
  {
    path: "/contact-confirm",
    element: <Screen28 />,
  },
  {
    path: "/contact-complete",
    element: <Screen27 />,
  },
  {
    path: "/notification-settings",
    element: <Screen30 />,
  },
  {
    path: "/withdraw",
    element: <Screen31 />,
  },
  {
    path: "/dm",
    element: <Dm />,
  },
  {
    path: "/empty",
    element: <NumberCircleFive />,
  },
]);

export const App = () => {
  return <RouterProvider router={router} />;
};