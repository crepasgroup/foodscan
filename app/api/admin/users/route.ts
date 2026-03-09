import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { kv } = await import("@vercel/kv");
    const emails = await kv.smembers("foodscan:users");

    if (!emails || emails.length === 0) {
      return NextResponse.json([]);
    }

    const users = await Promise.all(
      (emails as string[]).map((email) => kv.hgetall(`user:${email}`))
    );

    const sorted = users
      .filter(Boolean)
      .sort((a, b) =>
        new Date((b as Record<string, string>).joinedAt).getTime() -
        new Date((a as Record<string, string>).joinedAt).getTime()
      );

    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json(
      { error: "KV 스토어가 설정되지 않았습니다." },
      { status: 500 }
    );
  }
}

// 스캔 횟수 증가 (클라이언트에서 호출)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json();
  if (action !== "scan") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const { kv } = await import("@vercel/kv");
    await kv.hincrby(`user:${session.user.email}`, "scanCount", 1);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
