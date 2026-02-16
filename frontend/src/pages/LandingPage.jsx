import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  ChevronRight, Terminal, Shield, Cpu, LayoutDashboard,
  LineChart, BrainCircuit, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, Activity, History, DollarSign,
  Zap, BarChart3, Lock, Globe, Database, Server, Loader
} from 'lucide-react';

const NSE_TICKER = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'WIPRO.NS',
  'SBIN.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS'
];
const US_TICKER = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'JPM', 'V', 'NFLX'];

const MOCK_CANDLES = [
  { o: 40, c: 65, h: 75, l: 30, up: true }, { o: 65, c: 55, h: 70, l: 45, up: false },
  { o: 55, c: 70, h: 80, l: 50, up: true }, { o: 70, c: 60, h: 75, l: 52, up: false },
  { o: 60, c: 78, h: 85, l: 55, up: true }, { o: 78, c: 72, h: 82, l: 65, up: false },
  { o: 72, c: 88, h: 92, l: 68, up: true }, { o: 88, c: 80, h: 90, l: 74, up: false },
  { o: 80, c: 95, h: 100, l: 76, up: true }, { o: 95, c: 85, h: 98, l: 78, up: false },
  { o: 85, c: 92, h: 96, l: 80, up: true }, { o: 92, c: 88, h: 95, l: 82, up: false },
  { o: 88, c: 98, h: 105, l: 84, up: true }, { o: 98, c: 90, h: 102, l: 86, up: false },
  { o: 90, c: 105, h: 110, l: 88, up: true }, { o: 105, c: 95, h: 108, l: 90, up: false },
  { o: 95, c: 110, h: 115, l: 92, up: true }, { o: 110, c: 102, h: 112, l: 96, up: false },
  { o: 102, c: 115, h: 120, l: 98, up: true }, { o: 115, c: 108, h: 118, l: 100, up: false },
];

/* ── Reusable Components ─────────────────────────────────────────── */

const TickerBar = ({ nseQuotes, usQuotes }) => {
  const merged = [];
  const maxLen = Math.max(nseQuotes.length, usQuotes.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < nseQuotes.length) merged.push({ ...nseQuotes[i], market: 'NSE' });
    if (i < usQuotes.length) merged.push({ ...usQuotes[i], market: 'US' });
  }
  if (merged.length === 0) return null;
  const cur = (m) => m === 'US' ? '$' : '₹';
  return (
    <div className="w-full bg-black border-b border-bb-gray overflow-hidden h-8 flex items-center">
      <div className="animate-ticker flex whitespace-nowrap">
        {[...merged, ...merged].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 font-mono text-xs">
            <span className={`text-[9px] font-bold px-1 rounded ${t.market === 'US' ? 'bg-blue-500/20 text-blue-400' : 'bg-bb-orange/20 text-bb-orange'}`}>
              {t.market}
            </span>
            <span className="text-bb-orange font-bold">{t.symbol?.replace('.NS', '')}</span>
            <span className="text-bb-text">{cur(t.market)}{t.price?.toLocaleString()}</span>
            <span className={t.change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}>
              {t.change_pct >= 0 ? '+' : ''}{t.change_pct}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ label, title }) => (
  <div className="mb-12">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-gradient-to-r from-bb-orange/50 to-transparent" />
      <span className="text-bb-orange text-xs font-mono tracking-[0.3em] font-bold">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-bb-orange/50 to-transparent" />
    </div>
    <h2 className="text-4xl md:text-5xl font-black text-bb-text text-center tracking-tight font-mono">{title}</h2>
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
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); },
      { threshold: 0.1 }
    );
    const sections = document.querySelectorAll('.landing-section');
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
};

const LiveStockCard = ({ quote, currency = '₹' }) => {
  if (!quote) return null;
  const isUp = quote.change_pct >= 0;
  return (
    <div className="bg-bb-dark border border-bb-gray p-5 hover:border-bb-orange/50 transition-all">
      <div className="flex justify-between items-start mb-3">
        <span className="text-bb-orange font-mono font-bold text-base">{quote.symbol?.replace('.NS', '')}</span>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 ${isUp ? 'bg-bb-green/10 text-bb-green' : 'bg-bb-red/10 text-bb-red'}`}>
          {isUp ? '+' : ''}{quote.change_pct}%
        </span>
      </div>
      <div className="text-2xl font-mono font-bold text-bb-text tabular-nums mb-2">{currency}{quote.price?.toLocaleString()}</div>
      <div className={`text-xs font-mono flex items-center gap-1 ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>
        {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {isUp ? '+' : ''}{currency}{quote.change}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] font-mono text-bb-muted">
        <span>H: {currency}{quote.high}</span>
        <span>L: {currency}{quote.low}</span>
      </div>
    </div>
  );
};

