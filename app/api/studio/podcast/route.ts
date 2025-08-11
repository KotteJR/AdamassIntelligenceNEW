import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY as string;
const HOST_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const GUEST_VOICE_ID = process.env.ELEVENLABS_GUEST_VOICE_ID || 'VR6AewLTigWG4xSOukaG';

export async function POST(request: NextRequest) {
  try {
    const { reportData } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    console.log('[Podcast] Starting podcast generation with ElevenLabs Studio...');

    // Step 1: Prepare comprehensive source content for ElevenLabs Studio
    const sourceContent = `Business Analysis Report: ${reportData.companyAlias || 'Company Analysis'}

EXECUTIVE SUMMARY:
${reportData.adamassSynthesisReport?.executive_summary || 'Comprehensive business analysis covering architecture, security, and strategic positioning for informed decision-making.'}

ANALYSIS OVERVIEW:
Architecture Score: ${reportData.architecture?.overall_score || 'N/A'}/10
Security Score: ${reportData.security?.overall_score || 'N/A'}/10
Adamass Confidence Score: ${reportData.adamassSynthesisReport?.overall_assessment?.confidence_score || 'N/A'}/10

OVERALL VERDICT: 
${reportData.adamassSynthesisReport?.overall_assessment?.verdict || 'Strategic analysis reveals key opportunities and challenges for sustainable business growth.'}

KEY STRENGTHS AND ADVANTAGES:
${reportData.architecture?.main_good?.join('\n- ') || 'Strong technical foundation, market positioning, and competitive advantages in the industry.'}

CRITICAL RISKS AND AREAS FOR IMPROVEMENT:
${reportData.architecture?.main_risks?.join('\n- ') || 'Technical debt, security vulnerabilities, and operational inefficiencies require immediate attention.'}

STRATEGIC RECOMMENDATIONS:
${reportData.adamassSynthesisReport?.strategic_recommendations?.slice(0, 3)?.map((rec: any) => `${rec.action_title}: ${rec.description}`)?.join('\n\n') || 'Infrastructure modernization, security improvements, and strategic market positioning initiatives recommended.'}

COMPANY BACKGROUND:
${reportData.companyIntelligence?.company_overview?.overview || 'A technology company operating in a competitive market with significant potential for growth and expansion.'}

MARKET IMPLICATIONS:
The analysis reveals important insights about the company's technical capabilities, security posture, and strategic positioning. These findings have direct implications for investment decisions, operational planning, and long-term growth strategies.`;

    console.log('[Podcast] Sending content to ElevenLabs Studio for podcast generation...');

    // Step 2: Create podcast using ElevenLabs Studio API
    let podcastResponse;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`[Podcast] Studio API attempt ${attempt}/${maxAttempts}...`);
      
      try {
        podcastResponse = await fetch('https://api.elevenlabs.io/v1/studio/podcasts', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            model_id: 'eleven_multilingual_v2',
            mode: {
              type: 'conversation',
              conversation: {
                host_voice_id: HOST_VOICE_ID,
                guest_voice_id: GUEST_VOICE_ID
              }
            },
            source: {
              type: 'text',
              text: sourceContent
            }
          }),
        });

        if (podcastResponse.ok) {
          break; // Success
        }

        const errorText = await podcastResponse.text();
        console.error(`[Podcast] Studio API error (attempt ${attempt}):`, errorText);
        
        if (podcastResponse.status === 429) {
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          console.log(`[Podcast] Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else if (podcastResponse.status === 401) {
          throw new Error('Invalid ElevenLabs API key');
        } else if (podcastResponse.status >= 500) {
          console.log(`[Podcast] Server error ${podcastResponse.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        } else {
          throw new Error(`ElevenLabs Studio API error: ${podcastResponse.status} - ${errorText}`);
        }
        
      } catch (fetchError) {
        console.error(`[Podcast] Network error (attempt ${attempt}):`, fetchError);
        if (attempt === maxAttempts) {
          throw new Error('Network error connecting to ElevenLabs Studio API');
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (!podcastResponse || !podcastResponse.ok) {
      throw new Error('Failed to create podcast after multiple attempts. ElevenLabs Studio may be experiencing high traffic.');
    }

    const podcastData = await podcastResponse.json();
    console.log('[Podcast] Studio project created:', podcastData.project.project_id);
    
    const projectId = podcastData.project.project_id;

    // Step 3: Poll for completion
    console.log('[Podcast] Polling for podcast completion...');
    let isCompleted = false;
    let pollAttempts = 0;
    const maxPollAttempts = 60; // 5 minutes max wait time
    let downloadUrl = null;

    while (!isCompleted && pollAttempts < maxPollAttempts) {
      pollAttempts++;
      console.log(`[Podcast] Poll attempt ${pollAttempts}/${maxPollAttempts}...`);
      
      try {
        const statusResponse = await fetch(`https://api.elevenlabs.io/v1/studio/projects/${projectId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('[Podcast] Project status:', statusData.state);
          
          if (statusData.state === 'completed') {
            isCompleted = true;
            
            // Get download URL
            const downloadResponse = await fetch(`https://api.elevenlabs.io/v1/studio/projects/${projectId}/download`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
              },
            });
            
            if (downloadResponse.ok) {
              const downloadData = await downloadResponse.json();
              downloadUrl = downloadData.download_url;
              console.log('[Podcast] Download URL obtained');
            } else {
              console.error('[Podcast] Failed to get download URL');
            }
            
          } else if (statusData.state === 'failed') {
            throw new Error('Podcast generation failed');
          }
        } else {
          console.error('[Podcast] Failed to check project status');
        }
      } catch (pollError) {
        console.error('[Podcast] Error polling status:', pollError);
      }
      
      if (!isCompleted) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
      }
    }

    if (!isCompleted) {
      throw new Error('Podcast generation timed out. The process is taking longer than expected.');
    }

    if (!downloadUrl) {
      throw new Error('Failed to obtain download URL for completed podcast.');
    }

    console.log('[Podcast] Successfully generated podcast');

    return NextResponse.json({
      success: true,
      script: 'Generated by ElevenLabs Studio from source content',
      audio: {
        data: downloadUrl,
        mimeType: 'audio/mpeg',
        filename: `${reportData.companyAlias || 'company'}_podcast_discussion.mp3`
      },
      projectId: projectId,
      type: 'continuous_podcast'
    });

  } catch (error) {
    console.error('[Podcast] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate podcast',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}