// 簡単なテストユーザー作成スクリプト
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  // テスト用志望校作成
  await prisma.targetSchool.upsert({
    where: { id: 'meiwa-test' },
    create: {
      id: 'meiwa-test',
      name: '明和高等学校附属中学校',
      type: 'public_integrated', 
      prefecture: '愛知県',
      evaluationCriteria: { test: 'data' },
      questionPatterns: { test: ['テスト質問'] },
    },
    update: {}
  });

  // テストユーザー作成
  await prisma.user.upsert({
    where: { email: 'test@meiwa.com' },
    create: {
      email: 'test@meiwa.com',
      studentName: 'テスト太郎',
      grade: 6,
      parentConsent: true,
      consentDate: new Date(),
      dataRetentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      targetSchoolId: 'meiwa-test',
    },
    update: {
      parentConsent: true,
    }
  });

  console.log('テストユーザー作成完了！');
  console.log('Email: test@meiwa.com');
  console.log('Password: test123');
}

main().finally(() => prisma.$disconnect());