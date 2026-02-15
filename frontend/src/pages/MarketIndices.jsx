import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Loader, ArrowUpRight, ArrowDownRight, Clock, BarChart3, Globe } from 'lucide-react';

const IndexCard = ({ index, expanded, onToggle }) => {
    const isUp = index.change_pct >= 0;
    const changePct = index.change_pct || 0;
    const absMax = 4;
    const normalized = Math.max(-1, Math.min(1, changePct / absMax));
    let borderColor;
    if (normalized > 0.3) borderColor = 'border-bb-green/30';
    else if (normalized < -0.3) borderColor = 'border-bb-red/30';
    else borderColor = 'border-bb-border';

    return (
        <div className={`bg-bb-dark border ${borderColor} rounded hover:border-bb-orange/30 transition-all`}>
            <div className="p-5 cursor-pointer" onClick={onToggle}>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="text-bb-text font-medium text-sm">{index.name}</div>
                        <div className="text-[10px] text-bb-muted mt-0.5">{index.category?.toUpperCase()}</div>
                    </div>
                    <div className={`text-[10px] font-medium px-2.5 py-1 rounded ${isUp ? 'bg-bb-green/10 text-bb-green border border-bb-green/20' : 'bg-bb-red/10 text-bb-red border border-bb-red/20'}`}>
                        {isUp ? '+' : ''}{changePct}%
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <div className={`text-2xl font-semibold tabular-nums ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>
                            {index.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-xs flex items-center gap-1 mt-1 ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>
                            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {isUp ? '+' : ''}{index.change?.toFixed(2)} pts
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-[10px] text-bb-muted">
                            Prev: <span className="text-bb-text">{index.prev_close?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-[10px] text-bb-muted">
                            Open: <span className="text-bb-text">{index.open?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-bb-border/30 flex justify-between text-[10px] text-bb-muted">
                    <span>H: <span className="text-bb-green">{index.high?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></span>
                    <span>L: <span className="text-bb-red">{index.low?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></span>
                    <span>Vol: <span className="text-bb-text">{index.volume?.toLocaleString() || 'N/A'}</span></span>
                </div>
            </div>

            {expanded && index.top_stocks && index.top_stocks.length > 0 && (
                <div className="border-t border-bb-border/30 bg-black/30 p-3 rounded-b">
                    <div className="text-[10px] text-bb-muted mb-2">Top Constituents</div>
                    <div className="space-y-1">
                        {index.top_stocks.map((stock, i) => {
                            const sUp = stock.change_pct >= 0;
                            return (
                                <div key={i} className="flex justify-between items-center py-1.5 px-2 hover:bg-bb-hover transition-colors rounded">
                                    <span className="text-xs text-bb-orange font-medium">{stock.symbol}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-bb-text tabular-nums">₹{stock.price?.toLocaleString()}</span>
                                        <span className={`text-[10px] font-medium tabular-nums ${sUp ? 'text-bb-green' : 'text-bb-red'}`}>
                                            {sUp ? '+' : ''}{stock.change_pct}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MarketIndices = () => {
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [marketStatus, setMarketStatus] = useState(null);

    const loadIndices = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const data = await api.getIndices();
            setIndices(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    const loadStatus = useCallback(async () => {
        try { setMarketStatus(await api.getMarketStatus()); } catch (e) { }
    }, []);

    useEffect(() => {
        loadIndices();
        loadStatus();
        const interval = setInterval(() => loadIndices(), 60000);
        return () => clearInterval(interval);
    }, [loadIndices, loadStatus]);

    const categories = ['ALL', ...new Set(indices.map(i => i.category))];
    const filtered = filter === 'ALL' ? indices : indices.filter(i => i.category === filter);

    const gainers = [...indices].filter(i => i.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct);
    const losers = [...indices].filter(i => i.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct);

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-bb-text">Market Indices</h2>
                    <p className="text-xs text-bb-muted mt-0.5">All Nifty sectoral & thematic indices — Live</p>
                </div>
                <div className="flex items-center gap-4">
                    {marketStatus && (
                        <div className="flex items-center gap-2 text-[11px] text-bb-muted">
                            <div className={`h-2 w-2 rounded-full ${marketStatus.status === 'OPEN' ? 'bg-bb-green' : 'bg-bb-red'} animate-pulse`} />
                            <span className="text-bb-text">{marketStatus.status}</span>
                            <Clock size={10} />
                            <span>{marketStatus.server_time}</span>
                        </div>
                    )}
                    <button
                        onClick={() => loadIndices(true)}
                        className={`flex items-center gap-2 text-xs text-bb-muted hover:text-bb-text transition-colors ${refreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={14} />
                        {refreshing ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-bb-dark border border-bb-border rounded p-4">
                    <div className="text-[10px] text-bb-muted mb-1">Total Indices</div>
                    <div className="text-xl font-semibold text-bb-text">{indices.length}</div>
                    <div className="text-[10px] text-bb-muted mt-1">Active feeds</div>
                </div>
                <div className="bg-bb-dark border border-bb-green/20 rounded p-4">
                    <div className="text-[10px] text-bb-green mb-1">Advancing</div>
                    <div className="text-xl font-semibold text-bb-green">{gainers.length}</div>
                    <div className="text-[10px] text-bb-muted mt-1">
                        {gainers[0] ? `Top: ${gainers[0].name} (+${gainers[0].change_pct}%)` : '—'}
                    </div>
                </div>
                <div className="bg-bb-dark border border-bb-red/20 rounded p-4">
                    <div className="text-[10px] text-bb-red mb-1">Declining</div>
                    <div className="text-xl font-semibold text-bb-red">{losers.length}</div>
                    <div className="text-[10px] text-bb-muted mt-1">
                        {losers[0] ? `Top: ${losers[0].name} (${losers[0].change_pct}%)` : '—'}
                    </div>
                </div>
                <div className="bg-bb-dark border border-bb-border rounded p-4">
                    <div className="text-[10px] text-bb-muted mb-1">Auto Refresh</div>
                    <div className="text-xl font-semibold text-bb-orange">60s</div>
                    <div className="text-[10px] text-bb-muted mt-1">Interval</div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-bb-dark border border-bb-border rounded p-2 overflow-x-auto">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 text-[11px] font-medium rounded transition-all whitespace-nowrap ${filter === cat ? 'bg-bb-orange text-black' : 'text-bb-muted hover:text-bb-text hover:bg-bb-gray'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader size={24} className="text-bb-orange animate-spin" />
                    <span className="text-bb-muted text-sm ml-3">Fetching live index data...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((index, i) => (
                        <IndexCard
                            key={index.symbol || i}
                            index={index}
                            expanded={expandedIndex === i}
                            onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                        />
                    ))}
                </div>
            )}

            {!loading && indices.length > 0 && (
                <div className="bg-bb-dark border border-bb-border rounded overflow-hidden">
                    <div className="p-4 border-b border-bb-border flex items-center gap-2">
                        <BarChart3 size={14} className="text-bb-orange" />
                        <span className="text-xs font-medium text-bb-text">All Indices Table</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-bb-gray/50 text-bb-muted text-[11px]">
                                <tr>
                                    <th className="p-3">Index</th>
                                    <th className="p-3">Last</th>
                                    <th className="p-3">Change</th>
                                    <th className="p-3">% Chg</th>
                                    <th className="p-3">Prev Close</th>
                                    <th className="p-3">Open</th>
                                    <th className="p-3">High</th>
                                    <th className="p-3">Low</th>
                                    <th className="p-3 text-right">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bb-border/20 text-[13px]">
                                {indices.map((idx, i) => {
                                    const isUp = idx.change_pct >= 0;
                                    return (
                                        <tr key={i} className="hover:bg-bb-hover transition-colors">
                                            <td className="p-3 font-medium text-bb-orange">{idx.name}</td>
                                            <td className="p-3 text-bb-text tabular-nums">{idx.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            <td className={`p-3 tabular-nums font-medium ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>
                                                {isUp ? '+' : ''}{idx.change?.toFixed(2)}
                                            </td>
                                            <td className={`p-3 tabular-nums font-medium ${isUp ? 'text-bb-green' : 'text-bb-red'}`}>
                                                {isUp ? '+' : ''}{idx.change_pct}%
                                            </td>
                                            <td className="p-3 text-bb-muted tabular-nums">{idx.prev_close?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-bb-muted tabular-nums">{idx.open?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-bb-green tabular-nums">{idx.high?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-bb-red tabular-nums">{idx.low?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right text-bb-muted">{idx.category}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="text-center text-[10px] text-bb-muted py-4">
                DATA SOURCE: NSE via yFINANCE | LIVE FEEDS | {indices.length} INDICES | AUTO-REFRESH: 60s
            </div>
        </div>
    );
};

export default MarketIndices;
