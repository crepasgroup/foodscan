import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  createAdminToken,
  getAdminCookieOptions,
} from "@/lib/admin-auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

async function getStoredPasswordHash(): Promise<string> {
  // KV에 변경된 비밀번호가 있으면 그걸 사용, 없으면 환경변수 비밀번호 사용
  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<string>("admin:passwordHash");
    if (stored) return stored;
  } catch {
    // KV 미설정 시 무시
  }
  return hashPassword(ADMIN_PASSWORD);
}

// POST: 로그인
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요." }, { status: 400 });
  }

  if (!ADMIN_EMAIL) {
    return NextResponse.json({ error: "서버에 ADMIN_EMAIL이 설정되지 않았습니다." }, { status: 500 });
  }

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase()) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const storedHash = await getStoredPasswordHash();
  const inputHash = hashPassword(password);

  if (inputHash !== storedHash) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const token = createAdminToken(email.trim().toLowerCase());
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieOptions(token));
  return res;
}

// DELETE: 로그아웃
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: "admin_session", value: "", maxAge: 0, path: "/" });
  return res;
}
