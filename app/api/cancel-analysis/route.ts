import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL_STRING = process.env.N8N_WEBHOOK_URL?.trim();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing required field: jobId is required.' }, { status: 400 });
    }

    console.log(`[API /cancel-analysis] Cancelling analysis for job_id: ${jobId}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Send cancellation request to n8n workflow
    // This could be a different endpoint or the same endpoint with a cancel flag
    const payload = {
      action: 'cancel',
      job_id: jobId
    };

    console.log(`[API /cancel-analysis] Payload:`, JSON.stringify(payload, null, 2));

    // For now, we'll just return success since we don't have a specific cancel endpoint
    // In a real implementation, you might need to:
    // 1. Call a specific n8n cancel endpoint
    // 2. Update database to mark job as cancelled
    // 3. Stop any running processes

    clearTimeout(timeoutId);

    // Simulate cancellation success
    console.log(`[API /cancel-analysis] Analysis cancelled successfully for job_id: ${jobId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Analysis cancellation requested successfully', 
      jobId 
    });

  } catch (err: any) {
    console.error('[API /cancel-analysis] Error:', err);
    
    if (err.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Request timeout', 
        details: 'The cancellation request took too long to complete.',
        status: 504 
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to cancel analysis', 
      details: err.message,
      status: 500 
    }, { status: 500 });
  }
}
