import { z } from 'zod';

// ============================================================
// Primitives — reused across all node schemas
// ============================================================

export const SourceSchema = z.object({
  url: z.url(),
  title: z.string(),
  snippet: z.string().optional(),
  retrievedAt: z.iso.datetime(),
});
export type Source = z.infer<typeof SourceSchema>;

export const NodeErrorSchema = z.object({
  node: z.string(),
  message: z.string(),
  timestamp: z.iso.datetime(),
  recoverable: z.boolean(),
});
export type NodeError = z.infer<typeof NodeErrorSchema>;

/**
 * Every analytical claim must be wrapped in an EvidenceItem.
 * - type: 'fact'      → must have a `source` (real URL from a tool call)
 * - type: 'inference'  → must have `reasoning` (model's rationale)
 *
 * The refinement is NOT sent to the LLM (JSON Schema ignores it).
 * It's applied when we validate the LLM's response after parsing.
 */
export const EvidenceItemSchema = z
  .object({
    claim: z.string(),
    type: z.enum(['fact', 'inference']),
    source: SourceSchema.optional(),
    reasoning: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'fact') return !!data.source;
      if (data.type === 'inference') return !!data.reasoning;
      return true;
    },
    { error: 'Facts must have a source; inferences must have reasoning.' }
  );
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

// ============================================================
// Node output schemas — one per graph node
// ============================================================

// ---- Node 1: researchCompany ----

export const CompanyOverviewSchema = z.object({
  name: z.string(),
  ticker: z.string().nullable(),
  exchange: z.string().nullable(),
  sector: z.string().nullable(),
  industry: z.string().nullable(),
  description: z.string(),
  headquarters: z.string().nullable(),
  founded: z.string().nullable(),
  ceo: z.string().nullable(),
  employees: z.string().nullable(),
  sources: z.array(SourceSchema),
});
export type CompanyOverview = z.infer<typeof CompanyOverviewSchema>;

// ---- Node 2: collectFinancialData ----

export const FinancialTimeSeriesPointSchema = z.object({
  period: z.string(),
  value: z.number(),
});
export type FinancialTimeSeriesPoint = z.infer<typeof FinancialTimeSeriesPointSchema>;

export const FinancialDataSchema = z.object({
  available: z.boolean(),
  currentPrice: z.number().nullable(),
  marketCap: z.number().nullable(),
  peRatio: z.number().nullable(),
  pegRatio: z.number().nullable(),
  priceToBook: z.number().nullable(),
  debtToEquity: z.number().nullable(),
  returnOnEquity: z.number().nullable(),
  revenueGrowthYoY: z.number().nullable(),
  earningsGrowthYoY: z.number().nullable(),
  dividendYield: z.number().nullable(),
  fiftyTwoWeekHigh: z.number().nullable(),
  fiftyTwoWeekLow: z.number().nullable(),
  analystTargetPrice: z.number().nullable(),
  revenueHistory: z.array(FinancialTimeSeriesPointSchema),
  earningsHistory: z.array(FinancialTimeSeriesPointSchema),
  sources: z.array(SourceSchema),
});
export type FinancialData = z.infer<typeof FinancialDataSchema>;

// ---- Node 3: collectLatestNews ----

export const NewsArticleSchema = z.object({
  title: z.string(),
  url: z.url(),
  source: z.string(),
  publishedAt: z.string(),
  summary: z.string(),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const LatestNewsSchema = z.object({
  articles: z.array(NewsArticleSchema),
  sources: z.array(SourceSchema),
});
export type LatestNews = z.infer<typeof LatestNewsSchema>;

// ---- Node 4: analyzeSentiment ----

export const SentimentAnalysisSchema = z.object({
  overall: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  score: z.number().min(-1).max(1),
  summary: z.string(),
  keyThemes: z.array(z.string()),
  evidence: z.array(EvidenceItemSchema),
});
export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;

// ---- Node 5: evaluateBusinessQuality ----

export const OpportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
  evidence: z.array(EvidenceItemSchema),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

export const BusinessQualitySchema = z.object({
  overallScore: z.number().min(1).max(10),
  moat: z.string(),
  financialHealth: z.string(),
  growthTrajectory: z.string(),
  opportunities: z.array(OpportunitySchema),
  evidence: z.array(EvidenceItemSchema),
});
export type BusinessQuality = z.infer<typeof BusinessQualitySchema>;

// ---- Node 6: analyzeRisks ----

export const RiskItemSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  evidence: z.array(EvidenceItemSchema),
});
export type RiskItem = z.infer<typeof RiskItemSchema>;

export const RiskAnalysisSchema = z.object({
  overallRiskLevel: z.enum(['low', 'medium', 'high']),
  risks: z.array(RiskItemSchema),
});
export type RiskAnalysis = z.infer<typeof RiskAnalysisSchema>;

// ---- Node 7: makeInvestmentDecision ----

export const ConfidenceBreakdownSchema = z.object({
  dataCompleteness: z.number().min(0).max(30),
  sourceQuality: z.number().min(0).max(20),
  signalCoherence: z.number().min(0).max(30),
  evidenceStrength: z.number().min(0).max(20),
  total: z.number().min(0).max(100),
  methodology: z.string(),
});
export type ConfidenceBreakdown = z.infer<typeof ConfidenceBreakdownSchema>;

export const InvestmentDecisionSchema = z.object({
  recommendation: z.enum(['INVEST', 'WATCHLIST', 'PASS']),
  confidence: ConfidenceBreakdownSchema,
  thesisSummary: z.string(),
  reasoning: z.array(z.string()),
});
export type InvestmentDecision = z.infer<typeof InvestmentDecisionSchema>;

// ---- Node 8: generateReport ----

export const ReasoningTraceStepSchema = z.object({
  node: z.string(),
  summary: z.string(),
  timestamp: z.iso.datetime(),
});
export type ReasoningTraceStep = z.infer<typeof ReasoningTraceStepSchema>;

export const FinalReportSchema = z.object({
  executiveSummary: z.string(),
  companyOverview: CompanyOverviewSchema,
  financialAnalysis: z.string(),
  newsSummary: z.string(),
  opportunities: z.array(OpportunitySchema),
  risks: z.array(RiskItemSchema),
  investmentDecision: InvestmentDecisionSchema,
  evidenceCatalog: z.array(EvidenceItemSchema),
  sources: z.array(SourceSchema),
  reasoningTrace: z.array(ReasoningTraceStepSchema),
  generatedAt: z.iso.datetime(),
});
export type FinalReport = z.infer<typeof FinalReportSchema>;

// ============================================================
// LangGraph agent state shape (for reference, not for Zod validation)
// The actual LangGraph Annotation is defined in server/src/graph/state.ts
// ============================================================

export const AgentStateSchema = z.object({
  companyName: z.string(),
  companyOverview: CompanyOverviewSchema.nullable().default(null),
  financialData: FinancialDataSchema.nullable().default(null),
  latestNews: LatestNewsSchema.nullable().default(null),
  sentimentAnalysis: SentimentAnalysisSchema.nullable().default(null),
  businessQuality: BusinessQualitySchema.nullable().default(null),
  riskAnalysis: RiskAnalysisSchema.nullable().default(null),
  investmentDecision: InvestmentDecisionSchema.nullable().default(null),
  finalReport: FinalReportSchema.nullable().default(null),
  sources: z.array(SourceSchema).default([]),
  errors: z.array(NodeErrorSchema).default([]),
  currentNode: z.string().default(''),
});
export type AgentState = z.infer<typeof AgentStateSchema>;
