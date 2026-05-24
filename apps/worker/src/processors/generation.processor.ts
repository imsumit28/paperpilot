import type { Job } from 'bullmq';
import { AssignmentModel } from '../models/Assignment.model';
import { ProgressReporter } from '../progress/reporter';
import { generatePaper, GenerationError } from '../llm/generator';
import { logger } from '../config/logger';
import type { CreateAssignmentInput } from '@paper-pilot/shared';

export interface GenerationJobData {
  assignmentId: string;
  regenerate?: boolean;
}

export async function processGenerationJob(job: Job<GenerationJobData>) {
  const assignmentId = job.data.assignmentId;
  const reporter = new ProgressReporter({ assignmentId, jobId: String(job.id) });

  const doc = await AssignmentModel.findById(assignmentId);
  if (!doc) {
    logger.error({ assignmentId }, 'Assignment not found');
    await reporter.fail('NOT_FOUND', 'Assignment not found');
    return;
  }

  try {
    doc.status = 'processing';
    doc.error = undefined;
    await doc.save();

    await reporter.progress(5, 'analyzing');

    const input: CreateAssignmentInput = {
      title: doc.title,
      subject: doc.subject,
      class: doc.class,
      school: doc.school,
      dueDate: doc.dueDate,
      questionTypes: doc.questionTypes.map((q) => ({
        type: q.type as CreateAssignmentInput['questionTypes'][number]['type'],
        count: q.count,
        marks: q.marks,
      })),
      additionalInfo: doc.additionalInfo ?? '',
      sourceText: doc.sourceText ?? '',
    };

    await reporter.progress(20, 'building_prompt');
    await sleep(150); // make the step visible to UI

    await reporter.progress(35, 'generating');
    const { paper, attempts } = await generatePaper(input);

    if (attempts > 1) {
      await reporter.progress(55, 'refining');
    }
    await reporter.progress(70, 'parsing');

    // Post-process: normalize question IDs to be unique sequential
    let i = 0;
    for (const sec of paper.sections) {
      for (const q of sec.questions) {
        i += 1;
        q.id = `q${i}`;
      }
    }
    paper.answerKey = paper.answerKey.map((entry, idx) => ({
      questionId: `q${idx + 1}`,
      answer: entry.answer,
    }));

    await reporter.progress(85, 'sectioning');
    doc.paper = paper as unknown as typeof doc.paper;
    doc.status = 'completed';
    await doc.save();

    await reporter.progress(95, 'saving');
    await sleep(120);

    await reporter.progress(100, 'complete');
    await reporter.complete(paper);
    logger.info({ assignmentId, attempts }, 'Generation completed');
  } catch (err) {
    const code = err instanceof GenerationError ? err.code : 'INTERNAL';
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err, assignmentId }, 'Generation failed');
    doc.status = 'failed';
    doc.error = { code, message } as unknown as typeof doc.error;
    await doc.save();
    await reporter.fail(code, message);
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
