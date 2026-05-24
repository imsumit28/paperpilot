# Environment Contracts

Copy [`.env.example`](../.env.example) into each app directory and fill in values.

## `apps/api/src/config/env.ts`

- `API_PORT`
- `CORS_ORIGIN`
- `MONGODB_URI`
- `REDIS_URL`
- `LOG_LEVEL`

## `apps/worker/src/config/env.ts`

- `MONGODB_URI`
- `REDIS_URL`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_TIMEOUT_MS`
- `WORKER_CONCURRENCY`
- `LOG_LEVEL`

## `apps/web/.env`

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `DEEPSEEK_API_KEY` (used by the toolkit API route)
