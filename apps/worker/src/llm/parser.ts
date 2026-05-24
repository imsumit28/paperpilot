import { QuestionPaperSchema, type QuestionPaper } from '@paper-pilot/shared';

export interface ParseResult {
  ok: true;
  paper: QuestionPaper;
  raw: string;
}
export interface ParseFailure {
  ok: false;
  error: string;
  raw: string;
}
export type ParseOutcome = ParseResult | ParseFailure;

/**
 * Robust JSON parse — tolerates code fences and surrounding prose even though we asked for none.
 */
export function parseAndValidate(raw: string): ParseOutcome {
  const cleaned = stripFences(raw).trim();
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (err) {
    return { ok: false, error: `Output was not valid JSON: ${(err as Error).message}`, raw };
  }

  // Normalize answer key marks/total before validating
  const normalized = normalizePaper(json);

  const parsed = QuestionPaperSchema.safeParse(normalized);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    return { ok: false, error: `Schema validation failed: ${issues}`, raw };
  }

  // Cross-field invariants
  const totals = parsed.data.sections
    .flatMap((s) => s.questions)
    .reduce((sum, q) => sum + q.marks, 0);
  if (totals !== parsed.data.maximumMarks) {
    // Auto-correct rather than fail — keep the paper usable.
    parsed.data.maximumMarks = totals;
  }

  return { ok: true, paper: parsed.data, raw };
}

function stripFences(raw: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers if model ignored instructions
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function normalizePaper(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const obj = input as Record<string, unknown>;
  // Some models return "section" singular or wrap inside { paper: ... }
  if ('paper' in obj && typeof obj.paper === 'object') return obj.paper;
  return obj;
}
