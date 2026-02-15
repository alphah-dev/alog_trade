import React, { useState } from 'react';
import { api } from '../api';
import {
    AlertTriangle, Loader, TrendingUp, TrendingDown, BarChart3, Building2,
    Activity, Target, Layers, GitBranch, ArrowRight, ChevronDown, ChevronUp,
    Info, Cpu, Database, LineChart, Shield
} from 'lucide-react';
import SearchBar from '../components/SearchBar';

/* ── Reusable ─────────────────────────────────────────────────────── */
const MetricRow = ({ label, value, color }) => (
    <div className="flex justify-between py-2 border-b border-bb-border/30 text-xs">
        <span className="text-bb-muted">{label}</span>
        <span className={color || 'text-bb-text'}>{value ?? '—'}</span>
    </div>
);

const SectionDivider = ({ label }) => (
    <div className="flex items-center gap-3 py-4">
        <div className="h-px flex-1 bg-bb-border/50" />
        <span className="text-[10px] font-bold text-bb-muted tracking-[0.2em]">{label}</span>
        <div className="h-px flex-1 bg-bb-border/50" />
    </div>
);

const IndicatorGauge = ({ label, value, min, max, zones }) => {
    if (value == null) return null;
    const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    let color = 'bg-bb-text';
    if (zones) {
        zones.forEach(z => { if (value >= z.from && value <= z.to) color = z.color; });
    }
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-bb-muted">{label}</span>
                <span className="text-bb-text font-mono font-bold">{typeof value === 'number' ? value.toFixed(2) : value}</span>
            </div>
            <div className="h-1.5 bg-bb-gray/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

/* ── Main Component ───────────────────────────────────────────────── */
const ResearchLab = () => {
    const [symbol, setSymbol] = useState('TCS.NS');
    const [prediction, setPrediction] = useState(null);
    const [backtest, setBacktest] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showMethodology, setShowMethodology] = useState(false);
    const [showTradeLog, setShowTradeLog] = useState(false);

    const handleSymbolSelect = (sym) => setSymbol(sym);

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        setPrediction(null);
        setBacktest(null);
        setCompanyInfo(null);
        try {
            const [pred, bt, info] = await Promise.allSettled([
                api.getPrediction(symbol),
                api.runBacktest(symbol),
                api.getCompanyInfo(symbol)
            ]);
            if (pred.status === 'fulfilled') {
                if (pred.value.error) { setError(pred.value.error); setLoading(false); return; }
                setPrediction(pred.value);
            } else {
                setError(pred.reason?.response?.data?.detail || 'Prediction failed');
            }
            if (bt.status === 'fulfilled') setBacktest(bt.value);
            if (info.status === 'fulfilled') setCompanyInfo(info.value);
        } catch (e) {
            setError('Analysis failed. Please try again.');
        }
        setLoading(false);
    };

    const formatMarketCap = (val) => {
        if (!val) return 'N/A';
        if (val >= 1e12) return `₹${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `₹${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)}Cr`;
        return `₹${val.toLocaleString()}`;
    };

    const rsiZones = [
        { from: 0, to: 30, color: 'bg-bb-green' },
        { from: 30, to: 70, color: 'bg-bb-blue' },
        { from: 70, to: 100, color: 'bg-bb-red' },
    ];

    const sentimentColor = (s) => s > 0.2 ? 'text-bb-green' : s < -0.2 ? 'text-bb-red' : 'text-bb-text';
    const sentimentLabel = (s) => {
        if (s > 0.5) return 'STRONGLY BULLISH';
        if (s > 0.2) return 'BULLISH';
        if (s > -0.2) return 'NEUTRAL';
        if (s > -0.5) return 'BEARISH';
        return 'STRONGLY BEARISH';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="bg-bb-dark border border-bb-border rounded p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-bb-text tracking-wide">RESEARCH LAB</h2>
                        <p className="text-bb-muted text-[11px] sm:text-xs mt-0.5">Quantitative Analysis and Predictive Modeling</p>
                    </div>
                    <button
                        onClick={() => setShowMethodology(!showMethodology)}
                        className="flex items-center gap-1.5 text-[11px] text-bb-muted hover:text-bb-text border border-bb-border px-3 py-1.5 rounded transition-colors"
                    >
                        <Info size={12} />
                        Methodology
                        {showMethodology ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>

                {/* ── Methodology Panel ─────────────────────────────── */}
                {showMethodology && (
                    <div className="mb-5 bg-bb-gray/20 border border-bb-border/50 rounded p-4 sm:p-5 space-y-4 text-[11px] sm:text-xs text-bb-muted leading-relaxed">
                        <div className="text-xs font-bold text-bb-text tracking-wider mb-3">PREDICTION METHODOLOGY</div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-bb-text font-bold text-[11px]">
                                    <Database size={13} className="text-bb-orange" /> DATA PIPELINE
                                </div>
                                <p>
                                    Historical OHLCV data is retrieved via the yFinance API (100-day rolling window for predictions, 5-year window for training).
                                    Data is preprocessed with forward-fill for missing values and validated for continuity.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-bb-text font-bold text-[11px]">
                                    <Layers size={13} className="text-bb-orange" /> FEATURE ENGINEERING
                                </div>
                                <p>
                                    Nine features are computed from raw price data:
                                    <strong className="text-bb-text"> Lag-1 / Lag-2 returns</strong> (momentum),
                                    <strong className="text-bb-text"> ATR</strong> (14-period volatility),
                                    <strong className="text-bb-text"> Volume</strong>,
                                    <strong className="text-bb-text"> SMA-20 / SMA-50</strong> (trend),
                                    <strong className="text-bb-text"> RSI-14</strong> (oscillator),
                                    <strong className="text-bb-text"> MACD / Signal Line</strong> (convergence-divergence).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-bb-text font-bold text-[11px]">
                                    <Cpu size={13} className="text-bb-orange" /> MODEL
                                </div>
                                <p>
                                    A <strong className="text-bb-text">Random Forest Classifier</strong> (200 trees, max depth 10, balanced class weights) is trained with an 80/20
                                    temporal split. The model outputs a directional signal (BUY/SELL) with a probability-based confidence score.
                                    A composite <strong className="text-bb-text">sentiment score</strong> is derived from returns momentum (40%), SMA crossover (30%), RSI signal (15%), and normalized MACD (15%).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2 border-t border-bb-border/30">
                            <Shield size={13} className="text-bb-orange mt-0.5 shrink-0" />
                            <p className="text-[10px]">
                                <strong className="text-bb-text">Disclaimer:</strong> This model is designed for educational and research purposes.
                                Predictions are based on historical price patterns and technical indicators. They do not constitute financial advice.
                                Past performance does not guarantee future results.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Search Bar ────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                    <div className="flex-1">
                        <SearchBar value={symbol.replace('.NS', '')} onSelect={handleSymbolSelect} placeholder="Enter symbol" />
                    </div>
                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className="bg-bb-orange text-black px-6 sm:px-8 py-2.5 text-xs font-bold tracking-wider rounded hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                        {loading ? <><Loader size={14} className="animate-spin" /> ANALYZING...</> : <><Target size={14} /> RUN ANALYSIS</>}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-bb-red/10 border border-bb-red/30 rounded text-bb-red text-xs flex items-center justify-center gap-2">
                        <AlertTriangle size={14} /> {error}
                    </div>
                )}
            </div>

            {/* ── Company Overview ──────────────────────────────────── */}
            {companyInfo && (
                <div className="bg-bb-dark border border-bb-border rounded p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-bb-orange shrink-0" />
                            <span className="text-bb-text font-bold text-sm">{companyInfo.name}</span>
                        </div>
                        <span className="text-bb-muted text-[10px] sm:text-[11px]">{companyInfo.sector} | {companyInfo.industry}</span>
                    </div>
                    {companyInfo.description && (
                        <p className="text-bb-muted text-[11px] leading-relaxed mb-3 line-clamp-3">{companyInfo.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-bb-gray/20 p-2.5 sm:p-3 border border-bb-border/30 rounded">
                            <div className="text-[9px] sm:text-[10px] text-bb-muted mb-1 tracking-wider">MARKET CAP</div>
                            <div className="text-xs sm:text-sm text-bb-orange font-bold">{formatMarketCap(companyInfo.market_cap)}</div>
                        </div>
                        <div className="bg-bb-gray/20 p-2.5 sm:p-3 border border-bb-border/30 rounded">
                            <div className="text-[9px] sm:text-[10px] text-bb-muted mb-1 tracking-wider">P/E RATIO</div>
                            <div className="text-xs sm:text-sm text-bb-text font-bold">{companyInfo.pe_ratio?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div className="bg-bb-gray/20 p-2.5 sm:p-3 border border-bb-border/30 rounded">
                            <div className="text-[9px] sm:text-[10px] text-bb-muted mb-1 tracking-wider">52W RANGE</div>
                            <div className="text-xs sm:text-sm font-bold">
                                <span className="text-bb-green">{companyInfo.week_52_high}</span>
                                <span className="text-bb-muted"> / </span>
                                <span className="text-bb-red">{companyInfo.week_52_low}</span>
                            </div>
                        </div>
                        <div className="bg-bb-gray/20 p-2.5 sm:p-3 border border-bb-border/30 rounded">
                            <div className="text-[9px] sm:text-[10px] text-bb-muted mb-1 tracking-wider">DIVIDEND YIELD</div>
                            <div className="text-xs sm:text-sm text-bb-green font-bold">{companyInfo.dividend_yield || 0}%</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Prediction + Backtest ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {prediction && (
                    <div className="bg-bb-dark border border-bb-border rounded overflow-hidden">
                        {/* Signal Header */}
                        <div className={`px-4 sm:px-5 py-3 sm:py-4 border-b border-bb-border/50 ${prediction.prediction === 'BUY' ? 'bg-bb-green/5' : 'bg-bb-red/5'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[9px] sm:text-[10px] text-bb-muted font-bold tracking-[0.2em] mb-1">ML PREDICTION (24H HORIZON)</div>
                                    <div className={`text-3xl sm:text-4xl font-black flex items-center gap-2 ${prediction.prediction === 'BUY' ? 'text-bb-green' : 'text-bb-red'}`}>
                                        {prediction.prediction === 'BUY' ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                                        {prediction.prediction}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] sm:text-[10px] text-bb-muted tracking-wider mb-1">CONFIDENCE</div>
                                    <div className="text-2xl sm:text-3xl font-black text-bb-orange font-mono">{(prediction.confidence * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Indicators */}
                        <div className="p-4 sm:p-5 space-y-4">
                            <div className="text-[10px] font-bold text-bb-muted tracking-[0.2em]">TECHNICAL INDICATORS</div>

                            <div className="space-y-3">
                                {prediction.current_price && (
                                    <MetricRow label="Current Price" value={`₹${prediction.current_price}`} />
                                )}

                                <IndicatorGauge label="RSI (14)" value={prediction.rsi} min={0} max={100} zones={rsiZones} />

                                {prediction.sma_20 !== undefined && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-bb-gray/20 p-2.5 rounded border border-bb-border/20">
                                            <div className="text-[9px] text-bb-muted mb-1">SMA-20</div>
                                            <div className="text-xs font-mono font-bold text-bb-text">{prediction.sma_20}</div>
                                        </div>
                                        <div className="bg-bb-gray/20 p-2.5 rounded border border-bb-border/20">
                                            <div className="text-[9px] text-bb-muted mb-1">SMA-50</div>
                                            <div className="text-xs font-mono font-bold text-bb-text">{prediction.sma_50}</div>
                                        </div>
                                    </div>
                                )}

                                {prediction.sma_20 !== undefined && prediction.sma_50 !== undefined && (
                                    <MetricRow
                                        label="SMA Crossover Signal"
                                        value={prediction.sma_20 > prediction.sma_50 ? 'BULLISH (20 > 50)' : 'BEARISH (20 < 50)'}
                                        color={prediction.sma_20 > prediction.sma_50 ? 'text-bb-green' : 'text-bb-red'}
                                    />
                                )}

                                {prediction.macd !== undefined && (
                                    <MetricRow label="MACD" value={prediction.macd} />
                                )}
                            </div>

                            {/* Sentiment */}
                            {prediction.nlp_sentiment_score !== undefined && (
                                <div className="mt-4 pt-4 border-t border-bb-border/30">
                                    <div className="text-[10px] font-bold text-bb-muted tracking-[0.2em] mb-3">COMPOSITE SENTIMENT</div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-lg font-black font-mono ${sentimentColor(prediction.nlp_sentiment_score)}`}>
                                                {prediction.nlp_sentiment_score > 0 ? '+' : ''}{prediction.nlp_sentiment_score.toFixed(4)}
                                            </div>
                                            <div className={`text-[10px] font-bold tracking-wider ${sentimentColor(prediction.nlp_sentiment_score)}`}>
                                                {sentimentLabel(prediction.nlp_sentiment_score)}
                                            </div>
                                        </div>
                                        <div className="text-right text-[9px] text-bb-muted leading-relaxed max-w-[160px]">
                                            Weighted composite of returns momentum, SMA crossover, RSI, and MACD signals.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {backtest && (
                    <div className="bg-bb-dark border border-bb-border rounded overflow-hidden">
                        {/* Backtest Header */}
                        <div className={`px-4 sm:px-5 py-3 sm:py-4 border-b border-bb-border/50 ${backtest.total_return_pct >= 0 ? 'bg-bb-green/5' : 'bg-bb-red/5'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[9px] sm:text-[10px] text-bb-muted font-bold tracking-[0.2em] mb-1">SMA CROSSOVER BACKTEST (1Y)</div>
                                    <div className={`text-3xl sm:text-4xl font-black font-mono ${backtest.total_return_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                                        {backtest.total_return_pct >= 0 ? '+' : ''}{backtest.total_return_pct}%
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] sm:text-[10px] text-bb-muted tracking-wider mb-1">FINAL EQUITY</div>
                                    <div className={`text-xl sm:text-2xl font-black font-mono ${backtest.final_value >= backtest.initial_capital ? 'text-bb-green' : 'text-bb-red'}`}>
                                        ₹{backtest.final_value?.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Backtest Metrics */}
                        <div className="p-4 sm:p-5 space-y-3">
                            <div className="text-[10px] font-bold text-bb-muted tracking-[0.2em]">SIMULATION METRICS</div>
                            <MetricRow label="Initial Capital" value={`₹${backtest.initial_capital?.toLocaleString()}`} />
                            <MetricRow label="Total Trades Executed" value={backtest.total_trades} />
                            <MetricRow label="Strategy" value="SMA 20/50 Crossover" />

                            {/* Trade Log */}
                            {backtest.trades && backtest.trades.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-bb-border/30">
                                    <button
                                        onClick={() => setShowTradeLog(!showTradeLog)}
                                        className="flex items-center justify-between w-full text-[10px] font-bold text-bb-muted tracking-[0.2em] hover:text-bb-text transition-colors"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <BarChart3 size={12} /> TRADE LOG (LAST 10)
                                        </span>
                                        {showTradeLog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>

                                    {showTradeLog && (
                                        <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                            {backtest.trades.slice(-10).map((t, i) => (
                                                <div key={i} className="flex justify-between text-[10px] sm:text-[11px] p-1.5 hover:bg-bb-hover border-b border-bb-border/20 rounded font-mono">
                                                    <span className="text-bb-muted">{t.date}</span>
                                                    <span className={`font-bold ${t.type === 'BUY' ? 'text-bb-green' : 'text-bb-red'}`}>{t.type}</span>
                                                    <span className="text-bb-text">₹{t.price}</span>
                                                    <span className="text-bb-muted">x{t.shares}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Disclaimer */}
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                            <div className="p-3 bg-bb-orange/5 border border-bb-orange/20 rounded flex gap-2.5 items-start">
                                <AlertTriangle size={14} className="text-bb-orange mt-0.5 shrink-0" />
                                <p className="text-[10px] text-bb-muted leading-relaxed">
                                    Simulated performance using SMA crossover strategy on historical OHLC data.
                                    Past results are not indicative of future performance.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Model Architecture Summary ─────────────────────── */}
            {(prediction || backtest) && (
                <div className="bg-bb-dark border border-bb-border rounded p-4 sm:p-5">
                    <div className="text-[10px] font-bold text-bb-muted tracking-[0.2em] mb-4">MODEL ARCHITECTURE</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                        {[
                            { label: 'MODEL', value: 'Random Forest', sub: 'Classifier' },
                            { label: 'ESTIMATORS', value: '200', sub: 'Decision Trees' },
                            { label: 'MAX DEPTH', value: '10', sub: 'Per Tree' },
                            { label: 'FEATURES', value: '9', sub: 'Technical' },
                            { label: 'TRAINING', value: '5Y', sub: 'Daily OHLCV' },
                            { label: 'PREDICTION', value: '100D', sub: 'Rolling Window' },
                        ].map((item, i) => (
                            <div key={i} className="bg-bb-gray/20 p-2.5 sm:p-3 rounded border border-bb-border/20 text-center">
                                <div className="text-[8px] sm:text-[9px] text-bb-muted tracking-wider mb-1">{item.label}</div>
                                <div className="text-sm sm:text-base font-black text-bb-text font-mono">{item.value}</div>
                                <div className="text-[8px] sm:text-[9px] text-bb-muted">{item.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResearchLab;