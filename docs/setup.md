# Setup and Run

## Prerequisites

- Node.js >= 18.17
- pnpm >= 9
- MongoDB instance
- Redis instance
- DeepSeek API key

## Install

```bash
pnpm install
```

## Start all apps

```bash
pnpm dev
```

## Start individually

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

## Quality Checklist

- `pnpm typecheck` passes in all packages
- generation job completes and stores validated paper
- WebSocket progress timeline renders on assignment page
- PDF generation works and cached PDFs are retrievable
- `/api/health` reports Mongo and Redis health
