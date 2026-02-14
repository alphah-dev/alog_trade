from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.db.database import engine, Base

from app.api.routes import market, trading, strategy, ml
from app.api.routes import us_market, us_trading

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        from app.models.trading import Trade, Portfolio, PaperAccount
        from app.models.us_trading import USTrade, USPortfolio, USPaperAccount
        await conn.run_sync(Base.metadata.create_all)
        
        try:
            await conn.execute(text(
                "ALTER TABLE trades ADD COLUMN IF NOT EXISTS product_type VARCHAR DEFAULT 'DELIVERY'"
            ))
        except Exception:
            pass
        
        try:
            await conn.execute(text(
                "ALTER TABLE trades ADD COLUMN IF NOT EXISTS charges FLOAT DEFAULT 0.0"
            ))
        except Exception:
            pass

app.include_router(market.router, prefix="/api/v1/market", tags=["Market Data"])
app.include_router(trading.router, prefix="/api/v1/trade", tags=["Paper Trading"])
app.include_router(strategy.router, prefix="/api/v1/strategy", tags=["Automated Strategies"])
app.include_router(ml.router, prefix="/api/v1/ml", tags=["Machine Learning"])
app.include_router(us_market.router, prefix="/api/v1/us", tags=["US Market Data"])
app.include_router(us_trading.router, prefix="/api/v1/us-trade", tags=["US Paper Trading"])





@app.get("/")
async def root():
    return {"message": "Algo Trading Engine is Online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "Neon DB via AsyncPG"}