import pandas as pd
from app.services.market_data import MarketDataService

class BacktestService:
    @staticmethod
    async def backtest_sma_strategy(symbol: str, initial_capital: float = 10000):
        try:
            df = await MarketDataService.get_historical_data(symbol, period="1y", interval="1d")
        except Exception as e:
            return {"error": f"Failed to fetch data for {symbol}: {str(e)}"}

        df = MarketDataService.calculate_indicators(df)
        
        capital = initial_capital
        position = 0
        trades = []
        equity_curve = []
        
        if len(df) < 50:
            return {"error": "Not enough historical data to backtest."}

        for i in range(50, len(df)):
            today = df.iloc[i]
            prev = df.iloc[i-1]
            price = today['Close']
            date = str(today.name).split(" ")[0]

            signal = None
            
            if prev['SMA_20'] <= prev['SMA_50'] and today['SMA_20'] > today['SMA_50']:
                signal = 'BUY'
            
            elif prev['SMA_20'] >= prev['SMA_50'] and today['SMA_20'] < today['SMA_50']:
                signal = 'SELL'

            if signal == 'BUY' and capital >= price:
                shares_to_buy = int(capital // price)
                cost = shares_to_buy * price
                capital -= cost
                position += shares_to_buy
                trades.append({
                    "date": date, 
                    "type": "BUY", 
                    "price": round(price, 2), 
                    "shares": shares_to_buy,
                    "value": round(cost, 2)
                })
            
            elif signal == 'SELL' and position > 0:
                revenue = position * price
                capital += revenue
                trades.append({
                    "date": date, 
                    "type": "SELL", 
                    "price": round(price, 2), 
                    "shares": position,
                    "value": round(revenue, 2)
                })
                position = 0
            
            total_value = capital + (position * price)
            equity_curve.append({"time": date, "value": round(total_value, 2)})

        final_stock_value = position * df.iloc[-1]['Close']
        total_portfolio_value = capital + final_stock_value
        
        total_return_pct = ((total_portfolio_value - initial_capital) / initial_capital) * 100

        return {
            "symbol": symbol,
            "initial_capital": initial_capital,
            "final_value": round(total_portfolio_value, 2),
            "total_return_pct": round(total_return_pct, 2),
            "total_trades": len(trades),
            "trades": trades,
            "equity_curve": equity_curve
        }