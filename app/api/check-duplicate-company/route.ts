import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string | undefined;

export async function POST(req: Request) {
  try {
    const { companyAlias, legalAlias } = await req.json();
    const queryName = (companyAlias || '').trim();
    const queryLegal = (legalAlias || '').trim();

    if (!queryName && !queryLegal) {
      return NextResponse.json({ error: 'Missing companyAlias or legalAlias' }, { status: 400 });
    }

    // Helper to normalize names (reduce punctuation and suffix noise)
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|co|gmbh|ag|sa|s\.?a\.?|plc)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Fetch recent analyses to compare against (database)
    const { data, error } = await supabase
      .from('user_analyses')
      .select('job_id, company_alias, legal_alias, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: 'Failed to query existing analyses', details: error.message }, { status: 500 });
    }

    const dbItems = (data || []).map((r) => ({
      jobId: r.job_id,
      company: (r.company_alias || '').trim(),
      legal: (r.legal_alias || '').trim(),
      createdAt: r.created_at,
    }));

    // Fetch from Supabase Storage 'reports' as well (featured list)
    const storageItems: typeof dbItems = [];
    try {
      const { data: files, error: listErr } = await supabaseAdmin.storage
        .from('reports')
        .list('', { limit: 200 });
      if (!listErr && files) {
        for (const f of files) {
          if (!f.name.endsWith('.json')) continue;
          try {
            const { data: fileData } = await supabaseAdmin.storage
              .from('reports')
              .download(f.name);
            if (fileData) {
              const text = await fileData.text();
              const json = JSON.parse(text);
              if (json?.jobId && json?.companyAlias) {
                storageItems.push({
                  jobId: json.jobId,
                  company: String(json.companyAlias),
                  legal: String(json.legalAlias || ''),
                  createdAt: json.dateGenerated || null,
                });
              }
            }
          } catch {}
        }
      }
    } catch {}

    const items = [...dbItems, ...storageItems];

    // Exact match check first
    const qNorm = normalize(queryName || queryLegal);
    const exact = items.find(
      (r) =>
        (queryName && r.company.toLowerCase() === queryName.toLowerCase()) ||
        (queryLegal && r.legal.toLowerCase() === queryLegal.toLowerCase()) ||
        (!!qNorm && (normalize(r.company) === qNorm || (r.legal && normalize(r.legal) === qNorm)))
    );
    if (exact) {
      return NextResponse.json({ duplicate: true, method: 'exact', match: exact });
    }

    // OpenAI fuzzy check (optional)
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ duplicate: false, method: 'none', reason: 'OPENAI_API_KEY not set' });
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const listForAi = items.slice(0, 50); // limit cost and context
    const prompt = `You will receive a candidate company name and legal name, and a JSON array of existing analyses with fields company and legal.
Return JSON with { duplicate: boolean, best_match_index: number|null, reason: string }.
Treat names as the same company if they are clear variants/aliases (e.g., 'ABC Inc' vs 'ABC, Inc.', 'Google' vs 'Google LLC', minor punctuation/case differences), or if widely known as the same entity.
Be conservative: if unsure, return duplicate=false.

Candidate: {"company":"${queryName}", "legal":"${queryLegal}"}
Existing: ${JSON.stringify(listForAi.map((r, i) => ({ index: i, company: r.company, legal: r.legal })))}
`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const aiRaw = resp.choices[0]?.message?.content?.trim() || '{}';
    let ai;
    try { ai = JSON.parse(aiRaw); } catch { ai = { duplicate: false }; }

    if (ai.duplicate && typeof ai.best_match_index === 'number' && listForAi[ai.best_match_index]) {
      const match = listForAi[ai.best_match_index];
      return NextResponse.json({ duplicate: true, method: 'openai', match, ai });
    }

    return NextResponse.json({ duplicate: false, method: 'openai', ai });
  } catch (err: any) {
    return NextResponse.json({ error: 'Duplicate check failed', details: err.message }, { status: 500 });
  }
}


