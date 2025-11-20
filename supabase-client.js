/**
 * Supabaseクライアント設定
 * 機能: SupabaseとのAPI通信を管理
 * 作成理由: バックエンドとの連携を一元化するため
 */

// Supabase設定（実際の値に置き換えてください）
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; // 例: 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Supabaseプロジェクトの Anon Key

/**
 * Supabase APIリクエストヘッダー
 * 機能: API呼び出し時に使用する共通ヘッダー
 * 作成理由: 認証情報を含むヘッダーを統一するため
 */
const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

/**
 * ログイン処理
 * 機能: パスコードでユーザーを認証または新規作成
 * 作成理由: ユーザーがパスコードでシステムにアクセスできるようにするため
 * 
 * @param {string} passcode - 12桁のパスコード
 * @returns {Object} 結果オブジェクト { success, userId, message }
 */
async function login(passcode) {
    try {
        // 既存ユーザーを検索
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/users?passcode=eq.${passcode}`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error('ユーザー検索に失敗しました');
        }

        const users = await response.json();

        if (users.length > 0) {
            // 既存ユーザーでログイン
            return {
                success: true,
                userId: users[0].id,
                message: '既存ユーザーでログインしました'
            };
        } else {
            // 新規ユーザーを作成
            const createResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/users`,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ passcode: passcode })
                }
            );

            if (!createResponse.ok) {
                throw new Error('ユーザー作成に失敗しました');
            }

            const newUsers = await createResponse.json();
            
            return {
                success: true,
                userId: newUsers[0].id,
                message: '新規ユーザーを作成しました'
            };
        }
    } catch (error) {
        console.error('ログインエラー:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * メモ一覧を取得
 * 機能: ユーザーのメモをすべて取得
 * 作成理由: ユーザーが作成したメモを表示するため
 * 
 * @param {string} userId - ユーザーID
 * @returns {Array} メモの配列
 */
async function getNotes(userId) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}&order=updated_at.desc`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error('メモ取得に失敗しました');
        }

        return await response.json();
    } catch (error) {
        console.error('メモ取得エラー:', error);
        return [];
    }
}

/**
 * メモを作成
 * 機能: 新しいメモを作成
 * 作成理由: ユーザーが新規メモを追加できるようにするため
 * 
 * @param {string} userId - ユーザーID
 * @param {string} title - メモのタイトル
 * @param {string} content - メモの内容
 * @returns {Object|null} 作成されたメモ
 */
async function createNote(userId, title, content) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/notes`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    user_id: userId,
                    title: title,
                    content: content || ''
                })
            }
        );

        if (!response.ok) {
            throw new Error('メモ作成に失敗しました');
        }

        const notes = await response.json();
        return notes[0];
    } catch (error) {
        console.error('メモ作成エラー:', error);
        return null;
    }
}

/**
 * メモを更新
 * 機能: 既存メモの内容を更新
 * 作成理由: ユーザーがメモを編集できるようにするため
 * 
 * @param {string} noteId - メモID
 * @param {string} title - 新しいタイトル
 * @param {string} content - 新しい内容
 * @returns {boolean} 成功したかどうか
 */
async function updateNote(noteId, title, content) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/notes?id=eq.${noteId}`,
            {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({
                    title: title,
                    content: content,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!response.ok) {
            throw new Error('メモ更新に失敗しました');
        }

        return true;
    } catch (error) {
        console.error('メモ更新エラー:', error);
        return false;
    }
}

/**
 * メモを削除
 * 機能: メモを削除
 * 作成理由: ユーザーが不要なメモを削除できるようにするため
 * 
 * @param {string} noteId - メモID
 * @returns {boolean} 成功したかどうか
 */
async function deleteNoteById(noteId) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/notes?id=eq.${noteId}`,
            {
                method: 'DELETE',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error('メモ削除に失敗しました');
        }

        return true;
    } catch (error) {
        console.error('メモ削除エラー:', error);
        return false;
    }
}

/**
 * アクセスログを記録
 * 機能: ユーザーの行動を記録
 * 作成理由: セキュリティとアクティビティ追跡のため
 * 
 * @param {string} userId - ユーザーID
 * @param {string} noteId - メモID
 * @param {string} action - アクション（閲覧、編集など）
 * @returns {boolean} 成功したかどうか
 */
async function logAccess(userId, noteId, action) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/access_logs`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    user_id: userId,
                    note_id: noteId,
                    action: action
                })
            }
        );

        if (!response.ok) {
            throw new Error('ログ記録に失敗しました');
        }

        return true;
    } catch (error) {
        console.error('ログ記録エラー:', error);
        return false;
    }
}

/**
 * アクセスログを取得
 * 機能: ユーザーのアクセス履歴を取得
 * 作成理由: アクティビティ履歴を表示するため
 * 
 * @param {string} userId - ユーザーID
 * @returns {Array} アクセスログの配列
 */
async function getAccessLog(userId) {
    try {
        // アクセスログとメモのタイトルを結合して取得
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/access_logs?user_id=eq.${userId}&order=created_at.desc&limit=50`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error('アクセスログ取得に失敗しました');
        }

        const logs = await response.json();

        // 各ログにメモのタイトルを追加
        const logsWithTitles = await Promise.all(
            logs.map(async (log) => {
                try {
                    const noteResponse = await fetch(
                        `${SUPABASE_URL}/rest/v1/notes?id=eq.${log.note_id}`,
                        {
                            method: 'GET',
                            headers: headers
                        }
                    );

                    if (noteResponse.ok) {
                        const notes = await noteResponse.json();
                        if (notes.length > 0) {
                            log.note_title = notes[0].title;
                        }
                    }
                } catch (error) {
                    console.error('メモタイトル取得エラー:', error);
                }
                return log;
            })
        );

        return logsWithTitles;
    } catch (error) {
        console.error('アクセスログ取得エラー:', error);
        return [];
    }
}

/**
 * パスコードを更新
 * 機能: ユーザーのパスコードを変更
 * 作成理由: セキュリティ維持のためパスコード変更を可能にするため
 * 
 * @param {string} userId - ユーザーID
 * @param {string} newPasscode - 新しいパスコード
 * @returns {Object} 結果オブジェクト { success, message }
 */
async function updatePasscode(userId, newPasscode) {
    try {
        // 新しいパスコードが既に存在するかチェック
        const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users?passcode=eq.${newPasscode}`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!checkResponse.ok) {
            throw new Error('パスコード確認に失敗しました');
        }

        const existingUsers = await checkResponse.json();
        
        if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
            return {
                success: false,
                message: 'このパスコードは既に使用されています'
            };
        }

        // パスコードを更新
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
            {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({
                    passcode: newPasscode
                })
            }
        );

        if (!response.ok) {
            throw new Error('パスコード更新に失敗しました');
        }

        return {
            success: true,
            message: 'パスコードを変更しました'
        };
    } catch (error) {
        console.error('パスコード更新エラー:', error);
        return {
            success: false,
            message: error.message
        };
    }
}
