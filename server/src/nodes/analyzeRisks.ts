import type { AgentStateType, AgentStateUpdate } from '../graph/state.js';
import { generateStructured } from '../tools/llm.js';
import { RiskAnalysisSchema } from '@repo/shared';

/**
 * Node 6: analyzeRisks
 *
 * Responsibility: LLM analysis to identify and categorize business risks.
 * Depends on: ALL previous node outputs (company, financial, news, sentiment, quality).
 * This is the first node after the second parallel group converges (fan-in).
 *
 * Failure behavior: Retry once, then set null + log error.
 */
export async function analyzeRisks(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  console.log(`[analyzeRisks] Analyzing risks for: ${state.companyName}`);

  try {
    const systemPrompt = `You are a strict and objective Chief Risk Officer.
Analyze the company's profile, financial data, news sentiment, and business quality to identify and categorize key business, market, financial, and regulatory risks.
Return a structured output matching the requested schema.
Every claim in your evidence array MUST include a 'source' if it is a fact, or 'reasoning' if it is an inference.
Assign an overall risk level (low, medium, high) and list specific risks with their severity.`;

    const prompt = `Company Overview:
${JSON.stringify(state.companyOverview, null, 2)}

Financial Data:
${state.financialData?.available ? JSON.stringify(state.financialData, null, 2) : 'Financial data unavailable.'}

Sentiment Analysis:
${JSON.stringify(state.sentimentAnalysis, null, 2)}

Business Quality Assessment:
${JSON.stringify(state.businessQuality, null, 2)}

Identify the risks associated with this investment.`;

    const risks = await generateStructured(
      RiskAnalysisSchema,
      prompt,
      systemPrompt
    );

    return {
      riskAnalysis: risks,
      currentNode: 'analyzeRisks',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[analyzeRisks] ✗ Failed: ${errorMsg}`);
    
    return {
      riskAnalysis: null,
      currentNode: 'analyzeRisks',
      errors: [{
        node: 'analyzeRisks',
        message: errorMsg,
        timestamp: new Date().toISOString(),
        recoverable: true,
      }],
    };
  }
}
