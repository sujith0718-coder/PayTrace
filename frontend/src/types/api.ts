// Core Data Types for PayTrace Financial Operations

export type UserRole = 'ROLE_ANALYST' | 'ROLE_ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Ingested CSV Record Models
export interface OrderRecord {
  orderId: string;
  orderDate: string;
  customerId: string;
  amount: string; // BigDecimal representation as string to avoid float precision loss
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  createdAt?: string;
}

export interface PaymentTransaction {
  paymentId: string;
  orderId: string;
  paymentDate: string;
  amount: string;
  fee: string;
  status: 'CAPTURED' | 'FAILED' | 'REFUNDED';
  gateway: string;
  createdAt?: string;
}

export interface SettlementRecord {
  settlementId: string;
  paymentId: string;
  settlementDate: string;
  grossAmount: string;
  fee: string;
  netAmount: string;
  bankReference: string;
  createdAt?: string;
}

// Ingestion Batch Model
export interface ImportBatch {
  batchId: string;
  uploadedAt: string;
  ordersFilename: string;
  paymentsFilename: string;
  settlementsFilename: string;
  ordersCount: number;
  paymentsCount: number;
  settlementsCount: number;
  invalidRowsCount: number;
  warnings: string[];
}

// Reconciliation Discrepancy Types
export type DiscrepancyType = 
  | 'MATCHED'
  | 'AMOUNT_MISMATCH'
  | 'MISSING_PAYMENT'
  | 'MISSING_ORDER'
  | 'MISSING_SETTLEMENT'
  | 'UNMATCHED_SETTLEMENT'
  | 'DUPLICATE_TRANSACTION'
  | 'INVALID_FORMAT';

export type DiscrepancySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DiscrepancyItem {
  id: string;
  runId: string;
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  orderId: string;
  explanation: string;
  expectedAmount: string;
  actualAmount: string;
  variance: string;
  orderRecord?: OrderRecord;
  paymentRecord?: PaymentTransaction;
  settlementRecord?: SettlementRecord;
  investigationId?: string;
  createdAt: string;
}

// Reconciliation Run Summary
export interface ReconciliationRun {
  runId: string;
  batchId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string;
  metrics: {
    totalRecords: number;
    matchedRecords: number;
    discrepanciesCount: number;
    reconciliationPercentage: number;
    totalOrderValue: string;
    totalSettledValue: string;
    unreconciledVariance: string;
  };
  discrepancies: DiscrepancyItem[];
}

// Investigation Workflow
export type InvestigationStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REOPENED';
export type ResolutionCategory = 
  | 'BANK_FEE_VARIANCE' 
  | 'TIMING_DIFFERENCE' 
  | 'REFUND_TIMING' 
  | 'DATA_CORRECTION' 
  | 'MANUAL_OVERRIDE';

export interface InvestigationNote {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  text: string;
}

export interface InvestigationCase {
  id: string;
  caseNumber: string; // e.g. "INV-2026-102"
  discrepancyId: string;
  runId: string;
  discrepancyType: DiscrepancyType;
  severity: DiscrepancySeverity;
  status: InvestigationStatus;
  assignedAnalyst: string;
  assignedAnalystEmail: string;
  varianceAmount?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionCategory?: ResolutionCategory;
  resolutionNote?: string;
  discrepancy: DiscrepancyItem;
  notes: InvestigationNote[];
}

// Audit Trail Item
export interface AuditLogItem {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  targetType: 'BATCH' | 'RECONCILIATION_RUN' | 'INVESTIGATION' | 'SYSTEM';
  targetId: string;
  details: string;
}

