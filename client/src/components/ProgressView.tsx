import { GRAPH_NODE_ORDER, NODE_DISPLAY_NAMES } from '@repo/shared';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ProgressViewProps {
  completedNodes: Set<string>;
  error?: string | null;
}

export function ProgressView({ completedNodes, error }: ProgressViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto glass-card p-8 mt-8"
    >
      <h3 className="text-xl font-semibold mb-6 text-center">Researching in progress...</h3>
      
      <div className="space-y-4">
        {GRAPH_NODE_ORDER.map((node, index) => {
          const isCompleted = completedNodes.has(node);
          
          // A node is active if it's the first one, or if its previous sequential dependencies are met.
          // Since it's a bit complex with parallel groups, a simple heuristic:
          // It's active if the previous node in GRAPH_NODE_ORDER is completed, but this one isn't.
          // For the first node, it's active if it's not completed.
          const isFirstNode = index === 0;
          const prevCompleted = index > 0 ? completedNodes.has(GRAPH_NODE_ORDER[index - 1]) : true;
          const isActive = !isCompleted && (isFirstNode || prevCompleted);
          const isPending = !isCompleted && !isActive;

          return (
            <div key={node} className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'text-foreground'
                      : isActive
                      ? 'text-primary'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  {NODE_DISPLAY_NAMES[node] || node}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive-foreground text-sm"
        >
          <p className="font-semibold mb-1">Analysis Interrupted</p>
          <p>{error}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
