import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingDoc = {
  filename: string;
  mimeType?: string;
  text: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, documents } = body as { jobId?: string; documents?: IncomingDoc[] };

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }
    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
    }

    // Basic normalization and safety limits
    const MAX_DOCS = 10; // prevent overload
    const MAX_CHARS_PER_DOC = 20000; // ~20k chars cap per doc

    const normalizedDocs = documents
      .slice(0, MAX_DOCS)
      .map((d) => ({
        filename: String(d.filename || 'document.txt').slice(0, 200),
        mimeType: d.mimeType ? String(d.mimeType).slice(0, 100) : undefined,
        text: typeof d.text === 'string' ? d.text.slice(0, MAX_CHARS_PER_DOC) : '',
      }))
      .filter((d) => d.text.trim().length > 0);

    if (normalizedDocs.length === 0) {
      return NextResponse.json({ error: 'All documents were empty or unsupported' }, { status: 400 });
    }

    const { error } = await supabase.from('intel_results').insert([
      {
        job_id: jobId,
        source: 'UserDocuments',
        data: { documents: normalizedDocs },
        status: 'done',
      },
    ]);

    if (error) {
      return NextResponse.json({ error: 'Failed to save user documents', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved: normalizedDocs.length });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to ingest user documents', details: err.message }, { status: 500 });
  }
}


