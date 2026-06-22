// Lightweight benchmark harness for Paper Pilot API.
// Usage: node benchmark.mjs [baseUrl]
import { performance } from 'node:perf_hooks';

const BASE = process.argv[2] || 'http://localhost:4000';

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
  return s[idx];
}

function summarize(label, durations, errors) {
  const ok = durations.filter((d) => d !== null);
  const total = durations.length;
  return {
    label,
    n: total,
    ok: ok.length,
    errors,
    p50: Math.round(pct(ok, 50)),
    p95: Math.round(pct(ok, 95)),
    p99: Math.round(pct(ok, 99)),
    min: Math.round(Math.min(...ok)),
    max: Math.round(Math.max(...ok)),
    avg: Math.round(ok.reduce((s, v) => s + v, 0) / Math.max(ok.length, 1)),
  };
}

async function timed(fn) {
  const t0 = performance.now();
  try {
    const r = await fn();
    return { ok: r, ms: performance.now() - t0 };
  } catch (e) {
    return { err: e, ms: performance.now() - t0 };
  }
}

async function runConcurrent(label, total, concurrency, factory) {
  const durations = [];
  let errors = 0;
  let inflight = 0;
  let started = 0;
  await new Promise((resolve) => {
    const launch = () => {
      while (inflight < concurrency && started < total) {
        inflight++;
        started++;
        const i = started - 1;
        timed(() => factory(i)).then((r) => {
          inflight--;
          if (r.err) {
            errors++;
            durations.push(null);
          } else {
            durations.push(r.ms);
          }
          if (durations.length === total) resolve();
          else launch();
        });
      }
    };
    launch();
  });
  return summarize(label, durations, errors);
}

function payload(i) {
  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    title: `Bench Paper ${i} ${Date.now()}`,
    subject: 'Science',
    class: '8',
    school: 'Bench School',
    dueDate: due,
    questionTypes: [
      { type: 'mcq', count: 5, marks: 1 },
      { type: 'short', count: 3, marks: 2 },
    ],
    additionalInfo: 'benchmark run',
  };
}

async function postAssignment(i) {
  const res = await fetch(`${BASE}/api/assignments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload(i)),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function getHealth() {
  const r = await fetch(`${BASE}/api/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

async function listAssignments() {
  const r = await fetch(`${BASE}/api/assignments?page=1&pageSize=20`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

async function waitForComplete(id, timeoutMs = 90000) {
  const t0 = performance.now();
  while (performance.now() - t0 < timeoutMs) {
    const r = await fetch(`${BASE}/api/assignments/${id}`);
    if (r.ok) {
      const j = await r.json();
      const s = j?.data?.status;
      if (s === 'completed') return { ms: performance.now() - t0, status: s };
      if (s === 'failed') return { ms: performance.now() - t0, status: s, error: j?.data?.error };
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  return { ms: performance.now() - t0, status: 'timeout' };
}

async function pdf(id) {
  const r = await fetch(`${BASE}/api/assignments/${id}/pdf`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  await r.arrayBuffer();
}

function table(rows) {
  console.log(JSON.stringify(rows, null, 2));
}

async function main() {
  const results = [];

  // Warm up
  for (let i = 0; i < 5; i++) await getHealth().catch(() => {});

  console.log('Health GET, c=1, n=50');
  results.push(await runConcurrent('GET /api/health (c=1)', 50, 1, getHealth));

  console.log('Health GET, c=10, n=100');
  results.push(await runConcurrent('GET /api/health (c=10)', 100, 10, getHealth));

  console.log('List GET, c=10, n=50');
  results.push(await runConcurrent('GET /api/assignments (c=10)', 50, 10, listAssignments));

  console.log('Create POST, c=1, n=20');
  results.push(await runConcurrent('POST /api/assignments (c=1)', 20, 1, postAssignment));

  console.log('Create POST, c=10, n=50');
  results.push(await runConcurrent('POST /api/assignments (c=10)', 50, 10, postAssignment));

  console.log('Create POST, c=25, n=50');
  results.push(await runConcurrent('POST /api/assignments (c=25)', 50, 25, postAssignment));

  // End-to-end generation: create 3 and wait for completion (sequential to avoid Groq rate limits)
  console.log('E2E generation x3');
  const e2e = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    try {
      const created = await postAssignment(900 + i);
      const id = created?.data?.id;
      const w = await waitForComplete(id, 120000);
      e2e.push({ id, ms: performance.now() - t0, status: w.status });
    } catch (e) {
      e2e.push({ ms: performance.now() - t0, status: 'error', err: String(e) });
    }
  }
  results.push({ label: 'E2E generation (sequential)', runs: e2e });

  // PDF: cache miss then cache hit on the same id
  const successful = e2e.find((x) => x.status === 'completed');
  if (successful) {
    const id = successful.id;
    const m1 = await timed(() => pdf(id));
    const m2 = await timed(() => pdf(id));
    const m3 = await timed(() => pdf(id));
    results.push({
      label: 'PDF GET',
      cache_miss_ms: Math.round(m1.ms),
      cache_hit_1_ms: Math.round(m2.ms),
      cache_hit_2_ms: Math.round(m3.ms),
    });
  } else {
    results.push({ label: 'PDF GET', skipped: 'no completed assignment' });
  }

  console.log('\n=== RESULTS ===');
  table(results);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
