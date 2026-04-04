import axios, { AxiosResponse, AxiosError } from 'axios';
import type {
  Customer as BackendCustomer,
  Transaction as BackendTransaction,
  Expense as BackendExpense,
  Tender as BackendTender,
  DailySummary,
  CreateCustomerRequest,
  CreateTransactionRequest,
  CreateExpenseRequest,
  CreateTenderRequest,
  TransactionFilters,
  ExpenseFilters,
  TenderFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
import { Customer, Transaction, Expense, Tender, DailySummary as FrontendDailySummary } from '@/types';

// API Configuration - Use path-based routing on main domain in production
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isProduction ? 'https://flour-power-hub.onrender.com/api/v1' : '/api/v1');


// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ Response Error:', error.response?.status, error.response?.data);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network Error: Please check your internet connection');
    }
    
    return Promise.reject(error);
  }
);

// Utility function to handle API responses
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  const { data } = response;
  
  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data.data as T;
};

// Utility function to handle paginated API responses
const handlePaginatedResponse = <T>(response: AxiosResponse<PaginatedResponse<T>>): T[] => {
  const { data } = response;

  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return (data.data.data as T[]) || [];
};

// Utility function to handle API errors
const handleApiError = (error: unknown): string => {
  const axiosError = error as AxiosError;
  if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
    const apiError = axiosError.response.data as { error?: string };
    return apiError.error || 'An unexpected error occurred';
  }
  
  if (axiosError.message) {
    return axiosError.message;
  }
  
  return 'An unexpected error occurred';
};

// ==================== MAPPERS ====================

const mapBackendCustomer = (c: BackendCustomer): Customer => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  type: c.type as Customer['type'],
  creditBalance: c.credit_balance,
  createdAt: new Date(c.created_at),
});

const mapBackendTransaction = (t: BackendTransaction | null): Transaction | null => {
  // Handle null/undefined input
  if (!t) {
    return null;
  }
  
  // Map any status to frontend format
  const statusMap: Record<string, Transaction['status']> = {
    completed: 'completed',
    paid: 'completed',
    pending: 'pending',
    cancelled: 'cancelled',
  };
  
  // Map backend grain types to frontend grain types
  const grainTypeMap: Record<string, Transaction['grainType']> = {
    'maize': 'maize-1',
    'wheat': 'wheat',
    'sorghum': 'wimbi',
    'millet': 'wimbi',
  };
  
  return {
    id: t.id,
    customerId: t.customer_id,
    customerName: t.customer_name,
    grainType: grainTypeMap[t.grain_type] || t.grain_type || 'maize-1',
    kilos: Number(t.kilos) || 0,
    millingCount: t.milling_count,
    pricePerKilo: Number(t.price_per_kilo) || 0,
    totalPrice: Number(t.total_price) || 0,
    paymentMethod: t.payment_method,
    status: statusMap[t.status] || 'pending',
    notes: t.notes,
    createdAt: new Date(t.created_at),
  };
};

const mapBackendExpense = (e: BackendExpense | null): Expense => {
  // Handle null/undefined input
  if (!e) {
    throw new Error('Cannot map null expense');
  }
  
  return {
    id: e.id,
    amount: Number(e.amount) || 0,
    reason: e.reason,
    category: e.category,
    createdAt: new Date(e.created_at),
  };
};

const mapBackendTender = (t: BackendTender): Tender => ({
  id: t.id,
  customerId: t.customer_id,
  customerName: t.customer_name,
  organization: t.organization,
  grainType: t.grain_type,
  quantity: t.quantity,
  unit: t.unit,
  agreedPrice: t.agreed_price,
  status: t.status,
  notes: t.notes,
  dueDate: t.due_date ? new Date(t.due_date) : undefined,
  createdAt: new Date(t.created_at),
});

const mapBackendDailySummary = (s: DailySummary): FrontendDailySummary => ({
  date: new Date(s.date),
  totalTransactions: s.total_transactions,
  totalKilos: s.total_kilos,
  totalIncome: s.total_income,
  cashIncome: s.cash_income,
  mpesaIncome: s.mpesa_income,
  creditGiven: s.credit_given,
  totalExpenses: s.total_expenses,
  netProfit: s.net_profit,
});

// ==================== CUSTOMER API ====================

