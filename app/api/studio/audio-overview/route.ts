import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize OpenAI (Vercel-ready)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('[Audio Overview] OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ElevenLabs configuration from env
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY as string;
const PROFESSIONAL_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

export async function POST(request: NextRequest) {
  try {
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

    console.log('[Audio Overview] Script generated, sending to ElevenLabs...');

    // Step 2: Convert script to audio using ElevenLabs with retry logic
    let ttsResponse;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`[Audio Overview] Attempt ${attempt}/${maxAttempts}...`);
      
      try {
        ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${PROFESSIONAL_VOICE_ID}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: script,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.2,
              use_speaker_boost: true
            }
          }),
        });

        if (ttsResponse.ok) {
          break; // Success, exit retry loop
        }

        // Handle specific error codes
        const errorText = await ttsResponse.text();
        console.error(`[Audio Overview] ElevenLabs error (attempt ${attempt}):`, errorText);
        
        if (ttsResponse.status === 429) {
          // Rate limit - wait before retry
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`[Audio Overview] Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else if (ttsResponse.status === 401) {
          // Invalid API key - don't retry
          throw new Error('Invalid ElevenLabs API key');
        } else if (ttsResponse.status >= 500) {
          // Server error - retry
          console.log(`[Audio Overview] Server error ${ttsResponse.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          // Other errors - don't retry
          throw new Error(`ElevenLabs API error: ${ttsResponse.status} - ${errorText}`);
        }
        
      } catch (fetchError) {
        console.error(`[Audio Overview] Network error (attempt ${attempt}):`, fetchError);
        if (attempt === maxAttempts) {
          throw new Error('Network error connecting to ElevenLabs');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!ttsResponse || !ttsResponse.ok) {
      throw new Error('Failed to generate audio after multiple attempts. ElevenLabs may be experiencing high traffic.');
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