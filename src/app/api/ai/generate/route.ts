import { withSessionRoute } from "@/lib/session";
import { getUserObject, unauthorized, badRequest } from "@/lib/api";
import { streamText } from "ai";
import getRedis from "@/lib/redis";
import { z } from "zod";
import { parseBody } from "@/lib/api";
import { createHash } from "crypto";
import { google } from "@/lib/ai";

const schema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt too long"),
  documentContext: z.string().max(10000).optional(),
});

function hashPrompt(prompt: string, context?: string): string {
  return createHash("sha256")
    .update(`${prompt}:${context ?? ""}`)
    .digest("hex");
}

function simulateStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let offset = 0;
  const CHUNK = 8;
  const DELAY = 12;

  return new ReadableStream({
    async pull(controller) {
      if (offset >= text.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(text.slice(offset, offset + CHUNK)));
      offset += CHUNK;
      await new Promise((res) => setTimeout(res, DELAY));
    },
  });
}

const SYSTEM = `\
You are a writing assistant embedded in MarkForge, a Markdown editor that renders:
  - Standard Markdown (headings, lists, tables, bold, italic, links, code blocks)
  - Mathematical equations via KaTeX
  - Diagrams via Mermaid

OUTPUT RULES — follow these exactly, no exceptions:

## Markdown
- Respond only with the content itself — no preamble, no "Here is your…", no explanations.
- Use headings, lists, tables, and fenced code blocks where they improve clarity.

## Math / Equations (KaTeX)
- Inline math:  wrap in single dollar signs  → $E = mc^2$
- Block / display math: wrap in double dollar signs on their own lines →
  $$
  \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
  $$
- Use standard LaTeX notation inside the delimiters.
- Do NOT use \\( \\) or \\[ \\] — only $ and $$ delimiters work in this renderer.

## Diagrams (Mermaid)
- Always open with \`\`\`mermaid (exactly this fence, lowercase, no spaces).
- Close with \`\`\`.
- Supported diagram types and their correct opening keywords:
    • Flowchart:      flowchart TD  (or LR / BT / RL)
    • Sequence:       sequenceDiagram
    • Class:          classDiagram
    • State:          stateDiagram-v2
    • ER diagram:     erDiagram
    • Gantt:          gantt
    • Pie chart:      pie title My Chart
    • Git graph:      gitGraph
- Arrow / edge syntax for flowcharts:
    • Solid arrow:     A --> B
    • Solid line:      A --- B
    • Dotted arrow:    A -.-> B
    • Thick arrow:     A ==> B
    • Label on edge:   A -->|label| B
- Node shape syntax:
    • Rectangle:       A[Label]
    • Rounded:         A(Label)
    • Stadium:         A([Label])
    • Diamond:         A{Decision}
    • Circle:          A((Label))
- Do NOT use angle-bracket nodes like A<Label> — they break the renderer.
- IMPORTANT — special characters in labels: if a label contains parentheses, equals signs,
  slashes, carets, colons, or math expressions, you MUST wrap the label text in double quotes:
    A["log(x) = log_b(x)"]   ✓ correct
    A[log(x) = log_b(x)]     ✗ breaks parser
- When in doubt, always quote the label. Quoted labels handle virtually any text safely.
- Keep diagrams simple and syntactically correct; prefer fewer nodes over complex broken ones.
- One diagram per code block. Multiple diagrams = multiple fenced blocks.

# IMPORTANT RULE : GENERATE DIAGRAMS WHEN ASKED EXPLICITLY TO DO SO.
`;

export const POST = withSessionRoute(async (req) => {
  const user = await getUserObject(req);
  if (!user) return unauthorized();

  const { body, error } = await parseBody(req, schema);
  if (!body) return badRequest(error ?? undefined);

  const { prompt, documentContext } = body;

  const fullPrompt = documentContext
    ? `Current document context:\n\n${documentContext}\n\n---\n\n${prompt}`
    : prompt;

  // Check KV cache first (non-streaming cached responses)
  const cacheKey = `ai:${hashPrompt(prompt, documentContext)}`;

  const cached = await (await getRedis()).get(cacheKey);
  if (cached) {
    return new Response(simulateStream(cached), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const result = streamText({
    model: google("gemini-2.5-flash-lite"),
    system: SYSTEM,
    prompt: fullPrompt,
    onFinish: async ({ text }) => {
      await (await getRedis()).set(cacheKey, text, { EX: 300 });
    },
  });

  return result.toTextStreamResponse();
});
