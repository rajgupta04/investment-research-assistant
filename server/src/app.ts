import express from 'express';
import cors from 'cors';
import { ResearchRequestSchema } from '@repo/shared';
import type { ApiErrorResponse } from '@repo/shared';

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
 * Returns an SSE stream with per-node progress updates.
 *
 * Stubbed for now — the real implementation comes in the LangGraph step.
 */
app.post('/api/research', (req, res) => {
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

  // Stub: return a placeholder response until we wire up the graph
  res.json({
    message: `Research request received for: ${parsed.data.companyName}`,
    status: 'stub',
  });
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
