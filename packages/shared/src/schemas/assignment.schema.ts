import { z } from 'zod';
import { ASSIGNMENT_STATUSES, QUESTION_TYPES } from '../constants';
import { QuestionPaperSchema } from './question-paper.schema';

export const QuestionTypeAllocationSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  count: z.number().int().min(1, 'Must have at least 1 question').max(50),
  marks: z.number().int().min(1, 'Marks must be at least 1').max(20),
});
export type QuestionTypeAllocation = z.infer<typeof QuestionTypeAllocationSchema>;

export const CreateAssignmentSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
    subject: z.string().trim().min(2).max(60).default('General'),
    class: z.string().trim().min(1).max(20).default('5'),
    school: z.string().trim().min(2).max(120).default('Delhi Public School, Bokaro'),
    dueDate: z.coerce
      .date()
      .refine((d) => d.getTime() >= new Date().setHours(0, 0, 0, 0), {
        message: 'Due date cannot be in the past',
      }),
    questionTypes: z
      .array(QuestionTypeAllocationSchema)
      .min(1, 'Add at least one question type')
      .refine(
        (arr) => new Set(arr.map((q) => q.type)).size === arr.length,
        { message: 'Each question type can only be added once' },
      ),
    additionalInfo: z.string().trim().max(1000).optional().default(''),
    sourceText: z.string().trim().max(20000).optional().default(''),
  })
  .strict();
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

export const AssignmentDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  class: z.string(),
  school: z.string(),
  status: z.enum(ASSIGNMENT_STATUSES),
  jobId: z.string().nullable(),
  dueDate: z.string(),
  questionTypes: z.array(QuestionTypeAllocationSchema),
  additionalInfo: z.string(),
  sourceText: z.string().optional(),
  paper: QuestionPaperSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  pdfReady: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AssignmentDto = z.infer<typeof AssignmentDtoSchema>;
