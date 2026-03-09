"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
  google: "구글",
  kakao: "카카오",
  naver: "네이버",
  credentials: "이메일",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/users")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "오류");
        setUsers(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">관리자 대시보드</h1>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
          <span className="text-2xl">🛠️</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* 요약 카드 */}
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
              {users.filter((u) => {
                const d = new Date(u.lastLoginAt);
                const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 7;
              }).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">최근 7일 활성</p>
          </div>
        </div>

        {/* 회원 목록 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">회원 목록</h2>
          </div>

          {loading && (
            <div className="py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-red-500 font-semibold">{error}</p>
              {error.includes("KV") && (
                <p className="text-xs text-gray-400 mt-2">
                  Vercel 대시보드에서 KV 스토어를 연결해주세요.
                </p>
              )}
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              아직 가입한 회원이 없습니다.
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    <th className="px-4 py-3 text-left">가입 방법</th>
                    <th className="px-4 py-3 text-left">가입일</th>
                    <th className="px-4 py-3 text-left">최근 접속</th>
                    <th className="px-4 py-3 text-center">측정횟수</th>
                    <th className="px-4 py-3 text-center">로그인횟수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {u.name || "-"}
                      </td>
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
                      <td className="px-4 py-3 text-center font-bold text-orange-500">
                        {Number(u.scanCount) || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {Number(u.loginCount) || 0}
                      </td>
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
