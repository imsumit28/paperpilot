'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarIcon, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  CreateAssignmentSchema,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  type CreateAssignmentInput,
  type QuestionType,
} from '@paper-pilot/shared';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Counter } from '@/components/ui/Counter';
import { FieldError, Input, Label, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/create/FileUpload';
import { VoiceInputButton } from '@/components/create/VoiceInputButton';
import { useAssignmentDraftStore } from '@/store/useAssignmentDraftStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAssignmentCountStore } from '@/store/useAssignmentCountStore';
import { createAssignment } from '@/lib/api';
import { todayIsoDate } from '@/lib/utils';

export default function NewAssignmentPage() {
  const router = useRouter();
  const draft = useAssignmentDraftStore();
  const schoolName = useAuthStore((s) => s.schoolName);
  const startGen = useGenerationStore((s) => s.start);
  const incrementAssignmentCount = useAssignmentCountStore((s) => s.increment);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totals = useMemo(() => {
    const totalQuestions = draft.questionTypes.reduce((sum, row) => sum + row.count, 0);
    const totalMarks = draft.questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);
    return { totalQuestions, totalMarks };
  }, [draft.questionTypes]);

  const takenTypes = draft.questionTypes.map((row) => row.type);
  const availableType = QUESTION_TYPES.find((type) => !takenTypes.includes(type));

  const voiceBaseRef = useRef('');
  const voiceFinalRef = useRef('');

  const handleVoiceStart = useCallback(() => {
    voiceBaseRef.current = draft.additionalInfo.trimEnd();
    voiceFinalRef.current = '';
  }, [draft.additionalInfo]);

  const handleVoiceTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      const base = voiceBaseRef.current;
      if (isFinal) {
        voiceFinalRef.current = (voiceFinalRef.current + ' ' + text).replace(/\s+/g, ' ').trim();
        const merged = `${base}${base ? ' ' : ''}${voiceFinalRef.current}`;
        draft.set({ additionalInfo: merged.slice(0, 1000) });
      } else {
        const accumulated = `${voiceFinalRef.current} ${text}`.replace(/\s+/g, ' ').trim();
        const merged = `${base}${base ? ' ' : ''}${accumulated}`;
        draft.set({ additionalInfo: merged.slice(0, 1000) });
      }
    },
    [draft],
  );

  const handleVoiceStop = useCallback(() => {
    if (voiceFinalRef.current) {
      const base = voiceBaseRef.current;
      const merged = `${base}${base ? ' ' : ''}${voiceFinalRef.current}`;
      draft.set({ additionalInfo: merged.slice(0, 1000) });
    }
  }, [draft]);

  useEffect(() => {
    const currentSchool = draft.school.trim();
    const legacyDefault = 'Delhi Public School, Bokaro';
    if ((currentSchool === '' || currentSchool === legacyDefault) && schoolName.trim()) {
      draft.set({ school: schoolName });
    }
  }, [draft, schoolName]);

  async function handleSubmit() {
    setErrors({});

    const payload = {
      title: draft.title.trim(),
      subject: draft.subject.trim(),
      class: draft.class.trim(),
      school: draft.school.trim(),
      dueDate: draft.dueDate,
      questionTypes: draft.questionTypes,
      additionalInfo: draft.additionalInfo,
      sourceText: draft.sourceText,
    };

    const parsed = CreateAssignmentSchema.safeParse(payload);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_';
        if (!fields[key]) fields[key] = issue.message;
      }
      setErrors(fields);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    try {
      setSubmitting(true);
      const apiPayload: Omit<CreateAssignmentInput, 'dueDate'> & { dueDate: string } = {
        ...parsed.data,
        dueDate:
          parsed.data.dueDate instanceof Date
            ? parsed.data.dueDate.toISOString()
            : new Date(parsed.data.dueDate).toISOString(),
      };
      const res = await createAssignment(apiPayload, file);
      incrementAssignmentCount(1);
      startGen(res.id, res.jobId, parsed.data.title);
      router.push(`/assignments/${res.id}`);
      draft.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[373px] flex-col items-center gap-6 px-3 pb-24 pt-0 lg:max-w-[1103px] lg:gap-8 lg:px-0 lg:pb-12">
      <Topbar title="Assignment" />

      <div className="w-full pt-0 lg:pt-[20px]">
        <div className="flex w-full flex-col items-center gap-6 lg:gap-8">
          <div className="self-start flex w-full items-start gap-2.5 lg:max-w-[820px] lg:ml-3">
            <div className="relative flex min-h-[50px] flex-1 flex-col justify-center gap-1 pl-7">
              <h1 className="text-[16px] font-bold leading-[1.2] tracking-[-0.02em] text-ink lg:text-[38px]">Create Assignment</h1>
              <span className="absolute left-0 top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-brand-500 shadow-[0_0_0_3px_rgba(36,86,224,0.20)]" />
              <p className="text-[14px] leading-[1.25] tracking-[-0.03em] text-ink-subtle lg:text-[16px]">Set up a new assignment for your students</p>
            </div>
          </div>

          <StepRail />

          <section className="w-full rounded-[32px] bg-[rgba(255,255,255,0.5)] px-4 py-8 lg:max-w-[810px] lg:p-8">
            <div className="flex flex-col gap-6 lg:gap-8">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[16px] font-bold leading-[140%] tracking-[-0.02em] text-ink lg:text-[20px]">Assignment Details</h2>
                <p className="text-[14px] leading-[140%] tracking-[-0.02em] text-ink-muted">Basic information about your assignment</p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Quiz on Electricity"
                    value={draft.title}
                    onChange={(e) => draft.set({ title: e.target.value })}
                    className="h-11 rounded-full px-4 text-[16px] tracking-[-0.02em]"
                  />
                  <FieldError>{errors.title}</FieldError>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={draft.subject}
                      onChange={(e) => draft.set({ subject: e.target.value })}
                      className="h-11 rounded-full px-4 text-[16px] tracking-[-0.02em]"
                    />
                    <FieldError>{errors.subject}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Input
                      id="class"
                      value={draft.class}
                      onChange={(e) => draft.set({ class: e.target.value })}
                      className="h-11 rounded-full px-4 text-[16px] tracking-[-0.02em]"
                    />
                    <FieldError>{errors.class}</FieldError>
                  </div>
                </div>

                <div>
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={draft.school}
                    onChange={(e) => draft.set({ school: e.target.value })}
                    className="h-11 rounded-full px-4 text-[16px] tracking-[-0.02em]"
                  />
                  <FieldError>{errors.school}</FieldError>
                </div>
              </div>

              <FileUpload file={file} onFile={setFile} />

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <div className="relative">
                  <Input
                    id="dueDate"
                    type="date"
                    min={todayIsoDate()}
                    value={draft.dueDate}
                    onChange={(e) => draft.set({ dueDate: e.target.value })}
                    className="h-11 rounded-full border-border px-4 pr-12 text-[16px] tracking-[-0.02em]"
                  />
                  <CalendarIcon className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-ink-muted" />
                </div>
                <FieldError>{errors.dueDate}</FieldError>
              </div>

              <QuestionTypeSection
                rows={draft.questionTypes}
                takenTypes={takenTypes}
                availableType={availableType}
                totals={totals}
                setRow={(index, patch) => draft.setRow(index, patch)}
                addRow={(type) => draft.addRow(type)}
                removeRow={(index) => draft.removeRow(index)}
              />

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <Label htmlFor="info" className="mb-0">
                    Additional Information (For better output)
                  </Label>
                  <VoiceInputButton
                    onStart={handleVoiceStart}
                    onTranscript={handleVoiceTranscript}
                    onStop={handleVoiceStop}
                  />
                </div>
                <Textarea
                  id="info"
                  value={draft.additionalInfo}
                  onChange={(e) => draft.set({ additionalInfo: e.target.value })}
                  placeholder="e.g. Generate a question paper for 1 hour duration..."
                  maxLength={1000}
                  className="min-h-[102px] rounded-[16px] border-border bg-[rgba(255,255,255,0.25)] px-4 py-4 text-[14px] tracking-[-0.02em]"
                />
                <FieldError>{errors.additionalInfo}</FieldError>
                <p className="mt-2 text-right text-[12px] leading-[140%] tracking-[-0.02em] text-ink-muted">
                  {draft.additionalInfo.length}/1000
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <Button
                  variant="secondary"
                  iconLeft={<ArrowLeft className="h-5 w-5" />}
                  onClick={() => router.back()}
                  className="h-[46px] rounded-full px-5 text-[16px] tracking-[-0.02em]"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  iconLeft={<Sparkles className="h-4 w-4 text-brand-300" />}
                  iconRight={<ArrowRight className="h-5 w-5" />}
                  className="h-[46px] rounded-full bg-ink px-5 text-[16px] tracking-[-0.02em]"
                >
                  Continue
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StepRail() {
  return (
    <div className="self-start flex w-full max-w-[660px] items-center gap-2 lg:ml-[112px] lg:max-w-[760px]">
      <div className="h-0 flex-1 border-t-[4px] border-brand-500 rounded-full" />
      <span className="h-[8px] w-[8px] shrink-0 rounded-full bg-brand-300" />
      <div className="h-0 flex-1 border-t-[4px] border-border-strong rounded-full" />
    </div>
  );
}

function QuestionTypeSection({
  rows,
  takenTypes,
  availableType,
  totals,
  setRow,
  addRow,
  removeRow,
}: {
  rows: CreateAssignmentInput['questionTypes'];
  takenTypes: QuestionType[];
  availableType?: QuestionType;
  totals: { totalQuestions: number; totalMarks: number };
  setRow: (index: number, patch: Partial<{ type: QuestionType; count: number; marks: number }>) => void;
  addRow: (type: QuestionType) => void;
  removeRow: (index: number) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-4 lg:gap-4">
      <div className="flex w-full flex-col gap-4 lg:h-[314px] lg:flex-row lg:justify-between lg:gap-16">
        <div className="flex w-full flex-col gap-4 lg:h-[314px] lg:w-[471px]">
          <div className="text-[16px] font-bold leading-[140%] tracking-[-0.02em] text-ink">Question Type</div>
          <div className="flex flex-col gap-3 lg:gap-4">
            {rows.map((row, index) => {
              const options = QUESTION_TYPES.map((type) => ({
                label: QUESTION_TYPE_LABELS[type],
                value: type,
              })).filter((option) => option.value === row.type || !takenTypes.includes(option.value));

              return (
                <div key={`${row.type}-${index}`} className="flex w-full flex-col gap-3 rounded-[24px] bg-[#FFFFFF] p-3 lg:h-11 lg:flex-row lg:items-center lg:gap-3 lg:rounded-none lg:bg-transparent lg:p-0">
                  <div className="flex h-11 w-full items-center rounded-full bg-white px-4 py-[11px] lg:max-w-[443px]">
                    <Select
                      value={row.type}
                      onChange={(e) => setRow(index, { type: e.target.value as QuestionType })}
                      options={options}
                      className="h-6 border-0 bg-transparent p-0 pr-8 text-[16px] font-medium tracking-[-0.02em] shadow-none"
                    />
                  </div>
                  <button type="button" onClick={() => removeRow(index)} className="hidden h-4 w-4 shrink-0 items-center justify-center text-ink lg:flex" aria-label="Remove row">
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex w-full items-start gap-3 lg:hidden">
                    <div className="flex-1">
                      <div className="text-[14px] font-medium leading-[140%] tracking-[-0.02em] text-ink">No. of Questions</div>
                      <Counter
                        value={row.count}
                        onChange={(next) => setRow(index, { count: next })}
                        min={1}
                        max={30}
                        className="mt-2 h-[38px] w-full justify-between rounded-full border-border bg-white px-2 py-2"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium leading-[140%] tracking-[-0.02em] text-ink">Marks</div>
                      <Counter
                        value={row.marks}
                        onChange={(next) => setRow(index, { marks: next })}
                        min={1}
                        max={20}
                        className="mt-2 h-[38px] w-full justify-between rounded-full border-border bg-white px-2 py-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="mt-7 flex h-4 w-4 shrink-0 items-center justify-center text-ink"
                      aria-label="Remove row"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {availableType && (
              <button
                type="button"
                onClick={() => addRow(availableType)}
                className="mt-2 inline-flex h-9 items-center gap-2 self-start text-[14px] font-bold leading-[140%] tracking-[-0.02em] text-ink"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Plus className="h-5 w-5" />
                </span>
                Add Question Type
              </button>
            )}
          </div>
        </div>

        <div className="hidden w-full flex-col lg:flex lg:h-[262px] lg:w-[275px]">
          <div className="mb-4 flex h-[22px] items-center justify-between gap-4 text-[16px] font-medium leading-[140%] tracking-[-0.02em] text-ink">
            <span className="w-[116px] text-center">No. of Questions</span>
            <span className="w-[100px] text-center">Marks</span>
          </div>

          <div className="flex flex-col gap-4">
            {rows.map((row, index) => (
              <div key={`row-${row.type}-${index}`} className="flex items-center gap-3">
                <Counter
                  value={row.count}
                  onChange={(next) => setRow(index, { count: next })}
                  min={1}
                  max={30}
                  className="h-11 w-[100px] justify-between rounded-full border-border bg-white px-2 py-2"
                />
                <Counter
                  value={row.marks}
                  onChange={(next) => setRow(index, { marks: next })}
                  min={1}
                  max={20}
                  className="h-11 w-[100px] justify-between rounded-full border-border bg-white px-2 py-2"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-auto w-full flex-col items-end gap-1 text-right text-[14px] font-medium leading-[110%] tracking-[-0.02em] text-ink lg:h-[44px] lg:flex-row lg:items-end lg:justify-between lg:gap-4 lg:text-[16px] lg:pl-[471px] lg:pr-[34px]">
        <div className="w-full text-right lg:w-[150px]">
          Total Questions : <span className="font-normal">{totals.totalQuestions}</span>
        </div>
        <div className="w-full text-right lg:w-[150px]">
          Total Marks : <span className="font-normal">{totals.totalMarks}</span>
        </div>
      </div>
    </div>
  );
}
