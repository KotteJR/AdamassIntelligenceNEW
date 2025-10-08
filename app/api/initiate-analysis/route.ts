import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL_STRING = process.env.N8N_WEBHOOK_URL?.trim();

// Custom fetch function to handle SSL issues
async function fetchWithSSLHandling(url: string, options: RequestInit) {
  try {
    // Check if we should ignore SSL certificate errors
    const ignoreSSL = process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' || 
                      process.env.NODE_ENV === 'development';
    
    if (ignoreSSL) {
      console.log('[SSL] SSL certificate validation disabled');
      
      // For Node.js environments, we need to configure the agent
      // This works in Vercel's Node.js runtime
      const https = await import('https');
      const agent = new https.Agent({
        rejectUnauthorized: false
      });
      
      // Add the agent to the options
      const fetchOptions = {
        ...options,
        // @ts-ignore - Vercel's fetch implementation supports agent
        agent: url.startsWith('https:') ? agent : undefined
      };
      
      return await fetch(url, fetchOptions);
    }
    
    // Try normal fetch first
    return await fetch(url, options);
  } catch (error: any) {
    console.error('[SSL] Fetch error:', error);
    
    // If SSL error, provide helpful debugging
    if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || 
        error.message?.includes('self-signed certificate') ||
        error.message?.includes('certificate')) {
      
      console.log('[SSL] SSL Certificate error detected');
      
      // Provide specific SSL troubleshooting
      const troubleshooting = [
        'SSL Certificate Error Solutions:',
        '1. Set NODE_TLS_REJECT_UNAUTHORIZED=0 in Vercel environment variables',
        '2. Update n8n.profit-ai.com to use a valid SSL certificate',
        '3. Use HTTP instead of HTTPS for the webhook URL (if acceptable)',
        `4. Current URL: ${url}`,
        `5. Environment: ${process.env.NODE_ENV || 'unknown'}`,
        `6. TLS Reject Unauthorized: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'not set'}`
      ].join('\n');
      
      throw new Error(`SSL_CERT_ERROR: ${error.message}\n\n${troubleshooting}`);
    }
    
    // Re-throw other errors
    throw error;
  }
}

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
    const { 
      companyAlias, 
      legalAlias, 
      websiteUrl, 
      countryOfIncorporation, 
      jobId,
      preferredHostUrl,
      openApiUrl,
      repositoryUrls,
      isPublicCompany,
      tickerSymbol
    } = body;

    // Debug the extracted values
    console.log(`[API /initiate-analysis] Raw request body:`, body);
    console.log(`[API /initiate-analysis] Extracted values:`);
    console.log(`[API /initiate-analysis] - jobId: "${jobId}" (type: ${typeof jobId})`);
    console.log(`[API /initiate-analysis] - websiteUrl: "${websiteUrl}" (type: ${typeof websiteUrl})`);
    console.log(`[API /initiate-analysis] - companyAlias: "${companyAlias}" (type: ${typeof companyAlias})`);
    console.log(`[API /initiate-analysis] - legalAlias: "${legalAlias}" (type: ${typeof legalAlias})`);
    console.log(`[API /initiate-analysis] - countryOfIncorporation: "${countryOfIncorporation}" (type: ${typeof countryOfIncorporation})`);
    console.log(`[API /initiate-analysis] - preferredHostUrl: "${preferredHostUrl}" (type: ${typeof preferredHostUrl})`);
    console.log(`[API /initiate-analysis] - openApiUrl: "${openApiUrl}" (type: ${typeof openApiUrl})`);
    console.log(`[API /initiate-analysis] - repositoryUrls:`, Array.isArray(repositoryUrls) ? repositoryUrls : repositoryUrls ? [repositoryUrls] : []);
    console.log(`[API /initiate-analysis] - isPublicCompany: ${isPublicCompany}`);
    console.log(`[API /initiate-analysis] - tickerSymbol: "${tickerSymbol}"`);

    if (!companyAlias || !websiteUrl || !jobId) {
      return NextResponse.json({ error: 'Missing required fields: companyAlias, websiteUrl, and jobId are required.' }, { status: 400 });
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for n8n

    // n8n is putting our data in body automatically, so let's send it flat
    // but the expressions need to reference it correctly
    const payload: Record<string, any> = {
      job_id: jobId,
      url: websiteUrl,
      company_name: companyAlias,
      legal_name: legalAlias || companyAlias,
      country: countryOfIncorporation || 'Unknown'
    };

    // Include optional fields when provided
    if (preferredHostUrl) payload.preferred_host_url = preferredHostUrl;
    if (openApiUrl) payload.openapi_url = openApiUrl;
    if (typeof isPublicCompany === 'boolean') payload.is_public_company = isPublicCompany;
    if (tickerSymbol) payload.ticker_symbol = tickerSymbol;
    if (repositoryUrls) {
      const repos = Array.isArray(repositoryUrls) ? repositoryUrls : [repositoryUrls];
      const cleaned = repos.map((r) => (typeof r === 'string' ? r.trim() : '')).filter(Boolean);
      if (cleaned.length > 0) payload.repository_urls = cleaned;
    }

    console.log(`[API /initiate-analysis] Triggering n8n workflow for job_id: ${jobId} at URL: ${n8nUrl.toString()}`);
    console.log(`[API /initiate-analysis] Payload:`, JSON.stringify(payload, null, 2));
    
    let n8nResponse;
    try {
      console.log(`[API /initiate-analysis] Sending request to n8n...`);
      n8nResponse = await fetchWithSSLHandling(n8nUrl.toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      console.error('[API /initiate-analysis] Fetch error:', fetchError);
      
      // Handle SSL certificate errors
      if (fetchError.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || 
          fetchError.message?.includes('self-signed certificate') ||
          fetchError.message?.includes('certificate') ||
          fetchError.message?.includes('SSL_CERT_ERROR')) {
        
        console.log('[API /initiate-analysis] SSL certificate issue detected...');
        console.log('[API /initiate-analysis] n8n URL:', n8nUrl.toString());
        console.log('[API /initiate-analysis] Node.js version:', process.version);
        console.log('[API /initiate-analysis] Environment:', process.env.NODE_ENV);
        
        return NextResponse.json({ 
          error: 'SSL Certificate Error', 
          details: `The n8n webhook URL (${n8nUrl.toString()}) has an SSL certificate issue.`,
          troubleshooting: [
            '1. The n8n server at n8n.profit-ai.com has an invalid/self-signed SSL certificate',
            '2. Node.js v24.3.0 has stricter SSL validation than previous versions',
            '3. Fix options:',
            '   a) Install valid SSL certificate on n8n server',
            '   b) Use HTTP instead of HTTPS for development (if server supports it)',
            '   c) Add NODE_TLS_REJECT_UNAUTHORIZED=0 to .env.local (DEVELOPMENT ONLY)',
            '4. Check if webhook URL is complete (remove trailing % characters)'
          ],
          diagnostics: {
            nodeVersion: process.version,
            environment: process.env.NODE_ENV,
            webhookUrl: n8nUrl.toString(),
            urlHasTrailingPercent: N8N_WEBHOOK_URL_STRING?.endsWith('%')
          },
          originalError: fetchError.message,
          status: 500 
        }, { status: 500 });
      }
      
      // Re-throw other fetch errors
      throw fetchError;
    }

    clearTimeout(timeoutId); 

    const responseText = await n8nResponse.text();
    console.log(`[API /initiate-analysis] n8n response status: ${n8nResponse.status}`);
    console.log(`[API /initiate-analysis] n8n response body: ${responseText}`);
    
    // Debug the exact payload vs response
    console.log(`[API /initiate-analysis] DEBUGGING - Payload sent:`, JSON.stringify(payload, null, 2));
    console.log(`[API /initiate-analysis] DEBUGGING - Response received: ${responseText}`);

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
      } else if (n8nResponse.status === 500) {
        errorMessage = 'n8n server error';
        troubleshooting = 'The n8n server encountered an internal error. Please check the n8n server logs and configuration.';
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
    
    // Handle SSL certificate errors that might not be caught in the fetch block
    if (err.message && (err.message.includes('self-signed certificate') || 
                       err.message.includes('certificate') ||
                       err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT')) {
      return NextResponse.json({ 
        error: 'SSL Certificate Error', 
        details: 'The n8n webhook URL has an SSL certificate issue.',
        troubleshooting: '1. Check if n8n webhook URL uses valid HTTPS certificate 2. For local development, consider using HTTP 3. Ensure n8n server has proper SSL configuration',
        originalError: err.message,
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