import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.market_data import MarketDataService
from app.services.trading_service import TradingService
from app.schemas.trading import TradeCreate

class StrategyEngine:
    @staticmethod
    async def run_sma_crossover(db: AsyncSession, symbol: str, quantity: float = 1.0):
        df = await MarketDataService.get_historical_data(symbol, period="1y", interval="1d")
        df = MarketDataService.calculate_indicators(df)

        if len(df) < 50:
            raise ValueError("Not enough data to run SMA strategy.")

        latest = df.iloc[-1]
        previous = df.iloc[-2]

        sma20_current = latest['SMA_20']
        sma50_current = latest['SMA_50']
        sma20_prev = previous['SMA_20']
        sma50_prev = previous['SMA_50']
        current_price = latest['Close']

        side = None

        if sma20_prev <= sma50_prev and sma20_current > sma50_current:
            side = "BUY"
        elif sma20_prev >= sma50_prev and sma20_current < sma50_current:
            side = "SELL"

        if side:
            trade_data = TradeCreate(
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=current_price,
                strategy_name="SMA_Crossover"
            )
            
            if side == "SELL":
                portfolio = await TradingService.get_portfolio(db)
                has_position = any(p.symbol == symbol.upper() and p.total_quantity >= quantity for p in portfolio)
                if not has_position:
                    return {"symbol": symbol, "signal": "SELL", "executed": False, "reason": "Insufficient position in portfolio"}

            await TradingService.execute_trade(db, trade_data)
            return {"symbol": symbol, "signal": side, "executed": True, "price": current_price}

        return {"symbol": symbol, "signal": "HOLD", "executed": False, "price": current_price}