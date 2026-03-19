// @ts-ignore
import { initWhisper, WhisperContext } from 'whisper.rn';
import * as FileSystem from 'expo-file-system';

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
  // Note: whisper.rn uses { model: path }
  whisperContext = await initWhisper({
    model: modelPath,
  });
};

export const startLiveWhisper = async (onTranscription: (text: string) => void) => {
  if (!whisperContext) {
    throw new Error('Whisper context not initialized');
  }

  // whisper.rn realtime API
  const { stop, subscribe } = await whisperContext.transcribeRealtime({
    language: 'ko',
    // In some versions of whisper.rn, realtime might need specific options
  });

  subscribe((event: any) => {
    if (event.result) {
      onTranscription(event.result);
    }
  });

  return stop;
};
