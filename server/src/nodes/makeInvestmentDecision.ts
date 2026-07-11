import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';

/**
 * Node 7: makeInvestmentDecision
 *
 * Responsibility: Synthesize all analyses into a final recommendation (INVEST/WATCHLIST/PASS)
 * and compute the confidence score using the hybrid rubric.
 * Depends on: ALL previous analyses.
 *
 * The confidence score has 4 dimensions:
 * - dataCompleteness (0-30): Programmatically scored from state
 * - sourceQuality (0-20): LLM-assessed
 * - signalCoherence (0-30): LLM-assessed
 * - evidenceStrength (0-20): LLM-assessed
 *
 * Failure behavior: Retry TWICE (critical node). If still fails, abort with error.
 */
export async function makeInvestmentDecision(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  console.log(`[makeInvestmentDecision] Making decision for: ${state.companyName}`);

  // STUB: Will be replaced with programmatic scoring + Gemini LLM call
  return {
    investmentDecision: {
      recommendation: 'WATCHLIST',
      confidence: {
        dataCompleteness: 0,
        sourceQuality: 0,
        signalCoherence: 0,
        evidenceStrength: 0,
        total: 0,
        methodology:
          'Stub — confidence scoring not yet implemented. Will use hybrid rubric: ' +
          'programmatic data completeness (0-30) + LLM-assessed source quality (0-20), ' +
          'signal coherence (0-30), and evidence strength (0-20).',
      },
      thesisSummary: `Stub investment thesis for ${state.companyName}.`,
      reasoning: [
        'Step 1: Company research — stub data',
        'Step 2: Financial data — not yet collected',
        'Step 3: News analysis — not yet performed',
        'Step 4: Recommendation — defaulting to WATCHLIST',
      ],
    },
    currentNode: 'makeInvestmentDecision',
  };
}
