import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  FileSearch, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Info 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useReconciliation } from '../context/ReconciliationContext';
import { DiscrepancyType, DiscrepancyItem } from '../types/api';
import { apiClient } from '../services/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ReconciliationResultsPageProps {
  onNavigate: (path: string) => void;
}

export const ReconciliationResultsPage: React.FC<ReconciliationResultsPageProps> = ({ onNavigate }) => {
  const { activeRun } = useReconciliation();
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [persistedDiscrepancies, setPersistedDiscrepancies] = useState<DiscrepancyItem[]>(activeRun?.discrepancies || []);
  const [isLoadingDiscrepancies, setIsLoadingDiscrepancies] = useState<boolean>(false);

  useEffect(() => {
    if (activeRun?.runId) {
      setIsLoadingDiscrepancies(true);
      apiClient.getDiscrepancies(activeRun.runId)
        .then(list => {
          if (Array.isArray(list) && list.length > 0) {
            setPersistedDiscrepancies(list);
          } else if (activeRun.discrepancies && activeRun.discrepancies.length > 0) {
            setPersistedDiscrepancies(activeRun.discrepancies);
          } else {
            setPersistedDiscrepancies([]);
          }
        })
        .catch(err => {
          console.error('Failed to load persisted discrepancies', err);
          if (activeRun.discrepancies) {
            setPersistedDiscrepancies(activeRun.discrepancies);
          }
        })
        .finally(() => setIsLoadingDiscrepancies(false));
    }
  }, [activeRun?.runId]);

  const discrepancies = persistedDiscrepancies;

  const filterCounts = {
    ALL: discrepancies.length,
    AMOUNT_MISMATCH: discrepancies.filter(d => d.type === 'AMOUNT_MISMATCH').length,
    MISSING_PAYMENT: discrepancies.filter(d => d.type === 'MISSING_PAYMENT').length,
    MISSING_ORDER: discrepancies.filter(d => d.type === 'MISSING_ORDER').length,
    MISSING_SETTLEMENT: discrepancies.filter(d => d.type === 'MISSING_SETTLEMENT').length,
    UNMATCHED_SETTLEMENT: discrepancies.filter(d => d.type === 'UNMATCHED_SETTLEMENT').length,
    DUPLICATE_TRANSACTION: discrepancies.filter(d => d.type === 'DUPLICATE_TRANSACTION').length,
  };

  const filteredDiscrepancies = discrepancies.filter((item) => {
    const matchesTab = selectedTab === 'ALL' || item.type === selectedTab;
    const matchesSearch = 
      (item.orderId ? item.orderId.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (item.id ? item.id.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (item.explanation ? item.explanation.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            Reconciliation Results & Discrepancies
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Run #{activeRun?.runId || 'RUN-2026-901'} • 3-Way Comparative Record Audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary-navy"
            size="sm"
            onClick={() => onNavigate('/reports')}
            leftIcon={<Download className="w-4 h-4 text-gold-500" />}
          >
            Export Audit Report
          </Button>
          <Button
            variant="primary-gold"
            size="sm"
            onClick={() => onNavigate('/investigations')}
            leftIcon={<FileSearch className="w-4 h-4" />}
          >
            Open Investigation Centre
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setSelectedTab('ALL')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            selectedTab === 'ALL'
              ? 'bg-navy-800 text-ivory-50 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>All Discrepancies</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/50 text-current">
            {filterCounts.ALL}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('AMOUNT_MISMATCH')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            selectedTab === 'AMOUNT_MISMATCH'
              ? 'bg-crimson-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Amount Mismatches</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-crimson-100 text-crimson-800">
            {filterCounts.AMOUNT_MISMATCH}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('MISSING_PAYMENT')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            selectedTab === 'MISSING_PAYMENT'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Missing Payments</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
            {filterCounts.MISSING_PAYMENT}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('MISSING_ORDER')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            selectedTab === 'MISSING_ORDER'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Missing Orders</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800">
            {filterCounts.MISSING_ORDER}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('MISSING_SETTLEMENT')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            selectedTab === 'MISSING_SETTLEMENT'
              ? 'bg-lavender-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Missing Settlements</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-lavender-100 text-lavender-800">
            {filterCounts.MISSING_SETTLEMENT}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('UNMATCHED_SETTLEMENT')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            selectedTab === 'UNMATCHED_SETTLEMENT'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Unmatched Settlements</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800">
            {filterCounts.UNMATCHED_SETTLEMENT}
          </span>
        </button>

        <button
          onClick={() => setSelectedTab('DUPLICATE_TRANSACTION')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            selectedTab === 'DUPLICATE_TRANSACTION'
              ? 'bg-gold-600 text-navy-950 font-bold shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Duplicate Payments</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gold-200 text-navy-950 font-bold">
            {filterCounts.DUPLICATE_TRANSACTION}
          </span>
        </button>
      </div>

      {/* Search & Utility Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Discrepancy ID, or Explanation..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
          />
        </div>
        <p className="text-xs text-slate-500 font-mono">
          Showing {filteredDiscrepancies.length} records
        </p>
      </div>

      {/* 3-Way Comparative Record Table */}
      <Card variant="white" className="p-0 overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Discrepancy Tag</th>
                <th className="py-3 px-4">Order Record (OMS)</th>
                <th className="py-3 px-4">Payment Record (Gateway)</th>
                <th className="py-3 px-4">Settlement Record (Bank)</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredDiscrepancies.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Discrepancy Tag & Case */}
                  <td className="py-4 px-4 font-sans">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge status={item.type} size="sm" />
                        <span className="font-mono text-[11px] font-bold text-navy-950">
                          {item.investigationId || item.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 max-w-xs font-normal">
                        {item.explanation}
                      </p>
                    </div>
                  </td>

                  {/* Order Info */}
                  <td className="py-4 px-4">
                    {item.orderRecord ? (
                      <div>
                        <p className="font-bold text-navy-950">{item.orderRecord.orderId}</p>
                        <p className="text-[11px] text-slate-600 font-sans">
                          Amount: {formatCurrency(item.orderRecord.amount, item.orderRecord.currency)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Txn: {formatDate(item.orderRecord.orderDate)}
                        </p>
                        {item.orderRecord.createdAt && (
                          <p className="text-[9px] text-slate-400 font-sans">
                            DB: {formatDate(item.orderRecord.createdAt)}
                          </p>
                        )}
                      </div>
                    ) : item.type !== 'MISSING_ORDER' && item.type !== 'UNMATCHED_SETTLEMENT' && item.orderId ? (
                      <div>
                        <p className="font-bold text-navy-950">{item.orderId}</p>
                        <p className="text-[11px] text-slate-600 font-sans">
                          Expected: {formatCurrency(item.expectedAmount)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic font-sans text-xs">No Order in OMS</span>
                    )}
                  </td>

                  {/* Payment Info */}
                  <td className="py-4 px-4">
                    {item.paymentRecord ? (
                      <div className={item.type === 'AMOUNT_MISMATCH' ? 'p-1.5 rounded bg-crimson-50 border border-crimson-200/60' : ''}>
                        <p className="font-bold text-navy-950">{item.paymentRecord.paymentId}</p>
                        <p className={`text-[11px] font-sans ${item.type === 'AMOUNT_MISMATCH' ? 'text-crimson-700 font-bold' : 'text-slate-600'}`}>
                          Captured: {formatCurrency(item.paymentRecord.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-sans">
                          {item.paymentRecord.gateway} • Fee: {formatCurrency(item.paymentRecord.fee)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Txn: {formatDate(item.paymentRecord.paymentDate)}
                        </p>
                        {item.paymentRecord.createdAt && (
                          <p className="text-[9px] text-slate-400 font-sans">
                            DB: {formatDate(item.paymentRecord.createdAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-crimson-600 font-sans text-xs font-bold bg-crimson-50 px-2 py-1 rounded">
                        Missing Gateway Log
                      </span>
                    )}
                  </td>

                  {/* Settlement Info */}
                  <td className="py-4 px-4">
                    {item.settlementRecord ? (
                      <div>
                        <p className="font-bold text-navy-950">{item.settlementRecord.settlementId}</p>
                        <p className="text-[11px] text-slate-600 font-sans">
                          Gross: {formatCurrency(item.settlementRecord.grossAmount)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-sans">
                          {item.settlementRecord.paymentId ? `GW Txn: ${item.settlementRecord.paymentId} • ` : ''}
                          Net: {formatCurrency(item.settlementRecord.netAmount)} • Ref: {item.settlementRecord.bankReference}
                        </p>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Settled: {formatDate(item.settlementRecord.settlementDate)}
                        </p>
                        {item.settlementRecord.createdAt && (
                          <p className="text-[9px] text-slate-400 font-sans">
                            DB: {formatDate(item.settlementRecord.createdAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-amber-600 font-sans text-xs font-bold bg-amber-50 px-2 py-1 rounded">
                        Pending Bank Deposit
                      </span>
                    )}
                  </td>

                  {/* Variance */}
                  <td className="py-4 px-4 text-right">
                    <span className="text-xs font-bold text-crimson-600 bg-crimson-50 px-2 py-1 rounded">
                      {formatCurrency(item.variance)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right font-sans">
                    <Button
                      variant="primary-gold"
                      size="sm"
                      onClick={() => onNavigate('/investigations')}
                    >
                      Investigate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

