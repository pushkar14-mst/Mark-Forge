import { withSessionRoute } from "@/lib/session";
import { getUserObject, unauthorized, badRequest } from "@/lib/api";
import { streamText } from "ai";
import { kv } from "@vercel/kv";
import { z } from "zod";
import { parseBody } from "@/lib/api";
import { createHash } from "crypto";
import { google } from "@/lib/ai";

const schema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt too long"),
  documentContext: z.string().max(10000).optional(),
});

const CACHE_TTL = 60 * 60; // 1 hour
const SIMULATED_CHUNK_SIZE = 8; // chars per chunk
const SIMULATED_CHUNK_DELAY = 12; // ms between chunks — feels natural

function hashPrompt(prompt: string, context?: string): string {
  return createHash("sha256")
    .update(`${prompt}:${context ?? ""}`)
    .digest("hex");
}

// Turns a cached string into a simulated text stream
function simulateStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let offset = 0;

  return new ReadableStream({
    async pull(controller) {
      if (offset >= text.length) {
        controller.close();
        return;
      }
      const chunk = text.slice(offset, offset + SIMULATED_CHUNK_SIZE);
      controller.enqueue(encoder.encode(chunk));
      offset += SIMULATED_CHUNK_SIZE;

      // Yield to event loop to simulate delay between chunks
      await new Promise((res) => setTimeout(res, SIMULATED_CHUNK_DELAY));
    },
  });
}

export const POST = withSessionRoute(async (req) => {
  const user = await getUserObject(req);
  if (!user) return unauthorized();

  const { body, error } = await parseBody(req, schema);
  if (!body) return badRequest(error ?? undefined);

  const { prompt, documentContext } = body;
  const cacheKey = `ai:${hashPrompt(prompt, documentContext)}`;

  // Cache hit — simulate streaming so UX is consistent
  const cached = await kv.get<string>(cacheKey);
  if (cached) {
    return new Response(simulateStream(cached), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Cache": "HIT",
      },
    });
  }

  const system = `You are a writing assistant embedded in MarkForge, a markdown editor.
Your job is to generate clean, well-structured markdown content based on the user's prompt.
Always respond in valid markdown. Use headings, lists, code blocks, and formatting where appropriate.
Be concise and purposeful — no filler, no preamble, no explanations outside the content itself.
${documentContext ? `Here is the current document context for reference:\n\n${documentContext}` : ""}`;

  const result = streamText({
    model: google("gemini-3.1-flash-lite"),
    system,
    prompt,
    onFinish: async ({ text }) => {
      await kv.set(cacheKey, text, { ex: CACHE_TTL });
    },
  });

  return result.toTextStreamResponse();
});
