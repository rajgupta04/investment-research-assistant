import { useState, useRef, useEffect } from 'react';
import type { FinalReport, SSEEvent } from '@repo/shared';
import { SearchForm } from './components/SearchForm';
import { ProgressView } from './components/ProgressView';
import { ReportView } from './components/ReportView';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, RotateCcw } from 'lucide-react';

export default function App() {
  const [companyName, setCompanyName] = useState<string>('');
  const [isResearching, setIsResearching] = useState(false);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [report, setReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSearch = (query: string) => {
    setCompanyName(query);
    setIsResearching(true);
    setCompletedNodes(new Set());
    setReport(null);
    setError(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/research/stream?companyName=${encodeURIComponent(query)}`;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;

        switch (data.type) {
          case 'node_start':
          case 'node_complete':
            setCompletedNodes((prev) => {
              const next = new Set(prev);
              next.add(data.node);
              return next;
            });
            break;

          case 'node_error':
            if (!data.recoverable) {
              setError(`Error in ${data.node}: ${data.message}`);
              setIsResearching(false);
              source.close();
            }
            break;

          case 'complete':
            setReport(data.report);
            setIsResearching(false);
            source.close();
            break;

          case 'fatal_error':
            setError(`FATAL: ${data.message}`);
            setIsResearching(false);
            source.close();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event', err);
      }
    };

    source.onerror = () => {
      setError('Connection to research server lost.');
      setIsResearching(false);
      source.close();
    };
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
    setCompanyName('');
    setCompletedNodes(new Set());
  };

  return (
    <div className="scanlines min-h-dvh flex flex-col">
      {/* ─── Top Chrome ─────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 py-2.5 flex items-center justify-between no-print">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-neon-cyan" style={{ filter: 'drop-shadow(0 0 4px oklch(0.82 0.18 195 / 0.5))' }} />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-neon-cyan/80">
            Investment Terminal
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/40 border border-border/50 rounded px-1.5 py-0.5">v1.0</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">
          <span className="hidden sm:inline">Powered by LangGraph + Gemini</span>
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green" style={{ boxShadow: '0 0 6px oklch(0.78 0.22 150)' }} />
          <span className="text-neon-green/60">Online</span>
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────── */}
      <main className="flex-1 w-full px-4 py-6">
        <AnimatePresence mode="wait">

          {/* ── Landing / Search State ── */}
          {!report && !isResearching && !error && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] gap-8"
            >
              <div className="text-center space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-6xl font-black tracking-tighter text-neon-cyan text-glow-cyan animate-flicker"
                >
                  AI RESEARCH
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-mono text-sm text-muted-foreground/50 max-w-md mx-auto"
                >
                  Autonomous investment analysis agent. Enter a company name to initiate deep fundamental research and generate a structured investment memo.
                </motion.p>
              </div>
              <SearchForm onSearch={handleSearch} isLoading={false} />
            </motion.div>
          )}

          {/* ── Research In Progress ── */}
          {isResearching && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center pt-16 gap-4"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold font-mono text-neon-cyan text-glow-cyan">
                  SCANNING: {companyName.toUpperCase()}
                </h2>
                <p className="text-xs font-mono text-muted-foreground/40 mt-1">Autonomous research pipeline active</p>
              </div>
              <SearchForm onSearch={handleSearch} isLoading={true} />
              <ProgressView completedNodes={completedNodes} error={error} />
            </motion.div>
          )}

          {/* ── Error State ── */}
          {!isResearching && error && !report && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center pt-20 gap-6"
            >
              <div className="terminal-panel p-6 max-w-lg text-center space-y-4">
                <div className="text-neon-red font-mono text-sm font-bold uppercase">[SYSTEM ERROR]</div>
                <p className="text-muted-foreground text-sm">{error}</p>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/25 rounded font-mono text-xs uppercase tracking-wider text-neon-cyan hover:bg-neon-cyan/20 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Report Dashboard ── */}
          {!isResearching && report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6 max-w-[1600px] mx-auto px-2">
                <button
                  onClick={handleReset}
                  className="no-print flex items-center gap-2 px-3 py-1.5 rounded border border-border/50 text-xs font-mono text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/25 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  New Research
                </button>
              </div>
              <ReportView report={report} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
