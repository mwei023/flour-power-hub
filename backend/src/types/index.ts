// TypeScript interfaces for the backend API

export type GrainType = 'maize-1' | 'maize-2' | 'wheat' | 'wimbi';
export type MillingCount = 1 | 2;
export type PaymentMethod = 'cash' | 'mpesa' | 'credit';
export type CustomerType = 'walk-in' | 'credit' | 'tender';
export type TransactionStatus = 'completed' | 'pending' | 'cancelled';
export type TenderStatus = 'pending' | 'picked-up' | 'milled' | 'delivered' | 'paid';
export type ExpenseCategory = 'food' | 'repairs' | 'electricity' | 'supplies' | 'other';

// Database interfaces
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  type: CustomerType;
  credit_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  customer_id?: string;
  customer_name: string;
  grain_type: GrainType;
  kilos: number;
  milling_count: MillingCount;
  price_per_kilo: number;
  total_price: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  category: ExpenseCategory;
  created_at: Date;
  updated_at: Date;
}

export interface Tender {
  id: string;
  customer_id: string;
  customer_name: string;
  organization: string;
  grain_type: GrainType;
  quantity: number;
  unit: 'kg' | 'bags';
  agreed_price: number;
  status: TenderStatus;
  notes?: string;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DailySummary {
  date: Date;
  total_transactions: number;
  total_kilos: number;
  total_income: number;
  cash_income: number;
  mpesa_income: number;
  credit_given: number;
  total_expenses: number;
  net_profit: number;
}

// API Request interfaces
export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  type: CustomerType;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  type?: CustomerType;
  credit_balance?: number;
}

export interface CreateTransactionRequest {
  customer_id?: string;
  customer_name: string;
  grain_type: GrainType;
  kilos: number;
  milling_count: MillingCount;
  price_per_kilo: number;
  total_price: number;
  payment_method: PaymentMethod;
  status?: TransactionStatus;
  notes?: string;
}

export interface UpdateTransactionRequest {
  customer_id?: string;
  customer_name?: string;
  grain_type?: GrainType;
  kilos?: number;
  milling_count?: MillingCount;
  price_per_kilo?: number;
  total_price?: number;
  payment_method?: PaymentMethod;
  status?: TransactionStatus;
  notes?: string;
}

export interface CreateExpenseRequest {
  amount: number;
  reason: string;
  category: ExpenseCategory;
}

export interface UpdateExpenseRequest {
  amount?: number;
  reason?: string;
  category?: ExpenseCategory;
}

export interface CreateTenderRequest {
  customer_id: string;
  customer_name: string;
  organization: string;
  grain_type: GrainType;
  quantity: number;
  unit: 'kg' | 'bags';
  agreed_price: number;
  status?: TenderStatus;
  notes?: string;
  due_date?: Date;
}

export interface UpdateTenderRequest {
  customer_id?: string;
  customer_name?: string;
  organization?: string;
  grain_type?: GrainType;
  quantity?: number;
  unit?: 'kg' | 'bags';
  agreed_price?: number;
  status?: TenderStatus;
  notes?: string;
  due_date?: Date;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  grain_type?: GrainType;
  payment_method?: PaymentMethod;
  customer_id?: string;
  status?: TransactionStatus;
  search?: string;
}

export interface ExpenseFilters {
  start_date?: string;
  end_date?: string;
  category?: ExpenseCategory;
  min_amount?: number;
  max_amount?: number;
}

export interface TenderFilters {
  status?: TenderStatus;
  organization?: string;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
}

// Query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ExportQuery extends PaginationQuery {
  format?: 'csv' | 'json';
  start_date?: string;
  end_date?: string;
}

// Constants
export const GRAIN_PRICES: Record<GrainType, Record<MillingCount, number>> = {
  'maize-1': { 1: 10, 2: 10 },
  'maize-2': { 1: 5, 2: 5 },
  'wheat': { 1: 5, 2: 10 },
  'wimbi': { 1: 5, 2: 10 },
};

export const GRAIN_LABELS: Record<GrainType, string> = {
  'maize-1': 'Maize No.1',
  'maize-2': 'Maize No.2',
  'wheat': 'Wheat',
  'wimbi': 'Wimbi',
};

export const VALIDATION_RULES = {
  CUSTOMER_NAME_MIN_LENGTH: 2,
  CUSTOMER_NAME_MAX_LENGTH: 255,
  CUSTOMER_PHONE_MAX_LENGTH: 20,
  TRANSACTION_KILOS_MIN: 0.1,
  TRANSACTION_KILOS_MAX: 10000,
  EXPENSE_AMOUNT_MIN: 0.01,
  EXPENSE_AMOUNT_MAX: 1000000,
  TENDER_QUANTITY_MIN: 0.1,
  TENDER_QUANTITY_MAX: 100000,
  NOTES_MAX_LENGTH: 1000,
} as const;
