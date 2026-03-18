import { IronSession } from "iron-session";
import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { prisma } from "./prisma";
import { SessionData } from "./session";
import getRedis from "./redis";

type RequestWithSession = Request & { session: IronSession<SessionData> };

// Validates session and returns full user object — use in every protected route
export async function getUserObject(req: RequestWithSession) {
  try {
    const userId = req.session?.user?.id;
    if (!userId) return null;

    const key = `user:${userId}`;

    try {
      const cached = await (await getRedis()).get(key);
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis unavailable — fall through to DB
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    try {
      await (await getRedis()).set(key, JSON.stringify(user), { EX: 300 });
    } catch {
      // Redis unavailable — skip cache write
    }

    return user;
  } catch {
    return null;
  }
}

// Parses and validates request body against a zod schema
export async function parseBody<T>(
  req: Request & { session: IronSession<SessionData> },
  schema: ZodSchema<T>,
): Promise<{ error: string | null; body: T | null }> {
  const body = await req.json();
  //console.log("REQUEST:", req.url, body);

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error(parsed.error);
    if (parsed.error.issues[0].message)
      return { error: parsed.error.issues[0].message, body: null };
    return { error: parsed.error.message, body: null };
  }
  return { error: null, body: parsed.data };
}

export function isValidObjectId(id: string | null | undefined) {
  if (!id) {
    return false;
  }

  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Standard unauthorized response
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Standard not found response
export function notFound(entity = "Resource") {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

// Standard forbidden response
export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Standard bad request response
export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Standard server error response
export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

