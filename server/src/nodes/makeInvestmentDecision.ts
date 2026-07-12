import type { AgentStateType, AgentStateUpdate } from '../graph/state.js';
import { generateStructured } from '../tools/llm.js';
import { InvestmentDecisionSchema } from '@repo/shared';

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

  try {
    // 1. Programmatic dimension: dataCompleteness (0-30)
    let dataCompleteness = 0;
    if (state.companyOverview?.description) dataCompleteness += 5;
    if (state.financialData?.available) dataCompleteness += 15;
    if (state.latestNews && state.latestNews.articles.length > 0) dataCompleteness += 5;
    if (state.riskAnalysis) dataCompleteness += 5;

    const systemPrompt = `You are the Lead Portfolio Manager.
Synthesize the provided research data to make a final investment recommendation (INVEST, WATCHLIST, or PASS).
Return a structured output matching the requested schema.

Your confidence score MUST include the following dimensions:
1. dataCompleteness: Use exactly ${dataCompleteness} (this is programmatically determined).
2. sourceQuality (0-20): Assess the quality and reliability of the data sources.
3. signalCoherence (0-30): Assess how well the different signals (financials, sentiment, risks) align.
4. evidenceStrength (0-20): Assess the strength of the evidence supporting your recommendation.
5. total: Sum of the 4 dimensions.
6. methodology: A brief explanation of how you scored the last 3 dimensions.`;

    const prompt = `Company Overview:
${JSON.stringify(state.companyOverview, null, 2)}

Financial Data:
${state.financialData?.available ? JSON.stringify(state.financialData, null, 2) : 'Financial data unavailable.'}

Sentiment Analysis:
${JSON.stringify(state.sentimentAnalysis, null, 2)}

Business Quality Assessment:
${JSON.stringify(state.businessQuality, null, 2)}

Risk Analysis:
${JSON.stringify(state.riskAnalysis, null, 2)}

Make your investment decision. Provide your recommendation, the detailed confidence breakdown (remember dataCompleteness = ${dataCompleteness}), a summary of your thesis, and a step-by-step reasoning trace.`;

    const decision = await generateStructured(
      InvestmentDecisionSchema,
      prompt,
      systemPrompt,
      45_000 // allow more time for this critical synthesis step
    );

    // Enforce programmatic completeness and total sum just in case LLM math is wrong
    decision.confidence.dataCompleteness = dataCompleteness;
    decision.confidence.total = 
      decision.confidence.dataCompleteness + 
      decision.confidence.sourceQuality + 
      decision.confidence.signalCoherence + 
      decision.confidence.evidenceStrength;

    return {
      investmentDecision: decision,
      currentNode: 'makeInvestmentDecision',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[makeInvestmentDecision] ✗ Failed: ${errorMsg}`);
    
    return {
      investmentDecision: null,
      currentNode: 'makeInvestmentDecision',
      errors: [{
        node: 'makeInvestmentDecision',
        message: errorMsg,
        timestamp: new Date().toISOString(),
        recoverable: true,
      }],
    };
  }
}
