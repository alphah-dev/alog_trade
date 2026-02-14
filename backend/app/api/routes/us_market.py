from fastapi import APIRouter, HTTPException
from app.services.market_data import MarketDataService, US_STOCKS, US_HEATMAP_STOCKS
from datetime import datetime
import asyncio
import pytz
import time

_us_heatmap_cache = {"data": None, "ts": 0}
_US_HEATMAP_TTL = 300  # 5 minutes

_us_indices_cache = {"data": None, "ts": 0}
_US_INDICES_TTL = 180  # 3 minutes

router = APIRouter()

@router.get("/heatmap")
async def get_us_heatmap_data():
    if _us_heatmap_cache["data"] and (time.time() - _us_heatmap_cache["ts"]) < _US_HEATMAP_TTL:
        return _us_heatmap_cache["data"]
    try:
        symbols = [s["symbol"] for s in US_HEATMAP_STOCKS]
        quotes = await MarketDataService.get_multi_quotes(symbols)
        quote_map = {q["symbol"]: q for q in quotes}
        result = []
        for stock in US_HEATMAP_STOCKS:
            q = quote_map.get(stock["symbol"].upper(), {})
            result.append({
                "symbol": stock["symbol"],
                "name": stock["name"],
                "sector": stock["sector"],
                "weight": stock["weight"],
                "price": q.get("price", 0),
                "change_pct": q.get("change_pct", 0),
                "change": q.get("change", 0),
                "volume": q.get("volume", 0),
            })
        _us_heatmap_cache["data"] = result
        _us_heatmap_cache["ts"] = time.time()
        return result
    except Exception as e:
        if _us_heatmap_cache["data"]:
            return _us_heatmap_cache["data"]
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/historical/{symbol}")
async def get_us_market_data(symbol: str, period: str = "1y", interval: str = "1d"):
    try:
        df = await MarketDataService.get_historical_data(symbol, period, interval)
        market_status = MarketDataService.get_market_status(df)
        df_with_indicators = MarketDataService.calculate_indicators(df)
        data_json = df_with_indicators.reset_index().to_dict(orient="records")
        return {
            "symbol": symbol.upper(),
            "market_status": market_status,
            "data_points": len(data_json),
            "data": data_json
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/quote/{symbol}")
async def get_us_realtime_quote(symbol: str):
    try:
        quote = await MarketDataService.get_realtime_quote(symbol)
        return quote
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")

@router.get("/search/{query}")
async def search_us_symbols(query: str):
    try:
        results = MarketDataService.search_us_symbols(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/company/{symbol}")
async def get_us_company_info(symbol: str):
    try:
        info = await MarketDataService.get_company_info(symbol)
        return info
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch company info: {str(e)}")

@router.get("/financials/{symbol}")
async def get_us_financials(symbol: str):
    try:
        data = await MarketDataService.get_financials(symbol)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch financials: {str(e)}")

@router.get("/indices")
async def get_us_indices():
    if _us_indices_cache["data"] and (time.time() - _us_indices_cache["ts"]) < _US_INDICES_TTL:
        return _us_indices_cache["data"]

    US_INDICES = [
        {"symbol": "^GSPC", "name": "S&P 500", "category": "Broad Market",
         "constituents": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]},
        {"symbol": "^DJI", "name": "Dow Jones Industrial", "category": "Broad Market",
         "constituents": ["AAPL", "MSFT", "JPM", "V", "UNH"]},
        {"symbol": "^IXIC", "name": "NASDAQ Composite", "category": "Broad Market",
         "constituents": ["AAPL", "MSFT", "AMZN", "GOOGL", "META"]},
        {"symbol": "^RUT", "name": "Russell 2000", "category": "Small Cap",
         "constituents": ["SOFI", "PLTR", "HOOD", "RIVN", "LCID"]},
        {"symbol": "^VIX", "name": "CBOE Volatility (VIX)", "category": "Volatility",
         "constituents": []},
        {"symbol": "^SOX", "name": "PHLX Semiconductor", "category": "Sectoral",
         "constituents": ["NVDA", "AMD", "INTC", "AVGO", "QCOM"]},
    ]

    try:
        all_index_symbols = [idx["symbol"] for idx in US_INDICES]
        idx_quotes = await MarketDataService.get_multi_quotes(all_index_symbols)
        idx_quote_map = {q["symbol"]: q for q in idx_quotes}

        all_constituents = list(set(
            sym for idx in US_INDICES for sym in idx["constituents"]
        ))
        constituent_quotes = []
        if all_constituents:
            constituent_quotes = await MarketDataService.get_multi_quotes(all_constituents)
        constituent_map = {q["symbol"]: q for q in constituent_quotes}

        result_list = []
        for idx in US_INDICES:
            iq = idx_quote_map.get(idx["symbol"].upper(), {})
            if not iq:
                iq = idx_quote_map.get(idx["symbol"], {})
            top = []
            for sym in idx["constituents"]:
                sq = constituent_map.get(sym.upper(), {})
                if not sq:
                    sq = constituent_map.get(sym, {})
                top.append({
                    "symbol": sq.get("symbol", sym),
                    "price": sq.get("price", 0),
                    "change_pct": sq.get("change_pct", 0),
                })
            result_list.append({
                "symbol": idx["symbol"], "name": idx["name"], "category": idx["category"],
                "price": iq.get("price", 0), "change": iq.get("change", 0),
                "change_pct": iq.get("change_pct", 0), "prev_close": iq.get("prev_close", 0),
                "open": iq.get("open", 0), "high": iq.get("high", 0),
                "low": iq.get("low", 0), "volume": iq.get("volume", 0),
                "top_stocks": top,
            })

        _us_indices_cache["data"] = result_list
        _us_indices_cache["ts"] = time.time()
        return result_list
    except Exception as e:
        if _us_indices_cache["data"]:
            return _us_indices_cache["data"]
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stock-detail/{symbol}")
async def get_us_stock_detail(symbol: str):
    try:
        detail = await MarketDataService.get_stock_detail(symbol)
        return detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch US stock detail: {str(e)}")

@router.get("/status")
async def get_us_market_status():
    try:
        et = pytz.timezone('US/Eastern')
        ist = pytz.timezone('Asia/Kolkata')
        now_et = datetime.now(et)
        now_ist = datetime.now(ist)
        hour = now_et.hour
        minute = now_et.minute
        weekday = now_et.weekday()
        is_weekday = weekday < 5
        is_pre_market = is_weekday and ((hour == 4 and minute >= 0) or (4 < hour < 9) or (hour == 9 and minute < 30))
        is_market_open = is_weekday and ((hour == 9 and minute >= 30) or (10 <= hour <= 15) or (hour == 16 and minute == 0))
        is_after_hours = is_weekday and ((hour == 16 and minute > 0) or (16 < hour <= 20))
        
        if is_market_open:
            status = "OPEN"
            message = "NYSE/NASDAQ Market Hours (9:30 AM - 4:00 PM ET)"
        elif is_pre_market:
            status = "PRE-MARKET"
            message = "Pre-market session (4:00 AM - 9:30 AM ET)"
        elif is_after_hours:
            status = "AFTER-HOURS"
            message = "After-hours trading (4:00 PM - 8:00 PM ET)"
        else:
            status = "CLOSED"
            message = "Outside market hours" if is_weekday else "Weekend - Markets closed"
        
        return {
            "status": status,
            "message": message,
            "server_time_et": now_et.strftime("%H:%M:%S ET"),
            "server_time_ist": now_ist.strftime("%H:%M:%S IST"),
            "server_date": now_et.strftime("%Y-%m-%d"),
            "day": now_et.strftime("%A"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

