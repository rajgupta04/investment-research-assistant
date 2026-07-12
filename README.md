# 🚀 AI Investment Analyst Agent

## 📌 Overview — What it does
The **AI Investment Analyst Agent** is an autonomous, LangGraph-powered system designed to conduct deep fundamental research on publicly traded companies. It acts as an elite financial analyst: given a company name, it autonomously searches the web for recent news, pulls real-time financial metrics, analyzes sentiment, evaluates business quality and risks, and ultimately synthesizes a structured, highly defensible **Investment Memorandum**. 

The backend orchestrates this complex reasoning using a state-graph architecture, streaming its thought process in real-time to a stunning, MacOS-inspired glassmorphism dashboard built with React and Framer Motion.

---

## ⚙️ How to run it

### Prerequisites
- Node.js (v18+)
- npm or yarn
- API Keys for Gemini (Google) and Tavily (Search)

### Setup Steps
1. **Clone/Unzip the repository** and navigate to the project root:
   ```bash
   cd ai-investment-agent
   ```
2. **Install dependencies** across the monorepo (Client, Server, Shared):
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file inside the `server/` directory and add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   TAVILY_API_KEY=your_tavily_key_here
   PORT=3001
   ```

### Run the Application
You can start both the frontend and backend concurrently from the root directory:
```bash
# Start backend server
npm run dev --workspace=server

# Start frontend client (in a new terminal)
npm run dev --workspace=client
```
The dashboard will be available at `http://localhost:5174` (or whatever port Vite assigns).

---

## 🧠 How it works — Approach and Architecture

The project is structured as a **TypeScript Monorepo** (Frontend, Backend, Shared Types) to ensure end-to-end type safety.

### 1. The AI Architecture (LangGraph)
The core intelligence is modeled as a State Graph using `LangGraph`. The agent's memory is a `FinalReport` state object that is progressively built by specialized nodes:
1. **`researchCompany`**: Uses Tavily to gather macro data and company background.
2. **`collectFinancialData`**: Uses `yahoo-finance2` to pull real-time pricing, market cap, P/E, and historical charts.
3. **`collectLatestNews`**: Gathers the latest news articles for sentiment analysis.
4. **`analyzeSentiment`**: LLM analyzes news to gauge public and market sentiment.
5. **`evaluateBusinessQuality`**: LLM evaluates moats, leadership, and operational efficiency.
6. **`analyzeRisks`**: Identifies regulatory, market, and competitive risks.
7. **`makeInvestmentDecision`**: A final LLM pass that acts as the Portfolio Manager, reviewing all gathered context to output a Buy/Hold/Sell verdict and a calculated confidence score matrix.
8. **`generateReport`**: Formats the final state into a highly structured JSON report.

### 2. The Communication Layer (SSE)
Because LLM agents take time to think (often 30-90 seconds for deep research), I implemented **Server-Sent Events (SSE)**. As the LangGraph transitions between nodes, the backend streams progress events (`node_start`, `node_complete`) to the frontend, providing a real-time "Scanning..." UI.

### 3. The Dashboard (React + Vite)
The frontend consumes the finalized JSON and renders it into a highly interactive, Hollywood/OS-style terminal interface. It features:
- A dynamic **Wobble/Jiggle Physics Window** powered by Framer Motion.
- Data visualizations using Recharts (Area charts for historical prices).
- Print-optimized CSS for exporting high-fidelity PDFs.

---

## ⚖️ Key Decisions & Trade-offs

* **Decision: Used Gemini Pro via LangChain**
  * *Why*: Deep fundamental analysis requires a massive context window to synthesize dozens of news articles and financial metrics simultaneously without losing coherence. Gemini excels at large-context synthesis.
* **Decision: Server-Sent Events (SSE) over WebSockets**
  * *Why*: The communication is strictly one-way (Server -> Client progress updates). WebSockets would have been overkill and introduced unnecessary state-management complexity.
* **Decision: File-backed Caching mechanism**
  * *Why*: LLM calls and Search API calls cost money/credits. I implemented a local `.report-cache.json` system with a 1-hour TTL. If a user searches the same company within an hour, it serves the cached report instantly.
* **Trade-off: Public Scrapers (Yahoo Finance) vs. Paid APIs**
  * *What I chose*: I used `yahoo-finance2` to fetch financial data instead of Bloomberg or Capital IQ. 
  * *Why*: To keep the project accessible and runnable without expensive API subscriptions. 
  * *Drawback*: Yahoo Finance is undocumented and occasionally rate-limits or returns missing data (handled via graceful degradation in the code).
* **What I left out**: Persistent user accounts and Postgres databases. I chose to focus 100% of my time on perfecting the AI agent orchestration and the frontend UX/UI, rather than building generic CRUD auth boilerplate.

---

## 📊 Example Runs

*(Note to Reviewer: Below are examples of the agent's output. See attached screenshots in the `examples/` folder for the UI representation)*

1. **SpaceX (SPCX)**
   - **Verdict**: BUY (High Confidence)
   - **Key insight**: Agent correctly identified it as a recently listed/hyped entity, pulling historical data and analyzing its massive upside potential despite aerospace regulatory risks.
2. **Apple Inc (AAPL)**
   - **Verdict**: HOLD
   - **Key insight**: Agent evaluated the high P/E ratio and mature market saturation, balancing it against their massive cash reserves, resulting in a conservative Hold recommendation.

---

## 🔮 What I would improve with more time
1. **Multi-Agent Debate System**: Instead of one final decision node, I would implement a "Bull Agent" and a "Bear Agent" that debate the financials, with a "Portfolio Manager Agent" acting as the judge.
2. **Direct SEC EDGAR Integration**: Parsing raw 10-K and 10-Q filings directly using RAG (Retrieval-Augmented Generation) instead of relying solely on secondary news sources.
3. **Dockerization**: Containerizing the frontend, backend, and a Redis cache instance for seamless one-click production deployments.
