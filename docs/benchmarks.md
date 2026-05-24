# Performance Benchmarks

A repeatable harness lives in [`benchmark.mjs`](../benchmark.mjs). It drives the live API with concurrent fetches, computes p50/p95/p99 from in-process timing, and runs an end-to-end generation + PDF pass at the end. Run it with both API and Worker up:

```bash
node benchmark.mjs            # defaults to http://localhost:4000
node benchmark.mjs http://api.example.com
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

## End-to-end and PDF results (2026-05-24)

Captured with [`benchmark-e2e.mjs`](../benchmark-e2e.mjs). E2E runs are sequential (concurrency=1); PDF cache hits are measured by re-requesting the same `id` after the initial miss. **Note:** this run was captured before the Groq → DeepSeek migration; re-run `benchmark-e2e.mjs` for updated numbers.

| Scenario | Concurrency | n | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate |
|---|---:|---:|---:|---:|---:|---:|
| Generation complete (E2E) | 1 | 20 | 3751 | 40015 | 40015 | 25.0% |
| PDF cache miss | 1 | 15 | 1227 | 1331 | 1331 | 0.0% |
| PDF cache hit | 1 | 30 | 105 | 203 | 218 | 0.0% |

Observations:

- The 25% E2E error rate is not a pipeline failure: runs 16–20 hit the Groq TPD ceiling (`429 rate_limit_exceeded`, `Used 99192 / Limit 100000`) — this was captured pre-migration. DeepSeek does not share this limit.
- E2E p50 (~3.7 s) reflects a typical LLM round-trip for an 8-question paper plus enqueue + Mongo write. p95/p99 are dominated by two model-side tails (31.8 s and 40.0 s) — generation latency variance, not queue wait.
- PDF cache miss runs ~1.2 s (PDFKit render + Redis write); cache hit drops to ~105 ms (Redis fetch + HTTP send), confirming the 24 h TTL cache is doing its job — a ~12× speedup on repeat downloads.
