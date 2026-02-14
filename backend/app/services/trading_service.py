from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.models.trading import Trade, Portfolio, PaperAccount
from app.schemas.trading import TradeCreate
from app.services.charges import SEBIChargesCalculator

INITIAL_BALANCE = 100000.0
INTRADAY_MARGIN_MULTIPLIER = 5

class TradingService:
    @staticmethod
    async def get_or_create_account(db: AsyncSession) -> PaperAccount:
        result = await db.execute(select(PaperAccount))
        account = result.scalars().first()
        if not account:
            account = PaperAccount(
                balance=INITIAL_BALANCE,
                initial_balance=INITIAL_BALANCE,
                total_charges_paid=0.0
            )
            db.add(account)
            await db.commit()
            await db.refresh(account)
        return account

    @staticmethod
    async def execute_trade(db: AsyncSession, trade_data: TradeCreate):
        symbol_upper = trade_data.symbol.upper()
        
        account = await TradingService.get_or_create_account(db)
        
        charges = SEBIChargesCalculator.calculate(
            side=trade_data.side,
            product_type=trade_data.product_type,
            price=trade_data.price,
            quantity=trade_data.quantity
        )
        total_charges = charges["total"]
        
        order_value = trade_data.price * trade_data.quantity
        
        if trade_data.side == "BUY":
            if trade_data.product_type == "INTRADAY":
                required_margin = order_value / INTRADAY_MARGIN_MULTIPLIER
            else:
                required_margin = order_value
            
            required_total = required_margin + total_charges
            
            if account.balance < required_total:
                available = account.balance
                raise ValueError(
                    f"Insufficient balance. Required: ₹{required_total:.2f} "
                    f"(Order: ₹{required_margin:.2f} + Charges: ₹{total_charges:.2f}). "
                    f"Available: ₹{available:.2f}"
                )
            
            account.balance -= (order_value + total_charges)
        
        elif trade_data.side == "SELL":
            result = await db.execute(select(Portfolio).filter(Portfolio.symbol == symbol_upper))
            portfolio_item = result.scalars().first()
            
            if not portfolio_item or portfolio_item.total_quantity < trade_data.quantity:
                holding = portfolio_item.total_quantity if portfolio_item else 0
                raise ValueError(
                    f"Insufficient holdings for {symbol_upper}. "
                    f"Trying to sell {trade_data.quantity}, but only hold {holding}"
                )
            
            account.balance += (order_value - total_charges)
        
        account.total_charges_paid += total_charges

        new_trade = Trade(
            symbol=symbol_upper,
            side=trade_data.side,
            product_type=trade_data.product_type,
            price=trade_data.price,
            quantity=trade_data.quantity,
            strategy_name=trade_data.strategy_name,
            charges=total_charges
        )
        db.add(new_trade)

        if trade_data.side == "BUY":
            result = await db.execute(select(Portfolio).filter(Portfolio.symbol == symbol_upper))
            portfolio_item = result.scalars().first()
            
            if portfolio_item:
                total_cost = (portfolio_item.average_price * portfolio_item.total_quantity) + (trade_data.price * trade_data.quantity)
                portfolio_item.total_quantity += trade_data.quantity
                portfolio_item.average_price = total_cost / portfolio_item.total_quantity
            else:
                portfolio_item = Portfolio(
                    symbol=symbol_upper,
                    average_price=trade_data.price,
                    total_quantity=trade_data.quantity
                )
                db.add(portfolio_item)
                
        elif trade_data.side == "SELL":
            result = await db.execute(select(Portfolio).filter(Portfolio.symbol == symbol_upper))
            portfolio_item = result.scalars().first()
            
            portfolio_item.total_quantity -= trade_data.quantity
            if portfolio_item.total_quantity <= 0:
                await db.delete(portfolio_item)

        await db.commit()
        await db.refresh(new_trade)
        return {
            "trade": new_trade,
            "charges": charges,
            "balance": account.balance
        }

    @staticmethod
    async def exit_position(db: AsyncSession, symbol: str, price: float, quantity: float = None):
        symbol_upper = symbol.upper()
        result = await db.execute(select(Portfolio).filter(Portfolio.symbol == symbol_upper))
        portfolio_item = result.scalars().first()
        
        if not portfolio_item or portfolio_item.total_quantity <= 0:
            raise ValueError(f"No position found for {symbol_upper}")
        
        sell_qty = quantity if quantity and quantity > 0 else portfolio_item.total_quantity
        if sell_qty > portfolio_item.total_quantity:
            raise ValueError(f"Cannot sell {sell_qty} shares. Only hold {portfolio_item.total_quantity}")
        
        trade_data = TradeCreate(
            symbol=symbol_upper,
            side="SELL",
            product_type="DELIVERY",
            quantity=sell_qty,
            price=price,
            strategy_name="Exit Position"
        )
        return await TradingService.execute_trade(db, trade_data)

    @staticmethod
    async def get_portfolio(db: AsyncSession):
        result = await db.execute(select(Portfolio))
        return result.scalars().all()

    @staticmethod
    async def get_recent_trades(db: AsyncSession, limit: int = 20):
        result = await db.execute(select(Trade).order_by(desc(Trade.timestamp)).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def get_account_info(db: AsyncSession):
        account = await TradingService.get_or_create_account(db)
        return {
            "balance": round(account.balance, 2),
            "initial_balance": account.initial_balance,
            "total_charges_paid": round(account.total_charges_paid, 2),
            "available_margin": round(account.balance * INTRADAY_MARGIN_MULTIPLIER, 2)
        }

    @staticmethod
    async def reset_account(db: AsyncSession):
        result = await db.execute(select(PaperAccount))
        account = result.scalars().first()
        if account:
            account.balance = INITIAL_BALANCE
            account.total_charges_paid = 0.0
        
        trades = await db.execute(select(Trade))
        for trade in trades.scalars().all():
            await db.delete(trade)
        
        positions = await db.execute(select(Portfolio))
        for pos in positions.scalars().all():
            await db.delete(pos)
        
        await db.commit()
        return {"message": "Account reset to ₹1,00,000", "balance": INITIAL_BALANCE}