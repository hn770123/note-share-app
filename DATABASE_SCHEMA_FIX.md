# データベーススキーマの修正について

## 問題点

### 1. ログが記録されない問題
現在のスキーマでは、`access_logs`テーブルの`note_id`カラムがNULL可能ですが、以下の課題がありました：

- ログイン・ログアウトなど、メモに関連しないアクションのログを記録する機能が実装されていない
- `note_id`カラムの制約が明示的に定義されていない
- インデックスが不足しており、ログ取得のパフォーマンスが最適化されていない

### 2. ログインID表示の問題
- ログイン後、ユーザーが自分のパスキー（ログインID）を確認する方法がなかった
- 複数のパスキーを使い分けるユーザーが、現在どのIDでログインしているか分からなかった

## 解決方法

### 1. データベーススキーマの修正

#### 用意したSQLファイル

1. **recreate_tables.sql**: テーブルを完全に再作成（データは削除されます）
   - 新規セットアップ時に使用
   - テーブル構造を一から作り直す
   - インデックスとコメントを含む完全な定義

2. **alter_tables.sql**: 既存データを保持したまま修正
   - 既存のデータベースを修正する場合に使用
   - データを保持したままテーブル構造を更新
   - インデックスの追加のみ

#### 主な変更点

```sql
-- access_logsテーブルの改善
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,  -- NOT NULL制約を明示
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,            -- NULLを許可（メモに関連しないアクション用）
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);
```

#### テーブルの意図を明確化

- `user_id`: 必須（NOT NULL）- すべてのログにはユーザーが必要
- `note_id`: オプション（NULL可）- ログイン/ログアウトなど、メモに関連しないアクションの場合はNULL

### 2. ログインID（パスキー）の表示機能追加

#### 変更したファイル

1. **app.html**
   - ヘッダーに`user-info`セクションを追加
   - ログインID（パスキー）を表示する要素を追加
   - ページ読み込み時にsessionStorageからパスコードを取得して表示

2. **logs.html**
   - app.htmlと同様にヘッダーにログインID表示を追加
   - ログ確認ページでもパスキーが確認可能

3. **style.css**
   - `.user-info`クラスのスタイル追加
   - `.user-passcode`クラスで等幅フォントを使用（パスコードの視認性向上）
   - レスポンシブデザイン対応（モバイルでも適切に表示）

#### 実装の詳細

```javascript
// ページ読み込み時にパスコードを表示
const passcode = sessionStorage.getItem('passcode');
if (passcode) {
    document.getElementById('displayPasscode').textContent = passcode;
}
```

## 使用方法

### データベースの修正手順

#### 方法1: 既存データを保持する場合（推奨）

1. Supabaseのダッシュボードにアクセス
2. SQL Editorを開く
3. `alter_tables.sql`の内容をコピー＆ペースト
4. 実行

#### 方法2: データをリセットする場合

1. Supabaseのダッシュボードにアクセス
2. SQL Editorを開く
3. `recreate_tables.sql`の内容をコピー＆ペースト
4. 実行（⚠️ すべてのデータが削除されます）

### ログインID表示の確認

1. アプリにログイン
2. ヘッダーに「ログインID (パスキー): 123456789012」のように表示される
3. ログ確認ページでも同様に表示される

## 今後の改善案

### 1. ログイン・ログアウトログの実装

現在、メモの閲覧・編集のみログが記録されていますが、以下のログも記録できるように拡張可能です：

```javascript
// ログイン時（index.html）
await logAccess(userId, null, 'ログイン');

// ログアウト時（app.html, logs.html）
await logAccess(userId, null, 'ログアウト');
```

### 2. パスコードのマスク表示

セキュリティを高めるため、パスコードを部分的にマスクする機能：

```javascript
function maskPasscode(passcode) {
    // 最初の4桁と最後の4桁のみ表示
    return passcode.substring(0, 4) + '****' + passcode.substring(8);
}
```

### 3. コピー機能の追加

ボタンをクリックしてパスコードをクリップボードにコピーする機能：

```html
<button onclick="copyPasscode()">📋 コピー</button>
```

## 注意事項

- `alter_tables.sql`は既存データを保持しますが、念のため実行前にバックアップを取ることを推奨します
- `recreate_tables.sql`を実行すると、すべてのユーザー、メモ、ログが削除されます
- パスコードはsessionStorageに保存されており、ブラウザを閉じると消えます（セキュリティ上の理由）
- パスコードは画面に平文で表示されるため、他の人に見られないよう注意してください

## トラブルシューティング

### Q: SQLの実行時にエラーが出る

A: 以下を確認してください：
- テーブルが既に存在する場合、`recreate_tables.sql`のDROP文が必要
- RLSポリシーが既に存在する場合、削除してから再作成
- インデックスが既に存在する場合、`CREATE INDEX IF NOT EXISTS`を使用

### Q: パスコードが表示されない

A: 以下を確認してください：
- ログイン時にsessionStorageに保存されているか（開発者ツールで確認）
- JavaScript Consoleにエラーが出ていないか確認
- ブラウザがsessionStorageをサポートしているか確認

## まとめ

この修正により：

1. ✅ データベーススキーマが明確化され、将来の拡張が容易になった
2. ✅ インデックスの追加によりパフォーマンスが向上
3. ✅ ユーザーが自分のログインIDを常に確認できるようになった
4. ✅ ドキュメントが整備され、メンテナンスが容易になった

これらの改善により、アプリケーションの使いやすさとセキュリティが向上しました。
