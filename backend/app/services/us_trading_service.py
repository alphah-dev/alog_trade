from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.models.us_trading import USTrade, USPortfolio, USPaperAccount
from app.schemas.trading import TradeCreate
from app.services.charges import USChargesCalculator

INITIAL_BALANCE_USD = 1190.48

class USTradingService:
    @staticmethod
    async def get_or_create_account(db: AsyncSession) -> USPaperAccount:
        result = await db.execute(select(USPaperAccount))
        account = result.scalars().first()
        if not account:
            account = USPaperAccount(
                balance=INITIAL_BALANCE_USD,
                initial_balance=INITIAL_BALANCE_USD,
                total_charges_paid=0.0
            )
            db.add(account)
            await db.commit()
            await db.refresh(account)
        return account

    @staticmethod
    async def execute_trade(db: AsyncSession, trade_data: TradeCreate):
        symbol_upper = trade_data.symbol.upper()
        
        account = await USTradingService.get_or_create_account(db)
        
        charges = USChargesCalculator.calculate(
            side=trade_data.side,
            product_type=trade_data.product_type,
            price=trade_data.price,
            quantity=trade_data.quantity
        )
        total_charges = charges["total"]
        
        order_value = trade_data.price * trade_data.quantity
        
        if trade_data.side == "BUY":
            required_total = order_value + total_charges
            
            if account.balance < required_total:
                available = account.balance
                raise ValueError(
                    f"Insufficient balance. Required: ${required_total:.2f} "
                    f"(Order: ${order_value:.2f} + Charges: ${total_charges:.2f}). "
                    f"Available: ${available:.2f}"
                )
            
            account.balance -= (order_value + total_charges)
        
        elif trade_data.side == "SELL":
            result = await db.execute(select(USPortfolio).filter(USPortfolio.symbol == symbol_upper))
            portfolio_item = result.scalars().first()
            
            if not portfolio_item or portfolio_item.total_quantity < trade_data.quantity:
                holding = portfolio_item.total_quantity if portfolio_item else 0
                raise ValueError(
                    f"Insufficient holdings for {symbol_upper}. "
                    f"Trying to sell {trade_data.quantity}, but only hold {holding}"
                )
            
            account.balance += (order_value - total_charges)
        
        account.total_charges_paid += total_charges

        new_trade = USTrade(
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
            result = await db.execute(select(USPortfolio).filter(USPortfolio.symbol == symbol_upper))
            portfolio_item = result.scalars().first()
            
            if portfolio_item:
                total_cost = (portfolio_item.average_price * portfolio_item.total_quantity) + (trade_data.price * trade_data.quantity)
                portfolio_item.total_quantity += trade_data.quantity
                portfolio_item.average_price = total_cost / portfolio_item.total_quantity
            else:
                portfolio_item = USPortfolio(
                    symbol=symbol_upper,
                    average_price=trade_data.price,
                    total_quantity=trade_data.quantity
                )
                db.add(portfolio_item)
                
        elif trade_data.side == "SELL":
            result = await db.execute(select(USPortfolio).filter(USPortfolio.symbol == symbol_upper))
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
        result = await db.execute(select(USPortfolio).filter(USPortfolio.symbol == symbol_upper))
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
        return await USTradingService.execute_trade(db, trade_data)

    @staticmethod
    async def get_portfolio(db: AsyncSession):
        result = await db.execute(select(USPortfolio))
        return result.scalars().all()

    @staticmethod
    async def get_recent_trades(db: AsyncSession, limit: int = 20):
        result = await db.execute(select(USTrade).order_by(desc(USTrade.timestamp)).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def get_account_info(db: AsyncSession):
        account = await USTradingService.get_or_create_account(db)
        return {
            "balance": round(account.balance, 2),
            "initial_balance": account.initial_balance,
            "total_charges_paid": round(account.total_charges_paid, 2),
            "balance_inr": round(account.balance * 84, 2),
        }

    @staticmethod
    async def reset_account(db: AsyncSession):
        result = await db.execute(select(USPaperAccount))
        account = result.scalars().first()
        if account:
            account.balance = INITIAL_BALANCE_USD
            account.total_charges_paid = 0.0
        
        trades = await db.execute(select(USTrade))
        for trade in trades.scalars().all():
            await db.delete(trade)
        
        positions = await db.execute(select(USPortfolio))
        for pos in positions.scalars().all():
            await db.delete(pos)
        
        await db.commit()
        return {"message": "US Account reset to $1,190.48 (₹1,00,000)", "balance": INITIAL_BALANCE_USD}
