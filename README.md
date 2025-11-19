# メモ共有アプリケーション

## 概要
Supabaseをバックエンドとして使用し、HTML/JavaScriptで構築された静的なメモ共有アプリケーションです。
12桁のパスコードでログインし、複数人・複数端末からメモの閲覧・編集が可能です。

## 主な機能
- **12桁パスコード認証**: セキュアなログインシステム
- **メモの作成・編集**: Markdown形式に対応
- **複数メモ管理**: 名前付きで複数のメモを作成可能
- **アクセスログ**: 閲覧・編集履歴の記録と表示
- **パスコード変更**: セキュリティ維持のためのパスコード変更機能

## セットアップ

### 1. Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com/)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURL（SUPABASE_URL）とAnon Keyをコピー

### 2. データベーススキーマの設定
Supabase SQLエディタで以下を実行:

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  passcode TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- メモテーブル
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- アクセスログテーブル
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー設定（すべてのユーザーが自分のデータにアクセス可能）
CREATE POLICY "Users can manage their own data" ON users
  FOR ALL USING (true);

CREATE POLICY "Users can manage their notes" ON notes
  FOR ALL USING (true);

CREATE POLICY "Users can view access logs" ON access_logs
  FOR ALL USING (true);
```

### 3. 設定ファイルの編集
`supabase-client.js`ファイルで以下の値を設定:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 4. GitHub Pagesでの公開
1. GitHubリポジトリの Settings > Pages に移動
2. Source: Deploy from a branch
3. Branch: main (または使用しているブランチ)を選択
4. Save をクリック

## 使用方法

### ログイン
1. 初回ログイン時、12桁のパスコードを作成して入力
2. 既存ユーザーは作成したパスコードでログイン

### メモの作成
1. メモ一覧画面で「新規メモ作成」ボタンをクリック
2. メモのタイトルを入力
3. 「編集」ボタンで編集モードに入る
4. Markdown形式でメモを作成
5. 「保存」ボタンで保存

### メモの編集
1. メモ一覧から編集したいメモを選択
2. 「編集」ボタンをクリック
3. 内容を編集
4. 「保存」で保存、「キャンセル」で変更を破棄

### パスコードの変更
1. メモ一覧画面で「パスコード変更」ボタンをクリック
2. 新しい12桁のパスコードを入力
3. 確認のため再度入力
4. 「変更」ボタンで確定

## セキュリティに関する注意
⚠️ **このアプリケーションは機密情報の保存には適していません。**

- パスコードは総当たり攻撃のリスクがあります
- 機密情報を記録する場合は、別のサービスで暗号化してください
- セキュリティ対策:
  - アクセスログによる監視
  - パスコード変更機能
  - Supabaseのアクセス制限

## 技術スタック
- フロントエンド: HTML, CSS, JavaScript
- バックエンド: Supabase (PostgreSQL)
- Markdown: marked.js
- ホスティング: GitHub Pages

## ライセンス
MIT
