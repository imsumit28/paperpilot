// Focused benchmark for E2E generation + PDF cache miss/hit.
// Usage: node benchmark-e2e.mjs [baseUrl] [n]
import { performance } from 'node:perf_hooks';

const BASE = process.argv[2] || 'http://localhost:4000';
const N = parseInt(process.argv[3] || '20', 10);

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
  return s[idx];
}

function summarize(label, durations, errors) {
  const ok = durations.filter((d) => d !== null && d !== undefined);
  const total = ok.length + errors;
  return {
    label,
    n: total,
    ok: ok.length,
    errors,
    errorRate: total ? `${((errors / total) * 100).toFixed(1)}%` : '0.0%',
    p50: Math.round(pct(ok, 50)),
    p95: Math.round(pct(ok, 95)),
    p99: Math.round(pct(ok, 99)),
    avg: ok.length ? Math.round(ok.reduce((s, v) => s + v, 0) / ok.length) : 0,
    min: ok.length ? Math.round(Math.min(...ok)) : 0,
    max: ok.length ? Math.round(Math.max(...ok)) : 0,
  };
}

function payload(i) {
  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    title: `E2E Bench ${i} ${Date.now()}`,
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
    await new Promise((res) => setTimeout(res, 250));
  }
  return { ms: performance.now() - t0, status: 'timeout' };
}

async function timed(fn) {
  const t0 = performance.now();
  try {
    await fn();
    return { ms: performance.now() - t0 };
  } catch (e) {
    return { err: String(e), ms: performance.now() - t0 };
  }
}

async function pdf(id) {
  const r = await fetch(`${BASE}/api/assignments/${id}/pdf`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  await r.arrayBuffer();
}

async function flushPdfCache(id) {
  // Force a cache miss by calling regenerate, which should invalidate the cached PDF.
  // If regenerate is heavy, alternative: just measure first GET after generation = miss.
}

async function main() {
  const e2eTimes = [];
  let e2eErrors = 0;
  const completedIds = [];

  console.log(`Running ${N} E2E generations sequentially...`);
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    try {
      const created = await postAssignment(i);
      const id = created?.data?.id;
      const w = await waitForComplete(id, 120000);
      const dur = performance.now() - t0;
      if (w.status === 'completed') {
        e2eTimes.push(dur);
        completedIds.push(id);
        console.log(`  [${i + 1}/${N}] OK in ${Math.round(dur)} ms (id=${id})`);
      } else {
        e2eErrors++;
        console.log(`  [${i + 1}/${N}] ${w.status} in ${Math.round(dur)} ms ${w.error || ''}`);
      }
    } catch (e) {
      e2eErrors++;
      console.log(`  [${i + 1}/${N}] error: ${e}`);
    }
  }

  console.log(`\nPDF measurements over ${completedIds.length} completed assignments...`);
  const missTimes = [];
  const hitTimes = [];
  let missErr = 0;
  let hitErr = 0;
  for (const id of completedIds) {
    const miss = await timed(() => pdf(id));
    if (miss.err) {
      missErr++;
    } else {
      missTimes.push(miss.ms);
    }
    // Two hits to get more samples per id, all served from cache after the first.
    for (let k = 0; k < 2; k++) {
      const hit = await timed(() => pdf(id));
      if (hit.err) hitErr++;
      else hitTimes.push(hit.ms);
    }
  }

  const rows = [
    summarize('Generation complete (E2E)', e2eTimes, e2eErrors),
    summarize('PDF cache miss', missTimes, missErr),
    summarize('PDF cache hit', hitTimes, hitErr),
  ];

  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
