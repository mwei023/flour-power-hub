// API types matching backend types
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  category: ExpenseCategory;
  created_at: string;
  updated_at: string;
}

export interface Tender {
  id: string;
  customer_id?: string;
  customer_name: string;
  organization: string;
  grain_type: GrainType;
  quantity: number;
  unit: 'kg' | 'bags';
  agreed_price?: number;
  status: TenderStatus;
  notes?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  date: string;
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
  customer_id?: string;
  customer_name: string;
  organization: string;
  grain_type: GrainType;
  quantity: number;
  unit: 'kg' | 'bags';
  agreed_price?: number;
  status?: TenderStatus;
  notes?: string;
  due_date?: string;
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
  due_date?: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type PaginatedResponse<T> = ApiResponse<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}>;

// Query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TransactionFilters extends PaginationQuery {
  start_date?: string;
  end_date?: string;
  grain_type?: GrainType;
  payment_method?: PaymentMethod;
  customer_id?: string;
  status?: TransactionStatus;
}

export interface ExpenseFilters extends PaginationQuery {
  start_date?: string;
  end_date?: string;
  category?: ExpenseCategory;
  min_amount?: number;
  max_amount?: number;
}

export interface TenderFilters extends PaginationQuery {
  status?: TenderStatus;
  organization?: string;
  customer_id?: string;
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
