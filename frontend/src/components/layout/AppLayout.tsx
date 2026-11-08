import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-ivory-100">
      {/* Sidenav */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentPath={currentPath}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col justify-between">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
          
          <footer className="mt-12 pt-6 pb-2 border-t border-slate-200/80 text-center text-xs text-slate-500 font-mono">
            <p>PayTrace — Payment Discrepancy Detection & Reconciliation System</p>
            <p className="mt-1 text-slate-700 font-medium">Built with 🩷 by Thurika G, Sujith E, Tharun J, Mithunasri J • Academic Project</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

