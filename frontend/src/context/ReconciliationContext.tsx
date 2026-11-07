import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReconciliationRun, ImportBatch, InvestigationCase } from '../types/api';
import { apiClient } from '../services/apiClient';

interface ReconciliationContextType {
  activeBatch: ImportBatch | null;
  activeRun: ReconciliationRun | null;
  investigations: InvestigationCase[];
  isProcessing: boolean;
  setActiveBatch: (batch: ImportBatch | null) => void;
  runReconciliation: (tolerance?: string) => Promise<ReconciliationRun>;
  refreshInvestigations: () => Promise<void>;
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined);

export const ReconciliationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBatch, setActiveBatch] = useState<ImportBatch | null>(null);
  const [activeRun, setActiveRun] = useState<ReconciliationRun | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationCase[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const refreshInvestigations = async () => {
    try {
      const cases = await apiClient.getInvestigations();
      setInvestigations(cases);
    } catch (err) {
      console.error('Failed to load investigations', err);
    }
  };

  useEffect(() => {
    refreshInvestigations();
    // Default mock run for demo preview
    apiClient.getReconciliationRun('RUN-2026-901').then(run => {
      setActiveRun(run);
    }).catch(() => {});
  }, []);

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
      setActiveBatch,
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

