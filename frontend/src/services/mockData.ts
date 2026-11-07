import { 
  OrderRecord, 
  PaymentTransaction, 
  SettlementRecord, 
  ReconciliationRun, 
  DiscrepancyItem, 
  InvestigationCase, 
  AuditLogItem,
  User 
} from '../types/api';

// Demo Users
export const MOCK_USERS: User[] = [
  {
    id: 1,
    email: 'analyst@paytrace.dev',
    fullName: 'Sujith E',
    role: 'ROLE_ANALYST',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
  },
  {
    id: 2,
    email: 'admin@paytrace.dev',
    fullName: 'Thurika G',
    role: 'ROLE_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
  }
];

// Initial Synthetic Discrepancy Set (Representing the 6 Core Demo Scenarios)
export const MOCK_DISCREPANCIES: DiscrepancyItem[] = [
  // Archetype 1: Amount Mismatch (Order $250.00 vs Payment $230.00)
  {
    id: 'DISC-101',
    runId: 'RUN-2026-901',
    type: 'AMOUNT_MISMATCH',
    severity: 'HIGH',
    orderId: 'ORD-9821',
    explanation: 'Order amount ($250.00) does not match captured payment gateway amount ($230.00). Unreconciled shortfall of -$20.00.',
    expectedAmount: '250.00',
    actualAmount: '230.00',
    variance: '-20.00',
    orderRecord: {
      orderId: 'ORD-9821',
      orderDate: '2026-11-05',
      customerId: 'CUST-8812',
      amount: '250.00',
      currency: 'USD',
      status: 'COMPLETED'
    },
    paymentRecord: {
      paymentId: 'PAY-7712',
      orderId: 'ORD-9821',
      paymentDate: '2026-11-05',
      amount: '230.00',
      fee: '4.60',
      status: 'CAPTURED',
      gateway: 'Stripe'
    },
    settlementRecord: {
      settlementId: 'SET-3310',
      paymentId: 'PAY-7712',
      settlementDate: '2026-11-06',
      grossAmount: '230.00',
      fee: '4.60',
      netAmount: '225.40',
      bankReference: 'CITI-TXN-90214'
    },
    investigationId: 'INV-2026-001',
    createdAt: '2026-11-07T08:15:00Z'
  },

  // Archetype 2: Missing Payment (Order exists in OMS, but no payment captured on Gateway)
  {
    id: 'DISC-102',
    runId: 'RUN-2026-901',
    type: 'MISSING_PAYMENT',
    severity: 'HIGH',
    orderId: 'ORD-9844',
    explanation: 'Order is marked as fulfilled in Order Management System, but no corresponding payment transaction exists in Payment Gateway reports.',
    expectedAmount: '420.00',
    actualAmount: '0.00',
    variance: '-420.00',
    orderRecord: {
      orderId: 'ORD-9844',
      orderDate: '2026-11-05',
      customerId: 'CUST-3319',
      amount: '420.00',
      currency: 'USD',
      status: 'COMPLETED'
    },
    investigationId: 'INV-2026-002',
    createdAt: '2026-11-07T08:15:00Z'
  },

  // Archetype 3: Missing Settlement (Payment captured on gateway, but never deposited by Bank)
  {
    id: 'DISC-103',
    runId: 'RUN-2026-901',
    type: 'MISSING_SETTLEMENT',
    severity: 'MEDIUM',
    orderId: 'ORD-9850',
    explanation: 'Payment of $180.00 was captured successfully by Payment Gateway, but bank settlement record has not appeared after standard 48-hour settlement window.',
    expectedAmount: '180.00',
    actualAmount: '0.00',
    variance: '-180.00',
    orderRecord: {
      orderId: 'ORD-9850',
      orderDate: '2026-11-04',
      customerId: 'CUST-1044',
      amount: '180.00',
      currency: 'USD',
      status: 'COMPLETED'
    },
    paymentRecord: {
      paymentId: 'PAY-7790',
      orderId: 'ORD-9850',
      paymentDate: '2026-11-04',
      amount: '180.00',
      fee: '3.60',
      status: 'CAPTURED',
      gateway: 'Adyen'
    },
    investigationId: 'INV-2026-003',
    createdAt: '2026-11-07T08:15:00Z'
  },

  // Archetype 4: Duplicate Transaction (Two payment records referencing identical Order ID)
  {
    id: 'DISC-104',
    runId: 'RUN-2026-901',
    type: 'DUPLICATE_TRANSACTION',
    severity: 'HIGH',
    orderId: 'ORD-9877',
    explanation: 'Potential double-charge detected. Two distinct payment references (PAY-7820 and PAY-7821) exist for the single Order #ORD-9877.',
    expectedAmount: '95.00',
    actualAmount: '190.00',
    variance: '+95.00',
    orderRecord: {
      orderId: 'ORD-9877',
      orderDate: '2026-11-06',
      customerId: 'CUST-5512',
      amount: '95.00',
      currency: 'USD',
      status: 'COMPLETED'
    },
    paymentRecord: {
      paymentId: 'PAY-7820',
      orderId: 'ORD-9877',
      paymentDate: '2026-11-06',
      amount: '95.00',
      fee: '1.90',
      status: 'CAPTURED',
      gateway: 'Stripe'
    },
    investigationId: 'INV-2026-004',
    createdAt: '2026-11-07T08:15:00Z'
  },

  // Archetype 5: Fee Discrepancy / Bank Adjustment
  {
    id: 'DISC-105',
    runId: 'RUN-2026-901',
    type: 'AMOUNT_MISMATCH',
    severity: 'LOW',
    orderId: 'ORD-9892',
    explanation: 'Settlement gross amount reflects an unexpected $12.50 cross-border interchange deduction not accounted for in standard gateway fee schedule.',
    expectedAmount: '310.00',
    actualAmount: '297.50',
    variance: '-12.50',
    orderRecord: {
      orderId: 'ORD-9892',
      orderDate: '2026-11-05',
      customerId: 'CUST-9901',
      amount: '310.00',
      currency: 'USD',
      status: 'COMPLETED'
    },
    paymentRecord: {
      paymentId: 'PAY-7855',
      orderId: 'ORD-9892',
      paymentDate: '2026-11-05',
      amount: '310.00',
      fee: '6.20',
      status: 'CAPTURED',
      gateway: 'Authorize.Net'
    },
    settlementRecord: {
      settlementId: 'SET-3419',
      paymentId: 'PAY-7855',
      settlementDate: '2026-11-06',
      grossAmount: '297.50',
      fee: '6.20',
      netAmount: '291.30',
      bankReference: 'JPMC-TXN-44102'
    },
    investigationId: 'INV-2026-005',
    createdAt: '2026-11-07T08:15:00Z'
  }
];

