import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 愛知県公立中高一貫校のマスターデータ
 */
const SCHOOLS_DATA = [
  {
    name: '愛知県立明和高等学校附属中学校',
    shortName: '明和附属中',
    prefecture: '愛知県',
    mission: '夢や憧れを持ち、それらを実現するために粘り強く挑戦する人',
    vision: '知的好奇心をもって主体的に学び、個性を発揮して資質を磨き、仲間とともに成長できる生徒',
    interviewConfig: {
      duration: 15,
      questionCount: 5,
      focusAreas: {
        research: 0.6,    // 探究活動重視60%
        motivation: 0.15, // 志望動機15%
        future: 0.15,     // 将来目標15%
        schoolLife: 0.1   // 学校生活抱負10%
      },
      typicalQuestions: [
        {
          type: 'RESEARCH_DEEP',
          templates: [
            '志願理由書に書いた{topic}について、もう少し詳しく教えてください',
            'その調べ学習で、一番印象に残ったことは何ですか？',
            '調べていて疑問に思ったこと、もっと知りたくなったことはありますか？',
            'どうやって調べましたか？資料はどこで見つけましたか？',
            '調べる前と後で、考えが変わったことはありますか？'
          ]
        },
        {
          type: 'MOTIVATION',
          templates: [
            'なぜ明和高校附属中学校で学びたいと思ったのですか？',
            '明和附属中の魅力は何だと思いますか？'
          ]
        },
        {
          type: 'FUTURE_GOAL',
          templates: [
            'その探究活動は、将来の目標とどうつながっていますか？',
            '将来の夢について教えてください'
          ]
        }
      ]
    },
    essayWeights: {
      motivation: 0.15,
      research: 0.5,    // 探究活動を特に重視
      schoolLife: 0.2,
      future: 0.15
    }
  },
  {
    name: '愛知県立刈谷高等学校附属中学校',
    shortName: '刈谷附属中',
    prefecture: '愛知県',
    mission: '高い志を持ち、自ら学び、共に高め合う生徒',
    vision: '確かな学力と豊かな人間性を身に付け、グローバル社会で活躍できる人材',
    interviewConfig: {
      duration: 15,
      questionCount: 5,
      focusAreas: {
        motivation: 0.25,
        research: 0.25,
        schoolLife: 0.25,
        future: 0.25  // 均等配分
      },
      typicalQuestions: [
        {
          type: 'MOTIVATION',
          templates: [
            'なぜ刈谷高校附属中学校を志望したのですか？',
            '刈谷附属中でどのような中学校生活を送りたいですか？'
          ]
        },
        {
          type: 'RESEARCH_DEEP',
          templates: [
            '今まで取り組んだ探究活動について教えてください',
            'その活動を通して学んだことは何ですか？'
          ]
        }
      ]
    },
    essayWeights: {
      motivation: 0.25,
      research: 0.25,
      schoolLife: 0.25,
      future: 0.25
    }
  },
  {
    name: '愛知県立津島高等学校附属中学校',
    shortName: '津島附属中',
    prefecture: '愛知県',
    mission: '国際的な視野を持ち、地域社会に貢献できる人材',
    vision: '語学力とコミュニケーション能力を身に付け、多様な文化を理解する生徒',
    interviewConfig: {
      duration: 15,
      questionCount: 5,
      focusAreas: {
        motivation: 0.2,
        research: 0.3,
        schoolLife: 0.2,
        future: 0.3   // 国際理解・将来目標重視
      },
      typicalQuestions: [
        {
          type: 'FUTURE_GOAL',
          templates: [
            '将来、国際的に活躍したいと思いますか？',
            '外国語学習への取り組みについて教えてください'
          ]
        },
        {
          type: 'RESEARCH_DEEP',
          templates: [
            '国際理解に関する調べ学習をしたことはありますか？',
            '他の国の文化で興味を持ったものはありますか？'
          ]
        }
      ]
    },
    essayWeights: {
      motivation: 0.2,
      research: 0.3,
      schoolLife: 0.2,
      future: 0.3
    }
  },
  {
    name: '愛知県立半田高等学校附属中学校',
    shortName: '半田附属中',
    prefecture: '愛知県',
    mission: '地域社会に根ざし、世界に羽ばたく人材',
    vision: '地域への愛着と誇りを持ち、広い視野で物事を考える生徒',
    interviewConfig: {
      duration: 15,
      questionCount: 5,
      focusAreas: {
        motivation: 0.2,
        research: 0.25,
        schoolLife: 0.25,
        future: 0.3   // 地域貢献・将来目標重視
      },
      typicalQuestions: [
        {
          type: 'FUTURE_GOAL',
          templates: [
            '将来、地域社会にどのように貢献したいですか？',
            '半田市や知多半島の魅力は何だと思いますか？'
          ]
        },
        {
          type: 'RESEARCH_DEEP',
          templates: [
            '地域について調べたことはありますか？',
            '地域の課題について考えたことはありますか？'
          ]
        }
      ]
    },
    essayWeights: {
      motivation: 0.2,
      research: 0.25,
      schoolLife: 0.25,
      future: 0.3
    }
  }
];

