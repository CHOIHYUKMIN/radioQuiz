/**
 * 한국어 실시간 자막 가독성 향상을 위한 자동 줄바꿈 유틸리티
 */
export const formatKoreanSubtitles = (text: string, limit: number = 25): string => {
  if (!text || text.length <= limit) return text;

  // 문장 종결 어미나 조사가 위치한 뒷부분을 우선적으로 찾아 끊어줌
  const breakPoints = ['은 ', '는 ', '이 ', '가 ', '을 ', '를 ', '다. ', '요. ', '죠. '];
  
  let bestBreak = -1;
  const searchSlice = text.substring(limit - 10, limit + 5); // 15자~30자 사이에서 적절한 지점 찾기

  for (const p of breakPoints) {
    const idx = searchSlice.lastIndexOf(p);
    if (idx !== -1) {
      bestBreak = (limit - 10) + idx + p.length - 1; // 기호 바로 뒤(공백 위치)
      break;
    }
  }

  // 조사를 못 찾았다면 가장 가까운 공백에서 끊음
  if (bestBreak === -1) {
    const spaceIdx = text.substring(0, limit + 5).lastIndexOf(' ');
    if (spaceIdx > limit - 10) {
      bestBreak = spaceIdx;
    }
  }

  if (bestBreak !== -1 && bestBreak < text.length - 5) {
    return text.substring(0, bestBreak).trim() + '\n' + text.substring(bestBreak).trim();
  }

  return text;
};
