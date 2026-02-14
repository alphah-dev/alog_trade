import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score
from app.services.market_data import MarketDataService

class MLService:
    model_path = "model_random_forest.pkl"

    @staticmethod
    def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
        df['Return'] = df['Close'].pct_change()
        df['Lag_1'] = df['Return'].shift(1)
        df['Lag_2'] = df['Return'].shift(2)
        
        df['High_Low'] = df['High'] - df['Low']
        df['High_Close'] = np.abs(df['High'] - df['Close'].shift())
        df['Low_Close'] = np.abs(df['Low'] - df['Close'].shift())
        ranges = df[['High_Low', 'High_Close', 'Low_Close']].max(axis=1)
        df['ATR'] = ranges.rolling(window=14).mean()
        
        df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
        
        return df.dropna()

    @staticmethod
    def _calculate_sentiment_score(df: pd.DataFrame) -> float:
        recent = df.tail(10)
        if recent.empty:
            return 0.0
        
        avg_return = recent['Return'].mean()
        momentum = (recent['SMA_20'].iloc[-1] - recent['SMA_50'].iloc[-1]) / recent['SMA_50'].iloc[-1] if recent['SMA_50'].iloc[-1] != 0 else 0
        rsi_signal = (recent['RSI'].iloc[-1] - 50) / 100
        macd_signal = recent['MACD'].iloc[-1] - recent['Signal_Line'].iloc[-1]
        macd_normalized = np.tanh(macd_signal / (recent['Close'].iloc[-1] * 0.01)) if recent['Close'].iloc[-1] != 0 else 0
        
        sentiment = (avg_return * 40) + (momentum * 30) + (rsi_signal * 15) + (float(macd_normalized) * 15)
        return round(float(np.clip(sentiment, -1, 1)), 4)

    @staticmethod
    async def train_model(symbol: str):
        df = await MarketDataService.get_historical_data(symbol, period="5y", interval="1d")
        df = MarketDataService.calculate_indicators(df)
        df = MLService._engineer_features(df)

        features = ['Lag_1', 'Lag_2', 'ATR', 'Volume', 'SMA_20', 'SMA_50', 'RSI', 'MACD', 'Signal_Line']
        X = df[features]
        y = df['Target']

        split_idx = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        model = RandomForestClassifier(
            n_estimators=200, 
            max_depth=10,
            min_samples_split=20,
            class_weight='balanced',
            random_state=42
        )
        
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        accuracy = accuracy_score(y_test, predictions)
        precision = precision_score(y_test, predictions, zero_division=0)

        joblib.dump(model, MLService.model_path)

        return {
            "accuracy": float(accuracy), 
            "precision": float(precision),
            "training_samples": len(X_train),
            "testing_samples": len(X_test)
        }

    @staticmethod
    async def predict_next_move(symbol: str):
        df = await MarketDataService.get_historical_data(symbol, period="100d", interval="1d")
        df = MarketDataService.calculate_indicators(df)
        df_engineered = MLService._engineer_features(df)
        
        features = ['Lag_1', 'Lag_2', 'ATR', 'Volume', 'SMA_20', 'SMA_50', 'RSI', 'MACD', 'Signal_Line']
        
        latest_data = df_engineered.iloc[-1:][features]
        
        nlp_sentiment_score = MLService._calculate_sentiment_score(df)
        
        try:
            model = joblib.load(MLService.model_path)
        except FileNotFoundError:
            return {"error": "Model not trained yet. Call /train first."}

        prediction = model.predict(latest_data)
        probability = model.predict_proba(latest_data)

        direction = "BUY" if prediction[0] == 1 else "SELL"
        confidence = probability[0][1] if prediction[0] == 1 else probability[0][0]

        latest_row = df_engineered.iloc[-1]

        return {
            "symbol": symbol,
            "prediction": direction,
            "confidence": float(confidence),
            "nlp_sentiment_score": nlp_sentiment_score,
            "current_price": round(float(latest_row['Close']), 2),
            "rsi": round(float(latest_row['RSI']), 2),
            "macd": round(float(latest_row['MACD']), 4),
            "sma_20": round(float(latest_row['SMA_20']), 2),
            "sma_50": round(float(latest_row['SMA_50']), 2)
        }