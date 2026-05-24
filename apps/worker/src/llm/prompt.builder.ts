import {
  QUESTION_TYPE_LABELS,
  type CreateAssignmentInput,
  type QuestionType,
} from '@paper-pilot/shared';

/**
 * The system prompt locks the model into producing JSON that matches our Zod schema.
 * The one-shot example helps stabilize structure.
 */
export const SYSTEM_PROMPT = `You are an expert academic exam-paper author.
Your sole job is to return a SINGLE JSON object (no markdown, no commentary, no code fences)
that matches the following TypeScript shape exactly:

type Difficulty = 'easy' | 'moderate' | 'hard';
type QuestionType = 'mcq' | 'short' | 'diagram' | 'numerical';

interface Question {
  id: string;                 // unique short id like "q1", "q2"
  type: QuestionType;
  text: string;               // the question text
  difficulty: Difficulty;
  marks: number;              // positive integer
  options?: string[];         // required when type === "mcq" (4 distinct items)
  answer?: string;            // optional teacher answer
}
interface Section {
  title: string;              // "Section A: Multiple Choice Questions", "Section B: Short Questions" etc. — ALWAYS include the question type after the letter
  instruction: string;        // e.g. "Attempt all questions. Each question carries 2 marks."
  questions: Question[];      // at least 1 question
}
interface AnswerKeyEntry { questionId: string; answer: string; }
interface QuestionPaper {
  title: string;
  school: string;
  subject: string;
  class: string;
  timeAllowed: string;        // e.g. "45 minutes"
  maximumMarks: number;       // sum of all question marks
  generalInstructions: string[]; // 3-5 short bullet instructions
  sections: Section[];
  answerKey: AnswerKeyEntry[];   // one entry per question
}

Hard rules:
- Output ONLY the JSON object. No prose, no \\\`\\\`\\\` fences.
- Every question MUST have an entry in answerKey by id.
- MCQ questions MUST have exactly 4 options.
- The total of all question marks MUST equal "maximumMarks".
- Difficulty must be a balanced mix unless asked otherwise.
- Distribute questions into sections by question type. Section titles MUST follow the format "Section A: Multiple Choice Questions", "Section B: Short Questions", "Section C: Numerical Problems", "Section D: Diagram/Graph-Based Questions" — use the exact type label after the colon.
- Use clear, age-appropriate language for the given class.`;

export const ONE_SHOT_EXAMPLE_USER = `Generate a question paper with these specs:
School: Demo School
Subject: Science
Class: 5th
Title: Quiz on States of Matter
Time allowed: 30 minutes
Question types:
- mcq: count=2, marks=1
- short: count=1, marks=3
Total marks: 5
Additional notes: Keep it beginner-friendly.`;

export const ONE_SHOT_EXAMPLE_ASSISTANT = JSON.stringify({
  title: 'Quiz on States of Matter',
  school: 'Demo School',
  subject: 'Science',
  class: '5th',
  timeAllowed: '30 minutes',
  maximumMarks: 5,
  generalInstructions: [
    'All questions are compulsory.',
    'Read each question carefully before answering.',
    'Marks are indicated against each question.',
  ],
  sections: [
    {
      title: 'Section A: Multiple Choice Questions',
      instruction: 'Attempt all questions. Each question carries 1 mark.',
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          text: 'Which state of matter has a definite shape?',
          difficulty: 'easy',
          marks: 1,
          options: ['Solid', 'Liquid', 'Gas', 'Plasma'],
          answer: 'Solid',
        },
        {
          id: 'q2',
          type: 'mcq',
          text: 'Water vapour is the ____ state of water.',
          difficulty: 'easy',
          marks: 1,
          options: ['Solid', 'Liquid', 'Gaseous', 'None'],
          answer: 'Gaseous',
        },
      ],
    },
    {
      title: 'Section B: Short Questions',
      instruction: 'Attempt all questions. Each question carries 3 marks.',
      questions: [
        {
          id: 'q3',
          type: 'short',
          text: 'Explain in 2-3 sentences why ice floats on water.',
          difficulty: 'moderate',
          marks: 3,
          answer:
            'Ice is less dense than liquid water because its molecules form an open hexagonal structure when frozen, occupying more space per molecule, so it floats.',
        },
      ],
    },
  ],
  answerKey: [
    { questionId: 'q1', answer: 'Solid' },
    { questionId: 'q2', answer: 'Gaseous' },
    {
      questionId: 'q3',
      answer:
        'Ice is less dense than liquid water; the hexagonal lattice of ice has more empty space per molecule.',
    },
  ],
});

