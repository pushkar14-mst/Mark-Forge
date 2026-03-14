import { IronSession } from "iron-session";
import { NextResponse } from "next/server";
import { SessionData } from "./session";
import { prisma } from "./prisma";
import { kv } from "@vercel/kv";

export async function buildLogout(
  req: Request & { session: IronSession<SessionData> },
) {
  await req.session.destroy();
  await req.session.save();

  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL),
    {
      status: 302,
    },
  );
}

export async function upsertUser({
  id,
  email,
  name,
  avatarUrl,
}: {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  return prisma.user.upsert({
    where: { id },
    update: { name, avatarUrl },
    create: { id, email, name, avatarUrl },
  });
}

// KV-cached user fetch — used in API routes that need full user object
export async function getCachedUser(userId: string) {
  try {
    const key = `user:${userId}`;
    const cached = await kv.get<string>(key);
    if (cached) return JSON.parse(cached);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await kv.set(key, JSON.stringify(user), { ex: 60 * 5 });
    }

    return user;
  } catch {
    return null;
  }
}
