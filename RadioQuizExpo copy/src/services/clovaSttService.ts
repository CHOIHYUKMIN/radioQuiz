import axios from 'axios';

const CLOVA_INVOKE_URL = 'YOUR_CLOVA_INVOKE_URL_HERE';
const CLOVA_SECRET_KEY = 'YOUR_CLOVA_SECRET_KEY_HERE';

export const recognizeAudio = async (base64AudioChunk: string): Promise<string> => {
  try {
    const response = await axios.post(
      `${CLOVA_INVOKE_URL}/recognizer/object-storage`,
      {
        dataKey: base64AudioChunk,
        language: 'ko-KR',
        completion: 'sync',
      },
      {
        headers: {
          'X-CLOVASPEECH-API-KEY': CLOVA_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data?.text || '';
  } catch (error) {
    console.error('STT API Error:', error);
    return '[자막 변환 실패]';
  }
};
