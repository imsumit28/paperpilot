'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useGroupsStore } from '@/store/useGroupsStore';
import { cn } from '@/lib/utils';

// ── constants ────────────────────────────────────────────────────────────────

const LEVELS = [
  { value: 'secondary', label: 'Secondary' },
  { value: 'senior-secondary', label: 'Senior Secondary' },
  { value: 'graduation', label: 'Graduation' },
] as const;
type Level = (typeof LEVELS)[number]['value'];

const SEC_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const SS_STREAMS = ['Science', 'Commerce', 'Arts'] as const;
type SSStream = (typeof SS_STREAMS)[number];

const SCIENCE_SUBS = ['PCM', 'PCB', 'PCMB'] as const;

const GRAD_STREAMS = ['Engineering', 'Medical', 'Commerce / MBA', 'Other'] as const;
type GradStream = (typeof GRAD_STREAMS)[number];

const SUBJECTS = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science' },
  { value: 'English', label: 'English' },
  { value: 'Social Science', label: 'Social Science' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Physical Education', label: 'Physical Education' },
  { value: 'Art', label: 'Art' },
  { value: 'Other', label: 'Other' },
];

const EXAM_TYPES = [
  'Mid Term',
  'End Term',
  'Class Test',
  'Unit Test',
  'Weekly Test',
  'Practice Test',
  'Annual Exam',
];

// ── helpers ──────────────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 px-4 rounded-full border text-sm font-semibold transition-colors whitespace-nowrap',
        active
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-white text-ink border-border hover:bg-surface-alt',
      )}
    >
      {label}
    </button>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ open, onClose }: Props) {
  const addGroup = useGroupsStore((s) => s.addGroup);

  const [name, setName] = useState('');
  const [level, setLevel] = useState<Level | ''>('');
  const [secClass, setSecClass] = useState('');
  const [ssStream, setSsStream] = useState<SSStream | ''>('');
  const [sciSub, setSciSub] = useState('');
  const [gradStream, setGradStream] = useState<GradStream | ''>('');
  const [otherText, setOtherText] = useState('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setName('');
    setLevel('');
    setSecClass('');
    setSsStream('');
    setSciSub('');
    setGradStream('');
    setOtherText('');
    setSubject('');
    setExamType('');
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function clearClassError() {
    setErrors((prev) => ({ ...prev, class: '' }));
  }

  /** Derive the human-readable class string to save */
  function getClassLabel(): string {
    if (level === 'secondary') return secClass ? `Class ${secClass}` : '';
    if (level === 'senior-secondary') {
      if (!ssStream) return '';
      if (ssStream === 'Science') return sciSub ? `Senior Secondary – Science (${sciSub})` : '';
      return `Senior Secondary – ${ssStream}`;
    }
    if (level === 'graduation') {
      if (!gradStream) return '';
      if (gradStream === 'Other') return otherText.trim() ? `Graduation – ${otherText.trim()}` : '';
      return `Graduation – ${gradStream}`;
    }
    return '';
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!level) {
      e.class = 'Please select a level (Secondary / Senior Secondary / Graduation).';
    } else {
      const label = getClassLabel();
      if (!label) {
        if (level === 'secondary') e.class = 'Please select a class.';
        else if (level === 'senior-secondary')
          e.class = ssStream === 'Science' ? 'Please select a science stream (PCM / PCB / PCMB).' : 'Please select a stream.';
        else if (level === 'graduation')
          e.class = gradStream === 'Other' ? 'Please type your course / stream.' : 'Please select a graduation stream.';
      }
    }
    if (!subject) e.subject = 'Please select a subject.';
    if (!examType) e.examType = 'Please select an exam type.';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const classLabel = getClassLabel();
    const autoName = name.trim() || `${classLabel} – ${subject} – ${examType}`;
    addGroup({ name: autoName, class: classLabel, subject, examType });
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create a Group" size="md">
      <div className="flex flex-col gap-5 overflow-y-auto max-h-[70vh] pr-1">

        {/* Group Name */}
        <div>
          <Label htmlFor="group-name">
            Group Name{' '}
            <span className="text-ink-muted font-normal">(optional)</span>
          </Label>
          <Input
            id="group-name"
            placeholder="e.g. Class 8 Science Mid Term"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Level picker */}
        <div>
          <Label>Level</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {LEVELS.map((l) => (
              <Chip
                key={l.value}
                label={l.label}
                active={level === l.value}
                onClick={() => {
                  setLevel(l.value);
                  setSecClass('');
                  setSsStream('');
                  setSciSub('');
                  setGradStream('');
                  setOtherText('');
                  clearClassError();
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Secondary: class 1–10 ── */}
        {level === 'secondary' && (
          <div>
            <Label>Class</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SEC_CLASSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSecClass(c);
                    clearClassError();
                  }}
                  className={cn(
                    'h-9 w-11 rounded-full border text-sm font-semibold transition-colors',
                    secClass === c
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink border-border hover:bg-surface-alt',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <FieldError>{errors.class}</FieldError>
          </div>
        )}

        {/* ── Senior Secondary: stream → science sub-stream ── */}
        {level === 'senior-secondary' && (
          <div className="flex flex-col gap-3">
            <div>
              <Label>Stream</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SS_STREAMS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={ssStream === s}
                    onClick={() => {
                      setSsStream(s);
                      setSciSub('');
                      clearClassError();
                    }}
                  />
                ))}
              </div>
            </div>
            {ssStream === 'Science' && (
              <div>
                <Label>Science Stream</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SCIENCE_SUBS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      active={sciSub === s}
                      onClick={() => {
                        setSciSub(s);
                        clearClassError();
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <FieldError>{errors.class}</FieldError>
          </div>
        )}

        {/* ── Graduation: stream → Other text input ── */}
        {level === 'graduation' && (
          <div className="flex flex-col gap-3">
            <div>
              <Label>Stream / Course</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {GRAD_STREAMS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={gradStream === s}
                    onClick={() => {
                      setGradStream(s);
                      setOtherText('');
                      clearClassError();
                    }}
                  />
                ))}
              </div>
            </div>
            {gradStream === 'Other' && (
              <div>
                <Label htmlFor="grad-other">Type your course / stream</Label>
                <Input
                  id="grad-other"
                  placeholder="e.g. Law, Architecture, Pharmacy…"
                  value={otherText}
                  onChange={(e) => {
                    setOtherText(e.target.value);
                    clearClassError();
                  }}
                  autoFocus
                />
              </div>
            )}
            <FieldError>{errors.class}</FieldError>
          </div>
        )}

        {/* Subject */}
        <div>
          <Label htmlFor="group-subject">Subject</Label>
          <Select
            id="group-subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setErrors((prev) => ({ ...prev, subject: '' }));
            }}
            options={[{ value: '', label: 'Select subject…' }, ...SUBJECTS]}
          />
          <FieldError>{errors.subject}</FieldError>
        </div>

        {/* Exam Type */}
        <div>
          <Label>Exam Type</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {EXAM_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                active={examType === t}
                onClick={() => {
                  setExamType(t);
                  setErrors((prev) => ({ ...prev, examType: '' }));
                }}
              />
            ))}
          </div>
          <FieldError>{errors.examType}</FieldError>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Create Group
          </Button>
        </div>
      </div>
    </Modal>
  );
}
