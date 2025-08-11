import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize OpenAI (Vercel-ready: require env vars)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('[Audio Report] OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ElevenLabs configuration (Vercel-ready)
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY as string;
const PROFESSIONAL_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

export async function POST(request: NextRequest) {
  try {
    const { reportData, userId, jobId } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    // Step 1: Consultant-style sections to allow per-topic playback
    const scriptPrompt = `Create a consultant-style executive audio report for ${reportData.companyAlias || 'the company'}.
Return ONLY JSON in the form {"sections":[{"title":string,"text":string}...]}. 
Tone: senior consultant, analytical, decisive, highlights Why/So-What. 
Aim for 5-8 sections such as: Introduction, Scores & Executive View, Architecture Deep-Dive, Security Deep-Dive, Strategic Recommendations, Key Risks & Mitigation, Closing Outlook.
Use these inputs:
Executive summary: ${reportData.adamassSynthesisReport?.executive_summary || 'NA'}
Scores: Architecture ${reportData.architecture?.overall_score || 'NA'}, Security ${reportData.security?.overall_score || 'NA'}, Confidence ${reportData.adamassSynthesisReport?.overall_assessment?.confidence_score || 'NA'}
Architecture strengths: ${reportData.architecture?.main_good?.join('; ') || 'NA'}
Architecture risks: ${reportData.architecture?.main_risks?.join('; ') || 'NA'}
Security strengths: ${reportData.security?.main_good?.join('; ') || 'NA'}
Security risks: ${reportData.security?.main_risks?.join('; ') || 'NA'}
Recommendations: ${reportData.adamassSynthesisReport?.strategic_recommendations?.map((r:any)=>`${r.action_title}: ${r.description}`).join('; ') || 'NA'}
Key risks: ${reportData.adamassSynthesisReport?.key_risks_and_mitigation?.map((r:any)=>`${r.risk} (${r.severity})`).join('; ') || 'NA'}
Company overview: ${reportData.companyIntelligence?.company_overview?.overview || 'NA'}
`;

    console.log('[Audio Report] Generating sections with OpenAI...');
    const scriptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON. You are a senior consultant producing an executive audio briefing segmented into titled sections.' },
        { role: 'user', content: scriptPrompt },
      ],
      max_tokens: 1400,
      temperature: 0.4,
    });
    const raw = scriptResponse.choices[0]?.message?.content || '';
    let sections: Array<{ title: string; text: string }> = [];
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      const match = cleaned.match(/\{[\s\S]*\}/);
      const json = match ? JSON.parse(match[0]) : JSON.parse(cleaned);
      sections = json.sections || [];
    } catch (e) {
      throw new Error('Failed to parse sections JSON');
    }
    if (!sections.length) throw new Error('No sections produced');

    console.log('[Audio Report] Generating TTS for sections...');
    const segments: any[] = [];
    for (const sec of sections) {
      if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY is not configured');
      }
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${PROFESSIONAL_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: sec.text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.6, similarity_boost: 0.4, style: 0.3, use_speaker_boost: true }
        })
      });
      if (!res.ok) {
        console.error('[Audio Report] Section TTS error:', await res.text());
        continue;
      }
      const buf = await res.arrayBuffer();
      segments.push({ title: sec.title, text: sec.text, audio: Buffer.from(buf).toString('base64') });
    }

    // Persist artifact with sections
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      if (userId && jobId && url && anon) {
        const supabase = createClient(url, anon);
        await supabase.from('user_artifacts').insert([
          { user_id: userId, job_id: jobId, kind: 'audio_report', content: { sections: segments } }
        ]);
      }
    } catch (e) {
      console.warn('[Audio Report] Persist warning:', e);
    }

    return NextResponse.json({
      success: true,
      type: 'audio_report_segments',
      sections: sections.map(s => ({ title: s.title, text: s.text })),
      segments
    });

  } catch (error) {
    console.error('[Audio Report] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}