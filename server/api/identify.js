// 라디오퀴즈 곡 인식 중계 서버 (Vercel 함수)
// 앱에 ACRCloud 비밀키를 넣으면 APK에서 꺼낼 수 있어서, 키는 이 서버의 환경변수에만 두고
// 앱은 오디오 조각만 보낸다. 서버가 서명을 붙여 ACRCloud에 대신 요청하고 결과를 그대로 돌려준다.
//
// 환경변수 (Vercel 프로젝트 Settings > Environment Variables)
//   ACR_HOST           예: identify-ap-southeast-1.acrcloud.com
//   ACR_ACCESS_KEY     ACRCloud 프로젝트의 Access Key
//   ACR_ACCESS_SECRET  ACRCloud 프로젝트의 Access Secret
//   APP_TOKEN          앱과 맞춘 임의의 긴 문자열 - 아무나 이 서버를 불러 인식 횟수를 쓰지 못하게 한다

import crypto from 'node:crypto';

// 10초 클립: 오디오 약 250KB, EBS/TBS 영상 스트림 조각 약 1MB. Vercel 요청 한도(4.5MB) 안쪽으로 막는다.
const MAX_SAMPLE_BYTES = 3 * 1024 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const isConfigured = () =>
  !!(process.env.ACR_HOST && process.env.ACR_ACCESS_KEY && process.env.ACR_ACCESS_SECRET && process.env.APP_TOKEN);

// 설정 확인용: 브라우저로 열면 키 없이 설정 여부만 알려준다
export function GET() {
  return json({ ok: true, configured: isConfigured() });
}

export async function POST(request) {
  const { ACR_HOST, ACR_ACCESS_KEY, ACR_ACCESS_SECRET, APP_TOKEN } = process.env;
  if (!isConfigured()) return json({ status: { code: 5000, msg: 'server not configured' } }, 500);
  if (request.headers.get('x-app-token') !== APP_TOKEN) return json({ status: { code: 4030, msg: 'forbidden' } }, 403);

  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_SAMPLE_BYTES + 64 * 1024) return json({ status: { code: 4130, msg: 'sample too large' } }, 413);

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ status: { code: 4000, msg: 'bad request' } }, 400);
  }
  const sample = form.get('sample');
  if (!sample || typeof sample === 'string') return json({ status: { code: 4001, msg: 'no sample' } }, 400);
  if (sample.size > MAX_SAMPLE_BYTES) return json({ status: { code: 4130, msg: 'sample too large' } }, 413);

  // ACRCloud 서명: HMAC-SHA1(method \n uri \n access_key \n data_type \n signature_version \n timestamp)
  const httpUri = '/v1/identify';
  const dataType = 'audio';
  const signatureVersion = '1';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const stringToSign = ['POST', httpUri, ACR_ACCESS_KEY, dataType, signatureVersion, timestamp].join('\n');
  const signature = crypto.createHmac('sha1', ACR_ACCESS_SECRET).update(stringToSign).digest('base64');

  const upstream = new FormData();
  upstream.append('access_key', ACR_ACCESS_KEY);
  upstream.append('data_type', dataType);
  upstream.append('signature_version', signatureVersion);
  upstream.append('signature', signature);
  upstream.append('timestamp', timestamp);
  upstream.append('sample_bytes', String(sample.size));
  upstream.append('sample', sample, sample.name || 'clip');

  try {
    const res = await fetch(`https://${ACR_HOST}${httpUri}`, { method: 'POST', body: upstream });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (e) {
    return json({ status: { code: 5020, msg: 'acrcloud unreachable' } }, 502);
  }
}
