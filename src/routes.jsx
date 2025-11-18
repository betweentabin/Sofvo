import { createHashRouter } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { Layout } from "./components/Layout";
import { DivWrapper } from "./screens/アカウント作成";
import { SearchScreen } from "./screens/Sagasu";
import { Dm } from "./screens/DM";
import { HomeScreen } from "./screens/ホーム";
import { NumberCircleFive } from "./screens/空コンポーネント";
import { Screen } from "./screens/スプラッシュ";
import { Screen6 } from "./screens/プロフィール作成";
import { Screen7 } from "./screens/アドミン";
import { Screen10 } from "./screens/おすすめ";
import { Screen11 } from "./screens/参加予定大会（本日参加）";
import { Screen13 } from "./screens/プロフィール編集";
import { Screen14 } from "./screens/マイページ";
import { Screen15 } from "./screens/お知らせ";
import { Screen16 } from "./screens/チーム画面(メンバー)";
import { Screen17 } from "./screens/チーム画面(管理者)";
import { Screen18 } from "./screens/大会募集画面";
import { Screen19 } from "./screens/設定画面";
import { Screen20 } from "./screens/大会結果個別画面";
import { Screen21 } from "./screens/大会結果総合画面";
import { Screen22 } from "./screens/登録情報変更";
import { Screen23 } from "./screens/利用規約";
import { Screen24 } from "./screens/チームプロフィール編集";
import { Screen26 as Screen25 } from "./screens/プライバシーポリシー";
import { Screen27 } from "./screens/お問い合わせ（送信）";
import { Screen28 } from "./screens/お問い合わせ（完了）";
import { Screen29 } from "./screens/お問い合わせ（記入）";
import { Screen30 } from "./screens/通知設定";
import { Screen31 } from "./screens/退会";
import { Screen32 } from "./screens/チーム管理画面";
import { Screen33 } from "./screens/チーム作成";
import { Screen34 } from "./screens/チーム解散";
import { Screen35 } from "./screens/メンバー管理";
import { Screen36 } from "./screens/主催大会管理";
import { Screen37 } from "./screens/大会を主催";
import { Screen38 } from "./screens/大会を編集";
import { Screen39 } from "./screens/OSS ライセンス/Screen39";
import { ScreenScreen } from "./screens/ログイン";
import { FollowList } from "./screens/フォローリスト/FollowList";

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <AuthGuard><HomeScreen /></AuthGuard>,
      },
      {
        path: "splash",
        element: <Screen />,
      },
      {
        path: "login",
        element: <ScreenScreen />,
      },
      {
        path: "signup",
        element: <DivWrapper />,
      },
      {
        path: "profile-create",
        element: <Screen6 />,
      },
      {
        path: "home",
        element: <AuthGuard><HomeScreen /></AuthGuard>,
      },
      {
        path: "admin",
        element: <AuthGuard><Screen7 /></AuthGuard>,
      },
      {
        path: "ads",
        element: <AuthGuard><Screen10 /></AuthGuard>,
      },
      {
        path: "tournament-schedule",
        element: <AuthGuard><Screen11 /></AuthGuard>,
      },
      {
        path: "tournament-search",
        element: <AuthGuard><SearchScreen /></AuthGuard>,
      },
      {
        path: "tournament-search-team",
        element: <AuthGuard><SearchScreen /></AuthGuard>,
      },
      {
        path: "tournament-search-individual",
        element: <AuthGuard><SearchScreen /></AuthGuard>,
      },
      {
        path: "tournament-detail",
        element: <AuthGuard><Screen18 /></AuthGuard>,
      },
      {
        path: "tournament-detail/:tournamentId",
        element: <AuthGuard><Screen18 /></AuthGuard>,
      },
      {
        path: "tournament-result-team",
        element: <AuthGuard><Screen20 /></AuthGuard>,
      },
      {
        path: "tournament-result-all",
        element: <AuthGuard><Screen21 /></AuthGuard>,
      },
      {
        path: "profile-edit",
        element: <AuthGuard><Screen13 /></AuthGuard>,
      },
      {
        path: "my-profile",
        element: <AuthGuard><Screen14 /></AuthGuard>,
      },
      {
        path: "profile/:userId",
        element: <AuthGuard><Screen14 /></AuthGuard>,
      },
      {
        path: "follow-list",
        element: <AuthGuard><FollowList /></AuthGuard>,
      },
      {
        path: "follow-list/:userId",
        element: <AuthGuard><FollowList /></AuthGuard>,
      },
      {
        path: "team-profile",
        element: <AuthGuard><Screen16 /></AuthGuard>,
      },
      {
        path: "team-member",
        element: <AuthGuard><Screen16 /></AuthGuard>,
      },
      {
        path: "team-manage",
        element: <AuthGuard><Screen17 /></AuthGuard>,
      },
      {
        path: "team-create",
        element: <AuthGuard><Screen33 /></AuthGuard>,
      },
      {
        path: "team-profile-edit",
        element: <AuthGuard><Screen24 /></AuthGuard>,
      },
      {
        path: "team-management",
        element: <AuthGuard><Screen32 /></AuthGuard>,
      },
      {
        path: "team-disband",
        element: <AuthGuard><Screen34 /></AuthGuard>,
      },
      {
        path: "member-manage",
        element: <AuthGuard><Screen35 /></AuthGuard>,
      },
      {
        path: "team-members",
        element: <AuthGuard><Screen35 /></AuthGuard>,
      },
      {
        path: "notifications",
        element: <AuthGuard><Screen15 /></AuthGuard>,
      },
      {
        path: "tournament-host-manage",
        element: <AuthGuard><Screen36 /></AuthGuard>,
      },
      {
        path: "tournament-manage",
        element: <AuthGuard><Screen36 /></AuthGuard>,
      },
      {
        path: "tournament-host",
        element: <AuthGuard><Screen37 /></AuthGuard>,
      },
      {
        path: "tournament-edit",
        element: <AuthGuard><Screen38 /></AuthGuard>,
      },
      {
        path: "settings",
        element: <AuthGuard><Screen19 /></AuthGuard>,
      },
      {
        path: "account-settings",
        element: <AuthGuard><Screen22 /></AuthGuard>,
      },
      {
        path: "account-info",
        element: <AuthGuard><Screen22 /></AuthGuard>,
      },
      {
        path: "terms",
        element: <Screen23 />,
      },
      {
        path: "privacy",
        element: <Screen25 />,
      },
      {
        path: "contact",
        element: <Screen29 />,
      },
      {
        path: "contact-confirm",
        element: <Screen28 />,
      },
      {
        path: "contact-complete",
        element: <Screen27 />,
      },
      {
        path: "notification-settings",
        element: <AuthGuard><Screen30 /></AuthGuard>,
      },
      {
        path: "withdraw",
        element: <AuthGuard><Screen31 /></AuthGuard>,
      },
      {
        path: "account-delete",
        element: <AuthGuard><Screen31 /></AuthGuard>,
      },
      {
        path: "dm",
        element: <AuthGuard><Dm /></AuthGuard>,
      },
      {
        path: "dm/:conversationId",
        element: <AuthGuard><Dm /></AuthGuard>,
      },
      {
        path: "oss-licenses",
        element: <Screen39 />,
      },
      {
        path: "empty",
        element: <NumberCircleFive />,
      },
      {
        path: "mypage",
        element: <AuthGuard><Screen14 /></AuthGuard>,
      },
      {
        path: "mypage/:userId",
        element: <AuthGuard><Screen14 /></AuthGuard>,
      },
      {
        path: "recommend",
        element: <AuthGuard><Screen10 /></AuthGuard>,
      },
      {
        path: "search",
        element: <AuthGuard><SearchScreen /></AuthGuard>,
      },
    ],
  },
]);
