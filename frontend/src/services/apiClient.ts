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

const USE_MOCKS = isMockModeActive();
const API_BASE_URL = getNormalizedBaseUrl();

// Local storage keys for persisting state during demo
const STORAGE_KEYS = {
  TOKEN: 'paytrace_auth_token',
  USER: 'paytrace_auth_user',
  INVESTIGATIONS: 'paytrace_investigations',
  RUNS: 'paytrace_runs',
  AUDIT: 'paytrace_audit_logs',
};

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

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

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
    if (!USE_MOCKS) {
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
    if (!USE_MOCKS) {
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
  public async uploadCsvFiles(
    orders: File, 
    payments: File, 
    settlements: File
  ): Promise<ImportBatch> {
    if (!USE_MOCKS) {
      try {
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
        }
      } catch (err) {
        console.warn('Backend upload unavailable, falling back to mock batch result:', err);
      }
    }

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

  // RECONCILIATION RUNS
  public async triggerReconciliation(batchId: string, tolerance: string = '0.05'): Promise<ReconciliationRun> {
    if (!USE_MOCKS) {
      try {
        const resp = await fetch(`${API_BASE_URL}/reconciliation-runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader()
          },
          body: JSON.stringify({ batchId, toleranceAmount: tolerance })
        });
        if (resp.ok) {
          const run = await resp.json();
          localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(run));
          return run;
        }
      } catch (err) {
        console.warn('Backend reconciliation trigger unavailable, falling back to mock result:', err);
      }
    }

    await new Promise(r => setTimeout(r, 1200));
    return {
      ...MOCK_RECONCILIATION_RUN,
      runId: `RUN-${Date.now().toString().slice(-4)}`,
      batchId,
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 2000).toISOString()
    };
  }

  public async getReconciliationRun(_runId: string): Promise<ReconciliationRun> {
    if (!USE_MOCKS) {
      try {
        const resp = await fetch(`${API_BASE_URL}/reconciliation-runs/${_runId}`, {
          headers: this.getAuthHeader()
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (err) {
        console.warn('Backend run fetch unavailable, using mock data:', err);
      }
    }

    await new Promise(r => setTimeout(r, 300));
    return MOCK_RECONCILIATION_RUN;
  }

  public async getDiscrepancies(_runId: string): Promise<DiscrepancyItem[]> {
    if (!USE_MOCKS) {
      try {
        const resp = await fetch(`${API_BASE_URL}/reconciliation-runs/${_runId}/discrepancies`, {
          headers: this.getAuthHeader()
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (err) {
        console.warn('Backend discrepancies fetch unavailable, using mock data:', err);
      }
    }

    await new Promise(r => setTimeout(r, 200));
    return MOCK_DISCREPANCIES;
  }

  // INVESTIGATIONS
  public async getInvestigations(): Promise<InvestigationCase[]> {
    if (!USE_MOCKS) {
      try {
        const resp = await fetch(`${API_BASE_URL}/investigations`, {
          headers: this.getAuthHeader()
        });
        if (resp.ok) {
          const list = await resp.json();
          if (Array.isArray(list) && list.length > 0) {
            this.saveLocalInvestigations(list);
            return list;
          }
        }
      } catch (err) {
        console.warn('Backend investigations fetch unavailable, using local cache:', err);
      }
    }

    await new Promise(r => setTimeout(r, 200));
    return this.getLocalInvestigations();
  }

  public async updateInvestigationStatus(
    caseId: string, 
    status: InvestigationStatus, 
    resolutionCategory?: ResolutionCategory, 
    resolutionNote?: string
  ): Promise<InvestigationCase> {
    if (!USE_MOCKS) {
      try {
        const resp = await fetch(`${API_BASE_URL}/investigations/${caseId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader()
          },
          body: JSON.stringify({ status, resolutionCategory, note: resolutionNote })
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (err) {
        console.warn('Backend update investigation unavailable, saving locally:', err);
      }
    }

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

  public async addInvestigationNote(caseId: string, text: string): Promise<InvestigationCase> {
    if (!USE_MOCKS) {
      try {
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
        }
      } catch (err) {
        console.warn('Backend add note unavailable, saving locally:', err);
      }
    }

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

  // AUDIT LOGS
  public async getAuditLogs(): Promise<AuditLogItem[]> {
    if (!USE_MOCKS) {
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
