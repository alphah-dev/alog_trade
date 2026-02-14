import React, { useState } from 'react';
import { api } from '../api';
import { BrainCircuit, AlertTriangle, Loader, TrendingUp, TrendingDown, BarChart3, Building2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const ResearchLab = () => {
    const [symbol, setSymbol] = useState('TCS.NS');
    const [prediction, setPrediction] = useState(null);
    const [backtest, setBacktest] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSymbolSelect = (sym) => {
        setSymbol(sym);
    };

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
                if (pred.value.error) {
                    setError(pred.value.error);
                    setLoading(false);
                    return;
                }
                setPrediction(pred.value);
            } else {
                setError(pred.reason?.response?.data?.detail || 'Prediction failed');
            }

            if (bt.status === 'fulfilled') setBacktest(bt.value);
            if (info.status === 'fulfilled') setCompanyInfo(info.value);
        } catch (e) {
            setError('Analysis failed');
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

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="bg-bb-dark border border-bb-border rounded p-8 text-center">
                <h2 className="text-lg font-semibold text-bb-text mb-2">Strategy Lab</h2>
                <p className="text-bb-muted text-sm mb-6">Run predictive models & historical simulations</p>

                <div className="flex justify-center gap-4 max-w-md mx-auto">
                    <div className="flex-1">
                        <SearchBar
                            value={symbol.replace('.NS', '')}
                            onSelect={handleSymbolSelect}
                            placeholder="Search symbol"
                        />
                    </div>
                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className="bg-bb-orange text-black px-8 py-2.5 font-medium rounded hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                        {loading ? <><Loader size={16} className="animate-spin" /> Running...</> : <><BrainCircuit size={16} /> Analyze</>}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-bb-red/10 border border-bb-red/30 rounded text-bb-red text-xs flex items-center justify-center gap-2">
                        <AlertTriangle size={14} /> {error}
                    </div>
                )}
            </div>

            {companyInfo && (
                <div className="bg-bb-dark border border-bb-border rounded p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Building2 size={16} className="text-bb-orange" />
                        <span className="text-bb-text font-medium text-sm">{companyInfo.name}</span>
                        <span className="text-bb-muted text-[11px]">{companyInfo.sector} | {companyInfo.industry}</span>
                    </div>
                    {companyInfo.description && (
                        <p className="text-bb-muted text-xs leading-relaxed mb-3">{companyInfo.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-bb-gray/30 p-3 border border-bb-border/30 rounded">
                            <div className="text-[10px] text-bb-muted mb-1">Market Cap</div>
                            <div className="text-sm text-bb-orange font-medium">{formatMarketCap(companyInfo.market_cap)}</div>
                        </div>
                        <div className="bg-bb-gray/30 p-3 border border-bb-border/30 rounded">
                            <div className="text-[10px] text-bb-muted mb-1">P/E Ratio</div>
                            <div className="text-sm text-bb-text font-medium">{companyInfo.pe_ratio?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div className="bg-bb-gray/30 p-3 border border-bb-border/30 rounded">
                            <div className="text-[10px] text-bb-muted mb-1">52W High / Low</div>
                            <div className="text-sm font-medium">
                                <span className="text-bb-green">₹{companyInfo.week_52_high}</span>
                                <span className="text-bb-muted"> / </span>
                                <span className="text-bb-red">₹{companyInfo.week_52_low}</span>
                            </div>
                        </div>
                        <div className="bg-bb-gray/30 p-3 border border-bb-border/30 rounded">
                            <div className="text-[10px] text-bb-muted mb-1">Div Yield</div>
                            <div className="text-sm text-bb-green font-medium">{companyInfo.dividend_yield || 0}%</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {prediction && (
                    <div className="bg-bb-dark border border-bb-border rounded p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BrainCircuit size={100} className="text-bb-orange" />
                        </div>
                        <h3 className="text-bb-muted text-[11px] font-medium mb-4">Predictive Model (24H)</h3>
                        <div className={`text-5xl font-bold mb-2 flex items-center gap-3 ${prediction.prediction === 'BUY' ? 'text-bb-green' : 'text-bb-red'}`}>
                            {prediction.prediction === 'BUY' ? <TrendingUp size={36} /> : <TrendingDown size={36} />}
                            {prediction.prediction}
                        </div>
                        <div className="text-bb-orange text-xl mb-4">
                            Confidence: {(prediction.confidence * 100).toFixed(1)}%
                        </div>

                        <div className="space-y-2 border-t border-bb-border pt-4">
                            {prediction.current_price && (
                                <div className="flex justify-between text-xs text-bb-muted">
                                    <span>Current Price</span>
                                    <span className="text-bb-text">₹{prediction.current_price}</span>
                                </div>
                            )}
                            {prediction.rsi !== undefined && (
                                <div className="flex justify-between text-xs text-bb-muted">
                                    <span>RSI (14)</span>
                                    <span className={prediction.rsi > 70 ? 'text-bb-red' : prediction.rsi < 30 ? 'text-bb-green' : 'text-bb-text'}>{prediction.rsi}</span>
                                </div>
                            )}
                            {prediction.sma_20 !== undefined && (
                                <div className="flex justify-between text-xs text-bb-muted">
                                    <span>SMA 20 / 50</span>
                                    <span className="text-bb-text">₹{prediction.sma_20} / ₹{prediction.sma_50}</span>
                                </div>
                            )}
                            {prediction.nlp_sentiment_score !== undefined && (
                                <div className="flex justify-between text-xs text-bb-muted">
                                    <span>Sentiment Score</span>
                                    <span className={prediction.nlp_sentiment_score > 0 ? 'text-bb-green' : 'text-bb-red'}>
                                        {prediction.nlp_sentiment_score > 0 ? '+' : ''}{prediction.nlp_sentiment_score.toFixed(4)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {backtest && (
                    <div className="bg-bb-dark border border-bb-border rounded p-6 relative">
                        <h3 className="text-bb-muted text-[11px] font-medium mb-4">Historical Backtest (1Y)</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-bb-border pb-2">
                                <span className="text-sm text-bb-muted">Total Return</span>
                                <span className={`text-3xl font-semibold ${backtest.total_return_pct >= 0 ? 'text-bb-green' : 'text-bb-red'}`}>
                                    {backtest.total_return_pct >= 0 ? '+' : ''}{backtest.total_return_pct}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-bb-muted">Initial Capital</span>
                                <span className="text-bb-text">₹{backtest.initial_capital?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-bb-muted">Final Equity</span>
                                <span className={backtest.final_value >= backtest.initial_capital ? 'text-bb-green' : 'text-bb-red'}>
                                    ₹{backtest.final_value?.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-bb-muted">Trades Executed</span>
                                <span className="text-bb-text">{backtest.total_trades}</span>
                            </div>
                        </div>

                        {backtest.trades && backtest.trades.length > 0 && (
                            <div className="mt-6 border-t border-bb-border pt-4">
                                <h4 className="text-[11px] font-medium text-bb-muted mb-3 flex items-center gap-2">
                                    <BarChart3 size={12} /> Trade Log (Last 10)
                                </h4>
                                <div className="max-h-[200px] overflow-y-auto space-y-1">
                                    {backtest.trades.slice(-10).map((t, i) => (
                                        <div key={i} className="flex justify-between text-[11px] p-1.5 hover:bg-white/5 border-b border-white/5 rounded">
                                            <span className="text-bb-muted">{t.date}</span>
                                            <span className={`font-medium ${t.type === 'BUY' ? 'text-bb-green' : 'text-bb-red'}`}>{t.type}</span>
                                            <span className="text-bb-text">₹{t.price}</span>
                                            <span className="text-bb-muted">x{t.shares}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 p-3 bg-bb-orange/10 border border-bb-orange/30 rounded flex gap-3 items-start">
                            <AlertTriangle size={16} className="text-bb-orange mt-0.5" />
                            <p className="text-[10px] text-bb-orange leading-relaxed">
                                Past performance is not indicative of future results. Simulation uses SMA crossover logic on historical OHLC data.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResearchLab;