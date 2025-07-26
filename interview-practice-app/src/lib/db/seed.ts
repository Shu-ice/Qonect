/**
 * データベースシードファイル
 * 開発・テスト用の初期データを作成
 */

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 データベースシード開始...');

  // 既存データをクリーンアップ
  await prisma.realtimeAnalytics.deleteMany();
  await prisma.interviewResponse.deleteMany();
  await prisma.interviewQuestion.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.essay.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.parentCommunication.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.targetSchool.deleteMany();

  console.log('🧹 既存データをクリーンアップしました');

  // 志望校マスターデータ
  const meiwaSchool = await prisma.targetSchool.create({
    data: {
      name: '愛知県立明和高等学校附属中学校',
      type: 'public_integrated',
      prefecture: '愛知県',
      evaluationCriteria: {
        genuineInterest: {
          weight: 0.2,
          description: '探究活動への真の関心',
        },
        experienceBase: {
          weight: 0.15,
          description: '体験に基づく学び',
        },
        socialConnection: {
          weight: 0.15,
          description: '社会との関連性',
        },
        noDefinitiveAnswer: {
          weight: 0.2,
          description: '探究的思考（正解のない問い）',
        },
        otherUnderstanding: {
          weight: 0.1,
          description: '他者理解・説明力',
        },
        selfTransformation: {
          weight: 0.1,
          description: '自己の変容',
        },
        originalExpression: {
          weight: 0.1,
          description: '独自の表現',
        },
      },
      questionPatterns: {
        basic_interest: {
          probability: 0.25,
          examples: [
            'あなたの探究テーマについて教えてください',
            'なぜその分野に興味を持ったのですか',
          ],
        },
        experience_detail: {
          probability: 0.2,
          examples: [
            '具体的にどのような活動をしましたか',
            'その中で印象に残った出来事はありますか',
          ],
        },
        social_awareness: {
          probability: 0.15,
          examples: [
            'あなたの探究が社会にどう役立つと思いますか',
            '普段の生活とどのような関係がありますか',
          ],
        },
        complexity_check: {
          probability: 0.15,
          examples: [
            'この分野に正解はないと思いませんか',
            '異なる視点から見るとどうでしょうか',
          ],
        },
        deep_dive: {
          probability: 0.1,
          examples: [
            'もっと詳しく調べたいことはありますか',
            '新たな疑問は生まれましたか',
          ],
        },
        empathy_test: {
          probability: 0.1,
          examples: [
            'それを知らない人にどう説明しますか',
            '友達にも興味を持ってもらえると思いますか',
          ],
        },
        growth_reflection: {
          probability: 0.05,
          examples: [
            'この活動を通じてあなた自身はどう変わりましたか',
            '以前と比べて考え方が変わったことはありますか',
          ],
        },
      },
      meiwaSpecific: {
        sessionDuration: 900, // 15分
        questionCount: 8,
        focusAreas: ['探究心', '論理的思考', '表現力', '協調性'],
      },
    },
  });

  console.log('✅ 志望校マスターデータを作成しました');

  // テストユーザー作成
  const passwordHash = await hash('password123', 12);
  const dataRetentionUntil = new Date();
  dataRetentionUntil.setFullYear(dataRetentionUntil.getFullYear() + 1);

  const testUser1 = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      passwordHash,
      studentName: '田中 太郎',
      grade: 6,
      targetSchoolId: meiwaSchool.id,
      parentEmail: 'parent1@example.com',
      parentConsent: true,
      consentDate: new Date(),
      dataRetentionUntil,
      accessibilitySettings: {
        highContrast: false,
        fontSize: 'medium',
        furigana: false,
      },
      preferredMascot: 'wise-owl',
      languagePreference: 'ja',
    },
  });

  const testUser2 = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      passwordHash,
      studentName: '佐藤 花子',
      grade: 6,
      targetSchoolId: meiwaSchool.id,
      parentEmail: 'parent2@example.com',
      parentConsent: true,
      consentDate: new Date(),
      dataRetentionUntil,
      accessibilitySettings: {
        highContrast: true,
        fontSize: 'large',
        furigana: true,
      },
      preferredMascot: 'friendly-robot',
      languagePreference: 'ja',
    },
  });

  console.log('✅ テストユーザーを作成しました');

  // サンプル志願理由書
  const essay1 = await prisma.essay.create({
    data: {
      userId: testUser1.id,
      motivation: '私が明和高校附属中学校を志望する理由は、探究的な学習環境で自分の興味を深めたいからです。小学校では、プログラミングクラブに所属し、ゲーム制作や簡単なアプリ開発に取り組んできました。この活動を通して、技術が人々の生活をより便利にする可能性を感じ、将来はITを活用して社会課題を解決したいと考えるようになりました。',
      research: '私は小学校4年生からプログラミングに興味を持ち、Scratchでゲーム制作から始めました。5年生ではPythonを学び、簡単な計算ツールを作成しました。最近では、地域の高齢者向けに大きな文字で表示される天気アプリを制作しました。この活動を通して、プログラミングは単なる技術ではなく、人と人をつなぐコミュニケーションツールだということを学びました。',
      schoolLife: '中学校では、情報技術部に所属し、より高度なプログラミング技術を身につけたいと思います。また、数学や理科の授業と関連付けながら、論理的思考力を養いたいです。友達と協力して、学校生活をより便利にするアプリやシステムを開発し、実際に使ってもらえるような取り組みにチャレンジしたいと考えています。',
      future: '将来は、ITエンジニアまたはAI研究者として、技術を通じて社会課題を解決したいと思います。特に、高齢者や障がいを持つ方々が快適に生活できるような支援技術の開発に興味があります。そのために、大学では情報工学を専攻し、プログラミング技術だけでなく、人間の心理や社会の仕組みについても学びたいと考えています。',
      researchTopic: 'プログラミングとアプリ開発',
      characterCount: 456,
      ocrSourceType: 'typed',
      aiEvaluation: {
        overallScore: 4.2,
        strengths: ['具体的な体験に基づいている', '将来への明確なビジョンがある'],
        improvements: ['社会との関連性をより強調できる'],
      },
      evaluatedAt: new Date(),
    },
  });

  const essay2 = await prisma.essay.create({
    data: {
      userId: testUser2.id,
      motivation: '私が明和高校附属中学校を志望する理由は、生物学への深い興味を探究できる環境があるからです。小学校3年生の時に学校の裏庭でダンゴムシを観察したことがきっかけで、小さな生き物の世界に魅力を感じるようになりました。特に昆虫の生態や行動に興味があり、将来は生物学者になって生き物の不思議を解明したいと思っています。',
      research: '私は3年間にわたってアリの生態について観察研究を続けています。最初は家の庭で見つけたアリの巣を観察することから始まりました。アリがどのように役割分担をして働くのか、どうやって食べ物を見つけて巣に運ぶのかを詳しく調べました。図書館で専門書を読んだり、大学の先生にメールで質問したりもしました。観察を通して、小さなアリにも複雑な社会があることを知り、とても感動しました。',
      schoolLife: '中学校では理科部に入部し、より本格的な生物研究に取り組みたいと思います。顕微鏡を使った細胞観察や、野外調査なども体験したいです。また、研究した内容を友達や先生に発表する機会を通して、分かりやすく説明する力も身につけたいと考えています。将来の研究に必要な英語の勉強にも力を入れたいです。',
      future: '将来は生物学者になって、昆虫の社会性についてもっと詳しく研究したいと思います。特に、昆虫がどのようにコミュニケーションを取っているのか、集団でどのように判断を下すのかを解明したいです。この研究が、将来のロボット技術や人工知能の発展にも役立つかもしれないと考えています。そのために、大学では生物学を専攻し、様々な生き物について幅広く学びたいです。',
      researchTopic: '昆虫の生態研究',
      characterCount: 512,
      ocrSourceType: 'typed',
      aiEvaluation: {
        overallScore: 4.5,
        strengths: ['継続的な観察研究', '探究心の深さ', '将来への展望が明確'],
        improvements: ['技術応用への言及が良い'],
      },
      evaluatedAt: new Date(),
    },
  });

  console.log('✅ サンプル志願理由書を作成しました');

  // サンプル面接セッション
  const session1 = await prisma.interviewSession.create({
    data: {
      userId: testUser1.id,
      essayId: essay1.id,
      sessionType: 'practice',
      researchTopic: 'プログラミングとアプリ開発',
      startTime: new Date(Date.now() - 1000 * 60 * 20), // 20分前
      endTime: new Date(Date.now() - 1000 * 60 * 5), // 5分前
      duration: 900, // 15分
      questionCount: 8,
      currentPhase: 'complete',
      completionPercentage: 100,
      aiProvider: 'multi',
      difficultyLevel: 3,
      finalEvaluation: {
        genuineInterest: { score: 4, feedback: '技術への真の関心が感じられます' },
        experienceBase: { score: 4, feedback: '実体験に基づいた具体的な内容です' },
        socialConnection: { score: 3, feedback: '社会への貢献意識があります' },
        noDefinitiveAnswer: { score: 4, feedback: '探究的な思考ができています' },
        otherUnderstanding: { score: 4, feedback: '分かりやすく説明できています' },
        selfTransformation: { score: 3, feedback: '成長への意識があります' },
        originalExpression: { score: 4, feedback: 'あなたらしい表現ができています' },
        overallScore: 3.7,
      },
      overallScore: 3.7,
    },
  });

  // サンプル質問と回答
  const question1 = await prisma.interviewQuestion.create({
    data: {
      sessionId: session1.id,
      questionText: 'あなたのプログラミングへの興味について詳しく教えてください。',
      questionType: 'basic_interest',
      intent: '探究活動への基本的な関心と動機を確認',
      difficulty: 2,
      evaluationCriteria: ['興味の深さ', '具体性', '継続性'],
      orderIndex: 1,
      generateTime: new Date(),
      aiProvider: 'openai',
    },
  });

  await prisma.interviewResponse.create({
    data: {
      sessionId: session1.id,
      questionId: question1.id,
      responseText: '小学校4年生の時に、初めてScratchでゲームを作ったことがきっかけです。最初は簡単な迷路ゲームを作りましたが、キャラクターが動いた時の感動は今でも覚えています。その後、Pythonを学んで計算ツールを作ったり、最近では高齢者向けの天気アプリを制作しました。プログラミングを通して、アイデアを形にできることが楽しくて、もっと多くの人に役立つものを作りたいと思うようになりました。',
      responseType: 'voice',
      duration: 45,
      transcriptConfidence: 0.92,
      aiEvaluation: {
        relevance: 0.9,
        depth: 0.8,
        authenticity: 0.85,
      },
      suggestions: ['より具体的な制作過程について'],
      strengths: ['体験の具体性', '継続的な取り組み'],
    },
  });

  console.log('✅ サンプル面接セッションを作成しました');

  // 実績データ
  await prisma.achievement.create({
    data: {
      userId: testUser1.id,
      type: 'first_session_completed',
      title: '初回面接練習完了',
      description: '最初の面接練習を完了しました',
      category: 'interview',
      score: 3.7,
    },
  });

  await prisma.achievement.create({
    data: {
      userId: testUser2.id,
      type: 'essay_created',
      title: '志願理由書作成',
      description: '志願理由書を作成しました',
      category: 'essay',
    },
  });

  console.log('✅ 実績データを作成しました');

  // 保護者向け通信
  await prisma.parentCommunication.create({
    data: {
      userId: testUser1.id,
      type: 'progress_report',
      subject: '【明和中面接練習アプリ】学習進捗レポート',
      content: 'お子様の面接練習が順調に進んでいます。総合スコア3.7点の良い結果を残しており、特に探究心と表現力に優れています。',
      readAt: new Date(),
    },
  });

  console.log('✅ 保護者向け通信を作成しました');

  // リアルタイム分析データ（サンプル）
  for (let i = 0; i < 5; i++) {
    await prisma.realtimeAnalytics.create({
      data: {
        sessionId: session1.id,
        timestamp: new Date(Date.now() - 1000 * 60 * (10 - i * 2)),
        analysisType: 'confidence',
        metricsData: {
          confidence: 0.7 + Math.random() * 0.3,
          fluency: 0.6 + Math.random() * 0.4,
          engagement: 0.8 + Math.random() * 0.2,
        },
        processingTime: 150 + Math.random() * 50,
        aiProvider: 'gemini',
      },
    });
  }

  console.log('✅ リアルタイム分析データを作成しました');

  console.log('\n🎉 データベースシード完了！');
  console.log('\n作成されたデータ:');
  console.log('- 志望校: 1校');
  console.log('- テストユーザー: 2名');
  console.log('- 志願理由書: 2件');
  console.log('- 面接セッション: 1件');
  console.log('- 質問・回答: 1組');
  console.log('- 実績: 2件');
  console.log('- 保護者通信: 1件');
  console.log('- 分析データ: 5件');
  console.log('\nテストユーザー:');
  console.log('- student1@example.com / password123');
  console.log('- student2@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ シードエラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });