const apiKey = 'AIzaSyALXjttz3XbST4KF_m7fJZaWntpIKWmiV4';

const prompt = `너는 라디오 단답형 퀴즈 정답 탐정이야.
아래 텍스트는 라디오 방송에서 방금 DJ가 청취자에게 낸 퀴즈 주변의 대본(STT 자막)이야.
이 대본을 읽고 퀴즈의 질문을 파악한 뒤, 그 정답을 유추해.
질문의 맥락을 파악해서 정답을 유추해주고 쓸때업는 어미는 붙이지 말아줘!

대본:
"""
지금부터 퀴즈 한글을 창조하신 분은 누구일까요 정답을 보내주세요 샵 8910 아
"""`;

async function testUserPrompt() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              answer: {
                type: "STRING",
                description: "퀴즈의 정답 단어 딱 1개 (예: 세종대왕, 카이로, 사과)"
              }
            },
            required: ["answer"]
          }
        }
      })
    });
    console.log('--- HTTP Status ---');
    console.log(res.status);
    
    if (res.status === 200) {
      const data = await res.json();
      console.log('--- JSON RAW ---');
      console.log(JSON.stringify(data, null, 2));

      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      const cleanAnswer = answer?.replace(/[.\n]/g, '') || '';
      console.log('--- 최종 파싱된 정답 ---');
      console.log(`[${cleanAnswer}]`);
    } else {
      const errText = await res.text();
      console.log('Error Body:', errText);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testUserPrompt();
