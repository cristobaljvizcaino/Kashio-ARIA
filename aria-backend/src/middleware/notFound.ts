import { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
};
