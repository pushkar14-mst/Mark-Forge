import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { withSessionRoute } from "@/lib/session";
import { parseBody, badRequest, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const POST = withSessionRoute(async (req) => {
  const { body, error } = await parseBody(req, schema);
  if (!body) return badRequest(error ?? undefined);

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) return unauthorized();

  const valid = await compare(body.password, user.passwordHash);
  if (!valid) return unauthorized();

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    avatarUrl: user.avatarUrl ?? undefined,
  };
  await req.session.save();

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
});
