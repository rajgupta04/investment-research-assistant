import express from 'express';
import cors from 'cors';
import { ResearchRequestSchema, GRAPH_NODE_ORDER } from '@repo/shared';
import type { ApiErrorResponse, SSENodeComplete, SSEComplete, SSEFatalError } from '@repo/shared';
import { investmentGraph } from './graph/graph.js';
import { reportCache } from './utils/cache.js';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Health check — verifies server is up and shared types import works */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sharedTypesLoaded: typeof ResearchRequestSchema !== 'undefined',
    cacheSize: reportCache.size,
  });
});

/**
 * GET /api/research/stream — triggers the investment research agent with SSE.
 *
 * If a cached report exists for the same company (within TTL), it replays
 * the SSE events instantly from cache — zero API calls, zero cost.
 *
 * Query params:
 * - companyName (string): The company to research
 */
app.get('/api/research/stream', async (req, res) => {
  // Validate query parameter
  const companyName = req.query.companyName as string;
  if (!companyName || companyName.trim() === '') {
    const errorResponse: ApiErrorResponse = {
      error: 'Invalid request',
      details: 'companyName query parameter is required',
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const trimmedName = companyName.trim();

  // ── Check cache first ────────────────────────────────────────
  const cached = reportCache.get(trimmedName);
  if (cached) {
    console.log(`\n[Research SSE] Cache hit for "${trimmedName}" — replaying events instantly`);

    // Replay node_complete events with small delays for a smooth UI experience
    for (const node of GRAPH_NODE_ORDER) {
      const event: SSENodeComplete = {
        type: 'node_complete',
        node: node,
        timestamp: new Date().toISOString(),
      };
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      // Small artificial delay so the frontend progress bar feels natural
      await new Promise((r) => setTimeout(r, 80));
    }

    const completeEvent: SSEComplete = {
      type: 'complete',
      report: cached.report,
      errors: cached.errors,
      timestamp: new Date().toISOString(),
    };
    res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
    res.end();
    return;
  }

  // ── Cache miss — run the full graph ──────────────────────────
  console.log(`\n[Research SSE] Cache miss for "${trimmedName}" — running full graph`);
  const startTime = Date.now();

  try {
    const stream = await investmentGraph.stream(
      { companyName: trimmedName },
      { streamMode: 'values' }
    );

    let finalState: any = null;
    const seenNodes = new Set<string>();

    for await (const state of stream) {
      finalState = state;
      const node = state.currentNode;

      if (node && !seenNodes.has(node)) {
        seenNodes.add(node);
        const event: SSENodeComplete = {
          type: 'node_complete',
          node: node,
          timestamp: new Date().toISOString(),
        };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Research SSE] Completed in ${elapsed}s`);

    if (finalState && finalState.finalReport) {
      // ── Store in cache before responding ──────────────────────
      reportCache.set(trimmedName, finalState.finalReport, finalState.errors || []);

      const completeEvent: SSEComplete = {
        type: 'complete',
        report: finalState.finalReport,
        errors: finalState.errors || [],
        timestamp: new Date().toISOString(),
      };
      res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
    } else {
      throw new Error('Graph completed but no final report was generated.');
    }

  } catch (error) {
    console.error('[Research SSE] Graph execution failed:', error);
    const fatalEvent: SSEFatalError = {
      type: 'fatal_error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
    res.write(`data: ${JSON.stringify(fatalEvent)}\n\n`);
  } finally {
    res.end();
  }
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[Server Error]', err);

    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' ? err.message : undefined,
    };

    res.status(500).json(errorResponse);
  }
);

export default app;
