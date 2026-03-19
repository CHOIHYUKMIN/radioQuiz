# 📻 RadioQuiz MVP Project

실시간 라디오 방송을 청취하고 AI(STT)를 통해 퀴즈를 자동으로 탐지하여 정답 문자를 원터치로 발송해주는 안드로이드 애플리케이션 및 랜딩 페이지 프로젝트입니다.

---

## 🚀 프로젝트 개요 (Concept)
라디오 청취 중 퀴즈가 나오면 직접 타이핑하거나 검색할 필요 없이, 앱이 실시간으로 방송을 자막화하고 퀴즈 패턴을 감지하여 사용자에게 알림을 줍니다. 사용자는 버튼 클릭 한 번으로 라디오국에 정답 문자를 보낼 수 있습니다.

- **핵심 가치**: 라디오 퀴즈 참여의 허들을 낮추고 당첨 기회를 극대화.
- **주요 기능**: 다채널 실시간 스트리밍, AI 자막(STT), 퀴즈 감지 알고리즘, 원터치 SMS 발송.

---

## 🛠 기술 스택 (Tech Stack)

### 📱 Mobile App (Android)
- **Framework**: React Native (Expo SDK 51+)
- **Audio Control**: `react-native-track-player` (백그라운드 스트리밍)
- **SMS Integration**: `react-native-sms` (자동 문자 발송)
- **State Management**: React Hooks & Context API
- **Cloud Build**: Expo Application Services (EAS)

### 🌐 Web Landing Page
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Design Concepts**: Dark Mode, Glassmorphism, Responsive Design
- **Hosting**: Firebase Hosting (Static Export)

---

## 📝 개발 내역 (Development Progress)

### ✅ 완료된 작업 (Completed)
- [x] **프로젝트 인프라 구축**: Expo 환경 마이그레이션 및 EAS 빌드 설정 완료.
- [x] **다채널 스트리밍 시스템**: KBS, MBC, SBS 등 6개 주요 라디오 채널 스트림 URL 연동.
- [x] **UI/UX 구현**: 채널 선택 탭, 실시간 자막 스크롤 뷰, 퀴즈 감지 시 팝업 버튼 구현.
- [x] **SMS 연동**: 안드로이드 네이티브 SMS 모듈 연동 및 발송 테스트 완료.
- [x] **STT 시뮬레이터**: 실제 자막 수신 시나리오 테스트를 위한 모의 STT 서비스 구축.
- [x] **웹 랜딩 페이지**: 앱 소개 및 APK 다운로드 링크를 제공하는 세련된 Next.js 웹사이트 배포 (`https://radioquiz-19892.web.app`).
- [x] **형상 관리**: GitHub 연동 및 전체 소스 코드 동기화 (`main` 브랜치).

---

## 📌 향후 과제 (TODO List)

### 1단계: 핵심 기능 고도화 (Finalizing MVP)
- [ ] **네이버 CLOVA Speech API 연동**: 시뮬레이터가 아닌 실제 라디오 음성을 기반으로 한 실시간 자막 구현.
- [ ] **정답 추출 알고리즘**: Gemini AI 또는 GPT API를 연동하여 자막 속 정답 정보(번호, 키워드) 자동 추출 기능.
- [ ] **APK 자동 업데이트**: 앱 빌드 완료 시 웹 페이지 다운로드 버튼에 자동으로 최신 파일 연결 자동화.

### 2단계: UX/UI 개선 (Polish)
- [ ] **채널 관리 기능**: 사용자가 원하는 방송 채널을 직접 추가/삭제할 수 있는 UI 추가.
- [ ] **알림 시스템**: 퀴즈가 감지되었을 때 푸시 알림(Push Notification) 발송 기능.
- [ ] **자막 정확도 개선**: 라디오 특유의 배경음악(BGM)을 필터링하고 목소리만 뚜렷하게 캡처하는 기능 검토.

### 3단계: 채널 확장 (Expansion)
- [ ] **지방 방송 및 소출력 라디오**: 전국 라디오 채널 데이터베이스 확장.
- [ ] **라디오 어플 연동**: 고릴라(SBS), 콩(KBS) 등 전용 앱과 연동하여 정답을 제출하는 방식 연구 (Accessibility Service 활용).

---

## 📂 폴더 구조 (Folder Structure)
- `/RadioQuizExpo`: 메인 리액트 네이티브(Expo) 애플리케이션 프로젝트.
- `/web`: Next.js 기반 랜딩 페이지 및 APK 배포용 웹 프로젝트.
- `src/data/channels.json`: 라디오 채널 데이터 관리 파일.

## 📡 CI/CD 자동 배포 (GitHub Actions)

본 프로젝트는 GitHub `main` 브랜치에 코드가 푸시되면 자동으로 Firebase Hosting에 배포되도록 설정되어 있습니다.

### ⚙️ 초기 설정 방법 (최초 1회)
자동 배포를 활성화하려면 GitHub Repository에 Firebase 권한(Service Account)을 등록해야 합니다.

1. **Firebase 서비스 계정 키 생성**:
   - [Firebase 콘솔 > 서비스 계정](https://console.firebase.google.com/project/radioquiz-19892/settings/serviceaccounts/adminsdk)에서 **[새 민감한 키 생성]** 클릭.
   - 다운로드된 JSON 파일 내용을 전체 복사.
2. **GitHub Secrets 등록**:
   - GitHub 저장소의 `Settings` > `Secrets and variables` > `Actions`로 이동.
   - **New repository secret** 생성.
     - 이름: `FIREBASE_SERVICE_ACCOUNT_RADIOQUIZ_19892`
     - 내용: 복사한 JSON 텍스트 붙여넣기.

### 🚀 배포 프로세스
- `web/` 폴더 내의 코드를 수정한 후 GitHub에 `push`하면 자동으로 다음 작업이 수행됩니다:
  1. `npm install` (의존성 설치)
  2. `npm run build` (Next.js 정적 빌드)
  3. Firebase Hosting으로 업로드 및 릴리즈.

---
**문의 및 제안**: [GitHub Issues](https://github.com/CHOIHYUKMIN/radioQuiz/issues) 를 통해 남겨주세요.
