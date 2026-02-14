from pydantic import BaseModel, Field
from datetime import datetime

class TradeCreate(BaseModel):
    symbol: str = Field(..., example="TCS.NS")
    side: str = Field(..., pattern="^(BUY|SELL)$", example="BUY")
    product_type: str = Field("DELIVERY", pattern="^(INTRADAY|DELIVERY)$", example="DELIVERY")
    quantity: float = Field(..., gt=0, example=10)
    price: float = Field(..., gt=0, example=150.25)
    strategy_name: str = Field(default="Manual", example="SMA_Crossover")

class PortfolioResponse(BaseModel):
    symbol: str
    average_price: float
    total_quantity: float
    
    class Config:
        from_attributes = True

class TradeResponse(BaseModel):
    id: int
    symbol: str
    side: str
    product_type: str | None = "DELIVERY"
    price: float
    quantity: float
    timestamp: datetime
    strategy_name: str | None = None
    charges: float | None = 0.0
    
    class Config:
        from_attributes = True

class AccountResponse(BaseModel):
    balance: float
    initial_balance: float
    total_charges_paid: float
    available_margin: float
    
    class Config:
        from_attributes = True

class ChargesBreakdown(BaseModel):
    brokerage: float = 0.0
    stt: float = 0.0
    transaction_charges: float = 0.0
    gst: float = 0.0
    sebi_fee: float = 0.0
    stamp_duty: float = 0.0
    total: float = 0.0