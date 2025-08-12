import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'Storage');

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;
  
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  try {
    // First try to get from Supabase user_analyses
    const { data, error } = await supabase
      .from('user_analyses')
      .select('report_data, company_alias, created_at')
      .eq('job_id', jobId)
      .single();

    if (!error && data?.report_data) {
      // Return the report data with additional metadata
      return NextResponse.json({
        jobId,
        companyAlias: data.company_alias,
        dateGenerated: data.created_at,
        ...data.report_data
      });
    }

    // Fallback to local Storage if not found in Supabase
    const filePath = path.join(STORAGE_DIR, `report-${jobId}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(content));
    }

    return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch report', 
      details: error.message 
    }, { status: 500 });
  }
}