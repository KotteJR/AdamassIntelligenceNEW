import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'Storage');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);

  if (req.method === 'GET') {
    const files = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith('.json'));
    const reports = files.map(f => {
      const content = fs.readFileSync(path.join(STORAGE_DIR, f), 'utf-8');
      return JSON.parse(content);
    });
    return res.status(200).json(reports);
  }

  if (req.method === 'POST') {
    const reportData = req.body;

    if (!reportData.jobId) return res.status(400).json({ error: 'Missing jobId' });
    
    const filePath = path.join(STORAGE_DIR, `report-${reportData.jobId}.json`);
    
    // Save the entire request body
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
} 