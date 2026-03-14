import { NextResponse } from "next/server";
import { withSessionRoute } from "@/lib/session";
import { getUserObject, unauthorized, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title too long")
    .optional(),
  content: z.string().optional(),
});

export const POST = withSessionRoute(async (req) => {
  const user = await getUserObject(req);
  if (!user) return unauthorized();

  const { body, error } = await parseBody(req, schema);
  if (!body) return NextResponse.json({ error }, { status: 400 });

  const document = await prisma.document.create({
    data: {
      userId: user.id,
      title: body.title ?? "Untitled",
      content: body.content ?? "",
    },
  });

  return NextResponse.json(document, { status: 201 });
});
