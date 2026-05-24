'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, FieldError, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { generateToolkit } from '@/lib/toolkit';

const GRADES = [
  '', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'Undergraduate', 'Postgraduate',
].map((g) => ({ value: g, label: g || 'Select grade…' }));

const CRITERIA_COUNTS = [
  { value: '3', label: '3 criteria' },
  { value: '4', label: '4 criteria' },
  { value: '5', label: '5 criteria' },
];

export default function RubricPage() {
  const [assignment, setAssignment] = useState('');
  const [grade, setGrade] = useState('');
  const [marks, setMarks] = useState('');
  const [criteria, setCriteria] = useState('4');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!assignment.trim()) e.assignment = 'Please describe the assignment.';
    if (!grade) e.grade = 'Please select a grade.';
    if (!marks || isNaN(Number(marks)) || Number(marks) <= 0) e.marks = 'Please enter a valid total marks.';
    return e;
  }

  async function handleGenerate() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setGenError('');
    setResult('');
    try {
      const totalMarks = Number(marks);
      const prompt = `You are an experienced educator. Create a detailed grading rubric:

Assignment / Task: ${assignment}
Grade / Class: ${grade}
Total Marks: ${totalMarks}
Number of Criteria: ${criteria}

Instructions:
- Create exactly ${criteria} clear, meaningful assessment criteria
- For each criterion provide descriptors for 4 performance levels:
  • Excellent (100% of criterion marks)
  • Proficient (75% of criterion marks)
  • Developing (50% of criterion marks)
  • Beginning (25% of criterion marks)
- Distribute the ${totalMarks} total marks evenly across criteria
- Format as a readable table with columns: Criterion | Excellent | Proficient | Developing | Beginning | Marks
- Add a brief note on how to use the rubric at the end

Keep language clear and appropriate for ${grade} students.`;
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
      <Topbar title="Rubric Builder" />
      <div className="flex flex-col gap-4 max-w-2xl">
        <Card className="flex flex-col gap-4">
          <div>
            <Label htmlFor="rb-assignment">Assignment / Task Description</Label>
            <Textarea
              id="rb-assignment"
              placeholder="e.g. Write a 500-word essay on the causes of World War I…"
              value={assignment}
              onChange={(e) => { setAssignment(e.target.value); setErrors((p) => ({ ...p, assignment: '' })); }}
            />
            <FieldError>{errors.assignment}</FieldError>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Label htmlFor="rb-grade">Grade / Class</Label>
              <Select
                id="rb-grade"
                value={grade}
                onChange={(e) => { setGrade(e.target.value); setErrors((p) => ({ ...p, grade: '' })); }}
                options={GRADES}
              />
              <FieldError>{errors.grade}</FieldError>
            </div>
            <div>
              <Label htmlFor="rb-marks">Total Marks</Label>
              <input
                id="rb-marks"
                type="number"
                min="1"
                placeholder="e.g. 20"
                value={marks}
                onChange={(e) => { setMarks(e.target.value); setErrors((p) => ({ ...p, marks: '' })); }}
                className="h-11 w-full rounded-full border border-border bg-white px-4 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink/40 focus:ring-2 focus:ring-brand/20"
              />
              <FieldError>{errors.marks}</FieldError>
            </div>
            <div>
              <Label htmlFor="rb-criteria">Criteria Count</Label>
              <Select
                id="rb-criteria"
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                options={CRITERIA_COUNTS}
              />
            </div>
          </div>
          {genError && <p className="text-sm text-red-600">{genError}</p>}
          <Button loading={loading} onClick={handleGenerate} className="self-end">
            {loading ? 'Generating…' : 'Generate Rubric'}
          </Button>
        </Card>

        {result && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-ink">Generated Rubric</span>
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
