export type GrainType = 'maize-1' | 'maize-2' | 'wheat' | 'wimbi';
export type MillingCount = 1 | 2;
export type PaymentMethod = 'cash' | 'mpesa' | 'credit';
export type CustomerType = 'walk-in' | 'credit' | 'tender';
export type TransactionStatus = 'completed' | 'pending' | 'cancelled';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  type: CustomerType;
  creditBalance: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  customerId?: string;
  customerName: string;
  grainType: GrainType;
  kilos: number;
  millingCount: MillingCount;
  pricePerKilo: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  category: 'food' | 'repairs' | 'electricity' | 'supplies' | 'other';
  createdAt: Date;
}

export interface Tender {
  id: string;
  customerId: string;
  customerName: string;
  organization: string;
  grainType: GrainType;
  quantity: number;
  unit: 'kg' | 'bags';
  agreedPrice: number;
  status: 'pending' | 'picked-up' | 'milled' | 'delivered' | 'paid';
  notes?: string;
  createdAt: Date;
  dueDate?: Date;
}

export interface DailySummary {
  date: Date;
  totalTransactions: number;
  totalKilos: number;
  totalIncome: number;
  cashIncome: number;
  mpesaIncome: number;
  creditGiven: number;
  totalExpenses: number;
  netProfit: number;
}

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
