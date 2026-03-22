export const extractQuizAnswer = async (transcripts: string[]): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API Key가 .env 파일에 없습니다!');
    return '';
  }

  const prompt = `너는 라디오 단답형 퀴즈 정답 탐정이야.
아래 텍스트는 라디오 방송 대본(STT 자막)이야.

[수행 미션]
1. 이 대본이 현재 "새로운 퀴즈를 청취자에게 내고 있는 상황"인지, 아니면 "이미 끝난 퀴즈의 정답을 DJ가 발표하거나 결과/당첨자를 안내하는 상황"인지 판별해.
2. 만약 "새로운 퀴즈를 내는 상황"이라면, 질문의 맥락을 파악해서 정답 '단어' 1개를 유추해.
3. 만약 "정답 발표/결과 안내/단순 멘트"라면, 퀴즈가 아니라고 판단해.

대본:
"""
${transcripts.join(' ')}
"""
`;

  try {
    console.log('\n========== [Gemini API 요청 (Prompt)] ==========');
    console.log(prompt);
    console.log('==============================================\n');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              isNewQuiz: {
                type: "BOOLEAN",
                description: "현재 대본이 실시간으로 새로운 퀴즈를 출제 중이면 true, 정답 발표/결과 안내/단순 잡담이면 false"
              },
              answer: {
                type: "STRING",
                description: "isNewQuiz가 true일 때만 퀴즈의 정답 단어 1개 기입, 아니면 빈 문자열"
              }
            },
            required: ["isNewQuiz", "answer"]
          }
        }
      })
    });

    if (!response.ok) {
      console.error('[LLM Solver] HTTP Error:', response.status);
      return '';
    }

    const data = await response.json();
    console.log('\n========== [Gemini API 응답 원본] ==========');
    console.log(JSON.stringify(data, null, 2));
    console.log('============================================\n');

    const rawAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    
    let cleanAnswer = '';
    try {
      const parsed = JSON.parse(rawAnswer);
      if (parsed.isNewQuiz === true) {
        cleanAnswer = (parsed.answer || '').trim();
      } else {
        console.log('[LLM Solver] 💡 분석 결과: 새로운 퀴즈 상황이 아님 (정답 발표 또는 결과 안내 중)');
        cleanAnswer = '';
      }
    } catch(e) {
      console.error('[LLM Solver] JSON 파싱 실패:', rawAnswer);
      cleanAnswer = '';
    }
    
    console.log('[LLM Solver] Gemini 추론 정답:', cleanAnswer);
    return cleanAnswer;
  } catch (err) {
    console.error('[LLM Solver] Network 에러:', err);
    return '';
  }
};
