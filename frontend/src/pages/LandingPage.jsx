import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  ChevronRight, Terminal, Shield, Cpu, LayoutDashboard,
  LineChart, BrainCircuit, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, Activity, History, DollarSign,
  Zap, BarChart3, Lock, Globe, Database, Server, Loader
} from 'lucide-react';

const TICKER_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'WIPRO.NS',
  'SBIN.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS'
];

const MOCK_CANDLES = [
  { o: 40, c: 65, h: 75, l: 30, up: true },
  { o: 65, c: 55, h: 70, l: 45, up: false },
  { o: 55, c: 70, h: 80, l: 50, up: true },
  { o: 70, c: 60, h: 75, l: 52, up: false },
  { o: 60, c: 78, h: 85, l: 55, up: true },
  { o: 78, c: 72, h: 82, l: 65, up: false },
  { o: 72, c: 88, h: 92, l: 68, up: true },
  { o: 88, c: 80, h: 90, l: 74, up: false },
  { o: 80, c: 95, h: 100, l: 76, up: true },
  { o: 95, c: 85, h: 98, l: 78, up: false },
  { o: 85, c: 92, h: 96, l: 80, up: true },
  { o: 92, c: 88, h: 95, l: 82, up: false },
  { o: 88, c: 98, h: 105, l: 84, up: true },
  { o: 98, c: 90, h: 102, l: 86, up: false },
  { o: 90, c: 105, h: 110, l: 88, up: true },
  { o: 105, c: 95, h: 108, l: 90, up: false },
  { o: 95, c: 110, h: 115, l: 92, up: true },
  { o: 110, c: 102, h: 112, l: 96, up: false },
  { o: 102, c: 115, h: 120, l: 98, up: true },
  { o: 115, c: 108, h: 118, l: 100, up: false },
];

const TickerBar = ({ quotes }) => (
  <div className="w-full bg-black border-b border-bb-gray overflow-hidden h-8 flex items-center">
    <div className="animate-ticker flex whitespace-nowrap">
      {[...quotes, ...quotes].map((t, i) => (
        <span key={i} className="inline-flex items-center gap-2 px-6 font-mono text-xs">
          <span className="text-bb-orange font-bold">{t.symbol?.replace('.NS', '')}</span>
          <span className="text-white">₹{t.price?.toLocaleString()}</span>
          <span className={t.change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}>
            {t.change_pct >= 0 ? '+' : ''}{t.change_pct}%
          </span>
        </span>
      ))}
    </div>
  </div>
);

const SectionHeader = ({ label, title }) => (
  <div className="mb-10">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-gradient-to-r from-bb-orange/50 to-transparent" />
      <span className="text-bb-orange text-[10px] font-mono tracking-[0.3em] font-bold">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-bb-orange/50 to-transparent" />
    </div>
    <h2 className="text-3xl md:text-4xl font-black text-bb-text text-center tracking-tight font-mono">
      {title}
    </h2>
  </div>
);

const StatBox = ({ label, value, sub, positive }) => (
  <div className="bg-bb-dark border border-bb-gray p-5 hover:border-bb-orange/50 transition-colors">
    <div className="text-bb-muted text-[10px] font-bold tracking-widest mb-2">{label}</div>
    <div className="text-2xl font-mono font-bold text-bb-text mb-1 tabular-nums">{value}</div>
    <div className={`text-[11px] font-bold flex items-center gap-1 ${positive ? 'text-bb-green' : 'text-bb-red'}`}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {sub}
    </div>
  </div>
);

const MockCandlestickChart = () => (
  <div className="flex items-end gap-[6px] h-28 px-4">
    {MOCK_CANDLES.map((c, i) => {
      const bodyTop = Math.max(c.o, c.c);
      const bodyBot = Math.min(c.o, c.c);
      const bodyH = bodyTop - bodyBot;
      const wickTop = c.h - bodyTop;
      const wickBot = bodyBot - c.l;
      return (
        <div key={i} className="flex flex-col items-center" style={{ height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ height: `${wickTop * 0.8}px`, width: '1px' }} className={c.up ? 'bg-bb-green' : 'bg-bb-red'} />
          <div style={{ height: `${Math.max(bodyH * 0.8, 2)}px`, width: '8px', borderRadius: '1px' }} className={c.up ? 'bg-bb-green' : 'bg-bb-red'} />
          <div style={{ height: `${wickBot * 0.8}px`, width: '1px' }} className={c.up ? 'bg-bb-green' : 'bg-bb-red'} />
        </div>
      );
    })}
  </div>
);

