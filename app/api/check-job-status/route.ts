import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient'; // Adjusted path

// Define the expected sources for a complete report
const EXPECTED_SOURCES = [
  'Crunchbase',
  'BuiltWith',
  'PageSpeed',
  'DnsDumpster',
  'SubDomains',
  'SecureHeaders',
  'UserDocuments'
  // Add other essential raw data sources if any
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  try {
    console.log(`[API /check-job-status] Checking status for job_id: ${jobId}`);
    const { data, error } = await supabase
      .from('intel_results') // Your table name
      .select('source, status') // We only need source and status for completion check
      .eq('job_id', jobId);

    if (error) {
      console.error('[API /check-job-status] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch job status from Supabase', details: error.message }, { status: 500 });
    }

    const sourceStatuses: Record<string, string> = {};
    let allSourcesPresent = true;
    let allSourcesCompleted = true;

    for (const source of EXPECTED_SOURCES) {
      const foundSource = data.find(row => row.source === source);
      if (foundSource) {
        sourceStatuses[source] = foundSource.status || 'unknown'; // Assuming 'done' or similar means complete
        console.log(`[API /check-job-status] Source ${source}: status = "${foundSource.status}"`);
        if (foundSource.status !== 'done' && foundSource.status !== 'completed') { // Adjust based on actual status values
          allSourcesCompleted = false;
        }
      } else {
        sourceStatuses[source] = 'pending';
        allSourcesPresent = false;
        allSourcesCompleted = false;
        console.log(`[API /check-job-status] Source ${source}: not found in database`);
      }
    }
    
    const isComplete = allSourcesPresent && allSourcesCompleted;
    console.log(`[API /check-job-status] Job ID: ${jobId}, Is Complete: ${isComplete}, Statuses:`, sourceStatuses);

    return NextResponse.json({
      jobId,
      isComplete,
      sourceStatuses,
      // You can add more details here if needed, like a count of completed sources
    });

  } catch (err: any) {
    console.error('[API /check-job-status] Error:', err);
    return NextResponse.json({ error: 'Failed to check job status', details: err.message }, { status: 500 });
  }
} 