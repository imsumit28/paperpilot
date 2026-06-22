# Performance Benchmarks

A repeatable harness lives in [`scripts/benchmark.mjs`](../scripts/benchmark.mjs). It drives the live API with concurrent fetches, computes p50/p95/p99 from in-process timing, and runs an end-to-end generation + PDF pass at the end. Run it with both API and Worker up:

```bash
pnpm benchmark                              # defaults to http://localhost:4000
pnpm benchmark http://api.example.com
```

## Baseline results (2026-05-23)

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

## End-to-end and PDF results (2026-06-22, DeepSeek)

Captured with [`scripts/benchmark-e2e.mjs`](../scripts/benchmark-e2e.mjs) against the DeepSeek model (`deepseek-chat`, worker concurrency=2). E2E runs are sequential (concurrency=1); PDF cache hits are measured by re-requesting the same `id` after the initial miss.

| Scenario | Concurrency | n | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate |
|---|---:|---:|---:|---:|---:|---:|
| Generation complete (E2E) | 1 | 20 | 8794 | 10372 | 10372 | 0.0% |
| PDF cache miss | 1 | 20 | 2527 | 3807 | 3807 | 0.0% |
| PDF cache hit | 1 | 40 | 564 | 721 | 813 | 0.0% |

Observations:

- Error rate is now **0%** across all 20 generations. The 25% figure in the earlier (Groq) run came from the Groq TPD ceiling (`429 rate_limit_exceeded`, `Used 99192 / Limit 100000`), not a pipeline failure — DeepSeek does not share that limit.
- E2E p50 is ~8.8 s for an 8-question paper (LLM round-trip + enqueue + Mongo write). DeepSeek's per-call latency is higher than Groq's old p50 (~3.7 s), but the distribution is far tighter: p99 dropped from ~40 s to ~10.4 s. The multi-tens-of-seconds model-side tails are gone — max was 10.4 s across all 20 runs.
- PDF cache miss runs ~2.5 s (PDFKit render + Redis write); cache hit drops to ~0.56 s (Redis fetch + HTTP send), a ~4.5× speedup on repeat downloads, confirming the 24 h TTL cache is doing its job. Absolute PDF figures are higher than the May run (local-machine load on the day, not a code regression).
