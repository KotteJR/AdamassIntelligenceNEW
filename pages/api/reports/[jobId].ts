import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'Storage');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;
  if (!jobId || typeof jobId !== 'string') return res.status(400).json({ error: 'Missing jobId' });
  const filePath = path.join(STORAGE_DIR, `report-${jobId}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  const content = fs.readFileSync(filePath, 'utf-8');
  res.status(200).json(JSON.parse(content));
} 