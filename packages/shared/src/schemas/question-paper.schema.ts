import { z } from 'zod';
import { DIFFICULTIES, QUESTION_TYPES } from '../constants';

export const QuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(QUESTION_TYPES),
  text: z.string().min(1),
  difficulty: z.enum(DIFFICULTIES),
  marks: z.number().int().positive(),
  options: z.array(z.string().min(1)).min(2).max(6).optional(),
  answer: z.string().min(1).optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});
export type Section = z.infer<typeof SectionSchema>;

export const AnswerKeyEntrySchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1),
});
export type AnswerKeyEntry = z.infer<typeof AnswerKeyEntrySchema>;

export const QuestionPaperSchema = z.object({
  title: z.string().min(1),
  school: z.string().min(1),
  subject: z.string().min(1),
  class: z.string().min(1),
  timeAllowed: z.string().min(1),
  maximumMarks: z.number().int().positive(),
  generalInstructions: z.array(z.string().min(1)).min(1),
  sections: z.array(SectionSchema).min(1),
  answerKey: z.array(AnswerKeyEntrySchema).min(1),
});
export type QuestionPaper = z.infer<typeof QuestionPaperSchema>;
