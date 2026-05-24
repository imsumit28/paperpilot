import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { ASSIGNMENT_STATUSES, DIFFICULTIES, QUESTION_TYPES } from '@paper-pilot/shared';

const QuestionSubSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    text: { type: String, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    marks: { type: Number, required: true, min: 1 },
    options: { type: [String], default: undefined },
    answer: { type: String },
  },
  { _id: false },
);

const SectionSubSchema = new Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [QuestionSubSchema], required: true },
  },
  { _id: false },
);

const PaperSubSchema = new Schema(
  {
    title: { type: String, required: true },
    school: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    timeAllowed: { type: String, required: true },
    maximumMarks: { type: Number, required: true },
    generalInstructions: { type: [String], required: true },
    sections: { type: [SectionSubSchema], required: true },
    answerKey: {
      type: [
        new Schema(
          { questionId: { type: String, required: true }, answer: { type: String, required: true } },
          { _id: false },
        ),
      ],
      required: true,
    },
  },
  { _id: false },
);

const AssignmentSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    school: { type: String, required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: 'pending', index: true },
    jobId: { type: String, default: null, index: true },
    dueDate: { type: Date, required: true },
    questionTypes: {
      type: [
        new Schema(
          {
            type: { type: String, enum: QUESTION_TYPES, required: true },
            count: { type: Number, required: true, min: 1 },
            marks: { type: Number, required: true, min: 1 },
          },
          { _id: false },
        ),
      ],
      required: true,
    },
    additionalInfo: { type: String, default: '' },
    sourceText: { type: String, default: '' },
    paper: { type: PaperSubSchema, default: undefined },
    error: {
      type: new Schema({ code: String, message: String }, { _id: false }),
      default: undefined,
    },
    pdfReady: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type AssignmentDoc = InferSchemaType<typeof AssignmentSchema>;
export type AssignmentHydrated = HydratedDocument<AssignmentDoc>;
export const AssignmentModel = mongoose.model('Assignment', AssignmentSchema);
