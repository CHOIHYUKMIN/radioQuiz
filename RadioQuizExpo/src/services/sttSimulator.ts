export const startSTTSimulation = (
  channelName: string,
  onSubtitle: (text: string) => void
) => {
  const templates = [
    "네, 다음 사연 읽어보겠습니다.",
    "오늘 날씨 정말 좋네요, 그죠?",
    "여기서 노래 한 곡 듣고 올까요?",
    "잠시 후 2부에서 뵙겠습니다.",
    "[퀴즈] 자, 여기서 퀴즈 나갑니다! 다음 중 정답은 무엇일까요?",
    "정답 아시는 분들은 샵 8910으로 보내주세요.",
    "짧은건 50원 긴건 100원입니다.",
    "정답 발표하겠습니다. 정답은 2번이었습니다!",
    "많은 분들이 정답 맞춰주셨어요. 감사합니다.",
    "문자 하나 읽어볼게요. 1234님이 보내주셨습니다."
  ];

  let intervalId: ReturnType<typeof setTimeout>;

  const simulateChunk = () => {
    const isQuiz = Math.random() > 0.9;
    
    let text;
    if (isQuiz) {
      text = templates[4 + Math.floor(Math.random() * 4)];
    } else {
      text = templates[Math.floor(Math.random() * 4) || 8 || 9];
    }

    onSubtitle(`[${channelName}] ${text}`);

    const nextDelay = 5000 + Math.random() * 3000;
    intervalId = setTimeout(simulateChunk, nextDelay);
  };

  simulateChunk();

  return () => {
    if (intervalId) clearTimeout(intervalId);
  };
};
