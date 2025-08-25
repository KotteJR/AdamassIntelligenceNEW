import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'Storage');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const resolvedParams = await params;
  const jobId = resolvedParams.jobId;
  
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  try {
    // First try to get from Supabase Storage (mimics your Storage/ folder)
    const fileName = `report-${jobId}.json`;
    try {
      const { data: fileData, error: storageError } = await supabaseAdmin.storage
        .from('reports')
        .download(fileName);

      if (!storageError && fileData) {
        const content = await fileData.text();
        const reportData = JSON.parse(content);
        console.log(`Found report ${jobId} in Supabase Storage`);
        return NextResponse.json(reportData);
      }
    } catch (storageErr) {
      console.log(`Report ${jobId} not found in Supabase Storage, trying database...`);
    }

    // Second try: get from Supabase user_analyses table
    const { data, error } = await supabase
      .from('user_analyses')
      .select('report_data, company_alias, created_at')
      .eq('job_id', jobId)
      .single();

    if (!error && data?.report_data) {
      console.log(`Found report ${jobId} in Supabase database`);
      // Return the report data with additional metadata
      return NextResponse.json({
        jobId,
        companyAlias: data.company_alias,
        dateGenerated: data.created_at,
        ...data.report_data
      });
    }

    // Third try: fallback to local Storage (for development)
    const filePath = path.join(STORAGE_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log(`Found report ${jobId} in local Storage`);
      return NextResponse.json(JSON.parse(content));
    }

    console.log(`Report ${jobId} not found anywhere`);
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch report', 
      details: error.message 
    }, { status: 500 });
  }
}