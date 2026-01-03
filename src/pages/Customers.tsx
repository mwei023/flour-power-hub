import { useState, useEffect } from 'react';
import { Plus, Phone, CreditCard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';
import { customerApi } from '@/lib/api';
import { cn } from '@/lib/utils';


export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast({ title: 'Failed to load customers', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newName.trim()) {
      toast({ title: 'Enter customer name', variant: 'destructive' });
      return;
    }

    try {
      await customerApi.create({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        type: 'credit',
      });
      await fetchCustomers();
      setNewName('');
      setNewPhone('');
      setIsAddOpen(false);
      toast({ title: 'Customer added!' });
    } catch (error) {
      console.error('Failed to add customer:', error);
      toast({ title: 'Failed to add customer', variant: 'destructive' });
    }
  };

  const handlePayment = async (customerId: string) => {
    const amount = Number(paymentAmount[customerId]);
    if (!amount || amount <= 0) {
      toast({ title: 'Enter valid amount', variant: 'destructive' });
      return;
    }

    try {
      await customerApi.updateCredit(customerId, -amount);
      await fetchCustomers();
      setPaymentAmount({ ...paymentAmount, [customerId]: '' });
      toast({ title: `Payment of KSh ${amount} recorded!` });
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    }
  };


  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const creditCustomers = filteredCustomers.filter(c => c.creditBalance > 0);
  const otherCustomers = filteredCustomers.filter(c => c.creditBalance <= 0);

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Customers" 
        subtitle={`${customers.length} total`}
        action={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Customer name"
                    inputSize="lg"
                  />
                </div>
                <div>
                  <Label>Phone (optional)</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0712345678"
                    inputSize="lg"
                  />
                </div>
                <Button onClick={handleAddCustomer} className="w-full" size="lg">
                  Add Customer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
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

        {/* Credit Customers */}
        {creditCustomers.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Outstanding Credit ({creditCustomers.length})
            </h2>
            <div className="space-y-2">
              {creditCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Owes</p>
                      <p className="font-bold font-mono text-lg text-destructive">
                        {formatCurrency(customer.creditBalance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount paid"
                      value={paymentAmount[customer.id] || ''}
                      onChange={(e) => setPaymentAmount({
                        ...paymentAmount,
                        [customer.id]: e.target.value
                      })}
                      className="flex-1"
                    />
                    <Button
                      variant="success"
                      onClick={() => handlePayment(customer.id)}
                    >
                      Record Payment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Customers */}
        {otherCustomers.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              All Customers ({otherCustomers.length})
            </h2>
            <div className="space-y-2">
              {otherCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="bg-card border border-border/50 rounded-xl p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      customer.creditBalance === 0 
                        ? "bg-accent/10 text-accent" 
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {customer.creditBalance === 0 ? 'Cleared' : formatCurrency(customer.creditBalance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No customers found</p>
            <p className="text-sm mt-1">Add a customer to get started</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
