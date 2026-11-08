import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ReconciliationRun, ImportBatch, InvestigationCase } from '../types/api';
import { apiClient, isMockModeActive } from '../services/apiClient';

interface ReconciliationContextType {
  activeBatch: ImportBatch | null;
  activeRun: ReconciliationRun | null;
  investigations: InvestigationCase[];
  isProcessing: boolean;
  isLoadingInvestigations: boolean;
  investigationsError: string | null;
  setActiveBatch: (batch: ImportBatch | null) => void;
  setActiveRun: (run: ReconciliationRun | null) => void;
  runReconciliation: (tolerance?: string) => Promise<ReconciliationRun>;
  refreshInvestigations: () => Promise<void>;
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined);

export const ReconciliationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBatch, setActiveBatch] = useState<ImportBatch | null>(null);
  const [activeRun, setActiveRun] = useState<ReconciliationRun | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationCase[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingInvestigations, setIsLoadingInvestigations] = useState<boolean>(true);
  const [investigationsError, setInvestigationsError] = useState<string | null>(null);

  const refreshInvestigations = useCallback(async () => {
    setIsLoadingInvestigations(true);
    setInvestigationsError(null);
    try {
      const cases = await apiClient.getInvestigations();
      setInvestigations(cases || []);
    } catch (err: any) {
      console.error('Failed to load investigations', err);
      setInvestigationsError(err?.message || 'Unable to connect to PayTrace backend.');
      setInvestigations([]);
    } finally {
      setIsLoadingInvestigations(false);
    }
  }, []);

  useEffect(() => {
    refreshInvestigations();

    if (!isMockModeActive()) {
      // In Live Mode: only fetch actual runs from the backend
      apiClient.getAllRuns().then(runs => {
        if (runs && runs.length > 0) {
          setActiveRun(runs[0]);
        } else {
          setActiveRun(null);
        }
      }).catch(() => {
        setActiveRun(null);
      });
    } else {
      // In Demo Mode: load stored demo run or fallback
      apiClient.getAllRuns().then(runs => {
        if (runs && runs.length > 0) {
          setActiveRun(runs[0]);
        }
      }).catch(() => {});
    }
  }, [refreshInvestigations]);

  const runReconciliation = async (tolerance: string = '0.05'): Promise<ReconciliationRun> => {
    setIsProcessing(true);
    try {
      const batchId = activeBatch ? activeBatch.batchId : 'BATCH-DEMO-2026';
      const result = await apiClient.triggerReconciliation(batchId, tolerance);
      setActiveRun(result);
      await refreshInvestigations();
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ReconciliationContext.Provider value={{
      activeBatch,
      activeRun,
      investigations,
      isProcessing,
      isLoadingInvestigations,
      investigationsError,
      setActiveBatch,
      setActiveRun,
      runReconciliation,
      refreshInvestigations
    }}>
      {children}
    </ReconciliationContext.Provider>
  );
};

export const useReconciliation = () => {
  const ctx = useContext(ReconciliationContext);
  if (!ctx) throw new Error('useReconciliation must be used within a ReconciliationProvider');
  return ctx;
};
