/**
 * 志願理由書サンプルデータ（学習用）
 * 実際の運用では、プライバシーに配慮した匿名化データを使用
 */

export interface EssaySample {
  content: string;
  metadata: {
    school: string;
    year: number;
    admissionResult: 'pass' | 'fail';
    studentGrade?: number; // 1-5段階評価
    interviewScore?: number; // 面接点数
  };
}

// 明和高校附属中学校の志願理由書サンプル（匿名化済み）
export const MEIWA_ESSAY_SAMPLES: EssaySample[] = [
  {
    content: `私が明和高校附属中学校を志望する理由は、探究学習に力を入れているからです。私は小学校で理科の実験が好きになり、特に植物の成長について詳しく調べたいと思うようになりました。明和中学校では、自分で研究テーマを決めて深く学べると聞いています。将来は植物学者になって、食料不足の解決に役立つ研究をしたいです。そのために、中学校では理科だけでなく、英語も頑張って世界中の研究者と交流できるようになりたいです。明和中学校で仲間と一緒に学び、成長していきたいと思います。`,
    metadata: {
      school: '明和高校附属中学校',
      year: 2024,
      admissionResult: 'pass',
      studentGrade: 4,
      interviewScore: 85
    }
  },
  {
    content: `明和高校附属中学校を志望する理由は、国際理解教育が充実しているからです。私は英語が好きで、将来は通訳になって国際会議で活躍したいと考えています。明和中学校では、外国人の先生との授業や、海外の学校との交流があると学校説明会で聞きました。また、生徒会活動も活発で、リーダーシップを身につけることができそうです。私は責任感が強く、クラスをまとめることが得意なので、明和中学校でも積極的に活動に参加したいです。中高一貫教育で、6年間じっくりと学習に取り組み、大学受験に向けて準備したいと思います。`,
    metadata: {
      school: '明和高校附属中学校',
      year: 2024,
      admissionResult: 'pass',
      studentGrade: 5,
      interviewScore: 92
    }
  },
  {
    content: `私が明和高校附属中学校を志望するのは、学習環境が整っているからです。図書館の蔵書が豊富で、調べ学習に最適だと思います。私は歴史が好きで、特に戦国時代について詳しく調べています。明和中学校では、課題研究の時間があり、自分の興味のあることを深く学べると聞いています。また、部活動も盛んで、吹奏楽部に入って全国大会を目指したいです。小学校でもトランペットを続けており、さらに上達したいと考えています。明和中学校で文武両道を実践し、充実した中学生活を送りたいです。`,
    metadata: {
      school: '明和高校附属中学校',
      year: 2024,
      admissionResult: 'pass',
      studentGrade: 4,
      interviewScore: 78
    }
  },
  {
    content: `明和高校附属中学校を志望する理由は、自分の将来の夢を実現するのに最適な環境だからです。私は医師になって、困っている人を助けたいと思っています。そのためには、理数系の学習をしっかりと身につける必要があります。明和中学校は理数教育に力を入れており、実験設備も充実していると聞いています。また、先輩方が有名大学の医学部に多数合格していることも心強いです。私は集中力と粘り強さが長所なので、6年間コツコツと努力を続けて、必ず医学部に合格したいです。明和中学校で同じ目標を持つ仲間と切磋琢磨しながら成長していきたいと思います。`,
    metadata: {
      school: '明和高校附属中学校',
      year: 2024,
      admissionResult: 'pass',
      studentGrade: 5,
      interviewScore: 88
    }
  },
  {
    content: `私が明和高校附属中学校を志望する理由は、高いレベルの教育を受けられるからです。私は将来、弁護士になって正義を実現したいと考えています。そのためには論理的思考力と表現力を身につける必要があります。明和中学校では、ディベート大会や弁論大会などがあり、自分の考えを相手に伝える力を鍛えることができます。また、社会科の授業では時事問題についても学べると聞いています。私は正義感が強く、困っている人を見過ごすことができない性格です。明和中学校で様々なことを学び、将来の夢に向かって努力していきたいと思います。`,
    metadata: {
      school: '明和高校附属中学校',
      year: 2024,
      admissionResult: 'pass',
      studentGrade: 4,
      interviewScore: 82
    }
  }
];

