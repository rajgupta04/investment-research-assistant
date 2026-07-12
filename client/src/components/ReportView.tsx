import { useState, useRef, useMemo } from 'react';
import type { FinalReport, HistoricalPricePoint } from '@repo/shared';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Shield,
  FileDown,
  ExternalLink,
  Zap,
  Activity,
  BarChart3,
  Newspaper,
  Brain,
  ChevronRight,
} from 'lucide-react';

interface ReportViewProps {
  report: FinalReport;
}

/* ─── helpers ──────────────────────────────────────────── */

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function pct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function numFmt(n: number | null | undefined, prefix = '', suffix = ''): string {
  if (n == null) return '—';
  return `${prefix}${n.toFixed(2)}${suffix}`;
}

type TimePeriod = '7D' | '1M' | '3M' | '6M' | '1Y';

function filterByPeriod(prices: HistoricalPricePoint[], period: TimePeriod): HistoricalPricePoint[] {
  if (prices.length === 0) return [];
  const now = new Date();
  const msMap: Record<TimePeriod, number> = {
    '7D': 7 * 86400000,
    '1M': 30 * 86400000,
    '3M': 90 * 86400000,
    '6M': 180 * 86400000,
    '1Y': 365 * 86400000,
  };
  const cutoff = new Date(now.getTime() - msMap[period]);
  return prices.filter((p) => new Date(p.date) >= cutoff);
}

/* ─── main component ───────────────────────────────────── */

