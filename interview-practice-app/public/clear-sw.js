// Service Worker とキャッシュをクリアするスクリプト
console.log('Service Worker と キャッシュをクリア中...');

// Service Worker の登録解除
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('Service Worker 登録解除:', registration);
      registration.unregister();
    }
  });
}

// すべてのキャッシュを削除
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('キャッシュ削除:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('すべてのキャッシュが削除されました');
  });
}

// ローカルストレージとセッションストレージをクリア
localStorage.clear();
sessionStorage.clear();

console.log('クリーンアップ完了！ページをリロードしてください。');

// 3秒後に自動リロード
setTimeout(function() {
  window.location.reload();
}, 3000);