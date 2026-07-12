import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
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
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 ${isLoading ? 'text-primary animate-pulse' : 'text-muted-foreground group-focus-within:text-primary transition-colors'}`} />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Enter a company name (e.g., Apple, Tesla, Nvidia)..."
          className="w-full h-14 pl-12 pr-32 bg-card/50 backdrop-blur-md border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-lg"
        />
        <div className="absolute inset-y-1.5 right-1.5">
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-full px-6 bg-primary text-primary-foreground rounded-full font-medium text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing
              </>
            ) : (
              'Research'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
