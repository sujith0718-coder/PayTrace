import React from 'react';
import { Menu, Search, Terminal } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  currentPath: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  currentPath,
}) => {
  const { user } = useAuth();

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
        {/* Mock Data Engine Mode Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
          <Terminal className="w-3.5 h-3.5 text-gold-600" />
          <span>MOCK ENGINE READY</span>
        </div>

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

