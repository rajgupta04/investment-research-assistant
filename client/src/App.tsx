import { useState, useRef, useEffect } from 'react';
import type { FinalReport, SSEEvent } from '@repo/shared';
import { SearchForm } from './components/SearchForm';
import { ProgressView } from './components/ProgressView';
import { ReportView } from './components/ReportView';

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
    // Reset state
    setCompanyName(query);
    setIsResearching(true);
    setCompletedNodes(new Set());
    setReport(null);
    setError(null);

    // Close any existing connection
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
            setError(`Fatal Error: ${data.message}`);
            setIsResearching(false);
            source.close();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event', err);
      }
    };

    source.onerror = (err) => {
      console.error('EventSource failed:', err);
      setError('Connection to server lost or failed.');
      setIsResearching(false);
      source.close();
    };
  };

  return (
    <div className="min-h-dvh flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="mb-12 text-center space-y-4 pt-8 md:pt-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-orange-400 via-amber-300 to-primary bg-clip-text text-transparent">
          AI Investment Research
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Deep fundamental analysis powered by LangGraph. Enter a company to generate a comprehensive investment memo.
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Only show search form prominently if we haven't searched yet, otherwise compact it or hide it? 
            Let's keep it visible but maybe ReportView handles the display. */}
        {(!report || isResearching) && (
          <div className="w-full mb-12">
            <SearchForm onSearch={handleSearch} isLoading={isResearching} />
          </div>
        )}

        {/* Progress View */}
        {isResearching && !report && (
          <ProgressView completedNodes={completedNodes} error={error} />
        )}
        
        {/* Error State if not caught by ProgressView */}
        {!isResearching && error && !report && (
           <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive-foreground mt-8">
             {error}
           </div>
        )}

        {/* Final Report */}
        {!isResearching && report && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-center mb-8 px-4 max-w-5xl mx-auto">
              <h2 className="text-2xl font-semibold">Analysis Results for {companyName}</h2>
              <button 
                onClick={() => setReport(null)} 
                className="text-sm font-medium text-primary hover:underline"
              >
                Start New Research
              </button>
            </div>
            <ReportView report={report} />
          </div>
        )}
      </main>
    </div>
  );
}