// 他校のサンプル（比較用）
export const OTHER_SCHOOL_SAMPLES: EssaySample[] = [
  {
    content: `刈谷高校附属中学校を志望する理由は、科学技術分野に強いからです。私はロボットに興味があり、将来はエンジニアになりたいと思っています。刈谷中学校では、プログラミング教育や技術の授業が充実していると聞いています。また、近くにトヨタの工場があり、実際の技術を学ぶ機会もあるそうです。私は手先が器用で、ものづくりが好きなので、刈谷中学校で技術を磨いていきたいです。`,
    metadata: {
      school: '刈谷高校附属中学校',
      year: 2024,
      admissionResult: 'pass',
      studentGrade: 4,
      interviewScore: 80
    }
  }
];

// よく使われる表現パターン
export const COMMON_PATTERNS = {
  opening: [
    '私が○○を志望する理由は',
    '○○を志望したのは',
    '○○に入学したい理由は'
  ],
  motivation: [
    '探究学習に力を入れているから',
    '国際理解教育が充実しているから',
    '学習環境が整っているから',
    '高いレベルの教育を受けられるから',
    '自分の将来の夢を実現するのに最適だから'
  ],
  future: [
    '将来は○○になって',
    '○○になりたいと思っています',
    '○○を目指しています',
    '○○として活躍したいです'
  ],
  effort: [
    '努力していきたいと思います',
    '頑張っていきたいです',
    '取り組んでいきたいです',
    '成長していきたいと思います'
  ]
};

// 学校固有の特徴語彙
export const SCHOOL_SPECIFIC_VOCABULARY = {
  '明和高校附属中学校': [
    '探究学習',
    '国際理解',
    '課題研究',
    '中高一貫',
    '文武両道',
    '進路指導',
    '大学受験',
    '理数教育',
    'SSH',
    '生徒会活動'
  ],
  '刈谷高校附属中学校': [
    '科学技術',
    'プログラミング',
    'ロボット',
    '工学',
    'ものづくり',
    '技術',
    'STEM',
    '理工系'
  ]
};

// 面接でよく聞かれる質問パターン
export const INTERVIEW_QUESTION_PATTERNS = [
  'なぜ本校を志望したのですか',
  '将来の夢を教えてください',
  'あなたの長所と短所は何ですか',
  '中学校生活で頑張りたいことは何ですか',
  '最近興味を持っていることはありますか',
  '困った時はどのように解決しますか',
  '友達との関係で大切にしていることは何ですか'
];

/**
 * サンプルデータから学習用データセットを作成
 */
export function createTrainingDataset(): EssaySample[] {
  return [
    ...MEIWA_ESSAY_SAMPLES,
    ...OTHER_SCHOOL_SAMPLES
  ];
}

/**
 * 特定の学校のサンプルのみ取得
 */
export function getSchoolSpecificSamples(schoolName: string): EssaySample[] {
  const allSamples = createTrainingDataset();
  return allSamples.filter(sample => sample.metadata.school === schoolName);
}

/**
 * 合格者のサンプルのみ取得
 */
export function getPassingSamples(): EssaySample[] {
  const allSamples = createTrainingDataset();
  return allSamples.filter(sample => sample.metadata.admissionResult === 'pass');
}

/**
 * 高得点サンプル取得（面接点80点以上）
 */
export function getHighScoreSamples(minScore: number = 80): EssaySample[] {
  const allSamples = createTrainingDataset();
  return allSamples.filter(sample => 
    sample.metadata.interviewScore && sample.metadata.interviewScore >= minScore
  );
}