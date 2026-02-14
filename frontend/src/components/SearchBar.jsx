import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { api } from '../api';

const SearchBar = ({ value, onChange, onSelect, placeholder = 'SEARCH SYMBOL', market = 'IN' }) => {
    const isUS = market === 'US';
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    const updateDropdownPos = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            updateDropdownPos();
            window.addEventListener('scroll', updateDropdownPos, true);
            window.addEventListener('resize', updateDropdownPos);
            return () => {
                window.removeEventListener('scroll', updateDropdownPos, true);
                window.removeEventListener('resize', updateDropdownPos);
            };
        }
    }, [isOpen, updateDropdownPos]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                const portal = document.getElementById('search-dropdown-portal');
                if (portal && portal.contains(e.target)) return;
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value.toUpperCase();
        setQuery(val);
        onChange && onChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (val.length >= 1) {
            setLoading(true);
            debounceRef.current = setTimeout(async () => {
                try {
                    const res = isUS ? await api.searchUSSymbols(val) : await api.searchSymbols(val);
                    setResults(res);
                    setIsOpen(true);
                } catch (err) {
                    setResults([]);
                }
                setLoading(false);
            }, 200);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (stock) => {
        const displaySymbol = isUS ? stock.symbol : stock.symbol.replace('.NS', '');
        setQuery(displaySymbol);
        setIsOpen(false);
        onSelect && onSelect(stock.symbol);
    };

    const clearInput = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
        onChange && onChange('');
    };

    const renderDropdown = () => {
        if (!isOpen) return null;

        const dropdownContent = (
            <div
                id="search-dropdown-portal"
                style={{
                    position: 'fixed',
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                    zIndex: 9999,
                }}
            >
                {results.length > 0 ? (
                    <div className="max-h-[280px] overflow-y-auto rounded border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        {results.map((stock, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelect(stock)}
                                className="w-full flex items-center justify-between px-4 py-3 transition-colors last:border-0 text-left"
                                style={{ borderBottom: '1px solid var(--border-color)' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-gray)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div>
                                    <div className="font-mono font-bold text-sm text-bb-text">
                                        {isUS ? stock.symbol : stock.symbol.replace('.NS', '')}
                                    </div>
                                    <div className="text-[10px] font-mono mt-0.5 text-bb-muted">{stock.name}</div>
                                </div>
                                <div className="text-[10px] font-mono text-bb-muted">
                                    {isUS ? 'NYSE/NASDAQ' : 'NSE'}
                                </div>
                            </button>
                        ))}
                        {loading && (
                            <div className="px-4 py-3 text-[10px] font-mono text-center text-bb-muted">SEARCHING...</div>
                        )}
                    </div>
                ) : query.length >= 1 && !loading ? (
                    <div className="px-4 py-4 text-center rounded border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div className="text-[10px] font-mono text-bb-muted">NO RESULTS FOR "{query}"</div>
                    </div>
                ) : null}
            </div>
        );

        return createPortal(dropdownContent, document.body);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="flex items-center border border-bb-border bg-bb-card rounded focus-within:ring-1 focus-within:ring-bb-orange transition-all">
                <Search size={14} className="ml-3 flex-shrink-0 text-bb-muted" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { results.length > 0 && setIsOpen(true); updateDropdownPos(); }}
                    placeholder={placeholder}
                    className="w-full bg-transparent px-3 py-2.5 font-bold font-mono text-sm outline-none text-bb-text placeholder:text-bb-muted/50"
                />
                {query && (
                    <button onClick={clearInput} className="mr-2 text-bb-muted hover:text-bb-text transition-colors">
                        <X size={14} />
                    </button>
                )}
            </div>

            {renderDropdown()}
        </div>
    );
};

export default SearchBar;