const useIntersectionObserver = () => {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    const sections = document.querySelectorAll('.landing-section');
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return ref;
};

const LiveStockCard = ({ quote }) => {
  if (!quote) return null;
  const isUp = quote.change_pct >= 0;
  return (
    <div className="bg-bb-dark border border-bb-gray p-4 hover:border-bb-orange/50 transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-bb-orange font-mono font-bold text-sm">{quote.symbol?.replace('.NS', '')}</span>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 ${isUp ? 'bg-bb-green/10 text-bb-green' : 'bg-bb-red/10 text-bb-red'}`}>
          {isUp ? '+' : ''}{quote.change_pct}%
        </span>
      </div>
      <div className="text-xl font-mono font-bold text-bb-text tabular-nums mb-1">₹{quote.price?.toLocaleString()}</div>
      <div className={`text-[10px] font-mono flex items-center gap-1 ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>
        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {isUp ? '+' : ''}₹{quote.change}
      </div>
      <div className="mt-2 flex gap-3 text-[9px] font-mono text-bb-muted">
        <span>H: ₹{quote.high}</span>
        <span>L: ₹{quote.low}</span>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  useIntersectionObserver();
  const [tickerQuotes, setTickerQuotes] = useState([]);
  const [topMovers, setTopMovers] = useState([]);
  const [tickerLoading, setTickerLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const quotes = await api.getMultiQuotes(TICKER_SYMBOLS);
        setTickerQuotes(quotes);
        const sorted = [...quotes].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct));
        setTopMovers(sorted.slice(0, 6));
      } catch (e) {
        setTickerQuotes(TICKER_SYMBOLS.map(s => ({ symbol: s, price: 0, change: 0, change_pct: 0 })));
      }
      setTickerLoading(false);
    };

    const fetchStatus = async () => {
      try {
        const status = await api.getMarketStatus();
        setMarketStatus(status);
      } catch (e) { }
    };

    fetchLive();
    fetchStatus();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bb-black text-bb-text font-sans relative transition-colors duration-300">
      {tickerQuotes.length > 0 ? <TickerBar quotes={tickerQuotes} /> : (
        <div className="w-full bg-bb-black border-b border-bb-gray h-8 flex items-center justify-center">
          <Loader size={14} className="text-bb-orange animate-spin" />
          <span className="text-[10px] font-mono text-bb-muted ml-2">LOADING LIVE MARKET DATA...</span>
        </div>
      )}




      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20">
        <h1 className="animate-fade-in-up-delay-1 text-7xl md:text-[9rem] font-black tracking-tighter text-bb-text mb-4 font-mono leading-none">
          ALGO<span className="text-bb-orange">.</span>X
        </h1>

        <p className="animate-fade-in-up-delay-2 text-bb-muted text-lg md:text-xl max-w-2xl text-center mb-12 leading-relaxed">
          Institutional-grade algorithmic trading infrastructure.
        </p>

        <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/app/dashboard')}
            className="group flex items-center gap-3 bg-bb-orange text-black px-8 py-4 text-sm font-bold tracking-[0.2em] hover:bg-white transition-all duration-300"
          >
            INITIALIZE TERMINAL
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="flex items-center gap-3 border border-bb-gray text-bb-muted px-8 py-4 text-sm font-bold tracking-[0.2em] hover:border-bb-orange hover:text-bb-orange transition-all duration-300"
          >
            EXPLORE MODULES
          </a>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-8 text-center max-w-lg">
          <div>
            <div className="text-2xl font-mono font-black text-bb-text">10+</div>
            <div className="text-[10px] text-bb-muted tracking-widest mt-1">API ENDPOINTS</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-black text-bb-text">&lt;50ms</div>
            <div className="text-[10px] text-bb-muted tracking-widest mt-1">AVG LATENCY</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-black text-bb-text">1500+</div>
            <div className="text-[10px] text-bb-muted tracking-widest mt-1">NSE STOCKS</div>
          </div>
        </div>
      </section>

      <section className="landing-section py-16 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="LIVE DATA" title="MARKET MOVERS" />
        <div className="max-w-6xl mx-auto">
          {tickerLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="text-bb-orange animate-spin" />
              <span className="text-bb-muted font-mono text-sm ml-3">FETCHING LIVE PRICES...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {topMovers.map((q, i) => (
                  <LiveStockCard key={i} quote={q} />
                ))}
              </div>
              <div className="text-center text-[10px] font-mono text-bb-muted">
                LIVE PRICES | AUTO-REFRESH: 60s | {tickerQuotes.length} FEEDS ACTIVE
              </div>
            </>
          )}
        </div>
      </section>

      <section id="features" className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="MODULES" title="PLATFORM ARCHITECTURE" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-bb-dark border border-bb-gray p-8 hover:border-bb-orange/50 transition-all group cursor-pointer" onClick={() => navigate('/app/dashboard')}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 border border-bb-gray group-hover:border-bb-orange/50 transition-colors">
                <LayoutDashboard size={20} className="text-bb-orange" />
              </div>
              <div>
                <h3 className="text-bb-text font-bold text-sm tracking-wider">DASHBOARD</h3>
                <div className="text-[10px] text-bb-muted tracking-wider">MODULE 01</div>
              </div>
            </div>
            <p className="text-bb-muted text-sm leading-relaxed mb-6">
              Real-time portfolio tracking with live P&L calculations, position management, and multi-symbol price feeds.
            </p>
            <div className="border-t border-bb-gray pt-4 space-y-2 text-[11px] font-mono text-bb-muted">
              <div className="flex justify-between"><span>Live P&L Calculator</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Auto-Refresh (30s)</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Multi-Quote Feeds</span><span className="text-bb-green">ACTIVE</span></div>
            </div>
          </div>

          <div className="bg-bb-dark border border-bb-gray p-8 hover:border-bb-orange/50 transition-all group cursor-pointer" onClick={() => navigate('/app/terminal')}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 border border-bb-gray group-hover:border-bb-orange/50 transition-colors">
                <LineChart size={20} className="text-bb-orange" />
              </div>
              <div>
                <h3 className="text-bb-text font-bold text-sm tracking-wider">TRADING TERMINAL</h3>
                <div className="text-[10px] text-bb-muted tracking-wider">MODULE 02</div>
              </div>
            </div>
            <p className="text-bb-muted text-sm leading-relaxed mb-6">
              Full-featured trading with candlestick charts, smart symbol search, company fundamentals, and instant order execution.
            </p>
            <div className="border-t border-bb-gray pt-4 space-y-2 text-[11px] font-mono text-bb-muted">
              <div className="flex justify-between"><span>Symbol Autocomplete</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Company Info</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>15s Price Refresh</span><span className="text-bb-green">ACTIVE</span></div>
            </div>
          </div>

          <div className="bg-bb-dark border border-bb-gray p-8 hover:border-bb-orange/50 transition-all group cursor-pointer" onClick={() => navigate('/app/research')}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 border border-bb-gray group-hover:border-bb-orange/50 transition-colors">
                <BrainCircuit size={20} className="text-bb-orange" />
              </div>
              <div>
                <h3 className="text-bb-text font-bold text-sm tracking-wider">RESEARCH LAB</h3>
                <div className="text-[10px] text-bb-muted tracking-wider">MODULE 03</div>
              </div>
            </div>
            <p className="text-bb-muted text-sm leading-relaxed mb-6">
              Random Forest prediction engine with SMA backtesting, sentiment analysis, and company fundamentals research.
            </p>
            <div className="border-t border-bb-gray pt-4 space-y-2 text-[11px] font-mono text-bb-muted">
              <div className="flex justify-between"><span>ML Predictions</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>SMA Backtesting</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Sentiment Score</span><span className="text-bb-green">ACTIVE</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="MODULE 01" title="PORTFOLIO DASHBOARD" />
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {tickerQuotes.length > 0 ? (
              <>
                <StatBox label="LIVE FEEDS" value={tickerQuotes.length} sub="Streaming Prices" positive={true} />
                <StatBox
                  label="TOP GAINER"
                  value={tickerQuotes.sort((a, b) => b.change_pct - a.change_pct)[0]?.symbol?.replace('.NS', '') || '—'}
                  sub={`+${tickerQuotes.sort((a, b) => b.change_pct - a.change_pct)[0]?.change_pct || 0}%`}
                  positive={true}
                />
                <StatBox
                  label="TOP LOSER"
                  value={tickerQuotes.sort((a, b) => a.change_pct - b.change_pct)[0]?.symbol?.replace('.NS', '') || '—'}
                  sub={`${tickerQuotes.sort((a, b) => a.change_pct - b.change_pct)[0]?.change_pct || 0}%`}
                  positive={false}
                />
                <StatBox label="DATA POINTS" value="24/7" sub="Real-time Market Data" positive={true} />
              </>
            ) : (
              <>
                <StatBox label="TOTAL POSITIONS" value="—" sub="Loading..." positive={true} />
                <StatBox label="ACTIVE SYMBOLS" value="—" sub="Loading..." positive={true} />
                <StatBox label="CASH BALANCE" value="—" sub="Loading..." positive={true} />
                <StatBox label="DAILY P&L" value="—" sub="Loading..." positive={true} />
              </>
            )}
          </div>

          <div className="bg-bb-dark border border-bb-gray">
            <div className="p-4 border-b border-bb-gray flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-bb-orange" />
                <span className="text-xs font-bold tracking-wider text-bb-text">LIVE MARKET PRICES</span>
              </div>
              <span className="text-[10px] text-bb-muted font-mono">REFRESHING EVERY 60s</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-bb-muted font-mono text-[10px]">
                <tr>
                  <th className="p-4 tracking-wider">SYMBOL</th>
                  <th className="p-4 tracking-wider">PRICE</th>
                  <th className="p-4 tracking-wider">CHANGE</th>
                  <th className="p-4 tracking-wider">HIGH</th>
                  <th className="p-4 tracking-wider">LOW</th>
                  <th className="p-4 tracking-wider text-right">VOLUME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bb-gray/20 font-mono text-sm">
                {tickerQuotes.length > 0 ? tickerQuotes.map((q) => (
                  <tr key={q.symbol} className="hover:bg-bb-gray/20 transition-colors">
                    <td className="p-4 font-bold text-bb-orange">{q.symbol?.replace('.NS', '')}</td>
                    <td className="p-4 text-bb-text tabular-nums">₹{q.price?.toLocaleString()}</td>
                    <td className={`p-4 font-bold tabular-nums ${q.change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                      {q.change_pct >= 0 ? '+' : ''}{q.change_pct}%
                    </td>
                    <td className="p-4 text-bb-muted tabular-nums">₹{q.high}</td>
                    <td className="p-4 text-bb-muted tabular-nums">₹{q.low}</td>
                    <td className="p-4 text-right text-bb-muted tabular-nums">{q.volume?.toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="p-8 text-center text-bb-muted">Loading live prices...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="MODULE 02" title="TRADING TERMINAL" />

        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-9">
            <div className="bg-bb-dark border border-bb-gray p-4 flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-black border border-bb-gray px-4 py-2 font-mono text-bb-orange font-bold text-sm">
                  {tickerQuotes[1]?.symbol?.replace('.NS', '') || 'TCS'}
                </div>
                <div className="bg-bb-gray px-3 py-2 text-[10px] font-bold text-bb-muted tracking-wider">
                  LOAD TICKER
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-bb-text tabular-nums">
                  ₹{tickerQuotes[1]?.price?.toLocaleString() || '—'}
                </div>
                {tickerQuotes[1] && (
                  <div className={`text-[10px] font-mono ${tickerQuotes[1].change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                    {tickerQuotes[1].change_pct >= 0 ? '+' : ''}{tickerQuotes[1].change_pct}%
                  </div>
                )}
              </div>
            </div>

            <div className="bg-bb-dark border border-bb-gray p-6 min-h-[280px] flex flex-col justify-between">
              <div className="flex justify-between text-[10px] font-mono text-bb-muted mb-2">
                <span>HIGH: ₹{tickerQuotes[1]?.high || '—'}</span>
                <span>OHLC CANDLESTICK</span>
                <span>VOL: {tickerQuotes[1]?.volume?.toLocaleString() || '—'}</span>
              </div>
              <div className="flex-1 flex items-end justify-center">
                <MockCandlestickChart />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-bb-muted mt-2">
                <span>LOW: ₹{tickerQuotes[1]?.low || '—'}</span>
                <span>1D | 1W | 1M | 3M | 1Y</span>
                <span>OPEN: ₹{tickerQuotes[1]?.open || '—'}</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
            <div className="bg-bb-dark border border-bb-gray p-6">
              <div className="text-bb-muted text-[10px] font-bold tracking-widest mb-5">ORDER ENTRY</div>
              <div className="flex bg-black p-1 mb-5 border border-bb-gray">
                <div className="flex-1 py-2 text-[10px] font-bold text-center text-bb-muted">INTRADAY</div>
                <div className="flex-1 py-2 text-[10px] font-bold text-center bg-bb-orange text-black">DELIVERY</div>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-bb-green/90 text-black py-3 font-bold text-sm text-center flex justify-center items-center gap-2">
                  <ArrowUp size={16} /> BUY MKT
                </div>
                <div className="w-full bg-bb-red/90 text-black py-3 font-bold text-sm text-center flex justify-center items-center gap-2">
                  <ArrowDown size={16} /> SELL MKT
                </div>
              </div>
            </div>

            <div className="bg-bb-dark border border-bb-gray flex-1">
              <div className="p-3 border-b border-bb-gray text-[10px] font-bold text-bb-muted flex items-center gap-2">
                <History size={12} /> EXECUTION LOG
              </div>
              <div className="p-2 space-y-1">
                {[
                  { side: 'BUY', sym: tickerQuotes[1]?.symbol?.replace('.NS', '') || 'TCS', price: tickerQuotes[1]?.price || '0' },
                  { side: 'SELL', sym: tickerQuotes[2]?.symbol?.replace('.NS', '') || 'INFY', price: tickerQuotes[2]?.price || '0' },
                  { side: 'BUY', sym: tickerQuotes[5]?.symbol?.replace('.NS', '') || 'SBIN', price: tickerQuotes[5]?.price || '0' },
                  { side: 'BUY', sym: tickerQuotes[0]?.symbol?.replace('.NS', '') || 'RELIANCE', price: tickerQuotes[0]?.price || '0' },
                  { side: 'SELL', sym: tickerQuotes[4]?.symbol?.replace('.NS', '') || 'WIPRO', price: tickerQuotes[4]?.price || '0' },
                ].map((t, i) => (
                  <div key={i} className="text-[10px] font-mono flex justify-between p-2 hover:bg-white/5 border-b border-white/5">
                    <span className={t.side === 'BUY' ? 'text-bb-green' : 'text-bb-red'}>{t.side}</span>
                    <span className="text-bb-text">{t.sym}</span>
                    <span className="text-bb-muted">@₹{t.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="MODULE 03" title="RESEARCH LAB" />

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bb-dark border border-bb-gray p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-5">
              <BrainCircuit size={120} className="text-bb-orange" />
            </div>
            <div className="text-bb-muted text-[10px] font-bold tracking-widest mb-6">PREDICTIVE MODEL (24H)</div>
            <div className="text-6xl font-black text-bb-text mb-2 font-mono">BUY</div>
            <div className="text-bb-orange font-mono text-xl mb-6">CONFIDENCE: 78.3%</div>
            <div className="border-t border-bb-gray pt-4 space-y-3">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-bb-muted">MODEL TYPE</span>
                <span className="text-bb-text">Random Forest</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-bb-muted">FEATURES ANALYZED</span>
                <span className="text-bb-text">9 Indicators</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-bb-muted">SENTIMENT</span>
                <span className="text-bb-green">+0.7234</span>
              </div>
            </div>
          </div>

          <div className="bg-bb-dark border border-bb-gray p-8">
            <div className="text-bb-muted text-[10px] font-bold tracking-widest mb-6">HISTORICAL BACKTEST (1Y)</div>
            <div className="space-y-5">
              <div className="flex justify-between items-end border-b border-bb-gray pb-3">
                <span className="text-sm text-bb-muted">TOTAL RETURN</span>
                <span className="text-4xl font-mono font-bold text-bb-green">+23.4%</span>
              </div>
              <div className="flex justify-between items-center font-mono text-sm">
                <span className="text-bb-muted">TRADES EXECUTED</span>
                <span className="text-bb-text">156</span>
              </div>
              <div className="flex justify-between items-center font-mono text-sm">
                <span className="text-bb-muted">WIN RATE</span>
                <span className="text-bb-green">62.8%</span>
              </div>
              <div className="flex justify-between items-center font-mono text-sm">
                <span className="text-bb-muted">MAX DRAWDOWN</span>
                <span className="text-bb-red">-8.2%</span>
              </div>
              <div className="flex justify-between items-center font-mono text-sm">
                <span className="text-bb-muted">SHARPE RATIO</span>
                <span className="text-bb-text">1.87</span>
              </div>
              <div className="flex justify-between items-center font-mono text-sm">
                <span className="text-bb-muted">FINAL EQUITY</span>
                <span className="text-bb-text">₹1,23,400</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="INFRASTRUCTURE" title="SYSTEM ARCHITECTURE" />

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: <Zap size={18} />, label: 'LOW LATENCY', desc: 'Sub-50ms order execution pipeline' },
            { icon: <Lock size={18} />, label: 'RISK ENGINE', desc: 'Real-time position limits and exposure controls' },
            { icon: <Database size={18} />, label: 'DATA PIPELINE', desc: 'Historical OHLC with yFinance integration' },
            { icon: <Server size={18} />, label: 'FASTAPI BACKEND', desc: 'Async REST API with SQLAlchemy ORM' },
            { icon: <BarChart3 size={18} />, label: 'BACKTESTING', desc: 'SMA crossover strategy simulation engine' },
            { icon: <Globe size={18} />, label: 'MARKET ACCESS', desc: '80+ NSE equities with live price feeds' },
          ].map((item, i) => (
            <div key={i} className="bg-bb-dark border border-bb-gray p-6 hover:border-bb-orange/30 transition-colors">
              <div className="text-bb-orange mb-3">{item.icon}</div>
              <div className="text-bb-text text-xs font-bold tracking-wider mb-2">{item.label}</div>
              <div className="text-bb-muted text-[11px] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-bb-gray">
        <div className="max-w-6xl mx-auto py-16 px-4 md:px-12">
          <div className="bg-bb-dark border border-bb-orange/30 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,153,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,153,0,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-bb-text mb-4 font-mono tracking-tight">
                READY TO TRADE<span className="text-bb-orange">?</span>
              </h2>
              <p className="text-bb-muted text-sm mb-8 max-w-lg mx-auto">
                Initialize the terminal — access symbol search, company fundamentals, live prices, and ML predictions.
              </p>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="group inline-flex items-center gap-3 bg-bb-orange text-black px-10 py-4 text-sm font-bold tracking-[0.2em] hover:bg-white transition-all duration-300"
              >
                LAUNCH TERMINAL
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-bb-gray bg-bb-dark/50 py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-[10px] text-bb-muted font-mono">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${marketStatus?.status === 'OPEN' ? 'bg-bb-green' : 'bg-bb-red'} animate-pulse`} />
                ALL SYSTEMS OPERATIONAL
              </div>
              <span>|</span>
              <span>API v1.0</span>
              <span>|</span>
              <span>FastAPI + React</span>
            </div>
            <div className="flex items-center gap-6 text-[10px] text-bb-muted font-mono">
              <div className="flex items-center gap-2"><Cpu size={12} className="text-bb-orange" /> PREDICTION ENGINE</div>
              <div className="flex items-center gap-2"><Terminal size={12} className="text-bb-orange" /> LOW LATENCY</div>
              <div className="flex items-center gap-2"><Shield size={12} className="text-bb-orange" /> RISK MGMT</div>
            </div>
          </div>
        </div>
      </section>
    </div >
  );
};

export default LandingPage;