// Initial Investigation Cases
export const MOCK_INVESTIGATIONS: InvestigationCase[] = [
  {
    id: 'INV-2026-001',
    caseNumber: 'INV-2026-001',
    discrepancyId: 'DISC-101',
    runId: 'RUN-2026-901',
    discrepancyType: 'AMOUNT_MISMATCH',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    assignedAnalyst: 'Sujith E',
    assignedAnalystEmail: 'analyst@paytrace.dev',
    createdAt: '2026-11-07T08:20:00Z',
    updatedAt: '2026-11-07T09:10:00Z',
    discrepancy: MOCK_DISCREPANCIES[0],
    notes: [
      {
        id: 'NOTE-1',
        author: 'Sujith E',
        authorRole: 'Reconciliation Lead',
        timestamp: '2026-11-07T08:30:00Z',
        text: 'Initiated review on $20.00 shortfall. Contacted order fulfillment to inspect if promotional coupon code was applied post-checkout.'
      },
      {
        id: 'NOTE-2',
        author: 'Mithunasri J',
        authorRole: 'Investigation Analyst',
        timestamp: '2026-11-07T09:10:00Z',
        text: 'Gateway raw payload confirms customer was billed $230.00. OMS invoice record #ORD-9821 was not updated with the $20 rebate.'
      }
    ]
  },
  {
    id: 'INV-2026-002',
    caseNumber: 'INV-2026-002',
    discrepancyId: 'DISC-102',
    runId: 'RUN-2026-901',
    discrepancyType: 'MISSING_PAYMENT',
    severity: 'HIGH',
    status: 'OPEN',
    assignedAnalyst: 'Mithunasri J',
    assignedAnalystEmail: 'mithunasri@paytrace.dev',
    createdAt: '2026-11-07T08:20:00Z',
    updatedAt: '2026-11-07T08:20:00Z',
    discrepancy: MOCK_DISCREPANCIES[1],
    notes: [
      {
        id: 'NOTE-3',
        author: 'System Auto-Rule',
        authorRole: 'Discrepancy Engine',
        timestamp: '2026-11-07T08:20:00Z',
        text: 'Case automatically registered from reconciliation run #RUN-2026-901. Unreconciled amount: $420.00.'
      }
    ]
  },
  {
    id: 'INV-2026-003',
    caseNumber: 'INV-2026-003',
    discrepancyId: 'DISC-103',
    runId: 'RUN-2026-901',
    discrepancyType: 'MISSING_SETTLEMENT',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    assignedAnalyst: 'Sujith E',
    assignedAnalystEmail: 'analyst@paytrace.dev',
    createdAt: '2026-11-06T14:00:00Z',
    updatedAt: '2026-11-07T10:05:00Z',
    resolvedAt: '2026-11-07T10:05:00Z',
    resolutionCategory: 'TIMING_DIFFERENCE',
    resolutionNote: 'Bank holiday delayed deposit batch. Verified funds settled into operating account under batch CITI-HOLIDAY-4402 on Nov 7.',
    discrepancy: MOCK_DISCREPANCIES[2],
    notes: [
      {
        id: 'NOTE-4',
        author: 'Sujith E',
        authorRole: 'Reconciliation Lead',
        timestamp: '2026-11-07T10:05:00Z',
        text: 'Confirmed timing difference with corporate banking manager. Deposited Nov 7. Case resolved.'
      }
    ]
  }
];

