// 志願理由書サンプル作成スクリプト（簡単版）
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  // テストユーザーを確認
  const user = await prisma.user.findUnique({
    where: { email: 'test@meiwa.com' }
  });

  if (!user) {
    console.log('テストユーザーが見つかりません');
    return;
  }

  // サンプル志願理由書を作成
  await prisma.essay.upsert({
    where: { id: 'essay-test-001' },
    create: {
      id: 'essay-test-001',
      userId: user.id,
      motivation: '私は明和高校附属中学校で探究活動を深めたいと考えています。小学校で取り組んだ環境問題の研究を通して、もっと深く学びたいという気持ちが強くなりました。',
      research: '私は小学4年生から地域の川の水質調査を続けています。最初は自由研究のつもりでしたが、調査を続けるうちに季節による変化や、上流と下流での違いに気づきました。',
      schoolLife: '明和中学校では、同じように探究心を持つ仲間と一緒に学び、お互いを高め合いたいです。また、先生方からの指導を受けながら、より科学的なアプローチで研究を進めたいと思います。',
      future: '将来は環境問題の解決に貢献できる研究者になりたいです。地域の環境を守り、次の世代にきれいな地球を残せるような仕事をしたいと考えています。',
      researchTopic: '地域の川の水質調査と環境保護',
      characterCount: 400,
    },
    update: {
      characterCount: 400,
    }
  });

  console.log('サンプル志願理由書作成完了！');
}

main().finally(() => prisma.$disconnect());