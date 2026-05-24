import type { Difficulty, Question, QuestionPaper } from '@paper-pilot/shared';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Challenging',
};

export function PaperView({ paper }: { paper: QuestionPaper }) {
  return (
    <article className="w-full max-w-[355px] md:max-w-[1060px] min-h-[2446px] md:min-h-[1465px] mx-auto bg-[#F6F6F6] md:bg-white rounded-[32px] px-4 md:px-8 py-6 md:py-8">
      <PaperHeader paper={paper} />
      <StudentInfo paper={paper} />

      {paper.sections.map((section, i) => (
        <section key={i} className="mb-8">
          <h2 className="text-center text-[16px] md:text-[24px] leading-[160%] font-semibold tracking-[-0.04em] text-[#303030] mb-2 mt-4">
            {section.title}
          </h2>
          {section.instruction && (
            <SectionInstruction text={section.instruction} />
          )}

          <ol className="space-y-3">
            {section.questions.map((q, idx) => (
              <li key={q.id} className="text-[16px] leading-[150%] md:leading-[240%] tracking-[-0.04em] text-[#303030]">
                <QuestionItem question={q} index={runningIndex(paper, i, idx)} />
              </li>
            ))}
          </ol>
        </section>
      ))}

      <div className="mt-10 text-center">
        <h3 className="text-[16px] leading-[150%] md:leading-[240%] tracking-[-0.04em] text-[#303030] font-semibold">End of Question Paper</h3>
      </div>

      <div className="mt-10">
        <h3 className="font-semibold text-[#303030] mb-3 text-[14px] md:text-[18px] leading-[160%] tracking-[-0.04em]">Answer Key:</h3>
        <ol className="space-y-2 list-decimal list-inside text-[16px] leading-[150%] md:leading-[240%] tracking-[-0.04em] text-[#303030] marker:font-medium">
          {paper.answerKey.map((entry) => (
            <li key={entry.questionId} className="whitespace-pre-line">
              {entry.answer}
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

function runningIndex(paper: QuestionPaper, sectionIdx: number, questionIdx: number) {
  let i = 0;
  for (let s = 0; s < sectionIdx; s += 1) i += paper.sections[s].questions.length;
  return i + questionIdx + 1;
}

function PaperHeader({ paper }: { paper: QuestionPaper }) {
  return (
    <header>
      <div className="text-center">
        <h1 className="text-[20px] md:text-[32px] leading-[130%] md:leading-[160%] font-bold tracking-[-0.04em] text-[#303030]">
          {paper.school}
          <br />
          Subject: {paper.subject}
          <br />
          Class: {paper.class}
        </h1>
        <div className="md:hidden h-2" aria-hidden="true" />
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 gap-[10px] text-[14px] md:text-[18px] leading-[160%] tracking-[-0.04em] text-[#303030] font-semibold">
        <span>
          Time Allowed: {paper.timeAllowed}
        </span>
        <span>
          Maximum Marks: {paper.maximumMarks}
        </span>
      </div>
      {paper.generalInstructions.length > 0 && (
        <div className="mt-2 text-left text-[14px] md:text-[18px] leading-[160%] tracking-[-0.04em] text-[#303030] font-semibold space-y-0.5">
          {paper.generalInstructions.map((ins, i) => (
            <p key={i}>{ins}</p>
          ))}
        </div>
      )}
    </header>
  );
}

function StudentInfo({ paper }: { paper: QuestionPaper }) {
  return (
    <div className="mt-4 mb-2 space-y-1.5 text-[14px] md:text-[18px] leading-[160%] tracking-[-0.04em] text-[#303030] font-semibold">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">Name:</span>
        <span className="flex-1 border-b border-ink/40 h-5" />
      </div>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">Roll Number:</span>
        <span className="flex-1 border-b border-ink/40 h-5" />
      </div>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">Class:</span>
        <span className="whitespace-nowrap">{paper.class}</span>
        <span className="whitespace-nowrap ml-2">Section:</span>
        <span className="flex-1 border-b border-ink/40 h-5" />
      </div>
    </div>
  );
}

function QuestionItem({ question, index }: { question: Question; index: number }) {
  const difficulty = question.difficulty as Difficulty;
  return (
    <div>
      <div className="text-[#303030]">
        <span className="font-medium">{index}. </span>
        <span className="font-medium">[{DIFFICULTY_LABELS[difficulty]}] </span>
        <span>{question.text} </span>
        <span>[{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}]</span>
      </div>
      {question.type === 'mcq' && question.options && (
        <ul className="mt-2 ml-7 text-[16px] leading-[150%] md:leading-[240%] tracking-[-0.04em] text-[#303030] space-y-1">
          {question.options.map((opt, i) => (
            <li key={i}>
              <span className="font-medium mr-1.5">({String.fromCharCode(65 + i)})</span>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionInstruction({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-[14px] md:text-[18px] leading-[160%] font-semibold tracking-[-0.04em] text-[#303030]">
        {lines[0]}
      </p>
      {lines.slice(1).map((line, i) => (
        <p
          key={i}
          className="text-[14px] md:text-[18px] leading-[160%] italic font-medium tracking-[-0.04em] text-[#303030]"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
