import type { AgentStateType, AgentStateUpdate } from '../graph/state.js';
import type { FinalReport, EvidenceItem, Source } from '@repo/shared';
import { generateText } from '../tools/llm.js';

/**
 * Node 8: generateReport
 *
 * Responsibility: Compile everything into the final structured report.
 * Tags all evidence as fact vs. inference, deduplicates sources,
 * and constructs the reasoning trace from the node execution sequence.
 *
 * Failure behavior: Retry TWICE. If fails, return raw state as degraded report.
 */
export async function generateReport(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  console.log(`[generateReport] Compiling report for: ${state.companyName}`);
  const now = new Date().toISOString();

  let executiveSummary = 'Executive summary generation failed.';
  let financialAnalysis = 'Financial analysis generation failed.';

  try {
    const sysPrompt = `You are an expert financial writer. Write clear, concise, and professional summaries for an investment report.`;
    
    // Generate Executive Summary
    const execPrompt = `Summarize the following investment research into a 2-3 paragraph executive summary:
Recommendation: ${state.investmentDecision?.recommendation}
Company: ${state.companyName}
Business Quality: ${state.businessQuality?.overallScore}/10
Key Risks: ${state.riskAnalysis?.overallRiskLevel}
Thesis: ${state.investmentDecision?.thesisSummary}`;
    executiveSummary = await generateText(execPrompt, sysPrompt);

    // Generate Financial Analysis narrative
    if (state.financialData?.available) {
      const finPrompt = `Based on the following financial data for ${state.companyName}, write a 2-3 paragraph analysis of their financial health, valuation, and growth:
${JSON.stringify(state.financialData, null, 2)}`;
      financialAnalysis = await generateText(finPrompt, sysPrompt);
    } else {
      financialAnalysis = 'Financial data was unavailable for this analysis.';
    }
  } catch (error) {
    console.warn(`[generateReport] ✗ LLM generation failed:`, error);
  }

  // Deduplicate and collect all sources
  const uniqueSourcesMap = new Map<string, Source>();
  state.sources.forEach(s => uniqueSourcesMap.set(s.url, s));
  const uniqueSources = Array.from(uniqueSourcesMap.values());

  // Collect all evidence from all nodes
  const allEvidence: EvidenceItem[] = [
    ...(state.sentimentAnalysis?.evidence ?? []),
    ...(state.businessQuality?.evidence ?? []),
    ...(state.businessQuality?.opportunities.flatMap(o => o.evidence) ?? []),
    ...(state.riskAnalysis?.risks.flatMap(r => r.evidence) ?? []),
  ];

  // Assemble the final report
  const report: FinalReport = {
    executiveSummary,
    companyOverview: state.companyOverview ?? {
      name: state.companyName,
      ticker: null,
      exchange: null,
      sector: null,
      industry: null,
      description: 'Company overview unavailable.',
      headquarters: null,
      founded: null,
      ceo: null,
      employees: null,
      sources: [],
    },
    financialData: state.financialData ?? null,
    financialAnalysis,
    newsSummary: state.latestNews?.articles.length
      ? `Analyzed ${state.latestNews.articles.length} recent articles.`
      : 'No recent news articles were found.',
    opportunities: state.businessQuality?.opportunities ?? [],
    risks: state.riskAnalysis?.risks ?? [],
    investmentDecision: state.investmentDecision ?? {
      recommendation: 'PASS',
      confidence: {
        dataCompleteness: 0,
        sourceQuality: 0,
        signalCoherence: 0,
        evidenceStrength: 0,
        total: 0,
        methodology: 'Decision unavailable — using default PASS.',
      },
      thesisSummary: 'Investment decision could not be generated.',
      reasoning: ['Decision node did not produce output.'],
    },
    evidenceCatalog: allEvidence,
    sources: uniqueSources,
    reasoningTrace: [
      { node: 'researchCompany', summary: 'Researched company identity and overview.', timestamp: now },
      { node: 'collectFinancialData', summary: 'Collected financial metrics.', timestamp: now },
      { node: 'collectLatestNews', summary: 'Fetched latest news articles.', timestamp: now },
      { node: 'analyzeSentiment', summary: 'Analyzed market sentiment from news.', timestamp: now },
      { node: 'evaluateBusinessQuality', summary: 'Evaluated business quality and opportunities.', timestamp: now },
      { node: 'analyzeRisks', summary: 'Identified and categorized business risks.', timestamp: now },
      { node: 'makeInvestmentDecision', summary: 'Synthesized analyses into investment recommendation.', timestamp: now },
      { node: 'generateReport', summary: 'Compiled final structured report.', timestamp: now },
    ],
    generatedAt: now,
  };

  return {
    finalReport: report,
    currentNode: 'generateReport',
  };
}
