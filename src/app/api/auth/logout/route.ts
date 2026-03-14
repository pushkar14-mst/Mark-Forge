import { NextRequest } from "next/server";
import { withSessionRoute } from "@/lib/session";
import { buildLogout } from "@/lib/auth";

export const GET = withSessionRoute(async (request) => {
  return buildLogout(request);
});
