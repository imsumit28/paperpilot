'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { AssignmentDto } from '@paper-pilot/shared';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GenerationProgress } from '@/components/progress/GenerationProgress';
import { PaperView } from '@/components/output/PaperView';
import { getAssignment, pdfDownloadUrl, regenerateAssignment } from '@/lib/api';
import { useJobProgress } from '@/lib/hooks/useJobProgress';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useUIStore, type ToolkitOption } from '@/store/useUIStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const generationStatus = useGenerationStore((s) => s.status);
  const generationPaper = useGenerationStore((s) => s.paper);
  const startGen = useGenerationStore((s) => s.start);
  const resetGen = useGenerationStore((s) => s.reset);

  const enableToolkit = useUIStore((s) => s.enableToolkit);
  const disableToolkit = useUIStore((s) => s.disableToolkit);
  const setToolkitBusy = useUIStore((s) => s.setToolkitBusy);

  // Hook into socket events for live progress
  useJobProgress(id);

  const refresh = useCallback(async () => {
    try {
      const dto = await getAssignment(id);
      setAssignment(dto);
      setFetchError(null);
      if (dto.status === 'pending' || dto.status === 'processing') {
        const generation = useGenerationStore.getState();
        if (generation.status === 'idle' || generation.assignmentId !== dto.id) {
          startGen(dto.id, dto.jobId ?? '', dto.title);
        }
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, startGen]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!assignment) return;
    if (assignment.paper) return;
    if (assignment.status !== 'pending' && assignment.status !== 'processing') return;

    const interval = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [assignment, refresh]);

  // When generation completes via socket, refetch the assignment from server
  useEffect(() => {
    if (generationStatus === 'complete') {
      refresh();
    }
    if (generationStatus === 'failed') {
      refresh();
    }
  }, [generationStatus, refresh]);

  // Push a notification (and transient toast) as soon as socket reports completion
  useEffect(() => {
    if (!assignment) return;
    if (generationStatus === 'complete') {
      useNotificationsStore.getState().addCompletion({
        assignmentId: assignment.id,
        title: assignment.title || 'Assignment',
      });
    } else if (generationStatus === 'failed') {
      useNotificationsStore.getState().addFailure({
        assignmentId: assignment.id,
        title: assignment.title || 'Assignment',
      });
    }
  }, [generationStatus, assignment]);

  const triggerRegenerate = useCallback(
    async (options: { additionalInfoAppend?: string; toastLabel?: string } = {}) => {
      const current = assignment;
      if (!current) return;
      try {
        setRegenerating(true);
        resetGen();
        const res = await regenerateAssignment(current.id, {
          additionalInfoAppend: options.additionalInfoAppend,
        });
        startGen(res.id, res.jobId, current.title);
        await refresh();
        toast.success(options.toastLabel ?? 'Regeneration started');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to regenerate');
      } finally {
        setRegenerating(false);
      }
    },
    [assignment, refresh, resetGen, startGen],
  );

  const paperReadyForToolkit = Boolean(
    assignment && assignment.status === 'completed' && assignment.paper && !regenerating,
  );

  useEffect(() => {
    if (!paperReadyForToolkit) {
      disableToolkit();
      return;
    }
    const handler = async (option: ToolkitOption) => {
      setToolkitBusy(true);
      try {
        await triggerRegenerate({
          additionalInfoAppend: option.additionalInfoAppend,
          toastLabel: `${option.label} — regenerating…`,
        });
      } finally {
        setToolkitBusy(false);
      }
    };
    enableToolkit(handler);
    return () => {
      disableToolkit();
    };
  }, [paperReadyForToolkit, enableToolkit, disableToolkit, setToolkitBusy, triggerRegenerate]);

  async function handleRegenerate() {
    await triggerRegenerate();
  }

  async function handleDownload() {
    if (!assignment) return;
    try {
      setDownloading(true);
      const res = await fetch(pdfDownloadUrl(assignment.id));
      if (!res.ok) {
        if (res.status === 202) {
          toast.info('PDF is being prepared, try again in a few seconds.');
          return;
        }
        throw new Error(`Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.title || 'paper'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-0">
        <Topbar title="Assignment" />
        <Card className="text-center py-12 text-sm text-ink-muted">Loading...</Card>
      </div>
    );
  }

  if (fetchError || !assignment) {
    return (
      <div className="px-4 lg:px-0">
        <Topbar title="Assignment" />
        <Card>
          <div className="text-center py-12">
            <div className="text-lg font-semibold text-ink mb-1">Assignment not found</div>
            <div className="text-sm text-ink-muted">{fetchError ?? ''}</div>
            <Button className="mt-4" onClick={() => router.push('/assignments')}>
              Back to assignments
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const paper = assignment.paper ?? generationPaper;
  const showProgress =
    !paper &&
    (assignment.status === 'pending' ||
      assignment.status === 'processing' ||
      (assignment.status === 'failed' && !assignment.paper));

  return (
    <div className="px-4 lg:px-0 pb-24 lg:pb-12">
      <Topbar title={assignment.title || 'Assignment'} />

      {showProgress ? (
        <div className="mt-4">
          <GenerationProgress onRetry={handleRegenerate} />
        </div>
      ) : (
        <div className="w-full max-w-[373px] lg:max-w-[1100px] mx-auto bg-white lg:bg-ink-muted rounded-[40px] lg:rounded-[32px] p-[9px] lg:p-5 flex flex-col gap-[10px] lg:gap-3">
          <div className="w-full lg:max-w-[1060px] lg:mx-auto min-h-[147px] lg:min-h-[164px] bg-ink lg:bg-ink/90 rounded-[32px] text-white px-4 py-6 lg:px-8 lg:py-6 flex flex-col justify-center items-start gap-3 lg:gap-4 lg:items-center">
            <div className="flex items-start gap-3 max-w-[323px] lg:max-w-none">
              <div className="w-full font-bold text-[14px] leading-[17px] tracking-[-0.02em] text-white/90 font-[Bricolage_Grotesque]">
                Here&apos;s your customized question paper for {assignment.school} — {assignment.subject}, Class{' '}
                {assignment.class}.
              </div>
            </div>

            <div className="flex items-start gap-2 lg:gap-4">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                aria-label="Regenerate question paper"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(246,246,246,0.1)] text-white transition-colors hover:bg-[rgba(246,246,246,0.16)] disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
              >
                <RefreshCw className={regenerating ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                aria-label="Download as PDF"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(246,246,246,0.1)] text-white transition-colors hover:bg-[rgba(246,246,246,0.16)] disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
              >
                <Download className="h-5 w-5" strokeWidth={2} />
              </button>

              <Button
                variant="secondary"
                onClick={handleRegenerate}
                loading={regenerating}
                iconLeft={<RefreshCw className="h-4 w-4" />}
                className="hidden lg:inline-flex"
              >
                Regenerate
              </Button>

              <Button
                onClick={handleDownload}
                loading={downloading}
                iconLeft={<Download className="h-4 w-4" />}
                className="hidden lg:inline-flex bg-white text-ink hover:bg-white/90 h-11 rounded-full px-6"
              >
                Download as PDF
              </Button>
            </div>
          </div>

          {paper ? <PaperView paper={paper} /> : <Card>No paper data.</Card>}
        </div>
      )}
    </div>
  );
}
