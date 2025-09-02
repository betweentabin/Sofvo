# Sofvo データベース設計書

## 概要
Sofvoアプリケーションのデータベース設計は、Supabaseを基盤として構築されており、スポーツチーム管理、トーナメント開催、コミュニケーション機能を包括的にサポートする設計となっています。

## 認証システム
- **基盤**: Supabase Auth（auth.users）
- **特徴**: 
  - メール/パスワードによる認証
  - プロフィール情報との自動連携
  - トリガーによる自動プロフィール作成

## 主要テーブル構成

### 1. profiles（ユーザープロフィール）
**目的**: ユーザーの詳細情報を管理

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | auth.usersへの参照 |
| username | TEXT | UNIQUE NOT NULL | ユニークなユーザー名 |
| display_name | TEXT | - | 表示名 |
| avatar_url | TEXT | - | アバター画像URL |
| bio | TEXT | - | 自己紹介 |
| sport_type | TEXT | - | スポーツ種別 |
| phone | TEXT | - | 電話番号（非公開） |
| furigana | TEXT | - | フリガナ（非公開） |
| location | TEXT | - | 居住地域 |
| age | INTEGER | - | 年齢 |
| gender | TEXT | - | 性別 |
| experience_years | TEXT | - | 経験年数 |
| team_name | TEXT | - | 所属チーム名 |
| privacy_settings | JSONB | - | プライバシー設定 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新日時 |

### 2. teams（チーム）
**目的**: チーム情報の管理

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | チームID |
| name | TEXT | NOT NULL | チーム名 |
| description | TEXT | - | チーム説明 |
| sport_type | TEXT | - | スポーツ種別 |
| logo_url | TEXT | - | チームロゴURL |
| created_by | UUID | REFERENCES profiles | 作成者 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新日時 |

### 3. team_members（チームメンバー）
**目的**: チームとユーザーの関連付け

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | メンバーシップID |
| team_id | UUID | REFERENCES teams | チームID |
| user_id | UUID | REFERENCES profiles | ユーザーID |
| role | TEXT | CHECK IN ('owner', 'admin', 'member') | 役割 |
| joined_at | TIMESTAMPTZ | DEFAULT NOW() | 参加日時 |

### 4. tournaments（大会）
**目的**: 大会情報の管理

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | 大会ID |
| name | TEXT | NOT NULL | 大会名 |
| description | TEXT | - | 大会説明 |
| sport_type | TEXT | - | スポーツ種別 |
| start_date | DATE | - | 開始日 |
| end_date | DATE | - | 終了日 |
| location | TEXT | - | 開催場所 |
| max_participants | INTEGER | - | 最大参加者数 |
| registration_deadline | DATE | - | 登録締切 |
| organizer_id | UUID | REFERENCES profiles | 主催者 |
| team_id | UUID | REFERENCES teams | 主催チーム |
| status | TEXT | CHECK IN ('upcoming', 'ongoing', 'completed', 'cancelled') | ステータス |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新日時 |

### 5. conversations（会話）
**目的**: DM、グループチャット、チームチャットの管理

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | 会話ID |
| type | TEXT | CHECK IN ('direct', 'group', 'team') | 会話タイプ |
| name | TEXT | - | 会話名（グループの場合） |
| team_id | UUID | REFERENCES teams | チームID（チームチャットの場合） |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新日時 |

### 6. messages（メッセージ）
**目的**: チャットメッセージの保存

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | メッセージID |
| conversation_id | UUID | REFERENCES conversations | 会話ID |
| sender_id | UUID | REFERENCES profiles | 送信者ID |
| content | TEXT | NOT NULL | メッセージ内容 |
| type | TEXT | CHECK IN ('text', 'image', 'file') | メッセージタイプ |
| file_url | TEXT | - | ファイルURL |
| edited_at | TIMESTAMPTZ | - | 編集日時 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 作成日時 |

### 7. notifications（通知）
**目的**: ユーザー通知の管理

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | 通知ID |
| user_id | UUID | REFERENCES profiles | ユーザーID |
| type | TEXT | NOT NULL | 通知タイプ |
| title | TEXT | NOT NULL | 通知タイトル |
| message | TEXT | - | 通知メッセージ |
| data | JSONB | - | 追加データ |
| read | BOOLEAN | DEFAULT FALSE | 既読フラグ |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 作成日時 |

## セキュリティ設計

### Row Level Security (RLS)
全テーブルでRLSが有効化されており、以下のポリシーが適用されています：

#### profiles テーブル
- **閲覧**: 全ユーザーが閲覧可能
- **更新**: 本人のみ可能
- **作成**: 本人のみ可能

#### teams テーブル
- **閲覧**: 全ユーザーが閲覧可能
- **更新**: オーナー/管理者のみ可能
- **作成**: 認証済みユーザーが可能

#### messages テーブル
- **閲覧**: 会話参加者のみ可能
- **作成**: 会話参加者のみ可能

#### notifications テーブル
- **閲覧**: 本人のみ可能
- **更新**: 本人のみ可能

## 自動化機能

### トリガー
1. **新規ユーザー作成トリガー**
   - auth.usersに新規レコード作成時、自動的にprofilesテーブルにレコードを作成
   - ユーザー名、表示名、電話番号、フリガナを自動設定

2. **更新日時トリガー**
   - profiles、teams、conversations、tournamentsテーブルの更新時に自動的にupdated_atを更新

### リアルタイム機能
以下のテーブルでリアルタイム更新が有効：
- messages（チャットメッセージ）
- notifications（通知）
- conversation_participants（会話参加者）

## アカウント作成フロー

### 1. フロントエンド（DivWrapper.jsx）
入力フィールド:
- アカウントネーム（必須）
- メールアドレス（必須）
- 携帯電話番号（必須・非公開）
- パスワード（必須・8文字以上の半角英数字）
- 名前（必須・非公開）
- フリガナ（必須・非公開・カタカナ）
- 利用規約同意（必須）
- プライバシーポリシー同意（必須）

### 2. バリデーション
- メールアドレス形式チェック
- 電話番号形式チェック（10-11桁）
- パスワード強度チェック
- フリガナのカタカナチェック

### 3. Supabase連携
```javascript
signUp(email, password, {
  username: accountName,
  display_name: name,
  phone: phone,
  furigana: furigana
})
```

### 4. 自動プロフィール作成
auth.usersへの挿入後、トリガーによりprofilesテーブルに自動的にレコード作成

## データベース設計の特徴

### 強み
1. **包括的な機能**: チーム管理、大会運営、コミュニケーション機能を統合
2. **セキュリティ**: RLSによる細かいアクセス制御
3. **拡張性**: JSONBフィールドによる柔軟なデータ保存
4. **リアルタイム**: Supabaseのリアルタイム機能を活用
5. **自動化**: トリガーによる自動処理

### 改善可能な点
1. **インデックス**: 検索性能向上のためのインデックス追加検討
2. **バックアップ**: 定期バックアップ戦略の策定
3. **パフォーマンス監視**: クエリパフォーマンスの監視体制
4. **データ検証**: より詳細なデータ整合性チェック

## まとめ
Sofvoのデータベース設計は、会員登録機能を含む包括的なスポーツチーム管理システムとして十分に設計されています。Supabaseの機能を効果的に活用し、セキュリティとユーザビリティのバランスが取れた実装となっています。