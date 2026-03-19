import SendSMS from 'react-native-sms';

export const sendQuizAnswerSms = (targetNumber: string, answerText: string) => {
  return new Promise((resolve, reject) => {
    SendSMS.send(
      {
        body: answerText,
        recipients: [targetNumber],
        successTypes: ['sent'],
        allowAndroidSendWithoutReadPermission: true,
      },
      (completed, cancelled, error) => {
        if (completed) {
          console.log('✅ SMS 전송 완료:', targetNumber, answerText);
          resolve(true);
        } else if (cancelled) {
          console.log('⚠️ SMS 전송 취소됨');
          resolve(false);
        } else if (error) {
          console.error('❌ SMS 전송 에러:', error);
          reject(error);
        }
      }
    );
  });
};
