// 🚀 ナビゲーション動作テスト
const fetch = require('node-fetch');

async function testNavigation() {
  console.log('🧪 ナビゲーション動作確認テスト');
  console.log('==============================');
  
  const pages = [
    { name: 'ダッシュボード', path: '/', expectedTitle: 'Qonect' },
    { name: '音声練習ページ', path: '/interview', expectedContent: '面接練習' }
  ];
  
  for (const page of pages) {
    console.log(`\n📋 ${page.name}のテスト`);
    console.log('─'.repeat(30));
    
    try {
      const response = await fetch(`http://localhost:3004${page.path}`);
      
      if (response.ok) {
        const html = await response.text();
        const hasContent = html.includes(page.expectedTitle) || html.includes('面接');
        
        console.log(`✅ ${page.name}: ${response.status} OK`);
        console.log(`📄 コンテンツ確認: ${hasContent ? '✅ 正常' : '⚠️ 内容不明'}`);
        
        // リダイレクトチェック
        if (response.url !== `http://localhost:3004${page.path}`) {
          console.log(`🔄 リダイレクト: ${response.url}`);
        }
        
      } else if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('location');
        console.log(`🔄 ${page.name}: ${response.status} リダイレクト → ${location}`);
        
      } else {
        console.log(`❌ ${page.name}: ${response.status} エラー`);
      }
      
    } catch (error) {
      console.log(`❌ ${page.name}: 接続エラー - ${error.message}`);
    }
  }
  
  console.log('\n🏁 ナビゲーションテスト完了');
}

testNavigation();