import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { api } from '../api';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {

  const [time, setTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState(null);
  const { theme, toggleTheme } = useTheme();



  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await api.getMarketStatus();
        setMarketStatus(status);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-bb-black text-bb-text font-sans">
      <Sidebar />
      <div className="ml-56 flex-1 flex flex-col">
        <div className="sticky top-0 z-40 bg-bb-dark/95 backdrop-blur border-b border-bb-border px-6 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`h-1.5 w-1.5 rounded-full ${marketStatus?.status === 'OPEN' ? 'bg-bb-green' : 'bg-bb-red'} animate-pulse`}></div>
            <span className={`text-xs font-medium ${marketStatus?.status === 'OPEN' ? 'text-bb-green' : 'text-bb-muted'}`}>
              {marketStatus ? marketStatus.status : '...'}
            </span>
            {marketStatus && (
              <span className="text-[11px] text-bb-muted">
                {marketStatus.message}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-bb-muted">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded hover:bg-bb-gray text-bb-text transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {marketStatus && <span>{marketStatus.day}, {marketStatus.server_date}</span>}
            <span className="font-mono text-bb-text tabular-nums">
              {marketStatus?.server_time || time.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex-1 p-6">
          <Outlet context={{ theme }} />
        </div>
      </div>
    </div>
  );
};

export default Layout;