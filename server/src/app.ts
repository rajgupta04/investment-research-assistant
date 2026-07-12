import express from 'express';
import cors from 'cors';
import { ResearchRequestSchema } from '@repo/shared';
import type { ApiErrorResponse, SSENodeComplete, SSEComplete, SSEFatalError } from '@repo/shared';
import { investmentGraph } from './graph/graph.js';

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
  });
});

/**
 * GET /api/research/stream — triggers the investment research agent with SSE.
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

  console.log(`\n[Research SSE] Starting analysis for: ${companyName}`);
  const startTime = Date.now();

  try {
    // Invoke the LangGraph with streamMode: 'values' to get state after each node
    const stream = await investmentGraph.stream(
      { companyName: companyName.trim() },
      { streamMode: 'values' }
    );

    let finalState: any = null;
    const seenNodes = new Set<string>();

    for await (const state of stream) {
      finalState = state;
      const node = state.currentNode;

      // Yield node_complete event for every new node that finishes
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

    // Yield final complete event
    if (finalState && finalState.finalReport) {
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