export interface PromptInputs extends CreateAssignmentInput {}

export function buildUserPrompt(input: PromptInputs): string {
  const totalMarks = input.questionTypes.reduce((sum, q) => sum + q.count * q.marks, 0);
  const totalQuestions = input.questionTypes.reduce((sum, q) => sum + q.count, 0);
  const requestedTime = inferTimeAllowed(input.additionalInfo, totalQuestions);
  const lines: string[] = [];
  lines.push(`Generate a question paper with these structured specs:`);
  lines.push(`<assignment>`);
  lines.push(`School: ${input.school}`);
  lines.push(`Subject: ${input.subject}`);
  lines.push(`Class: ${input.class}`);
  lines.push(`Title: ${input.title}`);
  lines.push(`Time allowed: ${requestedTime}`);
  lines.push(`Question types:`);
  for (const q of input.questionTypes) {
    lines.push(`- ${q.type} (${QUESTION_TYPE_LABELS[q.type as QuestionType]}): count=${q.count}, marks=${q.marks}`);
  }
  lines.push(`Total questions: ${totalQuestions}`);
  lines.push(`Total marks (must equal maximumMarks): ${totalMarks}`);
  if (input.additionalInfo?.trim()) {
    lines.push(`Additional notes: ${input.additionalInfo.trim()}`);
  }
  if (input.sourceText?.trim()) {
    const excerpt = input.sourceText.trim().slice(0, 6000);
    lines.push(`Use the following source material as primary basis for questions:`);
    lines.push(`<source>\n${excerpt}\n</source>`);
  }
  lines.push(`</assignment>`);
  lines.push(`Hard requirement: set "timeAllowed" exactly to "${requestedTime}".`);
  lines.push(`Group questions into sections by type. Use difficulty mix: ~40% easy, ~40% moderate, ~20% hard.`);
  lines.push(`Return ONLY the JSON object. No markdown.`);
  return lines.join('\n');
}

export function buildRefinePrompt(previousRaw: string, validationError: string): string {
  return [
    'Your previous output failed validation:',
    validationError,
    '',
    'Previous output (DO NOT REPEAT THE SAME MISTAKE):',
    previousRaw.slice(0, 4000),
    '',
    'Return ONLY a valid JSON object matching the schema. No markdown, no prose.',
  ].join('\n');
}

function guessTime(totalQuestions: number): string {
  const minutes = Math.max(15, Math.min(180, totalQuestions * 3));
  return `${minutes} minutes`;
}

function parseDurationFromAdditionalInfo(additionalInfo: string): string | null {
  const text = additionalInfo.trim().toLowerCase();
  if (!text) return null;

  const hourMatch = text.match(/(\d+)\s*(?:hour|hours|hr|hrs)\b/);
  if (hourMatch) {
    const hours = Number.parseInt(hourMatch[1] ?? '', 10);
    if (Number.isFinite(hours) && hours > 0) return `${hours * 60} minutes`;
  }

  const minuteMatch = text.match(/(\d+)\s*(?:minute|minutes|min|mins)\b/);
  if (minuteMatch) {
    const minutes = Number.parseInt(minuteMatch[1] ?? '', 10);
    if (Number.isFinite(minutes) && minutes > 0) return `${minutes} minutes`;
  }

  return null;
}

export function inferTimeAllowed(additionalInfo: string, totalQuestions: number): string {
  return parseDurationFromAdditionalInfo(additionalInfo) ?? guessTime(totalQuestions);
}
