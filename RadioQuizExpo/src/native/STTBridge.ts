import { ExpoSpeechRecognitionModule, addSpeechRecognitionListener } from 'expo-speech-recognition';
import { Alert, Platform } from 'react-native';

export const isSTTReady = () => true;

export const initSTTBridge = async (onProgress?: (progress: number) => void): Promise<void> => {
  if (onProgress) onProgress(1);
  console.log('CloudSTTBridge: Expo Speech API ready.');

  try {
    const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permissions.granted) {
      console.error('CloudSTTBridge: Permission not granted!');
    }

    try {
      const downloadRes = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: 'ko-KR' });
      console.log('CloudSTTBridge: Offline model status:', downloadRes.status);
    } catch (e) {
      console.log('CloudSTTBridge: Offline model trigger skipped', e);
    }
  } catch (e) {
    console.log('CloudSTTBridge: Permission request bypassed or error', e);
  }
};

let currentOnTranscribe: ((text: string, isNewChunk: boolean) => void) | null = null;
let currentOnEnd: (() => void) | null = null;
let hasEmittedInThisSession = false;

addSpeechRecognitionListener("start", () => {
  hasEmittedInThisSession = false;
});

addSpeechRecognitionListener("result", (event) => {
  if (event.results && event.results.length > 0 && currentOnTranscribe) {
    const transcript = event.results[0].transcript;
    const isFinal = event.isFinal;
    // console.log(`CloudSTTBridge: [Result] Final=${isFinal}, New=${!hasEmittedInThisSession}, Text: "${transcript.substring(0, 20)}..."`);

    if (transcript) {
      const isNoise = transcript.length === 0 ||
        transcript.match(/^[.,?!-]+$/) ||
        transcript.includes('구독') || transcript.includes('좋아요') || transcript.includes('시청해주셔서');

      if (!isNoise) {
        currentOnTranscribe(transcript, !hasEmittedInThisSession);

        if (isFinal) {
          hasEmittedInThisSession = false;
        } else {
          hasEmittedInThisSession = true;
        }
      }
    }
  }
});

addSpeechRecognitionListener("end", () => {
  console.log('CloudSTTBridge: Speech ended by Google.');
  if (currentOnEnd) {
    const cb = currentOnEnd;
    currentOnEnd = null;
    cb();
  }
});

addSpeechRecognitionListener("error", (event) => {
  console.log('CloudSTTBridge: Error', event.error);
  if (currentOnEnd) {
    const cb = currentOnEnd;
    currentOnEnd = null;
    cb();
  }
});

export const startSTT = async (onTranscribe: (text: string, isNewChunk: boolean) => void, onEnd?: () => void) => {
  currentOnTranscribe = onTranscribe;
  currentOnEnd = onEnd;
  hasEmittedInThisSession = false;

  try {
    let targetPackage: string | undefined = undefined;
    let forceOffline = false;

    try {
      const services = ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
      console.log('CloudSTTBridge: Available Services -', services);
      if (services.includes('com.google.android.googlequicksearchbox')) {
        targetPackage = 'com.google.android.googlequicksearchbox';
      } else if (services.includes('com.google.android.as')) {
        targetPackage = 'com.google.android.as';
        forceOffline = true;
      }
    } catch (e) {
      console.log('CloudSTTBridge: Failed to get services', e);
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'ko-KR',
      interimResults: true,
      continuous: true, // 끊기지 않고 라디오 방송을 연속으로 계속 듣기
      requiresOnDeviceRecognition: forceOffline,
      androidRecognitionServicePackage: targetPackage
    });
    console.log('CloudSTTBridge: Google STT Started.');
  } catch (e) {
    console.error('CloudSTTBridge: start fail', e);
    throw e;
  }

  return async () => {
    try {
      ExpoSpeechRecognitionModule.stop();
      currentOnTranscribe = null;
      currentOnEnd = null;
    } catch (e) {
      console.log('CloudSTTBridge: stop error', e);
    }
  };
};

export const stopSTT = async () => {
  try {
    ExpoSpeechRecognitionModule.abort();
  } catch (e) { }
};
