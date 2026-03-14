import { NextResponse } from "next/server";
import { withSessionRoute, ResolvedDynamicSegments } from "@/lib/session";
import {
  getUserObject,
  unauthorized,
  notFound,
  forbidden,
  parseBody,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";

const schema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const POST = withSessionRoute(
  async (req, { params }: ResolvedDynamicSegments) => {
    const user = await getUserObject(req);
    if (!user) return unauthorized();

    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { body, error } = await parseBody(req, schema);
    if (!body) return NextResponse.json({ error }, { status: 400 });

    const document = await prisma.document.findUnique({
      where: { id },
      select: { userId: true, shareSlug: true },
    });

    if (!document) return notFound("Document");
    if (document.userId !== user.id) return forbidden();

    // Handle share slug generation/revocation
    let shareSlug: string | null | undefined = undefined;
    if (typeof body.isPublic === "boolean") {
      shareSlug = body.isPublic ? (document.shareSlug ?? nanoid(10)) : null;
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(shareSlug !== undefined && { shareSlug }),
      },
    });

    return NextResponse.json(updated);
  },
);
