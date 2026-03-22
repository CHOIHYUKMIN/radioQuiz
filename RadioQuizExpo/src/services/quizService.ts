interface QuizDetectionParams {
  recentTranscripts: string[];
}

const SCORE_KEYWORDS = {
  primary: [
    { word: '퀴즈', score: 5 },
    { word: '정답', score: 5 },
  ],
  secondary: [
    { word: '문자', score: 3 },
    { word: '샵', score: 3 },
    { word: '단문', score: 3 },
    { word: '장문', score: 3 },
    { word: '오십원', score: 3 },
    { word: '50원', score: 3 },
    { word: '백원', score: 3 },
    { word: '100원', score: 3 },
    { word: '우물정', score: 3 },
    { word: '보내주실 곳', score: 3 },
    { word: '맞춰', score: 3 },
  ],
  tertiary: [
    { word: '선물', score: 2 },
    { word: '추첨', score: 2 },
    { word: '쿠폰', score: 2 },
    { word: '커피', score: 2 },
    { word: '당첨자', score: 2 },
    { word: '드려요', score: 2 },
  ]
};

const QUIZ_THRESHOLD_SCORE = 10;

type QuizState = 'IDLE' | 'WAITING';
let quizState: QuizState = 'IDLE';
let waitingStartTime = 0;

export type QuizDetectionAction = 'NONE' | 'WAIT' | 'SOLVE' | 'SOLVE_AND_SEND';

export interface QuizDetectionResult {
  action: QuizDetectionAction;
  score: number;
  reason?: string;
}

export const detectQuizFromText = (params: QuizDetectionParams): QuizDetectionResult => {
  const fullText = params.recentTranscripts.join(' ');
  if (fullText.length < 5) return { action: 'NONE', score: 0 };
  
  // 🎙️ 사용자 직통 명령(Fast Track) 감지: "정답은 3번 바로 문자 보내줘" 등
  if (quizState === 'IDLE' || quizState === 'WAITING') {
    const fastTrackRegex = /(정답|답).*?(바로|얼른|빨리|대신|알아서|즉시|지금).*?(문자|메시지|메세지).*?(보내|날려|전송)/;
    if (fastTrackRegex.test(fullText)) {
      console.log(`[Quiz Detector] 🚀 사용자 패스트트랙명령 감지! 팝업 생략 및 즉시 SMS 연결`);
      quizState = 'IDLE';
      waitingStartTime = 0;
      return { action: 'SOLVE_AND_SEND', score: 100, reason: '사용자 음성 명령 (Fast Track)' };
    }
  }
  
  if (quizState === 'IDLE') {
    let totalScore = 0;
    let matchedKeywords: string[] = [];

    const checkCategory = (category: {word: string, score: number}[]) => {
      for (const item of category) {
        if (fullText.includes(item.word)) {
          totalScore += item.score;
          matchedKeywords.push(item.word);
        }
      }
    };

    checkCategory(SCORE_KEYWORDS.primary);
    checkCategory(SCORE_KEYWORDS.secondary);
    checkCategory(SCORE_KEYWORDS.tertiary);

    if (totalScore >= QUIZ_THRESHOLD_SCORE) {
      console.log(`[Quiz Detector] 🚨 Phase 1: 퀴즈 경계 경보! (점수: ${totalScore}, 단어: ${matchedKeywords.join(', ')}) => 12초간 종결어 대기 진입`);
      quizState = 'WAITING';
      waitingStartTime = Date.now();
      return { action: 'WAIT', score: totalScore, reason: '퀴즈 감지, 문제 출제 대기 중...' };
    }

    return { action: 'NONE', score: totalScore };
  }
  
  if (quizState === 'WAITING') {
    const elapsed = Date.now() - waitingStartTime;
    // 종결어 (문제 출제가 끝났음을 강력하게 암시하는 단어들)
    const endTriggers = [
      '번', '누굴까요', '누구일까요', '뭘까요', '무엇일까요', 
      '몇번일까요', '몇 번일까요', '어딜까요', '어디일까요', 
      '보내주세요', '바랍니다', '노래 듣고', '올게요', '오겠습니다',
      '노래 띄워'
    ];
    
    // 최근 4개 문장에서만 종결어를 스캔 (과거 문장을 재탕하지 않게 하기 위함)
    const recentChunk = params.recentTranscripts.slice(-4).join(' ');
    const hasEndTrigger = endTriggers.some(t => recentChunk.includes(t));
    
    if (hasEndTrigger && elapsed > 2000) { 
      // 최소 2초는 대기(안전장치)한 후 종결어가 나오면 문제 출제 종료 간주
      quizState = 'IDLE';
      console.log(`[Quiz Detector] 💡 Phase 2: 종결어 포착! 정답 추론기(LLM) 가동 (${Math.round(elapsed/1000)}초 소요)`);
      return { action: 'SOLVE', score: 99, reason: '문제 수집 완료' };
    }
    
    if (elapsed > 12000) { 
      // 12초 타임아웃 강제 이탈 (가장 속도감 있는 처리)
      quizState = 'IDLE';
      console.log(`[Quiz Detector] ⏳ Phase 2: 12초 타임아웃 초과! 강제 정답 추론기(LLM) 가동`);
      return { action: 'SOLVE', score: 99, reason: '타임아웃, 강제 수집 완료' };
    }
    
    return { action: 'WAIT', score: 99, reason: `문제 대기 중 (${Math.round(elapsed/1000)}/12초)` };
  }

  return { action: 'NONE', score: 0 };
};

export const forceResetQuizDetector = () => {
  quizState = 'IDLE';
  waitingStartTime = 0;
};
