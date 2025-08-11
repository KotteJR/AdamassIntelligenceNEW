import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize OpenAI using env only
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
if (!OPENAI_API_KEY) {
  console.warn('[Mind Map API] OPENAI_API_KEY is not set');
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

    // Generate mind map data structure with OpenAI
    const mindmapPrompt = `Analyze this business report and create a comprehensive mind map structure showing relationships between key concepts, findings, and recommendations.

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

Create a mind map JSON structure with:
1. Central node: Company name
2. Main branches: Architecture, Security, Strategic Outlook, Key Risks, Recommendations
3. Sub-nodes for specific findings, scores, and details
4. Connection types: strength, weakness, opportunity, threat, neutral
5. Node colors based on sentiment: green (positive), red (negative), yellow (caution), blue (neutral)
6. Include numerical scores where available

Return ONLY valid JSON in this exact format:
{
  "central": {
    "id": "company",
    "label": "Company Name",
    "type": "central",
    "color": "#4F46E5",
    "size": "large"
  },
  "nodes": [
    {
      "id": "architecture",
      "label": "Architecture Analysis",
      "type": "branch",
      "color": "#color_based_on_score",
      "size": "medium",
      "parentId": "company",
      "data": {
        "score": "X/10",
        "summary": "brief description"
      }
    }
  ],
  "connections": [
    {
      "source": "company",
      "target": "architecture",
      "type": "analysis",
      "strength": "number_0_to_1",
      "color": "#color"
    }
  ]
}

Make the mind map comprehensive with 15-25 nodes total, showing clear relationships between analysis areas, findings, and strategic implications.

IMPORTANT: Return ONLY valid, complete JSON. No markdown, no explanations, just the JSON object.`;

    console.log('[Mind Map] Generating mind map structure with OpenAI...');
    
    const mindmapResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating business analysis mind maps. Generate comprehensive, well-structured JSON mind map data that shows clear relationships between business concepts, findings, and strategic implications. CRITICAL: Return ONLY valid, complete JSON. Do not include any markdown formatting, explanations, or text outside the JSON structure. Ensure all JSON brackets and braces are properly closed.'
        },
        {
          role: 'user',
          content: mindmapPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const mindmapText = mindmapResponse.choices[0]?.message?.content;
    if (!mindmapText) {
      throw new Error('Failed to generate mind map structure');
    }

    console.log('[Mind Map] Parsing generated mind map JSON...');

    // Parse the JSON response
    let mindmapData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = mindmapText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedText;
      
      console.log('[Mind Map] Attempting to parse JSON...');
      mindmapData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Mind Map] JSON parse error:', parseError);
      console.log('[Mind Map] Raw response:', mindmapText);
      
      // Try alternative parsing - look for just the first complete JSON object
      try {
        console.log('[Mind Map] Attempting alternative parsing...');
        const lines = mindmapText.split('\n');
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
        mindmapData = JSON.parse(jsonString);
        console.log('[Mind Map] Alternative parsing successful');
      } catch (altError) {
        console.error('[Mind Map] Alternative parsing also failed:', altError);
        
        // Final fallback: Create a simple mind map structure
        console.log('[Mind Map] Creating fallback mind map...');
        mindmapData = {
          central: {
            id: "central",
            label: "Company Analysis",
            color: "#1f2937"
          },
          nodes: [
            {
              id: "strengths",
              label: "Key Strengths",
              type: "branch",
              color: "#10b981",
              size: "large",
              parentId: "central"
            },
            {
              id: "risks",
              label: "Critical Risks", 
              type: "branch",
              color: "#ef4444",
              size: "large",
              parentId: "central"
            },
            {
              id: "recommendations",
              label: "Strategic Recommendations",
              type: "branch", 
              color: "#3b82f6",
              size: "large",
              parentId: "central"
            }
          ],
          connections: [
            {
              source: "central",
              target: "strengths",
              type: "default",
              strength: 1,
              color: "#10b981"
            },
            {
              source: "central", 
              target: "risks",
              type: "default",
              strength: 1,
              color: "#ef4444"
            },
            {
              source: "central",
              target: "recommendations", 
              type: "default",
              strength: 1,
              color: "#3b82f6"
            }
          ]
        };
      }
    }

    // Validate and enhance the mind map structure
    if (!mindmapData.central || !mindmapData.nodes || !mindmapData.connections) {
      throw new Error('Invalid mind map structure generated');
    }

    // Add metadata
    const enhancedMindmap = {
      ...mindmapData,
      metadata: {
        company: reportData.companyAlias,
        generated: new Date().toISOString(),
        totalNodes: mindmapData.nodes.length + 1, // +1 for central node
        totalConnections: mindmapData.connections.length,
        analysisScores: {
          architecture: reportData.architecture?.overall_score,
          security: reportData.security?.overall_score,
          confidence: reportData.adamassSynthesisReport?.overall_assessment?.confidence_score
        }
      }
    };

    console.log('[Mind Map] Mind map generated successfully');

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
            kind: 'mindmap',
            content: enhancedMindmap
          }
        ]);
      }
    } catch (e) {
      console.warn('[Mind Map] Persist warning:', e);
    }

    return NextResponse.json({
      success: true,
      mindmap: enhancedMindmap,
      filename: `${reportData.companyAlias || 'company'}_mindmap.json`
    });

  } catch (error) {
    console.error('[Mind Map] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate mind map', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}