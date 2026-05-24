import {
  AssignmentDtoSchema,
  type AssignmentDto,
  type CreateAssignmentInput,
} from '@paper-pilot/shared';
import { AssignmentModel, type AssignmentHydrated } from '../models/Assignment.model';
import { generationQueue } from '../queues/generation.queue';
import { redisQueue } from '../config/redis';
import { logger } from '../config/logger';
import { notFound } from '../middleware/errorHandler';

export function toDto(doc: AssignmentHydrated): AssignmentDto {
  const obj = doc.toObject({ versionKey: false });
  return AssignmentDtoSchema.parse({
    id: String(doc._id),
    title: obj.title,
    subject: obj.subject,
    class: obj.class,
    school: obj.school,
    status: obj.status,
    jobId: obj.jobId ?? null,
    dueDate: new Date(obj.dueDate).toISOString(),
    questionTypes: obj.questionTypes,
    additionalInfo: obj.additionalInfo ?? '',
    sourceText: obj.sourceText ?? '',
    paper: obj.paper ?? undefined,
    error: obj.error ?? undefined,
    pdfReady: Boolean(obj.pdfReady),
    createdAt: new Date(obj.createdAt as Date).toISOString(),
    updatedAt: new Date(obj.updatedAt as Date).toISOString(),
  });
}

export async function createAssignment(input: CreateAssignmentInput): Promise<AssignmentDto> {
  const doc = await AssignmentModel.create({
    title: input.title,
    subject: input.subject,
    class: input.class,
    school: input.school,
    dueDate: input.dueDate,
    questionTypes: input.questionTypes,
    additionalInfo: input.additionalInfo,
    sourceText: input.sourceText,
    status: 'pending',
  });

  const job = await generationQueue.add(
    'generate',
    { assignmentId: String(doc._id) },
    { jobId: `gen-${String(doc._id)}-${Date.now()}` },
  );
  doc.jobId = job.id ?? null;
  await doc.save();

  logger.info({ assignmentId: String(doc._id), jobId: job.id }, 'Assignment created + queued');
  return toDto(doc);
}

export async function listAssignments(params: { page: number; pageSize: number }) {
  const { page, pageSize } = params;
  const [items, total] = await Promise.all([
    AssignmentModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    AssignmentModel.countDocuments(),
  ]);
  return {
    items: items.map(toDto),
    total,
    page,
    pageSize,
  };
}

export async function getAssignment(id: string): Promise<AssignmentDto> {
  const doc = await AssignmentModel.findById(id);
  if (!doc) throw notFound('Assignment not found');
  return toDto(doc);
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await AssignmentModel.findByIdAndDelete(id);
  if (!res) throw notFound('Assignment not found');
}

export interface RegenerateOptions {
  /** Text appended to the existing additionalInfo before regeneration (toolkit tweaks). */
  additionalInfoAppend?: string;
}

export async function regenerateAssignment(
  id: string,
  options: RegenerateOptions = {},
): Promise<AssignmentDto> {
  const doc = await AssignmentModel.findById(id);
  if (!doc) throw notFound('Assignment not found');

  if (options.additionalInfoAppend && options.additionalInfoAppend.trim()) {
    const existing = (doc.additionalInfo ?? '').trim();
    const tweak = options.additionalInfoAppend.trim();
    doc.additionalInfo = existing ? `${existing}\n${tweak}` : tweak;
  }

  doc.status = 'pending';
  doc.paper = undefined;
  doc.error = undefined;
  doc.pdfReady = false;
  await redisQueue.del(`pdf:${id}`);
  const job = await generationQueue.add(
    'generate',
    { assignmentId: id, regenerate: true },
    { jobId: `regen-${id}-${Date.now()}` },
  );
  doc.jobId = job.id ?? null;
  await doc.save();
  return toDto(doc);
}
