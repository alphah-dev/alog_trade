import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

import { createChart, ColorType } from 'lightweight-charts';
import { api } from '../api';
import { ArrowUp, ArrowDown, History, Loader, CheckCircle, XCircle, TrendingUp, TrendingDown, Building2, Wallet, Receipt, BarChart3, PieChart, DollarSign, Globe, Clock, Ruler, ZoomIn, ZoomOut, Maximize2, Activity, ChevronDown, ChevronUp, Users } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const formatUSD = (val) => {
    if (!val) return '—';
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
};

const formatMarketCap = (val) => {
    if (!val) return 'N/A';
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
};

const RatioRow = ({ label, value, suffix = '' }) => (
    <div className="flex justify-between py-2 border-b border-bb-border/50 text-[12px]">
        <span className="text-bb-muted">{label}</span>
        <span className="text-bb-text font-medium">{value != null ? `${value}${suffix}` : '—'}</span>
    </div>
);

const SectionTitle = ({ id, title, icon }) => (
    <div id={id} className="flex items-center gap-2 py-3 scroll-mt-4">
        {icon}
        <h3 className="text-sm font-medium text-bb-text">{title}</h3>
    </div>
);

const FinancialsPanel = ({ financials, currency = '$' }) => {
    if (!financials) return null;

    const sections = [
        { id: 'key_ratios', label: 'Key Ratios', icon: <Activity size={16} /> },
        { id: 'pros_cons', label: 'Pros & Cons', icon: <TrendingUp size={16} /> },
        { id: 'peers', label: 'Peers', icon: <Users size={16} /> },
        { id: 'quarterly', label: 'Quarterly Results', icon: <BarChart3 size={16} /> },
        { id: 'annual_pl', label: 'Profit & Loss', icon: <PieChart size={16} /> },
        { id: 'balance_sheet', label: 'Balance Sheet', icon: <Receipt size={16} /> },
        { id: 'cashflow', label: 'Cashflow', icon: <Wallet size={16} /> },
    ];

    const scrollToSection = (id) => {
        document.getElementById(`fin-us-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const growth = financials.compounded_growth || {};

    return (
        <div className="bg-bb-dark border border-bb-border rounded flex flex-col">
            <div className="flex border-b border-bb-border overflow-x-auto bg-bb-card z-10 sticky top-0 shrink-0">
                {sections.map(s => (
                    <button key={s.id} onClick={() => scrollToSection(s.id)}
                        className="px-4 py-3 text-[11px] font-medium text-bb-muted hover:text-bb-text whitespace-nowrap flex items-center gap-1.5 transition-colors">
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-10">

                <div id="fin-us-key_ratios">
                    <div className="flex items-center gap-2 mb-4 text-bb-blue font-bold text-sm uppercase tracking-wide">
                        <Activity size={16} /> Key Ratios
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-x-6 gap-y-0">
                            <RatioRow label="Market Cap" value={formatMarketCap(financials.market_cap)} />
                            <RatioRow label="Current Price" value={financials.current_price ? `$${financials.current_price}` : null} />
                            <RatioRow label="52W High / Low" value={financials.week_52_high ? `$${financials.week_52_high} / $${financials.week_52_low}` : null} />
                            <RatioRow label="Stock P/E" value={financials.pe_ratio?.toFixed(2)} />
                            <RatioRow label="Book Value" value={financials.book_value?.toFixed(2)} suffix=" $" />
                            <RatioRow label="Dividend Yield" value={financials.dividend_yield} suffix="%" />
                            <RatioRow label="ROCE" value={financials.roce} suffix="%" />
                            <RatioRow label="ROE" value={financials.roe} suffix="%" />
                            <RatioRow label="Forward P/E" value={financials.forward_pe?.toFixed(2)} />
                            <RatioRow label="P/B Ratio" value={financials.pb_ratio?.toFixed(2)} />
                            <RatioRow label="EPS" value={financials.eps?.toFixed(2)} suffix=" $" />
                            <RatioRow label="D/E Ratio" value={financials.debt_to_equity?.toFixed(2)} />
                            <RatioRow label="Profit Margin" value={financials.profit_margins} suffix="%" />
                            <RatioRow label="Op. Margin" value={financials.operating_margins} suffix="%" />
                            <RatioRow label="Revenue" value={formatUSD(financials.revenue)} />
                            <RatioRow label="Net Income" value={formatUSD(financials.net_income)} />
                            <RatioRow label="Free Cashflow" value={formatUSD(financials.free_cashflow)} />
                            <RatioRow label="Insider Hold" value={financials.promoter_holding} suffix="%" />
                            <RatioRow label="Inst. Holding" value={financials.institutional_holding} suffix="%" />
                        </div>

                        {Object.keys(growth).length > 0 && (
                            <div className="mt-5 border-t border-bb-border/50 pt-4">
                                <div className="text-xs font-bold text-bb-text mb-1 uppercase tracking-wide">Compounded Annual Growth Rate (CAGR)</div>
                                <div className="text-[10px] text-bb-muted mb-3">Based on historical financial data. CAGR computed over trailing periods.</div>
                                <div className="border border-bb-border rounded overflow-hidden">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-bb-gray/30">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-bb-muted font-medium">Metric</th>
                                                <th className="px-3 py-2 text-right text-bb-muted font-medium">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bb-border/30">
                                            {[
                                                { label: 'Revenue Growth (3Y)', key: 'sales_growth_3Y' },
                                                { label: 'Revenue Growth (5Y)', key: 'sales_growth_5Y' },
                                                { label: 'Profit Growth (3Y)', key: 'profit_growth_3Y' },
                                                { label: 'Profit Growth (5Y)', key: 'profit_growth_5Y' },
                                                { label: 'Stock Price CAGR (1Y)', key: 'stock_cagr_1Y' },
                                                { label: 'Stock Price CAGR (3Y)', key: 'stock_cagr_3Y' },
                                                { label: 'Stock Price CAGR (5Y)', key: 'stock_cagr_5Y' },
                                                { label: 'Return on Equity (Last FY)', key: 'roe_last_year' },
                                            ].filter(g => growth[g.key] != null).map(g => (
                                                <tr key={g.key} className="hover:bg-bb-gray/10">
                                                    <td className="px-3 py-2 text-bb-text">{g.label}</td>
                                                    <td className={`px-3 py-2 text-right font-semibold ${growth[g.key] >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                                                        {growth[g.key] >= 0 ? '+' : ''}{growth[g.key]}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div id="fin-us-pros_cons">
                    <div className="flex items-center gap-2 mb-4 text-bb-blue font-bold text-sm uppercase tracking-wide">
                        <TrendingUp size={16} /> Pros & Cons
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-bb-green/20 bg-bb-green/5 rounded p-4">
                            <div className="flex items-center gap-2 mb-3 text-bb-green font-bold text-xs uppercase tracking-wide">
                                <TrendingUp size={14} /> Positive Indicators
                            </div>
                            {(financials.pros || []).length > 0 ? financials.pros.map((p, i) => (
                                <div key={i} className="flex items-start gap-2.5 py-1.5 text-[12px] text-bb-text">
                                    <span className="w-1.5 h-1.5 rounded-full bg-bb-green mt-1.5 shrink-0"></span> {p}
                                </div>
                            )) : <div className="text-xs text-bb-muted">No positive indicators identified based on available data.</div>}
                        </div>
                        <div className="border border-bb-red/20 bg-bb-red/5 rounded p-4">
                            <div className="flex items-center gap-2 mb-3 text-bb-red font-bold text-xs uppercase tracking-wide">
                                <TrendingDown size={14} /> Risk Factors
                            </div>
                            {(financials.cons || []).length > 0 ? financials.cons.map((c, i) => (
                                <div key={i} className="flex items-start gap-2.5 py-1.5 text-[12px] text-bb-text">
                                    <span className="w-1.5 h-1.5 rounded-full bg-bb-red mt-1.5 shrink-0"></span> {c}
                                </div>
                            )) : <div className="text-xs text-bb-muted">No risk factors identified based on available data.</div>}
                        </div>
                    </div>
                </div>

                <div id="fin-us-peers">
                    <div className="flex items-center gap-2 mb-4 text-bb-blue font-bold text-sm uppercase tracking-wide">
                        <Users size={16} /> Peer Comparison
                    </div>
                    <div className="overflow-x-auto border border-bb-border rounded">
                        {(financials.peers || []).length > 0 ? (
                            <table className="w-full text-[11px]">
                                <thead className="text-bb-muted bg-bb-gray/10">
                                    <tr>
                                        <th className="p-2 text-left">#</th>
                                        <th className="p-2 text-left">Name</th>
                                        <th className="p-2 text-right">CMP $</th>
                                        <th className="p-2 text-right">P/E</th>
                                        <th className="p-2 text-right">Mkt Cap</th>
                                        <th className="p-2 text-right">Div Yld %</th>
                                        <th className="p-2 text-right">ROCE %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bb-border/30">
                                    {financials.peers.map((peer, i) => (
                                        <tr key={i} className="hover:bg-bb-hover">
                                            <td className="p-2 text-bb-muted">{i + 1}</td>
                                            <td className="p-2 text-bb-blue font-medium truncate max-w-[140px]">{peer.name}</td>
                                            <td className="p-2 text-right text-bb-text">${peer.cmp?.toLocaleString()}</td>
                                            <td className="p-2 text-right text-bb-text">{peer.pe || '—'}</td>
                                            <td className="p-2 text-right text-bb-text">{formatMarketCap(peer.market_cap)}</td>
                                            <td className="p-2 text-right text-bb-text">{peer.div_yield || '—'}</td>
                                            <td className="p-2 text-right text-bb-text">{peer.roce || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="text-center text-bb-muted text-xs py-8">No peer data available yet.</div>}
                    </div>
                </div>

                <div id="fin-us-quarterly">
                    <div className="flex items-center gap-2 mb-4 text-bb-blue font-bold text-sm uppercase tracking-wide">
                        <BarChart3 size={16} /> Quarterly Results
                    </div>
                    <div className="overflow-x-auto border border-bb-border rounded">
                        {financials.quarterly_results?.length > 0 ? (
                            <table className="w-full text-[11px]">
                                <thead className="text-bb-muted bg-bb-gray/10">
                                    <tr>
                                        <th className="p-2 text-left sticky left-0 bg-bb-dark z-10">Quarter</th>
                                        <th className="p-2 text-right">Revenue</th>
                                        <th className="p-2 text-right">Expenses</th>
                                        <th className="p-2 text-right">Op. Profit</th>
                                        <th className="p-2 text-right">OPM %</th>
                                        <th className="p-2 text-right">Net Profit</th>
                                        <th className="p-2 text-right">EPS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bb-border/30">
                                    {financials.quarterly_results.map((q, i) => (
                                        <tr key={i} className="hover:bg-bb-hover">
                                            <td className="p-2 text-bb-blue font-medium sticky left-0 bg-bb-dark">{q.quarter}</td>
                                            <td className="p-2 text-right text-bb-text">{formatUSD(q.revenue)}</td>
                                            <td className="p-2 text-right text-bb-text">{formatUSD(q.expenses)}</td>
                                            <td className={`p-2 text-right ${(q.operating_profit || 0) > 0 ? 'text-bb-green' : 'text-bb-red'}`}>{formatUSD(q.operating_profit)}</td>
                                            <td className={`p-2 text-right ${(q.opm_pct || 0) > 0 ? 'text-bb-green' : 'text-bb-red'}`}>{q.opm_pct != null ? `${q.opm_pct}%` : '—'}</td>
                                            <td className={`p-2 text-right ${(q.net_income || 0) > 0 ? 'text-bb-green' : 'text-bb-red'}`}>{formatUSD(q.net_income)}</td>
                                            <td className="p-2 text-right text-bb-text">{q.eps != null ? `$${q.eps}` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="text-center text-bb-muted text-xs py-8">No quarterly data available</div>}
                    </div>
                </div>

                <div id="fin-us-annual_pl">
                    <div className="flex items-center gap-2 mb-4 text-bb-blue font-bold text-sm uppercase tracking-wide">
                        <PieChart size={16} /> Profit & Loss
                    </div>
                    <div className="overflow-x-auto border border-bb-border rounded">
                        {financials.annual_results?.length > 0 ? (
                            <table className="w-full text-[11px]">
                                <thead className="text-bb-muted bg-bb-gray/10">
                                    <tr>
                                        <th className="p-2 text-left sticky left-0 bg-bb-dark z-10">Period</th>
                                        <th className="p-2 text-right">Revenue</th>
                                        <th className="p-2 text-right">Expenses</th>
                                        <th className="p-2 text-right">Op. Profit</th>
                                        <th className="p-2 text-right">OPM %</th>
                                        <th className="p-2 text-right">Net Profit</th>
                                        <th className="p-2 text-right">EPS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bb-border/30">
                                    {financials.annual_results.map((a, i) => (
                                        <tr key={i} className="hover:bg-bb-hover">
                                            <td className="p-2 text-bb-blue font-medium sticky left-0 bg-bb-dark">{a.period}</td>
                                            <td className="p-2 text-right text-bb-text">{formatUSD(a.revenue)}</td>
                                            <td className="p-2 text-right text-bb-text">{formatUSD(a.expenses)}</td>
                                            <td className={`p-2 text-right ${(a.operating_profit || 0) > 0 ? 'text-bb-green' : 'text-bb-red'}`}>{formatUSD(a.operating_profit)}</td>
                                            <td className={`p-2 text-right ${(a.opm_pct || 0) > 0 ? 'text-bb-green' : 'text-bb-red'}`}>{a.opm_pct != null ? `${a.opm_pct}%` : '—'}</td>
                                            <td className={`p-2 text-right ${(a.net_income || 0) > 0 ? 'text-bb-green' : 'text-bb-red'}`}>{formatUSD(a.net_income)}</td>
                                            <td className="p-2 text-right text-bb-text">{a.eps != null ? `$${a.eps}` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="text-center text-bb-muted text-xs py-8">No annual data available</div>}
                    </div>
                </div>

                <div id="fin-us-balance_sheet">
                    <div className="flex items-center gap-2 mb-4 text-bb-blue font-bold text-sm uppercase tracking-wide">
                        <Receipt size={16} /> Balance Sheet
                    </div>
                    <div className="space-y-0 border border-bb-border rounded p-4">
                        {financials.balance_sheet && Object.keys(financials.balance_sheet).length > 0 ? (
                            <>
                                <div className="text-[10px] text-bb-muted mb-2">As of {financials.balance_sheet.quarter}</div>
                                <RatioRow label="Total Assets" value={formatUSD(financials.balance_sheet.total_assets)} />
                                <RatioRow label="Total Liabilities" value={formatUSD(financials.balance_sheet.total_liabilities)} />
                                <RatioRow label="Stockholders Equity" value={formatUSD(financials.balance_sheet.total_equity)} />
                                <RatioRow label="Total Debt" value={formatUSD(financials.balance_sheet.total_debt)} />
                                <RatioRow label="Cash & Equivalents" value={formatUSD(financials.balance_sheet.cash_equivalents)} />
                            </>
                        ) : <div className="text-center text-bb-muted text-xs py-4">No balance sheet data available</div>}
                    </div>
                </div>

                <div id="fin-us-cashflow">
                    <div className="flex items-center gap-2 mb-4 text-bb-blue font-bold text-sm uppercase tracking-wide">
                        <Wallet size={16} /> Cashflow
                    </div>
                    <div className="space-y-0 border border-bb-border rounded p-4">
                        {financials.cashflow && Object.keys(financials.cashflow).length > 0 ? (
                            <>
                                <div className="text-[10px] text-bb-muted mb-2">Latest: {financials.cashflow.quarter}</div>
                                <RatioRow label="Operating Cash Flow" value={formatUSD(financials.cashflow.operating_cashflow)} />
                                <RatioRow label="Investing Cash Flow" value={formatUSD(financials.cashflow.investing_cashflow)} />
                                <RatioRow label="Financing Cash Flow" value={formatUSD(financials.cashflow.financing_cashflow)} />
                                <RatioRow label="Free Cash Flow" value={formatUSD(financials.cashflow.free_cashflow)} />
                            </>
                        ) : <div className="text-center text-bb-muted text-xs py-4">No cashflow data available</div>}
                    </div>
                </div>

            </div>
        </div>
    );
};




const USTradingTerminal = () => {
    const { theme } = useOutletContext();
    const [symbol, setSymbol] = useState('AAPL');
    const [currentPrice, setCurrentPrice] = useState(0);
    const [prevPrice, setPrevPrice] = useState(0);
    const [quote, setQuote] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [financials, setFinancials] = useState(null);
    const [stockDetail, setStockDetail] = useState(null);
    const [account, setAccount] = useState(null);
    const [chargesPreview, setChargesPreview] = useState(null);
    const [tradeHistory, setTradeHistory] = useState([]);
    const [productType, setProductType] = useState('DELIVERY');
    const [quantity, setQuantity] = useState(1);
    const [chartLoading, setChartLoading] = useState(true);
    const [tradeLoading, setTradeLoading] = useState(false);
    const [tradeResult, setTradeResult] = useState(null);
    const [marketStatus, setMarketStatus] = useState(null);
    const [usIndices, setUsIndices] = useState([]);
    const [showIndices, setShowIndices] = useState(false);

    const [chartTimeframe, setChartTimeframe] = useState({ period: '1y', interval: '1d', label: '1Y' });
    const [chartType, setChartType] = useState('candles');
    const [showVolume, setShowVolume] = useState(false);
    const [showSMA20, setShowSMA20] = useState(false);
    const [showSMA50, setShowSMA50] = useState(false);
    const [showEMA, setShowEMA] = useState(false);
    const [showDEMA, setShowDEMA] = useState(false);
    const [showBollinger, setShowBollinger] = useState(false);
    const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
    const volumeRef = useRef(null);
    const sma20Ref = useRef(null);
    const sma50Ref = useRef(null);
    const emaRef = useRef(null);
    const demaRef = useRef(null);
    const bbUpperRef = useRef(null);
    const bbLowerRef = useRef(null);
    const bbMiddleRef = useRef(null);
    const lineSeriesRef = useRef(null);

    const [measureMode, setMeasureMode] = useState(false);
    const [measureData, setMeasureData] = useState(null);
    const measureStartRef = useRef(null);
    const chartDataRef = useRef([]);

    const TIMEFRAMES = [
        { period: '5d', interval: '15m', label: '1D' },
        { period: '5d', interval: '1h', label: '1W' },
        { period: '1mo', interval: '1d', label: '1M' },
        { period: '3mo', interval: '1d', label: '3M' },
        { period: '6mo', interval: '1d', label: '6M' },
        { period: '1y', interval: '1d', label: '1Y' },
        { period: '2y', interval: '1d', label: '2Y' },
        { period: '5y', interval: '1wk', label: '5Y' },
    ];

    const chartContainerRef = useRef();
    const chartRef = useRef();
    const chartInstanceRef = useRef();



    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth, height: 500,
            crosshair: { mode: 0 },
            timeScale: { timeVisible: false },
        });

        chartInstanceRef.current = chart;
        const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        const chart = chartInstanceRef.current;
        if (!chart) return;

        const isDark = theme === 'dark';
        const bgColor = isDark ? '#131722' : '#ffffff';
        const textColor = isDark ? '#d1d4dc' : '#333333';
        const gridColor = isDark ? '#1e222d' : '#e0e0e0';
        const scaleBorder = isDark ? '#2a2e39' : '#e0e0e0';
        const candleUp = isDark ? '#26a69a' : '#008f75';
        const candleDown = isDark ? '#ef5350' : '#d32f2f';

        chart.applyOptions({
            layout: { background: { type: ColorType.Solid, color: bgColor }, textColor: textColor },
            grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
            timeScale: { borderColor: scaleBorder },
            rightPriceScale: { borderColor: scaleBorder },
        });

        if (chartRef.current) {
            chartRef.current.applyOptions({
                upColor: candleUp, downColor: candleDown,
                wickUpColor: candleUp, wickDownColor: candleDown,
            });
        }
    }, [theme]);

    const loadChartData = useCallback(async (sym, tf) => {
        setChartLoading(true);
        try {
            const history = await api.getUSHistory(sym, tf.period, tf.interval);
            const formattedData = history.data.map(d => ({
                time: d.Date.split('T')[0], open: d.Open, high: d.High, low: d.Low, close: d.Close, volume: d.Volume || 0
            }));
            const chart = chartInstanceRef.current;
            if (!chart) { setChartLoading(false); return; }

            [chartRef, lineSeriesRef, volumeRef, sma20Ref, sma50Ref, emaRef, demaRef, bbUpperRef, bbLowerRef, bbMiddleRef].forEach(ref => {
                if (ref.current) { try { chart.removeSeries(ref.current); } catch (e) { } ref.current = null; }
            });

            const isDark = theme === 'dark';
            const candleUp = isDark ? '#26a69a' : '#008f75';
            const candleDown = isDark ? '#ef5350' : '#d32f2f';

            if (chartType === 'candles') {
                const cs = chart.addCandlestickSeries({ upColor: candleUp, downColor: candleDown, borderVisible: false, wickUpColor: candleUp, wickDownColor: candleDown });
                cs.setData(formattedData);
                chartRef.current = cs;
            } else {
                const ls = chart.addLineSeries({ color: '#2962ff', lineWidth: 2 });
                ls.setData(formattedData.map(d => ({ time: d.time, value: d.close })));
                lineSeriesRef.current = ls;
            }

            if (showVolume) {
                const vs = chart.addHistogramSeries({ color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
                chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
                vs.setData(formattedData.map(d => ({ time: d.time, value: d.volume, color: d.close >= d.open ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)' })));
                volumeRef.current = vs;
            }

            if (showSMA20 && formattedData.length >= 20) {
                const sma20Data = [];
                for (let i = 19; i < formattedData.length; i++) {
                    const avg = formattedData.slice(i - 19, i + 1).reduce((a, d) => a + d.close, 0) / 20;
                    sma20Data.push({ time: formattedData[i].time, value: avg });
                }
                const s20 = chart.addLineSeries({ color: '#ff9800', lineWidth: 1 });
                s20.setData(sma20Data);
                sma20Ref.current = s20;
            }

            if (showSMA50 && formattedData.length >= 50) {
                const sma50Data = [];
                for (let i = 49; i < formattedData.length; i++) {
                    const avg = formattedData.slice(i - 49, i + 1).reduce((a, d) => a + d.close, 0) / 50;
                    sma50Data.push({ time: formattedData[i].time, value: avg });
                }
                const s50 = chart.addLineSeries({ color: '#e040fb', lineWidth: 1 });
                s50.setData(sma50Data);
                sma50Ref.current = s50;
            }

            if (showEMA && formattedData.length >= 21) {
                const k = 2 / (21 + 1);
                const emaData = [{ time: formattedData[0].time, value: formattedData[0].close }];
                for (let i = 1; i < formattedData.length; i++) {
                    emaData.push({ time: formattedData[i].time, value: formattedData[i].close * k + emaData[i - 1].value * (1 - k) });
                }
                const emaLine = chart.addLineSeries({ color: '#00bcd4', lineWidth: 1.5 });
                emaLine.setData(emaData);
                emaRef.current = emaLine;
            }

            if (showDEMA && formattedData.length >= 21) {
                const k = 2 / (21 + 1);
                const ema1 = [formattedData[0].close];
                for (let i = 1; i < formattedData.length; i++) ema1.push(formattedData[i].close * k + ema1[i - 1] * (1 - k));
                const ema2 = [ema1[0]];
                for (let i = 1; i < ema1.length; i++) ema2.push(ema1[i] * k + ema2[i - 1] * (1 - k));
                const demaData = formattedData.map((d, i) => ({ time: d.time, value: 2 * ema1[i] - ema2[i] }));
                const demaLine = chart.addLineSeries({ color: '#ffeb3b', lineWidth: 1.5 });
                demaLine.setData(demaData);
                demaRef.current = demaLine;
            }

            if (showBollinger && formattedData.length >= 20) {
                const period = 20, mult = 2;
                const upperData = [], lowerData = [], middleData = [];
                for (let i = period - 1; i < formattedData.length; i++) {
                    const slice = formattedData.slice(i - period + 1, i + 1);
                    const mean = slice.reduce((s, d) => s + d.close, 0) / period;
                    const variance = slice.reduce((s, d) => s + Math.pow(d.close - mean, 2), 0) / period;
                    const stdDev = Math.sqrt(variance);
                    middleData.push({ time: formattedData[i].time, value: mean });
                    upperData.push({ time: formattedData[i].time, value: mean + mult * stdDev });
                    lowerData.push({ time: formattedData[i].time, value: mean - mult * stdDev });
                }
                const bbM = chart.addLineSeries({ color: '#9c27b0', lineWidth: 1, lineStyle: 2 });
                bbM.setData(middleData); bbMiddleRef.current = bbM;
                const bbU = chart.addLineSeries({ color: 'rgba(156,39,176,0.5)', lineWidth: 1 });
                bbU.setData(upperData); bbUpperRef.current = bbU;
                const bbL = chart.addLineSeries({ color: 'rgba(156,39,176,0.5)', lineWidth: 1 });
                bbL.setData(lowerData); bbLowerRef.current = bbL;
            }

            chart.timeScale().fitContent();
            if (formattedData.length > 0) setCurrentPrice(formattedData[formattedData.length - 1].close);
            chartDataRef.current = formattedData;
        } catch (e) { }
        setChartLoading(false);
    }, [chartType, showVolume, showSMA20, showSMA50, showEMA, showDEMA, showBollinger]);

    const loadSymbol = useCallback(async (sym) => {
        setCompanyInfo(null);
        setFinancials(null);
        setStockDetail(null);
        loadChartData(sym, chartTimeframe);
        try { const q = await api.getUSQuote(sym); setCurrentPrice(q.price); setQuote(q); } catch (e) { }
        try { setCompanyInfo(await api.getUSCompanyInfo(sym)); } catch (e) { }
        try { setFinancials(await api.getUSFinancials(sym)); } catch (e) { }
        try { setStockDetail(await api.getUSStockDetail(sym)); } catch (e) { }
    }, [loadChartData, chartTimeframe]);

    const fetchQuote = useCallback(async () => {
        try { const q = await api.getUSQuote(symbol); setPrevPrice(currentPrice); setCurrentPrice(q.price); setQuote(q); } catch (e) { }
    }, [symbol, currentPrice]);

    const fetchAccount = useCallback(async () => {
        try { setAccount(await api.getUSAccount()); } catch (e) { }
    }, []);

    const fetchTrades = useCallback(async () => {
        try { setTradeHistory(await api.getUSHistoryTrades()); } catch (e) { }
    }, []);

    const fetchMarketStatus = useCallback(async () => {
        try { setMarketStatus(await api.getUSMarketStatus()); } catch (e) { }
    }, []);

    const fetchIndices = useCallback(async () => {
        try { setUsIndices(await api.getUSIndices()); } catch (e) { }
    }, []);

    const updateChargesPreview = useCallback(async () => {
        if (currentPrice <= 0 || quantity <= 0) return;
        try { setChargesPreview(await api.estimateUSCharges('SELL', productType, currentPrice, quantity)); } catch (e) { }
    }, [currentPrice, quantity, productType]);






    useEffect(() => { updateChargesPreview(); }, [updateChargesPreview]);

    useEffect(() => { loadChartData(symbol, chartTimeframe); }, [chartType, showVolume, showSMA20, showSMA50, showEMA, showDEMA, showBollinger]);

    useEffect(() => {
        if (!measureMode || !chartContainerRef.current || !chartInstanceRef.current) return;
        const container = chartContainerRef.current;
        const chart = chartInstanceRef.current;

        const getChartPrice = (y) => {
            const series = chartRef.current || lineSeriesRef.current;
            if (!series) return null;
            try { return series.coordinateToPrice(y); } catch { return null; }
        };

        const getChartTime = (x) => {
            try { return chart.timeScale().coordinateToTime(x); } catch { return null; }
        };

        const handleClick = (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const price = getChartPrice(y);
            const time = getChartTime(x);

            if (!measureStartRef.current) {
                measureStartRef.current = { x, y, price, time };
                setMeasureData({
                    startPrice: price, endPrice: price, priceDiff: 0, pricePct: 0, bars: 0,
                    startX: x, startY: y, endX: x, endY: y, isActive: true
                });
            } else {
                measureStartRef.current = null;
                setMeasureData(prev => prev ? { ...prev, isActive: false } : null);
            }
        };

        const handleMouseMove = (e) => {
            if (!measureStartRef.current) return;
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const endPrice = getChartPrice(y);
            const endTime = getChartTime(x);
            const start = measureStartRef.current;

            if (start.price != null && endPrice != null) {
                const priceDiff = endPrice - start.price;
                const pricePct = start.price !== 0 ? ((priceDiff / start.price) * 100) : 0;
                let bars = 0;
                if (start.time && endTime) {
                    const data = chartDataRef.current;
                    const startIdx = data.findIndex(d => d.time >= start.time);
                    const endIdx = data.findIndex(d => d.time >= endTime);
                    if (startIdx >= 0 && endIdx >= 0) bars = endIdx - startIdx;
                }
                setMeasureData({
                    startPrice: start.price, endPrice, priceDiff, pricePct, bars,
                    startX: start.x, startY: start.y, endX: x, endY: y, isActive: true
                });
            }
        };

        container.addEventListener('click', handleClick);
        container.addEventListener('mousemove', handleMouseMove);
        container.style.cursor = 'crosshair';

        return () => {
            container.removeEventListener('click', handleClick);
            container.removeEventListener('mousemove', handleMouseMove);
            container.style.cursor = '';
        };
    }, [measureMode]);

    const handleZoomIn = () => {
        const chart = chartInstanceRef.current;
        if (!chart) return;
        const ts = chart.timeScale();
        const range = ts.getVisibleLogicalRange();
        if (range) { const mid = (range.from + range.to) / 2; const span = (range.to - range.from) * 0.35; ts.setVisibleLogicalRange({ from: mid - span, to: mid + span }); }
    };

    const handleZoomOut = () => {
        const chart = chartInstanceRef.current;
        if (!chart) return;
        const ts = chart.timeScale();
        const range = ts.getVisibleLogicalRange();
        if (range) { const mid = (range.from + range.to) / 2; const span = (range.to - range.from) * 0.75; ts.setVisibleLogicalRange({ from: mid - span, to: mid + span }); }
    };

    const handleResetZoom = () => {
        const chart = chartInstanceRef.current;
        if (chart) chart.timeScale().fitContent();
        setMeasureData(null);
    };

    const handleTrade = async (side) => {
        if (tradeLoading) return;
        setTradeLoading(true); setTradeResult(null);
        try {
            const result = await api.executeUSTrade({
                symbol, side, quantity: parseFloat(quantity),
                price: currentPrice, strategy_name: "Manual Terminal", product_type: productType
            });
            setTradeResult({
                success: true,
                message: `${side} ${quantity} ${symbol} @ $${currentPrice.toFixed(2)} | Charges: $${result.charges?.total?.toFixed(4)} | Balance: $${result.balance?.toFixed(2)}`
            });
            fetchTrades(); fetchQuote(); fetchAccount();
        } catch (error) {
            setTradeResult({ success: false, message: error.response?.data?.detail || 'Trade execution failed' });
        }
        setTradeLoading(false);
        setTimeout(() => setTradeResult(null), 8000);
    };

    const handleSymbolSelect = (sym) => { setSymbol(sym); loadSymbol(sym); };

    useEffect(() => { loadSymbol(symbol); fetchTrades(); fetchAccount(); fetchMarketStatus(); fetchIndices(); }, []);
    useEffect(() => { const interval = setInterval(fetchQuote, 15000); return () => clearInterval(interval); }, [fetchQuote]);
    useEffect(() => { const interval = setInterval(fetchMarketStatus, 60000); return () => clearInterval(interval); }, []);

    const priceUp = currentPrice >= prevPrice;
    const orderValue = (quantity * currentPrice).toFixed(2);
    const orderValueINR = (quantity * currentPrice * 84).toFixed(2);

    const nseTabs = [
        { id: 'sec-chart', label: 'Dashboard' },
        { id: 'sec-financials', label: 'Financial Results' },
        { id: 'sec-returns', label: 'Returns & Performance' },
        { id: 'sec-trade-info', label: 'Trade Info' },
        { id: 'sec-actions', label: 'Corporate Actions' },
        { id: 'sec-holdings', label: 'Shareholding Patterns' },
        { id: 'sec-price-info', label: 'Price Information' },
        { id: 'sec-securities', label: 'Security Info' },
    ];

    const currentDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

    const ShareholdingPie = ({ data }) => {
        let cumulativePercent = 0;

        const getCoordinatesForPercent = (percent) => {
            const x = Math.cos(2 * Math.PI * percent);
            const y = Math.sin(2 * Math.PI * percent);
            return [x, y];
        };

        const paths = data.map((slice, index) => {
            const start = getCoordinatesForPercent(cumulativePercent);
            cumulativePercent += slice.percent / 100;
            const end = getCoordinatesForPercent(cumulativePercent);

            const largeArcFlag = slice.percent > 50 ? 1 : 0;

            const pathData = [
                `M 0 0`,
                `L ${start[0]} ${start[1]}`, // Scaled in viewBox
                `A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`,
                `Z`
            ].join(' ');

            return <path key={index} d={pathData} fill={slice.color} />;
        });

        return (
            <div className="relative w-48 h-48">
                <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                    {paths}
                </svg>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-bb-bg text-bb-text font-sans overflow-hidden">
            <div className="min-h-[3.5rem] border-b border-bb-border bg-bb-card px-3 md:px-4 py-2 flex flex-wrap justify-between items-center shadow-sm z-30 relative gap-2">
                <div className="flex items-center gap-4 w-full sm:w-1/3">
                    <SearchBar value={symbol} onSelect={handleSymbolSelect} placeholder="Search US Stocks..." market="US" />
                </div>

                <div className="flex items-center gap-2 md:gap-4 text-xs">
                    <div className="text-right hidden sm:block">
                        <span className="text-bb-muted block">US Market (ET)</span>
                        <span className={`font-bold ${marketStatus?.status === 'OPEN' ? 'text-bb-green' : 'text-bb-red'}`}>{marketStatus?.status || 'CLOSED'}</span>
                    </div>
                    <div className="text-bb-muted font-mono text-[10px] md:text-xs">{marketStatus?.server_time_et || currentTime} ET</div>
                    <div className={`sm:hidden px-2 py-0.5 rounded border font-bold text-[10px] ${marketStatus?.status === 'OPEN' ? 'bg-bb-green/10 text-bb-green border-bb-green/20' : 'bg-bb-red/10 text-bb-red border-bb-red/20'}`}>
                        {marketStatus?.status || 'CLOSED'}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0 relative z-10">

                <div className="lg:col-span-9 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="px-3 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row justify-between sm:items-end border-b border-bb-border bg-bb-bg/50 gap-2">
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold text-bb-text flex items-center gap-2">
                                {companyInfo?.name || symbol}
                                <span className="text-xs md:text-sm font-normal text-bb-muted bg-bb-gray/10 px-2 py-0.5 rounded">US-EQ</span>
                            </h1>
                            <div className="flex gap-2 md:gap-4 mt-1 text-[10px] md:text-xs text-bb-muted flex-wrap">
                                <span>{companyInfo?.sector || 'Sector N/A'}</span>
                                <span>|</span>
                                <span>Cap: {formatMarketCap(companyInfo?.market_cap)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold font-mono flex items-center gap-2">
                                ${currentPrice.toFixed(2)}
                                {quote && (
                                    <span className={`text-lg ${quote.change >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                                        {quote.change > 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.change_pct}%)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-[500px] border-b border-bb-border relative">
                        <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start flex-wrap gap-1">
                            <div className="bg-bb-card/90 backdrop-blur border border-bb-border rounded p-1 flex gap-0.5 shadow-sm">
                                {TIMEFRAMES.map(tf => (
                                    <button key={tf.label} onClick={() => { setChartTimeframe(tf); loadChartData(symbol, tf); }}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded hover:bg-bb-blue/20 ${chartTimeframe.label === tf.label ? 'text-bb-blue bg-bb-blue/10' : 'text-bb-muted'}`}>
                                        {tf.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-1">
                                <div className="bg-bb-card/90 backdrop-blur border border-bb-border rounded p-1 flex gap-0.5 shadow-sm">
                                    <button onClick={() => setChartType(prev => prev === 'candles' ? 'line' : 'candles')} className={`p-1 rounded hover:text-bb-blue ${chartType === 'candles' ? 'text-bb-blue' : 'text-bb-muted'}`} title="Toggle Candles/Line"><BarChart3 size={14} /></button>
                                    <button onClick={() => setShowVolume(!showVolume)} className={`p-1 rounded hover:text-bb-blue ${showVolume ? 'text-bb-blue' : 'text-bb-muted'}`} title="Volume"><Building2 size={14} /></button>
                                    <div className="w-px bg-bb-border mx-0.5" />
                                    <button onClick={() => setMeasureMode(!measureMode)} className={`p-1 rounded hover:text-bb-blue ${measureMode ? 'text-bb-orange' : 'text-bb-muted'}`} title="Measure Tool"><Ruler size={14} /></button>
                                    <button onClick={handleZoomIn} className="p-1 rounded hover:text-bb-blue text-bb-muted" title="Zoom In"><ZoomIn size={14} /></button>
                                    <button onClick={handleZoomOut} className="p-1 rounded hover:text-bb-blue text-bb-muted" title="Zoom Out"><ZoomOut size={14} /></button>
                                    <button onClick={handleResetZoom} className="p-1 rounded hover:text-bb-blue text-bb-muted" title="Reset"><Maximize2 size={14} /></button>
                                </div>

                                <div className="relative">
                                    <button onClick={() => setShowIndicatorPanel(!showIndicatorPanel)}
                                        className="bg-bb-card/90 backdrop-blur border border-bb-border rounded p-1 px-2 flex items-center gap-1 shadow-sm text-[10px] font-bold text-bb-muted hover:text-bb-blue">
                                        <Activity size={12} /> Indicators {showIndicatorPanel ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                    </button>
                                    {showIndicatorPanel && (
                                        <div className="absolute top-full right-0 mt-1 bg-bb-card border border-bb-border rounded shadow-xl p-2 z-50 min-w-[160px]">
                                            {[
                                                { label: 'SMA 20', active: showSMA20, toggle: () => setShowSMA20(!showSMA20), color: '#ff9800' },
                                                { label: 'SMA 50', active: showSMA50, toggle: () => setShowSMA50(!showSMA50), color: '#e040fb' },
                                                { label: 'EMA 21', active: showEMA, toggle: () => setShowEMA(!showEMA), color: '#00bcd4' },
                                                { label: 'DEMA 21', active: showDEMA, toggle: () => setShowDEMA(!showDEMA), color: '#ffeb3b' },
                                                { label: 'Bollinger', active: showBollinger, toggle: () => setShowBollinger(!showBollinger), color: '#9c27b0' },
                                            ].map(ind => (
                                                <button key={ind.label} onClick={ind.toggle}
                                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-medium transition-colors ${ind.active ? 'bg-bb-blue/10 text-bb-text' : 'text-bb-muted hover:bg-bb-gray/20'}`}>
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.active ? ind.color : '#555' }} />
                                                    {ind.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {chartLoading && <div className="absolute inset-0 bg-bb-bg/50 flex items-center justify-center z-20"><Loader className="animate-spin text-bb-blue" /></div>}
                        <div ref={chartContainerRef} className="w-full h-full" />

                        {/* SVG Measure Overlay */}
                        {measureMode && measureData && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ overflow: 'visible' }}>
                                <line
                                    x1={measureData.startX} y1={measureData.startY}
                                    x2={measureData.endX} y2={measureData.endY}
                                    stroke={measureData.priceDiff >= 0 ? '#26a69a' : '#ef5350'}
                                    strokeWidth="1.5" strokeDasharray="6 3" opacity="0.9"
                                />
                                <circle cx={measureData.startX} cy={measureData.startY} r="4"
                                    fill="#ff9900" stroke="#0b0e11" strokeWidth="1.5" />
                                <circle cx={measureData.endX} cy={measureData.endY} r="4"
                                    fill={measureData.priceDiff >= 0 ? '#26a69a' : '#ef5350'} stroke="#0b0e11" strokeWidth="1.5" />
                                <line x1="0" y1={measureData.startY} x2="100%" y2={measureData.startY}
                                    stroke="#ff9900" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                                <line x1="0" y1={measureData.endY} x2="100%" y2={measureData.endY}
                                    stroke={measureData.priceDiff >= 0 ? '#26a69a' : '#ef5350'} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
                                {(() => {
                                    const midX = (measureData.startX + measureData.endX) / 2;
                                    const midY = (measureData.startY + measureData.endY) / 2;
                                    const labelText = `${measureData.priceDiff >= 0 ? '+' : ''}${measureData.priceDiff.toFixed(2)} (${measureData.pricePct >= 0 ? '+' : ''}${measureData.pricePct.toFixed(2)}%) | ${Math.abs(measureData.bars)} bars`;
                                    return (
                                        <g>
                                            <rect x={midX - 95} y={midY - 22} width="190" height="20" rx="4"
                                                fill={measureData.priceDiff >= 0 ? '#26a69a' : '#ef5350'} opacity="0.9" />
                                            <text x={midX} y={midY - 9} textAnchor="middle" fill="white"
                                                fontSize="10" fontWeight="bold" fontFamily="Consolas, monospace">
                                                {labelText}
                                            </text>
                                        </g>
                                    );
                                })()}
                            </svg>
                        )}

                        {/* Floating Measure Panel */}
                        {measureMode && (
                            <div className="absolute top-14 right-4 bg-bb-card p-3 rounded border border-bb-border text-xs z-30 shadow-lg min-w-[180px]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-bb-orange tracking-wider text-[10px]">MEASURE</span>
                                    {measureData ? (
                                        <button onClick={() => { measureStartRef.current = null; setMeasureData(null); }}
                                            className="text-[9px] text-bb-muted hover:text-bb-red px-1.5 py-0.5 border border-bb-border rounded">
                                            CLEAR
                                        </button>
                                    ) : (
                                        <span className="text-[9px] text-bb-muted animate-pulse">Click start point...</span>
                                    )}
                                </div>
                                {measureData ? (
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-bb-muted">Price</span>
                                            <span className={measureData.priceDiff >= 0 ? 'text-bb-green font-bold' : 'text-bb-red font-bold'}>
                                                {measureData.priceDiff >= 0 ? '+' : ''}{measureData.priceDiff.toFixed(2)} ({measureData.pricePct >= 0 ? '+' : ''}{measureData.pricePct.toFixed(2)}%)
                                            </span>
                                        </div>
                                        <div className="flex justify-between"><span className="text-bb-muted">Bars</span><span className="text-bb-text font-mono">{Math.abs(measureData.bars)}</span></div>
                                        <div className="border-t border-bb-border/30 pt-1 mt-1 flex justify-between text-[10px]">
                                            <span className="text-bb-muted">${measureData.startPrice?.toFixed(2)}</span>
                                            <span className="text-bb-muted">→</span>
                                            <span className="text-bb-text font-bold">${measureData.endPrice?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        <div className="flex border-b border-bb-border mb-6">
                            {['Financials', 'Shareholding', 'Corporate Actions', 'Trade Info'].map(tab => (
                                <button key={tab} onClick={() => scrollToSection(`sec-${tab.toLowerCase().replace(' ', '-')}`)}
                                    className="px-6 py-2 text-sm font-medium text-bb-muted hover:text-bb-blue hover:border-b-2 hover:border-bb-blue transition-all">
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-12">
                            <div id="sec-financials">
                                <SectionTitle id="sec-financials" title="Financials" icon={<DollarSign size={16} className="text-bb-blue" />} />
                                {financials ? <FinancialsPanel financials={financials} /> : <div className="p-4 text-center text-bb-muted text-sm">Loading...</div>}
                            </div>

                            <div id="sec-shareholding" className="bg-bb-card border border-bb-border rounded p-6">
                                <h3 className="text-lg font-bold mb-6">Shareholding Pattern</h3>
                                {stockDetail?.shareholding ? (
                                    <div className="flex items-center justify-around">
                                        <ShareholdingPie data={[
                                            { percent: stockDetail.shareholding.promoters || 0, color: '#3b82f6' }, // blue
                                            { percent: stockDetail.shareholding.institutions || 0, color: '#10b981' }, // green
                                            { percent: stockDetail.shareholding.public || 0, color: '#ef4444' } // red
                                        ]} />
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm" /> Insiders: {stockDetail.shareholding.promoters}%</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Institutions: {stockDetail.shareholding.institutions}%</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm" /> Public: {stockDetail.shareholding.public}%</div>
                                        </div>
                                    </div>
                                ) : <div className="text-center text-bb-muted">No data available</div>}
                            </div>

                            <div id="sec-corporate-actions">
                                <SectionTitle title="Corporate Actions" icon={<Receipt size={16} />} />
                                {stockDetail?.corporate_actions?.length > 0 ? (
                                    <div className="border border-bb-border rounded overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-bb-gray/10 text-bb-muted text-xs uppercase">
                                                <tr><th className="p-3 text-left">Type</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Details</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-bb-border/20">
                                                {stockDetail.corporate_actions.map((act, i) => (
                                                    <tr key={i} className="hover:bg-bb-gray/5">
                                                        <td className="p-3 font-semibold text-bb-blue">{act.type}</td>
                                                        <td className="p-3">{act.date}</td>
                                                        <td className="p-3 text-bb-muted">{act.details}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <div className="text-sm text-bb-muted italic">No recent actions</div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-bb-border min-h-0 flex flex-col bg-bb-card overflow-y-auto custom-scrollbar">
                    <div className="p-4">
                        <div className="flex bg-bb-bg rounded p-1 mb-4">
                            <button onClick={() => setProductType('INTRADAY')} className={`flex-1 py-1 text-xs font-bold rounded ${productType === 'INTRADAY' ? 'bg-bb-blue text-white shadow' : 'text-bb-muted'}`}>INTRADAY</button>
                            <button onClick={() => setProductType('DELIVERY')} className={`flex-1 py-1 text-xs font-bold rounded ${productType === 'DELIVERY' ? 'bg-bb-blue text-white shadow' : 'text-bb-muted'}`}>DELIVERY</button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-bb-muted uppercase font-bold">Quantity</label>
                                <div className="flex items-center mt-1">
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full bg-bb-bg border border-bb-border rounded p-2 font-bold text-center focus:border-bb-blue outline-none" />
                                </div>
                            </div>

                            <div className="bg-bb-bg rounded border border-bb-border text-[11px]">
                                <div className="px-3 py-2 border-b border-bb-border/50 flex justify-between items-center">
                                    <span className="font-bold text-bb-text">Order Summary</span>
                                    <span className="text-bb-muted">{productType}</span>
                                </div>
                                <div className="px-3 py-1.5 space-y-1">
                                    <div className="flex justify-between"><span className="text-bb-muted">Order Value</span><span className="font-bold text-bb-text">${orderValue}</span></div>
                                    <div className="flex justify-between"><span className="text-bb-muted">Est. INR</span><span className="font-medium">₹{orderValueINR}</span></div>
                                </div>
                                <div className="border-t border-bb-border/50 px-3 py-1.5 space-y-1">
                                    <div className="flex justify-between text-bb-muted"><span>Commission</span><span>${chargesPreview?.commission || '0.00'}</span></div>
                                    <div className="flex justify-between text-bb-muted"><span>SEC Fee</span><span>${chargesPreview?.sec_fee || '0.0000'}</span></div>
                                    <div className="flex justify-between text-bb-muted"><span>FINRA TAF</span><span>${chargesPreview?.finra_taf || '0.0000'}</span></div>
                                </div>
                                <div className="border-t border-bb-border px-3 py-2 flex justify-between font-bold">
                                    <span>Total Charges</span>
                                    <span className="text-bb-orange">${chargesPreview?.total || '0.0000'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleTrade('BUY')} disabled={tradeLoading}
                                    className="bg-bb-green hover:bg-bb-green/90 text-white py-3 rounded font-bold shadow-lg shadow-bb-green/20 flex items-center justify-center gap-2 disabled:opacity-60">
                                    {tradeLoading ? <Loader size={16} className="animate-spin" /> : null}
                                    {tradeLoading ? 'Processing...' : 'BUY'}
                                </button>
                                <button onClick={() => handleTrade('SELL')} disabled={tradeLoading}
                                    className="bg-bb-red hover:bg-bb-red/90 text-white py-3 rounded font-bold shadow-lg shadow-bb-red/20 flex items-center justify-center gap-2 disabled:opacity-60">
                                    {tradeLoading ? <Loader size={16} className="animate-spin" /> : null}
                                    {tradeLoading ? 'Processing...' : 'SELL'}
                                </button>
                            </div>
                            {tradeResult && (
                                <div className={`p-2 rounded text-xs border ${tradeResult.success ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    {tradeResult.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="px-4 py-2 border-b border-bb-border font-bold text-sm bg-bb-bg/50">Recent Executions</div>
                        <div className="flex-1 overflow-y-auto text-xs">
                            {tradeHistory.length === 0 ? <div className="p-4 text-center text-bb-muted">No trades yet</div> : tradeHistory.map(t => (
                                <div key={t.id} className="flex justify-between p-2 border-b border-bb-border/10 hover:bg-bb-bg/50">
                                    <span className={t.side === 'BUY' ? 'text-bb-green font-bold' : 'text-bb-red font-bold'}>{t.side}</span>
                                    <span>{t.quantity} @ ${t.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default USTradingTerminal;
