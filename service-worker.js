/**
 * Service Worker for PWA support
 * 機能: オフラインキャッシュとプッシュ通知のサポート
 * 作成理由: PWAとしての機能を提供するため
 */

const CACHE_NAME = 'memo-share-app-v1';
const urlsToCache = [
  '/note-share-app/',
  '/note-share-app/index.html',
  '/note-share-app/app.html',
  '/note-share-app/logs.html',
  '/note-share-app/style.css',
  '/note-share-app/app.js',
  '/note-share-app/supabase-client.js',
  '/note-share-app/icon-192.png',
  '/note-share-app/icon-512.png',
  '/note-share-app/manifest.json'
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
});

// リクエストをインターセプトしてキャッシュから返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを返し、なければネットワークから取得
        return response || fetch(event.request);
      })
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
