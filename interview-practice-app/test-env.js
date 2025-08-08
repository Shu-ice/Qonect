// 環境変数テストファイル
const fs = require('fs');
const path = require('path');

// .envファイルを手動で読み込み
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContents = fs.readFileSync(envPath, 'utf8');
  const lines = envContents.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

console.log('Environment Variables Test:');
console.log('GOOGLE_GENERATIVE_AI_API_KEY:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Set' : 'Not Set');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.log('API Key prefix:', process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 20) + '...');
}