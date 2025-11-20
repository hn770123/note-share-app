-- テーブル変更SQL（既存データを保持）
-- 既存のテーブル構造を修正します
-- 注意: このSQLは既存データを保持したまま変更を適用します

-- access_logsテーブルの確認と修正
-- note_idカラムがNULL可能であることを確認（既にNULL可能な場合、このコマンドはエラーになりません）
ALTER TABLE access_logs ALTER COLUMN note_id DROP NOT NULL;

-- user_idカラムは必須にする
ALTER TABLE access_logs ALTER COLUMN user_id SET NOT NULL;

-- インデックスの追加（存在しない場合のみ作成）
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);

-- テーブルにコメントを追加
COMMENT ON TABLE users IS 'ユーザーアカウント情報';
COMMENT ON TABLE notes IS 'ユーザーが作成したメモ';
COMMENT ON TABLE access_logs IS 'アクセスログ（閲覧・編集・ログイン・ログアウトなど）';
COMMENT ON COLUMN access_logs.note_id IS 'メモID（ログイン・ログアウトなどメモに関連しないアクションの場合はNULL）';
COMMENT ON COLUMN access_logs.user_id IS 'ユーザーID（必須）';
COMMENT ON COLUMN access_logs.action IS 'アクション（例: ログイン, ログアウト, 閲覧, 編集）';
