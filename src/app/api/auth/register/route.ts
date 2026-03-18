import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { withSessionRoute } from "@/lib/session";
import { parseBody, badRequest, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(80, "Name too long"),
});

export const POST = withSessionRoute(async (req) => {
  const { body, error } = await parseBody(req, schema);
  if (!body) return badRequest(error ?? undefined);

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true },
  });
  if (existing) return badRequest("An account with this email already exists");

  const passwordHash = await hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash,
    },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });

  if (!user) return serverError();

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    avatarUrl: user.avatarUrl ?? undefined,
  };
  await req.session.save();

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 201 },
  );
});
