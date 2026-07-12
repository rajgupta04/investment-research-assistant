import { GRAPH_NODE_ORDER, NODE_DISPLAY_NAMES } from '@repo/shared';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, Zap } from 'lucide-react';

interface ProgressViewProps {
  completedNodes: Set<string>;
  error?: string | null;
}

export function ProgressView({ completedNodes, error }: ProgressViewProps) {
  const totalNodes = GRAPH_NODE_ORDER.length;
  const completedCount = completedNodes.size;
  const progress = (completedCount / totalNodes) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto terminal-panel mt-8"
    >
      <div className="terminal-header">
        <span className="dot" />
        <span>ANALYSIS PIPELINE</span>
        <span className="ml-auto text-neon-cyan">{completedCount}/{totalNodes}</span>
      </div>

      {/* Progress bar */}
      <div className="mx-4 mt-4 h-1 bg-border/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-neon-cyan rounded-full"
          style={{ boxShadow: '0 0 10px oklch(0.82 0.18 195 / 0.5)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="p-4 space-y-1">
        {GRAPH_NODE_ORDER.map((node, index) => {
          const isCompleted = completedNodes.has(node);
          const isFirstNode = index === 0;
          const prevCompleted = index > 0 ? completedNodes.has(GRAPH_NODE_ORDER[index - 1]) : true;
          const isActive = !isCompleted && (isFirstNode || prevCompleted);

          return (
            <motion.div
              key={node}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 px-3 py-2 rounded font-mono text-xs transition-colors ${
                isActive ? 'bg-neon-cyan/5 border border-neon-cyan/15' : ''
              }`}
            >
              <div className="flex-shrink-0 w-5 text-center">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-neon-green" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-neon-cyan animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/20" />
                )}
              </div>
              <span className="text-muted-foreground/40 w-5">{String(index + 1).padStart(2, '0')}</span>
              <span
                className={`flex-1 transition-colors ${
                  isCompleted
                    ? 'text-foreground/80'
                    : isActive
                    ? 'text-neon-cyan text-glow-cyan'
                    : 'text-muted-foreground/25'
                }`}
              >
                {NODE_DISPLAY_NAMES[node] || node}
              </span>
              {isCompleted && (
                <Zap className="h-3 w-3 text-neon-green" />
              )}
            </motion.div>
          );
        })}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded font-mono text-xs text-neon-red"
        >
          <span className="font-bold uppercase">[ERROR]</span> {error}
        </motion.div>
      )}
    </motion.div>
  );
}
