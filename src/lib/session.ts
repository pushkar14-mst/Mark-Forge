import { NextRequest } from "next/server";
import { getIronSession, IronSession } from "iron-session";
import { unsealData } from "iron-session";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { redirect } from "next/navigation";

export const SESSION_OPTIONS = {
  cookieName: "markforge_session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export type SessionData = {
  user: UserData;
};

export type UserData = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type DynamicSegments = {
  params: Promise<{ [key: string]: string } | undefined>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export type ResolvedDynamicSegments = {
  params: { [key: string]: string } | undefined;
  searchParams?: { [key: string]: string | string[] | undefined };
};

export type RouteHandler = (
  request: NextRequest,
  routeSegment: DynamicSegments,
) => Promise<Response>;

export type RouteHandlerWithSession = (
  request: NextRequest & { session: IronSession<SessionData> },
  routeSegment: ResolvedDynamicSegments,
) => Promise<Response>;

export const withSessionRoute = (
  handler: RouteHandlerWithSession,
): RouteHandler => {
  return async (request, routeSegment) => {
    const awaitedSegment = {
      params: routeSegment.params ? await routeSegment.params : undefined,
      searchParams: routeSegment.searchParams
        ? await routeSegment.searchParams
        : undefined,
    };

    const cookieResponse = new Response();
    const session = await getIronSession<SessionData>(
      request,
      cookieResponse,
      SESSION_OPTIONS,
    );

    const sessionRequest = Object.assign(request, { session });
    const response = await handler(sessionRequest, awaitedSegment);

    const setCookie = cookieResponse.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  };
};

// For server components — redirects to login if no session
export async function getUserSSR(
  cookies: ReadonlyRequestCookies,
): Promise<UserData> {
  const found = (await cookies).get(SESSION_OPTIONS.cookieName);
  if (!found) return redirect("/login");

  const { user } = await unsealData<SessionData>(found.value, {
    password: process.env.SESSION_SECRET as string,
  });

  return user;
}

// For server components — returns null instead of redirecting
export async function getUserSSRNoRedirect(
  cookies: ReadonlyRequestCookies,
): Promise<UserData | null> {
  const found = (await cookies).get(SESSION_OPTIONS.cookieName);
  if (!found) return null;

  const { user } = await unsealData<SessionData>(found.value, {
    password: process.env.SESSION_SECRET as string,
  });

  return user ?? null;
}

export async function isLoggedIn(
  cookies: ReadonlyRequestCookies,
): Promise<boolean> {
  const found = (await cookies).get(SESSION_OPTIONS.cookieName);
  if (!found) return false;

  const { user } = await unsealData<SessionData>(found.value, {
    password: process.env.SESSION_SECRET as string,
  });

  return !!user;
}
