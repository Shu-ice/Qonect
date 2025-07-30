// 開発環境では Service Worker を無効化
console.log('Service Worker を無効化しています...');

// Service Worker が登録されている場合は削除
self.addEventListener('install', function(event) {
  console.log('Service Worker: インストールをスキップしています');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker: アクティベーション中');
  event.waitUntil(
    Promise.all([
      // 既存のキャッシュをクリア
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('Service Worker: キャッシュを削除中:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // すべてのクライアントに制御を転送
      self.clients.claim()
    ])
  );
});

// フェッチイベントは素通しさせる（キャッシュしない）
self.addEventListener('fetch', function(event) {
  // ネットワークから直接取得
  event.respondWith(fetch(event.request));
});

// バックグラウンド同期は無効化
self.addEventListener('sync', function(event) {
  console.log('Service Worker: バックグラウンド同期は無効化されています');
});

// プッシュ通知は無効化
self.addEventListener('push', function(event) {
  console.log('Service Worker: プッシュ通知は無効化されています');
});

console.log('Service Worker: 開発モードで起動完了');