export const customerApi = {
  getAll: async (search?: string): Promise<Customer[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get<PaginatedResponse<BackendCustomer>>('/customers', { params });
    return handlePaginatedResponse(response).map(mapBackendCustomer);
  },
  
  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<ApiResponse<BackendCustomer>>(`/customers/${id}`);
    return mapBackendCustomer(handleApiResponse(response));
  },
  
  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<ApiResponse<BackendCustomer>>('/customers', data);
    return mapBackendCustomer(handleApiResponse(response));
  },
  
  update: async (id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> => {
    const response = await apiClient.put<ApiResponse<BackendCustomer>>(`/customers/${id}`, data);
    return mapBackendCustomer(handleApiResponse(response));
  },
  
  updateCredit: async (id: string, amount: number): Promise<Customer> => {
    const response = await apiClient.post<ApiResponse<BackendCustomer>>(`/customers/${id}/credit`, { amount });
    return mapBackendCustomer(handleApiResponse(response));
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/customers/${id}`);
    return handleApiResponse(response);
  },
};

// ==================== TRANSACTION API ====================

export const transactionApi = {
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendTransaction>>('/transactions', { params: filters });
    return handlePaginatedResponse(response).map(mapBackendTransaction);
  },
  
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<ApiResponse<BackendTransaction>>(`/transactions/${id}`);
    return mapBackendTransaction(handleApiResponse(response));
  },
  
  getToday: async (): Promise<Transaction[]> => {
    // Check user role to determine which endpoint to use
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isBoss = user?.role === 'boss';

    if (isBoss) {
      // Boss can access general transactions endpoint with date filters
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get<PaginatedResponse<BackendTransaction>>('/transactions', {
        params: { start_date: today, end_date: today }
      });
      return handlePaginatedResponse(response).map(mapBackendTransaction);
    } else {
      // Attendants can only access /today endpoint
      const response = await apiClient.get<ApiResponse<BackendTransaction[]>>('/transactions/today');
      return handleApiResponse(response).map(mapBackendTransaction);
    }
  },
  
  getRecentPaid: async (since?: string): Promise<Transaction[]> => {
    const params = since ? { since } : {};
    const response = await apiClient.get<PaginatedResponse<BackendTransaction>>('/transactions/paid-recent', { params });
    return handlePaginatedResponse(response).map(mapBackendTransaction);
  },
  
  create: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<BackendTransaction>>('/transactions', data);
    const result = mapBackendTransaction(handleApiResponse(response));
    if (!result) {
      throw new Error('Failed to create transaction: invalid response from server');
    }
    return result;
  },
  
  update: async (id: string, data: Partial<CreateTransactionRequest>): Promise<Transaction> => {
    const response = await apiClient.put<ApiResponse<BackendTransaction>>(`/transactions/${id}`, data);
    const result = mapBackendTransaction(handleApiResponse(response));
    if (!result) {
      throw new Error('Failed to update transaction: invalid response from server');
    }
    return result;
  },
  
  updateStatus: async (id: string, status: string): Promise<Transaction> => {
    const response = await apiClient.patch<ApiResponse<BackendTransaction>>(`/transactions/${id}/status`, { status });
    const result = mapBackendTransaction(handleApiResponse(response));
    if (!result) {
      throw new Error('Failed to update transaction status: invalid response from server');
    }
    return result;
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/transactions/${id}`);
    return handleApiResponse(response);
  },
};

// ==================== EXPENSE API ====================

