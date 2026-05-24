# Architecture

## Monorepo layout

```text
paper-pilot/
|- apps/
|  |- web/        # Next.js frontend (dashboard + toolkit)
|  |- api/        # Express API + Socket.IO gateway
|  |- worker/     # BullMQ workers for generation + PDF
|- packages/
|  |- shared/     # Shared Zod schemas, constants, TypeScript types
|- render.yaml    # Render blueprint for API + worker
```

## Runtime architecture

```text
[Next.js Web]
    | HTTP (REST) + WebSocket
    v
[Express API + Socket.IO]
    | enqueue jobs
    v
[BullMQ Queues on Redis] <----> [Worker]
    |                               |
    |                               | DeepSeek (LLM generation)
    |                               | PDFKit (PDF rendering)
    |
    +--> [MongoDB] (assignments, papers, statuses)

Progress path:
Worker -> Redis Pub/Sub -> API socket bridge -> assignment room in browser
```

## Approach

1. Model the domain first in `packages/shared` using Zod schemas.
2. Keep API request handling lightweight and queue-based.
3. Run expensive work (LLM + PDF) in a dedicated worker process.
4. Validate generated content before persistence and again before PDF rendering.
5. Stream step-level progress to users over WebSocket for transparency.
6. Reuse one type system across web, API, and worker for contract safety.

## Core Components

### `apps/web` (Next.js 14)

- App Router dashboard and toolkit pages
- Zustand stores for auth/profile, draft form, generation state, notifications
- Socket client integration through `useJobProgress`
- API route for toolkit generation (`src/app/api/toolkit/generate/route.ts`)

### `apps/api` (Express + Socket.IO)

- Assignment CRUD + regenerate + PDF endpoints
- Multipart upload support (`multer`) and source text extraction
- Queue producers for generation and PDF jobs
- Progress bridge from Redis Pub/Sub to Socket.IO rooms
- Health checks for MongoDB and Redis

### `apps/worker` (BullMQ)

- Generation processor:
  - Builds prompt context
  - Calls DeepSeek API
  - Parses and validates with `QuestionPaperSchema`
  - Normalizes question IDs + answer key mapping
- PDF processor:
  - Re-validates stored paper
  - Renders PDF using PDFKit
  - Caches result in Redis (24h TTL)

### `packages/shared`

- `CreateAssignmentSchema`
- `QuestionPaperSchema`
- shared constants (`QUEUE_NAMES`, question types, statuses)
- DTO and socket payload typing used across all apps

## Tech stack

- Frontend: Next.js 14, React 18, Tailwind CSS, Zustand, Zod
- API: Express 4, Socket.IO, Mongoose, BullMQ, multer
- Worker: BullMQ, OpenAI SDK (DeepSeek), PDFKit
- Data infrastructure: MongoDB, Redis (queue, pub/sub, cache)
- Tooling: pnpm workspaces, TypeScript project references

## Data validation strategy

- Input validation at API boundary using shared schemas
- Worker-side validation of generated paper before persistence
- PDF pipeline validation before rendering (defense-in-depth)
