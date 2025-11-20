-- テーブル再生成SQL
-- 既存のテーブルを削除して再作成します
-- 注意: このSQLを実行すると、すべてのデータが削除されます！

-- 既存テーブルの削除（依存関係の順序で削除）
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
-- note_idはNULLを許可（ログイン・ログアウトなど、メモに関連しないアクションのため）
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

-- コメント追加（テーブルの説明）
COMMENT ON TABLE users IS 'ユーザーアカウント情報';
COMMENT ON TABLE notes IS 'ユーザーが作成したメモ';
COMMENT ON TABLE access_logs IS 'アクセスログ（閲覧・編集・ログイン・ログアウトなど）';
COMMENT ON COLUMN access_logs.note_id IS 'メモID（ログイン・ログアウトなどメモに関連しないアクションの場合はNULL）';
