import { createHash, createHmac } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";
const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + SECRET).digest("hex");
}

export function createAdminToken(email: string): string {
  const ts = Date.now().toString();
  const sig = createHmac("sha256", SECRET).update(`${email}:${ts}`).digest("hex");
  return Buffer.from(`${email}:${ts}:${sig}`).toString("base64");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, ts, sig] = decoded.split(":");
    const adminEmail = process.env.ADMIN_EMAIL || "";
    if (email !== adminEmail) return false;
    if (Date.now() - parseInt(ts) > COOKIE_MAX_AGE * 1000) return false;
    const expected = createHmac("sha256", SECRET).update(`${email}:${ts}`).digest("hex");
    return sig === expected;
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export function getAdminCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

export async function getOrInitAdminPassword(): Promise<string> {
  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<string>("admin:passwordHash");
    if (!stored) {
      const defaultHash = hashPassword("123456");
      await kv.set("admin:passwordHash", defaultHash);
      return defaultHash;
    }
    return stored;
  } catch {
    return hashPassword("123456");
  }
}
