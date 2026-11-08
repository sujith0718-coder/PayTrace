import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  ArrowRight, 
  Scale, 
  Layers, 
  Activity, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useReconciliation } from '../context/ReconciliationContext';
import { useAudio } from '../context/AudioContext';
import { isMockModeActive } from '../services/apiClient';

interface ReconcileWorkspacePageProps {
  onNavigate: (path: string) => void;
}

export const ReconcileWorkspacePage: React.FC<ReconcileWorkspacePageProps> = ({ onNavigate }) => {
  const { runReconciliation, activeRun, activeBatch } = useReconciliation();
  const { playSuccess, playAlert, playCoinChime } = useAudio();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM READY] PayTrace Matching Engine v1.0.0 initialized.',
    '[INFO] Awaiting batch trigger parameters...',
  ]);

  const stages = [
    'Parsing & Normalizing CSV Data Streams',
    'Order-to-Payment Hash Key Matching',
    'Bank Settlement Cross-Reference Verification',
    'Mathematical Tolerance & Fee Calculation',
    'Discrepancy Categorization & Case Generation'
  ];

  const handleStartReconciliation = async () => {
    setIsRunning(true);
    setIsCompleted(false);
    setCurrentStep(0);
    playCoinChime();

    setLogs(prev => [
      ...prev,
      `[START] Dispatched Batch #${activeRun?.batchId || 'BATCH-2026-11-001'} to Java Reconciliation Engine...`,
    ]);

    try {
      const result = await runReconciliation();

      // Dynamic step-by-step progress with REAL metrics from Java Engine
      for (let i = 0; i < stages.length; i++) {
        setCurrentStep(i);
        await new Promise(r => setTimeout(r, 450));

        if (i === 1) {
          setLogs(prev => [
            ...prev,
            `[MATCH] ${result.metrics.matchedRecords} Orders verified with 1:1 Payment captures (₹${result.metrics.totalSettledValue})`,
            result.metrics.discrepanciesCount > 0 
              ? `[ALERT] ${result.metrics.discrepanciesCount} discrepancy cases flagged by algorithm.` 
              : '[SUCCESS] Clean 1:1 match across all processed order records.'
          ]);
        } else if (i === 2) {
          setLogs(prev => [
            ...prev,
            '[MATCH] Bank settlements cross-referenced across settlement records.',
            `[STATUS] Verified records: ${result.metrics.matchedRecords} / ${result.metrics.totalRecords}`
          ]);
        } else if (i === 3) {
          setLogs(prev => [
            ...prev,
            '[MATH] Mathematical precision evaluated with BigDecimal tolerance (₹0.05).',
            `[VARIANCE] Total detected financial variance: ₹${result.metrics.unreconciledVariance}`
          ]);
        } else if (i === 4) {
          setLogs(prev => [
            ...prev,
            `[CLASSIFY] Auto-generated ${result.metrics.discrepanciesCount} investigation cases.`,
            `[COMPLETE] Java Reconciliation Engine finalized. Overall Match Rate: ${result.metrics.reconciliationPercentage.toFixed(1)}%.`
          ]);
        }
      }

      setIsRunning(false);
      setIsCompleted(true);
      playSuccess();
    } catch {
      setIsRunning(false);
      playAlert();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            Algorithmic Reconciliation Workspace
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Stage 2: Execute 3-way matching engine across Ingested Orders, Payments, and Bank Settlements
          </p>
        </div>

        {!isRunning && !isCompleted && (
          <Button
            variant="primary-gold"
            size="md"
            onClick={handleStartReconciliation}
            leftIcon={<Play className="w-4 h-4" />}
          >
            Execute Matching Algorithm
          </Button>
        )}
      </div>

      {/* Visual Reconciliation Pipeline Diagram */}
      <Card variant="navy" className="p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Ingress Streams */}
          <div className="md:col-span-4 space-y-3">
            <div className="p-3 rounded-lg bg-navy-900 border border-navy-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gold-400" />
                <span className="text-xs font-semibold text-ivory-100">Orders Stream ({activeBatch?.ordersCount ?? (isMockModeActive() ? 1250 : 0)})</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">OMS</span>
            </div>

            <div className="p-3 rounded-lg bg-navy-900 border border-navy-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-lavender-400" />
                <span className="text-xs font-semibold text-ivory-100">Payments Stream ({activeBatch?.paymentsCount ?? (isMockModeActive() ? 1240 : 0)})</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">GATEWAY</span>
            </div>

            <div className="p-3 rounded-lg bg-navy-900 border border-navy-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-ivory-100">Settlements Stream ({activeBatch?.settlementsCount ?? (isMockModeActive() ? 1220 : 0)})</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">BANK</span>
            </div>
          </div>

          {/* Center: PayTrace Engine Core */}
          <div className="md:col-span-4 flex flex-col items-center text-center py-4">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-tr from-navy-900 to-navy-800 border-2 border-gold-500 shadow-gold-glow flex flex-col items-center justify-center text-gold-500 transition-all ${
              isRunning ? 'animate-pulse scale-105' : ''
            }`}>
              <Scale className="w-10 h-10" />
              <span className="text-[9px] font-mono font-bold tracking-widest mt-1 text-ivory-50">ENGINE</span>
            </div>
            <p className="mt-3 text-xs font-bold text-ivory-50">Java 21 O(N) Engine</p>
            <p className="text-[11px] text-slate-400 font-mono">Tolerance: ±₹0.05</p>
          </div>

          {/* Right: Output Split */}
          <div className="md:col-span-4 space-y-3">
            <div className="p-3 rounded-lg bg-navy-900 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">Balanced Ledger</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {activeRun?.metrics.matchedRecords ?? (isMockModeActive() ? 1205 : 0)} ({(activeRun?.metrics.reconciliationPercentage ?? (isMockModeActive() ? 96.4 : 0)).toFixed(1)}%)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-navy-900 border border-crimson-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-crimson-400" />
                <span className="text-xs font-semibold text-crimson-300">Flagged Discrepancies</span>
              </div>
              <span className="text-xs font-mono font-bold text-crimson-400">
                {activeRun?.metrics.discrepanciesCount ?? (isMockModeActive() ? 45 : 0)} ({(activeRun ? 100 - activeRun.metrics.reconciliationPercentage : (isMockModeActive() ? 3.6 : 0)).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Execution Stepper */}
      <Card variant="white" className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider font-mono">
          Algorithm Pipeline Stages
        </h2>

        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const isDone = isCompleted || (isRunning && currentStep > idx);
            const isCurrent = isRunning && currentStep === idx;

            return (
              <div 
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isDone 
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                    : isCurrent
                    ? 'bg-gold-50/60 border-gold-300 text-navy-950 font-bold shadow-sm'
                    : 'bg-slate-50 border-slate-200/70 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                    isDone 
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-gold-500 text-navy-950'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : `0${idx + 1}`}
                  </div>
                  <span className="text-xs">{stage}</span>
                </div>
                {isCurrent && (
                  <span className="text-xs text-gold-600 font-mono font-semibold animate-pulse">
                    Processing...
                  </span>
                )}
                {isDone && (
                  <span className="text-xs text-emerald-600 font-mono font-semibold">
                    Verified
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Live Engine Trace Terminal */}
      <Card variant="navy" className="p-5 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-navy-700 text-slate-400 text-[11px]">
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-gold-500" />
            ENGINE EXECUTION STREAM
          </span>
          <span>JVM 21 • 64-BIT</span>
        </div>
        <div className="h-40 overflow-y-auto space-y-1.5 text-slate-300 pt-1">
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed">
              {log.includes('[ALERT]') || log.includes('[VARIANCE]') ? (
                <span className="text-crimson-400 font-bold">{log}</span>
              ) : log.includes('[MATCH]') || log.includes('[COMPLETE]') ? (
                <span className="text-emerald-400">{log}</span>
              ) : log.includes('[CLASSIFY]') ? (
                <span className="text-gold-400">{log}</span>
              ) : (
                <span>{log}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Completion CTA Banner */}
      {isCompleted && (
        <Card variant="ivory" className="p-6 border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-navy-950">
                Reconciliation Run Completed Successfully
              </h3>
              <p className="text-xs text-slate-600">
                {activeRun?.metrics.matchedRecords ?? 1205} matched records balanced. {activeRun?.metrics.discrepanciesCount ?? 45} discrepancies detected and registered for investigation.
              </p>
            </div>
          </div>

          <Button
            variant="primary-gold"
            size="md"
            onClick={() => onNavigate('/results')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Inspect Detailed Results
          </Button>
        </Card>
      )}
    </div>
  );
};

