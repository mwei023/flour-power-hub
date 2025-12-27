import { Transaction, Customer, Expense, Tender } from '@/types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'poshomill_transactions',
  CUSTOMERS: 'poshomill_customers',
  EXPENSES: 'poshomill_expenses',
  TENDERS: 'poshomill_tenders',
};

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data, (key, value) => {
      if (key === 'createdAt' || key === 'dueDate') {
        return value ? new Date(value) : null;
      }
      return value;
    });
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Transaction functions
export function getTransactions(): Transaction[] {
  return getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
}

export function saveTransaction(transaction: Transaction): void {
  const transactions = getTransactions();
  transactions.unshift(transaction);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function getTodayTransactions(): Transaction[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getTransactions().filter(t => {
    const tDate = new Date(t.createdAt);
    tDate.setHours(0, 0, 0, 0);
    return tDate.getTime() === today.getTime();
  });
}

// Customer functions
export function getCustomers(): Customer[] {
  return getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers();
  const existingIndex = customers.findIndex(c => c.id === customer.id);
  if (existingIndex >= 0) {
    customers[existingIndex] = customer;
  } else {
    customers.unshift(customer);
  }
  saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
}

export function updateCustomerCredit(customerId: string, amount: number): void {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);
  if (customer) {
    customer.creditBalance += amount;
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  }
}

export function getCreditCustomers(): Customer[] {
  return getCustomers().filter(c => c.creditBalance > 0);
}

// Expense functions
export function getExpenses(): Expense[] {
  return getFromStorage<Expense>(STORAGE_KEYS.EXPENSES);
}

export function saveExpense(expense: Expense): void {
  const expenses = getExpenses();
  expenses.unshift(expense);
  saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
}

export function getTodayExpenses(): Expense[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getExpenses().filter(e => {
    const eDate = new Date(e.createdAt);
    eDate.setHours(0, 0, 0, 0);
    return eDate.getTime() === today.getTime();
  });
}

// Tender functions
export function getTenders(): Tender[] {
  return getFromStorage<Tender>(STORAGE_KEYS.TENDERS);
}

export function saveTender(tender: Tender): void {
  const tenders = getTenders();
  const existingIndex = tenders.findIndex(t => t.id === tender.id);
  if (existingIndex >= 0) {
    tenders[existingIndex] = tender;
  } else {
    tenders.unshift(tender);
  }
  saveToStorage(STORAGE_KEYS.TENDERS, tenders);
}

// Summary functions
export function getTodaySummary() {
  const transactions = getTodayTransactions();
  const expenses = getTodayExpenses();

  const cashIncome = transactions
    .filter(t => t.paymentMethod === 'cash' && t.status === 'completed')
    .reduce((sum, t) => sum + t.totalPrice, 0);

  const mpesaIncome = transactions
    .filter(t => t.paymentMethod === 'mpesa' && t.status === 'completed')
    .reduce((sum, t) => sum + t.totalPrice, 0);

  const creditGiven = transactions
    .filter(t => t.paymentMethod === 'credit')
    .reduce((sum, t) => sum + t.totalPrice, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    date: new Date(),
    totalTransactions: transactions.length,
    totalKilos: transactions.reduce((sum, t) => sum + t.kilos, 0),
    totalIncome: cashIncome + mpesaIncome,
    cashIncome,
    mpesaIncome,
    creditGiven,
    totalExpenses,
    netProfit: cashIncome + mpesaIncome - totalExpenses,
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
