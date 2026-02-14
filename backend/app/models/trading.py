from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.db.database import Base

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    side = Column(String, nullable=False)
    product_type = Column(String, default="DELIVERY")
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    strategy_name = Column(String)
    charges = Column(Float, default=0.0)

class Portfolio(Base):
    __tablename__ = "portfolio"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    average_price = Column(Float, nullable=False)
    total_quantity = Column(Float, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaperAccount(Base):
    __tablename__ = "paper_account"
    
    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, default=100000.0)
    initial_balance = Column(Float, default=100000.0)
    total_charges_paid = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)