import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';

/**
 * Node 5: evaluateBusinessQuality
 *
 * Responsibility: LLM analysis of company research + financial data to assess
 * competitive moat, financial health, growth trajectory, and opportunities.
 * Runs in PARALLEL with analyzeSentiment.
 * Depends on: companyOverview (from researchCompany), financialData (from collectFinancialData)
 *
 * Failure behavior: Retry once, then set null + log error.
 */
export async function evaluateBusinessQuality(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  const hasFinancials = state.financialData?.available ?? false;
  console.log(`[evaluateBusinessQuality] Financials available: ${hasFinancials}`);

  // STUB: Will be replaced with Gemini LLM call
  return {
    businessQuality: {
      overallScore: 5,
      moat: `Stub moat analysis for ${state.companyName}.`,
      financialHealth: 'Stub financial health assessment.',
      growthTrajectory: 'Stub growth trajectory.',
      opportunities: [],
      evidence: [],
    },
    currentNode: 'evaluateBusinessQuality',
  };
}
