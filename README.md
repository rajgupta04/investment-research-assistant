# 📈 AI Investment Research Agent

A full-stack, real-time AI Investment Research Agent powered by LangGraph, React, and Gemini 2.5 Pro.

This project autonomously researches a given company, gathers structured financial data and recent news, performs deep sentiment and fundamental analysis, and synthesizes a final investment recommendation (Invest/Watchlist/Pass) using a deterministic confidence scoring rubric.

## ✨ Features

- **LangGraph State Machine:** An 8-node explicit graph topology separating I/O-bound tool calling from LLM reasoning.
- **Parallel Execution:** Node parallelization saves significant wall-clock latency (e.g., fetching financials and news simultaneously).
- **Server-Sent Events (SSE):** Real-time streaming of node-level execution progress to the client.
- **Graceful Degradation:** The graph is designed to survive individual tool failures (e.g., if Yahoo Finance rate-limits, the agent notes the missing data and degrades the final report instead of crashing).
- **Strict Boundary Validation:** Zod schemas enforce structured JSON outputs at every LLM boundary, preventing hallucination cascades.
- **Premium Glassmorphism UI:** A stunning, responsive React frontend utilizing Tailwind CSS v4 `oklch` color spaces and Framer Motion micro-animations.

---

## 🏗️ Architecture & Graph Topology

The agent executes through the following directed graph:

```
START
  │
  ▼
[ 1. researchCompany ] ─────(Tavily Search: Identity, Sector)
  │
  ├─────────────────────────┐ (Parallel I/O)
  ▼                         ▼
[ 2. collectFinancials ]  [ 3. collectLatestNews ] ──(Yahoo Finance & Tavily News)
  │                         │
  ├─────────────────────────┘ (Sync)
  │
  ├─────────────────────────┐ (Parallel Analysis)
  ▼                         ▼
[ 4. evaluateQuality ]    [ 5. analyzeSentiment ] ──(Gemini 2.5 Pro LLM)
  │                         │
  ├─────────────────────────┘ (Sync)
  ▼
[ 6. analyzeRisks ] ────────(Gemini 2.5 Pro LLM)
  ▼
[ 7. makeDecision ] ────────(Synthesizes recommendation & confidence score)
  ▼
[ 8. generateReport ] ──────(Compiles structured FinalReport)
  ▼
 END
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- [Tavily API Key](https://tavily.com/)
- [Google AI Studio API Key](https://aistudio.google.com/apikey) (Gemini)

### 1. Installation
Clone the repository and install dependencies from the root:
```bash
npm install
```

### 2. Environment Variables
Navigate to the `server/` directory and configure your keys:
```bash
cd server
cp .env.example .env
```
Edit `server/.env` and add your `TAVILY_API_KEY` and `GOOGLE_API_KEY`.

### 3. Running the App
You can run the full stack concurrently using the root workspaces:

**Start the LangGraph Backend (Port 3001):**
```bash
npm run dev:server
```

**Start the React Frontend (Port 5173):**
```bash
npm run dev:client
```

Navigate to `http://localhost:5173` in your browser.

---

## 🧠 Prompt Engineering ("Special Prompts")

A core part of this agent's success relies on strict, role-based system prompts designed to prevent prompt injection, enforce objectivity, and mandate evidence tagging. 

Key prompting strategies used:
1. **The "Chief Risk Officer" Persona:** In `analyzeRisks`, the LLM is explicitly instructed to be a "strict and objective Chief Risk Officer" to prevent the typical LLM bias toward overly optimistic business summaries.
2. **Evidence Tagging:** Every analytical claim across all nodes must be wrapped in an `EvidenceItem` array. The system prompt mandates: *"Every claim MUST include a 'source' (the URL) if it is a fact, or 'reasoning' if it is an inference."*
3. **Hybrid Confidence Rubric:** In `makeInvestmentDecision`, the LLM is provided a programmatic baseline score (`dataCompleteness` is calculated by the server based on successful tool calls) and asked to assess the remaining 70 points based on specific dimensions (Source Quality, Signal Coherence, Evidence Strength).

---

## ⚖️ Engineering Trade-offs & Decisions

As part of the architecture design, several specific trade-offs were made to balance reliability, speed, and complexity:

- **SSE vs. WebSockets:** Chose Server-Sent Events for frontend communication. Since we only need one-way streaming (server -> client) to report graph progress, WebSockets would introduce unnecessary overhead and complexity.
- **Tavily vs. Specialized News APIs:** Chose Tavily for both general company research and news gathering. It eliminates the need for multiple API keys (like NewsAPI) and bypasses restrictive "development-only" CORS/Tier limits, keeping the reviewer setup simple.
- **Yahoo Finance (`yahoo-finance2`):** Used for financial data. While it hits undocumented endpoints and carries a slight risk of rate-limiting, the graph is explicitly designed with **Graceful Degradation**. If it fails, the node returns `available: false`, the confidence score algorithm deducts 10 points programmatically, and the final report explicitly notes the lack of data—demonstrating fault-tolerant design.
- **Shared Types via Path Aliases:** Instead of publishing a private npm package or dealing with complex workspace builds, shared Zod schemas (`@repo/shared`) are consumed directly via TypeScript paths, keeping the monorepo lightweight.
