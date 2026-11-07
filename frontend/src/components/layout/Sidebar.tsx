import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  GitCompare, 
  ListFilter, 
  FileSearch, 
  FileSpreadsheet, 
  History, 
  Settings, 
  Scale, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReconciliation } from '../../context/ReconciliationContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { investigations } = useReconciliation();

  const openCasesCount = investigations.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Import CSVs', path: '/import', icon: UploadCloud },
    { label: 'Reconciliation', path: '/reconcile', icon: GitCompare },
    { label: 'Results & Mismatches', path: '/results', icon: ListFilter },
    { 
      label: 'Investigation Centre', 
      path: '/investigations', 
      icon: FileSearch,
      badge: openCasesCount > 0 ? openCasesCount : undefined 
    },
    { label: 'Reports & Audit', path: '/reports', icon: FileSpreadsheet },
    { label: 'Batch History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidenav Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-navy-800 text-ivory-100 flex flex-col border-r border-navy-700 transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-navy-700/80">
          <div 
            onClick={() => handleItemClick('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-ivory-50 font-sans">
                PAY<span className="text-gold-500">TRACE</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">FINTECH RECON</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150',
                  isActive 
                    ? 'bg-navy-700 text-gold-400 shadow-sm border border-gold-500/20' 
                    : 'text-slate-300 hover:bg-navy-700/50 hover:text-ivory-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-gold-500' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <ChevronRight className="w-3.5 h-3.5 text-gold-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-navy-700/80 bg-navy-900/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-navy-800/80 border border-navy-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-500 font-bold flex items-center justify-center text-xs border border-gold-500/30 shrink-0">
                {user?.fullName ? user.fullName[0] : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ivory-50 truncate">{user?.fullName || 'Analyst'}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{user?.role === 'ROLE_ADMIN' ? 'Admin' : 'Analyst'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-crimson-400 hover:bg-navy-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

