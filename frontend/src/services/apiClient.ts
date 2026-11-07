import { 
  AuthResponse, 
  ReconciliationRun, 
  DiscrepancyItem, 
  InvestigationCase, 
  ImportBatch,
  AuditLogItem,
  InvestigationStatus,
  ResolutionCategory
} from '../types/api';
import { 
  MOCK_USERS, 
  MOCK_RECONCILIATION_RUN, 
  MOCK_DISCREPANCIES, 
  MOCK_INVESTIGATIONS, 
  MOCK_AUDIT_LOGS 
} from './mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Local storage keys for persisting state during demo
const STORAGE_KEYS = {
  TOKEN: 'paytrace_auth_token',
  USER: 'paytrace_auth_user',
  INVESTIGATIONS: 'paytrace_investigations',
  RUNS: 'paytrace_runs',
  AUDIT: 'paytrace_audit_logs',
};

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Load or initialize mock investigations from localStorage
  private getLocalInvestigations(): InvestigationCase[] {
    const stored = localStorage.getItem(STORAGE_KEYS.INVESTIGATIONS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, JSON.stringify(MOCK_INVESTIGATIONS));
    return MOCK_INVESTIGATIONS;
  }

  private saveLocalInvestigations(cases: InvestigationCase[]) {
    localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, JSON.stringify(cases));
  }

  // AUTH
  public async login(email: string, _pass: string): Promise<AuthResponse> {
    if (USE_MOCKS) {
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

    const resp = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: _pass })
    });
    if (!resp.ok) throw new Error('Invalid email or password');
    const data = await resp.json();
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    return data;
  }

  public async register(fullName: string, email: string, _pass: string): Promise<AuthResponse> {
    if (USE_MOCKS) {
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

    const resp = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password: _pass })
    });
    if (!resp.ok) throw new Error('Registration failed');
    return resp.json();
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
  public async uploadCsvFiles(
    orders: File, 
    payments: File, 
    settlements: File
  ): Promise<ImportBatch> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 800));
      return {
        batchId: `BATCH-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`,
        uploadedAt: new Date().toISOString(),
        ordersFilename: orders.name,
        paymentsFilename: payments.name,
        settlementsFilename: settlements.name,
        ordersCount: 1250,
        paymentsCount: 1240,
        settlementsCount: 1220,
        invalidRowsCount: 2,
        warnings: [
          'Row 48 in orders.csv: Currency defaulted to USD',
          'Row 112 in payments.csv: Minor fee rounding applied'
        ]
      };
    }

    const formData = new FormData();
    formData.append('ordersFile', orders);
    formData.append('paymentsFile', payments);
    formData.append('settlementsFile', settlements);

    const resp = await fetch(`${API_BASE_URL}/imports/upload`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: formData
    });
    if (!resp.ok) throw new Error('CSV Upload failed');
    return resp.json();
  }

  // RECONCILIATION RUNS
  public async triggerReconciliation(batchId: string, tolerance: string = '0.05'): Promise<ReconciliationRun> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 1200));
      return {
        ...MOCK_RECONCILIATION_RUN,
        runId: `RUN-${Date.now().toString().slice(-4)}`,
        batchId,
        startedAt: new Date().toISOString(),
        completedAt: new Date(Date.now() + 2000).toISOString()
      };
    }

    const resp = await fetch(`${API_BASE_URL}/reconciliation-runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ batchId, toleranceAmount: tolerance })
    });
    if (!resp.ok) throw new Error('Reconciliation execution failed');
    return resp.json();
  }

  public async getReconciliationRun(_runId: string): Promise<ReconciliationRun> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_RECONCILIATION_RUN;
    }
    const resp = await fetch(`${API_BASE_URL}/reconciliation-runs/${_runId}`, {
      headers: this.getAuthHeader()
    });
    if (!resp.ok) throw new Error('Could not retrieve reconciliation run');
    return resp.json();
  }

  public async getDiscrepancies(_runId: string): Promise<DiscrepancyItem[]> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 200));
      return MOCK_DISCREPANCIES;
    }
    const resp = await fetch(`${API_BASE_URL}/reconciliation-runs/${_runId}/discrepancies`, {
      headers: this.getAuthHeader()
    });
    if (!resp.ok) throw new Error('Could not fetch discrepancies');
    return resp.json();
  }

  // INVESTIGATIONS
  public async getInvestigations(): Promise<InvestigationCase[]> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 200));
      return this.getLocalInvestigations();
    }
    const resp = await fetch(`${API_BASE_URL}/investigations`, {
      headers: this.getAuthHeader()
    });
    if (!resp.ok) throw new Error('Could not fetch investigations');
    return resp.json();
  }

  public async updateInvestigationStatus(
    caseId: string, 
    status: InvestigationStatus, 
    resolutionCategory?: ResolutionCategory, 
    resolutionNote?: string
  ): Promise<InvestigationCase> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 300));
      const list = this.getLocalInvestigations();
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
      this.saveLocalInvestigations(list);
      return updated;
    }

    const resp = await fetch(`${API_BASE_URL}/investigations/${caseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ status, resolutionCategory, note: resolutionNote })
    });
    if (!resp.ok) throw new Error('Failed to update investigation');
    return resp.json();
  }

  public async addInvestigationNote(caseId: string, text: string): Promise<InvestigationCase> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 200));
      const list = this.getLocalInvestigations();
      const idx = list.findIndex(c => c.id === caseId);
      if (idx === -1) throw new Error('Investigation case not found');

      const user = this.getCurrentUser();
      const authorName = user?.fullName || 'Analyst';

      const updated: InvestigationCase = {
        ...list[idx],
        updatedAt: new Date().toISOString(),
        notes: [
          ...list[idx].notes,
          {
            id: `NOTE-${Date.now()}`,
            author: authorName,
            authorRole: 'Analyst',
            timestamp: new Date().toISOString(),
            text
          }
        ]
      };
      list[idx] = updated;
      this.saveLocalInvestigations(list);
      return updated;
    }

    const resp = await fetch(`${API_BASE_URL}/investigations/${caseId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ text })
    });
    if (!resp.ok) throw new Error('Failed to add note');
    return resp.json();
  }

  // AUDIT LOGS
  public async getAuditLogs(): Promise<AuditLogItem[]> {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 200));
      return MOCK_AUDIT_LOGS;
    }
    const resp = await fetch(`${API_BASE_URL}/audit-logs`, {
      headers: this.getAuthHeader()
    });
    if (!resp.ok) throw new Error('Could not fetch audit logs');
    return resp.json();
  }
}

export const apiClient = new ApiClient();

