import type { AgentStateType, AgentStateUpdate } from '../graph/state.js';
import { generateStructured } from '../tools/llm.js';
import { BusinessQualitySchema } from '@repo/shared';

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

  try {
    const systemPrompt = `You are an expert equity research analyst.
Evaluate the business quality, competitive moat, financial health, and growth trajectory of the company based on the provided overview and financial data.
Return a structured output matching the requested schema.
Be objective and critical. Your overallScore should be between 1 and 10.
Every claim in your evidence array MUST include a 'source' (e.g. Yahoo Finance) if it is a fact, or 'reasoning' if it is an inference.`;

    const prompt = `Company Overview:
${JSON.stringify(state.companyOverview, null, 2)}

Financial Data:
${hasFinancials ? JSON.stringify(state.financialData, null, 2) : 'Financial data unavailable.'}

Assess the business quality. Provide an overall score (1-10), an analysis of their competitive moat, financial health, growth trajectory, potential opportunities, and an evidence catalog backing up your claims.`;

    const quality = await generateStructured(
      BusinessQualitySchema,
      prompt,
      systemPrompt
    );

    return {
      businessQuality: quality,
      currentNode: 'evaluateBusinessQuality',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[evaluateBusinessQuality] ✗ Failed: ${errorMsg}`);
    
    return {
      businessQuality: null,
      currentNode: 'evaluateBusinessQuality',
      errors: [{
        node: 'evaluateBusinessQuality',
        message: errorMsg,
        timestamp: new Date().toISOString(),
        recoverable: true,
      }],
    };
  }
}
