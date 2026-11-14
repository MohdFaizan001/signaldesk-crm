import type { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, message = 'Operation completed', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function sendError(res: Response, status: number, message: string, errors: unknown[] = []) {
  return res.status(status).json({ success: false, message, errors });
}
