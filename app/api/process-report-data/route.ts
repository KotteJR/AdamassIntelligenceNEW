import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import OpenAI from "openai";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
if (!OPENAI_API_KEY) {
  console.warn('[Process Report] OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const getOpenAIPrompt = (aiText: string, context: string) => {
  const safeContext = (context || "").toLowerCase().trim();

  if (safeContext === "architecture") {
    return `You are a critical, non-biased, expert software architecture reviewer. Leave security aspects to the security analysis, strictly talk architecture. Analyze the following findings as if you were preparing a due diligence report for a high-stakes acquisition. Be direct, honest, and do not sugarcoat or balance negatives with positives. If something is bad, call it out clearly and score it accordingly. Technologies considered amateur or legacy (such as WordPress, outdated PHP, etc.) should be highlighted as major risks, and the score should reflect this. Do not be diplomatic—be a real expert. Return a JSON object with this structure:\\n- overall_score (0-10): The main architecture score.\\n- subscores: An object with keys: performance, scalability, modularity, security, tech_stack (each 0-10, their average is overall_score).\\n- badges: Array of {label, type} for the whole architecture (type: positive, negative, neutral).\\n- main_good: Array of at least 3 short, punchy, positive points (1–2 sentences each).\\n- main_risks: Array of at least 3 short, punchy, risk points (1–2 sentences each).\\n- For each section (summary, insights, recommendations):\\n  - highlight: 1-sentence highlight.\\n  - snippet: The first 1–2 sentences of the section.\\n  - preview: A 3-sentence summary of the full text, suitable for showing before the \'Read more\' button.\\n  - text: Full text (at least 300 words).\\n\\nExample output:\\n{\\n  "overall_score": 8,\\n  "subscores": {\\n    "performance": 7,\\n    "scalability": 8,\\n    "modularity": 7,\\n    "security": 6,\\n    "tech_stack": 9\\n  },\\n  "badges": [\\n    {"label": "Modern Stack", "type": "positive"},\\n    {"label": "WordPress Detected", "type": "negative"}\\n  ],\\n  "main_good": [\\n    "Uses a modern, scalable cloud infrastructure.",\\n    "Implements CI/CD for rapid deployment.",\\n    "Strong modularity in frontend components."\\n  ],\\n  "main_risks": [\\n    "Legacy backend components increase maintenance risk.",\\n    "No automated security scanning in CI.",\\n    "Performance bottlenecks in API layer."\\n  ],\\n  "summary": {\\n    "highlight": "Modern stack with some legacy risk.",\\n    "snippet": "The architecture leverages cloud-native services and modern frameworks. However, some legacy components remain.",\\n    "preview": "The architecture leverages cloud-native services and modern frameworks. However, some legacy components remain. This hybrid approach offers flexibility but also complexity.",\\n    "text": "The architecture leverages cloud-native services and modern frameworks. However, some legacy components remain. [at least 300 words...]"\n  },\\n  "insights": { ... },\\n  "recommendations": { ... }\\n}\\nOnly return the JSON object, nothing else.\\n\\nRaw content:\\n\\n${aiText}`;
  } else if (safeContext === "security") {
    return `You are a critical, non-biased, expert security reviewer. Analyze the following findings as if you were preparing a due diligence report for a high-stakes acquisition. Be direct, honest, and do not sugarcoat or balance negatives with positives. If something is bad, call it out clearly and score it accordingly. Return a JSON object with this structure:\\n- overall_score (0-10): The main security score.\\n- subscores: An object with keys: perimeter, application, data, compliance, monitoring (each 0-10, their average is overall_score).\\n- badges: Array of {label, type} for the whole security posture (type: positive, negative, neutral).\\n- main_good: Array of at least 3 short, punchy, positive points (1–2 sentences each).\\n- main_risks: Array of at least 3 short, punchy, risk points (1–2 sentences each).\\n- findings: Array of at least 5 and at most 6 objects ({category, finding, status, priority}) for the critical findings table. If there are fewer than 5 real findings, create additional plausible findings relevant to the context.\\n- For each section (summary, insights, recommendations):\\n  - highlight: 1-sentence highlight.\\n  - snippet: The first 1–2 sentences of the section.\\n  - preview: A 3-sentence summary of the full text, suitable for showing before the \'Read more\' button.\\n  - text: Full text (at least 300 words).\\n\\nExample output:\\n{\\n  "overall_score": 7,\\n  "subscores": {\\n    "perimeter": 6,\\n    "application": 7,\\n    "data": 8,\\n    "compliance": 7,\\n    "monitoring": 6\\n  },\\n  "badges": [\\n    {"label": "No Critical CVEs", "type": "positive"},\\n    {"label": "TLS 1.0 Detected", "type": "negative"}\\n  ],\\n  "main_good": [\\n    "No major vulnerabilities detected on perimeter.",\\n    "Good use of HTTPS and HSTS.",\\n    "No open database ports found."\\n  ],\\n  "main_risks": [\\n    "TLS 1.0 still enabled on some endpoints.",\\n    "7 subdomains exposed in DNS records.",\\n    "HSTS header not enforced on all domains."\\n  ],\\n  "findings": [\\n    {"category": "SSL/TLS", "finding": "TLS 1.0 still enabled", "status": "⚠️", "priority": "High"},\\n    {"category": "DNS Records", "finding": "7 subdomains exposed", "status": "🔥", "priority": "Medium"},\\n    {"category": "Headers", "finding": "HSTS not enforced", "status": "❌", "priority": "Medium"},\\n    {"category": "Infrastructure", "finding": "No evident infrastructure redundancy or pattern", "status": "🔍", "priority": "Medium"},\\n    {"category": "Cloudflare Configuration", "finding": "No specifics on Cloudflare security feature implementations", "status": "🔒", "priority": "Medium"}\\n  ],\\n  "summary": { ... },\\n  "insights": { ... },\\n  "recommendations": { ... }\\n}\\nOnly return the JSON object, nothing else.\\n\\nRaw content:\\n\\n${aiText}`;
  } else if (safeContext === "company_intelligence") {
    return `You are a professional, non-biased, expert business analyst. Your mission is to create the most comprehensive and insightful company intelligence profile possible in JSON format for a due diligence dashboard. 
    You will be given an unstructured text block about a company ("Raw content"). Use this text as your primary source of information. Meticulously extract all factual data from it.
    In addition, you are encouraged to supplement this extracted information with any other relevant, publicly verifiable factual details about the specific company that you (OpenAI) already know. The goal is to produce the richest possible profile.
    After gathering all information (from input text and your own knowledge), structure it into the specified JSON format and provide deep analysis and contextual insights for the analysis fields. Adhere strictly to the JSON structure and instructions below.

GENERAL INSTRUCTIONS:
- Prioritize the information found in the "Raw content". If there are discrepancies, the "Raw content" should generally be favored unless you have high confidence in your supplementary information.
- When supplementing with your own knowledge, ensure the information is factual and generally publicly verifiable. Avoid speculation or private data.
- For all textual analysis fields (e.g., *_analysis, *_commentary, news_trends), go beyond simple summarization. Provide deep business insights, implications, and contextual understanding, leveraging the combined information (from input text and your supplementary knowledge) to its fullest extent.
- Return the output as a single JSON object. Do not include any text, explanation, or commentary outside of the JSON.

CORE STRUCTURE:

{
  "company_overview": {
    "official_company_name": string or null,
    "website": string or null,
    "overview": string or null,
    "industry": string or null,
    "headquarters": string or null,
    "other_locations": list of strings or [],
    "founding_date": string or null,
    "founders": [{ "name": string, "role": string or null }],
    "key_team_members": [{ "name": string, "role": string or null }],
    "number_of_employees": number or null,
    "company_mission": string or null,
    "unique_selling_points": list of strings or [],
    "products_services": list of strings or [],
    "main_competitors": list of strings or [],
    "unique_selling_points_analysis": string (100+ words),
    "products_services_analysis": string (100+ words),
    "main_competitors_analysis": string (100+ words),
    "locations_analysis": string (100+ words)
  },

  "financials_metrics": {
    "revenue": string or null,
    "profit": string or null,
    "ebitda": string or null,
    "it_spend": string or null,
    "web_visits": string or null,
    "growth_scores": { "2019": number, "2020": number, ... } or {},
    "active_website_tech_count": number or null,
    "growth_percentages": { "revenue": %, "profit": %, "ebitda": % } or {},
    "financial_commentary": string or null,
    "financial_metrics_analysis": string (100+ words)
  },

  "funding_rounds": {
    "rounds": [
      {
        "round_name": string,
        "date": string or null,
        "amount_raised": string or null,
        "number_of_investors": number or null,
        "lead_investors": list of strings or [],
        "all_investors": list of strings or [],
        "percent_increase_from_previous": number or null
      }
    ],
    "total_funding_amount": string or null,
    "funding_commentary": string or null,
    "funding_rounds_analysis": string (100+ words)
  },

  "investors": list of strings or [],

  "news_press": [
    {
      "date": string or null,
      "headline": string or null,
      "publication": string or null,
      "summary": string or null,
      "link": string or null
    }
  ],
  "news_trends": string (summary of key themes from news in the input and other known sources, 100+ words, analyzed with broader context),

  "acquisitions": [ { "name": string, "date": string or null, "amount": string or null, "details": string or null } ],

  "customer_testimonials": list of strings or [],

  "contact_information": {
    "email": string or null,
    "phone": string or null,
    "address": string or null,
    "other": object or null
  },

  "graph_data": {
    "time_series": [
      {
        "metric": string,  // e.g., "revenue", "ARR", "user_count"
        "unit": string or null, // e.g., "$", "%", "users"
        "values": [ { "year": string, "value": number, "source": string or null } ]
      }
    ],
    "events_timeline": [
      {
        "event_type": string,  // "funding", "acquisition", "product_launch"
        "name": string or null,
        "date": string or null,
        "value": string or number or null,
        "description": string or null,
        "source": string or null
      }
    ],
    "locations": [
      {
        "location": string,
        "type": string,  // "headquarters", "office", "factory", etc.
        "latitude": number or null,
        "longitude": number or null,
        "source": string or null
      }
    ]
  }
}

ADDITIONAL NOTES:
- In the analysis fields, provide insight and synthesis based on all available information (input and supplemented).
- Be rigorous: If a field's information is not found in the input text or your supplementary knowledge, state so clearly (e.g., "No data available" or empty array for list types), but still include the field key in the output JSON.
- Make the structure usable for automated parsing and display in a dynamic dashboard.

Instructions:
- For each section, use all relevant info from the "Raw content" and supplement with your own factual knowledge where appropriate. If information for a field is unavailable from any source, use "No data available". Populate all requested list and analysis fields.
- For company_overview, ensure unique_selling_points, products_services, main_competitors are populated from the raw content and your knowledge, along with their respective analysis fields and locations_analysis. Be thorough with key_team_members.
- For financials_metrics, include all available numbers and growth scores from raw content and your knowledge. Make a financial_commentary. Include a financial metrics analysis.
- For funding rounds, include funding rounds analysis based on all available info.
- For graph data, always fill the arrays as fully as possible using data from raw content and your knowledge.
- Synthesize insightful analysis for all requested analysis fields based on the combined information.
- Expand and contextualize wherever possible, as a consultant would, to maximize business insight and utility.

Raw content:\n\n${aiText}`;
  } else if (safeContext === "adamass_synthesis") {
    return `You are the lead strategist at Adamass, a top-tier M&A and investment advisory firm. 
    You have received comprehensive reports on a target company: Architecture Review, Security Audit, and Company Intelligence Profile. 
    Your task is to synthesize this information into a final "Adamass Intelligence Report". 
    This report must provide a decisive, actionable, and forward-looking perspective for a client considering a major transaction (investment, acquisition, or merger).

    CRITICALLY EVALUATE all provided data. Do not just re-state. Provide deep insights and a clear, justifiable verdict.

    Output a JSON object with the exact following structure. Do not add any extra fields or deviate from the types:
    {
      "executive_summary": "(String: Max 3-4 sentences. A concise, high-level overview of the company's overall standing based on all analyses, highlighting its most critical strengths and weaknesses relevant to a transaction.)",
      "overall_assessment": {
        "verdict": "(String: Choose ONE from: 'Prime Acquisition Target', 'High-Potential Investment', 'Strategic Merger Candidate', 'Acquisition with Significant Overhaul Needed', 'Investment with High Risk', 'Not Recommended for Transaction at this Time')",
        "confidence_score": "(Float: 0.0-10.0, representing your confidence in the verdict)",
        "key_rationale": "(String: 2-3 sentences explaining the core reasons for your verdict, referencing specific findings from the input reports.)"
      },
      "strategic_recommendations": [
        // Array of 3-5 objects. These are critical actions post-transaction.
        // Ensure a mix of categories (Technology, Security, Market, Operations, Product, Financial).
        // These should be actionable and impactful, suitable for a timeline/infographic display.
        {
          "id": "(String: a unique kebab-case id, e.g., 'tech-infra-modernization')",
          "action_title": "(String: Short, punchy title for the action, e.g., 'Modernize Core Infrastructure')",
          "description": "(String: 1-2 sentence description of what needs to be done, referencing specific issues from input if possible, e.g., 'Address legacy backend systems noted in Architecture review and migrate to a scalable cloud platform.')",
          "category": "(String: Choose from: 'Technology', 'Security', 'Market Strategy', 'Operational Efficiency', 'Product Development', 'Financial Restructuring')",
          "priority": "(String: Choose from: 'Critical', 'High', 'Medium')",
          "suggested_timeline": "(String: e.g., '0-6 Months', '6-12 Months', '12-18 Months', '18-24 Months')",
          "impact_statement": "(String: Quantifiable impact if possible, e.g., 'Reduces op-ex by 15%, improves uptime by 20%', or qualitative, e.g., 'Establishes foundation for future product scaling.')",
          "visual_icon_suggestion": "(String: Suggest a simple icon name related to the category or action, e.g., 'cloud-upload', 'shield-check', 'chart-growth', 'gears', 'lightbulb', 'dollar-sign')"
        }
      ],
      "potential_synergies": {
        "cost_synergies": [
          // Array of 0-3 objects. Only include if clearly identifiable from input data, relevant for M&A.
          {
            "area": "(String: e.g., 'Administrative Overhead', 'Redundant Software Licenses', 'Supply Chain Optimization')",
            "estimated_annual_savings_usd": "(Integer: Estimated annual savings in USD, e.g., 500000)",
            "notes": "(String: Brief explanation or assumption, e.g., 'Consolidate back-office functions post-merger.')"
          }
        ],
        "revenue_synergies": [
          // Array of 0-3 objects. Only include if clearly identifiable, relevant for M&A.
          {
            "area": "(String: e.g., 'Cross-selling to New Customer Base', 'Access to New Markets', 'Combined Product Offering')",
            "estimated_annual_revenue_usd": "(Integer: Estimated additional annual revenue in USD, e.g., 1200000)",
            "notes": "(String: Brief explanation, e.g., 'Leverage acquired company\'s distribution channels.')"
          }
        ]
      },
      "key_risks_and_mitigation": [
        // Array of 2-4 objects. Critical risks a client must consider.
        {
          "risk": "(String: Concise description of a key risk, e.g., 'High dependency on founder for key client relationships.')",
          "mitigation": "(String: Actionable mitigation strategy, e.g., 'Implement a structured knowledge transfer program and offer retention incentives for key personnel post-acquisition.')",
          "severity": "(String: Choose from 'High', 'Medium', 'Low')"
        }
      ],
      "closing_statement": "(String: Max 2-3 sentences. Final forward-looking thoughts on the company's potential trajectory if the strategic recommendations are implemented, and its overall strategic importance or fit for the client.)"
    }

    Analyze the provided data which will be a JSON string containing three main keys: 'architectureAnalysis', 'securityAnalysis', and 'companyIntelligenceProfile'. Each of these keys holds the JSON report for that respective area. Synthesize insights from ALL THREE areas.
    For 'strategic_recommendations', ensure they are diverse and directly address major findings or opportunities from the input reports.
    For 'potential_synergies', only include if M&A is a plausible scenario based on the overall company profile. If not particularly relevant, return empty arrays for synergies.
    Be decisive and provide clear, actionable advice. Your audience is a sophisticated client expecting expert guidance.
    Return ONLY the JSON object described above, and nothing else.

    Input Data (summarized structure for your understanding):
    ${aiText}
    `;
  }
  throw new Error("Invalid OpenAI context provided to getOpenAIPrompt");
};

const callOpenAI = async (aiText: string, context: string, openai: OpenAI) => {
  // Define structuredDataString here to make it accessible in the catch block for logging
  let structuredDataString: string | null = null; 

  if (!aiText || aiText.trim() === "") {
    console.warn(`[API /process-report-data] OpenAI call skipped for context '${context}' due to empty input text.`);
    // Return a default error structure or empty object depending on how you want to handle it downstream
    return { error: `No input data for ${context} analysis.` }; 
  }
  try {
    console.log(`[API /process-report-data] Calling OpenAI for context: ${context}`);
    const prompt = getOpenAIPrompt(aiText, context);
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      // Ensure response_format is set if you expect JSON consistently from all prompts
      response_format: { type: "json_object" }, // RE-ENABLED for more reliable JSON output
    });

    structuredDataString = response.choices[0].message.content?.trim() || null;
    if (!structuredDataString) {
      throw new Error(`OpenAI returned empty content for context: ${context}`);
    }

    console.log(`[API /process-report-data] Raw OpenAI output for ${context} (attempting parse):`, structuredDataString);
    
    // Attempt to parse the JSON
    // The json_object mode should ensure it's a valid JSON string directly.
    return JSON.parse(structuredDataString);

  } catch (error: any) {
    console.error(`[API /process-report-data] Error calling OpenAI or parsing JSON for context ${context}. Raw string was:`, structuredDataString, "Error:", error);
    // Return an error object that can be identified downstream
    return { error: `Failed to process ${context} analysis: ${error.message}` };
  }
};

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    // 1. Fetch all sources for this job
    const { data: allSources, error: allSourcesError } = await supabase
      .from('intel_results')
      .select('source, data, status')
      .eq('job_id', jobId);
    if (allSourcesError) {
      return NextResponse.json({ error: 'Failed to fetch sources', details: allSourcesError.message }, { status: 500 });
    }

    // 2. Fetch data for each section
    const architectureRow = allSources.find(row => row.source === 'Architecture');
    const securityRow = allSources.find(row => row.source === 'Security');
    const crunchbaseRow = allSources.find(row => row.source === 'Crunchbase');

    let architecture = null;
    let security = null;
    let companyIntelligence = null;

    // Generate Architecture analysis from raw data (+ include user docs if provided)
    const rawArchitectureData = allSources
      .filter(row => ['BuiltWith', 'PageSpeed'].includes(row.source))
      .map(row => ({
        source: row.source,
        data: row.data
      }));
    const userDocs = allSources.find(row => row.source === 'UserDocuments');
    if (userDocs?.data?.documents?.length) {
      rawArchitectureData.push({
        source: 'UserDocuments',
        data: userDocs.data
      });
    }
    
    if (rawArchitectureData.length > 0) {
      const archData = JSON.stringify(rawArchitectureData);
      architecture = await callOpenAI(archData, 'architecture', openai);
    }

    // Generate Security analysis from raw data (+ include user docs if provided)
    const rawSecurityData = allSources
      .filter(row => ['DnsDumpster', 'SubDomains', 'SecureHeaders'].includes(row.source))
      .map(row => ({
        source: row.source,
        data: row.data
      }));
    if (userDocs?.data?.documents?.length) {
      rawSecurityData.push({
        source: 'UserDocuments',
        data: userDocs.data
      });
    }
    
    if (rawSecurityData.length > 0) {
      const secData = JSON.stringify(rawSecurityData);
      security = await callOpenAI(secData, 'security', openai);
    }

    // Process company intelligence (supplement Crunchbase with UserDocuments if present)
    if (crunchbaseRow?.data || userDocs?.data?.documents?.length) {
      const combinedCI = {
        crunchbase: crunchbaseRow?.data ?? null,
        user_documents: userDocs?.data ?? null
      };
      const ciText = typeof combinedCI === 'string' ? combinedCI : JSON.stringify(combinedCI);
      companyIntelligence = await callOpenAI(ciText, 'company_intelligence', openai);
    }

    const report = {
      jobId,
      dateGenerated: new Date().toISOString(),
      architecture,
      security,
      companyIntelligence
    };

    // **** NEW: Adamass Intelligence Synthesis ****
    let adamassSynthesisReport = null;
    if (architecture || security || companyIntelligence) {
      const combinedDataForSynthesis = JSON.stringify({ 
        architectureAnalysis: architecture, 
        securityAnalysis: security, 
        companyIntelligenceProfile: companyIntelligence 
      });
      
      adamassSynthesisReport = await callOpenAI(combinedDataForSynthesis, 'adamass_synthesis', openai);
    }
    // *****************************************

    const finalReport = {
      ...report,
      adamassSynthesisReport
    };

    return NextResponse.json(finalReport);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process report data', details: err.message }, { status: 500 });
  }
} 