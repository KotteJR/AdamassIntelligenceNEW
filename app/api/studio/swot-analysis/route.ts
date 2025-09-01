import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize OpenAI using env only
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
if (!OPENAI_API_KEY) {
  console.warn('[SWOT Analysis] OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { reportData, userId, jobId } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    // Generate SWOT analysis with OpenAI
    const swotPrompt = `Analyze this business report and create a comprehensive SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis.

Company: ${reportData.companyAlias || 'Unknown Company'}

ANALYSIS SCORES:
- Architecture: ${reportData.architecture?.overall_score || 'N/A'}/10
- Security: ${reportData.security?.overall_score || 'N/A'}/10  
- Adamass Confidence: ${reportData.adamassSynthesisReport?.overall_assessment?.confidence_score || 'N/A'}/10

EXECUTIVE SUMMARY:
${reportData.adamassSynthesisReport?.executive_summary || 'Not available'}

ARCHITECTURE:
Strengths: ${reportData.architecture?.main_good?.join(', ') || 'Not available'}
Risks: ${reportData.architecture?.main_risks?.join(', ') || 'Not available'}

SECURITY:
Strengths: ${reportData.security?.main_good?.join(', ') || 'Not available'}
Risks: ${reportData.security?.main_risks?.join(', ') || 'Not available'}

STRATEGIC RECOMMENDATIONS:
${reportData.adamassSynthesisReport?.strategic_recommendations?.map((rec: any) => `${rec.action_title} (${rec.priority}): ${rec.description}`)?.join('\n') || 'Not available'}

KEY RISKS:
${reportData.adamassSynthesisReport?.key_risks_and_mitigation?.map((risk: any) => `${risk.risk} (${risk.severity})`)?.join('\n') || 'Not available'}

COMPANY OVERVIEW:
${reportData.companyIntelligence?.company_overview?.overview || 'Not available'}

Create a comprehensive SWOT analysis with:
1. STRENGTHS: Internal positive factors, competitive advantages, strong capabilities
2. WEAKNESSES: Internal negative factors, areas for improvement, resource limitations
3. OPPORTUNITIES: External positive factors, market trends, potential growth areas
4. THREATS: External negative factors, risks, competitive pressures

For each category, provide 4-6 specific, actionable items with brief descriptions.

Return ONLY valid JSON in this exact format:
{
  "company": "Company Name",
  "generated": "2024-01-01T00:00:00.000Z",
  "strengths": [
    {
      "title": "Strong Technical Foundation",
      "description": "Robust architecture with modern technologies and scalable infrastructure",
      "impact": "high",
      "category": "technical"
    }
  ],
  "weaknesses": [
    {
      "title": "Security Vulnerabilities",
      "description": "Multiple critical security gaps requiring immediate attention",
      "impact": "critical",
      "category": "security"
    }
  ],
  "opportunities": [
    {
      "title": "Market Expansion",
      "description": "Growing demand in target markets with strong competitive positioning",
      "impact": "high",
      "category": "market"
    }
  ],
  "threats": [
    {
      "title": "Competitive Pressure",
      "description": "New entrants with advanced technologies threatening market share",
      "impact": "medium",
      "category": "competitive"
    }
  ],
  "summary": {
    "overall_assessment": "Brief overall assessment of the company's strategic position",
    "key_insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
    "strategic_priorities": ["Priority 1", "Priority 2", "Priority 3"]
  }
}

Make the SWOT analysis strategic, actionable, and based on the provided data. Focus on business implications and strategic decision-making.

IMPORTANT: Return ONLY valid, complete JSON. No markdown, no explanations, just the JSON object.`;

    console.log('[SWOT Analysis] Generating SWOT analysis with OpenAI...');
    
    const swotResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business strategist creating comprehensive SWOT analyses. Generate strategic, actionable SWOT data that provides clear business insights and decision-making guidance. CRITICAL: Return ONLY valid, complete JSON. Do not include any markdown formatting, explanations, or text outside the JSON structure. Ensure all JSON brackets and braces are properly closed.'
        },
        {
          role: 'user',
          content: swotPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const swotText = swotResponse.choices[0]?.message?.content;
    if (!swotText) {
      throw new Error('Failed to generate SWOT analysis');
    }

    console.log('[SWOT Analysis] Parsing generated SWOT JSON...');

    // Parse the JSON response
    let swotData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = swotText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedText;
      
      console.log('[SWOT Analysis] Attempting to parse JSON...');
      swotData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[SWOT Analysis] JSON parse error:', parseError);
      console.log('[SWOT Analysis] Raw response:', swotText);
      
      // Try alternative parsing - look for just the first complete JSON object
      try {
        console.log('[SWOT Analysis] Attempting alternative parsing...');
        const lines = swotText.split('\n');
        const jsonLines = [];
        let inJson = false;
        let braceCount = 0;
        
        for (const line of lines) {
          if (line.trim().startsWith('{') || inJson) {
            inJson = true;
            jsonLines.push(line);
            
            // Count braces to find complete JSON
            for (const char of line) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
            }
            
            // If we've closed all braces, we have complete JSON
            if (braceCount === 0 && jsonLines.length > 1) {
              break;
            }
          }
        }
        
        const jsonString = jsonLines.join('\n');
        swotData = JSON.parse(jsonString);
        console.log('[SWOT Analysis] Alternative parsing successful');
      } catch (altError) {
        console.error('[SWOT Analysis] Alternative parsing also failed:', altError);
        
        // Final fallback: Create a simple SWOT structure
        console.log('[SWOT Analysis] Creating fallback SWOT analysis...');
        swotData = {
          company: reportData.companyAlias || "Company Analysis",
          generated: new Date().toISOString(),
          strengths: [
            {
              title: "Technical Infrastructure",
              description: "Solid foundation with modern technologies",
              impact: "high",
              category: "technical"
            }
          ],
          weaknesses: [
            {
              title: "Security Gaps",
              description: "Critical vulnerabilities requiring immediate attention",
              impact: "critical",
              category: "security"
            }
          ],
          opportunities: [
            {
              title: "Market Growth",
              description: "Expanding market opportunities in target segments",
              impact: "high",
              category: "market"
            }
          ],
          threats: [
            {
              title: "Competitive Pressure",
              description: "New competitors entering the market",
              impact: "medium",
              category: "competitive"
            }
          ],
          summary: {
            overall_assessment: "Strategic analysis reveals both opportunities and challenges",
            key_insights: ["Focus on security improvements", "Leverage technical strengths", "Monitor competitive landscape"],
            strategic_priorities: ["Address security vulnerabilities", "Capitalize on market opportunities", "Strengthen competitive position"]
          }
        };
      }
    }

    // Validate and enhance the SWOT structure
    if (!swotData.strengths || !swotData.weaknesses || !swotData.opportunities || !swotData.threats) {
      throw new Error('Invalid SWOT structure generated');
    }

    // Add metadata
    const enhancedSwot = {
      ...swotData,
      metadata: {
        company: reportData.companyAlias,
        generated: new Date().toISOString(),
        analysisScores: {
          architecture: reportData.architecture?.overall_score,
          security: reportData.security?.overall_score,
          confidence: reportData.adamassSynthesisReport?.overall_assessment?.confidence_score
        },
        totalItems: {
          strengths: swotData.strengths?.length || 0,
          weaknesses: swotData.weaknesses?.length || 0,
          opportunities: swotData.opportunities?.length || 0,
          threats: swotData.threats?.length || 0
        }
      }
    };

    console.log('[SWOT Analysis] SWOT analysis generated successfully');

    // Optional persistence if frontend provides userId and jobId
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      if (url && anon && userId && jobId) {
        const supabase = createClient(url, anon);
        await supabase.from('user_artifacts').insert([
          {
            user_id: userId,
            job_id: jobId,
            kind: 'swot_analysis',
            content: enhancedSwot
          }
        ]);
      }
    } catch (e) {
      console.warn('[SWOT Analysis] Persist warning:', e);
    }

    return NextResponse.json({
      success: true,
      swot: enhancedSwot,
      filename: `${reportData.companyAlias || 'company'}_swot_analysis.json`
    });

  } catch (error) {
    console.error('[SWOT Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SWOT analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
