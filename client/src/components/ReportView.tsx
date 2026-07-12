import { useRef } from 'react';
import type { FinalReport } from '@repo/shared';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  Shield,
  Eye,
  FileDown,
  ExternalLink,
  Zap,
  Activity,
  BarChart3,
  Newspaper,
  Target,
  Brain,
  ChevronRight,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReportViewProps {
  report: FinalReport;
}

/* ─── helpers ──────────────────────────────────────────── */

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString();
}

function pct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function numFmt(n: number | null | undefined, suffix = ''): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}${suffix}`;
}

/* ─── main component ───────────────────────────────────── */

export function ReportView({ report }: ReportViewProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const dec = report.investmentDecision;
  const fin = report.companyOverview;

  const handleDownloadPdf = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, {
      backgroundColor: '#0a0a12',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${fin.name.replace(/\s+/g, '_')}_Research_Report.pdf`);
  };

  const getDecColor = () => {
    switch (dec.recommendation) {
      case 'INVEST': return { text: 'text-invest', bg: 'badge-invest', glow: 'text-glow-green' };
      case 'WATCHLIST': return { text: 'text-watchlist', bg: 'badge-watchlist', glow: '' };
      case 'PASS': return { text: 'text-pass', bg: 'badge-pass', glow: '' };
      default: return { text: '', bg: '', glow: '' };
    }
  };

  const decStyle = getDecColor();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4 pb-16">

      {/* ─── TOP BAR ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 px-2"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">{fin.name}</h1>
              {fin.ticker && (
                <span className="font-mono text-sm px-2.5 py-0.5 bg-neon-cyan/10 border border-neon-cyan/25 rounded text-neon-cyan">
                  {fin.ticker}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs font-mono mt-0.5">
              {[fin.sector, fin.industry].filter(Boolean).join(' / ') || 'Technology'}
              <span className="mx-2 text-border">|</span>
              <span className="text-muted-foreground/50">Generated {new Date(report.generatedAt).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/25 rounded font-mono text-xs uppercase tracking-wider text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/40 hover:shadow-[0_0_15px_oklch(0.82_0.18_195/0.15)] transition-all active:scale-95"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </motion.div>

      {/* ─── DASHBOARD GRID ──────────────────────────── */}
      <motion.div
        ref={dashboardRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"
      >
        {/* ── Decision Card (spans 1 col) ── */}
        <motion.div variants={itemVariants} className={`terminal-panel ${decStyle.bg} p-0`}>
          <div className="terminal-header">
            <span className="dot" />
            <span>VERDICT</span>
          </div>
          <div className="p-5 text-center space-y-3">
            <div className={`text-4xl font-black font-mono tracking-tight ${decStyle.text} ${decStyle.glow}`}>
              {dec.recommendation}
            </div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Confidence Score
            </div>
            <div className="relative mx-auto w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.22 0.015 250)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="currentColor"
                  className={decStyle.text}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(dec.confidence.total / 100) * 264} 264`}
                  style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-black font-mono ${decStyle.text}`}>{dec.confidence.total}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Confidence Breakdown ── */}
        <motion.div variants={itemVariants} className="terminal-panel">
          <div className="terminal-header">
            <span className="dot" />
            <span>CONFIDENCE MATRIX</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Data Completeness', value: dec.confidence.dataCompleteness, max: 30 },
              { label: 'Source Quality', value: dec.confidence.sourceQuality, max: 20 },
              { label: 'Signal Coherence', value: dec.confidence.signalCoherence, max: 30 },
              { label: 'Evidence Strength', value: dec.confidence.evidenceStrength, max: 20 },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                  <span className="uppercase tracking-wider">{d.label}</span>
                  <span className="text-neon-cyan">{d.value}/{d.max}</span>
                </div>
                <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-cyan rounded-full transition-all"
                    style={{
                      width: `${(d.value / d.max) * 100}%`,
                      boxShadow: '0 0 8px oklch(0.82 0.18 195 / 0.4)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Key Financial Metrics (spans 2 cols on xl) ── */}
        <motion.div variants={itemVariants} className="terminal-panel xl:col-span-2">
          <div className="terminal-header">
            <span className="dot" />
            <BarChart3 className="w-3 h-3" />
            <span>FINANCIAL METRICS</span>
          </div>
          <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              { label: 'Price', value: `$${numFmt((report as any).companyOverview?.currentPrice)}`, icon: Activity },
              { label: 'Mkt Cap', value: fmt((report as any).companyOverview?.marketCap), icon: Building2 },
              { label: 'P/E', value: numFmt((report as any).companyOverview?.peRatio), icon: Target },
              { label: 'PEG', value: numFmt((report as any).companyOverview?.pegRatio), icon: Zap },
            ].map((m) => (
              <div key={m.label} className="p-3 bg-secondary/30 rounded border border-border/40 text-center">
                <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                <div className="text-lg font-bold font-mono text-foreground">{m.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Executive Summary (spans 2 cols) ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header">
            <span className="dot" />
            <Brain className="w-3 h-3" />
            <span>EXECUTIVE SUMMARY</span>
          </div>
          <div className="p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            {report.executiveSummary.split('\n').filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </motion.div>

        {/* ── Financial Analysis (spans 2 cols) ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header">
            <span className="dot" />
            <TrendingUp className="w-3 h-3" />
            <span>FINANCIAL ANALYSIS</span>
          </div>
          <div className="p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            {report.financialAnalysis.split('\n').filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </motion.div>

        {/* ── Opportunities (spans 2 cols) ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header">
            <span className="dot" style={{ background: 'oklch(0.75 0.22 155)', boxShadow: '0 0 6px oklch(0.75 0.22 155)' }} />
            <Zap className="w-3 h-3 text-neon-green" />
            <span className="text-neon-green/70">GROWTH OPPORTUNITIES</span>
          </div>
          <div className="p-4 space-y-2">
            {report.opportunities.length > 0 ? report.opportunities.map((opp, i) => (
              <div key={i} className="p-3 bg-neon-green/5 border border-neon-green/10 rounded flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground/90">{opp.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{opp.description}</p>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-xs font-mono px-3">No significant opportunities identified.</p>
            )}
          </div>
        </motion.div>

        {/* ── Risks (spans 2 cols) ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header">
            <span className="dot" style={{ background: 'oklch(0.65 0.22 25)', boxShadow: '0 0 6px oklch(0.65 0.22 25)' }} />
            <AlertTriangle className="w-3 h-3 text-neon-red" />
            <span className="text-neon-red/70">RISK ASSESSMENT</span>
          </div>
          <div className="p-4 space-y-2">
            {report.risks.length > 0 ? report.risks.map((risk, i) => (
              <div key={i} className="p-3 bg-neon-red/5 border border-neon-red/10 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                    risk.severity === 'high' ? 'bg-neon-red/15 text-neon-red border border-neon-red/25' :
                    risk.severity === 'medium' ? 'bg-neon-orange/15 text-neon-orange border border-neon-orange/25' :
                    'bg-watchlist/15 text-watchlist border border-watchlist/25'
                  }`}>
                    {risk.severity}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{risk.category}</span>
                </div>
                <h4 className="font-semibold text-sm text-foreground/90">{risk.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{risk.description}</p>
              </div>
            )) : (
              <p className="text-muted-foreground text-xs font-mono px-3">No significant risks identified.</p>
            )}
          </div>
        </motion.div>

        {/* ── Investment Thesis ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header">
            <span className="dot" />
            <Shield className="w-3 h-3" />
            <span>INVESTMENT THESIS</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {dec.thesisSummary}
            </p>
            <div>
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">REASONING TRACE</h3>
              <ul className="space-y-2">
                {dec.reasoning.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2 font-mono">
                    <span className="text-neon-cyan flex-shrink-0">[{String(i + 1).padStart(2, '0')}]</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* ── Sources / Data Feed ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header">
            <span className="dot" />
            <Newspaper className="w-3 h-3" />
            <span>DATA SOURCES ({report.sources.length})</span>
          </div>
          <div className="p-4 space-y-1.5 max-h-64 overflow-y-auto">
            {report.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-muted-foreground hover:bg-neon-cyan/5 hover:text-neon-cyan transition-colors group"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity" />
                <span className="truncate">{s.title}</span>
              </a>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
