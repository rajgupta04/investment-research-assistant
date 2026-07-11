import { useState } from 'react';
import { NODE_DISPLAY_NAMES } from '@repo/shared';

/**
 * App shell — proves the full stack works:
 * - Tailwind CSS renders correctly
 * - @repo/shared imports resolve
 * - Server health check responds
 */
export default function App() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus(JSON.stringify(data, null, 2));
    } catch (err) {
      setHealthStatus(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-8 p-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
          AI Investment Research Agent
        </h1>
        <p className="text-muted-foreground text-lg">
          Intelligent company analysis powered by LangGraph
        </p>
      </div>

      {/* Health check card */}
      <div className="glass-card p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">System Check</h2>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Check Server Health'}
        </button>

        {healthStatus && (
          <pre className="rounded-md bg-black/40 p-3 text-xs text-green-400 overflow-x-auto">
            {healthStatus}
          </pre>
        )}

        {/* Prove shared types imported correctly */}
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Graph nodes loaded from <code className="text-amber-400">@repo/shared</code>:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(NODE_DISPLAY_NAMES).map((name) => (
              <span
                key={name}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
