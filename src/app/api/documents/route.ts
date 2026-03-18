import { NextResponse } from "next/server";
import { withSessionRoute } from "@/lib/session";
import { getUserObject, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import getRedis from "@/lib/redis";

export const GET = withSessionRoute(async (req) => {
  const user = await getUserObject(req);
  if (!user) return unauthorized();

  const cacheKey = `docs:${user.id}`;

  const cached = await (await getRedis()).get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      isPublic: true,
      shareSlug: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await (
    await getRedis()
  ).set(cacheKey, JSON.stringify(documents), { EX: 300 });

  return NextResponse.json(documents);
});
