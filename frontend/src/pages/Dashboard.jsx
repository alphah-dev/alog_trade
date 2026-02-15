import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { TrendingUp, TrendingDown, Activity, RefreshCw, DollarSign, BarChart3, Wallet, LogOut, Loader, RotateCcw, Globe, IndianRupee, X } from 'lucide-react';

const ExitModal = ({ isOpen, onClose, onConfirm, symbol, maxQty, price, currency = '₹', loading }) => {
  const [qty, setQty] = useState(maxQty);
  React.useEffect(() => { if (isOpen) setQty(maxQty); }, [isOpen, maxQty]);
  if (!isOpen) return null;
  const sellValue = (qty * price).toFixed(2);
  return (
    <div className="fixed inset-0 bg-bb-backdrop backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-bb-card border border-bb-border rounded-lg shadow-2xl w-[380px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-3 border-b border-bb-border">
          <h3 className="text-sm font-bold text-bb-text">Exit Position — {symbol}</h3>
          <button onClick={onClose} className="text-bb-muted hover:text-bb-text"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between text-xs text-bb-muted">
            <span>Current Price</span>
            <span className="text-bb-text font-medium">{currency}{price?.toFixed(2)}</span>
          </div>
          <div>
            <label className="text-xs text-bb-muted font-medium">Shares to Sell</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="number" min={1} max={maxQty} value={qty}
                onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-bb-bg border border-bb-border rounded px-3 py-2 text-center font-bold focus:border-bb-orange outline-none" />
              <button onClick={() => setQty(maxQty)}
                className="text-[10px] text-bb-orange border border-bb-orange/30 px-2 py-2 rounded hover:bg-bb-orange/10 whitespace-nowrap">
                Max ({maxQty})
              </button>
            </div>
          </div>
          <div className="bg-bb-bg rounded border border-bb-border p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-bb-muted">Sell Qty</span><span className="text-bb-text">{qty}</span></div>
            <div className="flex justify-between"><span className="text-bb-muted">Sell Value</span><span className="text-bb-text font-bold">{currency}{sellValue}</span></div>
            <div className="flex justify-between"><span className="text-bb-muted">Position</span><span className="text-bb-text">{qty === maxQty ? 'Full Exit' : `Partial (${qty}/${maxQty})`}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-2.5 rounded text-sm font-medium border border-bb-border text-bb-muted hover:text-bb-text transition-all">Cancel</button>
            <button onClick={() => onConfirm(qty)} disabled={loading || qty < 1}
              className="py-2.5 rounded text-sm font-bold bg-bb-red text-white hover:bg-bb-red/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader size={14} className="animate-spin" /> : <LogOut size={14} />}
              {loading ? 'Selling...' : 'Confirm Exit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, isPositive, icon, accent = 'bb-orange' }) => (
  <div className="bg-bb-dark border border-bb-border p-4 rounded hover:border-bb-muted/40 transition-colors">
    <div className="flex justify-between items-start mb-1.5">
      <div className="text-bb-muted text-[11px] font-medium">{title}</div>
      {icon && <div className={`text-${accent}`}>{icon}</div>}
    </div>
    <div className="text-xl font-semibold text-bb-text mb-0.5 tabular-nums">{value}</div>
    <div className={`text-xs flex items-center gap-1 ${isPositive ? 'text-bb-green' : 'text-bb-red'}`}>
      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {subtext}
    </div>
  </div>
);

const formatCompact = (val, currency = '₹') => {
  if (!val) return 'N/A';
  if (val >= 1e12) return `${currency}${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `${currency}${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e7) return `${currency}${(val / 1e7).toFixed(2)}Cr`;
  if (val >= 1e6) return `${currency}${(val / 1e6).toFixed(2)}M`;
  return `${currency}${val.toLocaleString()}`;
};

const HeatmapCell = ({ stock, maxWeight }) => {
  const pct = stock.change_pct || 0;
  const cur = stock.currency === '$' ? '$' : '₹';

  let bg, border;
  if (pct > 3) {
    bg = 'rgba(38,166,154,0.35)'; border = 'rgba(38,166,154,0.5)';
  } else if (pct > 1.5) {
    bg = 'rgba(38,166,154,0.22)'; border = 'rgba(38,166,154,0.35)';
  } else if (pct > 0) {
    bg = 'rgba(38,166,154,0.12)'; border = 'rgba(38,166,154,0.2)';
  } else if (pct === 0) {
    bg = 'rgba(42,46,57,0.4)'; border = 'rgba(42,46,57,0.6)';
  } else if (pct > -1.5) {
    bg = 'rgba(239,83,80,0.12)'; border = 'rgba(239,83,80,0.2)';
  } else if (pct > -3) {
    bg = 'rgba(239,83,80,0.22)'; border = 'rgba(239,83,80,0.35)';
  } else {
    bg = 'rgba(239,83,80,0.35)'; border = 'rgba(239,83,80,0.5)';
  }

  return (
    <div
      className="rounded cursor-default group transition-all duration-200 hover:scale-[1.02] hover:z-10 relative"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        flex: `${stock.weight} 1 0`,
        minWidth: `${Math.max(85, stock.weight * 16)}px`,
        minHeight: `${Math.max(68, Math.max(0.6, stock.weight / maxWeight) * 85)}px`,
      }}
    >
      <div className="p-2.5 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start gap-1">
          <span className="text-bb-text text-[11px] font-medium truncate">{stock.symbol}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
            {pct >= 0 ? '+' : ''}{pct}%
          </span>
        </div>
        <div>
          <div className="text-bb-text/80 text-[11px] tabular-nums">{cur}{stock.price?.toLocaleString()}</div>
          <div className="text-bb-muted text-[8px] truncate">{stock.name}</div>
        </div>
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-bb-card border border-bb-border rounded-lg shadow-xl p-3 min-w-[200px] text-[11px]">
          <div className="font-bold text-bb-text text-xs mb-1.5 truncate">{stock.name || stock.symbol}</div>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-bb-muted">Price</span><span className="text-bb-text font-medium">{cur}{stock.price?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-bb-muted">Change</span><span className={`font-medium ${pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>{pct >= 0 ? '+' : ''}{pct}%</span></div>
            {stock.market_cap && <div className="flex justify-between"><span className="text-bb-muted">Market Cap</span><span className="text-bb-text font-medium">{formatCompact(stock.market_cap, cur)}</span></div>}
            {stock.sector && <div className="flex justify-between"><span className="text-bb-muted">Sector</span><span className="text-bb-text font-medium truncate max-w-[120px]">{stock.sector}</span></div>}
            {stock.volume && <div className="flex justify-between"><span className="text-bb-muted">Volume</span><span className="text-bb-text font-medium">{stock.volume?.toLocaleString()}</span></div>}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-bb-card border-r border-b border-bb-border"></div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [account, setAccount] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exitingSymbol, setExitingSymbol] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [usHeatmapData, setUsHeatmapData] = useState([]);
  const [usHeatmapLoading, setUsHeatmapLoading] = useState(true);
  const [indiaStatus, setIndiaStatus] = useState(null);
  const [usStatus, setUsStatus] = useState(null);
  const [usPortfolio, setUsPortfolio] = useState([]);
  const [usAccount, setUsAccount] = useState(null);
  const [usLoading, setUsLoading] = useState(true);
  const [usLiveQuotes, setUsLiveQuotes] = useState({});
  const [exitModal, setExitModal] = useState({ open: false, symbol: '', maxQty: 0, price: 0, currency: '₹', market: 'INR' });
  const [activeMarket, setActiveMarket] = useState('INR');

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [port, acct] = await Promise.all([api.getPortfolio(), api.getAccount()]);
      setPortfolio(port);
      setAccount(acct);
      if (port.length > 0) {
        const quotes = await api.getMultiQuotes(port.map(p => p.symbol));
        const quoteMap = {};
        quotes.forEach(q => { quoteMap[q.symbol] = q; });
        setLiveQuotes(quoteMap);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadHeatmap = useCallback(async () => {
    if (heatmapData.length === 0) setHeatmapLoading(true);
    try { setHeatmapData(await api.getHeatmap()); } catch (e) { console.error(e); }
    setHeatmapLoading(false);
  }, [heatmapData.length]);

  const loadUSHeatmap = useCallback(async () => {
    if (usHeatmapData.length === 0) setUsHeatmapLoading(true);
    try { setUsHeatmapData(await api.getUSHeatmap()); } catch (e) { console.error(e); }
    setUsHeatmapLoading(false);
  }, [usHeatmapData.length]);

  const loadMarketStatuses = useCallback(async () => {
    try { setIndiaStatus(await api.getMarketStatus()); } catch (e) { }
    try { setUsStatus(await api.getUSMarketStatus()); } catch (e) { }
  }, []);

  const loadUSData = useCallback(async () => {
    try {
      const [port, acct] = await Promise.all([api.getUSPortfolio(), api.getUSAccount()]);
      setUsPortfolio(port);
      setUsAccount(acct);
      if (port.length > 0) {
        try {
          const symbols = port.map(p => p.symbol);
          const quotes = await api.getMultiQuotes(symbols);
          const quoteMap = {};
          quotes.forEach(q => { quoteMap[q.symbol] = q; });
          setUsLiveQuotes(quoteMap);
        } catch (qErr) { console.error('US quotes error', qErr); }
      }
    } catch (e) { console.error(e); }
    setUsLoading(false);
  }, []);

  useEffect(() => {
    loadData(); loadHeatmap(); loadUSHeatmap(); loadMarketStatuses(); loadUSData();
    const interval = setInterval(() => loadData(), 30000);
    const heatmapInterval = setInterval(() => loadHeatmap(), 120000);
    const usHeatmapInterval = setInterval(() => loadUSHeatmap(), 120000);
    const statusInterval = setInterval(() => loadMarketStatuses(), 60000);
    const usInterval = setInterval(() => loadUSData(), 30000);
    return () => { clearInterval(interval); clearInterval(heatmapInterval); clearInterval(usHeatmapInterval); clearInterval(statusInterval); clearInterval(usInterval); };
  }, [loadData, loadHeatmap, loadUSHeatmap, loadMarketStatuses, loadUSData]);

  const openExitModal = (symbol, qty, price, currency = '₹', market = 'INR') => {
    setExitModal({ open: true, symbol, maxQty: qty, price, currency, market });
  };

  const handleExitConfirm = async (qty) => {
    const { symbol, price, market } = exitModal;
    setExitingSymbol(symbol);
    try {
      if (market === 'USD') {
        await api.exitUSPosition(symbol, price, qty);
        await loadUSData();
      } else {
        await api.exitPosition(symbol, price, qty);
        await loadData(true);
      }
    } catch (e) { console.error(e); }
    setExitingSymbol(null);
    setExitModal({ open: false, symbol: '', maxQty: 0, price: 0, currency: '₹', market: 'INR' });
  };

  const handleReset = async () => {
    if (!confirm('Reset paper trading account? This will clear all trades and positions.')) return;
    try { await api.resetAccount(); await loadData(true); } catch (e) { console.error(e); }
  };

  const totalInvested = portfolio.reduce((acc, pos) => acc + (pos.average_price * pos.total_quantity), 0);
  const totalCurrent = portfolio.reduce((acc, pos) => {
    const quote = liveQuotes[pos.symbol];
    return acc + ((quote?.price || pos.average_price) * pos.total_quantity);
  }, 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested * 100) : 0;

  const sectorGroups = {};
  heatmapData.forEach(stock => {
    if (!sectorGroups[stock.sector]) sectorGroups[stock.sector] = [];
    sectorGroups[stock.sector].push(stock);
  });
  const maxWeight = Math.max(...heatmapData.map(s => s.weight || 1), 1);

  const sectorSummary = Object.entries(sectorGroups).map(([sector, stocks]) => {
    const avg = stocks.reduce((a, s) => a + (s.change_pct || 0), 0) / stocks.length;
    return { sector, avg: avg.toFixed(2), count: stocks.length };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-bb-text">Portfolio Overview</h2>
          <p className="text-xs text-bb-muted mt-0.5">Paper trading account summary</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bb-dark border border-bb-border rounded overflow-hidden">
            <button
              onClick={() => setActiveMarket('INR')}
              className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-all ${activeMarket === 'INR'
                ? 'bg-bb-orange text-black'
                : 'text-bb-muted hover:text-bb-text'
                }`}>
              <IndianRupee size={12} /> INR
            </button>
            <button
              onClick={() => setActiveMarket('USD')}
              className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-all ${activeMarket === 'USD'
                ? 'bg-bb-blue text-bb-text'
                : 'text-bb-muted hover:text-bb-text'
                }`}>
              <DollarSign size={12} /> USD
            </button>
          </div>
          <button onClick={handleReset} className="text-xs text-bb-muted hover:text-bb-red transition-colors flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={() => loadData(true)}
            className={`text-xs text-bb-muted hover:text-bb-text transition-colors flex items-center gap-1 ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={13} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`bg-bb-dark border rounded px-4 py-2.5 flex items-center justify-between ${activeMarket === 'INR' ? 'border-bb-orange/30' : 'border-bb-border'}`}>
          <div className="flex items-center gap-2">
            <IndianRupee size={12} className="text-bb-orange" />
            <span className="text-xs font-medium text-bb-text">NSE / BSE</span>
            <div className={`flex items-center gap-1 ${indiaStatus?.status === 'OPEN' ? 'text-bb-green' : 'text-bb-red'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${indiaStatus?.status === 'OPEN' ? 'bg-bb-green animate-pulse' : 'bg-bb-red'}`}></span>
              <span className="text-[11px] font-medium">{indiaStatus?.status || '...'}</span>
            </div>
          </div>
          <span className="text-[11px] text-bb-muted">{indiaStatus?.server_time || '--'} IST</span>
        </div>
        <div className={`bg-bb-dark border rounded px-4 py-2.5 flex items-center justify-between ${activeMarket === 'USD' ? 'border-bb-blue/30' : 'border-bb-border'}`}>
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-bb-blue" />
            <span className="text-xs font-medium text-bb-text">NYSE / NASDAQ</span>
            <div className={`flex items-center gap-1 ${usStatus?.status === 'OPEN' ? 'text-bb-green' : usStatus?.status === 'PRE-MARKET' || usStatus?.status === 'AFTER-HOURS' ? 'text-yellow-500' : 'text-bb-red'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${usStatus?.status === 'OPEN' ? 'bg-bb-green animate-pulse' : usStatus?.status === 'PRE-MARKET' || usStatus?.status === 'AFTER-HOURS' ? 'bg-yellow-500' : 'bg-bb-red'}`}></span>
              <span className="text-[11px] font-medium">{usStatus?.status || '...'}</span>
            </div>
          </div>
          <span className="text-[11px] text-bb-muted">{usStatus?.server_time_et || '--'} ET</span>
        </div>
      </div>

      {activeMarket === 'INR' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <StatCard title="Cash Balance" value={loading ? '—' : `₹${account?.balance?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '1,00,000'}`}
              subtext={`Margin: ₹${account?.available_margin?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '—'}`} isPositive={true} icon={<Wallet size={14} />} />
            <StatCard title="Invested" value={loading ? '—' : `₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              subtext={`${portfolio.length} positions`} isPositive={true} icon={<DollarSign size={14} />} />
            <StatCard title="Current Value" value={loading ? '—' : `₹${totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              subtext="Live value" isPositive={totalCurrent >= totalInvested} icon={<Activity size={14} />} />
            <StatCard title="P&L" value={loading ? '—' : `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              subtext={`${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%`} isPositive={totalPnL >= 0} icon={<BarChart3 size={14} />} />
            <StatCard title="Charges" value={loading ? '—' : `₹${account?.total_charges_paid?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}`}
              subtext="STT + GST + Fees" isPositive={false} icon={<DollarSign size={14} />} />
          </div>

          <div className="bg-bb-dark border border-bb-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-bb-border flex justify-between items-center">
              <h3 className="text-sm font-medium text-bb-text flex items-center gap-2">
                Holdings
                <span className="text-[11px] text-bb-muted bg-bb-gray px-2 py-0.5 rounded">{portfolio.length}</span>
              </h3>
              <span className="text-[11px] text-bb-muted">Auto-refresh: 30s</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bb-gray/50 text-bb-muted text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Symbol</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5">Avg Price</th>
                    <th className="px-4 py-2.5">Current</th>
                    <th className="px-4 py-2.5">Invested</th>
                    <th className="px-4 py-2.5">P&L</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bb-border/50 text-[13px]">
                  {loading ? (
                    <tr><td colSpan="7" className="p-6 text-center text-bb-muted">Loading portfolio...</td></tr>
                  ) : portfolio.length === 0 ? (
                    <tr><td colSpan="7" className="p-6 text-center text-bb-muted">No positions yet. Visit the Terminal to start trading.</td></tr>
                  ) : portfolio.map((pos) => {
                    const quote = liveQuotes[pos.symbol];
                    const currentPrice = quote?.price || pos.average_price;
                    const invested = pos.average_price * pos.total_quantity;
                    const current = currentPrice * pos.total_quantity;
                    const pnl = current - invested;
                    const pnlPct = invested > 0 ? (pnl / invested * 100) : 0;
                    const isUp = pnl >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-bb-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-bb-text">{pos.symbol.replace('.NS', '')}</div>
                          {quote && <div className={`text-[11px] ${quote.change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>{quote.change_pct >= 0 ? '+' : ''}{quote.change_pct}%</div>}
                        </td>
                        <td className="px-4 py-3 text-bb-text">{pos.total_quantity}</td>
                        <td className="px-4 py-3 text-bb-muted tabular-nums">₹{pos.average_price.toFixed(2)}</td>
                        <td className="px-4 py-3 tabular-nums"><span className={quote ? (quote.change >= 0 ? 'text-bb-green' : 'text-bb-red') : 'text-bb-text'}>₹{currentPrice.toFixed(2)}</span></td>
                        <td className="px-4 py-3 text-bb-muted tabular-nums">₹{invested.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className={`font-medium tabular-nums ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>{isUp ? '+' : ''}₹{pnl.toFixed(2)}</div>
                          <div className={`text-[11px] ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>{isUp ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openExitModal(pos.symbol, pos.total_quantity, quote?.price || pos.average_price, '₹', 'INR')} disabled={exitingSymbol === pos.symbol}
                            className="text-bb-red border border-bb-red/30 px-3 py-1 text-[11px] font-medium rounded hover:bg-bb-red hover:text-bb-text transition-all disabled:opacity-50 flex items-center gap-1 ml-auto">
                            {exitingSymbol === pos.symbol ? <Loader size={10} className="animate-spin" /> : <LogOut size={10} />} Exit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeMarket === 'USD' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard title="USD Balance" accent="bb-blue"
              value={usLoading ? '—' : `$${usAccount?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}`}
              subtext={`≈ ₹${usLoading ? '—' : (usAccount?.balance_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              isPositive={true} icon={<DollarSign size={14} />} />
            <StatCard title="US Positions" accent="bb-blue"
              value={usPortfolio.length}
              subtext="Active holdings" isPositive={true} icon={<Activity size={14} />} />
            <StatCard title="Initial Balance" accent="bb-blue"
              value={`$${usLoading ? '—' : usAccount?.initial_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '1,190.48'}`}
              subtext="From ₹1,00,000 @ ₹84/$" isPositive={true} icon={<Wallet size={14} />} />
            <StatCard title="Charges Paid" accent="bb-blue"
              value={`$${usLoading ? '—' : usAccount?.total_charges_paid?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
              subtext="SEC + FINRA" isPositive={false} icon={<DollarSign size={14} />} />
          </div>

          <div className="bg-bb-dark border border-bb-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-bb-border flex justify-between items-center">
              <h3 className="text-sm font-medium text-bb-text flex items-center gap-2">
                US Holdings
                <span className="text-[11px] text-bb-blue bg-bb-blue/10 px-2 py-0.5 rounded">{usPortfolio.length}</span>
              </h3>
              <span className="text-[11px] text-bb-muted">NYSE / NASDAQ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bb-gray/50 text-bb-muted text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Symbol</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5">Avg Price</th>
                    <th className="px-4 py-2.5">CMP</th>
                    <th className="px-4 py-2.5">Invested</th>
                    <th className="px-4 py-2.5">P&L</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bb-border/50 text-[13px]">
                  {usLoading ? (
                    <tr><td colSpan="7" className="p-6 text-center text-bb-muted">Loading US portfolio...</td></tr>
                  ) : usPortfolio.length === 0 ? (
                    <tr><td colSpan="7" className="p-6 text-center text-bb-muted">No US positions. Visit the US Market terminal to start trading.</td></tr>
                  ) : usPortfolio.map((pos) => {
                    const usQuote = usLiveQuotes[pos.symbol];
                    const usCmp = usQuote?.price || pos.average_price;
                    const usInvested = pos.average_price * pos.total_quantity;
                    const usCurrent = usCmp * pos.total_quantity;
                    const usPnl = usCurrent - usInvested;
                    const usPnlPct = usInvested > 0 ? (usPnl / usInvested * 100) : 0;
                    const usIsUp = usPnl >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-bb-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-bb-blue">{pos.symbol}</div>
                          {usQuote && <div className={`text-[11px] ${usQuote.change_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>{usQuote.change_pct >= 0 ? '+' : ''}{usQuote.change_pct}%</div>}
                        </td>
                        <td className="px-4 py-3 text-bb-text">{pos.total_quantity}</td>
                        <td className="px-4 py-3 text-bb-muted tabular-nums">${pos.average_price?.toFixed(2)}</td>
                        <td className="px-4 py-3 tabular-nums"><span className={usQuote ? (usQuote.change >= 0 ? 'text-bb-green' : 'text-bb-red') : 'text-bb-text'}>${usCmp.toFixed(2)}</span></td>
                        <td className="px-4 py-3 text-bb-muted tabular-nums">${usInvested.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className={`font-medium tabular-nums ${usIsUp ? 'text-bb-green' : 'text-bb-red'}`}>{usIsUp ? '+' : ''}${usPnl.toFixed(2)}</div>
                          <div className={`text-[11px] ${usIsUp ? 'text-bb-green' : 'text-bb-red'}`}>{usIsUp ? '+' : ''}{usPnlPct.toFixed(2)}%</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openExitModal(pos.symbol, pos.total_quantity, usCmp, '$', 'USD')} disabled={exitingSymbol === pos.symbol}
                            className="text-bb-red border border-bb-red/30 px-3 py-1 text-[11px] font-medium rounded hover:bg-bb-red hover:text-bb-text transition-all disabled:opacity-50 flex items-center gap-1 ml-auto">
                            {exitingSymbol === pos.symbol ? <Loader size={10} className="animate-spin" /> : <LogOut size={10} />} Exit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ExitModal
        isOpen={exitModal.open}
        onClose={() => setExitModal({ ...exitModal, open: false })}
        onConfirm={handleExitConfirm}
        symbol={exitModal.symbol}
        maxQty={exitModal.maxQty}
        price={exitModal.price}
        currency={exitModal.currency}
        loading={!!exitingSymbol}
      />

      <div className="bg-bb-dark border border-bb-border rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-bb-border">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-bb-text flex items-center gap-2">
                <BarChart3 size={14} className={activeMarket === 'INR' ? 'text-bb-orange' : 'text-bb-blue'} />
                {activeMarket === 'INR' ? 'NIFTY 50 Heatmap' : 'S&P 500 Heatmap'}
              </h3>
              <p className="text-[11px] text-bb-muted mt-0.5">
                Size = Index weight · Color = Daily change · {(activeMarket === 'INR' ? heatmapData : usHeatmapData).length} stocks
              </p>
            </div>
            <span className="text-[11px] text-bb-muted">120s refresh</span>
          </div>

          {(() => {
            const data = activeMarket === 'INR' ? heatmapData : usHeatmapData;
            const groups = {};
            data.forEach(stock => {
              if (!groups[stock.sector]) groups[stock.sector] = [];
              groups[stock.sector].push(stock);
            });
            const summary = Object.entries(groups).map(([sector, stocks]) => {
              const avg = stocks.reduce((a, s) => a + (s.change_pct || 0), 0) / stocks.length;
              return { sector, avg: avg.toFixed(2), count: stocks.length };
            });
            return summary.length > 0 && (
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {summary.map(s => (
                  <div key={s.sector}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium border ${parseFloat(s.avg) >= 0
                      ? 'bg-bb-green/10 border-bb-green/15 text-bb-green'
                      : 'bg-bb-red/10 border-bb-red/15 text-bb-red'}`}>
                    {s.sector} {parseFloat(s.avg) >= 0 ? '+' : ''}{s.avg}%
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="p-4">
          {(activeMarket === 'INR' ? heatmapLoading : usHeatmapLoading) ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={20} className="text-bb-muted animate-spin" />
              <span className="text-bb-muted text-sm ml-3">Loading market data...</span>
            </div>
          ) : (() => {
            const data = activeMarket === 'INR' ? heatmapData : usHeatmapData;
            const currencyData = data.map(s => ({ ...s, currency: activeMarket === 'INR' ? '₹' : '$' }));
            const groups = {};
            currencyData.forEach(stock => {
              if (!groups[stock.sector]) groups[stock.sector] = [];
              groups[stock.sector].push(stock);
            });
            const mw = Math.max(...currencyData.map(s => s.weight || 1), 1);
            return (
              <div className="space-y-3">
                {Object.entries(groups).map(([sector, stocks]) => {
                  const sectorAvg = stocks.reduce((a, s) => a + (s.change_pct || 0), 0) / stocks.length;
                  return (
                    <div key={sector}>
                      <div className="flex items-center gap-3 mb-1.5 px-1">
                        <span className="text-[10px] text-bb-muted font-medium">{sector}</span>
                        <div className="flex-1 h-px bg-bb-border" />
                        <span className={`text-[10px] font-medium ${sectorAvg >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                          {sectorAvg >= 0 ? '+' : ''}{sectorAvg.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {stocks.map(stock => (
                          <HeatmapCell key={stock.symbol} stock={stock} maxWeight={mw} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="mt-4 pt-3 border-t border-bb-border/30 flex items-center justify-center gap-1">
            {[
              { label: '-5%+', bg: 'rgba(239,83,80,0.35)' },
              { label: '-2%', bg: 'rgba(239,83,80,0.22)' },
              { label: '-1%', bg: 'rgba(239,83,80,0.12)' },
              { label: '0', bg: 'rgba(42,46,57,0.4)' },
              { label: '+1%', bg: 'rgba(38,166,154,0.12)' },
              { label: '+2%', bg: 'rgba(38,166,154,0.22)' },
              { label: '+5%+', bg: 'rgba(38,166,154,0.35)' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1 mx-1">
                <div className="w-4 h-2.5 rounded-sm border border-white/5" style={{ background: item.bg }} />
                <span className="text-[8px] text-bb-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;