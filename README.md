# MarkForge

An AI-powered markdown editor with real-time preview, math rendering, and diagram support. Built on a custom WebAssembly markdown parser.

## Features

- **WASM Markdown Parser** — custom Rust-based parser compiled to WebAssembly, runs in a Web Worker off the main thread
- **Live Preview** — real-time split-pane editing with syntax-highlighted output
- **Math Rendering** — KaTeX for inline (`$...$`) and block (`$$...$$`) equations
- **Diagrams** — Mermaid diagram support inside fenced code blocks
- **AI Generation** — generate markdown content (with equations and diagrams) via Gemini 2.5 Flash Lite
- **Document Sharing** — publish documents with a unique public slug
- **Auth** — email/password registration and Google OAuth (via Supabase)
- **Session Persistence** — iron-session with 14-day persistent cookies
- **Redis Caching** — document lists and user objects cached in Redis (5-minute TTL)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Supabase + Prisma |
| Auth | iron-session + bcryptjs + Supabase OAuth |
| Cache | Redis (node-redis v5) |
| AI | Gemini 2.5 Flash Lite via Vercel AI SDK |
| Parser | Custom Rust → WASM (wasm-pack) |
| Math | KaTeX |
| Diagrams | Mermaid |
| Data Fetching | SWR |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected routes (auth required)
│   │   ├── page.tsx        # Home / editor landing
│   │   └── document/[id]/ # Document editor
│   ├── (public)/           # Public routes (no auth)
│   │   ├── login/          # Sign in / register
│   │   └── share/[slug]/   # Shared document view
│   └── api/
│       ├── ai/generate/    # AI content generation
│       ├── auth/           # login, register, signin, callback, logout
│       ├── documents/      # CRUD (GET, add, [id], update, delete)
│       └── share/          # Public share endpoints
├── components/
│   ├── editor/             # EditorShell, Preview
│   ├── sidebar/            # Sidebar, DocList
│   └── ui/                 # shadcn/ui components + LoginClient
├── hooks/
│   ├── useDocument.ts      # SWR document CRUD + optimistic updates
│   ├── useMarkdownWorker.ts# Web Worker bridge for WASM parser
│   └── useSharedDocuments.ts
└── lib/
    ├── api.ts              # getUserObject, response helpers, parseBody
    ├── session.ts          # iron-session config + withSessionRoute
    ├── redis.ts            # Lazy Redis singleton
    ├── prisma.ts           # Prisma client
    └── ai.ts               # AI helpers

public/
├── wasm/                   # Compiled WASM parser (do not edit)
└── workers/
    └── markdown.worker.js  # Web Worker (served as static file)
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (Supabase recommended)
- Redis instance
- Google AI API key (Gemini)

### Environment Variables

Create a `.env.local`:

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Session
SESSION_SECRET=a-long-random-string-at-least-32-chars

# Redis
REDIS_URL=redis://localhost:6379

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=...

# Supabase (for Google OAuth)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup

```bash
pnpm install
pnpm exec prisma migrate deploy
pnpm dev
```

### Rebuilding the WASM Parser

```bash
cd markdown-wasm
wasm-pack build --target web --out-dir ../public/wasm
```

## API Routes

All mutations use `POST`. Route handlers are wrapped with `withSessionRoute` and validate bodies with Zod.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/documents` | List user's documents (Redis cached) |
| POST | `/api/documents/add` | Create document + invalidate cache |
| GET | `/api/documents/[id]` | Get single document |
| POST | `/api/documents/[id]/update` | Update document |
| POST | `/api/documents/[id]/delete` | Delete document + invalidate cache |
| POST | `/api/auth/register` | Email/password registration |
| POST | `/api/auth/signin` | Email/password sign in |
| GET | `/api/auth/login` | Initiate Google OAuth |
| GET | `/api/auth/callback` | OAuth callback handler |
| GET | `/api/auth/logout` | Clear session |
| POST | `/api/ai/generate` | Stream AI-generated markdown |
| GET | `/api/share/[slug]` | Fetch public document |
