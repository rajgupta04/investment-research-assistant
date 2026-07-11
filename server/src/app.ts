import express from 'express';
import cors from 'cors';
import { ResearchRequestSchema } from '@repo/shared';
import type { ApiErrorResponse } from '@repo/shared';
import { investmentGraph } from './graph/graph.ts';

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
 * POST /api/research — triggers the investment research agent.
 *
 * Currently invokes the graph synchronously and returns the final state.
 * Will be replaced with SSE streaming in a later step.
 */
app.post('/api/research', async (req, res) => {
  // Validate request body at the trust boundary
  const parsed = ResearchRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    const errorResponse: ApiErrorResponse = {
      error: 'Invalid request',
      details: parsed.error.issues.map((i) => i.message).join('; '),
    };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    console.log(`\n[Research] Starting analysis for: ${parsed.data.companyName}`);
    const startTime = Date.now();

    // Invoke the LangGraph with the company name as input
    const result = await investmentGraph.invoke({
      companyName: parsed.data.companyName,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Research] Completed in ${elapsed}s`);

    // Return the final report + any errors
    res.json({
      report: result.finalReport,
      errors: result.errors,
      meta: {
        companyName: parsed.data.companyName,
        elapsedSeconds: parseFloat(elapsed),
        nodeCount: 8,
        sourceCount: result.sources?.length ?? 0,
      },
    });
  } catch (error) {
    console.error('[Research] Graph execution failed:', error);

    const errorResponse: ApiErrorResponse = {
      error: 'Research failed',
      details:
        error instanceof Error ? error.message : 'Unknown error during graph execution',
    };
    res.status(500).json(errorResponse);
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
