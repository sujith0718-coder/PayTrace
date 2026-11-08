import { 
  AuthResponse, 
  ReconciliationRun, 
  DiscrepancyItem, 
  InvestigationCase, 
  ImportBatch,
  AuditLogItem,
  InvestigationStatus,
  ResolutionCategory,
  OrderRecord,
  PaymentTransaction,
  SettlementRecord
} from '../types/api';
import { 
  MOCK_USERS, 
  MOCK_RECONCILIATION_RUN, 
  MOCK_DISCREPANCIES, 
  MOCK_INVESTIGATIONS, 
  MOCK_AUDIT_LOGS 
} from './mockData';

const FORCE_MOCKS_KEY = 'paytrace_force_mocks';

export const isMockModeActive = (): boolean => {
  const override = localStorage.getItem(FORCE_MOCKS_KEY);
  if (override !== null) return override === 'true';
  return import.meta.env.VITE_USE_MOCKS === 'true';
};

export const toggleMockMode = (): boolean => {
  const current = isMockModeActive();
  localStorage.setItem(FORCE_MOCKS_KEY, String(!current));
  window.location.reload();
  return !current;
};

// Intelligently resolve the API base URL across Vercel, Render, and Localhost
const getNormalizedBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://paytrace-lj2l.onrender.com/api';
  }
  return 'http://localhost:10000/api';
};

const API_BASE_URL = getNormalizedBaseUrl();

// Local storage keys for persisting state during demo
const STORAGE_KEYS = {
  TOKEN: 'paytrace_auth_token',
  USER: 'paytrace_auth_user',
  DEMO_INVESTIGATIONS: 'paytrace_demo_investigations',
  DEMO_RUNS: 'paytrace_demo_runs',
  AUDIT: 'paytrace_audit_logs',
};

// Clean up legacy keys that may contain stale mock investigations
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('paytrace_investigations');
    localStorage.removeItem('paytrace_runs');
  } catch {}
}

class ApiClient {
  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  public async checkHealth(): Promise<{ isLive: boolean; dbStatus: string; url: string }> {
    const rootUrl = API_BASE_URL.replace(/\/api$/, '');
    const candidateUrls = [
      `${API_BASE_URL}/health`,
      `${rootUrl}/health`,
      `${API_BASE_URL}/`,
      `${rootUrl}/`
    ];

    for (const u of candidateUrls) {
      try {
        const resp = await fetch(u, { signal: AbortSignal.timeout(4000) });
        if (resp.ok) {
          const data = await resp.json();
          return {
            isLive: true,
            dbStatus: data?.database?.status || 'CONNECTED',
            url: u
          };
        }
      } catch {}
    }

    return {
      isLive: false,
      dbStatus: 'OFFLINE',
      url: API_BASE_URL
    };
  }

  public async getDatabaseSummary(): Promise<any> {
    try {
      const resp = await fetch(`${API_BASE_URL}/database-summary`, {
        headers: this.getAuthHeader()
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch {}
    return null;
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getLocalDemoInvestigations(): InvestigationCase[] {
    const stored = localStorage.getItem(STORAGE_KEYS.DEMO_INVESTIGATIONS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    localStorage.setItem(STORAGE_KEYS.DEMO_INVESTIGATIONS, JSON.stringify(MOCK_INVESTIGATIONS));
    return MOCK_INVESTIGATIONS;
  }

  private saveLocalDemoInvestigations(cases: InvestigationCase[]) {
    localStorage.setItem(STORAGE_KEYS.DEMO_INVESTIGATIONS, JSON.stringify(cases));
  }

  // AUTH
  public async login(email: string, _pass: string): Promise<AuthResponse> {
    if (!isMockModeActive()) {
      try {
        const resp = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: _pass })
        });
        if (resp.ok) {
          const data = await resp.json();
          localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
          return data;
        }
      } catch (err) {
        console.warn('Backend unavailable, falling back to mock authentication:', err);
      }
    }

    await new Promise(r => setTimeout(r, 400));
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
      id: 99,
      email,
      fullName: email.split('@')[0],
      role: email.includes('admin') ? 'ROLE_ADMIN' : 'ROLE_ANALYST',
    };
    const res: AuthResponse = {
      token: `mock-jwt-token-${Date.now()}`,
      user
    };
    localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    return res;
  }

