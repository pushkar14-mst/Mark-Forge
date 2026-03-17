# MarkForge — Claude Code Rules

## Route Conventions

- All routes use GET or POST only. No PUT, PATCH, DELETE handlers.
- Mutations are always POST, scoped to sub-paths:
  - Create → `/api/[resource]/add`
  - Update → `/api/[resource]/[id]/update`
  - Delete → `/api/[resource]/[id]/delete`
- Every route file exports a single method. No multiple exports per file.
- Always wrap handlers with `withSessionRoute` from `@/lib/session`.

## Auth & Validation

- Every protected route must call `getUserObject(req)` as the first thing.
- If `getUserObject` returns null, immediately return `unauthorized()`.
- Never trust `req.session.user` directly for business logic — always go through `getUserObject`.
- All POST routes must validate the request body with a `zod` schema using `parseBody`.
- Return the zod error message directly in the 400 response — no custom messages unless necessary.

## Response Helpers

- Always use the helpers from `@/lib/api` for error responses:
  - `unauthorized()` → 401
  - `forbidden()` → 403
  - `notFound(entity?)` → 404
  - `badRequest(message?)` → 400
  - `serverError(message?)` → 500
- Never construct raw `NextResponse.json({ error: ... })` for these cases.

## Prisma & DB

- Always check ownership before any mutation — fetch the record first, compare userId.
- Avoid nested queries and complex joins. Fetch flat, join in application logic if needed.
- Use `select` on every `findUnique` and `findMany` — never return full records unless the route explicitly needs every field.
- Prefer separate queries over deeply nested `include` chains.

## Caching

- Use Vercel KV for caching user objects with key `user:{id}`, TTL 5 minutes.
- Use Vercel KV for caching AI responses with key `ai:{hash}`, TTL 1 hour.
- Always invalidate KV cache on mutation where relevant.

## General

- All files use TypeScript strict mode — no `any`, no `@ts-ignore`.
- Zod schemas are defined at the top of the route file, not inline.
- No business logic in route files — extract to `lib/` if it grows beyond a few lines.
- Keep route files focused: parse → validate → query → respond.

## Data Fetching

- Never use Next.js server actions. All mutations go through API routes.
- All client-side GET requests use useSWR, never raw fetch in useEffect.
- SWR key is always the API route path string e.g. `/api/documents`.

## WASM

- Markdown parsing runs in a Web Worker via `useMarkdownWorker`
- Never call the WASM parser on the main thread
- KaTeX and Mermaid are extracted before WASM parse, restored after
- WASM build output lives in `public/wasm/` — never edit these files manually
- To rebuild: `cd markdown-wasm && wasm-pack build --target web --out-dir ../public/wasm`

```

---

Route structure now looks like:
```

app/api/documents/
├── route.ts # GET all
├── add/route.ts # POST create
└── [id]/
├── route.ts # GET single
├── update/route.ts # POST update
└── delete/route.ts # POST delete
