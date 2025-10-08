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
${reportData.adamassSynthesisReport?.executive_summary || 'Comprehensive business analysis covering architecture, security, financial performance, market sentiment, and strategic positioning for informed decision-making.'}

ANALYSIS OVERVIEW:
Architecture Score: ${reportData.architecture?.overall_score || 'N/A'}/10
Security Score: ${reportData.security?.overall_score || 'N/A'}/10
Financial Score: ${reportData.financials?.overall_score || 'N/A'}/10
Adamass Confidence Score: ${reportData.adamassSynthesisReport?.overall_assessment?.confidence_score || 'N/A'}/10

OVERALL VERDICT: 
${reportData.adamassSynthesisReport?.overall_assessment?.verdict || 'Strategic analysis reveals key opportunities and challenges for sustainable business growth.'}

KEY STRENGTHS AND ADVANTAGES:
Architecture: ${reportData.architecture?.main_good?.join('; ') || 'Strong technical foundation'}
Security: ${reportData.security?.main_good?.join('; ') || 'Robust security measures'}
Financial: ${reportData.financials?.main_good?.join('; ') || 'Solid financial position'}

CRITICAL RISKS AND AREAS FOR IMPROVEMENT:
Architecture Risks: ${reportData.architecture?.main_risks?.join('; ') || 'Technical debt requires attention'}
Security Risks: ${reportData.security?.main_risks?.join('; ') || 'Security vulnerabilities identified'}
Financial Risks: ${reportData.financials?.main_risks?.join('; ') || 'Financial challenges present'}

FINANCIAL PERFORMANCE IN DETAIL:
Market Confidence Index: ${reportData.financials?.capital_markets_analysis?.market_confidence_index || 'N/A'}/100 - ${reportData.financials?.capital_markets_analysis?.alignment || 'Neutral'} trend alignment
Stock Performance: ${reportData.financials?.market_performance?.stock_performance_summary || 'Market performance data not available'}
Revenue Growth: ${reportData.financials?.financial_fundamentals?.key_metrics?.revenue_growth_yoy || 'N/A'}% year-over-year
Net Income Growth: ${reportData.financials?.financial_fundamentals?.key_metrics?.net_income_growth_yoy || 'N/A'}%
EBITDA Margin: ${reportData.financials?.financial_fundamentals?.key_metrics?.ebitda_margin || 'N/A'}%
Return on Equity: ${reportData.financials?.financial_fundamentals?.key_metrics?.roe || 'N/A'}%
Debt to Equity Ratio: ${reportData.financials?.financial_fundamentals?.key_metrics?.debt_to_equity || 'N/A'}
Current Ratio: ${reportData.financials?.financial_fundamentals?.key_metrics?.current_ratio || 'N/A'}

Profitability Trend: ${reportData.financials?.financial_fundamentals?.trend_analysis?.profitability?.substring(0, 300) || 'Profitability analysis not available'}

Liquidity Position: ${reportData.financials?.financial_fundamentals?.trend_analysis?.liquidity?.substring(0, 300) || 'Liquidity analysis not available'}

MARKET SENTIMENT AND NEWS ANALYSIS:
Market Sentiment Index: ${reportData.companyIntelligence?.recent_market_news?.market_sentiment_index || 'N/A'}/100 - Overall sentiment is ${reportData.companyIntelligence?.recent_market_news?.summary_sentiment || 'neutral'}
Key Market Themes: ${reportData.companyIntelligence?.recent_market_news?.themes?.join(', ') || 'Market themes not available'}

Risk Signals from Market: ${reportData.companyIntelligence?.recent_market_news?.risk_signals?.join('; ') || 'No specific risk signals identified'}

Opportunity Signals: ${reportData.companyIntelligence?.recent_market_news?.opportunity_signals?.join('; ') || 'Market opportunities to be evaluated'}

Market Impact Analysis: ${reportData.companyIntelligence?.recent_market_news?.analysis?.market_impact || 'Market impact assessment not available'}

Strategic Implications: ${reportData.companyIntelligence?.recent_market_news?.analysis?.strategic_implications?.substring(0, 300) || 'Strategic implications being evaluated'}

STRATEGIC RECOMMENDATIONS:
${reportData.adamassSynthesisReport?.strategic_recommendations?.slice(0, 5)?.map((rec: any) => `${rec.action_title} (Priority: ${rec.priority}): ${rec.description}${rec.expected_outcome ? '. Expected outcome: ' + rec.expected_outcome : ''}`)?.join('\n\n') || 'Infrastructure modernization, security improvements, financial optimization, and strategic market positioning initiatives recommended.'}

KEY RISKS AND MITIGATION STRATEGIES:
${reportData.adamassSynthesisReport?.key_risks_and_mitigation?.slice(0, 5)?.map((risk: any) => `${risk.risk} (${risk.severity} severity): Mitigation - ${risk.mitigation}`)?.join('\n\n') || 'Risk mitigation strategies being developed'}

COMPANY BACKGROUND AND COMPETITIVE POSITION:
${reportData.companyIntelligence?.company_overview?.overview || 'A technology company operating in a competitive market with significant potential for growth and expansion.'}

Industry: ${reportData.companyIntelligence?.company_overview?.industry || 'Technology sector'}
Main Competitors: ${reportData.companyIntelligence?.company_overview?.main_competitors?.join(', ') || 'Competitive landscape being assessed'}

MARKET IMPLICATIONS AND INVESTMENT CONSIDERATIONS:
The comprehensive analysis reveals important insights about the company's technical capabilities, security posture, financial health, market sentiment, and strategic positioning. The financial fundamentals show ${reportData.financials?.financial_fundamentals?.key_metrics?.revenue_growth_yoy > 0 ? 'positive revenue growth' : 'revenue challenges'}, with ${reportData.financials?.capital_markets_analysis?.alignment === 'Aligned' ? 'favorable' : reportData.financials?.capital_markets_analysis?.alignment === 'Divergent' ? 'divergent' : 'neutral'} market trend alignment. Market sentiment is currently ${reportData.companyIntelligence?.recent_market_news?.summary_sentiment || 'neutral'}, which ${reportData.companyIntelligence?.recent_market_news?.summary_sentiment === 'positive' ? 'supports' : reportData.companyIntelligence?.recent_market_news?.summary_sentiment === 'negative' ? 'challenges' : 'maintains'} the investment thesis. These findings have direct implications for investment decisions, operational planning, capital allocation, and long-term growth strategies.`;

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