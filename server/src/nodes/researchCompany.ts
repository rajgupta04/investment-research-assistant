import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';

/**
 * Node 1: researchCompany
 *
 * Responsibility: Use Tavily to research the company — establish identity,
 * ticker, sector, and key facts. This is the foundation for all downstream nodes.
 *
 * Failure behavior: FATAL — if we can't identify the company, abort the graph.
 */
export async function researchCompany(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  console.log(`[researchCompany] Researching: ${state.companyName}`);

  // STUB: Will be replaced with Tavily search + LLM synthesis
  return {
    companyOverview: {
      name: state.companyName,
      ticker: 'STUB',
      exchange: null,
      sector: null,
      industry: null,
      description: `Stub overview for ${state.companyName}. Will be replaced with real Tavily research.`,
      headquarters: null,
      founded: null,
      ceo: null,
      employees: null,
      sources: [],
    },
    sources: [],
    currentNode: 'researchCompany',
  };
}
