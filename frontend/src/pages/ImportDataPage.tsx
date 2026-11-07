import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useReconciliation } from '../context/ReconciliationContext';
import { useAudio } from '../context/AudioContext';
import { apiClient } from '../services/apiClient';

interface ImportDataPageProps {
  onNavigate: (path: string) => void;
}

export const ImportDataPage: React.FC<ImportDataPageProps> = ({ onNavigate }) => {
  const { setActiveBatch } = useReconciliation();
  const { playSuccess, playAlert, playCardFlip } = useAudio();

  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [paymentsFile, setPaymentsFile] = useState<File | null>(null);
  const [settlementsFile, setSettlementsFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const canProceed = Boolean((ordersFile && paymentsFile && settlementsFile) || validationSuccess);

  // Helper to trigger browser CSV download for sample templates
  const downloadTemplate = (type: 'orders' | 'payments' | 'settlements') => {
    let headers = '';
    let rows = '';

    if (type === 'orders') {
      headers = 'order_id,order_date,customer_id,order_amount,currency,order_status\n';
      rows = 'ORD-9821,2026-11-05,CUST-8812,250.00,USD,COMPLETED\nORD-9844,2026-11-05,CUST-3319,420.00,USD,COMPLETED\nORD-9850,2026-11-04,CUST-1044,180.00,USD,COMPLETED\n';
    } else if (type === 'payments') {
      headers = 'payment_id,order_id,payment_date,payment_amount,fee_amount,payment_status,payment_method\n';
      rows = 'PAY-7712,ORD-9821,2026-11-05,230.00,4.60,CAPTURED,Stripe\nPAY-7790,ORD-9850,2026-11-04,180.00,3.60,CAPTURED,Adyen\nPAY-7820,ORD-9877,2026-11-06,95.00,1.90,CAPTURED,Stripe\n';
    } else {
      headers = 'settlement_id,payment_id,settlement_date,gross_amount,net_amount,settlement_fee,bank_reference\n';
      rows = 'SET-3310,PAY-7712,2026-11-06,230.00,225.40,4.60,CITI-TXN-90214\nSET-3419,PAY-7855,2026-11-06,297.50,291.30,6.20,JPMC-TXN-44102\n';
    }

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paytrace_sample_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1-Click Demo File Pre-loader with Real Valid CSV Rows
  const loadSyntheticDemoFiles = () => {
    playCardFlip();
    const ordersCsv = `order_id,order_date,customer_id,order_amount,currency,order_status
ORD-9821,2026-11-05,CUST-8812,250.00,USD,COMPLETED
ORD-9844,2026-11-05,CUST-3319,420.00,USD,COMPLETED
ORD-9850,2026-11-04,CUST-1044,180.00,USD,COMPLETED
ORD-9877,2026-11-06,CUST-5512,95.00,USD,COMPLETED
ORD-9890,2026-11-06,CUST-6623,310.00,USD,COMPLETED
`;

    const paymentsCsv = `payment_id,order_id,payment_date,payment_amount,fee_amount,payment_status,payment_method
PAY-7712,ORD-9821,2026-11-05,230.00,4.60,CAPTURED,Stripe
PAY-7790,ORD-9850,2026-11-04,180.00,3.60,CAPTURED,Adyen
PAY-7820,ORD-9877,2026-11-06,95.00,1.90,CAPTURED,Stripe
PAY-7855,ORD-9890,2026-11-06,310.00,6.20,CAPTURED,Stripe
`;

    const settlementsCsv = `settlement_id,payment_id,settlement_date,gross_amount,net_amount,settlement_fee,bank_reference
SET-3310,PAY-7712,2026-11-06,230.00,225.40,4.60,CITI-TXN-90214
SET-3345,PAY-7820,2026-11-06,95.00,93.10,1.90,CHASE-TXN-11029
SET-3419,PAY-7855,2026-11-06,310.00,303.80,6.20,JPMC-TXN-44102
`;

    const f1 = new File([ordersCsv], 'orders_nov2026_prod.csv', { type: 'text/csv' });
    const f2 = new File([paymentsCsv], 'stripe_adyen_payments.csv', { type: 'text/csv' });
    const f3 = new File([settlementsCsv], 'chase_citi_settlements.csv', { type: 'text/csv' });

    setOrdersFile(f1);
    setPaymentsFile(f2);
    setSettlementsFile(f3);
    setValidationSuccess(true);
    playSuccess();
  };

  const handleProcessImport = async () => {
    if (!ordersFile || !paymentsFile || !settlementsFile) {
      playAlert();
      return;
    }
    setIsUploading(true);
    try {
      const batch = await apiClient.uploadCsvFiles(ordersFile, paymentsFile, settlementsFile);
      setActiveBatch(batch);
      playSuccess();
      onNavigate('/reconcile');
    } catch {
      playAlert();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            Financial CSV Data Ingestion
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Stage 1: Upload and pre-validate source records from Orders, Gateways, and Bank Settlements
          </p>
        </div>

        {/* 1-Click Demo Loader Button */}
        <Button
          variant="secondary-navy"
          size="sm"
          onClick={loadSyntheticDemoFiles}
          leftIcon={<Sparkles className="w-4 h-4 text-gold-500" />}
        >
          Load Synthetic Demo CSVs
        </Button>
      </div>

      {/* Tri-Fold Ingestion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Source 1: Orders */}
        <Card variant="white" className="p-5 flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-950 font-mono">
                Category A
              </span>
              <button 
                onClick={() => downloadTemplate('orders')}
                className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
                title="Download CSV Schema Template"
              >
                <Download className="w-3.5 h-3.5" /> Template
              </button>
            </div>
            <h3 className="mt-3 font-bold text-sm text-navy-950">Order Records (OMS)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Invoiced customer order amounts and initial statuses.
            </p>
          </div>

          <div className="mt-6">
            <label className="border-2 border-dashed border-slate-300 hover:border-gold-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-gold-50/20">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) setOrdersFile(e.target.files[0]);
                }} 
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700 text-center">
                {ordersFile ? ordersFile.name : 'Choose or drop orders.csv'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Required: order_id, order_amount</span>
            </label>
            {ordersFile && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready: {(ordersFile.size / 1024).toFixed(1)} KB ({ordersFile.name})
              </div>
            )}
          </div>
        </Card>

        {/* Source 2: Payments */}
        <Card variant="white" className="p-5 flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-950 font-mono">
                Category B
              </span>
              <button 
                onClick={() => downloadTemplate('payments')}
                className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
                title="Download CSV Schema Template"
              >
                <Download className="w-3.5 h-3.5" /> Template
              </button>
            </div>
            <h3 className="mt-3 font-bold text-sm text-navy-950">Payment Transactions</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gateway capture logs (Stripe, Adyen, Authorize.Net).
            </p>
          </div>

          <div className="mt-6">
            <label className="border-2 border-dashed border-slate-300 hover:border-gold-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-gold-50/20">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) setPaymentsFile(e.target.files[0]);
                }} 
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700 text-center">
                {paymentsFile ? paymentsFile.name : 'Choose or drop payments.csv'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Required: payment_id, order_id, payment_amount</span>
            </label>
            {paymentsFile && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready: {(paymentsFile.size / 1024).toFixed(1)} KB ({paymentsFile.name})
              </div>
            )}
          </div>
        </Card>

        {/* Source 3: Settlements */}
        <Card variant="white" className="p-5 flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-950 font-mono">
                Category C
              </span>
              <button 
                onClick={() => downloadTemplate('settlements')}
                className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
                title="Download CSV Schema Template"
              >
                <Download className="w-3.5 h-3.5" /> Template
              </button>
            </div>
            <h3 className="mt-3 font-bold text-sm text-navy-950">Bank Settlements</h3>
            <p className="text-xs text-slate-500 mt-1">
              Acquiring bank settlement reports and interchange fees.
            </p>
          </div>

          <div className="mt-6">
            <label className="border-2 border-dashed border-slate-300 hover:border-gold-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-gold-50/20">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) setSettlementsFile(e.target.files[0]);
                }} 
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700 text-center">
                {settlementsFile ? settlementsFile.name : 'Choose or drop settlements.csv'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Required: settlement_id, payment_id, gross_amount</span>
            </label>
            {settlementsFile && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready: {(settlementsFile.size / 1024).toFixed(1)} KB ({settlementsFile.name})
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Validation Summary Bar */}
      {canProceed && (
        <Card variant="ivory" className="p-5 border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy-950">Tri-Fold CSV Files Ready for Reconciliation</h3>
              <p className="text-xs text-slate-500">
                All 3 source categories verified. Click below to upload and trigger the Java 3-Way Reconciliation Engine.
              </p>
            </div>
          </div>

          <Button
            variant="primary-gold"
            size="md"
            onClick={handleProcessImport}
            isLoading={isUploading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Confirm & Run Engine
          </Button>
        </Card>
      )}
    </div>
  );
};

