import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { checkUserCanCreateAnalysis, decrementAnalysisCount } from '../../../lib/subscriptionCheck';

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
  // Authenticate user via bearer token
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.substring(7);
  const { data: authData } = await supabase.auth.getUser(token);
  const user = authData?.user;
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

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

    if (!companyAlias || !websiteUrl || !jobId) {
      return NextResponse.json({ error: 'Missing required fields: companyAlias, websiteUrl, and jobId are required.' }, { status: 400 });
    }

    // Subscription/usage gate
    const gate = await checkUserCanCreateAnalysis(user.id);
    if (!gate.canCreateAnalysis) {
      return NextResponse.json({
        error: 'Limit reached',
        reason: gate.reason,
        tier: gate.tier,
        redirect: '/subscription?limit=1'
      }, { status: 402 });
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for n8n

    const payload: Record<string, any> = {
      job_id: jobId,
      url: websiteUrl,
      company_name: companyAlias,
      legal_name: legalAlias || companyAlias,
      country: countryOfIncorporation || 'Unknown',
      user_id: user.id,
    };

    if (preferredHostUrl) payload.preferred_host_url = preferredHostUrl;
    if (openApiUrl) payload.openapi_url = openApiUrl;
    if (typeof isPublicCompany === 'boolean') payload.is_public_company = isPublicCompany;
    if (tickerSymbol) payload.ticker_symbol = tickerSymbol;
    if (repositoryUrls) {
      const repos = Array.isArray(repositoryUrls) ? repositoryUrls : [repositoryUrls];
      const cleaned = repos.map((r) => (typeof r === 'string' ? r.trim() : '')).filter(Boolean);
      if (cleaned.length > 0) payload.repository_urls = cleaned;
    }

    console.log(`[API /initiate-analysis] Triggering n8n workflow for job_id: ${jobId} by user: ${user.id}`);
    
    let n8nResponse;
    try {
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
      return NextResponse.json({ error: 'Failed to trigger analysis workflow', details: fetchError.message }, { status: 500 });
    }

    clearTimeout(timeoutId); 

    const responseText = await n8nResponse.text();
    if (!n8nResponse.ok) {
      return NextResponse.json({ error: 'Workflow failed', details: responseText }, { status: n8nResponse.status });
    }

    // Decrement usage (unless enterprise unlimited)
    await decrementAnalysisCount(user.id);

    let n8nJson;
    try {
      n8nJson = JSON.parse(responseText);
    } catch {
      n8nJson = { message: responseText };
    }

    return NextResponse.json({ success: true, message: 'n8n workflow triggered successfully', n8nResponse: n8nJson, jobId });

  } catch (err: any) {
    console.error('[API /initiate-analysis] Error:', err);
    return NextResponse.json({ 
      error: 'Failed to initiate analysis', 
      details: err.message,
      status: 500 
    }, { status: 500 });
  }
} 