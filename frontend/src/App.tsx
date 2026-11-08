import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { ReconciliationProvider } from './context/ReconciliationContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportDataPage } from './pages/ImportDataPage';
import { ReconcileWorkspacePage } from './pages/ReconcileWorkspacePage';
import { ReconciliationResultsPage } from './pages/ReconciliationResultsPage';
import { InvestigationCentrePage } from './pages/InvestigationCentrePage';
import { ReportsPage } from './pages/ReportsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Hash/State-based clean client router (survives refreshes and static embedding)
  const getInitialRoute = () => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialRoute);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Render Public or Protected Views
  if (currentPath === '/') {
    return <LandingPage onNavigate={navigate} />;
  }

  if (currentPath === '/login' || !isAuthenticated) {
    return <LoginPage onNavigate={navigate} />;
  }

  // Protected Application Shell
  const renderProtectedPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case '/import':
        return <ImportDataPage onNavigate={navigate} />;
      case '/reconcile':
        return <ReconcileWorkspacePage onNavigate={navigate} />;
      case '/results':
        return <ReconciliationResultsPage onNavigate={navigate} />;
      case '/investigations':
        return <InvestigationCentrePage onNavigate={navigate} />;
      case '/reports':
        return <ReportsPage onNavigate={navigate} />;
      case '/history':
        return <HistoryPage onNavigate={navigate} />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <AppLayout currentPath={currentPath} onNavigate={navigate}>
        <ErrorBoundary>
          {renderProtectedPage()}
        </ErrorBoundary>
      </AppLayout>
    </ErrorBoundary>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <ReconciliationProvider>
          <AppContent />
        </ReconciliationProvider>
      </AudioProvider>
    </AuthProvider>
  );
};

export default App;

