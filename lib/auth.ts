import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NaverProvider from "next-auth/providers/naver";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";

async function recordUser(email: string, name: string, provider: string) {
  try {
    const { kv } = await import("@vercel/kv");
    const existing = await kv.hgetall(`user:${email}`);
    if (!existing) {
      await kv.hset(`user:${email}`, {
        email,
        name: name || "",
        provider,
        joinedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
        scanCount: 0,
      });
      await kv.sadd("foodscan:users", email);
    } else {
      await kv.hset(`user:${email}`, {
        lastLoginAt: new Date().toISOString(),
      });
      await kv.hincrby(`user:${email}`, "loginCount", 1);
    }
  } catch {
    // KV 미설정 시 무시
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID ?? "",
      clientSecret: process.env.NAVER_CLIENT_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "이메일",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
        name: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.password.length < 6) return null;
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.name || credentials.email.split("@")[0],
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (user.email) {
        await recordUser(
          user.email,
          user.name || "",
          account?.provider || "credentials"
        );
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.name = user.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.name = token.name as string;
      return session;
    },
  },
};
