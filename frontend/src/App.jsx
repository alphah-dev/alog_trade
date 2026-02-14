import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import TradingTerminal from './pages/TradingTerminal';
import USTradingTerminal from './pages/USTradingTerminal';
import ResearchLab from './pages/ResearchLab';
import MarketIndices from './pages/MarketIndices';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="terminal" element={<TradingTerminal />} />
          <Route path="us-terminal" element={<USTradingTerminal />} />
          <Route path="research" element={<ResearchLab />} />
          <Route path="indices" element={<MarketIndices />} />
          <Route index element={<Navigate to="/app/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;