/**
 * 多言語対応システム
 * 日本語・英語・中国語対応の翻訳管理
 */

export type SupportedLocale = 'ja' | 'en' | 'zh';

export interface TranslationKey {
  // 共通UI
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    next: string;
    previous: string;
    start: string;
    stop: string;
    pause: string;
    resume: string;
    retry: string;
    home: string;
    about: string;
    contact: string;
    settings: string;
    profile: string;
    logout: string;
  };

  // ナビゲーション
  navigation: {
    practice: string;
    results: string;
    guide: string;
    analytics: string;
  };

  // 面接練習
  interview: {
    title: string;
    subtitle: string;
    selectSession: string;
    basicPractice: string;
    mockInterview: string;
    intensiveTraining: string;
    customPractice: string;
    questionCount: string;
    duration: string;
    difficulty: string;
    categories: string;
    startRecording: string;
    stopRecording: string;
    preparationTime: string;
    answerTime: string;
    completed: string;
    nextQuestion: string;
    previousQuestion: string;
    retake: string;
    finish: string;
  };

  // カテゴリ
  categories: {
    motivation: string;
    selfPR: string;
    academic: string;
    schoolLife: string;
    extracurricular: string;
    currentEvents: string;
  };

  // 評価・結果
  evaluation: {
    score: string;
    feedback: string;
    content: string;
    expression: string;
    attitude: string;
    uniqueness: string;
    improvement: string;
    strengths: string;
    weaknesses: string;
    suggestions: string;
  };

  // 統計・分析
  analytics: {
    title: string;
    totalSessions: string;
    averageScore: string;
    practiceTime: string;
    strongestCategory: string;
    weakestCategory: string;
    progressOverTime: string;
    categoryScores: string;
    recentSessions: string;
    difficultyDistribution: string;
    exportReport: string;
  };

  // エラーメッセージ
  errors: {
    networkError: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    validationError: string;
    microphoneError: string;
    recordingError: string;
  };

  // アクセシビリティ
  accessibility: {
    skipToMain: string;
    skipToNavigation: string;
    openMenu: string;
    closeMenu: string;
    playAudio: string;
    pauseAudio: string;
    volumeControl: string;
    increaseVolume: string;
    decreaseVolume: string;
  };
}

