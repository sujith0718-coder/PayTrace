import React, { useState } from 'react';
import { 
  FileSearch, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  User as UserIcon,
  Stamp,
  RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useReconciliation } from '../context/ReconciliationContext';
import { useAudio } from '../context/AudioContext';
import { InvestigationCase, InvestigationStatus, ResolutionCategory } from '../types/api';
import { apiClient, isMockModeActive } from '../services/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvestigationCentrePageProps {
  onNavigate: (path: string) => void;
}

export const InvestigationCentrePage: React.FC<InvestigationCentrePageProps> = ({ onNavigate }) => {
  const { 
    investigations, 
    refreshInvestigations,
    isLoadingInvestigations,
    investigationsError
  } = useReconciliation();
  const { playStamp, playSuccess, playClick } = useAudio();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [newNote, setNewNote] = useState<string>('');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [resolutionCategory, setResolutionCategory] = useState<ResolutionCategory>('TIMING_DIFFERENCE');
  const [resolutionReason, setResolutionReason] = useState<string>('');

  const filteredCases = (investigations || []).filter(c => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string>('');

  // Intelligently select active case
  const selectedCase = 
    filteredCases.find(c => c.id === selectedCaseId) ||
    (investigations || []).find(c => c.id === selectedCaseId) ||
    filteredCases[0] ||
    (investigations || [])[0];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCase) return;
    try {
      await apiClient.addInvestigationNote(selectedCase.id, newNote);
      setNewNote('');
      playClick();
      await refreshInvestigations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status: InvestigationStatus) => {
    if (!selectedCase) return;
    if (status === 'RESOLVED') {
      setIsResolveModalOpen(true);
      return;
    }
    try {
      await apiClient.updateInvestigationStatus(selectedCase.id, status);
      playClick();
      await refreshInvestigations();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmResolution = async () => {
    if (!selectedCase || !resolutionReason.trim()) return;
    try {
      await apiClient.updateInvestigationStatus(
        selectedCase.id, 
        'RESOLVED', 
        resolutionCategory, 
        resolutionReason
      );
      playStamp();
      playSuccess();
      setIsResolveModalOpen(false);
      setResolutionReason('');
      await refreshInvestigations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
          Financial Investigation Centre
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Stage 3: Review flagged variances, assign resolution categories, and manage immutable audit trails
        </p>
      </div>

      {/* Dual Pane Layout */}
      {isLoadingInvestigations ? (
        <Card variant="white" className="p-16 text-center border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700">Loading investigations from database...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to TiDB Cloud backend...</p>
        </Card>
      ) : investigationsError && !isMockModeActive() ? (
        <Card variant="white" className="p-8 md:p-12 text-center border-red-200 bg-red-50/20 max-w-2xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Unable to connect to PayTrace backend
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-2 bg-slate-100 p-2 rounded max-w-md mx-auto break-all">
            {apiClient.getBaseUrl()}/investigations
          </p>
          <p className="text-xs text-red-600 font-medium mt-2">
            {investigationsError}
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="primary-gold"
              size="sm"
              onClick={() => refreshInvestigations()}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retry Connection
            </Button>
          </div>
        </Card>
      ) : (!investigations || investigations.length === 0) ? (
        <Card variant="white" className="p-10 md:p-16 text-center border-slate-200 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-5 text-gold-600">
            <FileSearch className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-navy-950 font-sans tracking-tight">
            No Investigations Yet
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-2">
            There are currently no investigation records.
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Upload your Orders, Payments and Settlements CSV files and run reconciliation to generate investigation cases.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary-gold"
              size="md"
              onClick={() => onNavigate('/import')}
            >
              Upload CSV Files
            </Button>
            <Button
              variant="secondary-navy"
              size="md"
              onClick={() => onNavigate('/reconcile')}
            >
              Open Reconciliation Workspace
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Case Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors shrink-0 uppercase tracking-wider ${
                  filterStatus === st 
                    ? 'bg-navy-800 text-ivory-50 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-200/60'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredCases.length === 0 ? (
              <div className="p-6 text-center bg-white/80 rounded-xl border border-slate-200 text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No cases match filter</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Switch filter to ALL or run reconciliation.</p>
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = c.id === selectedCase?.id;
                const caseNum = c.caseNumber || c.id || 'INV-CASE';
                const rawDiscType = c.discrepancyType || c.discrepancy?.type || 'AMOUNT_MISMATCH';
                const discType = typeof rawDiscType === 'string' ? rawDiscType.replace(/_/g, ' ') : String(rawDiscType || 'AMOUNT_MISMATCH');
                const explanation = c.discrepancy?.explanation || 'Discrepancy detected and pending analyst review.';
                const variance = c.discrepancy?.variance || (c as any).varianceAmount || '0.00';
                const analyst = c.assignedAnalyst || (c as any).assignedTo || 'Sujith E';

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      playClick();
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-gold-500 shadow-md ring-1 ring-gold-500/50'
                        : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-navy-950">
                        {caseNum}
                      </span>
                      <Badge status={c.status || 'OPEN'} size="sm" />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-800">
                      {discType}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                      {explanation}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                      <span>Variance: {formatCurrency(variance)}</span>
                      <span>{analyst}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Case Dossier (8 cols) */}
        <div className="lg:col-span-8">
          {selectedCase ? (
            <Card variant="white" className="p-6 md:p-8 space-y-6 relative border-slate-200">
              {/* RESOLVED Rubber Stamp Animation Overlay */}
              {selectedCase.status === 'RESOLVED' && (
                <div className="absolute top-8 right-8 pointer-events-none transform rotate-[-12deg] z-10 animate-in fade-in zoom-in duration-300">
                  <div className="border-4 border-emerald-600 rounded-xl px-4 py-2 bg-emerald-50/90 text-emerald-700 font-mono font-black text-xl uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <Stamp className="w-6 h-6 text-emerald-600" />
                    <span>RESOLVED & AUDITED</span>
                  </div>
                </div>
              )}

              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-black text-navy-950">
                      {selectedCase.caseNumber || selectedCase.id || 'INV-CASE'}
                    </span>
                    <Badge status={selectedCase.status || 'OPEN'} />
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Order Ref: {selectedCase.discrepancy?.orderId || (selectedCase as any).orderId || 'N/A'} • Registered: {String(selectedCase.createdAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCase.status !== 'RESOLVED' ? (
                    <>
                      <Button
                        variant="secondary-navy"
                        size="sm"
                        onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                      >
                        Under Review
                      </Button>
                      <Button
                        variant="primary-gold"
                        size="sm"
                        onClick={() => handleUpdateStatus('RESOLVED')}
                        leftIcon={<Stamp className="w-4 h-4" />}
                      >
                        Resolve Case
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus('REOPENED')}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      Reopen Case
                    </Button>
                  )}
                </div>
              </div>

              {/* Discrepancy Breakdown Box */}
              <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-300 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 font-mono">
                  Variance Calculation & Root Cause
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedCase.discrepancy?.explanation || 'Automatic audit variance flagged by Java Reconciliation Engine.'}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center font-mono">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase">Expected Amount</p>
                    <p className="text-sm font-bold text-navy-950">{formatCurrency(selectedCase.discrepancy?.expectedAmount)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase">Actual Amount</p>
                    <p className="text-sm font-bold text-navy-950">{formatCurrency(selectedCase.discrepancy?.actualAmount)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-crimson-50 border border-crimson-200">
                    <p className="text-[10px] text-crimson-700 uppercase font-bold">Variance</p>
                    <p className="text-sm font-black text-crimson-600">{formatCurrency(selectedCase.discrepancy?.variance || (selectedCase as any).varianceAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Resolution Details (if resolved) */}
              {selectedCase.status === 'RESOLVED' && selectedCase.resolutionNote && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Resolution Category: {selectedCase.resolutionCategory}</span>
                  </div>
                  <p className="text-xs text-slate-700">{selectedCase.resolutionNote}</p>
                </div>
              )}

              {/* Analyst Timeline & Notes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 font-mono flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gold-500" />
                  Investigation Timeline & Notes ({(selectedCase.notes || []).length})
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {(selectedCase.notes || []).map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="font-bold text-navy-900">{note?.author || 'Analyst'} ({note?.authorRole || 'Compliance'})</span>
                        <span>{String(note?.timestamp || '').slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="text-slate-700 font-sans">{note.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an analyst investigation note or external ticket reference..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <Button
                    type="submit"
                    variant="secondary-navy"
                    size="sm"
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Add Note
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card variant="white" className="p-12 text-center text-slate-400 text-xs">
              Select an investigation case from the queue to view details.
            </Card>
          )}
        </div>
      </div>
    )}

      {/* Resolution Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Investigation Case"
        description="Attach an official resolution category and compliance note to balance this discrepancy."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Resolution Category
            </label>
            <select
              value={resolutionCategory}
              onChange={(e) => setResolutionCategory(e.target.value as ResolutionCategory)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="TIMING_DIFFERENCE">Timing Difference (Delayed Deposit/Clearing)</option>
              <option value="BANK_FEE_VARIANCE">Bank Interchange Fee Variance</option>
              <option value="REFUND_TIMING">Post-Order Refund / Promotional Credit</option>
              <option value="DATA_CORRECTION">Source Data Corrected & Re-verified</option>
              <option value="MANUAL_OVERRIDE">Executive Approval & Manual Override</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Mandatory Audit Resolution Note
            </label>
            <textarea
              rows={3}
              value={resolutionReason}
              onChange={(e) => setResolutionReason(e.target.value)}
              placeholder="e.g. Verified with merchant acquiring bank; interchange adjustment confirmed."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsResolveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary-gold"
              size="sm"
              onClick={confirmResolution}
              disabled={!resolutionReason.trim()}
              leftIcon={<Stamp className="w-4 h-4" />}
            >
              Confirm & Apply Resolution Stamp
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

