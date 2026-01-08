import { useState, useEffect, useCallback } from 'react';
import { Plus, Building, Calendar, Search, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tender, GrainType, GRAIN_LABELS } from '@/types';
import { tenderApi } from '@/lib/api';


const TENDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-warning/10 text-warning' },
  { value: 'picked-up', label: 'Picked Up', color: 'bg-info/10 text-info' },
  { value: 'milled', label: 'Milled', color: 'bg-accent/10 text-accent' },
  { value: 'delivered', label: 'Delivered', color: 'bg-primary/10 text-primary' },
  { value: 'paid', label: 'Paid', color: 'bg-success/10 text-success' },
] as const;

export default function Tenders() {
  const { toast } = useToast();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newOrganization, setNewOrganization] = useState('');
  const [newGrainType, setNewGrainType] = useState<GrainType | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newUnit, setNewUnit] = useState<'kg' | 'bags'>('kg');
  const [newAgreedPrice, setNewAgreedPrice] = useState<number>(0);
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const fetchTenders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await tenderApi.getAll();
      setTenders(data);
    } catch (error) {
      console.error('Failed to fetch tenders:', error);
      toast({ title: 'Failed to load tenders', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = searchQuery === '' || 
      tender.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.organization.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const handleCreateTender = async () => {
    if (!newCustomerName.trim()) {
      toast({ title: 'Enter customer name', variant: 'destructive' });
      return;
    }
    if (!newOrganization.trim()) {
      toast({ title: 'Enter organization name', variant: 'destructive' });
      return;
    }
    if (!newGrainType) {
      toast({ title: 'Select grain type', variant: 'destructive' });
      return;
    }
    if (newQuantity <= 0) {
      toast({ title: 'Enter valid quantity', variant: 'destructive' });
      return;
    }

    try {
      await tenderApi.create({
        customer_name: newCustomerName.trim(),
        organization: newOrganization.trim(),
        grain_type: newGrainType,
        quantity: newQuantity,
        unit: newUnit,
        agreed_price: newAgreedPrice,
        status: 'pending',
        notes: newNotes.trim() || undefined,
        due_date: newDueDate || undefined,
      });
      
      await fetchTenders();
      
      // Reset form
      setNewCustomerName('');
      setNewOrganization('');
      setNewGrainType(null);
      setNewQuantity(0);
      setNewUnit('kg');
      setNewAgreedPrice(0);
      setNewDueDate('');
      setNewNotes('');
      setIsAddOpen(false);
      
      toast({ title: 'Tender created!' });
    } catch (error) {
      console.error('Failed to create tender:', error);
      toast({ title: 'Failed to create tender', variant: 'destructive' });
    }
  };

  const updateTenderStatus = async (tenderId: string, newStatus: string) => {
    try {
      await tenderApi.updateStatus(tenderId, newStatus);
      await fetchTenders();
      toast({ title: 'Tender status updated!' });
    } catch (error) {
      console.error('Failed to update tender status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };


  const getStatusInfo = (status: string) => {
    return TENDER_STATUSES.find(s => s.value === status) || TENDER_STATUSES[0];
  };

  const getTenderStats = () => {
    const total = tenders.length;
    const pending = tenders.filter(t => t.status === 'pending').length;
    const completed = tenders.filter(t => ['delivered', 'paid'].includes(t.status)).length;
    return { total, pending, completed };
  };

  const stats = getTenderStats();

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Tender Management"
        subtitle={`${stats.total} total, ${stats.pending} pending`}
        action={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Tender</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Contact person name"
                    inputSize="lg"
                  />
                </div>
                
                <div>
                  <Label>Organization</Label>
                  <Input
                    value={newOrganization}
                    onChange={(e) => setNewOrganization(e.target.value)}
                    placeholder="School, Church, etc."
                    inputSize="lg"
                  />
                </div>

                <div>
                  <Label>Grain Type</Label>
                  <Select value={newGrainType || ''} onValueChange={(value) => setNewGrainType(value as GrainType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grain type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maize-1">Maize No.1</SelectItem>
                      <SelectItem value="maize-2">Maize No.2</SelectItem>
                      <SelectItem value="wheat">Wheat</SelectItem>
                      <SelectItem value="wimbi">Wimbi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={newQuantity || ''}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={newUnit} onValueChange={(value: 'kg' | 'bags') => setNewUnit(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">KG</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Agreed Price (optional)</Label>
                  <Input
                    type="number"
                    value={newAgreedPrice || ''}
                    onChange={(e) => setNewAgreedPrice(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Due Date (optional)</Label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateTender} className="w-full" size="lg">
                  Create Tender
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenders..."
              className="pl-10"
              inputSize="lg"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TENDER_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-warning">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold text-accent">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tenders List */}
        <div className="space-y-3">
          {filteredTenders.map((tender, index) => {
            const statusInfo = getStatusInfo(tender.status);
            return (
              <Card 
                key={tender.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold text-sm">{tender.organization}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{tender.customerName}</p>
                      <div className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">
                          {tender.quantity} {tender.unit} {GRAIN_LABELS[tender.grainType]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {tender.dueDate && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(tender.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {tender.notes && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {tender.notes}
                    </p>
                  )}

                  {/* Status Update Buttons */}
                  <div className="flex gap-1 overflow-x-auto">
                    {TENDER_STATUSES.map(status => (
                      <Button
                        key={status.value}
                        variant={tender.status === status.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateTenderStatus(tender.id, status.value)}
                        className="text-xs whitespace-nowrap"
                      >
                        {status.label === 'Milled' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {status.label}
                      </Button>
                    ))}
                  </div>

                  {/* Price Information */}
                  {tender.agreedPrice > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Agreed Price:</span>
                        <span className="font-mono font-semibold">
                          {formatCurrency(tender.agreedPrice)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTenders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tenders found</p>
            <p className="text-sm mt-1">Create your first tender to get started</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
