'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { generateToolkit } from '@/lib/toolkit';

const GRADES = [
  '', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'Undergraduate', 'Postgraduate',
].map((g) => ({ value: g, label: g || 'Select grade…' }));

const DURATIONS = [
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
];

export default function LessonPlanPage() {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('45');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState(false);
  const [slow, setSlow] = useState(false);
  const [almostReady, setAlmostReady] = useState(false);

  useEffect(() => {
    if (!loading) { setSlow(false); setAlmostReady(false); return; }
    const t1 = setTimeout(() => setSlow(true), 8000);
    const t2 = setTimeout(() => setAlmostReady(true), 15000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

  function validate() {
    const e: Record<string, string> = {};
    if (!grade) e.grade = 'Please select a grade.';
    if (!subject.trim()) e.subject = 'Please enter a subject.';
    if (!topic.trim()) e.topic = 'Please enter a topic.';
    return e;
  }

  async function handleGenerate() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setGenError('');
    setResult('');
    try {
      const prompt = `You are an experienced curriculum designer. Create a detailed lesson plan:

Grade/Class: ${grade}
Subject: ${subject}
Topic: ${topic}
Duration: ${duration} minutes

Include these sections:
1. Learning Objectives (3–4 clear, measurable objectives)
2. Materials & Resources
3. Introduction / Hook (first 5–10 minutes to engage students)
4. Main Content & Teaching Steps (step-by-step guide)
5. Student Activities & Practice
6. Assessment / Check for Understanding
7. Closure & Summary
8. Homework / Extension (optional)
9. Differentiation Tips (for advanced and struggling learners)

Be specific, practical, and age-appropriate for ${grade} students.`;
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
      <Topbar title="Lesson Planner" />
      <div className="flex flex-col gap-4 max-w-2xl">
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lp-grade">Grade / Class</Label>
              <Select
                id="lp-grade"
                value={grade}
                onChange={(e) => { setGrade(e.target.value); setErrors((p) => ({ ...p, grade: '' })); }}
                options={GRADES}
              />
              <FieldError>{errors.grade}</FieldError>
            </div>
            <div>
              <Label htmlFor="lp-duration">Duration</Label>
              <Select
                id="lp-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                options={DURATIONS}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="lp-subject">Subject</Label>
            <Input
              id="lp-subject"
              placeholder="e.g. Mathematics, Science, English…"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrors((p) => ({ ...p, subject: '' })); }}
            />
            <FieldError>{errors.subject}</FieldError>
          </div>
          <div>
            <Label htmlFor="lp-topic">Topic</Label>
            <Input
              id="lp-topic"
              placeholder="e.g. Photosynthesis, Quadratic Equations, The French Revolution…"
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setErrors((p) => ({ ...p, topic: '' })); }}
            />
            <FieldError>{errors.topic}</FieldError>
          </div>
          {genError && <p className="text-sm text-red-600">{genError}</p>}
          {loading && slow && !almostReady && (
            <p className="text-sm text-ink-muted">
              Your lesson plan is being crafted — please hang on a few more seconds…
            </p>
          )}
          {loading && almostReady && (
            <p className="text-sm text-ink-muted">
              Almost ready — adding the final touches…
            </p>
          )}
          <Button loading={loading} onClick={handleGenerate} className="self-end">
            {loading ? 'Generating…' : 'Generate Lesson Plan'}
          </Button>
        </Card>

        {result && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-ink">Generated Lesson Plan</span>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-ink leading-relaxed max-h-[60vh] overflow-y-auto">
              {result}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
