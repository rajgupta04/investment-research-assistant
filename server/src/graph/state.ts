import { Annotation } from '@langchain/langgraph';
import type {
  CompanyOverview,
  FinancialData,
  LatestNews,
  SentimentAnalysis,
  BusinessQuality,
  RiskAnalysis,
  InvestmentDecision,
  FinalReport,
  Source,
  NodeError,
} from '@repo/shared';

// ============================================================
// LangGraph Agent State — single source of truth for the graph
// ============================================================
//
// Design notes:
// - Every node output field is nullable (default: null) because any node can fail.
//   Downstream nodes must check for null and degrade gracefully.
// - `sources` and `errors` use append-reducers so they accumulate across nodes
//   without overwriting.
// - `currentNode` is last-write-wins (for debugging / SSE progress).

export const AgentState = Annotation.Root({
  // ---- Input ----
  companyName: Annotation<string>,

  // ---- Node outputs (all nullable — may not have run yet or may have failed) ----
  companyOverview: Annotation<CompanyOverview | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  financialData: Annotation<FinancialData | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  latestNews: Annotation<LatestNews | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  sentimentAnalysis: Annotation<SentimentAnalysis | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  businessQuality: Annotation<BusinessQuality | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  riskAnalysis: Annotation<RiskAnalysis | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  investmentDecision: Annotation<InvestmentDecision | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  finalReport: Annotation<FinalReport | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // ---- Cross-cutting (accumulated across all nodes) ----

  /** All sources collected during the run. Append-only via reducer. */
  sources: Annotation<Source[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  /** All non-fatal errors encountered during the run. Append-only via reducer. */
  errors: Annotation<NodeError[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  /** Last node that wrote to state. Used for debugging, not for control flow. */
  currentNode: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
});

// ---- Derived types for use in node implementations ----

/** The full state shape (value types). Use as the node input parameter type. */
export type AgentStateType = typeof AgentState.State;

/** The partial update shape (update types). Use as the node return type. */
export type AgentStateUpdate = typeof AgentState.Update;
