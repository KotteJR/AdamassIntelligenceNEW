import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize OpenAI using env only (no hardcoded secrets)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
if (!OPENAI_API_KEY) {
  console.warn('[Chat API] OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { messages, reportData } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Create context from report data
    const reportContext = reportData ? createReportContext(reportData) : '';

    // System prompt with report context
    const systemPrompt = `You are a senior business consultant providing insights on this company's analysis. Think like McKinsey or BCG - analytical, direct, and strategic.

${reportContext}

Your consulting style:
- Be concise and analytical - avoid regurgitating the entire report and avoid very long responses, max 5 sentences.
- Focus on "why" and "how" behind the findings
- Provide strategic implications and recommendations
- Use consultant language: "This suggests...", "The key concern is...", "I'd recommend focusing on..."
- When explaining scores, give the business rationale, not just the number
- Prioritize actionable insights over comprehensive summaries
- If data is missing, say so directly and suggest what you'd need to know

Examples of good responses:
- "The 4/10 architecture score suggests significant technical debt that could limit scalability. I'd prioritize modernizing the core systems first."
- "Three key risks stand out: [specific items]. The most critical is X because..."
- "This confidence score indicates moderate certainty. The analysis is strong on financials but limited on operational data."

Avoid:
- Listing everything from the report
- Generic business advice not tied to the data
- Overly long explanations
- Restating obvious information`;

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      max_tokens: 800,
      temperature: 0.4,
    });

    const assistantMessage = response.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: assistantMessage
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

function createReportContext(reportData: any): string {
  const context = [];

  // Company basic info
  if (reportData.companyAlias) {
    context.push(`Company: ${reportData.companyAlias}`);
  }

  // Score overview
  const scores = [];
  if (reportData.architecture?.overall_score !== undefined) {
    scores.push(`Architecture: ${reportData.architecture.overall_score}/10`);
  }
  if (reportData.security?.overall_score !== undefined) {
    scores.push(`Security: ${reportData.security.overall_score}/10`);
  }
  if (reportData.adamassSynthesisReport?.overall_assessment?.confidence_score !== undefined) {
    scores.push(`Adamass Confidence: ${reportData.adamassSynthesisReport.overall_assessment.confidence_score}/10`);
  }
  if (scores.length > 0) {
    context.push(`SCORES: ${scores.join(', ')}`);
  }

  // Executive summary
  if (reportData.adamassSynthesisReport?.executive_summary) {
    context.push(`EXECUTIVE SUMMARY: ${reportData.adamassSynthesisReport.executive_summary}`);
  }

  // Key strengths and risks from architecture
  if (reportData.architecture?.main_good?.length > 0) {
    context.push(`ARCHITECTURE STRENGTHS: ${reportData.architecture.main_good.join('; ')}`);
  }
  if (reportData.architecture?.main_risks?.length > 0) {
    context.push(`ARCHITECTURE RISKS: ${reportData.architecture.main_risks.join('; ')}`);
  }

  // Security strengths and risks
  if (reportData.security?.main_good?.length > 0) {
    context.push(`SECURITY STRENGTHS: ${reportData.security.main_good.join('; ')}`);
  }
  if (reportData.security?.main_risks?.length > 0) {
    context.push(`SECURITY RISKS: ${reportData.security.main_risks.join('; ')}`);
  }

  // Strategic recommendations
  if (reportData.adamassSynthesisReport?.strategic_recommendations?.length > 0) {
    const recommendations = reportData.adamassSynthesisReport.strategic_recommendations
      .map((rec: any) => `${rec.action_title} (${rec.priority} priority): ${rec.description}`)
      .slice(0, 3); // Limit to top 3 to avoid context overflow
    context.push(`KEY RECOMMENDATIONS: ${recommendations.join('; ')}`);
  }

  // Company intelligence overview
  if (reportData.companyIntelligence?.company_overview?.overview) {
    context.push(`COMPANY OVERVIEW: ${reportData.companyIntelligence.company_overview.overview}`);
  }

  // Key risks and mitigation
  if (reportData.adamassSynthesisReport?.key_risks_and_mitigation?.length > 0) {
    const risks = reportData.adamassSynthesisReport.key_risks_and_mitigation
      .map((item: any) => `${item.risk} (${item.severity}): ${item.mitigation}`)
      .slice(0, 3);
    context.push(`KEY RISKS: ${risks.join('; ')}`);
  }

  return context.join('\n\n');
}