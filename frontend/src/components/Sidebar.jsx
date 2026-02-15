import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, LineChart, BrainCircuit, BarChart3, LogOut, Globe, Menu, X } from 'lucide-react';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/app/dashboard', name: 'Overview', icon: <LayoutDashboard size={18} /> },
    { path: '/app/terminal', name: 'Terminal', icon: <LineChart size={18} /> },
    { path: '/app/us-terminal', name: 'US Market', icon: <Globe size={18} /> },
    { path: '/app/indices', name: 'Indices', icon: <BarChart3 size={18} /> },
    { path: '/app/research', name: 'Research', icon: <BrainCircuit size={18} /> },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-3 z-[60] p-2 bg-bb-dark border border-bb-border rounded text-bb-text"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-bb-backdrop z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar panel */}
      <div className={`
        w-56 bg-bb-dark border-r border-bb-border h-screen flex flex-col fixed left-0 top-0 z-50
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <Link to="/" className="block px-5 py-5 border-b border-bb-border hover:bg-bb-hover transition-colors">
          <h1 className="text-lg font-bold text-bb-text">
            <span className="text-bb-orange">Algo</span>Term
          </h1>
          <div className="text-[10px] text-bb-muted mt-0.5">Paper Trading Platform</div>
        </Link>

        <nav className="flex-1 py-4 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded transition-all duration-150 mb-0.5 ${isActive
                  ? 'bg-bb-orange/10 text-bb-orange border-l-2 border-bb-orange'
                  : 'text-bb-muted hover:text-bb-text hover:bg-bb-hover'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-bb-border">
          <div className="flex items-center gap-2 px-3 py-2 text-bb-muted cursor-pointer hover:text-bb-red rounded transition-colors text-[13px]">
            <LogOut size={16} />
            <span>Logout</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
