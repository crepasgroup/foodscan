import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

interface UserRecord {
  email: string;
  name: string;
  provider: string;
  joinedAt: string;
  lastLoginAt: string;
  loginCount: number;
  scanCount: number;
}

async function getUsers(): Promise<UserRecord[]> {
  try {
    const { kv } = await import("@vercel/kv");
    const emails = await kv.smembers("foodscan:users");
    if (!emails || emails.length === 0) return [];
    const users = await Promise.all(
      (emails as string[]).map((e) => kv.hgetall(`user:${e}`))
    );
    return (users.filter(Boolean) as unknown as UserRecord[]).sort(
      (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    );
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const users = await getUsers();
  return <AdminDashboard users={users} />;
}
