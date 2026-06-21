'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, FieldError, Textarea } from '@/components/ui/Input';
import { generateToolkit } from '@/lib/toolkit';

type FeedbackSection = {
  title: string;
  body: string;
};

function normalizeHeading(line: string) {
  return line
    .replace(/^\d+[\).\-\s]*/, '')
    .replace(/^\*\*(.+)\*\*:?\s*$/, '$1')
    .replace(/^#+\s*/, '')
    .replace(/:$/, '')
    .trim();
}

function parseFeedbackSections(raw: string): FeedbackSection[] {
  const lines = raw.split('\n');
  const sections: FeedbackSection[] = [];
  let current: FeedbackSection | null = null;

  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    const isHeading =
      /^(\d+[\).\-\s]+)(.+)/.test(line) ||
      /^\*\*[^*]+\*\*:?\s*$/.test(line) ||
      /^#{1,3}\s+/.test(line);

    if (isHeading) {
      const title = normalizeHeading(line);
      if (current && current.body.trim()) sections.push(current);
      current = { title, body: '' };
      continue;
    }

    if (!current) current = { title: 'Feedback', body: '' };
    current.body += `${sourceLine}\n`;
  }

  if (current && current.body.trim()) sections.push(current);
  return sections;
}

export default function GradingPage() {
  const [task, setTask] = useState('');
  const [answer, setAnswer] = useState('');
  const [marks, setMarks] = useState('');
  const [rubric, setRubric] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState(false);
  const [slow, setSlow] = useState(false);
  const [almostReady, setAlmostReady] = useState(false);
  const parsedSections = parseFeedbackSections(result);

  useEffect(() => {
    if (!loading) { setSlow(false); setAlmostReady(false); return; }
    const t1 = setTimeout(() => setSlow(true), 8000);
    const t2 = setTimeout(() => setAlmostReady(true), 15000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

  function validate() {
    const e: Record<string, string> = {};
    if (!task.trim()) e.task = 'Please describe the assignment or question.';
    if (!answer.trim()) e.answer = "Please paste the student's answer.";
    if (!marks || isNaN(Number(marks)) || Number(marks) <= 0) e.marks = 'Please enter a valid total marks.';
    return e;
  }

  async function handleGrade() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setGenError('');
    setResult('');
    try {
      const prompt = `You are an experienced, fair, and encouraging teacher grading student work.

Assignment / Question:
${task}

Total Marks: ${marks}
${rubric.trim() ? `\nRubric / Marking Scheme:\n${rubric}\n` : ''}
Student's Answer:
${answer}

Please provide:
1. **Score**: X / ${marks} marks — with a one-line justification
2. **Mark Breakdown**: Explain how marks were awarded or deducted for each part
3. **Strengths**: What the student did well (be specific)
4. **Areas for Improvement**: Where marks were lost and how to improve
5. **Constructive Feedback**: An encouraging, actionable note addressed directly to the student

Be fair, specific, and constructive. Use clear, friendly language.`;
      setResult(await generateToolkit(prompt));
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed. Ensure DEEPSEEK_API_KEY is set in apps/web/.env and restart the dev server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-4 lg:px-0">
      <Topbar title="Grading Assistant" />
      <div className="flex flex-col gap-4 max-w-2xl">
        <Card className="flex flex-col gap-4">
          <div>
            <Label htmlFor="ga-task">Assignment / Question</Label>
            <Textarea
              id="ga-task"
              placeholder="Paste the question or describe the task the student was asked to complete…"
              value={task}
              onChange={(e) => { setTask(e.target.value); setErrors((p) => ({ ...p, task: '' })); }}
            />
            <FieldError>{errors.task}</FieldError>
          </div>
          <div>
            <Label htmlFor="ga-answer">Student&apos;s Answer</Label>
            <Textarea
              id="ga-answer"
              className="min-h-[140px]"
              placeholder="Paste the student's answer here…"
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setErrors((p) => ({ ...p, answer: '' })); }}
            />
            <FieldError>{errors.answer}</FieldError>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ga-marks">Total Marks</Label>
              <input
                id="ga-marks"
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={marks}
                onChange={(e) => { setMarks(e.target.value); setErrors((p) => ({ ...p, marks: '' })); }}
                className="h-11 w-full rounded-full border border-border bg-white px-4 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink/40 focus:ring-2 focus:ring-brand/20"
              />
              <FieldError>{errors.marks}</FieldError>
            </div>
            <div>
              <Label htmlFor="ga-rubric">
                Rubric / Marking Scheme{' '}
                <span className="text-ink-muted font-normal">(optional)</span>
              </Label>
              <Textarea
                id="ga-rubric"
                className="min-h-[44px]"
                placeholder="Paste rubric or key points to look for…"
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
              />
            </div>
          </div>
          {genError && <p className="text-sm text-rose-600">{genError}</p>}
          {loading && slow && !almostReady && (
            <p className="text-sm text-ink-muted">
              Grading the answer — please hang on a few more seconds…
            </p>
          )}
          {loading && almostReady && (
            <p className="text-sm text-ink-muted">
              Almost ready — adding the final touches…
            </p>
          )}
          <Button loading={loading} onClick={handleGrade} className="self-end">
            {loading ? 'Grading…' : 'Grade Answer'}
          </Button>
        </Card>

        {result && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-ink">Grading Feedback</span>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {parsedSections.length ? (
                parsedSections.map((section, index) => (
                  <div key={`${section.title}-${index}`} className="rounded-2xl border border-border/70 bg-white p-4">
                    <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-subtle">
                      {section.body.trim()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border/70 bg-white p-4">
                  <h3 className="text-sm font-semibold text-ink">Feedback</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-subtle">
                    {result}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
