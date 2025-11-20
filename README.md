# メモ共有アプリケーション

## 概要
Supabaseをバックエンドとして使用し、HTML/JavaScriptで構築された静的なメモ共有アプリケーションです。
12桁のパスコードでログインし、複数人・複数端末からメモの閲覧・編集が可能です。

## 主な機能
- **12桁パスコード認証**: セキュアなログインシステム
- **ランダムパスキー生成**: ワンクリックで安全なパスコードを生成
- **新規パスキー作成制限**: 1日3つまでの作成制限（既存パスキーのログインは無制限）
- **ログインID表示**: ヘッダーにログインID（パスキー）を常時表示
- **メモの作成・編集**: Markdown形式に対応
- **複数メモ管理**: 名前付きで複数のメモを作成可能
- **アカウント完全削除**: ユーザーアカウントと全データ（メモ、ログ）を一括削除
- **詳細なアクセスログ**: 閲覧・編集履歴に加え、IP、ブラウザ、OS、デバイス情報を記録
- **ログ確認ページ**: すべてのログ情報を別ページで詳細表示
- **古いログの削除**: 14日より前のログを一括削除してストレージを節約
- **パスコード変更**: セキュリティ維持のためのパスコード変更機能
- **モバイル最適化**: タッチ操作しやすい拡張されたメモ選択エリア

## セットアップ

### 1. Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com/)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURL（SUPABASE_URL）とAnon Keyをコピー

### 2. データベーススキーマの設定

#### 新規セットアップの場合
Supabase SQLエディタで `recreate_tables.sql` の内容を実行してください。

#### 既存テーブルを修正する場合
既存データを保持したまま修正する場合は、Supabase SQLエディタで `alter_tables.sql` の内容を実行してください。

<details>
<summary>手動でSQLを実行する場合はこちらをクリック</summary>

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
-- 注意: note_idはNULLを許可（ログイン・ログアウトなど、メモに関連しないアクションのため）
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);

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
</details>

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
1. 初回ログイン時、以下のいずれかの方法でパスコードを入力
   - 手動で12桁のパスコードを入力
   - 「🎲 ランダム生成」ボタンで自動生成
2. 既存ユーザーは作成したパスコードでログイン
3. **注意**: 新規パスコード作成は1日3つまで制限されています

### メモの作成
1. メモ一覧画面で「+ 新規作成」ボタンをクリック
2. メモのタイトルを入力
3. 「編集」ボタンで編集モードに入る
4. Markdown形式でメモを作成
5. 「保存」ボタンで保存

### メモの編集
1. メモ一覧から編集したいメモを選択
2. 「編集」ボタンをクリック
3. 内容を編集
4. 「保存」で保存、「キャンセル」で変更を破棄

### アカウントの削除
1. メモ一覧画面で「🗑️ アカウント削除」ボタンをクリック
2. 警告メッセージを確認（三重確認）
3. 以下のすべてのデータが完全に削除されます：
   - ユーザーアカウント
   - すべてのメモ
   - すべてのアクセスログ
4. **注意**: この操作は取り消せません

### アクセスログの確認
1. メモ管理画面のヘッダーで「📊 ログ確認」ボタンをクリック
2. ログ確認ページで以下の詳細情報を確認できます：
   - アクション（閲覧、編集）
   - メモのタイトル
   - 日時
   - IPアドレス
   - ブラウザ（Chrome、Firefox、Safari等）
   - OS（Windows、macOS、iOS等）
   - デバイス（Desktop、Mobile、Tablet）
   - User Agent文字列
3. 「🔄 更新」ボタンでログを最新の状態に更新できます
4. 「🗑️ 古いログ削除」ボタンで14日より前のログを削除できます

### パスコードの変更
1. メモ一覧画面で「パスコード変更」ボタンをクリック
2. 新しい12桁のパスコードを入力（またはランダム生成）
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