export const translations: Record<SupportedLocale, TranslationKey> = {
  ja: {
    common: {
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      cancel: 'キャンセル',
      confirm: '確認',
      save: '保存',
      delete: '削除',
      edit: '編集',
      close: '閉じる',
      next: '次へ',
      previous: '前へ',
      start: '開始',
      stop: '停止',
      pause: '一時停止',
      resume: '再開',
      retry: '再試行',
      home: 'ホーム',
      about: 'アプリについて',
      contact: 'お問い合わせ',
      settings: '設定',
      profile: 'プロフィール',
      logout: 'ログアウト',
    },
    navigation: {
      practice: '面接練習',
      results: '結果',
      guide: 'ガイド',
      analytics: '統計',
    },
    interview: {
      title: '明和中学校入試面接練習',
      subtitle: 'AI技術を活用した本格的な面接シミュレーション',
      selectSession: 'セッションを選択',
      basicPractice: '基本練習',
      mockInterview: '模擬面接',
      intensiveTraining: '集中特訓',
      customPractice: 'カスタム練習',
      questionCount: '質問数',
      duration: '所要時間',
      difficulty: '難易度',
      categories: 'カテゴリ',
      startRecording: '録音開始',
      stopRecording: '録音停止',
      preparationTime: '準備時間',
      answerTime: '回答時間',
      completed: '完了',
      nextQuestion: '次の質問',
      previousQuestion: '前の質問',
      retake: 'やり直し',
      finish: '終了',
    },
    categories: {
      motivation: '志望動機・学校理解',
      selfPR: '自己PR・将来目標',
      academic: '学習・成績・得意分野',
      schoolLife: '小学校生活・活動',
      extracurricular: '課外活動・趣味・特技',
      currentEvents: '時事問題・社会への関心',
    },
    evaluation: {
      score: 'スコア',
      feedback: 'フィードバック',
      content: '内容',
      expression: '表現力',
      attitude: '姿勢・態度',
      uniqueness: '独創性',
      improvement: '改善点',
      strengths: '良い点',
      weaknesses: '改善が必要な点',
      suggestions: '提案',
    },
    analytics: {
      title: '練習統計',
      totalSessions: '総練習回数',
      averageScore: '平均スコア',
      practiceTime: '練習時間',
      strongestCategory: '得意分野',
      weakestCategory: '改善分野',
      progressOverTime: 'スコア推移',
      categoryScores: 'カテゴリ別成績',
      recentSessions: '最近の練習',
      difficultyDistribution: '難易度別成績',
      exportReport: 'レポート出力',
    },
    errors: {
      networkError: 'ネットワーク接続に問題があります',
      serverError: 'サーバーエラーが発生しました',
      notFound: 'ページが見つかりません',
      unauthorized: '認証が必要です',
      forbidden: 'アクセス権限がありません',
      validationError: '入力内容に問題があります',
      microphoneError: 'マイクへのアクセスができません',
      recordingError: '録音中にエラーが発生しました',
    },
    accessibility: {
      skipToMain: 'メインコンテンツにスキップ',
      skipToNavigation: 'ナビゲーションにスキップ',
      openMenu: 'メニューを開く',
      closeMenu: 'メニューを閉じる',
      playAudio: '音声を再生',
      pauseAudio: '音声を一時停止',
      volumeControl: '音量調整',
      increaseVolume: '音量を上げる',
      decreaseVolume: '音量を下げる',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      next: 'Next',
      previous: 'Previous',
      start: 'Start',
      stop: 'Stop',
      pause: 'Pause',
      resume: 'Resume',
      retry: 'Retry',
      home: 'Home',
      about: 'About',
      contact: 'Contact',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
    },
    navigation: {
      practice: 'Interview Practice',
      results: 'Results',
      guide: 'Guide',
      analytics: 'Analytics',
    },
    interview: {
      title: 'Meiwa Junior High School Interview Practice',
      subtitle: 'Authentic interview simulation powered by AI technology',
      selectSession: 'Select Session',
      basicPractice: 'Basic Practice',
      mockInterview: 'Mock Interview',
      intensiveTraining: 'Intensive Training',
      customPractice: 'Custom Practice',
      questionCount: 'Questions',
      duration: 'Duration',
      difficulty: 'Difficulty',
      categories: 'Categories',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      preparationTime: 'Preparation Time',
      answerTime: 'Answer Time',
      completed: 'Completed',
      nextQuestion: 'Next Question',
      previousQuestion: 'Previous Question',
      retake: 'Retake',
      finish: 'Finish',
    },
    categories: {
      motivation: 'Motivation & School Understanding',
      selfPR: 'Self-PR & Future Goals',
      academic: 'Academic Performance & Strengths',
      schoolLife: 'Elementary School Life & Activities',
      extracurricular: 'Extracurricular Activities & Hobbies',
      currentEvents: 'Current Events & Social Awareness',
    },
    evaluation: {
      score: 'Score',
      feedback: 'Feedback',
      content: 'Content',
      expression: 'Expression',
      attitude: 'Attitude',
      uniqueness: 'Uniqueness',
      improvement: 'Areas for Improvement',
      strengths: 'Strengths',
      weaknesses: 'Areas to Improve',
      suggestions: 'Suggestions',
    },
    analytics: {
      title: 'Practice Statistics',
      totalSessions: 'Total Sessions',
      averageScore: 'Average Score',
      practiceTime: 'Practice Time',
      strongestCategory: 'Strongest Category',
      weakestCategory: 'Area for Improvement',
      progressOverTime: 'Progress Over Time',
      categoryScores: 'Category Scores',
      recentSessions: 'Recent Sessions',
      difficultyDistribution: 'Difficulty Distribution',
      exportReport: 'Export Report',
    },
    errors: {
      networkError: 'Network connection problem',
      serverError: 'Server error occurred',
      notFound: 'Page not found',
      unauthorized: 'Authentication required',
      forbidden: 'Access denied',
      validationError: 'Input validation error',
      microphoneError: 'Cannot access microphone',
      recordingError: 'Recording error occurred',
    },
    accessibility: {
      skipToMain: 'Skip to main content',
      skipToNavigation: 'Skip to navigation',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      playAudio: 'Play audio',
      pauseAudio: 'Pause audio',
      volumeControl: 'Volume control',
      increaseVolume: 'Increase volume',
      decreaseVolume: 'Decrease volume',
    },
  },
  zh: {
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
      next: '下一步',
      previous: '上一步',
      start: '开始',
      stop: '停止',
      pause: '暂停',
      resume: '继续',
      retry: '重试',
      home: '首页',
      about: '关于',
      contact: '联系我们',
      settings: '设置',
      profile: '个人资料',
      logout: '登出',
    },
    navigation: {
      practice: '面试练习',
      results: '结果',
      guide: '指南',
      analytics: '统计',
    },
    interview: {
      title: '明和中学入学面试练习',
      subtitle: '基于AI技术的真实面试模拟',
      selectSession: '选择练习',
      basicPractice: '基础练习',
      mockInterview: '模拟面试',
      intensiveTraining: '强化训练',
      customPractice: '自定义练习',
      questionCount: '题目数量',
      duration: '持续时间',
      difficulty: '难度',
      categories: '类别',
      startRecording: '开始录音',
      stopRecording: '停止录音',
      preparationTime: '准备时间',
      answerTime: '回答时间',
      completed: '完成',
      nextQuestion: '下一题',
      previousQuestion: '上一题',
      retake: '重做',
      finish: '结束',
    },
    categories: {
      motivation: '志愿动机·学校理解',
      selfPR: '自我介绍·未来目标',
      academic: '学习·成绩·特长',
      schoolLife: '小学生活·活动',
      extracurricular: '课外活动·兴趣爱好',
      currentEvents: '时事问题·社会关注',
    },
    evaluation: {
      score: '分数',
      feedback: '反馈',
      content: '内容',
      expression: '表达力',
      attitude: '态度',
      uniqueness: '独创性',
      improvement: '改进点',
      strengths: '优点',
      weaknesses: '需要改进的地方',
      suggestions: '建议',
    },
    analytics: {
      title: '练习统计',
      totalSessions: '总练习次数',
      averageScore: '平均分数',
      practiceTime: '练习时间',
      strongestCategory: '优势领域',
      weakestCategory: '改进领域',
      progressOverTime: '分数变化',
      categoryScores: '分类成绩',
      recentSessions: '最近练习',
      difficultyDistribution: '难度分布',
      exportReport: '导出报告',
    },
    errors: {
      networkError: '网络连接问题',
      serverError: '服务器错误',
      notFound: '页面未找到',
      unauthorized: '需要认证',
      forbidden: '访问被拒绝',
      validationError: '输入验证错误',
      microphoneError: '无法访问麦克风',
      recordingError: '录音时发生错误',
    },
    accessibility: {
      skipToMain: '跳转到主要内容',
      skipToNavigation: '跳转到导航',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
      playAudio: '播放音频',
      pauseAudio: '暂停音频',
      volumeControl: '音量控制',
      increaseVolume: '增加音量',
      decreaseVolume: '减少音量',
    },
  },
};

