/**
 * アプリケーション共通ユーティリティ
 * 機能: 共通機能とヘルパー関数
 * 作成理由: コードの再利用性を高めるため
 */

/**
 * セッション管理: ログイン状態をチェック
 * 機能: ユーザーがログインしているか確認
 * 作成理由: 未ログイン状態での不正アクセスを防ぐため
 * 
 * @returns {boolean} ログインしているかどうか
 */
function isLoggedIn() {
    return sessionStorage.getItem('userId') !== null;
}

/**
 * ユーザーIDを取得
 * 機能: セッションストレージからユーザーIDを取得
 * 作成理由: 各API呼び出しでユーザーIDが必要なため
 * 
 * @returns {string|null} ユーザーID
 */
function getCurrentUserId() {
    return sessionStorage.getItem('userId');
}

/**
 * エラーハンドリング: エラーメッセージを表示
 * 機能: ユーザーフレンドリーなエラー表示
 * 作成理由: エラー時にユーザーに適切なフィードバックを提供するため
 * 
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
    console.error('エラー:', message);
    alert(message);
}

/**
 * 成功メッセージを表示
 * 機能: 操作成功時のフィードバック
 * 作成理由: ユーザーに操作の成功を知らせるため
 * 
 * @param {string} message - 成功メッセージ
 */
function showSuccess(message) {
    console.log('成功:', message);
}

/**
 * テキストのサニタイズ
 * 機能: XSS攻撃を防ぐためHTMLをエスケープ
 * 作成理由: セキュリティ対策のため
 * 
 * @param {string} text - サニタイズするテキスト
 * @returns {string} エスケープされたテキスト
 */
function sanitizeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 日付フォーマット
 * 機能: ISO日付を日本語形式に変換
 * 作成理由: ユーザーに分かりやすい日時表示を提供するため
 * 
 * @param {string} isoString - ISO形式の日付文字列
 * @returns {string} フォーマットされた日付文字列
 */
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * ローカルストレージの管理
 * 機能: 設定やキャッシュデータをローカルに保存
 * 作成理由: オフライン対応と高速化のため
 */
const localStorageManager = {
    /**
     * データを保存
     * 
     * @param {string} key - キー
     * @param {any} value - 値
     */
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('ローカルストレージ保存エラー:', error);
        }
    },

    /**
     * データを取得
     * 
     * @param {string} key - キー
     * @returns {any} 値
     */
    get: function(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('ローカルストレージ取得エラー:', error);
            return null;
        }
    },

    /**
     * データを削除
     * 
     * @param {string} key - キー
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('ローカルストレージ削除エラー:', error);
        }
    },

    /**
     * すべてのデータをクリア
     */
    clear: function() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('ローカルストレージクリアエラー:', error);
        }
    }
};

/**
 * デバウンス関数
 * 機能: 連続した関数呼び出しを制限
 * 作成理由: 検索や自動保存などのパフォーマンス最適化のため
 * 
 * @param {Function} func - デバウンスする関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Markdown関連のヘルパー
 * 機能: Markdownの処理を支援
 * 作成理由: Markdown機能を拡張するため
 */
const markdownHelper = {
    /**
     * Markdownをプレビュー
     * 
     * @param {string} markdown - Markdownテキスト
     * @returns {string} HTMLに変換されたテキスト
     */
    preview: function(markdown) {
        if (typeof marked !== 'undefined') {
            return marked.parse(markdown || '');
        }
        // markedが利用できない場合は単純にエスケープして返す
        return sanitizeHtml(markdown || '').replace(/\n/g, '<br>');
    },

    /**
     * 基本的なMarkdown構文を挿入
     * 
     * @param {HTMLTextAreaElement} textarea - テキストエリア要素
     * @param {string} type - 挿入する構文タイプ
     */
    insertSyntax: function(textarea, type) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let replacement = '';

        switch(type) {
            case 'bold':
                replacement = `**${selectedText || 'テキスト'}**`;
                break;
            case 'italic':
                replacement = `*${selectedText || 'テキスト'}*`;
                break;
            case 'heading':
                replacement = `## ${selectedText || '見出し'}`;
                break;
            case 'link':
                replacement = `[${selectedText || 'リンクテキスト'}](URL)`;
                break;
            case 'list':
                replacement = `- ${selectedText || 'リスト項目'}`;
                break;
            case 'code':
                replacement = `\`${selectedText || 'コード'}\``;
                break;
            case 'codeblock':
                replacement = `\`\`\`\n${selectedText || 'コードブロック'}\n\`\`\``;
                break;
            default:
                return;
        }

        textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
        textarea.focus();
        textarea.selectionStart = start;
        textarea.selectionEnd = start + replacement.length;
    }
};

/**
 * バリデーション関数
 * 機能: 入力値の妥当性を検証
 * 作成理由: データの整合性を保つため
 */
const validator = {
    /**
     * パスコードの妥当性を検証
     * 
     * @param {string} passcode - パスコード
     * @returns {Object} 検証結果 { isValid, message }
     */
    validatePasscode: function(passcode) {
        if (!passcode) {
            return { isValid: false, message: 'パスコードを入力してください' };
        }
        if (passcode.length !== 12) {
            return { isValid: false, message: 'パスコードは12桁で入力してください' };
        }
        if (!/^[0-9A-Z]{12}$/i.test(passcode)) {
            return { isValid: false, message: 'パスコードは英数字(0-9, A-Z)のみで入力してください' };
        }
        return { isValid: true, message: '' };
    },

    /**
     * メモタイトルの妥当性を検証
     * 
     * @param {string} title - タイトル
     * @returns {Object} 検証結果 { isValid, message }
     */
    validateNoteTitle: function(title) {
        if (!title || title.trim() === '') {
            return { isValid: false, message: 'タイトルを入力してください' };
        }
        if (title.length > 200) {
            return { isValid: false, message: 'タイトルは200文字以内で入力してください' };
        }
        return { isValid: true, message: '' };
    }
};