const IndexCard = ({ name, value, change, changePct, status, flag }) => {
  const isUp = changePct >= 0;
  return (
    <div className="bg-bb-dark border border-bb-gray p-6 hover:border-bb-orange/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{flag}</span>
          <span className="text-sm font-bold text-bb-text tracking-wider">{name}</span>
        </div>
        <span className={`text-[11px] px-2.5 py-1 font-bold rounded ${status === 'OPEN' ? 'bg-bb-green/10 text-bb-green' : 'bg-bb-red/10 text-bb-red'}`}>
          {status || '—'}
        </span>
      </div>
      <div className="text-3xl font-mono font-bold text-bb-text tabular-nums mb-2">
        {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
      </div>
      <div className={`text-sm font-mono font-bold flex items-center gap-1 ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isUp ? '+' : ''}{change?.toFixed(2)} ({isUp ? '+' : ''}{changePct?.toFixed(2)}%)
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────────── */

const LandingPage = () => {
  const navigate = useNavigate();
  useIntersectionObserver();

  // Force dark mode on landing page
  useEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.add('dark');
    return () => {
      if (!wasDark) document.documentElement.classList.remove('dark');
    };
  }, []);

  const [nseQuotes, setNseQuotes] = useState([]);
  const [usQuotes, setUsQuotes] = useState([]);
  const [nseMovers, setNseMovers] = useState([]);
  const [usMovers, setUsMovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nseMarket, setNseMarket] = useState(null);
  const [usMarket, setUsMarket] = useState(null);
  const [nseIndices, setNseIndices] = useState(null);
  const [usIndices, setUsIndices] = useState(null);
  const [priceTab, setPriceTab] = useState('NSE');

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch NSE + US quotes in parallel
      const [nse, us] = await Promise.allSettled([
        api.getMultiQuotes(NSE_TICKER),
        api.getMultiQuotes(US_TICKER),
      ]);
      const nseData = nse.status === 'fulfilled' ? nse.value : NSE_TICKER.map(s => ({ symbol: s, price: 0, change: 0, change_pct: 0 }));
      const usData = us.status === 'fulfilled' ? us.value : US_TICKER.map(s => ({ symbol: s, price: 0, change: 0, change_pct: 0 }));
      setNseQuotes(nseData);
      setUsQuotes(usData);
      setNseMovers([...nseData].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)).slice(0, 6));
      setUsMovers([...usData].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)).slice(0, 6));
      setLoading(false);
    };

    const fetchMeta = async () => {
      const [ms, ums, idx, uidx] = await Promise.allSettled([
        api.getMarketStatus(), api.getUSMarketStatus(), api.getIndices(), api.getUSIndices(),
      ]);
      if (ms.status === 'fulfilled') setNseMarket(ms.value);
      if (ums.status === 'fulfilled') setUsMarket(ums.value);
      if (idx.status === 'fulfilled') {
        const nseMap = {};
        idx.value.forEach(i => {
          if (i.symbol === '^NSEI') nseMap.nifty50 = { ...i, value: i.price };
          if (i.symbol === '^BSESN') nseMap.sensex = { ...i, value: i.price };
        });
        setNseIndices(nseMap);
      }
      if (uidx.status === 'fulfilled') {
        const usMap = {};
        uidx.value.forEach(i => {
          if (i.symbol === '^GSPC') usMap.sp500 = { ...i, value: i.price };
          if (i.symbol === '^IXIC') usMap.nasdaq = { ...i, value: i.price };
          if (i.symbol === '^DJI') usMap.dow = { ...i, value: i.price };
        });
        setUsIndices(usMap);
      }
    };

    fetchAll();
    fetchMeta();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeQuotes = priceTab === 'NSE' ? nseQuotes : usQuotes;
  const activeCur = priceTab === 'NSE' ? '₹' : '$';

  return (
    <div className="min-h-screen bg-bb-black text-bb-text font-sans relative transition-colors duration-300">
      {/* ── Dual-Market Ticker ─────────────────────────────────── */}
      {(nseQuotes.length > 0 || usQuotes.length > 0) ? (
        <TickerBar nseQuotes={nseQuotes} usQuotes={usQuotes} />
      ) : (
        <div className="w-full bg-bb-black border-b border-bb-gray h-8 flex items-center justify-center">
          <Loader size={14} className="text-bb-orange animate-spin" />
          <span className="text-[10px] font-mono text-bb-muted ml-2">LOADING LIVE MARKET DATA...</span>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20">
        <h1 className="animate-fade-in-up-delay-1 text-7xl md:text-[9rem] font-black tracking-tighter text-bb-text mb-4 font-mono leading-none">
          ALGO<span className="text-bb-orange">.</span>X
        </h1>
        <p className="animate-fade-in-up-delay-2 text-bb-muted text-lg md:text-xl max-w-2xl text-center mb-12 leading-relaxed">
          Institutional-grade algorithmic trading infrastructure.
          <br />
          <span className="text-bb-orange font-bold">NSE</span> + <span className="text-blue-400 font-bold">US Markets</span> — One Platform.
        </p>
        <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row gap-4">
          <button onClick={() => navigate('/app/dashboard')}
            className="group flex items-center gap-2 sm:gap-3 bg-bb-orange text-black px-5 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold tracking-[0.2em] hover:bg-white transition-all duration-300">
            INITIALIZE TERMINAL <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#features"
            className="flex items-center gap-2 sm:gap-3 border border-bb-gray text-bb-muted px-5 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold tracking-[0.2em] hover:border-bb-orange hover:text-bb-orange transition-all duration-300">
            EXPLORE MODULES
          </a>
        </div>
        <div className="mt-12 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-center max-w-xl">
          <div><div className="text-2xl font-mono font-black text-bb-text">1500+</div><div className="text-[10px] text-bb-muted tracking-widest mt-1">NSE STOCKS</div></div>
          <div><div className="text-2xl font-mono font-black text-bb-text">400+</div><div className="text-[10px] text-bb-muted tracking-widest mt-1">US STOCKS</div></div>
          <div><div className="text-2xl font-mono font-black text-bb-text">&lt;50ms</div><div className="text-[10px] text-bb-muted tracking-widest mt-1">AVG LATENCY</div></div>
          <div><div className="text-2xl font-mono font-black text-bb-text">2</div><div className="text-[10px] text-bb-muted tracking-widest mt-1">MARKETS</div></div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center">
          <div className="flex flex-col items-center gap-2 animate-bounce cursor-pointer" onClick={() => document.getElementById('global-overview')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="text-[9px] font-mono text-bb-muted tracking-[0.3em]">SCROLL TO EXPLORE</span>
            <div className="flex flex-col items-center -space-y-1">
              <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2L10 8L18 2" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                <path d="M2 2L10 8L18 2" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-25">
                <path d="M2 2L10 8L18 2" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Markets Overview ────────────────────────────── */}
      <section id="global-overview" className="landing-section py-16 px-4 md:px-12">
        <SectionHeader label="GLOBAL OVERVIEW" title="WORLD MARKETS" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <IndexCard
            name="NIFTY 50" flag="🇮🇳"
            value={nseIndices?.nifty50?.value} change={nseIndices?.nifty50?.change} changePct={nseIndices?.nifty50?.change_pct}
            status={nseMarket?.status}
          />
          <IndexCard
            name="SENSEX" flag="🇮🇳"
            value={nseIndices?.sensex?.value} change={nseIndices?.sensex?.change} changePct={nseIndices?.sensex?.change_pct}
            status={nseMarket?.status}
          />
          <IndexCard
            name="S&P 500" flag="🇺🇸"
            value={usIndices?.sp500?.value} change={usIndices?.sp500?.change} changePct={usIndices?.sp500?.change_pct}
            status={usMarket?.status}
          />
          <IndexCard
            name="NASDAQ" flag="🇺🇸"
            value={usIndices?.nasdaq?.value} change={usIndices?.nasdaq?.change} changePct={usIndices?.nasdaq?.change_pct}
            status={usMarket?.status}
          />
          <IndexCard
            name="DOW JONES" flag="🇺🇸"
            value={usIndices?.dow?.value} change={usIndices?.dow?.change} changePct={usIndices?.dow?.change_pct}
            status={usMarket?.status}
          />
        </div>
      </section>

      {/* ── Dual Market Movers ─────────────────────────────────── */}
      <section className="landing-section py-16 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="LIVE DATA" title="MARKET MOVERS" />
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="text-bb-orange animate-spin" />
              <span className="text-bb-muted font-mono text-sm ml-3">FETCHING LIVE PRICES...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Indian Movers */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-xs font-bold text-bb-text tracking-wider">INDIAN MARKET</span>
                  <span className={`text-[9px] ml-auto px-2 py-0.5 font-bold rounded ${nseMarket?.status === 'OPEN' ? 'bg-bb-green/10 text-bb-green' : 'bg-bb-red/10 text-bb-red'}`}>
                    {nseMarket?.status || 'CLOSED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {nseMovers.map((q, i) => <LiveStockCard key={i} quote={q} currency="₹" />)}
                </div>
              </div>
              {/* US Movers */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🇺🇸</span>
                  <span className="text-xs font-bold text-bb-text tracking-wider">US MARKET</span>
                  <span className={`text-[9px] ml-auto px-2 py-0.5 font-bold rounded ${usMarket?.status === 'OPEN' ? 'bg-bb-green/10 text-bb-green' : 'bg-bb-red/10 text-bb-red'}`}>
                    {usMarket?.status || 'CLOSED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {usMovers.map((q, i) => <LiveStockCard key={i} quote={q} currency="$" />)}
                </div>
              </div>
            </div>
          )}
          <div className="text-center text-[10px] font-mono text-bb-muted mt-6">
            LIVE PRICES | AUTO-REFRESH: 60s | {nseQuotes.length + usQuotes.length} FEEDS ACTIVE
          </div>
        </div>
      </section>

      {/* ── Platform Architecture ──────────────────────────────── */}
      <section id="features" className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="MODULES" title="PLATFORM ARCHITECTURE" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="bg-bb-dark border border-bb-gray p-6 sm:p-10 hover:border-bb-orange/50 transition-all group cursor-pointer" onClick={() => navigate('/app/dashboard')}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 border border-bb-gray group-hover:border-bb-orange/50 transition-colors"><LayoutDashboard size={24} className="text-bb-orange" /></div>
              <div><h3 className="text-bb-text font-bold text-base tracking-wider">DASHBOARD</h3><div className="text-xs text-bb-muted tracking-wider">MODULE 01</div></div>
            </div>
            <p className="text-bb-muted text-base leading-relaxed mb-8">Real-time portfolio tracking with live P&L calculations, position management, and multi-symbol price feeds.</p>
            <div className="border-t border-bb-gray pt-5 space-y-3 text-sm font-mono text-bb-muted">
              <div className="flex justify-between"><span>Live P&L Calculator</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Auto-Refresh (30s)</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Multi-Quote Feeds</span><span className="text-bb-green">ACTIVE</span></div>
            </div>
          </div>
          <div className="bg-bb-dark border border-bb-gray p-6 sm:p-10 hover:border-bb-orange/50 transition-all group cursor-pointer" onClick={() => navigate('/app/terminal')}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 border border-bb-gray group-hover:border-bb-orange/50 transition-colors"><LineChart size={24} className="text-bb-orange" /></div>
              <div><h3 className="text-bb-text font-bold text-base tracking-wider">TRADING TERMINAL</h3><div className="text-xs text-bb-muted tracking-wider">MODULE 02</div></div>
            </div>
            <p className="text-bb-muted text-base leading-relaxed mb-8">Full-featured trading with candlestick charts, smart symbol search, company fundamentals, and instant order execution.</p>
            <div className="border-t border-bb-gray pt-5 space-y-3 text-sm font-mono text-bb-muted">
              <div className="flex justify-between"><span>NSE + US Markets</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Company Financials</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>15s Price Refresh</span><span className="text-bb-green">ACTIVE</span></div>
            </div>
          </div>
          <div className="bg-bb-dark border border-bb-gray p-6 sm:p-10 hover:border-bb-orange/50 transition-all group cursor-pointer" onClick={() => navigate('/app/research')}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 border border-bb-gray group-hover:border-bb-orange/50 transition-colors"><BrainCircuit size={24} className="text-bb-orange" /></div>
              <div><h3 className="text-bb-text font-bold text-base tracking-wider">RESEARCH LAB</h3><div className="text-xs text-bb-muted tracking-wider">MODULE 03</div></div>
            </div>
            <p className="text-bb-muted text-base leading-relaxed mb-8">Random Forest prediction engine with SMA backtesting, sentiment analysis, and company fundamentals research.</p>
            <div className="border-t border-bb-gray pt-5 space-y-3 text-sm font-mono text-bb-muted">
              <div className="flex justify-between"><span>ML Predictions</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>SMA Backtesting</span><span className="text-bb-green">ACTIVE</span></div>
              <div className="flex justify-between"><span>Sentiment Score</span><span className="text-bb-green">ACTIVE</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabbed Live Prices Table ───────────────────────────── */}
      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="LIVE FEEDS" title="MARKET DATA" />
        <div className="max-w-6xl mx-auto">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setPriceTab('NSE')}
              className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold tracking-wider border transition-all ${priceTab === 'NSE' ? 'bg-bb-orange/10 border-bb-orange text-bb-orange' : 'border-bb-gray text-bb-muted hover:border-bb-orange/50'}`}>
              🇮🇳 NSE
            </button>
            <button onClick={() => setPriceTab('US')}
              className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold tracking-wider border transition-all ${priceTab === 'US' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'border-bb-gray text-bb-muted hover:border-blue-500/50'}`}>
              🇺🇸 US
            </button>
            <span className="ml-auto text-[10px] text-bb-muted font-mono">REFRESHING EVERY 60s</span>
          </div>

          <div className="bg-bb-dark border border-bb-gray">
            <div className="p-4 border-b border-bb-gray flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-bb-orange" />
                <span className="text-xs font-bold tracking-wider text-bb-text">
                  {priceTab === 'NSE' ? 'NSE EQUITIES' : 'US EQUITIES'} — LIVE PRICES
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priceTab === 'NSE' ? (nseMarket?.status === 'OPEN' ? 'bg-bb-green/10 text-bb-green' : 'bg-bb-red/10 text-bb-red') : (usMarket?.status === 'OPEN' ? 'bg-bb-green/10 text-bb-green' : 'bg-bb-red/10 text-bb-red')}`}>
                {priceTab === 'NSE' ? (nseMarket?.status || 'CLOSED') : (usMarket?.status || 'CLOSED')}
              </span>
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
                {activeQuotes.length > 0 ? activeQuotes.map((q) => (
                  <tr key={q.symbol} className="hover:bg-bb-gray/20 transition-colors">
                    <td className="p-4 font-bold text-bb-orange">{q.symbol?.replace('.NS', '')}</td>
                    <td className="p-4 text-bb-text tabular-nums">{activeCur}{q.price?.toLocaleString()}</td>
                    <td className={`p-4 font-bold tabular-nums ${q.change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                      {q.change_pct >= 0 ? '+' : ''}{q.change_pct}%
                    </td>
                    <td className="p-4 text-bb-muted tabular-nums">{activeCur}{q.high}</td>
                    <td className="p-4 text-bb-muted tabular-nums">{activeCur}{q.low}</td>
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

      {/* ── Dual Terminal Preview ──────────────────────────────── */}
      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="TERMINALS" title="DUAL MARKET ACCESS" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Indian Terminal */}
          <div className="bg-bb-dark border border-bb-gray hover:border-bb-orange/50 transition-all cursor-pointer group" onClick={() => navigate('/app/terminal')}>
            <div className="p-4 border-b border-bb-gray flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-lg">🇮🇳</span>
                <div className="bg-black border border-bb-gray px-3 py-1.5 font-mono text-bb-orange font-bold text-sm">
                  {nseQuotes[1]?.symbol?.replace('.NS', '') || 'TCS'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-bold text-bb-text tabular-nums">₹{nseQuotes[1]?.price?.toLocaleString() || '—'}</div>
                {nseQuotes[1] && <div className={`text-[10px] font-mono ${nseQuotes[1].change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>{nseQuotes[1].change_pct >= 0 ? '+' : ''}{nseQuotes[1].change_pct}%</div>}
              </div>
            </div>
            <div className="p-6 min-h-[200px] flex flex-col justify-between">
              <div className="flex justify-between text-[10px] font-mono text-bb-muted mb-2">
                <span>HIGH: ₹{nseQuotes[1]?.high || '—'}</span><span>OHLC CHART</span><span>VOL: {nseQuotes[1]?.volume?.toLocaleString() || '—'}</span>
              </div>
              <div className="flex-1 flex items-end justify-center"><MockCandlestickChart /></div>
              <div className="flex justify-between text-[10px] font-mono text-bb-muted mt-2">
                <span>LOW: ₹{nseQuotes[1]?.low || '—'}</span><span>1D | 1W | 1M | 1Y</span><span>OPEN: ₹{nseQuotes[1]?.open || '—'}</span>
              </div>
            </div>
            <div className="p-4 border-t border-bb-gray flex items-center justify-center gap-2 text-sm font-bold text-bb-orange group-hover:text-white transition-colors">
              <Terminal size={16} /> OPEN INDIAN TERMINAL <ChevronRight size={14} />
            </div>
          </div>

          {/* US Terminal */}
          <div className="bg-bb-dark border border-bb-gray hover:border-blue-500/50 transition-all cursor-pointer group" onClick={() => navigate('/app/us-terminal')}>
            <div className="p-4 border-b border-bb-gray flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-lg">🇺🇸</span>
                <div className="bg-black border border-bb-gray px-3 py-1.5 font-mono text-blue-400 font-bold text-sm">
                  {usQuotes[0]?.symbol || 'AAPL'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-bold text-bb-text tabular-nums">${usQuotes[0]?.price?.toLocaleString() || '—'}</div>
                {usQuotes[0] && <div className={`text-[10px] font-mono ${usQuotes[0].change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>{usQuotes[0].change_pct >= 0 ? '+' : ''}{usQuotes[0].change_pct}%</div>}
              </div>
            </div>
            <div className="p-6 min-h-[200px] flex flex-col justify-between">
              <div className="flex justify-between text-[10px] font-mono text-bb-muted mb-2">
                <span>HIGH: ${usQuotes[0]?.high || '—'}</span><span>OHLC CHART</span><span>VOL: {usQuotes[0]?.volume?.toLocaleString() || '—'}</span>
              </div>
              <div className="flex-1 flex items-end justify-center"><MockCandlestickChart /></div>
              <div className="flex justify-between text-[10px] font-mono text-bb-muted mt-2">
                <span>LOW: ${usQuotes[0]?.low || '—'}</span><span>1D | 1W | 1M | 1Y</span><span>OPEN: ${usQuotes[0]?.open || '—'}</span>
              </div>
            </div>
            <div className="p-4 border-t border-bb-gray flex items-center justify-center gap-2 text-sm font-bold text-blue-400 group-hover:text-white transition-colors">
              <Terminal size={16} /> OPEN US TERMINAL <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Research Lab Preview ───────────────────────────────── */}
      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="MODULE 03" title="RESEARCH LAB" />
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bb-dark border border-bb-gray p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-5"><BrainCircuit size={120} className="text-bb-orange" /></div>
            <div className="text-bb-muted text-[10px] font-bold tracking-widest mb-6">PREDICTIVE MODEL (24H)</div>
            <div className="text-6xl font-black text-bb-text mb-2 font-mono">BUY</div>
            <div className="text-bb-orange font-mono text-xl mb-6">CONFIDENCE: 78.3%</div>
            <div className="border-t border-bb-gray pt-4 space-y-3">
              <div className="flex justify-between text-[11px] font-mono"><span className="text-bb-muted">MODEL TYPE</span><span className="text-bb-text">Random Forest</span></div>
              <div className="flex justify-between text-[11px] font-mono"><span className="text-bb-muted">FEATURES ANALYZED</span><span className="text-bb-text">9 Indicators</span></div>
              <div className="flex justify-between text-[11px] font-mono"><span className="text-bb-muted">SENTIMENT</span><span className="text-bb-green">+0.7234</span></div>
            </div>
          </div>
          <div className="bg-bb-dark border border-bb-gray p-8">
            <div className="text-bb-muted text-[10px] font-bold tracking-widest mb-6">HISTORICAL BACKTEST (1Y)</div>
            <div className="space-y-5">
              <div className="flex justify-between items-end border-b border-bb-gray pb-3"><span className="text-sm text-bb-muted">TOTAL RETURN</span><span className="text-4xl font-mono font-bold text-bb-green">+23.4%</span></div>
              <div className="flex justify-between items-center font-mono text-sm"><span className="text-bb-muted">TRADES EXECUTED</span><span className="text-bb-text">156</span></div>
              <div className="flex justify-between items-center font-mono text-sm"><span className="text-bb-muted">WIN RATE</span><span className="text-bb-green">62.8%</span></div>
              <div className="flex justify-between items-center font-mono text-sm"><span className="text-bb-muted">MAX DRAWDOWN</span><span className="text-bb-red">-8.2%</span></div>
              <div className="flex justify-between items-center font-mono text-sm"><span className="text-bb-muted">SHARPE RATIO</span><span className="text-bb-text">1.87</span></div>
              <div className="flex justify-between items-center font-mono text-sm"><span className="text-bb-muted">FINAL EQUITY</span><span className="text-bb-text">₹1,23,400</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Infrastructure ─────────────────────────────────────── */}
      <section className="landing-section py-20 px-4 md:px-12 border-t border-bb-gray">
        <SectionHeader label="INFRASTRUCTURE" title="SYSTEM ARCHITECTURE" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-5">
          {[
            { icon: <Zap size={22} />, label: 'LOW LATENCY', desc: 'Sub-50ms order execution pipeline' },
            { icon: <Lock size={22} />, label: 'RISK ENGINE', desc: 'Real-time position limits and exposure controls' },
            { icon: <Database size={22} />, label: 'DATA PIPELINE', desc: 'Historical OHLC with yFinance integration' },
            { icon: <Server size={22} />, label: 'FASTAPI BACKEND', desc: 'Async REST API with SQLAlchemy ORM' },
            { icon: <BarChart3 size={22} />, label: 'BACKTESTING', desc: 'SMA crossover strategy simulation engine' },
            { icon: <Globe size={22} />, label: 'DUAL MARKETS', desc: 'NSE + US equities with live price feeds' },
          ].map((item, i) => (
            <div key={i} className="bg-bb-dark border border-bb-gray p-8 hover:border-bb-orange/30 transition-colors">
              <div className="text-bb-orange mb-4">{item.icon}</div>
              <div className="text-bb-text text-sm font-bold tracking-wider mb-3">{item.label}</div>
              <div className="text-bb-muted text-sm leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-bb-gray">
        <div className="max-w-6xl mx-auto py-16 px-4 md:px-12">
          <div className="bg-bb-dark border border-bb-orange/30 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'linear-gradient(rgba(255,153,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,153,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-bb-text mb-4 font-mono tracking-tight">
                READY TO TRADE<span className="text-bb-orange">?</span>
              </h2>
              <p className="text-bb-muted text-sm mb-8 max-w-lg mx-auto">
                Initialize the terminal — access symbol search, company fundamentals, live prices, and ML predictions across NSE and US markets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/app/terminal')}
                  className="group inline-flex items-center gap-3 bg-bb-orange text-black px-10 py-4 text-sm font-bold tracking-[0.2em] hover:bg-white transition-all duration-300">
                  🇮🇳 INDIAN TERMINAL <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => navigate('/app/us-terminal')}
                  className="group inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-4 text-sm font-bold tracking-[0.2em] hover:bg-blue-400 transition-all duration-300">
                  🇺🇸 US TERMINAL <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-bb-gray bg-bb-dark/50 py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-[10px] text-bb-muted font-mono">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${nseMarket?.status === 'OPEN' || usMarket?.status === 'OPEN' ? 'bg-bb-green' : 'bg-bb-red'} animate-pulse`} />
                ALL SYSTEMS OPERATIONAL
              </div>
              <span>|</span><span>API v1.0</span><span>|</span><span>FastAPI + React</span>
            </div>
            <div className="flex items-center gap-6 text-[10px] text-bb-muted font-mono">
              <div className="flex items-center gap-2"><Cpu size={12} className="text-bb-orange" /> PREDICTION ENGINE</div>
              <div className="flex items-center gap-2"><Terminal size={12} className="text-bb-orange" /> LOW LATENCY</div>
              <div className="flex items-center gap-2"><Shield size={12} className="text-bb-orange" /> RISK MGMT</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;