import { NextResponse } from "next/server";
import { withSessionRoute, ResolvedDynamicSegments } from "@/lib/session";
import { getUserObject, unauthorized, notFound, forbidden } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import getRedis from "@/lib/redis";

export const POST = withSessionRoute(
  async (req, { params }: ResolvedDynamicSegments) => {
    const user = await getUserObject(req);
    if (!user) return unauthorized();

    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const document = await prisma.document.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!document) return notFound("Document");
    if (document.userId !== user.id) return forbidden();

    await prisma.document.delete({ where: { id } });

    await (await getRedis()).del(`docs:${user.id}`);

    return NextResponse.json({ success: true });
  },
);
