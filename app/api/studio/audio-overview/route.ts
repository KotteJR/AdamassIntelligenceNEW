import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { supabase } from '../../../../lib/supabaseClient';
import { gateFeature } from '../../../../lib/subscriptionCheck';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize OpenAI (Vercel-ready)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('[Audio Overview] OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// OpenAI TTS config
const OPENAI_TTS_MODEL = 'gpt-4o-mini-tts';
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';

export async function POST(request: NextRequest) {
  try {
    // Auth & feature gate
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData?.user;
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const gate = await gateFeature(user.id, 'audio');
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason || 'Not allowed', redirect: gate.redirect, tier: gate.tier }, { status: 402 });
    }

    const { reportData, userId, jobId } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    // Step 1: Generate audio overview script with OpenAI
    const scriptPrompt = `Create a professional 2-3 minute audio overview script for this business analysis report. Make it engaging for audio consumption with clear sections and natural pauses.

Company: ${reportData.companyAlias || 'Unknown Company'}

Key Data:
- Architecture Score: ${reportData.architecture?.overall_score || 'N/A'}/10
- Security Score: ${reportData.security?.overall_score || 'N/A'}/10
- Adamass Confidence: ${reportData.adamassSynthesisReport?.overall_assessment?.confidence_score || 'N/A'}/10

Executive Summary: ${reportData.adamassSynthesisReport?.executive_summary || 'Not available'}

Top Strengths:
${reportData.architecture?.main_good?.slice(0, 3)?.join('\n- ') || 'Not available'}

Key Risks:
${reportData.architecture?.main_risks?.slice(0, 3)?.join('\n- ') || 'Not available'}

Strategic Recommendations:
${reportData.adamassSynthesisReport?.strategic_recommendations?.slice(0, 2)?.map((rec: any) => `${rec.action_title}: ${rec.description}`)?.join('\n- ') || 'Not available'}

Guidelines:
- Start with a clear introduction mentioning the company name
- Structure: Intro → Key Scores → Main Findings → Strategic Outlook → Conclusion
- Use conversational but professional language
- Include natural pauses with periods and commas
- Keep total length around 400-500 words for 2-3 minute audio
- Make it sound like a business analyst presenting to executives
- End with a clear summary statement

Format as a single, flowing script without headers or bullet points.`;

    console.log('[Audio Overview] Generating script with OpenAI...');
    
    const scriptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional business analyst creating audio overview scripts. Write in a clear, engaging style suitable for executive briefings.'
        },
        {
          role: 'user',
          content: scriptPrompt
        }
      ],
      max_tokens: 800,
      temperature: 0.6,
    });

    const script = scriptResponse.choices[0]?.message?.content;
    if (!script) {
      throw new Error('Failed to generate script');
    }

    console.log('[Audio Overview] Script generated, sending to OpenAI TTS...');

    // Step 2: Convert script to audio using OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_TTS_MODEL,
        voice: OPENAI_TTS_VOICE,
        input: script,
        format: 'mp3'
      })
    });
    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      throw new Error(`OpenAI TTS error: ${ttsResponse.status} - ${errorText}`);
    }

    console.log('[Audio Overview] Audio generated successfully');

    // Step 3: Return audio data
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    // Persist artifact (metadata only) if user provided
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      if (userId && jobId && url && anon) {
        const supabase = createClient(url, anon);
        await supabase.from('user_artifacts').insert([
          {
            user_id: userId,
            job_id: jobId,
            kind: 'audio_overview',
            meta: { script }
          }
        ]);
      }
    } catch (e) {
      console.warn('[Audio Overview] Persist warning:', e);
    }

    return NextResponse.json({
      success: true,
      script: script,
      audio: {
        data: base64Audio,
        mimeType: 'audio/mpeg',
        filename: `${reportData.companyAlias || 'company'}_audio_overview.mp3`
      }
    });

  } catch (error) {
    console.error('[Audio Overview] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio overview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}