import React, { useEffect, useState } from 'react';
import { Menu, Search, Database, CloudOff, RefreshCw } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { useAuth } from '../../context/AuthContext';
import { apiClient, isMockModeActive, toggleMockMode } from '../../services/apiClient';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  currentPath: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  currentPath,
}) => {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const isMock = isMockModeActive();

  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await apiClient.checkHealth();
      setIsLive(res.isLive);
    } catch {
      setIsLive(false);
    } finally {
      setChecking(false);
    }
  };

  const handleBadgeClick = () => {
    if (!isMock && !isLive) {
      checkConnection();
    } else {
      toggleMockMode();
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  // Generate clean breadcrumb labels
  const pathParts = currentPath.split('/').filter(Boolean);
  const currentTitle = pathParts.length > 0
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1).replace(/-/g, ' ')
    : 'Dashboard';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-500 hover:text-navy-950 hover:bg-slate-100 lg:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb path */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400">PayTrace</span>
          <span className="text-slate-300">/</span>
          <span className="text-navy-950 font-bold">{currentTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dynamic Live Cloud / Mock Mode Toggle Badge */}
        <button
          onClick={handleBadgeClick}
          title={
            !isMock && isLive
              ? "Live backend connected. Click to switch to Demo Mocks."
              : isMock
              ? "Currently in Demo Mode. Click to switch to Live Backend!"
              : checking
              ? "Connecting to Render Cloud & TiDB... Please wait."
              : "Unable to reach backend. Click to retry connection."
          }
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono transition-all cursor-pointer ${
            !isMock && isLive
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : isMock
              ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              : checking
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
          }`}
        >
          {!isMock && isLive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold">LIVE: TiDB & Render</span>
            </>
          ) : isMock ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
              <span>DEMO MOCKS (Click for Live)</span>
            </>
          ) : checking ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
              <span>CONNECTING CLOUD...</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-rose-600" />
              <span className="font-bold">OFFLINE (Click to Retry)</span>
            </>
          )}
        </button>

        {/* Audio Toggle SFX button */}
        <AudioToggle />

        {/* Global Search shortcut (visual) */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Order or Case ID..."
            className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
          />
        </div>

        {/* User avatar indicator */}
        <div className="w-8 h-8 rounded-full bg-navy-800 text-gold-400 text-xs font-bold flex items-center justify-center border border-gold-500/30">
          {user?.fullName ? user.fullName[0] : 'A'}
        </div>
      </div>
    </header>
  );
};
