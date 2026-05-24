import type { CreateAssignmentInput, QuestionPaper } from '@paper-pilot/shared';
import { QUESTION_TYPE_LABELS } from '@paper-pilot/shared';
import { DEEPSEEK_MODEL, deepseek } from './groq.client';
import {
  SYSTEM_PROMPT,
  ONE_SHOT_EXAMPLE_USER,
  ONE_SHOT_EXAMPLE_ASSISTANT,
  buildUserPrompt,
  buildRefinePrompt,
  inferTimeAllowed,
} from './prompt.builder';
import { parseAndValidate } from './parser';
import { logger } from '../config/logger';

export interface GenerateResult {
  paper: QuestionPaper;
  attempts: number;
}

export class GenerationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function generatePaper(input: CreateAssignmentInput): Promise<GenerateResult> {
  const baseMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: ONE_SHOT_EXAMPLE_USER },
    { role: 'assistant' as const, content: ONE_SHOT_EXAMPLE_ASSISTANT },
    { role: 'user' as const, content: buildUserPrompt(input) },
  ];

  // ---- Attempt 1 ----
  const first = await callDeepSeek(baseMessages);
  const firstParse = parseAndValidate(first);
  if (firstParse.ok) {
    const totalQuestions = input.questionTypes.reduce((sum, q) => sum + q.count, 0);
    firstParse.paper.timeAllowed = inferTimeAllowed(input.additionalInfo ?? '', totalQuestions);
    logger.info({ attempts: 1 }, 'Paper generated on first attempt');
    return { paper: normalizeSectionTitles(firstParse.paper), attempts: 1 };
  }
  logger.warn({ err: firstParse.error }, 'First attempt failed validation, retrying with refine prompt');

  // ---- Attempt 2 (refine) ----
  const second = await callDeepSeek([
    ...baseMessages,
    { role: 'assistant' as const, content: first },
    { role: 'user' as const, content: buildRefinePrompt(first, firstParse.error) },
  ]);
  const secondParse = parseAndValidate(second);
  if (secondParse.ok) {
    const totalQuestions = input.questionTypes.reduce((sum, q) => sum + q.count, 0);
    secondParse.paper.timeAllowed = inferTimeAllowed(input.additionalInfo ?? '', totalQuestions);
    logger.info({ attempts: 2 }, 'Paper generated after refine');
    return { paper: normalizeSectionTitles(secondParse.paper), attempts: 2 };
  }

  logger.error({ err: secondParse.error, raw: second.slice(0, 1000) }, 'Both attempts failed');
  throw new GenerationError(
    'AI_INVALID_OUTPUT',
    `AI failed to return valid JSON after retry: ${secondParse.error}`,
  );
}

function normalizeSectionTitles(paper: QuestionPaper): QuestionPaper {
  const sections = paper.sections.map((section, idx) => {
    const letter = String.fromCharCode(65 + idx); // A, B, C, ...
    const firstType = section.questions[0]?.type;
    const typeLabel = firstType ? QUESTION_TYPE_LABELS[firstType] : null;
    const expectedPrefix = `Section ${letter}`;
    const hasTypeInTitle = typeLabel && section.title.toLowerCase().includes(typeLabel.toLowerCase());
    if (typeLabel && !hasTypeInTitle) {
      return { ...section, title: `${expectedPrefix}: ${typeLabel}` };
    }
    return section;
  });
  return { ...paper, sections };
}

async function callDeepSeek(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
  try {
    const completion = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0]?.message?.content ?? '';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timeout')) throw new GenerationError('AI_TIMEOUT', 'AI request timed out');
    throw new GenerationError('AI_ERROR', `AI request failed: ${msg}`);
  }
}
