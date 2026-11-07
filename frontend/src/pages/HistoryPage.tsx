import React, { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, User } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AuditLogItem } from '../types/api';
import { apiClient } from '../services/apiClient';

interface HistoryPageProps {
  onNavigate: (path: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    apiClient.getAuditLogs().then(setLogs).catch(() => {});
  }, []);

  const historicalRuns = [
    {
      id: 'RUN-2026-901',
      date: '2026-11-07 08:15',
      analyst: 'Sujith E',
      records: 1250,
      matchRate: '96.4%',
      discrepancies: 45,
      status: 'COMPLETED'
    },
    {
      id: 'RUN-2026-890',
      date: '2026-11-06 17:30',
      analyst: 'Thurika G',
      records: 1100,
      matchRate: '98.1%',
      discrepancies: 21,
      status: 'COMPLETED'
    },
    {
      id: 'RUN-2026-875',
      date: '2026-11-05 14:10',
      analyst: 'Tharun J',
      records: 980,
      matchRate: '95.9%',
      discrepancies: 40,
      status: 'COMPLETED'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
          Batch History & Immutable Audit Trail
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Historical record of reconciliation runs, CSV ingestion batches, and analyst modifications
        </p>
      </div>

      {/* Historical Runs */}
      <Card variant="white" className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-navy-950 font-sans uppercase tracking-wider">
          Reconciliation Execution History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Execution Time</th>
                <th className="py-2.5 px-3">Lead Analyst</th>
                <th className="py-2.5 px-3 text-right">Records</th>
                <th className="py-2.5 px-3 text-right">Match Rate</th>
                <th className="py-2.5 px-3 text-right">Discrepancies</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {historicalRuns.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-navy-950">{run.id}</td>
                  <td className="py-3 px-3 text-slate-500 font-sans">{run.date}</td>
                  <td className="py-3 px-3 text-slate-700 font-sans">{run.analyst}</td>
                  <td className="py-3 px-3 text-right">{run.records}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">{run.matchRate}</td>
                  <td className="py-3 px-3 text-right font-bold text-crimson-600">{run.discrepancies}</td>
                  <td className="py-3 px-3 text-right font-sans">
                    <Button
                      variant="outline-gold"
                      size="sm"
                      onClick={() => onNavigate('/results')}
                    >
                      View Results
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card variant="white" className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-navy-950 font-sans uppercase tracking-wider">
          System Compliance Audit Trail
        </h2>

        <div className="space-y-3">
          {logs.map((log) => (
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
                <p>{log.timestamp.slice(0, 16).replace('T', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

