import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, hashPassword } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "모든 항목을 입력하세요." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  }

  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<string>("admin:passwordHash");
    const currentHash = hashPassword(currentPassword);

    if (!stored || stored !== currentHash) {
      return NextResponse.json({ error: "현재 비밀번호가 틀렸습니다." }, { status: 401 });
    }

    await kv.set("admin:passwordHash", hashPassword(newPassword));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
