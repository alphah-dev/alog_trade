import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, LineChart, BrainCircuit, BarChart3, LogOut, Globe } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/app/dashboard', name: 'Overview', icon: <LayoutDashboard size={18} /> },
    { path: '/app/terminal', name: 'Terminal', icon: <LineChart size={18} /> },
    { path: '/app/us-terminal', name: 'US Market', icon: <Globe size={18} /> },
    { path: '/app/indices', name: 'Indices', icon: <BarChart3 size={18} /> },
    { path: '/app/research', name: 'Research', icon: <BrainCircuit size={18} /> },
  ];

  return (
    <div className="w-56 bg-bb-dark border-r border-bb-border h-screen flex flex-col fixed left-0 top-0 z-50">
      <Link to="/" className="block px-5 py-5 border-b border-bb-border hover:bg-white/[0.02] transition-colors">
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
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded transition-all duration-150 mb-0.5 ${isActive
                ? 'bg-bb-orange/10 text-bb-orange border-l-2 border-bb-orange'
                : 'text-bb-muted hover:text-bb-text hover:bg-white/[0.03]'
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
  );
};

export default Sidebar;
