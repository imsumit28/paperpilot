import type { Request, Response, NextFunction } from 'express';
import { CreateAssignmentSchema } from '@paper-pilot/shared';
import {
  createAssignment,
  deleteAssignment,
  getAssignment,
  listAssignments,
  regenerateAssignment,
} from '../services/assignment.service';
import { extractText } from '../services/source-text.service';
import { ensurePdf, getCachedPdf } from '../services/pdf.service';
import { badRequest } from '../middleware/errorHandler';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Form may come in as multipart (with optional file) or JSON.
    let payloadRaw: unknown = req.body;
    if (typeof req.body?.payload === 'string') {
      try {
        payloadRaw = JSON.parse(req.body.payload);
      } catch {
        throw badRequest('payload field must be valid JSON');
      }
    }
    const parsed = CreateAssignmentSchema.parse(payloadRaw);

    // If a file was uploaded, extract text and override sourceText
    if (req.file) {
      const extracted = await extractText(req.file);
      parsed.sourceText = extracted;
    }

    const dto = await createAssignment(parsed);
    res.status(201).json({ ok: true, data: { id: dto.id, jobId: dto.jobId, assignment: dto } });
  } catch (err) {
    next(err);
  }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
    const data = await listAssignments({ page, pageSize });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = await getAssignment(req.params.id);
    res.json({ ok: true, data: dto });
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteAssignment(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function regenerateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rawAppend = req.body && typeof req.body === 'object'
      ? (req.body as { additionalInfoAppend?: unknown }).additionalInfoAppend
      : undefined;
    const additionalInfoAppend =
      typeof rawAppend === 'string' && rawAppend.trim().length > 0
        ? rawAppend.slice(0, 1000)
        : undefined;
    const dto = await regenerateAssignment(req.params.id, { additionalInfoAppend });
    res.json({ ok: true, data: { id: dto.id, jobId: dto.jobId, assignment: dto } });
  } catch (err) {
    next(err);
  }
}

export async function pdfHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const buf = req.query.cache === 'only'
      ? await getCachedPdf(req.params.id)
      : await ensurePdf(req.params.id);
    if (!buf) {
      res.status(202).json({ ok: false, error: { code: 'PENDING', message: 'PDF not cached yet' } });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="paper-${req.params.id}.pdf"`);
    res.send(buf);
  } catch (err) {
    next(err);
  }
}
