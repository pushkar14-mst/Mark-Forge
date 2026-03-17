import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api";
import { withSessionRoute } from "@/lib/session";

export const GET = withSessionRoute(async (_req, { params }) => {
  const slug = params?.slug as string;

  const document = await prisma.document.findUnique({
    where: { shareSlug: slug, isPublic: true },
    select: { title: true, content: true },
  });

  if (!document) return notFound("Document");
  return NextResponse.json(document);
});
