import { Download, Radio, MessageSquare, Zap } from "lucide-react";
import { APK_DOWNLOAD_URL } from "@/constants/links";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-rose-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/10 bg-black/50 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-500" />
            <span className="text-xl font-bold tracking-tight">RadioQuiz</span>
          </div>
          <a
            href="#download"
            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors"
          >
            앱 다운로드
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            라디오 퀴즈 정답, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">
              이제 자동으로 보내세요.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
            KBS, MBC, SBS 라디오 채널을 실시간으로 분석합니다.
            AI가 퀴즈를 감지하고 정답을 찾아 원터치로 문자를 전송합니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8" id="download">
            <a
              href={APK_DOWNLOAD_URL}
              className="flex items-center gap-3 bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
            >
              <Download className="w-5 h-5" />
              Android APK 다운로드
            </a>
            <p className="text-sm text-neutral-500 mt-2 sm:mt-0 sm:ml-4">
              v1.0.0 (MVP Beta) • 안드로이드 전용
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-32 grid md:grid-cols-3 gap-8 px-4">
          <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-4 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">다채널 실시간 수신</h3>
            <p className="text-neutral-400 leading-relaxed">
              KBS 쿨FM, SBS 파워FM 등 여러 채널의 방송을 백그라운드에서 동시에 수신합니다.
            </p>
          </div>

          <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-4 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">AI 자막 분석</h3>
            <p className="text-neutral-400 leading-relaxed">
              듣지 않아도 괜찮습니다. 실시간 음성을 텍스트로 변환하고 퀴즈 패턴을 감지합니다.
            </p>
          </div>

          <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-4 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">원터치 SMS 발송</h3>
            <p className="text-neutral-400 leading-relaxed">
              정답이 감지되면 화면에 버튼이 나타납니다. 클릭 한 번으로 라디오국에 문자를 발송하세요.
            </p>
          </div>
        </div>

        {/* Demo Preview Placeholder */}
        <div className="max-w-4xl mx-auto mt-32 bg-neutral-900/50 border border-white/10 rounded-[3rem] p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          <div className="aspect-video bg-neutral-950 rounded-[2.5rem] border border-white/5 flex items-center justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
              <p className="text-neutral-500 font-mono text-sm tracking-widest mb-2">[ DEMO APP INTERFACE ]</p>
              <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 px-4 py-2 rounded-full border border-rose-500/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                퀴즈 감지 중...
              </div>
            </div>
            {/* Fake lines to look like app UI */}
            <div className="absolute bottom-10 left-10 space-y-3 opacity-20">
              <div className="h-4 w-48 bg-white rounded-full" />
              <div className="h-4 w-64 bg-white rounded-full" />
              <div className="h-4 w-32 bg-rose-500 rounded-full" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-neutral-500 text-sm">
          <p>© 2026 RadioQuiz MVP Project.</p>
          <p>Made with React Native & Next.js</p>
        </div>
      </footer>
    </div>
  );
}