// Active Reconciliation Run
export const MOCK_RECONCILIATION_RUN: ReconciliationRun = {
  runId: 'RUN-2026-901',
  batchId: 'BATCH-2026-11-001',
  status: 'COMPLETED',
  startedAt: '2026-11-07T08:14:48Z',
  completedAt: '2026-11-07T08:15:00Z',
  metrics: {
    totalRecords: 1250,
    matchedRecords: 1205,
    discrepanciesCount: 45,
    reconciliationPercentage: 96.4,
    totalOrderValue: '184500.00',
    totalSettledValue: '179240.00',
    unreconciledVariance: '5260.00'
  },
  discrepancies: MOCK_DISCREPANCIES
};

// Historical Audit Logs
export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'AUD-901',
    timestamp: '2026-11-07T10:05:00Z',
    userName: 'Sujith E',
    action: 'CASE_RESOLVED',
    targetType: 'INVESTIGATION',
    targetId: 'INV-2026-003',
    details: 'Status transitioned from UNDER_REVIEW to RESOLVED. Category: TIMING_DIFFERENCE.'
  },
  {
    id: 'AUD-902',
    timestamp: '2026-11-07T08:15:00Z',
    userName: 'Thurika G',
    action: 'RECONCILIATION_COMPLETED',
    targetType: 'RECONCILIATION_RUN',
    targetId: 'RUN-2026-901',
    details: 'Processed 1,250 records across 3 sources. 96.4% balanced.'
  },
  {
    id: 'AUD-903',
    timestamp: '2026-11-07T08:10:00Z',
    userName: 'Tharun J',
    action: 'BATCH_IMPORTED',
    targetType: 'BATCH',
    targetId: 'BATCH-2026-11-001',
    details: 'Imported orders.csv (1,250 rows), payments.csv (1,240 rows), settlements.csv (1,220 rows).'
  }
];

