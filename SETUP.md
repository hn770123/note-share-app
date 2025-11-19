# セットアップガイド

このガイドでは、メモ共有アプリケーションをセットアップする手順を詳しく説明します。

## 目次
1. [Supabaseの設定](#1-supabaseの設定)
2. [アプリケーションの設定](#2-アプリケーションの設定)
3. [GitHub Pagesでの公開](#3-github-pagesでの公開)
4. [動作確認](#4-動作確認)

## 1. Supabaseの設定

### 1.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインイン（または新規登録）
4. 「New Project」をクリック
5. プロジェクト情報を入力:
   - **Name**: `note-share-app`（任意の名前）
   - **Database Password**: 強力なパスワードを生成・保存
   - **Region**: `Northeast Asia (Tokyo)`を推奨
6. 「Create new project」をクリック
7. プロジェクトの作成を待つ（数分かかる場合があります）

### 1.2 APIキーの取得

1. プロジェクトダッシュボードの左サイドバーから「Settings」をクリック
2. 「API」セクションをクリック
3. 以下の情報をコピーして安全な場所に保存:
   - **Project URL**: `https://xxxxx.supabase.co`の形式
   - **anon public key**: `eyJhb...`で始まる長い文字列

### 1.3 データベーススキーマの作成

1. 左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLコードを貼り付け:

```sql
-- ユーザーテーブル
-- 機能: パスコードでユーザーを管理
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  passcode TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- メモテーブル
-- 機能: ユーザーのメモを保存
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- アクセスログテーブル
-- 機能: ユーザーの操作履歴を記録
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);

-- Row Level Security (RLS)を有効化
-- セキュリティ: データへのアクセスを制限
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
-- すべてのユーザーがデータにアクセス可能（アプリケーション側で制御）
CREATE POLICY "Enable all access for users" ON users
  FOR ALL USING (true);

CREATE POLICY "Enable all access for notes" ON notes
  FOR ALL USING (true);

CREATE POLICY "Enable all access for access_logs" ON access_logs
  FOR ALL USING (true);

-- 古いログを自動削除する関数（オプション）
-- 30日より古いログを削除
CREATE OR REPLACE FUNCTION delete_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM access_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 定期的にログをクリーンアップする（オプション）
-- Supabaseの「Database」→「Cron Jobs」で設定可能
-- 例: 毎日午前3時に実行
-- SELECT cron.schedule('delete-old-logs', '0 3 * * *', 'SELECT delete_old_logs()');
```

4. 「Run」ボタンをクリックしてSQLを実行
5. 成功メッセージが表示されることを確認

### 1.4 データベースの確認

1. 左サイドバーから「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認:
   - `users`
   - `notes`
   - `access_logs`

## 2. アプリケーションの設定

### 2.1 Supabase認証情報の設定

1. プロジェクトの`supabase-client.js`ファイルを開く
2. 以下の行を見つける:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. 先ほどコピーしたSupabaseの情報に置き換える:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // 実際のProject URL
const SUPABASE_ANON_KEY = 'eyJhb...'; // 実際のanon public key
```

4. ファイルを保存

### 2.2 変更をコミット

```bash
git add supabase-client.js
git commit -m "Supabase認証情報を設定"
git push
```

## 3. GitHub Pagesでの公開

### 3.1 リポジトリ設定

1. GitHubリポジトリページにアクセス
2. 「Settings」タブをクリック
3. 左サイドバーから「Pages」をクリック

### 3.2 ソースの設定

1. 「Source」セクションで:
   - **Source**: `Deploy from a branch`を選択
   - **Branch**: `main`（またはアプリケーションがあるブランチ）を選択
   - **Folder**: `/ (root)`を選択
2. 「Save」ボタンをクリック

### 3.3 公開の確認

1. 数分待つとデプロイが完了
2. 「Your site is live at ...」というメッセージが表示される
3. 表示されたURLをクリックしてアプリケーションにアクセス

例: `https://hn770123.github.io/note-share-app/`

### 3.4 カスタムドメインの設定（オプション）

1. 「Custom domain」セクションで独自ドメインを設定可能
2. DNSレコードを設定してドメインを検証
3. HTTPSが自動的に有効化される

## 4. 動作確認

### 4.1 ログインのテスト

1. 公開されたURLにアクセス
2. 12桁のパスコード（例: `123456789012`）を入力
3. 「ログイン」ボタンをクリック
4. メモ管理画面が表示されることを確認

### 4.2 メモ作成のテスト

1. 「新規メモ作成」ボタンをクリック
2. メモのタイトルを入力
3. 「編集」ボタンをクリック
4. Markdown形式でメモを入力:
```markdown
# テストメモ

これは**テスト**です。

- リスト項目1
- リスト項目2

[リンク](https://example.com)
```
5. 「保存」ボタンをクリック
6. Markdownが正しくレンダリングされることを確認

### 4.3 アクセスログのテスト

1. メモを作成・編集
2. サイドバーのアクセスログセクションを確認
3. 「閲覧」「編集」のログが記録されていることを確認

### 4.4 パスコード変更のテスト

1. 「パスコード変更」ボタンをクリック
2. 新しい12桁のパスコード（例: `999999999999`）を入力
3. 確認のため再度入力
4. 「変更」ボタンをクリック
5. 成功メッセージが表示されることを確認
6. ログアウトして新しいパスコードでログインできることを確認

## トラブルシューティング

### Supabaseに接続できない

**症状**: ログイン時にエラーが発生する

**解決方法**:
1. `supabase-client.js`のURL・APIキーが正しいか確認
2. ブラウザの開発者ツール（F12）でコンソールエラーを確認
3. SupabaseダッシュボードでAPIキーが有効か確認

### GitHub Pagesでページが表示されない

**症状**: 404エラーが表示される

**解決方法**:
1. Settings > Pagesで正しいブランチが選択されているか確認
2. `.nojekyll`ファイルがリポジトリルートにあるか確認
3. `index.html`がリポジトリルートにあるか確認
4. デプロイが完了するまで数分待つ

### Markdownが表示されない

**症状**: Markdownがプレーンテキストとして表示される

**解決方法**:
1. `app.html`で`marked.js`のCDNが正しく読み込まれているか確認
2. ブラウザの開発者ツールでネットワークエラーを確認
3. インターネット接続を確認

### ログが表示されない

**症状**: アクセスログセクションが空

**解決方法**:
1. メモを閲覧・編集してログを生成
2. Supabaseダッシュボードで`access_logs`テーブルにデータがあるか確認
3. ブラウザをリロードして最新データを取得

## セキュリティのベストプラクティス

1. **定期的なパスコード変更**: 少なくとも月に1回はパスコードを変更
2. **機密情報の回避**: パスワードや個人情報を直接メモに記載しない
3. **アクセスログの監視**: 不審なアクセスがないか定期的に確認
4. **Supabase RLSの設定**: より高度なセキュリティが必要な場合はRow Level Securityを強化
5. **HTTPSの使用**: GitHub Pagesは自動的にHTTPSを有効化（カスタムドメインでも設定）

## サポート

問題が解決しない場合:
- GitHubリポジトリのIssuesセクションで質問
- Supabaseの[公式ドキュメント](https://supabase.com/docs)を参照
- [Supabaseコミュニティ](https://github.com/supabase/supabase/discussions)で質問

## 次のステップ

アプリケーションが正常に動作したら:
1. ユーザーマニュアルを作成
2. チームメンバーと共有
3. フィードバックを収集して機能を改善
4. バックアップ戦略を検討（Supabaseの自動バックアップ機能を利用）
