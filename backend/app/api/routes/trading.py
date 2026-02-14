from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.trading_service import TradingService
from app.services.charges import SEBIChargesCalculator
from app.schemas.trading import TradeCreate, PortfolioResponse, TradeResponse

router = APIRouter()

@router.post("/execute", status_code=201)
async def execute_trade(trade: TradeCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await TradingService.execute_trade(db, trade)
        return {
            "message": "Trade executed",
            "id": result["trade"].id,
            "charges": result["charges"],
            "balance": result["balance"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trade execution failed: {str(e)}")

@router.get("/portfolio", response_model=list[PortfolioResponse])
async def get_portfolio(db: AsyncSession = Depends(get_db)):
    return await TradingService.get_portfolio(db)

@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    trades = await TradingService.get_recent_trades(db)
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "side": t.side,
            "product_type": getattr(t, 'product_type', 'DELIVERY') or 'DELIVERY',
            "price": t.price,
            "quantity": t.quantity,
            "timestamp": t.timestamp,
            "strategy_name": t.strategy_name,
            "charges": getattr(t, 'charges', 0) or 0,
        }
        for t in trades
    ]

@router.get("/account")
async def get_account(db: AsyncSession = Depends(get_db)):
    return await TradingService.get_account_info(db)

@router.post("/exit/{symbol}")
async def exit_position(symbol: str, price: float, quantity: float = None, db: AsyncSession = Depends(get_db)):
    try:
        result = await TradingService.exit_position(db, symbol, price, quantity)
        return {
            "message": f"Exited {symbol} position",
            "charges": result["charges"],
            "balance": result["balance"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.post("/reset")
async def reset_account(db: AsyncSession = Depends(get_db)):
    return await TradingService.reset_account(db)

@router.get("/charges/estimate")
async def estimate_charges(side: str, product_type: str, price: float, quantity: float):
    charges = SEBIChargesCalculator.calculate(side, product_type, price, quantity)
    return charges