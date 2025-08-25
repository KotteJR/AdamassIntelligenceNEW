import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const STORAGE_DIR = path.join(process.cwd(), 'Storage');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create local Storage directory if it doesn't exist (for development)
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);

  if (req.method === 'GET') {
    try {
      // Try to read from Supabase Storage first (for Vercel)
      const { data: files, error } = await supabaseAdmin.storage
        .from('reports')
        .list('', { limit: 100 });

      if (!error && files && files.length > 0) {
        const reports = [];
        for (const file of files.filter(f => f.name.endsWith('.json'))) {
          try {
            const { data: fileData } = await supabaseAdmin.storage
              .from('reports')
              .download(file.name);
            
            if (fileData) {
              const content = await fileData.text();
              reports.push(JSON.parse(content));
            }
          } catch (e) {
            console.warn(`Failed to read file ${file.name}:`, e);
          }
        }
        return res.status(200).json(reports);
      }

      // Fallback to local Storage (for development)
      const localFiles = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith('.json'));
      const localReports = localFiles.map(f => {
        const content = fs.readFileSync(path.join(STORAGE_DIR, f), 'utf-8');
        return JSON.parse(content);
      });
      return res.status(200).json(localReports);
    } catch (error) {
      console.error('Error reading reports:', error);
      return res.status(500).json({ error: 'Failed to read reports' });
    }
  }

  if (req.method === 'POST') {
    const reportData = req.body;

    if (!reportData.jobId) return res.status(400).json({ error: 'Missing jobId' });
    
    const fileName = `report-${reportData.jobId}.json`;
    const fileContent = JSON.stringify(reportData, null, 2);

    try {
      // Save to Supabase Storage (for Vercel production)
      const { error: uploadError } = await supabaseAdmin.storage
        .from('reports')
        .upload(fileName, fileContent, {
          contentType: 'application/json',
          upsert: true // Overwrite if exists
        });

      if (uploadError) {
        console.warn('Failed to save to Supabase Storage:', uploadError);
      } else {
        console.log(`Successfully saved ${fileName} to Supabase Storage`);
      }

      // Also save locally (for development)
      const filePath = path.join(STORAGE_DIR, fileName);
      fs.writeFileSync(filePath, fileContent);
      console.log(`Successfully saved ${fileName} to local Storage`);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving report:', error);
      return res.status(500).json({ error: 'Failed to save report' });
    }
  }

  res.status(405).end();
} 