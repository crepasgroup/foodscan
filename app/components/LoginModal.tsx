"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [view, setView] = useState<"main" | "email-login" | "email-signup">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuth = async (provider: "google" | "naver" | "kakao") => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl: "/" });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setIsLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      name: view === "email-signup" ? name : undefined,
      redirect: false,
    });
    setIsLoading(false);
    if (res?.ok) {
      onClose();
    } else {
      setError("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 sm:pb-6">
        {/* 핸들바 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        {view === "main" && (
          <>
            <div className="text-center mb-6">
              <p className="text-3xl mb-2">🥗</p>
              <h2 className="text-xl font-extrabold text-gray-900">로그인 / 회원가입</h2>
              <p className="text-sm text-gray-500 mt-1">분석 결과를 저장하려면 로그인이 필요합니다</p>
            </div>

            <div className="space-y-3">
              {/* 카카오 */}
              <button
                onClick={() => handleOAuth("kakao")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-60"
                style={{ backgroundColor: "#FEE500", color: "#191919" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 11c0 2.8 1.567 5.293 3.975 6.8L5 21l3.938-2.062A11.01 11.01 0 0012 19c5.523 0 10-3.477 10-8S17.523 3 12 3z"/>
                </svg>
                카카오로 시작하기
              </button>

              {/* 네이버 */}
              <button
                onClick={() => handleOAuth("naver")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: "#03C75A" }}
              >
                <span className="font-extrabold text-base leading-none">N</span>
                네이버로 시작하기
              </button>

              {/* 구글 */}
              <button
                onClick={() => handleOAuth("google")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-all disabled:opacity-60"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글로 시작하기
              </button>

              {/* 구분선 */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* 이메일 */}
              <button
                onClick={() => setView("email-signup")}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-all"
              >
                ✉️ 이메일로 간편가입
              </button>

              <button
                onClick={() => setView("email-login")}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                이미 계정이 있으신가요? <span className="underline">이메일 로그인</span>
              </button>
            </div>
          </>
        )}

        {(view === "email-login" || view === "email-signup") && (
          <>
            <button
              onClick={() => { setView("main"); setError(""); }}
              className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 text-sm"
            >
              ← 뒤로
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 mb-5">
              {view === "email-signup" ? "이메일로 가입하기" : "이메일 로그인"}
            </h2>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {view === "email-signup" && (
                <input
                  type="text"
                  placeholder="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                  required
                />
              )}
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                required
              />
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                required
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-60"
              >
                {isLoading ? "처리 중..." : view === "email-signup" ? "가입하기" : "로그인"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
