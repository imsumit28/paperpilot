import pdfParse from 'pdf-parse';

const MAX_CHARS = 20_000;

/**
 * Extract plain text from an uploaded file buffer.
 * Supports: .txt (and any text/*), .pdf
 * Trims to MAX_CHARS to keep prompt size sane.
 */
export async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    const out = await pdfParse(file.buffer);
    return clip(out.text);
  }
  // Treat anything else as text
  return clip(file.buffer.toString('utf8'));
}

function clip(s: string): string {
  const trimmed = s.replace(/\s+/g, ' ').trim();
  return trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;
}
