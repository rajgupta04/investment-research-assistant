import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from './state.ts';

// ---- Node imports ----
import { researchCompany } from '../nodes/researchCompany.ts';
import { collectFinancialData } from '../nodes/collectFinancialData.ts';
import { collectLatestNews } from '../nodes/collectLatestNews.ts';
import { analyzeSentiment } from '../nodes/analyzeSentiment.ts';
import { evaluateBusinessQuality } from '../nodes/evaluateBusinessQuality.ts';
import { analyzeRisks } from '../nodes/analyzeRisks.ts';
import { makeInvestmentDecision } from '../nodes/makeInvestmentDecision.ts';
import { generateReport } from '../nodes/generateReport.ts';

// ============================================================
// Investment Research Agent — LangGraph Definition
// ============================================================
//
// Graph topology:
//
//   START
//     │
//     ▼
//   researchCompany
//     │
//     ├──────────────────┐         ← PARALLEL GROUP 1 (fan-out)
//     ▼                  ▼
//   collectFinancialData collectLatestNews
//     │                  │
//     ▼                  ▼
//   evaluateBusinessQuality analyzeSentiment   ← PARALLEL GROUP 2
//     │                  │
//     └──────┬───────────┘         ← FAN-IN
//            ▼
//          analyzeRisks
//            │
//            ▼
//          makeInvestmentDecision
//            │
//            ▼
//          generateReport
//            │
//            ▼
//           END
//
// Parallel group 1: collectFinancialData + collectLatestNews
//   - Both are I/O-bound tool calls (Yahoo Finance, Tavily)
//   - Independent inputs — both only need companyOverview from researchCompany
//   - Saves ~3-5s wall-clock time
//
// Parallel group 2: evaluateBusinessQuality + analyzeSentiment
//   - evaluateBusinessQuality needs: companyOverview + financialData
//   - analyzeSentiment needs: latestNews
//   - No cross-dependency, so they can run in parallel
//   - Saves ~2-4s wall-clock time
//
// Fan-in at analyzeRisks: waits for both parallel group 2 nodes to complete

const graphBuilder = new StateGraph(AgentState)
  // ---- Register all nodes ----
  .addNode('researchCompany', researchCompany)
  .addNode('collectFinancialData', collectFinancialData)
  .addNode('collectLatestNews', collectLatestNews)
  .addNode('analyzeSentiment', analyzeSentiment)
  .addNode('evaluateBusinessQuality', evaluateBusinessQuality)
  .addNode('analyzeRisks', analyzeRisks)
  .addNode('makeInvestmentDecision', makeInvestmentDecision)
  .addNode('generateReport', generateReport)

  // ---- Wire the edges ----

  // Entry: START → researchCompany
  .addEdge(START, 'researchCompany')

  // Parallel group 1 (fan-out): researchCompany → [financial, news]
  .addConditionalEdges('researchCompany', () => [
    'collectFinancialData',
    'collectLatestNews',
  ])

  // Parallel group 2 (1:1 edges into the second parallel pair):
  // collectFinancialData → evaluateBusinessQuality
  // collectLatestNews → analyzeSentiment
  .addEdge('collectFinancialData', 'evaluateBusinessQuality')
  .addEdge('collectLatestNews', 'analyzeSentiment')

  // Fan-in: both group 2 nodes → analyzeRisks
  // addEdge accepts N[] as first arg for fan-in
  .addEdge(['analyzeSentiment', 'evaluateBusinessQuality'], 'analyzeRisks')

  // Sequential tail
  .addEdge('analyzeRisks', 'makeInvestmentDecision')
  .addEdge('makeInvestmentDecision', 'generateReport')
  .addEdge('generateReport', END);

/** Compiled graph — ready to invoke. Compiled once at module load. */
export const investmentGraph = graphBuilder.compile();
