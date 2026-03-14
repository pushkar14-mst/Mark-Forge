import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/auth";
import { SESSION_OPTIONS, SessionData } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  const { id, email, user_metadata } = data.user;

  if (!email) {
    return NextResponse.redirect(
      new URL("/login?error=no_email", process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  // Upsert user in our DB
  const user = await upsertUser({
    id,
    email,
    name: user_metadata?.full_name ?? user_metadata?.name ?? null,
    avatarUrl: user_metadata?.avatar_url ?? null,
  });

  // Write iron-session
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_APP_URL),
  );

  const session = await getIronSession<SessionData>(
    request,
    response,
    SESSION_OPTIONS,
  );

  session.user = {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    avatarUrl: user.avatarUrl ?? undefined,
  };

  await session.save();

  return response;
}
