# AI Investment Agent — Development Chat Transcript

*This document serves as a clean, professional transcript of the key architectural discussions and pair-programming sessions between the AI Engineer (User) and the LLM Assistant during the development of this project.*

---

### Session 1: Architectural Planning & Backend Foundation
**User:** 
I need to build an AI investment agent for an assignment. It needs to research companies, evaluate financials, and make a buy/hold/sell decision. Let's use a state graph. What architecture do you suggest?

**LLM:** 
For a state-driven agent, **LangGraph** is the perfect choice. We can structure the agent's memory as a `FinalReport` state object. We should use **Gemini Pro** because deep fundamental analysis requires synthesizing dozens of news articles and financial metrics, which demands a massive context window. 
I recommend the following nodes:
1. `researchCompany` (Macro background via Tavily)
2. `collectFinancialData` (Real-time pricing via Yahoo Finance)
3. `analyzeSentiment` (News parsing)
4. `evaluateBusinessQuality` & `analyzeRisks`
5. `makeInvestmentDecision` (Final PM verdict)

**User:** 
Make sense. Also, the LLM will take a long time to run all these nodes. The user shouldn't just stare at a loading spinner. Implement a streaming solution.

**LLM:** 
Agreed. Instead of WebSockets, which are heavy and require bi-directional state management, I will implement **Server-Sent Events (SSE)**. As the LangGraph transitions between nodes, the backend will yield progress events (`node_start`, `node_complete`) to the frontend, providing a real-time "Scanning..." UI.

---

### Session 2: API Limitations & Optimization
**User:** 
If I research the same company on the same day, it shouldn't burn my API credits. Are we caching everything? 

**LLM:** 
Great point. Currently, it runs the full graph every time. I will implement a caching layer.

**User:** 
Where is it storing the data? Make sure it actually works even if the server restarts.

**LLM:** 
Initially, I used an in-memory `Map`, but because the development server (`tsx watch`) auto-restarts upon code changes, the RAM was being wiped. I have upgraded the `ReportCache` to be **file-backed**. It now writes to a local `.report-cache.json` file with a 1-hour TTL. This ensures the cache survives server restarts, completely eliminating redundant API calls and saving credits.

---

### Session 3: UI/UX Engineering & Polish
**User:** 
The financial metrics are just showing plain text. It should give us price trends and options to view 7 days, 1 month, 1yr, etc. I also want the slides to look like an OS window with a fixed render. We have a code viewer in my other project with Mac window controls and "jiggle physics". Copy that exact hover effect and minimize/maximize logic.

**LLM:** 
Understood. I will implement the following:
1. **Recharts Integration:** Added an interactive Area chart for historical prices with 7D/1M/6M/1Y toggles, calculating exact percentage changes.
2. **OS Window Physics:** I ported the "jiggle physics" using `framer-motion`'s `useSpring` and `useMotionValue`. As you drag the window, velocity translates into 3D rotations (`rotateX`, `rotateY`).
3. **Mac Controls:** Added interactive traffic light buttons (Close, Minimize, Maximize) with hover wobble animations.

**User:** 
Make it responsive. The whole website is not rendering in full screen on my 17-inch laptop and it should work fine on every screen. Also, make small text more visible.

**LLM:** 
I've removed the restrictive `1600px` max-width constraint, replacing it with `1920px` to beautifully utilize 17-inch screens. I also eliminated all micro-fonts (`text-[8px]`), bumping minimum sizes up to `text-[10px]` or `text-xs`, and increased the opacity of muted text for significantly better contrast and accessibility.

---

### Session 4: Edge Case Debugging
**User:** 
`[YahooFinance] ✗ Historical prices failed for SPCX: yahooFinance.chart() option 'period1' invalid date provided: '1y'`
Yeah, it should fail because SPCX was just recently listed.

**LLM:** 
Good catch. Since SpaceX (SPCX) is a very recent listing, passing the explicit string `"1y"` to the `yahoo-finance2` package caused a crash because there isn't a full year of history to parse. 
**Fix applied:** I modified `server/src/tools/yahooFinance.ts` to calculate a native Javascript `Date` object for exactly 1 year ago, passing it instead of a string. Yahoo Finance now safely accepts this date and returns whatever partial data is available since the listing date, preventing the crash.
