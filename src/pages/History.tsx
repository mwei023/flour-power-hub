import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, Eye, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
//import { getTransactions, generateId } from '@/lib/storage';
import { Transaction, GrainType, PaymentMethod, GRAIN_LABELS } from '@/types';
import { toast } from 'sonner';
import { transactionApi } from '@/lib/api';

// Backend transaction interface
interface BackendTransaction {
  id: string;
  customer_name: string;
  grain_type: GrainType;
  amount: number;
  phone?: string;
  status: string;
  created_at: string;
}

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [grainFilter, setGrainFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // New state for polling functionality
  const [isPolling, setIsPolling] = useState(false);
  const [newTransactionCount, setNewTransactionCount] = useState(0);
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

// ✅ Fetch from backend API based on user role
useEffect(() => {
  const fetchTransactions = async () => {
    try {
      // Get user role from token
      const token = localStorage.getItem('auth_token');
      let userRole = 'attendant'; // Default to attendant

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userRole = payload.role || 'attendant';
        } catch (e) {
          console.error('Failed to parse token:', e);
        }
      }

      let transactions;
      if (userRole === 'admin') {
        // Boss can view all transactions
        transactions = await transactionApi.getAll();
      } else {
        // Attendant can only view today's transactions
        transactions = await transactionApi.getToday();
      }

      setTransactions(transactions);
      setFilteredTransactions(transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Don't show error toast for attendants - they expect limited access
      toast.error('Failed to load transactions');
    }
  };

  fetchTransactions();
}, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Grain type filter
    if (grainFilter !== 'all') {
      filtered = filtered.filter(t => t.grainType === grainFilter);
    }

    // Payment method filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(t => t.paymentMethod === paymentFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekStart = new Date(today.getTime() - (today.getDay() - 1) * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      filtered = filtered.filter(t => {
        const tDate = new Date(t.createdAt);
        const tDateOnly = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        
        switch (dateFilter) {
          case 'today':
            return tDateOnly.getTime() === today.getTime();
          case 'yesterday':
            return tDateOnly.getTime() === yesterday.getTime();
          case 'week':
            return tDateOnly >= weekStart;
          case 'month':
            return tDateOnly >= monthStart;
          default:
            return true;
        }
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, grainFilter, paymentFilter, dateFilter]);



  // Polling function to fetch new paid transactions
  const fetchNewPaidTransactions = async () => {
    try {
      // Get user role from token
      const token = localStorage.getItem('auth_token');
      let userRole = 'attendant';

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userRole = payload.role || 'attendant';
        } catch (e) {
          console.error('Failed to parse token:', e);
        }
      }

      // Both boss and attendant poll for recent paid transactions since initial load
      const newTransactions = await transactionApi.getRecentPaid(lastCheckedTime.toISOString());

      if (newTransactions && Array.isArray(newTransactions) && newTransactions.length > 0) {
        const currentTransactionIds = new Set(transactions.map(t => t.id));
        const uniqueNewTransactions = newTransactions.filter(
          tx => !currentTransactionIds.has(tx.id)
        );

        if (uniqueNewTransactions.length > 0) {
          setNewTransactionCount(prev => prev + uniqueNewTransactions.length);
          setTransactions(prev => [...uniqueNewTransactions, ...prev]);
          toast.success(`New paid transaction${uniqueNewTransactions.length > 1 ? 's' : ''} received!`, {
            description: `${uniqueNewTransactions.length} new payment${uniqueNewTransactions.length > 1 ? 's' : ''} detected`,
          });
        }
      }

      setLastCheckedTime(new Date());
    } catch (error) {
      console.error('Error fetching new transactions:', error);
      // Don't show error toast for polling failures to avoid spam
    }
  };

  // Start polling for new transactions
  useEffect(() => {
    setIsPolling(true);
    
    // Fetch immediately on mount
    fetchNewPaidTransactions();
    
    // Set up polling every 30 seconds
    pollingIntervalRef.current = setInterval(fetchNewPaidTransactions, 30000);
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Reset new transaction count when viewing transactions
  const handleViewTransactions = () => {
    setNewTransactionCount(0);
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateOnly.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return 'bg-accent/10 text-accent';
      case 'mpesa': return 'bg-info/10 text-info';
      case 'credit': return 'bg-destructive/10 text-destructive';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Customer', 'Grain Type', 'Kilos', 'Rate', 'Total', 'Payment Method'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.createdAt).toISOString().slice(0, 16).replace('T', ' '),
        `"${t.customerName}"`,
        GRAIN_LABELS[t.grainType],
        t.kilos,
        t.pricePerKilo,
        t.totalPrice,
        t.paymentMethod
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poshomill-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setGrainFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Transaction History"
        action={
          newTransactionCount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 animate-pulse">
                <Bell className="w-3 h-3 mr-1" />
                {newTransactionCount} new
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewTransactions}
                className="text-xs"
              >
                View All
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isPolling && (
                <Badge variant="outline" className="text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Live
                </Badge>
              )}
            </div>
          )
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers..."
              className="pl-10"
              inputSize="lg"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={grainFilter} onValueChange={setGrainFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Grain Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grains</SelectItem>
                <SelectItem value="maize-1">Maize No.1</SelectItem>
                <SelectItem value="maize-2">Maize No.2</SelectItem>
                <SelectItem value="wheat">Wheat</SelectItem>
                <SelectItem value="wimbi">Wimbi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter and Actions */}
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={clearFilters}>
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={exportToCSV}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}</span>
          <span>{formatCurrency(filteredTransactions.reduce((sum, t) => sum + Number(t.totalPrice || 0), 0))}</span>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {filteredTransactions.map((transaction, index) => (
            <Card 
              key={transaction.id} 
              className="cursor-pointer hover:bg-accent/5 transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 20}ms` }}
              onClick={() => setSelectedTransaction(transaction)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full border bg-background text-foreground">
                      {GRAIN_LABELS[transaction.grainType]}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPaymentMethodColor(transaction.paymentMethod)}`}>
                      {transaction.paymentMethod}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{transaction.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(transaction.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatCurrency(transaction.totalPrice)}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.kilos}kg × {transaction.pricePerKilo}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedTransaction.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p className="font-semibold">{new Date(selectedTransaction.createdAt).toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Grain Type</p>
                  <p className="font-semibold">{GRAIN_LABELS[selectedTransaction.grainType]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kilos</p>
                  <p className="font-semibold">{selectedTransaction.kilos} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rate per KG</p>
                  <p className="font-semibold">{formatCurrency(selectedTransaction.pricePerKilo)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${getPaymentMethodColor(selectedTransaction.paymentMethod)}`}>
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {formatCurrency(selectedTransaction.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