/**
 * 翻訳キーのネストした構造をフラットなキーに変換
 */
export function flattenTranslationKeys(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, flattenTranslationKeys(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
  }
  
  return flattened;
}

/**
 * 各言語の翻訳キーをフラット化
 */
export const flattenedTranslations: Record<SupportedLocale, Record<string, string>> = {
  ja: flattenTranslationKeys(translations.ja),
  en: flattenTranslationKeys(translations.en),
  zh: flattenTranslationKeys(translations.zh),
};

/**
 * 翻訳の一貫性チェック
 */
export function validateTranslations(): {
  isValid: boolean;
  missingKeys: Record<SupportedLocale, string[]>;
  extraKeys: Record<SupportedLocale, string[]>;
} {
  const locales: SupportedLocale[] = ['ja', 'en', 'zh'];
  const baseKeys = Object.keys(flattenedTranslations.ja);
  
  const missingKeys: Record<SupportedLocale, string[]> = { ja: [], en: [], zh: [] };
  const extraKeys: Record<SupportedLocale, string[]> = { ja: [], en: [], zh: [] };
  
  locales.forEach(locale => {
    const keys = Object.keys(flattenedTranslations[locale]);
    
    // ベース言語（日本語）にないキー
    missingKeys[locale] = baseKeys.filter(key => !keys.includes(key));
    
    // ベース言語にはあるが、この言語にないキー
    extraKeys[locale] = keys.filter(key => !baseKeys.includes(key));
  });
  
  const isValid = locales.every(locale => 
    missingKeys[locale].length === 0 && extraKeys[locale].length === 0
  );
  
  return { isValid, missingKeys, extraKeys };
}