// @ts-ignore
import { initWhisper, WhisperContext } from 'whisper.rn';
import * as FileSystem from 'expo-file-system/legacy';

const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin'; 
const MODEL_NAME = 'ggml-base.bin';

let whisperContext: WhisperContext | null = null;

export const initWhisperService = async (onProgress?: (progress: number) => void): Promise<void> => {
  // @ts-ignore
  const modelDir = `${FileSystem.documentDirectory}whisper/`;
  const modelPath = `${modelDir}${MODEL_NAME}`;

  // @ts-ignore
  const dirInfo = await FileSystem.getInfoAsync(modelDir);
  if (!dirInfo.exists) {
    // @ts-ignore
    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
  }

  // @ts-ignore
  const modelInfo = await FileSystem.getInfoAsync(modelPath);
  if (!modelInfo.exists) {
    console.log('Downloading Whisper model...');
    // @ts-ignore
    const downloadResumable = FileSystem.createDownloadResumable(
      MODEL_URL,
      modelPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgress) onProgress(progress);
      }
    );
    await downloadResumable.downloadAsync();
  }

  console.log('Initializing Whisper context...');
  // Note: whisper.rn uses system file paths, not file:// URIs on Android
  const finalModelPath = modelPath.startsWith('file://') ? modelPath.slice(7) : modelPath;
  
  whisperContext = await initWhisper({
    filePath: finalModelPath,
  });
};

let isDirectStreamRunning = false;

// 기존 마이크 기반 실시간 STT
export const startLiveWhisper = async (onTranscribe: (text: string) => void) => {
  if (!whisperContext) throw new Error('Whisper context not initialized');

  console.log('Starting Realtime transcription...');
  const { stop, subscribe } = await whisperContext.transcribeRealtime({
    language: 'ko',
    realtimeAudioSec: 3, // 3초 단위로 쪼개어 분석
    incremental: true,   // 누적 자막 사용
  });

  subscribe((evt: any) => {
    const { isCapturing, data } = evt;
    if (data?.result) {
      console.log('Whisper Result:', data.result);
      onTranscribe(data.result);
    }
  });

  return stop;
};
