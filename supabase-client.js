/**
 * Supabaseクライアント設定
 * 機能: SupabaseとのAPI通信を管理
 * 作成理由: バックエンドとの連携を一元化するため
 */

// Supabase設定（実際の値に置き換えた
const SUPABASE_URL = 'https://fszwbvhvfjarbtcacwvb.supabase.co'; // 例: 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzendidmh2ZmphcmJ0Y2Fjd3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NjI0NTEsImV4cCI6MjA3ODMzODQ1MX0.fkdJcgzH8ur3SQ2Efw2TJSlha8KAjQ5GiYuigRz-7wk'; // Supabaseプロジェクトの Anon Key

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
 * 1日の新規ユーザー作成数をチェック
 * 機能: 24時間以内に作成されたユーザー数をカウント
 * 作成理由: 1日3つまでの制限を実装するため
 * 
 * @returns {number} 本日作成されたユーザー数
 */
async function checkDailyUserCreationLimit() {
    try {
        // 24時間前の日時を計算
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        const oneDayAgoISO = oneDayAgo.toISOString();
        
        // 24時間以内に作成されたユーザーを検索
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/users?created_at=gte.${oneDayAgoISO}&select=id`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!response.ok) {
            console.error('ユーザー数チェックに失敗しました');
            return 0;
        }

        const users = await response.json();
        return users.length;
    } catch (error) {
        console.error('制限チェックエラー:', error);
        return 0;
    }
}

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
            // 新規ユーザー作成の制限をチェック
            const dailyCount = await checkDailyUserCreationLimit();
            if (dailyCount >= 3) {
                return {
                    success: false,
                    message: '1日の新規パスキー作成上限（3つ）に達しました。明日以降に再度お試しください。'
                };
            }

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
 * ブラウザとデバイス情報を取得
 * 機能: ユーザーエージェントからブラウザ、OS、デバイス情報を抽出
 * 作成理由: アクセスログに詳細な接続元情報を記録するため
 * 
 * @returns {Object} ブラウザとデバイス情報
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // ブラウザ検出
    if (ua.indexOf('Firefox') > -1) {
        browser = 'Firefox';
    } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
        browser = 'Chrome';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
        browser = 'Safari';
    } else if (ua.indexOf('Edg') > -1) {
        browser = 'Edge';
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
        browser = 'Opera';
    }

    // OS検出
    if (ua.indexOf('Windows') > -1) {
        os = 'Windows';
    } else if (ua.indexOf('Mac') > -1) {
        os = 'macOS';
    } else if (ua.indexOf('Linux') > -1) {
        os = 'Linux';
    } else if (ua.indexOf('Android') > -1) {
        os = 'Android';
        device = 'Mobile';
    } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
        os = 'iOS';
        device = ua.indexOf('iPad') > -1 ? 'Tablet' : 'Mobile';
    }

    // タブレット検出（Androidの場合）
    if (os === 'Android' && ua.indexOf('Mobile') === -1) {
        device = 'Tablet';
    }

    return {
        browser: browser,
        os: os,
        device: device,
        userAgent: ua
    };
}

/**
 * IPアドレスを取得（サードパーティAPIを使用）
 * 機能: クライアントのIPアドレスを取得
 * 作成理由: アクセスログに接続元IPを記録するため
 * 
 * @returns {string} IPアドレス（取得失敗時は'Unknown'）
 */
async function getIpAddress() {
    try {
        // 複数のAPIを試す（フォールバック機能）
        const apis = [
            'https://api.ipify.org?format=json',
            'https://api64.ipify.org?format=json'
        ];

        for (const api of apis) {
            try {
                const response = await fetch(api);
                if (response.ok) {
                    const data = await response.json();
                    return data.ip || 'Unknown';
                }
            } catch (e) {
                continue;
            }
        }
        return 'Unknown';
    } catch (error) {
        console.error('IP取得エラー:', error);
        return 'Unknown';
    }
}

/**
 * アクセスログを記録
 * 機能: ユーザーの行動を記録（接続元情報を含む）
 * 作成理由: セキュリティとアクティビティ追跡のため
 * 
 * @param {string} userId - ユーザーID
 * @param {string} noteId - メモID
 * @param {string} action - アクション（閲覧、編集など）
 * @returns {boolean} 成功したかどうか
 */
async function logAccess(userId, noteId, action) {
    try {
        // ブラウザ情報を取得
        const browserInfo = getBrowserInfo();
        
        // IPアドレスを取得（非同期で、失敗しても続行）
        let ipAddress = 'Unknown';
        try {
            ipAddress = await getIpAddress();
        } catch (e) {
            console.warn('IP取得に失敗しました', e);
        }

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/access_logs`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    user_id: userId,
                    note_id: noteId,
                    action: action,
                    ip_address: ipAddress,
                    user_agent: browserInfo.userAgent,
                    browser: browserInfo.browser,
                    os: browserInfo.os,
                    device: browserInfo.device
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

/**
 * ユーザーの全メモを削除
 * 機能: ユーザーに紐づくすべてのメモを削除
 * 作成理由: ユーザーがすべてのメモを一括削除できるようにするため
 * 
 * @param {string} userId - ユーザーID
 * @returns {Object} 結果オブジェクト { success, message, deletedCount }
 */
async function deleteAllNotes(userId) {
    try {
        // まず、削除するメモの数を取得
        const countResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}&select=id`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!countResponse.ok) {
            throw new Error('メモの取得に失敗しました');
        }

        const notes = await countResponse.json();
        const deletedCount = notes.length;

        if (deletedCount === 0) {
            return {
                success: true,
                message: '削除するメモがありません',
                deletedCount: 0
            };
        }

        // すべてのメモを削除
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}`,
            {
                method: 'DELETE',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error('メモの削除に失敗しました');
        }

        return {
            success: true,
            message: `${deletedCount}件のメモを削除しました`,
            deletedCount: deletedCount
        };
    } catch (error) {
        console.error('全メモ削除エラー:', error);
        return {
            success: false,
            message: error.message,
            deletedCount: 0
        };
    }
}

/**
 * ユーザーアカウントと関連データをすべて削除
 * 機能: ユーザー、メモ、アクセスログをすべて削除
 * 作成理由: ユーザーがアカウントを完全に削除できるようにするため
 * 
 * @param {string} userId - ユーザーID
 * @returns {Object} 結果オブジェクト { success, message }
 */
async function deleteUserAccount(userId) {
    try {
        // ユーザーを削除（CASCADE設定により、メモとログも自動的に削除される）
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
            {
                method: 'DELETE',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error('アカウント削除に失敗しました');
        }

        return {
            success: true,
            message: 'アカウントとすべてのデータを削除しました'
        };
    } catch (error) {
        console.error('アカウント削除エラー:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * 古いアクセスログを削除（14日より前のログ）
 * 機能: 指定したユーザーの14日以前のアクセスログを削除
 * 作成理由: ログデータの肥大化を防ぐため
 * 
 * @param {string} userId - ユーザーID
 * @returns {Object} 結果オブジェクト { success, message, deletedCount }
 */
async function deleteOldLogs(userId) {
    try {
        // 14日前の日時を計算
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const fourteenDaysAgoISO = fourteenDaysAgo.toISOString();
        
        // まず、削除するログの数を取得
        const countResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/access_logs?user_id=eq.${userId}&created_at=lt.${fourteenDaysAgoISO}&select=id`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!countResponse.ok) {
            throw new Error('ログの取得に失敗しました');
        }

        const logs = await countResponse.json();
        const deletedCount = logs.length;

        if (deletedCount === 0) {
            return {
                success: true,
                message: '削除する古いログがありません',
                deletedCount: 0
            };
        }

        // 14日より前のログを削除
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/access_logs?user_id=eq.${userId}&created_at=lt.${fourteenDaysAgoISO}`,
            {
                method: 'DELETE',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error('ログの削除に失敗しました');
        }

        return {
            success: true,
            message: `${deletedCount}件の古いログを削除しました`,
            deletedCount: deletedCount
        };
    } catch (error) {
        console.error('古いログ削除エラー:', error);
        return {
            success: false,
            message: error.message,
            deletedCount: 0
        };
    }
}
