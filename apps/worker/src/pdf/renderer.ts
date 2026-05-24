import PDFDocument from 'pdfkit';
import type { Difficulty, QuestionPaper } from '@paper-pilot/shared';

const COLORS = {
  text: '#111111',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#E8520A',
  easy: '#15803D',
  moderate: '#B45309',
  hard: '#B91C1C',
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Challenging',
};

export async function renderPaperToPdf(paper: QuestionPaper): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: {
        Title: paper.title,
        Author: paper.school,
        Subject: paper.subject,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, paper);
    drawStudentInfo(doc, paper);
    drawSections(doc, paper);
    drawAnswerKey(doc, paper);

    doc.end();
  });
}

function pageBounds(doc: PDFKit.PDFDocument) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  return { left, right, width: right - left };
}

function drawHeader(doc: PDFKit.PDFDocument, paper: QuestionPaper) {
  const { left, width } = pageBounds(doc);

  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(COLORS.text)
    .text(paper.school, left, doc.y, { align: 'center', width });

  doc.moveDown(0.2);
  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor(COLORS.text)
    .text(`Subject: ${paper.subject}`, left, doc.y, { align: 'center', width })
    .text(`Class: ${paper.class}`, left, doc.y, { align: 'center', width });

  doc.moveDown(0.6);

  const y = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(`Time Allowed: ${paper.timeAllowed}`, left, y, { width, continued: false })
    .text(`Maximum Marks: ${paper.maximumMarks}`, left, y, { align: 'right', width });

  doc.x = left;
  doc.moveDown(0.6);

  if (paper.generalInstructions.length) {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
    for (const ins of paper.generalInstructions) {
      doc.text(ins, left, doc.y, { width, paragraphGap: 2 });
    }
  }
  doc.x = left;
  doc.moveDown(0.4);
}

function drawStudentInfo(doc: PDFKit.PDFDocument, paper: QuestionPaper) {
  const { left, width } = pageBounds(doc);
  const fields: [string, string?][] = [
    ['Name:'],
    ['Roll Number:'],
    ['Class:', paper.class],
  ];

  doc.font('Helvetica').fontSize(11).fillColor(COLORS.text);
  for (const [label, value] of fields) {
    if (label === 'Class:') {
      doc.font('Helvetica-Bold').text(label, left, doc.y, { continued: true, width });
      doc.font('Helvetica').text(` ${value}   `, { continued: true });
      doc.font('Helvetica-Bold').text(`Section:`, { continued: true });
      doc.font('Helvetica').text(` ______________________________`);
    } else {
      doc.font('Helvetica-Bold').text(label, left, doc.y, { continued: true, width });
      doc.font('Helvetica').text(` ______________________________`);
    }
  }
  doc.x = left;
  doc.moveDown(0.6);
}

function drawSections(doc: PDFKit.PDFDocument, paper: QuestionPaper) {
  const { left, width } = pageBounds(doc);
  let questionCounter = 0;

  for (const section of paper.sections) {
    if (doc.y > doc.page.height - 200) doc.addPage();

    doc.x = left;
    doc.moveDown(0.3);
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLORS.text)
      .text(section.title, left, doc.y, { align: 'center', width });

    if (section.instruction) {
      const lines = section.instruction.split('\n').filter(Boolean);
      const [firstLine, ...rest] = lines;
      if (firstLine) {
        doc.moveDown(0.1);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor(COLORS.text)
          .text(firstLine, left, doc.y, { align: 'center', width });
      }
      if (rest.length) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(10)
          .fillColor(COLORS.muted)
          .text(rest.join('\n'), left, doc.y, { align: 'center', width });
      }
    }

    doc.x = left;
    doc.moveDown(0.5);

    for (const q of section.questions) {
      questionCounter += 1;
      if (doc.y > doc.page.height - 120) doc.addPage();

      const badge = `[${DIFFICULTY_LABEL[q.difficulty]}]`;
      const color = COLORS[q.difficulty];

      doc.x = left;
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLORS.text)
        .text(`${questionCounter}. `, left, doc.y, { continued: true });
      doc.font('Helvetica-Bold').fillColor(color).text(`${badge} `, { continued: true });
      doc.font('Helvetica').fillColor(COLORS.text).text(q.text, { continued: true });
      doc.font('Helvetica-Bold').text(`  [${q.marks} ${q.marks === 1 ? 'Mark' : 'Marks'}]`);

      if (q.type === 'mcq' && q.options?.length) {
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
        q.options.forEach((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          doc.text(`     (${letter}) ${opt}`, left + 16, doc.y, { width: width - 16, paragraphGap: 1 });
        });
        doc.x = left;
      } else if (q.type === 'short') {
        doc.moveDown(0.4);
        for (let i = 0; i < 2; i += 1) {
          doc
            .strokeColor(COLORS.border)
            .lineWidth(0.5)
            .moveTo(left, doc.y)
            .lineTo(left + width, doc.y)
            .stroke();
          doc.moveDown(0.7);
        }
      } else if (q.type === 'numerical' || q.type === 'diagram') {
        doc.moveDown(0.4);
        doc
          .strokeColor(COLORS.border)
          .lineWidth(0.5)
          .rect(left, doc.y, width, 60)
          .stroke();
        doc.y += 70;
      }
      doc.x = left;
      doc.moveDown(0.4);
    }
  }

  // End of Question Paper
  doc.x = left;
  doc.moveDown(0.6);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.text)
    .text('End of Question Paper', left, doc.y, { align: 'center', width });
}

function drawAnswerKey(doc: PDFKit.PDFDocument, paper: QuestionPaper) {
  const { left, width } = pageBounds(doc);
  doc.addPage();
  doc.x = left;
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.brand)
    .text('Answer Key', left, doc.y, { align: 'center', width });
  doc.moveDown(0.6);

  doc.font('Helvetica').fontSize(11).fillColor(COLORS.text);
  let idx = 0;
  for (const entry of paper.answerKey) {
    idx += 1;
    if (doc.y > doc.page.height - 80) doc.addPage();
    doc.x = left;
    doc
      .font('Helvetica-Bold')
      .text(`${idx}. `, left, doc.y, { continued: true, width });
    doc.font('Helvetica').text(entry.answer, { paragraphGap: 4 });
  }
}
