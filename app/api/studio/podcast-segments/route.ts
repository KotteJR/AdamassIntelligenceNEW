import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Professional conversational voices for podcast
const HOST_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella - professional female host
const GUEST_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George - more natural male voice

async function generateAudioWithRetry(text: string, voiceId: string, maxAttempts = 3) {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`[TTS] Attempt ${attempt}/${maxAttempts} for voice ${voiceId}...`);
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        return base64Audio;
      }

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[TTS] Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else {
        const errorText = await response.text();
        console.error(`[TTS] Error (attempt ${attempt}):`, response.status, errorText);
        if (attempt === maxAttempts) {
          throw new Error(`TTS failed after ${maxAttempts} attempts: ${response.status}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (fetchError) {
      console.error(`[TTS] Network error (attempt ${attempt}):`, fetchError);
      if (attempt === maxAttempts) {
        throw new Error('Network error connecting to ElevenLabs TTS');
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error('TTS generation failed after all attempts');
}

export async function POST(request: NextRequest) {
  try {
    const { reportData, userId, jobId } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    console.log('[Podcast Segments] Generating podcast script with OpenAI...');

    const scriptPrompt = `Create a professional business podcast script about ${reportData.companyAlias || 'this company'} based on the analysis data provided. 

ANALYSIS DATA:
- Company: ${reportData.companyAlias || 'Unknown'}
- Architecture Score: ${reportData.architecture?.overall_score || 'N/A'}/10
- Security Score: ${reportData.security?.overall_score || 'N/A'}/10
- Confidence Score: ${reportData.adamassSynthesisReport?.overall_assessment?.confidence_score || 'N/A'}/10
- Overall Verdict: ${reportData.adamassSynthesisReport?.overall_assessment?.verdict || 'Not available'}

KEY STRENGTHS:
${reportData.architecture?.main_good?.slice(0, 3)?.map((s: string) => `- ${s}`).join('\n') || 'Not available'}

CRITICAL RISKS:
${reportData.architecture?.main_risks?.slice(0, 3)?.map((r: string) => `- ${r}`).join('\n') || 'Not available'}

TOP RECOMMENDATIONS:
${reportData.adamassSynthesisReport?.strategic_recommendations?.slice(0, 2)?.map((rec: any) => `- ${rec.action_title}: ${rec.description}`).join('\n') || 'Not available'}

INSTRUCTIONS:
- Create a conversational podcast between HOST (professional female) and GUEST (expert analyst male)
- Target 3 minutes total (about 450-500 words)
- Make it engaging and natural dialogue
- Focus on strategic implications and actionable insights
- Keep segments short and punchy for good pacing

FORMAT your response as JSON with this exact structure:
{
  "segments": [
    {
      "speaker": "HOST",
      "text": "Welcome to Business Analysis Deep Dive..."
    },
    {
      "speaker": "GUEST", 
      "text": "Thanks for having me..."
    }
  ]
}

Make 8-12 segments total, alternating speakers naturally.`;

    const scriptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert podcast script writer. Create engaging, professional business analysis discussions. Return ONLY valid JSON with the exact format requested.'
        },
        {
          role: 'user',
          content: scriptPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const scriptText = scriptResponse.choices[0]?.message?.content;
    if (!scriptText) {
      throw new Error('Failed to generate podcast script');
    }

    console.log('[Podcast Segments] Parsing script JSON...');
    
    let scriptData;
    try {
      // Clean the response and extract JSON
      let cleanedText = scriptText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Try to find and extract valid JSON
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      let jsonString = jsonMatch ? jsonMatch[0] : cleanedText;
      
      // Additional cleaning - remove any trailing text after the closing brace
      const lastBraceIndex = jsonString.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        jsonString = jsonString.substring(0, lastBraceIndex + 1);
      }
      
      console.log('[Podcast Segments] Attempting to parse JSON:', jsonString.substring(0, 200) + '...');
      scriptData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Podcast Segments] JSON parse error:', parseError);
      console.error('[Podcast Segments] Raw response:', scriptText);
      
      // Fallback: Create a simple script structure
      console.log('[Podcast Segments] Creating fallback script...');
      scriptData = {
        segments: [
          {
            speaker: "HOST",
            text: "Welcome to our business analysis podcast. Today we're examining the company's strategic position and key findings from our comprehensive analysis."
          },
          {
            speaker: "GUEST", 
            text: "Thank you for having me. The analysis reveals several important insights about the company's current state and future opportunities."
          },
          {
            speaker: "HOST",
            text: "Let's dive into the key findings. What stands out most from your analysis?"
          },
          {
            speaker: "GUEST",
            text: "The most significant finding is the company's strong technical foundation, but there are also some critical areas that need immediate attention for sustainable growth."
          }
        ]
      };
    }

    if (!scriptData.segments || !Array.isArray(scriptData.segments)) {
      throw new Error('Invalid script format - missing segments array');
    }

    console.log(`[Podcast Segments] Generated ${scriptData.segments.length} segments. Starting audio generation...`);

    // Generate audio for each segment
    const audioSegments = [];
    for (let i = 0; i < scriptData.segments.length; i++) {
      const segment = scriptData.segments[i];
      const voiceId = segment.speaker === 'HOST' ? HOST_VOICE_ID : GUEST_VOICE_ID;
      
      console.log(`[Podcast Segments] Generating audio for segment ${i + 1}/${scriptData.segments.length} (${segment.speaker})...`);
      
      try {
        const audioBase64 = await generateAudioWithRetry(segment.text, voiceId);
        audioSegments.push({
          speaker: segment.speaker,
          text: segment.text,
          audio: audioBase64,
          order: i
        });
      } catch (audioError) {
        console.error(`[Podcast Segments] Failed to generate audio for segment ${i + 1}:`, audioError);
        // Continue with other segments even if one fails
        audioSegments.push({
          speaker: segment.speaker,
          text: segment.text,
          audio: null,
          order: i,
          error: 'Audio generation failed'
        });
      }
    }

    console.log(`[Podcast Segments] Generated ${audioSegments.filter(s => s.audio).length}/${audioSegments.length} audio segments successfully.`);

    // Persist artifact for the user if provided
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      if (userId && jobId && url && anon) {
        const supabase = createClient(url, anon);
        await supabase.from('user_artifacts').insert([
          {
            user_id: userId,
            job_id: jobId,
            kind: 'podcast',
            meta: { script: scriptData.segments },
            // store segments with audio so it can be replayed later
            content: { segments: audioSegments }
          }
        ]);
      }
    } catch (e) {
      console.warn('[Podcast Segments] Persist warning:', e);
    }

    return NextResponse.json({
      success: true,
      script: scriptData.segments,
      segments: audioSegments,
      type: 'segmented_podcast',
      totalSegments: audioSegments.length,
      successfulSegments: audioSegments.filter(s => s.audio).length
    });

  } catch (error: any) {
    console.error('[Podcast Segments] Error generating segmented podcast:', error);
    return NextResponse.json(
      { error: `Failed to generate segmented podcast: ${error.message}` },
      { status: 500 }
    );
  }
}