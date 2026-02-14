from fastapi import APIRouter, HTTPException
from app.services.ml_service import MLService

router = APIRouter()

@router.post("/train/{symbol}")
async def train_model(symbol: str):
    try:
        result = await MLService.train_model(symbol)
        return {"message": "Model trained successfully", "metrics": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predict/{symbol}")
async def predict(symbol: str):
    try:
        result = await MLService.predict_next_move(symbol)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))