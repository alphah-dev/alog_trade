from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.strategy_engine import StrategyEngine
from app.services.backtest_service import BacktestService

router = APIRouter()

@router.post("/run/{symbol}")
async def run_strategy(symbol: str, quantity: float = 1.0, db: AsyncSession = Depends(get_db)):
    try:
        result = await StrategyEngine.run_sma_crossover(db, symbol, quantity)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategy execution failed: {str(e)}")

@router.get("/backtest/{symbol}")
async def backtest_strategy(symbol: str):
    try:
        result = await BacktestService.backtest_sma_strategy(symbol)
        
        if "error" in result:
             raise HTTPException(status_code=400, detail=result["error"])
             
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")