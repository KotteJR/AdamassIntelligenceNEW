import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL_STRING = process.env.N8N_WEBHOOK_URL;

export async function POST(req: Request) {
  let n8nUrl;
  try {
    if (!N8N_WEBHOOK_URL_STRING) {
      console.error('[API /initiate-analysis] N8N_WEBHOOK_URL is not set in environment variables.');
      return NextResponse.json({ error: 'Internal server configuration error: Webhook URL not configured.', status: 500 });
    }
    n8nUrl = new URL(N8N_WEBHOOK_URL_STRING);
  } catch (e: any) {
    console.error('[API /initiate-analysis] Invalid N8N Webhook URL:', e.message);
    return NextResponse.json({ error: 'Internal server configuration error: Invalid n8n webhook URL.', details: e.message }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { companyAlias, legalAlias, websiteUrl, countryOfIncorporation, jobId } = body;

    if (!companyAlias || !websiteUrl || !jobId) {
      return NextResponse.json({ error: 'Missing required fields: companyAlias, websiteUrl, and jobId are required.' }, { status: 400 });
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for n8n

    // Match the exact structure expected by the n8n workflow (nested under "body")
    const payload = {
      body: {
        job_id: jobId,
        url: websiteUrl,
        company_name: companyAlias,
        legal_name: legalAlias || companyAlias,
        country: countryOfIncorporation || 'Unknown'
      }
    };

    console.log(`[API /initiate-analysis] Triggering n8n workflow for job_id: ${jobId} at URL: ${n8nUrl.toString()}`);
    console.log(`[API /initiate-analysis] Payload:`, JSON.stringify(payload, null, 2));
    
    const n8nResponse = await fetch(n8nUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId); 

    const responseText = await n8nResponse.text();
    console.log(`[API /initiate-analysis] n8n response status: ${n8nResponse.status}, body: ${responseText}`);

    if (n8nResponse.status === 504 || controller.signal.aborted) {
      return NextResponse.json({ 
        error: 'Request to n8n workflow timed out', 
        details: 'The n8n webhook took too long to respond or the request was aborted.',
        status: 504 
      }, { status: 504 });
    }

    if (!n8nResponse.ok) {
      console.error(`[API /initiate-analysis] n8n workflow failed. Status: ${n8nResponse.status}, Response: ${responseText}`);
      
      // Add more specific error handling for common n8n issues
      let errorMessage = 'Failed to trigger n8n workflow';
      let troubleshooting = '';
      
      if (responseText.includes('There was a problem executing the workflow')) {
        errorMessage = 'n8n workflow execution failed';
        troubleshooting = 'This usually indicates: 1) Workflow is not properly configured, 2) Required nodes are missing, 3) Webhook node has errors, 4) Database connection issues, or 5) Workflow is not activated';
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: responseText,
        troubleshooting,
        status: n8nResponse.status 
      }, { status: n8nResponse.status });
    }

    let n8nJson;
    try {
      n8nJson = JSON.parse(responseText);
    } catch (err) {
      console.warn('[API /initiate-analysis] n8n response was not JSON, but proceeding as successful trigger:', responseText);
      // n8n often returns a simple success message like "Workflow executed successfully"
      // which isn't JSON but indicates success.
      n8nJson = { message: responseText }; 
    }

    return NextResponse.json({ success: true, message: 'n8n workflow triggered successfully', n8nResponse: n8nJson, jobId });

  } catch (err: any) {
    console.error('[API /initiate-analysis] Error:', err);
    if (err.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Request timeout', 
        details: 'The request to n8n workflow took too long to complete.',
        status: 504 
      }, { status: 504 });
    }
    // Catch the specific error if it occurs before fetch even tries
    if (err instanceof TypeError && err.message.includes("pattern")) {
        return NextResponse.json({ 
            error: 'Failed to initiate analysis due to a URL pattern mismatch.', 
            details: `The n8n webhook URL (${N8N_WEBHOOK_URL_STRING || 'NOT SET'}) might be malformed or there is an issue with the fetch API environment. Error: ${err.message}`,
            status: 500 
        }, { status: 500 });
    }
    return NextResponse.json({ 
      error: 'Failed to initiate analysis', 
      details: err.message,
      status: 500 
    }, { status: 500 });
  }
} 