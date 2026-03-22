const apiKey = 'AIzaSyALXjttz3XbST4KF_m7fJZaWntpIKWmiV4';

const prompt = `너는 라디오 단답형 퀴즈 정답 탐정이야.
아래 텍스트는 라디오 방송에서 방금 DJ가 청취자에게 낸 퀴즈 주변의 대본(STT 자막)이야.
이 대본을 읽고 퀴즈의 질문을 파악한 뒤, 그 정답을 유추해.
질문의 맥락을 파악해서 정답을 유추해주고 쓸때업는 어미는 붙이지 말아줘!

대본:
"""
시스템 대기 중... 키즈입니다 퀴즈입니다 한글을 창제한 위대한 조선의 왕은
누구일까요 아시는 분은 지금 샵 8920으로 보내주세요 맛있겠다 정답을 보내주세요 고양이 망망
"""`;

async function testPrompt() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 20,
        }
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    
    // 파싱 테스트
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const cleanAnswer = answer?.replace(/[.\n]/g, '') || '';
    console.log('--- 최종 파싱된 정답 ---');
    console.log(`[${cleanAnswer}]`);
    
  } catch (err) {
    console.error(err);
  }
}

testPrompt();
