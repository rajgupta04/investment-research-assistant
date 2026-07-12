import { useState } from 'react';
import { Search, Loader2, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchFormProps {
  onSearch: (companyName: string) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative group">
        {/* Terminal prompt prefix */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none gap-2">
          <Terminal className={`h-4 w-4 ${isLoading ? 'text-neon-cyan animate-pulse' : 'text-muted-foreground group-focus-within:text-neon-cyan transition-colors'}`} />
          <span className="font-mono text-xs text-neon-cyan/50 group-focus-within:text-neon-cyan/80 transition-colors hidden sm:inline">
            research&gt;
          </span>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Enter target company (e.g., Apple, Tesla, Nvidia)..."
          className="w-full h-14 pl-14 sm:pl-32 pr-36 bg-card/70 backdrop-blur-md border border-border rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 focus:border-neon-cyan/30 transition-all animate-border-glow"
        />
        <div className="absolute inset-y-1.5 right-1.5">
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-full px-6 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-md font-mono font-semibold text-xs uppercase tracking-widest transition-all hover:bg-neon-cyan/20 hover:border-neon-cyan/50 hover:shadow-[0_0_15px_oklch(0.82_0.18_195/0.2)] active:scale-95 disabled:opacity-30 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scanning
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                Analyze
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
