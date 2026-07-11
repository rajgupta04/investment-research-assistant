import { z } from 'zod';
import { FinalReportSchema, NodeErrorSchema } from './report.ts';

// ============================================================
// API request/response schemas
// ============================================================

/** POST /api/research — request body */
export const ResearchRequestSchema = z.object({
  companyName: z
    .string()
    .min(1, { error: 'Company name is required' })
    .max(200, { error: 'Company name too long' })
    .trim(),
});
export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

// ---- SSE event types ----

/** Sent when a graph node starts executing */
export const SSENodeStartSchema = z.object({
  type: z.literal('node_start'),
  node: z.string(),
  timestamp: z.iso.datetime(),
});
export type SSENodeStart = z.infer<typeof SSENodeStartSchema>;

/** Sent when a graph node completes */
export const SSENodeCompleteSchema = z.object({
  type: z.literal('node_complete'),
  node: z.string(),
  timestamp: z.iso.datetime(),
});
export type SSENodeComplete = z.infer<typeof SSENodeCompleteSchema>;

/** Sent when a non-fatal error occurs in a node */
export const SSENodeErrorSchema = z.object({
  type: z.literal('node_error'),
  node: z.string(),
  message: z.string(),
  recoverable: z.boolean(),
  timestamp: z.iso.datetime(),
});
export type SSENodeError = z.infer<typeof SSENodeErrorSchema>;

/** Sent when the entire graph completes — contains the full report */
export const SSECompleteSchema = z.object({
  type: z.literal('complete'),
  report: FinalReportSchema,
  errors: z.array(NodeErrorSchema),
  timestamp: z.iso.datetime(),
});
export type SSEComplete = z.infer<typeof SSECompleteSchema>;

/** Sent on fatal graph failure */
export const SSEFatalErrorSchema = z.object({
  type: z.literal('fatal_error'),
  message: z.string(),
  timestamp: z.iso.datetime(),
});
export type SSEFatalError = z.infer<typeof SSEFatalErrorSchema>;

/** Union of all SSE event types */
export const SSEEventSchema = z.discriminatedUnion('type', [
  SSENodeStartSchema,
  SSENodeCompleteSchema,
  SSENodeErrorSchema,
  SSECompleteSchema,
  SSEFatalErrorSchema,
]);
export type SSEEvent = z.infer<typeof SSEEventSchema>;

// ---- REST error response ----

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ---- Node display names for the frontend progress UI ----

export const NODE_DISPLAY_NAMES: Record<string, string> = {
  researchCompany: 'Researching company…',
  collectFinancialData: 'Collecting financial data…',
  collectLatestNews: 'Fetching latest news…',
  analyzeSentiment: 'Analyzing market sentiment…',
  evaluateBusinessQuality: 'Evaluating business quality…',
  analyzeRisks: 'Analyzing risks…',
  makeInvestmentDecision: 'Making investment decision…',
  generateReport: 'Generating final report…',
} as const;

export const GRAPH_NODE_ORDER = [
  'researchCompany',
  'collectFinancialData',
  'collectLatestNews',
  'analyzeSentiment',
  'evaluateBusinessQuality',
  'analyzeRisks',
  'makeInvestmentDecision',
  'generateReport',
] as const;

export type GraphNodeName = (typeof GRAPH_NODE_ORDER)[number];
