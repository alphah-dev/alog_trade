# Alog Trade - Advanced Algorithmic Trading Platform

A sophisticated trading platform designed for both Indian (NSE) and US markets, featuring real-time data analysis, interactive charting, and comprehensive financial tools.

## Key Features

- **Multi-Market Support**: Seamlessly trade and analyze stocks from both NSE (National Stock Exchange of India) and US exchanges.
- **Real-Time Data**: Live market updates, price tickers, and dynamic heatmaps.
- **Advanced Charting**: Interactive charts with technical indicators, time-frame selection, and comparison tools.
- **Financial Analysis**: Detailed breakdown of company financials including key ratios, quarterly results, profit & loss statements, balance sheets, and cash flow analysis.
- **CAGR Calculator**: Automatic calculation and visualization of Compounded Annual Growth Rates for revenue, profit, and stock price.
- **Peer Comparison**: Compare stock performance against industry peers with key metrics.
- **Secure Authentication**: Robust user authentication and session management.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL (or SQLite for development)
- **External APIs**: Integration with market data providers (e.g., yfinance)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/alphah-dev/alog_trade.git
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   # Create virtual environment (optional)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

## Usage

1. **Start the Backend Server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:5173`.

## License

This project is licensed under the MIT License.