  public async register(fullName: string, email: string, _pass: string): Promise<AuthResponse> {
    if (!isMockModeActive()) {
      try {
        const resp = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password: _pass })
        });
        if (resp.ok) {
          const data = await resp.json();
          localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
          return data;
        }
      } catch (err) {
        console.warn('Backend unavailable, falling back to mock registration:', err);
      }
    }

    await new Promise(r => setTimeout(r, 400));
    const res: AuthResponse = {
      token: `mock-jwt-token-${Date.now()}`,
      user: {
        id: Date.now(),
        email,
        fullName,
        role: 'ROLE_ANALYST'
      }
    };
    localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    return res;
  }

  public logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  public getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // INGESTION & IMPORTS
  private demoParsedBatch: {
    orders: OrderRecord[];
    payments: PaymentTransaction[];
    settlements: SettlementRecord[];
  } | null = null;

  private parseCsvRows(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
    return { headers, rows };
  }

  public async uploadCsvFiles(
    orders: File, 
    payments: File, 
    settlements: File
  ): Promise<ImportBatch> {
    if (!isMockModeActive()) {
      const formData = new FormData();
      formData.append('ordersFile', orders);
      formData.append('paymentsFile', payments);
      formData.append('settlementsFile', settlements);

      const resp = await fetch(`${API_BASE_URL}/imports/upload`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: formData
      });
      if (resp.ok) {
        return await resp.json();
      } else {
        const errText = await resp.text();
        throw new Error(`Upload failed (${resp.status}): ${errText}`);
      }
    }

    // Demo Mode: Process actual CSV contents client-side
    const ordersText = await orders.text();
    const paymentsText = await payments.text();
    const settlementsText = await settlements.text();

    const pOrders = this.parseCsvRows(ordersText);
    const pPayments = this.parseCsvRows(paymentsText);
    const pSettlements = this.parseCsvRows(settlementsText);

    const parsedOrders: OrderRecord[] = [];
    const ordIdIdx = Math.max(0, pOrders.headers.findIndex(h => h.includes('orderid') || h === 'id'));
    const ordAmtIdx = pOrders.headers.findIndex(h => h.includes('amount') || h.includes('value'));
    const ordCustIdx = pOrders.headers.findIndex(h => h.includes('customer'));
    const ordDateIdx = pOrders.headers.findIndex(h => h.includes('date') || h.includes('time'));
    const ordCurrIdx = pOrders.headers.findIndex(h => h.includes('currency'));

    for (const row of pOrders.rows) {
      if (row.length < 2) continue;
      parsedOrders.push({
        orderId: row[ordIdIdx] || `ORD-${parsedOrders.length + 1001}`,
        amount: (ordAmtIdx >= 0 ? row[ordAmtIdx] : row[3] || '0').replace(/[^0-9.]/g, ''),
        customerId: ordCustIdx >= 0 ? row[ordCustIdx] : 'CUST-DEMO',
        orderDate: ordDateIdx >= 0 ? row[ordDateIdx] : new Date().toISOString().slice(0, 10),
        currency: ordCurrIdx >= 0 ? row[ordCurrIdx] : 'INR',
        status: 'COMPLETED'
      });
    }

    const parsedPayments: PaymentTransaction[] = [];
    const payIdIdx = Math.max(0, pPayments.headers.findIndex(h => h.includes('paymentid') || h.includes('txnid') || h === 'id'));
    const payOrdIdx = Math.max(1, pPayments.headers.findIndex(h => h.includes('orderid')));
    const payAmtIdx = pPayments.headers.findIndex(h => h.includes('amount'));
    const payFeeIdx = pPayments.headers.findIndex(h => h.includes('fee'));
    const payGwIdx = pPayments.headers.findIndex(h => h.includes('method') || h.includes('gateway'));

    for (const row of pPayments.rows) {
      if (row.length < 2) continue;
      parsedPayments.push({
        paymentId: row[payIdIdx] || `GW-${parsedPayments.length + 5001}`,
        orderId: row[payOrdIdx] || '',
        amount: (payAmtIdx >= 0 ? row[payAmtIdx] : row[3] || '0').replace(/[^0-9.]/g, ''),
        fee: payFeeIdx >= 0 ? (row[payFeeIdx] || '0').replace(/[^0-9.]/g, '') : '0.00',
        paymentDate: new Date().toISOString().slice(0, 10),
        gateway: payGwIdx >= 0 ? row[payGwIdx] : 'UPI',
        status: 'CAPTURED'
      });
    }

    const parsedSettlements: SettlementRecord[] = [];
    const stlIdIdx = Math.max(0, pSettlements.headers.findIndex(h => h.includes('settlementid') || h === 'id'));
    const stlPayIdx = Math.max(1, pSettlements.headers.findIndex(h => h.includes('paymentid') || h.includes('txnid')));
    const stlGrossIdx = pSettlements.headers.findIndex(h => h.includes('amount') || h.includes('gross'));
    const stlRefIdx = pSettlements.headers.findIndex(h => h.includes('ref'));

    for (const row of pSettlements.rows) {
      if (row.length < 2) continue;
      const gross = (stlGrossIdx >= 0 ? row[stlGrossIdx] : row[3] || '0').replace(/[^0-9.]/g, '');
      parsedSettlements.push({
        settlementId: row[stlIdIdx] || `BANK-${parsedSettlements.length + 9001}`,
        paymentId: row[stlPayIdx] || '',
        grossAmount: gross,
        netAmount: gross,
        fee: '0.00',
        settlementDate: new Date().toISOString().slice(0, 10),
        bankReference: stlRefIdx >= 0 ? row[stlRefIdx] : 'HDFC-REF'
      });
    }

    this.demoParsedBatch = {
      orders: parsedOrders,
      payments: parsedPayments,
      settlements: parsedSettlements
    };

    const batchId = `BATCH-DEMO-${Date.now().toString().slice(-5)}`;
    return {
      batchId,
      uploadedAt: new Date().toISOString(),
      ordersFilename: orders.name,
      paymentsFilename: payments.name,
      settlementsFilename: settlements.name,
      ordersCount: parsedOrders.length,
      paymentsCount: parsedPayments.length,
      settlementsCount: parsedSettlements.length,
      invalidRowsCount: 0,
      warnings: []
    };
  }

  // RECONCILIATION RUNS
  public async triggerReconciliation(batchId: string, tolerance: string = '0.05'): Promise<ReconciliationRun> {
    if (!isMockModeActive()) {
      const resp = await fetch(`${API_BASE_URL}/reconciliation-runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify({ batchId, toleranceAmount: tolerance })
      });
      if (resp.ok) {
        return await resp.json();
      } else {
        const errText = await resp.text();
        throw new Error(`Reconciliation trigger failed (${resp.status}): ${errText}`);
      }
    }

    // Demo Mode: Perform 3-way matching on uploaded CSV records
    const tol = parseFloat(tolerance) || 0.05;
    const orders = this.demoParsedBatch?.orders || [];
    const payments = this.demoParsedBatch?.payments || [];
    const settlements = this.demoParsedBatch?.settlements || [];

    const paymentsByOrder = new Map<string, PaymentTransaction[]>();
    for (const p of payments) {
      if (p.orderId) {
        const list = paymentsByOrder.get(p.orderId) || [];
        list.push(p);
        paymentsByOrder.set(p.orderId, list);
      }
    }

    const settlementsByPayment = new Map<string, SettlementRecord>();
    for (const s of settlements) {
      if (s.paymentId) settlementsByPayment.set(s.paymentId, s);
    }

    const processedPayIds = new Set<string>();
    const processedStlIds = new Set<string>();
    const discrepancies: DiscrepancyItem[] = [];
    let matchedCount = 0;
    let discCounter = 100;

    // Phase 1: OMS Orders
    for (const order of orders) {
      const ordAmt = parseFloat(order.amount) || 0;
      const matchingPayments = paymentsByOrder.get(order.orderId) || [];

      if (matchingPayments.length === 0) {
        discrepancies.push({
          id: `DISC-${++discCounter}`,
          runId: `RUN-DEMO`,
          type: 'MISSING_PAYMENT',
          severity: ordAmt > 100 ? 'HIGH' : 'MEDIUM',
          orderId: order.orderId,
          explanation: 'Order exists in OMS, but no payment gateway transaction was captured.',
          expectedAmount: order.amount,
          actualAmount: '0.00',
          variance: order.amount,
          orderRecord: order,
          createdAt: new Date().toISOString()
        });
        continue;
      }

      if (matchingPayments.length > 1) {
        for (const p of matchingPayments) processedPayIds.add(p.paymentId);
        const totalPaid = matchingPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        discrepancies.push({
          id: `DISC-${++discCounter}`,
          runId: `RUN-DEMO`,
          type: 'DUPLICATE_TRANSACTION',
          severity: 'HIGH',
          orderId: order.orderId,
          explanation: `Multiple payments (${matchingPayments.length}) detected for single order #${order.orderId}`,
          expectedAmount: order.amount,
          actualAmount: totalPaid.toFixed(2),
          variance: Math.abs(ordAmt - totalPaid).toFixed(2),
          orderRecord: order,
          paymentRecord: matchingPayments[0],
          createdAt: new Date().toISOString()
        });
        continue;
      }

      const payment = matchingPayments[0];
      processedPayIds.add(payment.paymentId);
      const settlement = settlementsByPayment.get(payment.paymentId);
      if (settlement) processedStlIds.add(settlement.settlementId);

      const payAmt = parseFloat(payment.amount) || 0;
      const diff = Math.abs(ordAmt - payAmt);

      if (diff > tol) {
        discrepancies.push({
          id: `DISC-${++discCounter}`,
          runId: `RUN-DEMO`,
          type: 'AMOUNT_MISMATCH',
          severity: diff > 100 ? 'HIGH' : 'MEDIUM',
          orderId: order.orderId,
          explanation: `Order amount ($${order.amount}) does not match gateway captured amount ($${payment.amount}).`,
          expectedAmount: order.amount,
          actualAmount: payment.amount,
          variance: diff.toFixed(2),
          orderRecord: order,
          paymentRecord: payment,
          settlementRecord: settlement,
          createdAt: new Date().toISOString()
        });
        continue;
      }

      if (!settlement) {
        discrepancies.push({
          id: `DISC-${++discCounter}`,
          runId: `RUN-DEMO`,
          type: 'MISSING_SETTLEMENT',
          severity: payAmt > 100 ? 'HIGH' : 'MEDIUM',
          orderId: order.orderId,
          explanation: 'Payment captured on gateway, but bank settlement record has not settled.',
          expectedAmount: payment.amount,
          actualAmount: '0.00',
          variance: payment.amount,
          orderRecord: order,
          paymentRecord: payment,
          createdAt: new Date().toISOString()
        });
        continue;
      }

      matchedCount++;
    }

    // Phase 2: Gateway payments without OMS orders
    for (const payment of payments) {
      if (!processedPayIds.has(payment.paymentId)) {
        processedPayIds.add(payment.paymentId);
        const settlement = settlementsByPayment.get(payment.paymentId);
        if (settlement) processedStlIds.add(settlement.settlementId);

        discrepancies.push({
          id: `DISC-${++discCounter}`,
          runId: `RUN-DEMO`,
          type: 'MISSING_ORDER',
          severity: 'HIGH',
          orderId: payment.orderId || payment.paymentId,
          explanation: `Payment captured on gateway (${payment.paymentId}, order #${payment.orderId || 'N/A'}), but no corresponding order was found in OMS.`,
          expectedAmount: '0.00',
          actualAmount: payment.amount,
          variance: payment.amount,
          paymentRecord: payment,
          settlementRecord: settlement,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Phase 3: Bank settlements without gateway payments
    for (const settlement of settlements) {
      if (!processedStlIds.has(settlement.settlementId)) {
        processedStlIds.add(settlement.settlementId);
        discrepancies.push({
          id: `DISC-${++discCounter}`,
          runId: `RUN-DEMO`,
          type: 'UNMATCHED_SETTLEMENT',
          severity: 'HIGH',
          orderId: settlement.settlementId,
          explanation: `Bank settlement deposit recorded (${settlement.settlementId}, ref: ${settlement.bankReference}), but no matching payment gateway transaction was found.`,
          expectedAmount: '0.00',
          actualAmount: settlement.grossAmount,
          variance: settlement.grossAmount,
          settlementRecord: settlement,
          createdAt: new Date().toISOString()
        });
      }
    }

    const totalEvaluated = matchedCount + discrepancies.length;
    const matchPct = totalEvaluated > 0 ? (matchedCount / totalEvaluated) * 100 : 100;
    const totalOrderValue = orders.reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const totalSettledValue = settlements.reduce((acc, s) => acc + (parseFloat(s.grossAmount) || 0), 0);

    const demoRun: ReconciliationRun = {
      runId: `RUN-DEMO-${Date.now().toString().slice(-4)}`,
      batchId,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 2000).toISOString(),
      completedAt: new Date().toISOString(),
      metrics: {
        totalRecords: totalEvaluated,
        matchedRecords: matchedCount,
        discrepanciesCount: discrepancies.length,
        reconciliationPercentage: parseFloat(matchPct.toFixed(1)),
        totalOrderValue: totalOrderValue.toFixed(2),
        totalSettledValue: totalSettledValue.toFixed(2),
        unreconciledVariance: Math.abs(totalOrderValue - totalSettledValue).toFixed(2)
      },
      discrepancies
    };

    localStorage.setItem(STORAGE_KEYS.DEMO_RUNS, JSON.stringify(demoRun));

    // Also generate investigations for demo mode
    const demoCases: InvestigationCase[] = discrepancies.map((d, i) => ({
      id: `INV-${d.id}`,
      caseNumber: `INV-2026-${100 + i}`,
      discrepancyId: d.id,
      runId: demoRun.runId,
      discrepancyType: d.type,
      severity: d.severity,
      status: 'OPEN',
      assignedAnalyst: 'Sujith E',
      assignedAnalystEmail: 'sujith@paytrace.fin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      discrepancy: d,
      notes: []
    }));
    this.saveLocalDemoInvestigations(demoCases);

    return demoRun;
  }

  public async getAllRuns(): Promise<ReconciliationRun[]> {
    if (!isMockModeActive()) {
      const resp = await fetch(`${API_BASE_URL}/reconciliation-runs`, {
        headers: this.getAuthHeader()
      });
      if (resp.ok) {
        return await resp.json();
      }
      throw new Error(`Failed to fetch reconciliation runs: HTTP ${resp.status}`);
    }

    const stored = localStorage.getItem(STORAGE_KEYS.DEMO_RUNS);
    if (stored) {
      try {
        const run = JSON.parse(stored);
        return [run];
      } catch {}
    }
    return [MOCK_RECONCILIATION_RUN];
  }

  public async getReconciliationRun(_runId: string): Promise<ReconciliationRun | null> {
    if (!isMockModeActive()) {
      const resp = await fetch(`${API_BASE_URL}/reconciliation-runs/${_runId}`, {
        headers: this.getAuthHeader()
      });
      if (resp.ok) {
        return await resp.json();
      }
      if (resp.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch reconciliation run ${_runId}: HTTP ${resp.status}`);
    }

    await new Promise(r => setTimeout(r, 300));
    return MOCK_RECONCILIATION_RUN;
  }

  public async getDiscrepancies(_runId: string): Promise<DiscrepancyItem[]> {
    if (!isMockModeActive()) {
      const resp = await fetch(`${API_BASE_URL}/reconciliation-runs/${_runId}/discrepancies`, {
        headers: this.getAuthHeader()
      });
      if (resp.ok) {
        return await resp.json();
      } else {
        throw new Error(`Failed to fetch discrepancies for ${_runId}: HTTP ${resp.status}`);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEYS.DEMO_RUNS);
    if (stored) {
      try {
        const run: ReconciliationRun = JSON.parse(stored);
        if (run.discrepancies) return run.discrepancies;
      } catch {}
    }
    return MOCK_DISCREPANCIES;
  }

  private normalizeInvestigationCase(c: any, index: number = 0): InvestigationCase {
    const id = c.id || `INV-CASE-${index + 1}`;
    const discType = c.discrepancyType || c.discrepancy?.type || 'AMOUNT_MISMATCH';
    const severity = c.severity || c.priority || 'MEDIUM';
    const assignedAnalyst = c.assignedAnalyst || c.assignedTo || 'Sujith E';
    const assignedAnalystEmail = c.assignedAnalystEmail || 'sujith@paytrace.fin';
    const caseNumber = c.caseNumber || (id.startsWith('INV-') ? id : `INV-${id}`);

    const discrepancy: DiscrepancyItem = c.discrepancy || {
      id: c.discrepancyId || `DISC-${id}`,
      runId: c.runId || 'RUN-2026-901',
      type: discType,
      severity: severity,
      orderId: c.orderId || 'ORD-9821',
      explanation: c.explanation || 'Automatic audit variance flagged by Java Reconciliation Engine.',
      expectedAmount: c.expectedAmount || '250.00',
      actualAmount: c.actualAmount || '230.00',
      variance: c.variance || c.varianceAmount || '20.00',
      createdAt: c.createdAt || new Date().toISOString()
    };

    return {
      id,
      caseNumber,
      discrepancyId: c.discrepancyId || discrepancy.id,
      runId: c.runId || discrepancy.runId,
      discrepancyType: discType,
      severity,
      status: c.status || 'OPEN',
      assignedAnalyst,
      assignedAnalystEmail,
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
      resolvedAt: c.resolvedAt,
      resolutionCategory: c.resolutionCategory,
      resolutionNote: c.resolutionNote,
      discrepancy,
      notes: Array.isArray(c.notes) ? c.notes : []
    };
  }

  // INVESTIGATIONS
  public async getInvestigations(): Promise<InvestigationCase[]> {
    if (!isMockModeActive()) {
      const resp = await fetch(`${API_BASE_URL}/investigations`, {
        headers: this.getAuthHeader()
      });
      if (resp.ok) {
        const rawList = await resp.json();
        const list = Array.isArray(rawList) ? rawList.map((c, i) => this.normalizeInvestigationCase(c, i)) : [];
        return list;
      } else {
        throw new Error(`Failed to fetch investigations: HTTP ${resp.status}`);
      }
    }

    await new Promise(r => setTimeout(r, 200));
    return this.getLocalDemoInvestigations().map((c, i) => this.normalizeInvestigationCase(c, i));
  }

  public async updateInvestigationStatus(
    caseId: string, 
    status: InvestigationStatus, 
    resolutionCategory?: ResolutionCategory, 
    resolutionNote?: string
  ): Promise<InvestigationCase> {
    if (!isMockModeActive()) {
      const resp = await fetch(`${API_BASE_URL}/investigations/${caseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify({ 
          status, 
          resolutionCategory, 
          resolutionNote,
          note: resolutionNote 
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return this.normalizeInvestigationCase(data);
      } else {
        const errText = await resp.text();
        throw new Error(`Failed to update investigation case (${resp.status}): ${errText}`);
      }
    }

    await new Promise(r => setTimeout(r, 300));
    const list = this.getLocalDemoInvestigations();
    const idx = list.findIndex(c => c.id === caseId);
    if (idx === -1) throw new Error('Investigation case not found');
    
    const user = this.getCurrentUser();
    const authorName = user?.fullName || 'Analyst';

    const updated: InvestigationCase = {
      ...list[idx],
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'RESOLVED' ? {
        resolvedAt: new Date().toISOString(),
        resolutionCategory,
        resolutionNote
      } : {})
    };

    if (resolutionNote) {
      updated.notes = [
        ...updated.notes,
        {
          id: `NOTE-${Date.now()}`,
          author: authorName,
          authorRole: 'Analyst',
          timestamp: new Date().toISOString(),
          text: resolutionNote
        }
      ];
    }

    list[idx] = updated;
    this.saveLocalDemoInvestigations(list);
    return updated;
  }

  public async addInvestigationNote(caseId: string, text: string): Promise<any> {
    if (!isMockModeActive()) {
      const resp = await fetch(`${API_BASE_URL}/investigations/${caseId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify({ text })
      });
      if (resp.ok) {
        return await resp.json();
      } else {
        const errText = await resp.text();
        throw new Error(`Failed to add note (${resp.status}): ${errText}`);
      }
    }

    await new Promise(r => setTimeout(r, 200));
    const list = this.getLocalDemoInvestigations();
    const idx = list.findIndex(c => c.id === caseId);
    if (idx === -1) throw new Error('Investigation case not found');

    const user = this.getCurrentUser();
    const authorName = user?.fullName || 'Analyst';

    const newNoteObj = {
      id: `NOTE-${Date.now()}`,
      author: authorName,
      authorRole: 'Analyst',
      timestamp: new Date().toISOString(),
      text
    };

    const updated: InvestigationCase = {
      ...list[idx],
      updatedAt: new Date().toISOString(),
      notes: [
        ...list[idx].notes,
        newNoteObj
      ]
    };
    list[idx] = updated;
    this.saveLocalDemoInvestigations(list);
    return newNoteObj;
  }

  // AUDIT LOGS
  public async getAuditLogs(): Promise<AuditLogItem[]> {
    if (!isMockModeActive()) {
      try {
        const resp = await fetch(`${API_BASE_URL}/audit-logs`, {
          headers: this.getAuthHeader()
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (err) {
        console.warn('Backend audit logs fetch unavailable, using mock data:', err);
      }
    }

    await new Promise(r => setTimeout(r, 200));
    return MOCK_AUDIT_LOGS;
  }
}

export const apiClient = new ApiClient();
