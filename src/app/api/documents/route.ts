import { NextResponse } from "next/server";
import { withSessionRoute } from "@/lib/session";
import { getUserObject, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const GET = withSessionRoute(async (req) => {
  const user = await getUserObject(req);
  if (!user) return unauthorized();

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

  return NextResponse.json(documents);
});
