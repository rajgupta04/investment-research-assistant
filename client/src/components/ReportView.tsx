import type { FinalReport } from '@repo/shared';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Info
} from 'lucide-react';

interface ReportViewProps {
  report: FinalReport;
}

export function ReportView({ report }: ReportViewProps) {
  const dec = report.investmentDecision;
  
  const getDecisionStyles = () => {
    switch (dec.recommendation) {
      case 'INVEST': return 'badge-invest bg-invest/20 border-invest/50';
      case 'WATCHLIST': return 'badge-watchlist bg-watchlist/20 border-watchlist/50';
      case 'PASS': return 'badge-pass bg-pass/20 border-pass/50';
      default: return 'bg-muted border-border text-foreground';
    }
  };

  const getDecisionIcon = () => {
    switch (dec.recommendation) {
      case 'INVEST': return <TrendingUp className="w-8 h-8" />;
      case 'WATCHLIST': return <Eye className="w-8 h-8" />;
      case 'PASS': return <AlertOctagon className="w-8 h-8" />;
      default: return <Info className="w-8 h-8" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-8 pb-20"
    >
      {/* Header Card */}
      <div className="glass-card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none">
          {getDecisionIcon()}
        </div>
        
        <div className="z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{report.companyOverview.name}</h1>
            {report.companyOverview.ticker && (
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold tracking-wider">
                {report.companyOverview.ticker}
              </span>
            )}
          </div>
          <p className="text-muted-foreground max-w-2xl text-lg">
            {report.companyOverview.sector} • {report.companyOverview.industry}
          </p>
        </div>

        <div className={`z-10 flex flex-col items-center justify-center p-6 rounded-2xl border-2 backdrop-blur-md min-w-[200px] ${getDecisionStyles()}`}>
          <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Decision</div>
          <div className="text-3xl font-black mb-2 flex items-center gap-2">
            {getDecisionIcon()}
            {dec.recommendation}
          </div>
          <div className="text-sm font-medium opacity-90">
            Confidence: {dec.confidence.total}/100
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <section className="glass-card p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Executive Summary
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
              {report.executiveSummary.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Financial Analysis
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
              {report.financialAnalysis.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Growth Opportunities
            </h2>
            <div className="grid gap-4">
              {report.opportunities.length > 0 ? report.opportunities.map((opp, i) => (
                <div key={i} className="p-4 bg-secondary/50 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-lg mb-2">{opp.title}</h4>
                  <p className="text-muted-foreground text-sm">{opp.description}</p>
                </div>
              )) : (
                <p className="text-muted-foreground">No significant opportunities identified.</p>
              )}
            </div>
          </section>
          
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          <section className="glass-card p-6 border-destructive/20">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-destructive-foreground">
              <AlertTriangle className="w-5 h-5" />
              Key Risks
            </h2>
            <div className="space-y-4">
              {report.risks.length > 0 ? report.risks.map((risk, i) => (
                <div key={i} className="border-l-2 border-destructive pl-4 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                      risk.severity === 'high' ? 'bg-destructive/20 text-destructive-foreground' : 
                      risk.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' : 
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {risk.severity}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{risk.category}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{risk.title}</h4>
                  <p className="text-muted-foreground text-xs">{risk.description}</p>
                </div>
              )) : (
                <p className="text-muted-foreground">No significant risks identified.</p>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Investment Thesis</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {dec.thesisSummary}
            </p>
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Reasoning</h3>
            <ul className="space-y-3">
              {dec.reasoning.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary font-bold">{i+1}.</span>
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Data Sources</h2>
            <ul className="space-y-2">
              {report.sources.slice(0, 5).map((s, i) => (
                <li key={i} className="text-xs">
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline line-clamp-1">
                    {s.title}
                  </a>
                </li>
              ))}
              {report.sources.length > 5 && (
                <li className="text-xs text-muted-foreground italic">
                  + {report.sources.length - 5} more sources
                </li>
              )}
            </ul>
          </section>
          
        </div>
      </div>
    </motion.div>
  );
}
