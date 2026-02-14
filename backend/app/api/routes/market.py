from fastapi import APIRouter, HTTPException, Query
from app.services.market_data import MarketDataService
from datetime import datetime
import asyncio
import pytz
import time

_heatmap_cache = {"data": None, "ts": 0}
_HEATMAP_TTL = 300  # 5 minutes

_indices_cache = {"data": None, "ts": 0}
_INDICES_TTL = 180  # 3 minutes

router = APIRouter()

@router.get("/historical/{symbol}")
async def get_market_data(symbol: str, period: str = "1y", interval: str = "1d"):
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
async def get_realtime_quote(symbol: str):
    try:
        quote = await MarketDataService.get_realtime_quote(symbol)
        return quote
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")

@router.post("/quotes")
async def get_multi_quotes(symbols: list[str]):
    try:
        quotes = await MarketDataService.get_multi_quotes(symbols)
        return quotes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/{query}")
async def search_symbols(query: str):
    try:
        results = MarketDataService.search_symbols(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/company/{symbol}")
async def get_company_info(symbol: str):
    try:
        info = await MarketDataService.get_company_info(symbol)
        return info
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch company info: {str(e)}")

@router.get("/financials/{symbol}")
async def get_financials(symbol: str):
    try:
        data = await MarketDataService.get_financials(symbol)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch financials: {str(e)}")

@router.get("/heatmap")
async def get_heatmap_data():
    from app.services.market_data import NIFTY_HEATMAP_STOCKS
    if _heatmap_cache["data"] and (time.time() - _heatmap_cache["ts"]) < _HEATMAP_TTL:
        return _heatmap_cache["data"]
    try:
        symbols = [s["symbol"] for s in NIFTY_HEATMAP_STOCKS]
        quotes = await MarketDataService.get_multi_quotes(symbols)
        quote_map = {q["symbol"]: q for q in quotes}
        result = []
        for stock in NIFTY_HEATMAP_STOCKS:
            q = quote_map.get(stock["symbol"].upper(), {})
            result.append({
                "symbol": stock["symbol"].replace(".NS", ""),
                "name": stock["name"],
                "sector": stock["sector"],
                "weight": stock["weight"],
                "price": q.get("price", 0),
                "change_pct": q.get("change_pct", 0),
                "change": q.get("change", 0),
                "volume": q.get("volume", 0),
            })
        _heatmap_cache["data"] = result
        _heatmap_cache["ts"] = time.time()
        return result
    except Exception as e:
        if _heatmap_cache["data"]:
            return _heatmap_cache["data"]
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/indices")
async def get_all_indices():
    if _indices_cache["data"] and (time.time() - _indices_cache["ts"]) < _INDICES_TTL:
        return _indices_cache["data"]

    INDICES = [
        {"symbol": "^NSEI", "name": "NIFTY 50", "category": "Broad Market",
         "constituents": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"]},
        {"symbol": "^NSEBANK", "name": "NIFTY BANK", "category": "Sectoral",
         "constituents": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS"]},
        {"symbol": "^CNXIT", "name": "NIFTY IT", "category": "Sectoral",
         "constituents": ["TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS", "TECHM.NS"]},
        {"symbol": "^CNXPHARMA", "name": "NIFTY PHARMA", "category": "Sectoral",
         "constituents": ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS"]},
        {"symbol": "^CNXAUTO", "name": "NIFTY AUTO", "category": "Sectoral",
         "constituents": ["TATAMOTORS.NS", "MARUTI.NS", "M&M.NS", "BAJAJ-AUTO.NS", "HEROMOTOCO.NS"]},
        {"symbol": "^CNXFMCG", "name": "NIFTY FMCG", "category": "Sectoral",
         "constituents": ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "GODREJCP.NS"]},
        {"symbol": "^CNXMETAL", "name": "NIFTY METAL", "category": "Sectoral",
         "constituents": ["TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "COALINDIA.NS", "VEDL.NS"]},
        {"symbol": "^CNXENERGY", "name": "NIFTY ENERGY", "category": "Sectoral",
         "constituents": ["RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS", "BPCL.NS"]},
        {"symbol": "^CNXREALTY", "name": "NIFTY REALTY", "category": "Sectoral",
         "constituents": ["DLF.NS", "GODREJPROP.NS", "OBEROIRLTY.NS", "PHOENIXLTD.NS", "PRESTIGE.NS"]},
        {"symbol": "^CNXINFRA", "name": "NIFTY INFRA", "category": "Thematic",
         "constituents": ["LT.NS", "ADANIPORTS.NS", "ULTRACEMCO.NS", "GRASIM.NS", "POWERGRID.NS"]},
        {"symbol": "^CNXPSUBANK", "name": "NIFTY PSU BANK", "category": "Sectoral",
         "constituents": ["SBIN.NS", "PNB.NS", "BANKBARODA.NS", "CANBK.NS", "UNIONBANK.NS"]},
        {"symbol": "^CNXFIN", "name": "NIFTY FIN SERVICES", "category": "Sectoral",
         "constituents": ["HDFCBANK.NS", "ICICIBANK.NS", "BAJFINANCE.NS", "KOTAKBANK.NS", "SBIN.NS"]},
        {"symbol": "^NSEMDCP50", "name": "NIFTY MIDCAP 50", "category": "Broad Market",
         "constituents": ["MPHASIS.NS", "PERSISTENT.NS", "COFORGE.NS", "VOLTAS.NS", "JUBLFOOD.NS"]},
    ]

    try:
        all_index_symbols = [idx["symbol"] for idx in INDICES]
        idx_quotes = await MarketDataService.get_multi_quotes(all_index_symbols)
        idx_quote_map = {q["symbol"]: q for q in idx_quotes}

        all_constituents = list(set(
            sym for idx in INDICES for sym in idx["constituents"]
        ))
        constituent_quotes = await MarketDataService.get_multi_quotes(all_constituents)
        constituent_map = {q["symbol"]: q for q in constituent_quotes}

        result_list = []
        for idx in INDICES:
            iq = idx_quote_map.get(idx["symbol"].upper().replace("^", "^"), {})
            if not iq:
                iq = idx_quote_map.get(idx["symbol"], {})
            top = []
            for sym in idx["constituents"]:
                sq = constituent_map.get(sym.upper(), {})
                if not sq:
                    sq = constituent_map.get(sym, {})
                top.append({
                    "symbol": sq.get("symbol", sym).replace(".NS", ""),
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

        _indices_cache["data"] = result_list
        _indices_cache["ts"] = time.time()
        return result_list
    except Exception as e:
        if _indices_cache["data"]:
            return _indices_cache["data"]
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_market_status():
    try:
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        hour = now.hour
        minute = now.minute
        weekday = now.weekday()
        is_weekday = weekday < 5
        is_pre_market = is_weekday and (hour == 9 and minute < 15)
        is_market_open = is_weekday and ((hour == 9 and minute >= 15) or (10 <= hour <= 14) or (hour == 15 and minute <= 30))
        is_post_market = is_weekday and (hour == 15 and minute > 30)
        if is_market_open:
            status = "OPEN"
            message = "NSE/BSE Market Hours (9:15 AM - 3:30 PM IST)"
        elif is_pre_market:
            status = "PRE-MARKET"
            message = "Pre-market session"
        elif is_post_market:
            status = "CLOSED"
            message = "Market closed for the day"
        else:
            status = "CLOSED"
            message = "Outside market hours" if is_weekday else "Weekend - Markets closed"
        return {"status": status, "message": message, "server_time": now.strftime("%H:%M:%S IST"), "server_date": now.strftime("%Y-%m-%d"), "day": now.strftime("%A")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stock-detail/{symbol}")
async def get_stock_detail(symbol: str):
    try:
        detail = await MarketDataService.get_stock_detail(symbol)
        return detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock detail: {str(e)}")