import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, RefreshCw, CheckCircle, XCircle, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mpesaApi, MpesaPayment } from '@/lib/api';
import { toast } from 'sonner';

export default function MpesaPayments() {
  const [payments, setPayments] = useState<MpesaPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<MpesaPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<MpesaPayment | null>(null);
  const [summary, setSummary] = useState<{ totalAmount: number; matchedCount: number; pendingCount: number } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchMpesaData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch payments and summary in parallel
      const [paymentsResult, summaryResult] = await Promise.allSettled([
        mpesaApi.getAll({ 
          start_date: currentDate, 
          end_date: currentDate,
          limit: 100 
        }),
        mpesaApi.getSummary(currentDate)
      ]);

      if (paymentsResult.status === 'fulfilled') {
        setPayments(paymentsResult.value);
        setFilteredPayments(paymentsResult.value);
      } else {
        console.error('Failed to fetch M-Pesa payments:', paymentsResult.reason);
        toast.error('Failed to load M-Pesa payments');
      }

      if (summaryResult.status === 'fulfilled') {
        setSummary({
          totalAmount: summaryResult.value.totalAmount,
          matchedCount: summaryResult.value.matchedCount,
          pendingCount: summaryResult.value.pendingCount
        });
      }
    } catch (error) {
      console.error('Error fetching M-Pesa data:', error);
      toast.error('Failed to load M-Pesa data');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchMpesaData();
  }, [fetchMpesaData]);

  useEffect(() => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        (p.matched_customer && p.matched_customer.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPayments(filtered);
  }, [payments, searchQuery, statusFilter]);

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Nairobi'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Phone', 'Amount', 'Status', 'Customer', 'Receipt'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(p => [
        formatDate(p.received_at),
        p.transaction_id,
        p.phone,
        p.amount,
        p.status,
        `"${p.matched_customer || ''}"`,
        `"${p.receipt_number || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mpesa-payments-${currentDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="M-Pesa Payments"
        action={
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchMpesaData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(summary?.totalAmount || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Matched</p>
              <p className="text-lg font-bold font-mono text-green-600">{summary?.matchedCount || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold font-mono text-yellow-600">{summary?.pendingCount || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction ID, phone..."
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          {filteredPayments.length > 0 && (
            <Button variant="outline" className="w-full gap-2" onClick={exportToCSV}>
              <Download className="w-4 h-4" />
              Export to CSV
            </Button>
          )}
        </div>

        {/* Payments List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading M-Pesa payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No M-Pesa payments found</p>
              <p className="text-sm mt-1">Try a different date or search term</p>
            </div>
          ) : (
            filteredPayments.map((payment, index) => (
              <Card 
                key={payment.id} 
                className="cursor-pointer hover:bg-accent/5 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 20}ms` }}
                onClick={() => setSelectedPayment(payment)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatDate(payment.received_at)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-bold text-lg">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {payment.phone}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {payment.transaction_id}
                      </p>
                    </div>
                    <div className="text-right">
                      {payment.matched_customer && (
                        <p className="text-sm font-medium">{payment.matched_customer}</p>
                      )}
                      {payment.receipt_number && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {payment.receipt_number}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <BottomNav />

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>M-Pesa Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transaction ID</p>
                  <p className="font-mono font-semibold">{selectedPayment.transaction_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-semibold">{selectedPayment.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedPayment.status)}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Received At</p>
                  <p className="font-semibold">{formatDate(selectedPayment.received_at)}</p>
                </div>
                {selectedPayment.matched_at && (
                  <div>
                    <p className="text-muted-foreground">Matched At</p>
                    <p className="font-semibold">{formatDate(selectedPayment.matched_at)}</p>
                  </div>
                )}
                {selectedPayment.matched_customer && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Matched Customer</p>
                    <p className="font-semibold">{selectedPayment.matched_customer}</p>
                  </div>
                )}
                {selectedPayment.receipt_number && (
                  <div>
                    <p className="text-muted-foreground">Receipt Number</p>
                    <p className="font-mono font-semibold">{selectedPayment.receipt_number}</p>
                  </div>
                )}
                {selectedPayment.bill_ref && (
                  <div>
                    <p className="text-muted-foreground">Bill Reference</p>
                    <p className="font-semibold">{selectedPayment.bill_ref}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}