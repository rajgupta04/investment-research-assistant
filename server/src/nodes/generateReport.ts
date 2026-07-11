import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';
import type { FinalReport } from '@repo/shared';

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

  // STUB: Will be replaced with Gemini LLM call for narrative generation
  const report: FinalReport = {
    executiveSummary: `Stub executive summary for ${state.companyName}. Full analysis pending implementation.`,
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
    financialAnalysis: state.financialData?.available
      ? 'Stub financial analysis.'
      : 'Financial data was unavailable for this analysis.',
    newsSummary: state.latestNews?.articles.length
      ? `Found ${state.latestNews.articles.length} articles.`
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
    evidenceCatalog: [],
    sources: state.sources ?? [],
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
