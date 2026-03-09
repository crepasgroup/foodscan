import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  createAdminToken,
  getOrInitAdminPassword,
  getAdminCookieOptions,
} from "@/lib/admin-auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// POST: 로그인
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요." }, { status: 400 });
  }

  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const storedHash = await getOrInitAdminPassword();
  const inputHash = hashPassword(password);

  if (inputHash !== storedHash) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const token = createAdminToken(email);
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
