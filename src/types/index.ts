export interface PaymentReceipt {
  id: string;
  supplier: string;
  amount: number;
  paymentMode: 'cash' | 'mpesa' | 'cheque' | 'bank_transfer';
  description?: string;
  timestamp: number;
}

// In types/index.ts
export interface SupplierSummary {
  name: string;
  total: number;
  count: number;
  lastTransaction?: number;
  avgTransaction?: number;
}

export interface PurchaseRecord {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  totalBudget?: number;
  cashReceived: number;
  balanceBF: number;
  stopCarryOver: boolean;
  receipts: PaymentReceipt[];
  
  // Calculated fields
  cashTotal: number;
  mpesaTotal: number;
  chequeTotal: number;
  bankTotal: number;
  totalExpenditure: number;
  cashAvailable: number;
  cashBalance: number;
  totalBudgetUsed?: number;
  budgetRemaining?: number;
  
  // Metadata
  version: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  synced: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  paymentPreferences: string[];
  totalTransactions: number;
  totalAmount: number;
  lastTransaction: number;
}

export interface FilterState {
  mode: 'all' | 'specific' | 'range' | 'month' | 'year';
  sort: 'date_asc' | 'date_desc' | 'amount_asc' | 'amount_desc';
  specificDate: string;
  startDate: string;
  endDate: string;
  month: string; // YYYY-MM
  year: string; // YYYY
  paymentMode?: string;
  supplier?: string;
}

export interface AppState {
  records: PurchaseRecord[];
  suppliers: Supplier[];
  selectedRecords: string[];
  filter: FilterState;
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSync: number | null;
}

export interface CalculationResult {
  cashTotal: number;
  mpesaTotal: number;
  chequeTotal: number;
  bankTotal: number;
  totalExpenditure: number;
  cashAvailable: number;
  cashBalance: number;
  totalBudgetUsed?: number;
  budgetRemaining?: number;
}