export function ReportView({ report }: ReportViewProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [chartPeriod, setChartPeriod] = useState<TimePeriod>('1Y');
  const dec = report.investmentDecision;
  const fin = report.financialData;
  const co = report.companyOverview;

  const chartData = useMemo(() => {
    if (!fin?.historicalPrices?.length) return [];
    return filterByPeriod(fin.historicalPrices, chartPeriod);
  }, [fin?.historicalPrices, chartPeriod]);

  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].close;
    const last = chartData[chartData.length - 1].close;
    return { abs: last - first, pct: ((last - first) / first) * 100 };
  }, [chartData]);

  const handleDownloadPdf = () => {
    // Set a temporary document title for the PDF filename
    const originalTitle = document.title;
    document.title = `${co.name}_Investment_Report`;
    window.print();
    document.title = originalTitle;
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

  const isPositive = priceChange ? priceChange.pct >= 0 : null;

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const periods: TimePeriod[] = ['7D', '1M', '3M', '6M', '1Y'];

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-3 pb-16">

      {/* ─── TOP BAR ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{co.name}</h1>
            {co.ticker && <span className="font-mono text-sm px-2.5 py-0.5 bg-neon-cyan/10 border border-neon-cyan/25 rounded text-neon-cyan">{co.ticker}</span>}
          </div>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">
            {[co.sector, co.industry].filter(Boolean).join(' / ') || 'Technology'}
            <span className="mx-2 text-border">|</span>
            <span className="text-muted-foreground/50">Generated {new Date(report.generatedAt).toLocaleString()}</span>
          </p>
        </div>
        <button onClick={handleDownloadPdf} className="no-print flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/25 rounded font-mono text-xs uppercase tracking-wider text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/40 hover:shadow-[0_0_15px_oklch(0.82_0.18_195/0.15)] transition-all active:scale-95">
          <FileDown className="w-3.5 h-3.5" /> Export PDF
        </button>
      </motion.div>

      {/* ─── DASHBOARD ───────────────────────────────── */}
      <motion.div ref={dashboardRef} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

        {/* ── Decision ── */}
        <motion.div variants={itemVariants} className={`terminal-panel ${decStyle.bg} p-0`}>
          <div className="terminal-header"><span className="dot" /><span>VERDICT</span></div>
          <div className="p-5 text-center space-y-3">
            <div className={`text-4xl font-black font-mono tracking-tight ${decStyle.text} ${decStyle.glow}`}>{dec.recommendation}</div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Confidence</div>
            <div className="relative mx-auto w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.22 0.015 250)" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className={decStyle.text} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(dec.confidence.total / 100) * 264} 264`} style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-black font-mono ${decStyle.text}`}>{dec.confidence.total}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Confidence Matrix ── */}
        <motion.div variants={itemVariants} className="terminal-panel">
          <div className="terminal-header"><span className="dot" /><span>CONFIDENCE MATRIX</span></div>
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
                  <div className="h-full bg-neon-cyan rounded-full transition-all" style={{ width: `${(d.value / d.max) * 100}%`, boxShadow: '0 0 8px oklch(0.82 0.18 195 / 0.4)' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Financial Metrics Grid (spans 2 cols) ── */}
        <motion.div variants={itemVariants} className="terminal-panel xl:col-span-2">
          <div className="terminal-header"><span className="dot" /><BarChart3 className="w-3 h-3" /><span>FINANCIAL METRICS</span></div>
          {fin?.available ? (
            <div className="p-4 grid grid-cols-4 gap-2">
              {[
                { label: 'Price', value: numFmt(fin.currentPrice, '$') },
                { label: 'Mkt Cap', value: fmt(fin.marketCap) },
                { label: 'P/E', value: numFmt(fin.peRatio) },
                { label: 'PEG', value: numFmt(fin.pegRatio) },
                { label: 'P/B', value: numFmt(fin.priceToBook) },
                { label: 'D/E', value: numFmt(fin.debtToEquity) },
                { label: 'ROE', value: pct(fin.returnOnEquity) },
                { label: 'Div Yield', value: pct(fin.dividendYield) },
                { label: 'Rev Growth', value: pct(fin.revenueGrowthYoY) },
                { label: 'EPS Growth', value: pct(fin.earningsGrowthYoY) },
                { label: '52W High', value: numFmt(fin.fiftyTwoWeekHigh, '$') },
                { label: '52W Low', value: numFmt(fin.fiftyTwoWeekLow, '$') },
              ].map((m) => (
                <div key={m.label} className="p-2.5 bg-secondary/30 rounded border border-border/40 text-center">
                  <div className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-0.5">{m.label}</div>
                  <div className="text-sm font-bold font-mono text-foreground">{m.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-xs font-mono">Financial data unavailable for this company.</div>
          )}
        </motion.div>

        {/* ── Company Profile Tile ── */}
        <motion.div variants={itemVariants} className="terminal-panel">
          <div className="terminal-header"><span className="dot" /><span>COMPANY PROFILE</span></div>
          <div className="p-4 space-y-2.5">
            {[
              { label: 'HQ', value: co.headquarters },
              { label: 'Founded', value: co.founded },
              { label: 'CEO', value: co.ceo },
              { label: 'Employees', value: co.employees },
              { label: 'Exchange', value: co.exchange },
            ].filter(d => d.value).map((d) => (
              <div key={d.label} className="flex justify-between items-center text-xs">
                <span className="font-mono text-muted-foreground/50 uppercase tracking-wider text-[9px]">{d.label}</span>
                <span className="font-mono text-foreground/80 text-right max-w-[60%] truncate">{d.value}</span>
              </div>
            ))}
            {co.description && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-4">{co.description}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Analyst Target Tile ── */}
        {fin?.available && fin.analystTargetPrice != null && fin.currentPrice != null && (
          <motion.div variants={itemVariants} className="terminal-panel">
            <div className="terminal-header"><span className="dot" /><span>ANALYST TARGET</span></div>
            <div className="p-5 text-center space-y-3">
              <div className="text-3xl font-black font-mono text-neon-cyan">${fin.analystTargetPrice.toFixed(2)}</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Consensus Price Target</div>
              {(() => {
                const upside = ((fin.analystTargetPrice - fin.currentPrice) / fin.currentPrice) * 100;
                const isUp = upside >= 0;
                return (
                  <div className={`inline-block px-3 py-1 rounded text-xs font-mono font-bold ${isUp ? 'bg-neon-green/10 text-neon-green border border-neon-green/25' : 'bg-neon-red/10 text-neon-red border border-neon-red/25'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(upside).toFixed(1)}% {isUp ? 'Upside' : 'Downside'}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* ── Price Chart (spans full width) ── */}
        {fin?.available && chartData.length > 0 && (
          <motion.div variants={itemVariants} className="terminal-panel xl:col-span-4">
            <div className="terminal-header">
              <span className="dot" />
              <Activity className="w-3 h-3" />
              <span>PRICE HISTORY</span>
              {priceChange && (
                <span className={`ml-2 ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
                  {isPositive ? '+' : ''}{priceChange.abs.toFixed(2)} ({isPositive ? '+' : ''}{priceChange.pct.toFixed(2)}%)
                </span>
              )}
              <div className="ml-auto flex gap-1 no-print">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                      chartPeriod === p
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40'
                        : 'text-muted-foreground/40 hover:text-muted-foreground/70 border border-transparent'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? 'oklch(0.78 0.22 150)' : 'oklch(0.65 0.22 25)'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isPositive ? 'oklch(0.78 0.22 150)' : 'oklch(0.65 0.22 25)'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 250)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'oklch(0.55 0 0)', fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} interval="preserveStartEnd" minTickGap={50} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'oklch(0.55 0 0)', fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `$${v}`} width={55} />
                  <Tooltip contentStyle={{ background: 'oklch(0.12 0.01 250)', border: '1px solid oklch(0.82 0.18 195 / 0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '11px' }} labelFormatter={(v) => new Date(v).toLocaleDateString()} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Close']} />
                  <Area type="monotone" dataKey="close" stroke={isPositive ? 'oklch(0.78 0.22 150)' : 'oklch(0.65 0.22 25)'} strokeWidth={1.5} fill="url(#priceGradient)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* 52-Week Range Bar */}
            {fin.fiftyTwoWeekLow != null && fin.fiftyTwoWeekHigh != null && fin.currentPrice != null && (
              <div className="px-4 pb-4">
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50 mb-1">
                  <span>52W Low: ${fin.fiftyTwoWeekLow.toFixed(2)}</span>
                  <span>52W High: ${fin.fiftyTwoWeekHigh.toFixed(2)}</span>
                </div>
                <div className="relative h-2 bg-border/40 rounded-full">
                  <div className="absolute h-full bg-gradient-to-r from-neon-red/40 via-neon-cyan/40 to-neon-green/40 rounded-full" style={{ width: '100%' }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-neon-cyan rounded-full border-2 border-background" style={{ left: `${((fin.currentPrice - fin.fiftyTwoWeekLow) / (fin.fiftyTwoWeekHigh - fin.fiftyTwoWeekLow)) * 100}%`, boxShadow: '0 0 8px oklch(0.82 0.18 195 / 0.5)', transform: 'translate(-50%, -50%)' }} />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Executive Summary ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header"><span className="dot" /><Brain className="w-3 h-3" /><span>EXECUTIVE SUMMARY</span></div>
          <div className="p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            {report.executiveSummary.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </motion.div>

        {/* ── Financial Analysis ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header"><span className="dot" /><TrendingUp className="w-3 h-3" /><span>FINANCIAL ANALYSIS</span></div>
          <div className="p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            {report.financialAnalysis.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </motion.div>

        {/* ── Opportunities ── */}
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
            )) : <p className="text-muted-foreground text-xs font-mono px-3">No significant opportunities identified.</p>}
          </div>
        </motion.div>

        {/* ── Risks ── */}
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
                  }`}>{risk.severity}</span>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{risk.category}</span>
                </div>
                <h4 className="font-semibold text-sm text-foreground/90">{risk.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{risk.description}</p>
              </div>
            )) : <p className="text-muted-foreground text-xs font-mono px-3">No significant risks identified.</p>}
          </div>
        </motion.div>

        {/* ── Investment Thesis ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header"><span className="dot" /><Shield className="w-3 h-3" /><span>INVESTMENT THESIS</span></div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{dec.thesisSummary}</p>
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

        {/* ── Sources ── */}
        <motion.div variants={itemVariants} className="terminal-panel md:col-span-2">
          <div className="terminal-header"><span className="dot" /><Newspaper className="w-3 h-3" /><span>DATA SOURCES ({report.sources.length})</span></div>
          <div className="p-4 space-y-1.5 max-h-64 overflow-y-auto">
            {report.sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-muted-foreground hover:bg-neon-cyan/5 hover:text-neon-cyan transition-colors group">
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
