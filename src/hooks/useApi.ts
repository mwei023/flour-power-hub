import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { handleApiResponse, handlePaginatedResponse } from '../lib/api';
import type {
  Customer,
  Transaction,
  Expense,
  Tender,
  DailySummary,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateTenderRequest,
  UpdateTenderRequest,
  PaginationQuery,
  TransactionFilters,
  ExpenseFilters,
  TenderFilters,
} from '../types/api';

// Query Keys
export const queryKeys = {
  customers: (params?: PaginationQuery) => ['customers', params],
  customer: (id: string) => ['customer', id],
  transactions: (filters?: TransactionFilters) => ['transactions', filters],
  transaction: (id: string) => ['transaction', id],
  expenses: (filters?: ExpenseFilters) => ['expenses', filters],
  expense: (id: string) => ['expense', id],
  tenders: (filters?: TenderFilters) => ['tenders', filters],
  tender: (id: string) => ['tender', id],
  dashboard: ['dashboard'],
  dailySummary: (date: string) => ['daily-summary', date],
};

// Customer Hooks
export const useCustomers = (params?: PaginationQuery) => {
  return useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: async () => {
      const response = await apiClient.get('/customers', { params });
      return handlePaginatedResponse<Customer>(response);
    },
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: async () => {
      const response = await apiClient.get(`/customers/${id}`);
      return handleApiResponse<Customer>(response);
    },
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await apiClient.post('/customers', data);
      return handleApiResponse<Customer>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerRequest }) => {
      const response = await apiClient.put(`/customers/${id}`, data);
      return handleApiResponse<Customer>(response);
    },
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.setQueryData(queryKeys.customer(updatedCustomer.id), updatedCustomer);
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/customers/${id}`);
      return handleApiResponse(response);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.removeQueries({ queryKey: queryKeys.customer(deletedId) });
    },
  });
};

// Transaction Hooks
export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: async () => {
      const response = await apiClient.get('/transactions', { params: filters });
      return handlePaginatedResponse<Transaction>(response);
    },
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: async () => {
      const response = await apiClient.get(`/transactions/${id}`);
      return handleApiResponse<Transaction>(response);
    },
    enabled: !!id,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTransactionRequest) => {
      const response = await apiClient.post('/transactions', data);
      return handleApiResponse<Transaction>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionRequest }) => {
      const response = await apiClient.put(`/transactions/${id}`, data);
      return handleApiResponse<Transaction>(response);
    },
    onSuccess: (updatedTransaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.setQueryData(queryKeys.transaction(updatedTransaction.id), updatedTransaction);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/transactions/${id}`);
      return handleApiResponse(response);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.removeQueries({ queryKey: queryKeys.transaction(deletedId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Expense Hooks
export const useExpenses = (filters?: ExpenseFilters) => {
  return useQuery({
    queryKey: queryKeys.expenses(filters),
    queryFn: async () => {
      const response = await apiClient.get('/expenses', { params: filters });
      return handlePaginatedResponse<Expense>(response);
    },
  });
};

export const useExpense = (id: string) => {
  return useQuery({
    queryKey: queryKeys.expense(id),
    queryFn: async () => {
      const response = await apiClient.get(`/expenses/${id}`);
      return handleApiResponse<Expense>(response);
    },
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      const response = await apiClient.post('/expenses', data);
      return handleApiResponse<Expense>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExpenseRequest }) => {
      const response = await apiClient.put(`/expenses/${id}`, data);
      return handleApiResponse<Expense>(response);
    },
    onSuccess: (updatedExpense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.setQueryData(queryKeys.expense(updatedExpense.id), updatedExpense);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/expenses/${id}`);
      return handleApiResponse(response);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.removeQueries({ queryKey: queryKeys.expense(deletedId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Tender Hooks
export const useTenders = (filters?: TenderFilters) => {
  return useQuery({
    queryKey: queryKeys.tenders(filters),
    queryFn: async () => {
      const response = await apiClient.get('/tenders', { params: filters });
      return handlePaginatedResponse<Tender>(response);
    },
  });
};

export const useTender = (id: string) => {
  return useQuery({
    queryKey: queryKeys.tender(id),
    queryFn: async () => {
      const response = await apiClient.get(`/tenders/${id}`);
      return handleApiResponse<Tender>(response);
    },
    enabled: !!id,
  });
};

export const useCreateTender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTenderRequest) => {
      const response = await apiClient.post('/tenders', data);
      return handleApiResponse<Tender>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTenderRequest }) => {
      const response = await apiClient.put(`/tenders/${id}`, data);
      return handleApiResponse<Tender>(response);
    },
    onSuccess: (updatedTender) => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.setQueryData(queryKeys.tender(updatedTender.id), updatedTender);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteTender = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/tenders/${id}`);
      return handleApiResponse(response);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.removeQueries({ queryKey: queryKeys.tender(deletedId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Dashboard Hooks
export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const response = await apiClient.get('/reports/dashboard');
      return handleApiResponse(response);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useDailySummary = (date: string) => {
  return useQuery({
    queryKey: queryKeys.dailySummary(date),
    queryFn: async () => {
      const response = await apiClient.get(`/reports/daily-summary?date=${date}`);
      return handleApiResponse<DailySummary>(response);
    },
    enabled: !!date,
  });
};

