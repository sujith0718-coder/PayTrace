import React from 'react';
import { 
  Printer, 
  Download, 
  Scale, 
  CheckCircle2, 
  FileCheck, 
  Building2, 
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useReconciliation } from '../context/ReconciliationContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/cn';

interface ReportsPageProps {
  onNavigate: (path: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = () => {
  const { activeRun, investigations } = useReconciliation();
  const { user } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = 'Discrepancy_ID,Run_ID,Type,Severity,Order_ID,Expected_Amount,Actual_Amount,Variance,Explanation\n';
    const rows = (activeRun?.discrepancies || []).map(d => 
      `"${d.investigationId || d.id}","${d.runId}","${d.type}","${d.severity}","${d.orderId}","${d.expectedAmount}","${d.actualAmount}","${d.variance}","${d.explanation.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paytrace_reconciliation_report_${activeRun?.runId || 'run'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolvedCount = investigations.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            Executive Audit & Reconciliation Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Stage 4: Generate compliance-ready balance certificates, PDF exports, and raw data dumps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary-navy"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4 text-gold-500" />}
          >
            Export Discrepancies CSV
          </Button>
          <Button
            variant="primary-gold"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Official Audit Certificate Document */}
      <div className="bg-white rounded-2xl border-2 border-slate-300/80 shadow-xl p-8 sm:p-12 space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Certificate Header */}
        <div className="flex items-start justify-between border-b-2 border-navy-900 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy-900 text-gold-500 flex items-center justify-center font-bold">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-wider text-navy-950 font-sans">
                PAY<span className="text-gold-600">TRACE</span> AUDIT
              </h2>
              <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                CERTIFICATE OF RECONCILIATION BALANCE
              </p>
            </div>
          </div>

          <div className="text-right text-xs font-mono">
            <p className="font-bold text-navy-950">RUN: #{activeRun?.runId || 'RUN-2026-901'}</p>
            <p className="text-slate-500">DATE: {new Date().toLocaleDateString()}</p>
            <p className="text-slate-500">STATUS: AUDITED & BALANCED</p>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="space-y-2 text-xs leading-relaxed text-slate-700">
          <p>
            This document certifies that the automated 3-way financial reconciliation engine has executed matching across Ingested Order Management records, Payment Gateway transaction captures, and Acquiring Bank settlements for Batch #{activeRun?.batchId || 'BATCH-2026-11-001'}.
          </p>
          <p>
            Out of <strong>1,250 evaluated records</strong>, <strong>1,205 transactions (96.4%)</strong> were reconciled without variance. A total of <strong>45 variances</strong> were flagged, of which <strong>{resolvedCount} cases</strong> have been formally reviewed and closed by certified financial analysts.
          </p>
        </div>

        {/* Balance Sheet Ledger Comparison */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 font-mono mb-3">
            Tri-Fold Financial Position Summary
          </h3>
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50 font-bold uppercase text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 text-left">Ledger Source</th>
                <th className="py-2.5 px-4 text-left">Record Count</th>
                <th className="py-2.5 px-4 text-right">Gross Valuation</th>
                <th className="py-2.5 px-4 text-right">Reconciled Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-navy-950">Order Management Records (OMS)</td>
                <td className="py-3 px-4">1,250</td>
                <td className="py-3 px-4 text-right font-bold">$184,500.00</td>
                <td className="py-3 px-4 text-right text-emerald-600 font-bold">INGESTED</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-navy-950">Payment Gateway Captured Logs</td>
                <td className="py-3 px-4">1,240</td>
                <td className="py-3 px-4 text-right font-bold">$182,100.00</td>
                <td className="py-3 px-4 text-right text-emerald-600 font-bold">VERIFIED</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-navy-950">Acquiring Bank Settlement Statements</td>
                <td className="py-3 px-4">1,220</td>
                <td className="py-3 px-4 text-right font-bold">$179,240.00</td>
                <td className="py-3 px-4 text-right text-emerald-600 font-bold">SETTLED</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="py-3 px-4 font-sans text-navy-950" colSpan={2}>Net Unreconciled Variance</td>
                <td className="py-3 px-4 text-right text-crimson-600">$5,260.00</td>
                <td className="py-3 px-4 text-right text-amber-600 font-sans text-[11px]">IN INVESTIGATION</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resolved Discrepancies Audit Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 font-mono mb-3">
            Investigation Resolution Registry (Sample)
          </h3>
          <table className="w-full text-[11px] border border-slate-200">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 text-left">Case ID</th>
                <th className="py-2 px-3 text-left">Discrepancy Type</th>
                <th className="py-2 px-3 text-right">Variance</th>
                <th className="py-2 px-3 text-left">Resolution Category</th>
                <th className="py-2 px-3 text-left">Analyst Sign-Off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {investigations.slice(0, 3).map((c) => (
                <tr key={c.id}>
                  <td className="py-2 px-3 font-bold text-navy-950">{c.caseNumber}</td>
                  <td className="py-2 px-3 font-sans">{c.discrepancyType.replace(/_/g, ' ')}</td>
                  <td className="py-2 px-3 text-right font-bold text-crimson-600">{c.discrepancy.variance}</td>
                  <td className="py-2 px-3 font-sans text-slate-700">{c.resolutionCategory || 'UNDER REVIEW'}</td>
                  <td className="py-2 px-3 font-sans text-slate-700">{c.assignedAnalyst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compliance Sign-Off Block */}
        <div className="pt-8 border-t-2 border-navy-900 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Primary Financial Analyst</p>
            <div className="mt-4 border-b border-slate-400 pb-1">
              <span className="font-serif italic text-base text-navy-950">
                {user?.fullName || 'Sujith E'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Lead Systems & Reconciliation Engineer</p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Supervisory Auditor Sign-Off</p>
            <div className="mt-4 border-b border-slate-400 pb-1">
              <span className="font-serif italic text-base text-navy-950">
                Thurika G & Mithunasri J
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Audit & Investigation Review Board</p>
          </div>
        </div>

        {/* Security Watermark Footnote */}
        <div className="text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-4">
          Generated via PayTrace Automated Algorithmic Reconciliation System • Zero Fund Custody Architecture
        </div>
      </div>
    </div>
  );
};

