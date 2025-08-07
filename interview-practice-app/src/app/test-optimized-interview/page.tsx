'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { 
  PlayCircle, 
  PauseCircle, 
  RotateCcw, 
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  Clock,
  Mic,
  MicOff 
} from 'lucide-react';

interface InterviewState {
  stage: 'opening' | 'exploration' | 'metacognition' | 'future' | 'completed';
  depth: number;
  pattern: 'artistic_collaborative' | 'scientific_individual';
  conversationHistory: Array<{
    type: 'interviewer' | 'student';
    content: string;
    timestamp: number;
    stage: string;
  }>;
}

export default function OptimizedInterviewTestPage() {
  const [interviewState, setInterviewState] = useState<InterviewState>({
    stage: 'opening',
    depth: 1,
    pattern: 'artistic_collaborative',
    conversationHistory: []
  });

  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // テスト用の探究活動シナリオ
  const [testScenario, setTestScenario] = useState<string>('artistic_collaborative');
  const [essayContent, setEssayContent] = useState({
    motivation: '明和中学校の探究学習に魅力を感じました',
    inquiry: 'ダンスチームでの全国大会への挑戦',
    school_life: '探究学習で新しいことを学びたい',
    future: '将来はダンスインストラクターになりたい'
  });

  // 面接開始
  const startInterview = async () => {
    setIsLoading(true);
    setInterviewState({
      stage: 'opening',
      depth: 1,
      pattern: testScenario as 'artistic_collaborative' | 'scientific_individual',
      conversationHistory: []
    });

    try {
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayContent,
          conversationHistory: [],
          questionType: 'initial_greeting',
          currentStage: 'opening',
          interviewDepth: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion(data.question);
        
        // 面接開始をログに記録
        setInterviewState(prev => ({
          ...prev,
          conversationHistory: [{
            type: 'interviewer',
            content: data.question,
            timestamp: Date.now(),
            stage: 'opening'
          }]
        }));
      }
    } catch (error) {
      console.error('面接開始エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 次の質問を取得
  const getNextQuestion = async () => {
    if (!currentResponse.trim()) {
      alert('回答を入力してください');
      return;
    }

    setIsLoading(true);

    try {
      // 学生の回答を記録
      const newHistory = [
        ...interviewState.conversationHistory,
        {
          type: 'student' as const,
          content: currentResponse,
          timestamp: Date.now(),
          stage: interviewState.stage
        }
      ];

      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayContent,
          conversationHistory: newHistory.map(h => ({ role: h.type === 'interviewer' ? 'interviewer' : 'student', content: h.content })),
          questionType: 'follow_up',
          currentStage: interviewState.stage,
          interviewDepth: interviewState.depth + 1,
          userMessage: currentResponse // 🚀 不適切発言検出のためユーザーの回答を追加
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 🚀 AI品質判定・不適切発言検出への対応
        if (data.seriousReminder) {
          const alertMessage = data.aiSuggestion ? 
            `AI品質判定 (${data.qualityCheckType}): ${data.question}` : 
            `回答品質要改善: ${data.question}`;
          console.log('⚠️ AI品質判定:', alertMessage);
          alert('回答要改善: ' + data.question);
        }
        
        setCurrentQuestion(data.question);
        
        // 段階移行のチェック
        let newStage = interviewState.stage;
        let newDepth = interviewState.depth + 1;
        
        // 段階移行ロジック（簡略化）
        if (interviewState.stage === 'opening' && newDepth >= 4) {
          newStage = 'exploration';
        } else if (interviewState.stage === 'exploration' && newDepth >= 10) {
          newStage = 'metacognition';
        } else if (interviewState.stage === 'metacognition' && newDepth >= 13) {
          newStage = 'future';
        } else if (interviewState.stage === 'future' && newDepth >= 16) {
          newStage = 'completed';
        }

        // 状態更新
        setInterviewState(prev => ({
          ...prev,
          stage: newStage as any,
          depth: newDepth,
          conversationHistory: [
            ...newHistory,
            {
              type: 'interviewer',
              content: data.question,
              timestamp: Date.now(),
              stage: newStage
            }
          ]
        }));

        // テスト結果に記録
        setTestResults(prev => [...prev, {
          depth: newDepth,
          stage: newStage,
          question: data.question,
          response: currentResponse,
          evaluationPreview: data.evaluationPreview || null,
          timestamp: new Date().toLocaleTimeString()
        }]);

        setCurrentResponse('');
      }
    } catch (error) {
      console.error('質問生成エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // リセット
  const resetInterview = () => {
    setInterviewState({
      stage: 'opening',
      depth: 1,
      pattern: 'artistic_collaborative',
      conversationHistory: []
    });
    setCurrentQuestion('');
    setCurrentResponse('');
    setTestResults([]);
  };

  // シナリオ切り替え
  const switchScenario = (scenario: string) => {
    setTestScenario(scenario);
    if (scenario === 'scientific_individual') {
      setEssayContent({
        motivation: '明和中学校の理科実験に興味があります',
        inquiry: 'ウミウシや海洋生物の飼育研究',
        school_life: '生物実験で新しい発見をしたい',
        future: '将来は海洋生物学者になりたい'
      });
    } else {
      setEssayContent({
        motivation: '明和中学校の探究学習に魅力を感じました',
        inquiry: 'ダンスチームでの全国大会への挑戦',
        school_life: '探究学習で新しいことを学びたい',
        future: '将来はダンスインストラクターになりたい'
      });
    }
    resetInterview();
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'opening': return 'bg-blue-100 text-blue-800';
      case 'exploration': return 'bg-green-100 text-green-800';
      case 'metacognition': return 'bg-purple-100 text-purple-800';
      case 'future': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'opening': return <PlayCircle className="h-4 w-4" />;
      case 'exploration': return <Target className="h-4 w-4" />;
      case 'metacognition': return <Brain className="h-4 w-4" />;
      case 'future': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <PremiumCard className="border-2 border-indigo-200">
          <div className="p-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Brain className="h-8 w-8 text-indigo-600" />
              最適化された面接フロー検証テスト
            </h1>
            <p className="text-gray-600 mt-2">
              HさんTさんの実際面接を再現する4段階フロー（冒頭→探究→メタ認知→将来）をテストします
            </p>
          </div>
        </PremiumCard>

        {/* シナリオ選択 */}
        <PremiumCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">テストシナリオ選択</h2>
            <div className="grid grid-cols-2 gap-4">
              <PremiumButton
                onClick={() => switchScenario('artistic_collaborative')}
                className={`p-4 h-auto flex flex-col gap-2 ${testScenario === 'artistic_collaborative' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                <span className="font-semibold">Hさんパターン</span>
                <span className="text-sm opacity-75">芸術・協働系（ダンス、音楽、演劇等）</span>
              </PremiumButton>
              <PremiumButton
                onClick={() => switchScenario('scientific_individual')}
                className={`p-4 h-auto flex flex-col gap-2 ${testScenario === 'scientific_individual' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                <span className="font-semibold">Tさんパターン</span>
                <span className="text-sm opacity-75">科学・個人研究系（生物飼育、実験、観察等）</span>
              </PremiumButton>
            </div>

            {/* 現在の志願理由書設定 */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">現在の志願理由書設定:</h4>
              <div className="text-sm space-y-1">
                <div><strong>志望動機:</strong> {essayContent.motivation}</div>
                <div><strong>探究活動:</strong> {essayContent.inquiry}</div>
                <div><strong>学校生活:</strong> {essayContent.school_life}</div>
                <div><strong>将来目標:</strong> {essayContent.future}</div>
              </div>
            </div>
          </div>
        </PremiumCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メイン面接エリア */}
          <div className="lg:col-span-2 space-y-4">
            {/* 現在の状況 */}
            <PremiumCard>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    {getStageIcon(interviewState.stage)}
                    面接進行状況
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(interviewState.stage)}`}>
                    {interviewState.stage.toUpperCase()} (深度{interviewState.depth})
                  </div>
                </div>
                <div className="space-y-4">
                  {/* 段階プログレス */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['opening', 'exploration', 'metacognition', 'future'].map((stage, index) => (
                      <div 
                        key={stage}
                        className={`p-2 rounded text-center text-xs font-medium ${
                          interviewState.stage === stage ? 'bg-indigo-600 text-white' :
                          ['opening', 'exploration', 'metacognition', 'future'].indexOf(interviewState.stage) > index ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {stage === 'opening' && '冒頭確認'}
                        {stage === 'exploration' && '探究深掘り'}
                        {stage === 'metacognition' && 'メタ認知'}
                        {stage === 'future' && '将来連結'}
                      </div>
                    ))}
                  </div>

                  {/* 現在の質問 */}
                  {currentQuestion && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <strong className="text-blue-900">面接官:</strong>
                          <span className="text-blue-800 ml-2">{currentQuestion}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 回答入力 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">あなたの回答:</label>
                    <textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="ここに回答を入力してください..."
                      className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>

                  {/* コントロールボタン */}
                  <div className="flex gap-2">
                    {interviewState.conversationHistory.length === 0 ? (
                      <PremiumButton onClick={startInterview} disabled={isLoading}>
                        {isLoading ? '開始中...' : '面接開始'}
                      </PremiumButton>
                    ) : (
                      <PremiumButton onClick={getNextQuestion} disabled={isLoading || !currentResponse.trim()}>
                        {isLoading ? '生成中...' : '次の質問'}
                      </PremiumButton>
                    )}
                    <PremiumButton className="bg-gray-100 text-gray-800" onClick={resetInterview}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      リセット
                    </PremiumButton>
                  </div>
                </div>
              </div>
            </PremiumCard>

            {/* 会話履歴 */}
            <PremiumCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">会話履歴 ({interviewState.conversationHistory.length}件)</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {interviewState.conversationHistory.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      item.type === 'interviewer' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'interviewer' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                          {item.type === 'interviewer' ? '面接官' : '受験生'}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(item.stage)}`}>
                          {item.stage}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </PremiumCard>
          </div>

          {/* テスト結果サイドバー */}
          <div className="space-y-4">
            <PremiumCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">テスト結果分析</h3>
                <div className="space-y-4">
                  {/* 統計情報 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-indigo-600">{testResults.length}</div>
                      <div className="text-xs">質問数</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{interviewState.depth}</div>
                      <div className="text-xs">現在深度</div>
                    </div>
                  </div>

                  {/* 段階別進行 */}
                  <div>
                    <h4 className="font-semibold mb-2">段階別進行状況:</h4>
                    <div className="space-y-1 text-sm">
                      {['opening', 'exploration', 'metacognition', 'future'].map(stage => {
                        const count = testResults.filter(r => r.stage === stage).length;
                        return (
                          <div key={stage} className="flex justify-between">
                            <span className="capitalize">{stage}:</span>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(stage)}`}>
                              {count}件
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 最新の質問品質 */}
                  {testResults.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">最新質問分析:</h4>
                      <div className="text-xs space-y-1 p-2 bg-gray-50 rounded">
                        <div><strong>段階:</strong> {testResults[testResults.length - 1]?.stage}</div>
                        <div><strong>深度:</strong> {testResults[testResults.length - 1]?.depth}</div>
                        <div><strong>時刻:</strong> {testResults[testResults.length - 1]?.timestamp}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PremiumCard>

            {/* パターン比較 */}
            <PremiumCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">パターン比較結果</h3>
                <div className="text-sm space-y-2">
                  <div>
                    <strong>現在パターン:</strong> {interviewState.pattern}
                  </div>
                  <div>
                    <strong>段階移行:</strong> 
                    {interviewState.stage === 'opening' && ' 基本確認中'}
                    {interviewState.stage === 'exploration' && ' 探究深掘り中'}
                    {interviewState.stage === 'metacognition' && ' メタ認知確認中'}
                    {interviewState.stage === 'future' && ' 将来連結中'}
                    {interviewState.stage === 'completed' && ' 面接完了'}
                  </div>
                  <div>
                    <strong>HさんTさん実装度:</strong>
                    <div className="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 inline-block">
                      {Math.round((interviewState.depth / 15) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>
      </div>
    </div>
  );
}