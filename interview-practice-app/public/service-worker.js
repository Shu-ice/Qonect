// 明和面接練習アプリ - Service Worker
// オフライン対応、キャッシュ戦略、バックグラウンド同期

const CACHE_NAME = 'meiwa-interview-v1';
const OFFLINE_PAGE = '/offline';

// キャッシュするリソース
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // 基本的なページ
  '/dashboard',
  '/practice',
  '/essay',
  '/profile',
  // 重要なAPI
  '/api/health',
];

// 動的キャッシュの設定
const RUNTIME_CACHE = {
  // 画像：Cache First
  images: {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    strategy: 'CacheFirst',
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
    },
  },
  
  // API：Network First
  api: {
    urlPattern: /^https:\/\/.*\/api\/.*/,
    strategy: 'NetworkFirst',
    cacheName: 'api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60, // 1時間
    },
  },
  
  // 静的ファイル：Stale While Revalidate
  static: {
    urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
    strategy: 'StaleWhileRevalidate',
    cacheName: 'static-cache',
    expiration: {
      maxEntries: 60,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7日
    },
  },

  // ページ：Network First with offline fallback
  pages: {
    urlPattern: /^https:\/\/.*\//,
    strategy: 'NetworkFirst',
    cacheName: 'pages-cache',
    expiration: {
      maxEntries: 30,
      maxAgeSeconds: 24 * 60 * 60, // 1日
    },
  },
};

// Service Worker インストール
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Service Worker アクティベーション
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // 古いキャッシュの削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && !cacheName.endsWith('-cache')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // すべてのクライアントを制御
      self.clients.claim(),
    ])
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Chrome拡張機能のリクエストは無視
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // POSTリクエストなど、キャッシュしないリクエスト
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    handleRequest(request)
  );
});

// リクエスト処理の中核
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // キャッシュ戦略の適用
    const cacheStrategy = getCacheStrategy(url);
    
    switch (cacheStrategy.strategy) {
      case 'CacheFirst':
        return await cacheFirst(request, cacheStrategy);
      case 'NetworkFirst':
        return await networkFirst(request, cacheStrategy);
      case 'StaleWhileRevalidate':
        return await staleWhileRevalidate(request, cacheStrategy);
      default:
        return await networkFirst(request, cacheStrategy);
    }
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    return await getOfflineFallback(request);
  }
}

// キャッシュ戦略の決定
function getCacheStrategy(url) {
  // 画像ファイル
  if (RUNTIME_CACHE.images.urlPattern.test(url.pathname)) {
    return RUNTIME_CACHE.images;
  }
  
  // APIエンドポイント
  if (RUNTIME_CACHE.api.urlPattern.test(url.href)) {
    return RUNTIME_CACHE.api;
  }
  
  // 静的ファイル
  if (RUNTIME_CACHE.static.urlPattern.test(url.pathname)) {
    return RUNTIME_CACHE.static;
  }
  
  // ページ
  return RUNTIME_CACHE.pages;
}

// Cache First 戦略
async function cacheFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Cache First fallback:', error);
    return new Response('リソースを読み込めませんでした', { status: 404 });
  }
}

// Network First 戦略
async function networkFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network First fallback to cache:', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return await getOfflineFallback(request);
  }
}

// Stale While Revalidate 戦略
async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  // バックグラウンドでネットワークから更新
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // ネットワークエラーは無視
  });
  
  // キャッシュがあればそれを返し、なければネットワークを待つ
  return cachedResponse || await networkResponsePromise;
}

// オフライン時のフォールバック
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // HTMLページの場合はオフラインページを返す
  if (request.destination === 'document') {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(OFFLINE_PAGE) || new Response('オフラインです', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
  
  // その他のリソース
  return new Response('リソースが利用できません', { 
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// バックグラウンド同期の実行
async function doBackgroundSync() {
  try {
    // オフライン時に保存されたデータを同期
    const offlineData = await getOfflineData();
    
    for (const data of offlineData) {
      try {
        await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body,
        });
        
        // 同期済みデータを削除
        await removeOfflineData(data.id);
      } catch (error) {
        console.warn('[SW] Background sync failed for:', data.url);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// オフラインデータの取得
async function getOfflineData() {
  // IndexedDBまたはlocalStorageからオフラインデータを取得
  // 実装は具体的な要件に応じて調整
  return [];
}

// オフラインデータの削除
async function removeOfflineData(id) {
  // 同期済みデータを削除
}

// プッシュ通知
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    title: '明和面接練習アプリ',
    body: event.data ? event.data.text() : 'お知らせがあります',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: '開く',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icons/action-close.png'
      }
    ],
    requireInteraction: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// エラーハンドリング
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event);
});

// デバッグ用：キャッシュ状況の確認
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'CACHE_STATUS') {
    const cacheNames = await caches.keys();
    const cacheStatus = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheStatus[cacheName] = keys.length;
    }
    
    event.ports[0].postMessage({
      type: 'CACHE_STATUS_RESULT',
      cacheStatus,
    });
  }
});