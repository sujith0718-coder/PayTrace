import React, { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, User, UploadCloud, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AuditLogItem, ReconciliationRun } from '../types/api';
import { apiClient, isMockModeActive } from '../services/apiClient';
import { useReconciliation } from '../context/ReconciliationContext';

interface HistoryPageProps {
  onNavigate: (path: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { setActiveRun } = useReconciliation();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHistory = () => {
    setIsLoading(true);
    Promise.all([
      apiClient.getAllRuns().catch(() => []),
      apiClient.getAuditLogs().catch(() => [])
    ]).then(([fetchedRuns, fetchedLogs]) => {
      setRuns(fetchedRuns || []);
      setLogs(fetchedLogs || []);
    }).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const demoRunsFallback = [
    {
      runId: 'RUN-2026-901',
      batchId: 'BATCH-DEMO-001',
      status: 'COMPLETED' as const,
      startedAt: '2026-11-07T08:15:00Z',
      completedAt: '2026-11-07T08:15:00Z',
      metrics: {
        totalRecords: 1250,
        matchedRecords: 1205,
        discrepanciesCount: 45,
        reconciliationPercentage: 96.4,
        totalOrderValue: '184500.00',
        totalSettledValue: '179240.00',
        unreconciledVariance: '5260.00'
      },
      discrepancies: []
    }
  ];

  const displayedRuns = runs.length > 0 ? runs : (isMockModeActive() ? demoRunsFallback : []);

  const handleSelectRun = (run: ReconciliationRun) => {
    setActiveRun(run);
    onNavigate('/results');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            Batch History & Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Historical record of reconciliation runs, CSV ingestion batches, and analyst modifications
          </p>
        </div>

        <Button
          variant="secondary-navy"
          size="sm"
          onClick={fetchHistory}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`w-4 h-4 text-gold-500 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh History
        </Button>
      </div>

      {/* Historical Runs */}
      <Card variant="white" className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-navy-950 font-sans uppercase tracking-wider">
          Reconciliation Execution History
        </h2>

        {displayedRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Batch ID</th>
                  <th className="py-2.5 px-3">Execution Time</th>
                  <th className="py-2.5 px-3 text-right">Records</th>
                  <th className="py-2.5 px-3 text-right">Match Rate</th>
                  <th className="py-2.5 px-3 text-right">Discrepancies</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {displayedRuns.map((run) => (
                  <tr key={run.runId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-navy-950">{run.runId}</td>
                    <td className="py-3 px-3 text-slate-500">{run.batchId || '-'}</td>
                    <td className="py-3 px-3 text-slate-500 font-sans">
                      {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 text-right">{run.metrics?.totalRecords ?? 0}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {(run.metrics?.reconciliationPercentage ?? 0).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-crimson-600">
                      {run.metrics?.discrepanciesCount ?? 0}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <Button
                        variant="outline-gold"
                        size="sm"
                        onClick={() => handleSelectRun(run)}
                      >
                        View Results
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-navy-950 font-sans">No Reconciliation Runs Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your Orders, Payments, and Settlements CSV files and run reconciliation to generate historical records.
            </p>
            <Button
              variant="primary-gold"
              size="sm"
              onClick={() => onNavigate('/import')}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload CSV Files
            </Button>
          </div>
        )}
      </Card>

      {/* Audit Log Table */}
      <Card variant="white" className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-navy-950 font-sans uppercase tracking-wider">
          System Compliance Audit Trail
        </h2>

        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy-950">{log.action}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                      {log.targetType} #{log.targetId}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>

                <div className="text-right sm:text-right shrink-0 font-mono text-[11px] text-slate-400">
                  <p className="font-semibold text-slate-700 font-sans">{log.userName}</p>
                  <p>{log.timestamp ? log.timestamp.slice(0, 16).replace('T', ' ') : ''}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No audit logs recorded yet. System activities will appear here in real-time.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

