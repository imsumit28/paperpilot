# Paper Pilot

AI-powered question paper generator for educators. Guided form or source-doc upload → DeepSeek-drafted, schema-validated paper with live progress and cached PDF export.

A typed TypeScript monorepo: Next.js dashboard, Express + Socket.IO API, and a BullMQ worker that calls the DeepSeek LLM and renders PDFs with PDFKit.

## Quick start

```bash
pnpm install
pnpm dev
```

Requires Node ≥ 18.17, pnpm ≥ 9, MongoDB, Redis, and a DeepSeek API key. See [docs/setup.md](docs/setup.md) for details.

## Tech stack

Next.js 14 · React 18 · Tailwind · Zustand · Express 4 · Socket.IO · BullMQ · Mongoose · OpenAI SDK (DeepSeek) · PDFKit · Zod · pnpm workspaces

## Screenshots

| Home Feed | Assignments |
|---|---|
| ![Home feed](docs/screenshots/home-feed.png) | ![Assignments list](docs/screenshots/assignments.png) |

| Generate Assignment | Paper Generated |
|---|---|
| ![Generate assignment form](docs/screenshots/generate-assignment.png) | ![Generated paper view](docs/screenshots/paper-generated.png) |

| AI Teacher's Toolkit | |
|---|---|
| ![AI Teacher's Toolkit](docs/screenshots/toolkit.png) | |

## Architecture overview

Three apps plus one shared package, with all expensive work pushed off the request path into a worker.

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

See [docs/architecture.md](docs/architecture.md) for the monorepo layout, per-app responsibilities, and validation strategy.

## Approach

1. Model the domain first in `packages/shared` using Zod schemas.
2. Keep API request handling lightweight and queue-based.
3. Run expensive work (LLM + PDF) in a dedicated worker process.
4. Validate generated content before persistence and again before PDF rendering.
5. Stream step-level progress to users over WebSocket for transparency.
6. Reuse one type system across web, API, and worker for contract safety.

## Documentation

- [Architecture](docs/architecture.md) — monorepo layout, runtime topology, components, validation strategy
- [API & Event Flow](docs/api.md) — REST surface, queue flow, progress event stages
- [Environment Contracts](docs/environment.md) — env vars per app
- [Setup & Run](docs/setup.md) — prerequisites, install, dev/build/typecheck, quality checklist
- [Deployment](docs/deployment.md) — Vercel (web) + Render (api/worker) blueprint
- [Metrics](docs/metrics.md) — operational metrics + storage targets
- [Benchmarks](docs/benchmarks.md) — performance harness + baseline results

## License

[MIT](LICENSE) © 2026 Sumit Kumar