export const expenseApi = {
  getAll: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendExpense>>('/expenses', { params: filters });
    return handlePaginatedResponse(response).map(mapBackendExpense);
  },
  
  getById: async (id: string): Promise<Expense> => {
    const response = await apiClient.get<ApiResponse<BackendExpense>>(`/expenses/${id}`);
    return mapBackendExpense(handleApiResponse(response));
  },
  
  getToday: async (): Promise<Expense[]> => {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get<PaginatedResponse<BackendExpense>>('/expenses', {
      params: { start_date: today, end_date: today }
    });
    return handlePaginatedResponse(response).map(mapBackendExpense);
  },
  
  create: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await apiClient.post<ApiResponse<BackendExpense>>('/expenses', data);
    return mapBackendExpense(handleApiResponse(response));
  },
  
  update: async (id: string, data: Partial<CreateExpenseRequest>): Promise<Expense> => {
    const response = await apiClient.put<ApiResponse<BackendExpense>>(`/expenses/${id}`, data);
    return mapBackendExpense(handleApiResponse(response));
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/expenses/${id}`);
    return handleApiResponse(response);
  },
};

// ==================== TENDER API ====================

export const tenderApi = {
  getAll: async (filters?: TenderFilters): Promise<Tender[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendTender>>('/tenders', { params: filters });
    return handlePaginatedResponse(response).map(mapBackendTender);
  },
  
  getById: async (id: string): Promise<Tender> => {
    const response = await apiClient.get<ApiResponse<BackendTender>>(`/tenders/${id}`);
    return mapBackendTender(handleApiResponse(response));
  },
  
  create: async (data: CreateTenderRequest): Promise<Tender> => {
    const response = await apiClient.post<ApiResponse<BackendTender>>('/tenders', data);
    return mapBackendTender(handleApiResponse(response));
  },
  
  update: async (id: string, data: Partial<CreateTenderRequest>): Promise<Tender> => {
    const response = await apiClient.put<ApiResponse<BackendTender>>(`/tenders/${id}`, data);
    return mapBackendTender(handleApiResponse(response));
  },
  
  updateStatus: async (id: string, status: string): Promise<Tender> => {
    const response = await apiClient.patch<ApiResponse<BackendTender>>(`/tenders/${id}/status`, { status });
    return mapBackendTender(handleApiResponse(response));
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/tenders/${id}`);
    return handleApiResponse(response);
  },
};

// ==================== REPORT API ====================

export const reportApi = {
  getDailySummary: async (date?: string): Promise<FrontendDailySummary> => {
    const params = date ? { date } : {};
    const response = await apiClient.get<ApiResponse<DailySummary>>('/reports/daily', { params });
    return mapBackendDailySummary(handleApiResponse(response));
  },
  
  getTransactionsReport: async (startDate: string, endDate: string): Promise<Transaction[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendTransaction>>('/reports/transactions', {
      params: { start_date: startDate, end_date: endDate }
    });
    return handlePaginatedResponse(response).map(mapBackendTransaction);
  },
  
  getExpensesReport: async (startDate: string, endDate: string): Promise<Expense[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendExpense>>('/reports/expenses', {
      params: { start_date: startDate, end_date: endDate }
    });
    return handlePaginatedResponse(response).map(mapBackendExpense);
  },
};

// ==================== AUTH API ====================

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: unknown }> => {
    const response = await apiClient.post<ApiResponse<{ token: string; user: unknown }>>('/auth/login', {
      email,
      password,
    });
    return handleApiResponse(response);
  },
  
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },
  
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return handleApiResponse(response);
  },
};

// ==================== M-PESA API ====================

export interface MpesaPayment {
  id: string;
  transaction_id: string;
  phone: string;
  amount: number;
  bill_ref?: string;
  status: 'pending' | 'matched' | 'failed';
  raw_data?: Record<string, unknown>;
  matched_transaction_id?: string;
  matched_at?: string;
  received_at: string;
  created_at: string;
  updated_at: string;
  receipt_number?: string;
  matched_customer?: string;
}

export interface MpesaSummary {
  date: string;
  totalCount: number;
  totalAmount: number;
  matchedCount: number;
  pendingCount: number;
  matchedAmount: number;
  pendingAmount: number;
}

export const mpesaApi = {
  getAll: async (filters?: {
    page?: number;
    limit?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<MpesaPayment[]> => {
    const response = await apiClient.get<PaginatedResponse<MpesaPayment>>('/mpesa-payments', { params: filters });
    return handlePaginatedResponse(response);
  },
  
  getById: async (id: string): Promise<MpesaPayment> => {
    const response = await apiClient.get<ApiResponse<MpesaPayment>>(`/mpesa-payments/${id}`);
    return handleApiResponse(response);
  },
  
  getSummary: async (date?: string): Promise<MpesaSummary> => {
    const params = date ? { date } : {};
    const response = await apiClient.get<ApiResponse<MpesaSummary>>('/mpesa-payments/summary', { params });
    return handleApiResponse(response);
  },
};

// Export utility functions for external use
export { handleApiResponse, handlePaginatedResponse, handleApiError };

export default apiClient;

