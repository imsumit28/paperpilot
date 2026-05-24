# Paper Pilot

AI-powered assessment creation platform with a typed monorepo architecture, asynchronous generation pipeline, and real-time job progress.

## Overview

Paper Pilot helps educators generate structured question papers from a guided form and optional source documents. The platform emphasizes reliability over demo-style output by combining schema validation, worker isolation, and observable progress events.

## Architecture Overview

### Monorepo layout

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

### Runtime architecture

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

## API Surface

Base path: `/api`

- `POST /assignments`
- `GET /assignments`
- `GET /assignments/:id`
- `DELETE /assignments/:id`
- `POST /assignments/:id/regenerate`
- `GET /assignments/:id/pdf`
- `GET /health`

## Event and Queue Flow

### Generation flow

```text
POST /assignments
 -> validate payload
 -> save assignment(status=pending)
 -> enqueue generation job
 -> worker processes job
 -> progress events published
 -> paper saved(status=completed)
 -> job:complete emitted
```

### Progress event stages

- `analyzing`
- `building_prompt`
- `generating`
- `refining` (when retry path is used)
- `parsing`
- `sectioning`
- `saving`
- `complete`

## Technical Documentation

### Tech stack

- Frontend: Next.js 14, React 18, Tailwind CSS, Zustand, Zod
- API: Express 4, Socket.IO, Mongoose, BullMQ, multer
- Worker: BullMQ, OpenAI SDK (DeepSeek), PDFKit
- Data infrastructure: MongoDB, Redis (queue, pub/sub, cache)
- Tooling: pnpm workspaces, TypeScript project references

### Environment contracts

`apps/api/src/config/env.ts`

- `API_PORT`
- `CORS_ORIGIN`
- `MONGODB_URI`
- `REDIS_URL`
- `LOG_LEVEL`

`apps/worker/src/config/env.ts`

- `MONGODB_URI`
- `REDIS_URL`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_TIMEOUT_MS`
- `WORKER_CONCURRENCY`
- `LOG_LEVEL`

`apps/web/.env`

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `DEEPSEEK_API_KEY`

### Data validation strategy

- Input validation at API boundary using shared schemas
- Worker-side validation of generated paper before persistence
- PDF pipeline validation before rendering (defense-in-depth)

## Setup and Run

### Prerequisites

- Node.js >= 18.17
- pnpm >= 9
- MongoDB instance
- Redis instance
- DeepSeek API key

### Install

```bash
pnpm install
```

### Start all apps

```bash
pnpm dev
```

### Start individually

```bash
pnpm dev:web
pnpm dev:api
pnpm dev:worker
```

## Build and Typecheck

```bash
pnpm build
pnpm typecheck
```

## Deployment

- Web: Vercel (`apps/web`)
- API + Worker: Render via `render.yaml`

Render blueprint provisions:

- `paper-pilot-api` (web service)
- `paper-pilot-worker` (background worker)

## Metrics

The codebase supports collecting the following operational metrics:

- `assignment_create_to_complete_ms`
- `generation_job_duration_ms`
- `pdf_generation_duration_ms`
- `generation_failure_rate`
- `schema_validation_failure_rate`
- `socket_delivery_latency_ms`
- `queue_wait_time_ms`
- `pdf_cache_hit_rate`

Recommended storage targets:

- logs (structured JSON via `pino`)
- Redis counters for quick aggregation
- external observability backend for long-term dashboards

## Performance Benchmarks

A repeatable harness lives in [benchmark.mjs](benchmark.mjs). It drives the live API with concurrent fetches, computes p50/p95/p99 from in-process timing, and runs an end-to-end generation + PDF pass at the end. Run it with both API and Worker up:

```bash
node benchmark.mjs            # defaults to http://localhost:4000
node benchmark.mjs http://api.example.com
```

### Baseline results (2026-05-23)

Environment: local dev (Windows 11, Node 18, single API instance, worker concurrency=2, MongoDB + Redis over network). Client and server on the same host. Each row reflects warm runs after a 5-request warmup. Error rate was 0% across all measured rows.

| Scenario | Concurrency | n | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) |
|---|---:|---:|---:|---:|---:|---:|
| `GET /api/health` | 1 | 50 | 60 | 125 | 259 | 74 |
| `GET /api/health` | 10 | 100 | 102 | 137 | 138 | 102 |
| `GET /api/assignments` (page=1, size=20) | 10 | 50 | 171 | 481 | 1166 | 229 |
| `POST /api/assignments` (enqueue) | 1 | 20 | 196 | 325 | 325 | 205 |
| `POST /api/assignments` (enqueue) | 10 | 50 | 218 | 318 | 319 | 238 |
| `POST /api/assignments` (enqueue) | 25 | 50 | 327 | 752 | 798 | 365 |

Observations:

- API stays under ~330 ms p50 up to 25 concurrent writers, with most of the cost on the create path being Mongo insert + BullMQ enqueue (the handler returns immediately after enqueue).
- List p99 spikes are dominated by network/Mongo tail, not Express.
- Linear degradation from c=1 to c=25 on create (~205 ms → ~365 ms avg) suggests the Mongo connection pool and BullMQ producer are not the bottleneck at this load.

### End-to-end and PDF results (2026-05-24)

Captured with [benchmark-e2e.mjs](benchmark-e2e.mjs). E2E runs are sequential (concurrency=1); PDF cache hits are measured by re-requesting the same `id` after the initial miss. **Note:** this run was captured before the Groq → DeepSeek migration; re-run `benchmark-e2e.mjs` for updated numbers.

| Scenario | Concurrency | n | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate |
|---|---:|---:|---:|---:|---:|---:|
| Generation complete (E2E) | 1 | 20 | 3751 | 40015 | 40015 | 25.0% |
| PDF cache miss | 1 | 15 | 1227 | 1331 | 1331 | 0.0% |
| PDF cache hit | 1 | 30 | 105 | 203 | 218 | 0.0% |

Observations:

- The 25% E2E error rate is not a pipeline failure: runs 16–20 hit the Groq TPD ceiling (`429 rate_limit_exceeded`, `Used 99192 / Limit 100000`) — this was captured pre-migration. DeepSeek does not share this limit.
- E2E p50 (~3.7 s) reflects a typical LLM round-trip for an 8-question paper plus enqueue + Mongo write. p95/p99 are dominated by two model-side tails (31.8 s and 40.0 s) — generation latency variance, not queue wait.
- PDF cache miss runs ~1.2 s (PDFKit render + Redis write); cache hit drops to ~105 ms (Redis fetch + HTTP send), confirming the 24 h TTL cache is doing its job — a ~12× speedup on repeat downloads.

## Quality Checklist

- `pnpm typecheck` passes in all packages
- generation job completes and stores validated paper
- WebSocket progress timeline renders on assignment page
- PDF generation works and cached PDFs are retrievable
- `/api/health` reports Mongo and Redis health

## License

[MIT](LICENSE) © 2026 Sumit Kumar