/**
 * テスト用ユーザーデータ
 */
const TEST_USERS_DATA = [
  {
    email: 'test.student1@example.com',
    studentName: '田中太郎',
    grade: 6,
    parentEmail: 'test.parent1@example.com',
    parentName: '田中花子',
    parentConsent: true,
    consentTimestamp: new Date(),
    dataRetentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年後
    accessibilitySettings: {
      highContrast: false,
      fontSize: 'lg',
      furigana: true
    },
    preferredMascot: 'friendly-bear'
  },
  {
    email: 'test.student2@example.com',
    studentName: '佐藤花音',
    grade: 6,
    parentEmail: 'test.parent2@example.com',
    parentName: '佐藤美咲',
    parentConsent: true,
    consentTimestamp: new Date(),
    dataRetentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    accessibilitySettings: {
      highContrast: false,
      fontSize: 'base',
      furigana: false
    },
    preferredMascot: 'wise-owl'
  }
];

/**
 * サンプル志願理由書データ
 */
const SAMPLE_ESSAYS = [
  {
    motivation: '私は将来、環境問題の解決に取り組む研究者になりたいと思っています。明和高校附属中学校は、探究活動に力を入れており、自分の興味のあることを深く学べる環境があると聞きました。また、同じ志を持つ仲間たちと切磋琢磨しながら学習できることに魅力を感じ、志望いたします。',
    research: '小学4年生の時から、地球温暖化について調べ学習を続けています。最初はインターネットで情報を集めていましたが、5年生では図書館で専門書を読み、実際に気温の変化を測定する実験も行いました。6年生では、地域の環境保護団体の方にお話を伺い、身近な環境問題についても学びました。この活動を通して、環境問題は私たち一人一人の行動が重要だということを学びました。',
    schoolLife: '中学校では、科学部に入部して環境に関する研究を続けたいと思います。また、同級生とディスカッションを重ね、様々な視点から物事を考える力を身に付けたいです。学習面では、理科だけでなく、英語も頑張って国際的な視野を広げたいと考えています。',
    future: '将来は環境工学の研究者になり、再生可能エネルギーの技術開発に携わりたいです。特に、太陽光発電の効率を向上させる研究に興味があります。そのために、まずは中学・高校で理科と数学の基礎をしっかり身に付け、大学では工学部に進学したいと思います。研究を通して、地球環境の保護に貢献したいです。',
    wordCount: 487,
    analysisResult: {
      keywords: ['環境問題', '研究者', '探究活動', '地球温暖化', '科学部', '環境工学', '再生可能エネルギー'],
      strengths: ['具体的な体験', '継続的な取り組み', '将来への明確なビジョン'],
      improvements: ['より具体的な研究テーマ', '学校の特色との関連性強化']
    }
  }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 既存データのクリア（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Clearing existing data...');
      await prisma.sessionQuestion.deleteMany();
      await prisma.interviewSession.deleteMany();
      await prisma.applicationEssay.deleteMany();
      await prisma.progressRecord.deleteMany();
      await prisma.account.deleteMany();
      await prisma.session.deleteMany();
      await prisma.verificationToken.deleteMany();
      await prisma.user.deleteMany();
      await prisma.school.deleteMany();
    }

    // 学校データの作成
    console.log('🏫 Creating school data...');
    const schools = [];
    for (const schoolData of SCHOOLS_DATA) {
      const school = await prisma.school.create({
        data: schoolData
      });
      schools.push(school);
      console.log(`✅ Created school: ${school.name}`);
    }

    // テストユーザーの作成
    console.log('👥 Creating test users...');
    const users = [];
    for (let i = 0; i < TEST_USERS_DATA.length; i++) {
      const userData = TEST_USERS_DATA[i];
      const school = schools[i % schools.length]; // 順番に学校を割り当て
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          targetSchoolId: school.id
        }
      });
      users.push(user);
      console.log(`✅ Created user: ${user.studentName} (${user.email})`);
    }

    // サンプル志願理由書の作成
    console.log('📝 Creating sample application essays...');
    for (let i = 0; i < users.length && i < SAMPLE_ESSAYS.length; i++) {
      const user = users[i];
      const essayData = SAMPLE_ESSAYS[i];
      
      const essay = await prisma.applicationEssay.create({
        data: {
          ...essayData,
          userId: user.id,
          analysisVersion: '1.0.0'
        }
      });
      console.log(`✅ Created essay for user: ${user.studentName}`);

      // サンプル面接セッションの作成
      const session = await prisma.interviewSession.create({
        data: {
          userId: user.id,
          schoolId: user.targetSchoolId,
          applicationEssayId: essay.id,
          status: 'COMPLETED',
          duration: 900, // 15分
          questionCount: 5,
          aiModel: 'gpt-4-turbo',
          sessionConfig: {
            focusAreas: ['research', 'motivation'],
            difficulty: 'standard'
          },
          overallScore: 4.2,
          detailedScores: {
            motivation: 4.0,
            research: 4.5,
            schoolLife: 4.1,
            future: 4.2,
            delivery: 4.0
          },
          feedback: '探究活動について具体的に説明できており、継続的な取り組みが評価できます。志望動機も明確で、学校の特色を理解していることが伝わりました。',
          improvementSuggestions: {
            areas: ['より具体的な例を交える', '話すスピードを意識する'],
            nextSteps: ['科学的根拠を増やす', '国際的な視点を加える']
          },
          startedAt: new Date(Date.now() - 86400000), // 1日前
          completedAt: new Date(Date.now() - 86400000 + 900000), // 1日前 + 15分
        }
      });

      // サンプル質問・回答の作成
      const sampleQuestions = [
        {
          questionOrder: 1,
          questionText: '志願理由書に書いた地球温暖化の調べ学習について、もう少し詳しく教えてください。',
          questionType: 'RESEARCH_DEEP',
          focusArea: 'research',
          answerText: '小学4年生の時に、理科の授業で地球温暖化について学んだことがきっかけです。最初はインターネットで基本的な情報を調べていましたが、もっと詳しく知りたくなって、図書館で専門書を借りて読むようになりました。5年生では、実際に学校の気温を毎日測定して記録する実験を3か月間続けました。その結果、昔のデータと比較すると確実に気温が上がっていることが分かりました。',
          answerDuration: 120,
          answerMethod: 'VOICE',
          score: 4.5,
          aiEvaluation: {
            relevance: 4.8,
            specificity: 4.5,
            logic: 4.2
          },
          feedback: '具体的な取り組みが説明されており、継続性と主体性が感じられる優秀な回答です。'
        },
        {
          questionOrder: 2,
          questionText: 'なぜ明和高校附属中学校で学びたいと思ったのですか？',
          questionType: 'MOTIVATION',
          focusArea: 'motivation',
          answerText: '明和附属中は探究活動に力を入れている学校だと聞いて、私の環境問題への関心を深められると思ったからです。また、同じように研究に興味のある友達と一緒に学べることも魅力的でした。学校見学で、先輩方が自分のテーマについて生き生きと発表している姿を見て、ここで学びたいと強く思いました。',
          answerDuration: 95,
          answerMethod: 'VOICE',
          score: 4.0,
          aiEvaluation: {
            relevance: 4.2,
            specificity: 3.8,
            logic: 4.0
          },
          feedback: '学校の特色を理解した志望動機ですが、より具体的な理由があるとさらに良くなります。'
        }
      ];

      for (const questionData of sampleQuestions) {
        await prisma.sessionQuestion.create({
          data: {
            ...questionData,
            sessionId: session.id
          }
        });
      }

      console.log(`✅ Created interview session for user: ${user.studentName}`);
    }

    // 進捗記録の作成
    console.log('📊 Creating progress records...');
    for (const user of users) {
      await prisma.progressRecord.create({
        data: {
          userId: user.id,
          recordType: 'WEEKLY',
          averageScore: 4.1,
          scoresByArea: {
            motivation: 4.0,
            research: 4.3,
            schoolLife: 4.0,
            future: 4.1
          },
          sessionsCount: 3,
          totalPracticeTime: 45, // 45分
          improvementRate: 0.15, // 15%向上
          weakAreas: ['話すスピード', '具体例の充実'],
          strongAreas: ['継続性', '探究心'],
          recommendations: {
            focus: 'research',
            suggestions: ['より多くの具体例を準備する', '時間配分を意識する'],
            nextTopics: ['科学的根拠の強化', 'プレゼンテーション技術']
          }
        }
      });
    }

    console.log('✅ Database seeding completed successfully!');
    
    // 作成されたデータの概要を表示
    const schoolCount = await prisma.school.count();
    const userCount = await prisma.user.count();
    const essayCount = await prisma.applicationEssay.count();
    const sessionCount = await prisma.interviewSession.count();
    
    console.log('\n📈 Seeding Summary:');
    console.log(`   Schools: ${schoolCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Essays: ${essayCount}`);
    console.log(`   Sessions: ${sessionCount}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });