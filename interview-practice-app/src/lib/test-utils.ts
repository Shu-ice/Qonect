/**
 * アプリの主要機能テストユーティリティ
 */

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
}

// サーバー接続テスト
export async function testServerConnection(): Promise<TestResult> {
  const start = performance.now();
  
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-cache'
    });
    
    const duration = performance.now() - start;
    
    if (!response.ok) {
      return {
        name: 'サーバー接続',
        status: 'fail',
        message: `サーバーエラー: ${response.status}`,
        duration
      };
    }
    
    const health = await response.json();
    
    return {
      name: 'サーバー接続',
      status: health.status === 'healthy' ? 'pass' : 'warning',
      message: `応答時間: ${Math.round(duration)}ms, 状態: ${health.status}`,
      duration
    };
  } catch (error) {
    return {
      name: 'サーバー接続',
      status: 'fail',
      message: `接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
      duration: performance.now() - start
    };
  }
}

// Web Speech API テスト
export async function testWebSpeechAPI(): Promise<TestResult> {
  try {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return {
        name: '音声認識API',
        status: 'fail',
        message: 'Web Speech APIがサポートされていません'
      };
    }
    
    // 権限テスト
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      return {
        name: '音声認識API',
        status: 'pass',
        message: 'マイクアクセス許可済み'
      };
    } catch (permissionError) {
      return {
        name: '音声認識API',
        status: 'warning',
        message: 'マイクアクセス未許可'
      };
    }
  } catch (error) {
    return {
      name: '音声認識API',
      status: 'fail',
      message: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

// ローカルストレージテスト
export function testLocalStorage(): TestResult {
  try {
    const testKey = 'meiwa-test';
    const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    
    if (retrieved !== testValue) {
      return {
        name: 'ローカルストレージ',
        status: 'fail',
        message: 'データの読み書きに失敗'
      };
    }
    
    localStorage.removeItem(testKey);
    
    return {
      name: 'ローカルストレージ',
      status: 'pass',
      message: '正常に動作しています'
    };
  } catch (error) {
    return {
      name: 'ローカルストレージ',
      status: 'fail',
      message: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

// PWA機能テスト
export function testPWASupport(): TestResult {
  try {
    const isPWACapable = 'serviceWorker' in navigator && 'PushManager' in window;
    
    if (!isPWACapable) {
      return {
        name: 'PWA対応',
        status: 'warning',
        message: 'PWA機能が制限されています'
      };
    }
    
    return {
      name: 'PWA対応',
      status: 'pass',
      message: 'PWA機能が利用可能です'
    };
  } catch (error) {
    return {
      name: 'PWA対応',
      status: 'fail',
      message: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

// レスポンシブデザインテスト
export function testResponsiveDesign(): TestResult {
  try {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let deviceType = 'unknown';
    if (width >= 1024) deviceType = 'desktop';
    else if (width >= 768) deviceType = 'tablet';
    else deviceType = 'mobile';
    
    // タッチサポート確認
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return {
      name: 'レスポンシブデザイン',
      status: 'pass',
      message: `${deviceType} (${width}x${height}) - タッチ: ${hasTouchSupport ? '対応' : '非対応'}`
    };
  } catch (error) {
    return {
      name: 'レスポンシブデザイン',
      status: 'fail',
      message: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

// 全機能テスト実行
export async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // 同期テスト
  results.push(testLocalStorage());
  results.push(testPWASupport());
  results.push(testResponsiveDesign());
  
  // 非同期テスト
  results.push(await testServerConnection());
  results.push(await testWebSpeechAPI());
  
  return results;
}

// パフォーマンステスト
export function testPerformance(): TestResult {
  try {
    if (!('performance' in window)) {
      return {
        name: 'パフォーマンス',
        status: 'warning',
        message: 'パフォーマンス API が利用できません'
      };
    }
    
    const memory = (performance as any).memory;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const loadTime = navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0;
    
    let status: 'pass' | 'warning' | 'fail' = 'pass';
    let message = `読み込み時間: ${loadTime}ms`;
    
    if (memory) {
      const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      message += `, メモリ使用量: ${memoryUsage}MB`;
      
      if (memoryUsage > 50) status = 'warning';
      if (memoryUsage > 100) status = 'fail';
    }
    
    if (loadTime > 3000) status = 'warning';
    if (loadTime > 5000) status = 'fail';
    
    return {
      name: 'パフォーマンス',
      status,
      message,
      duration: loadTime
    };
  } catch (error) {
    return {
      name: 'パフォーマンス',
      status: 'fail',
      message: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}