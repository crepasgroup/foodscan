"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserRecord {
  email: string;
  name: string;
  provider: string;
  joinedAt: string;
  lastLoginAt: string;
  loginCount: number;
  scanCount: number;
}

const PROVIDER_LABEL: Record<string, string> = {
  google: "구글", kakao: "카카오", naver: "네이버", credentials: "이메일",
};

function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminDashboard({ users }: { users: UserRecord[] }) {
  const router = useRouter();
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) { setPwError("새 비밀번호가 일치하지 않습니다."); return; }
    if (newPw.length < 6) { setPwError("비밀번호는 6자 이상이어야 합니다."); return; }
    setPwLoading(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (res.ok) {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 2000);
    } else {
      setPwError(data.error || "오류가 발생했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">관리자 대시보드</h1>
            <p className="text-xs text-gray-400">푸드스캔 Admin</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChangePw(true)}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold transition-colors"
            >
              🔑 비밀번호 변경
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-semibold transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 비밀번호 변경 모달 */}
      {showChangePw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChangePw(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5">비밀번호 변경</h2>
            <form onSubmit={handleChangePw} className="space-y-3">
              <input
                type="password" placeholder="현재 비밀번호" value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              />
              <input
                type="password" placeholder="새 비밀번호 (6자 이상)" value={newPw}
                onChange={(e) => setNewPw(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              />
              <input
                type="password" placeholder="새 비밀번호 확인" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              />
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-green-500">✓ 비밀번호가 변경되었습니다!</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowChangePw(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">
                  취소
                </button>
                <button type="submit" disabled={pwLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60">
                  {pwLoading ? "변경 중..." : "변경"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* 요약 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-extrabold text-orange-500">{users.length}</p>
            <p className="text-xs text-gray-500 mt-1">총 회원수</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-extrabold text-blue-500">
              {users.reduce((s, u) => s + (Number(u.scanCount) || 0), 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">총 측정횟수</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <p className="text-3xl font-extrabold text-green-500">
              {users.filter((u) => (Date.now() - new Date(u.lastLoginAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">최근 7일 활성</p>
          </div>
        </div>

        {/* 회원 목록 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">회원 목록</h2>
            <span className="text-xs text-gray-400">{users.length}명</span>
          </div>
          {users.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">아직 가입한 회원이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    <th className="px-4 py-3 text-left">가입 방법</th>
                    <th className="px-4 py-3 text-left">가입일</th>
                    <th className="px-4 py-3 text-left">최근 접속</th>
                    <th className="px-4 py-3 text-center">측정횟수</th>
                    <th className="px-4 py-3 text-center">접속횟수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name || "-"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.provider === "kakao" ? "bg-yellow-100 text-yellow-700" :
                          u.provider === "naver" ? "bg-green-100 text-green-700" :
                          u.provider === "google" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {PROVIDER_LABEL[u.provider] || u.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.joinedAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-center font-bold text-orange-500">{Number(u.scanCount) || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{Number(u.loginCount) || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
