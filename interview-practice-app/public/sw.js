// Service Worker for Interview Practice App
// 面接練習アプリ専用のService Worker

const CACHE_NAME = 'interview-practice-v1';
const STATIC_CACHE_NAME = 'interview-practice-static-v1';
const DYNAMIC_CACHE_NAME = 'interview-practice-dynamic-v1';

// キャッシュする静的リソース
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // フォント
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
];

// キャッシュしないURL（動的コンテンツ）
const NEVER_CACHE = [
  '/api/auth',
  '/api/session',
  '/api/interview/live',
];

// オフライン時に表示するページ
const OFFLINE_PAGE = '/offline';

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // 静的アセットをキャッシュ
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // 即座にアクティベート
      self.skipWaiting()
    ])
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // すべてのクライアントでService Workerをアクティベート
      self.clients.claim()
    ])
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIリクエストの処理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 静的アセット・ページの処理
  event.respondWith(handleStaticRequest(request));
});

// APIリクエストの処理
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // 絶対にキャッシュしないエンドポイント
  if (NEVER_CACHE.some(path => url.pathname.startsWith(path))) {
    try {
      return await fetch(request);
    } catch (error) {
      console.error('Service Worker: API request failed', error);
      return new Response(
        JSON.stringify({ error: 'ネットワークエラーが発生しました' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // AIリクエストなど重要な処理
  if (url.pathname.includes('/ai/') || url.pathname.includes('/speech/')) {
    return handleImportantApiRequest(request);
  }

  // 通常のAPIリクエスト（Network First戦略）
  try {
    const networkResponse = await fetch(request);
    
    // 成功した場合はキャッシュに保存
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // ネットワークエラー時はキャッシュから取得
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // キャッシュもない場合はエラーレスポンス
    return new Response(
      JSON.stringify({ error: 'オフラインです。ネットワーク接続を確認してください。' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 重要なAPIリクエストの処理（AI、音声認識など）
async function handleImportantApiRequest(request) {
  try {
    // ネットワーク優先、タイムアウト付き
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Important API request failed', error);
    
    // タイムアウトまたはネットワークエラー
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'リクエストがタイムアウトしました。もう一度お試しください。' }),
        {
          status: 408,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'サービスが一時的に利用できません。' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 静的リクエストの処理
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  
  // キャッシュ優先戦略
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    // HTMLページとアセットをキャッシュ
    if (networkResponse.ok) {
      const cache = await caches.open(
        request.destination === 'document' ? DYNAMIC_CACHE_NAME : STATIC_CACHE_NAME
      );
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Static request failed', error);
    
    // HTMLページの場合はオフラインページを表示
    if (request.destination === 'document') {
      const offlineResponse = await caches.match(OFFLINE_PAGE);
      if (offlineResponse) {
        return offlineResponse;
      }
      
      // オフラインページもない場合は基本的なHTMLを返す
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>オフライン - 面接練習アプリ</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 400px;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; }
            p { margin-bottom: 1.5rem; line-height: 1.6; }
            button {
              background: rgba(255, 255, 255, 0.2);
              border: 2px solid rgba(255, 255, 255, 0.3);
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              transition: all 0.3s;
            }
            button:hover {
              background: rgba(255, 255, 255, 0.3);
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 オフラインです</h1>
            <p>インターネット接続を確認して、もう一度お試しください。</p>
            <button onclick="location.reload()">再試行</button>
          </div>
        </body>
        </html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=UTF-8' }
        }
      );
    }
    
    // その他のリソースの場合は404
    return new Response('リソースが見つかりません', { status: 404 });
  }
}

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'practice-session-sync') {
    event.waitUntil(syncPracticeSessions());
  }
});

// 練習セッションの同期
async function syncPracticeSessions() {
  try {
    // IndexedDBから未送信のセッションデータを取得
    const unsyncedSessions = await getUnsyncedSessions();
    
    for (const session of unsyncedSessions) {
      try {
        const response = await fetch('/api/sessions/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session)
        });
        
        if (response.ok) {
          await markSessionAsSynced(session.id);
        }
      } catch (error) {
        console.error('Failed to sync session:', session.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'general',
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知のクリック処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 同じURLのタブが既に開いている場合はそれにフォーカス
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 新しいタブで開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// メッセージイベントの処理
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        data: getCacheStatus()
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// キャッシュ状態の取得
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

// すべてのキャッシュをクリア
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// IndexedDB関連のヘルパー関数（簡略版）
async function getUnsyncedSessions() {
  // 実装省略：IndexedDBから未同期セッションを取得
  return [];
}

async function markSessionAsSynced(sessionId) {
  // 実装省略：セッションを同期済みとしてマーク
  return true;
}