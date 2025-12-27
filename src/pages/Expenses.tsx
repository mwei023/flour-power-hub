import { useState, useEffect } from 'react';
import { Plus, ShoppingBag, Wrench, Zap, Package, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Expense } from '@/types';
import { getExpenses, saveExpense, generateId, getTodayExpenses } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type ExpenseCategory = Expense['category'];

const categories: { id: ExpenseCategory; label: string; icon: typeof ShoppingBag }[] = [
  { id: 'food', label: 'Food', icon: ShoppingBag },
  { id: 'repairs', label: 'Repairs', icon: Wrench },
  { id: 'electricity', label: 'Electricity', icon: Zap },
  { id: 'supplies', label: 'Supplies', icon: Package },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function Expenses() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');

  useEffect(() => {
    setExpenses(getExpenses());
    setTodayExpenses(getTodayExpenses());
  }, []);

  const handleAddExpense = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast({ title: 'Enter valid amount', variant: 'destructive' });
      return;
    }
    if (!reason.trim()) {
      toast({ title: 'Enter reason', variant: 'destructive' });
      return;
    }

    const expense: Expense = {
      id: generateId(),
      amount: numAmount,
      reason: reason.trim(),
      category,
      createdAt: new Date(),
    };

    saveExpense(expense);
    setExpenses(getExpenses());
    setTodayExpenses(getTodayExpenses());
    setAmount('');
    setReason('');
    setCategory('other');
    setIsAddOpen(false);
    toast({ title: 'Expense recorded!' });
  };

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const formatCurrency = (amt: number) => `KSh ${amt.toLocaleString()}`;

  const getCategoryIcon = (cat: ExpenseCategory) => {
    const found = categories.find(c => c.id === cat);
    return found ? found.icon : MoreHorizontal;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Expenses" 
        subtitle="Track cash withdrawals"
        action={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Amount (KSh)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    inputSize="xl"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                            category === cat.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-xs">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What was it for?"
                    inputSize="lg"
                  />
                </div>
                <Button onClick={handleAddExpense} className="w-full" size="lg">
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Today's Total */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Today's Expenses</p>
          <p className="text-3xl font-bold font-mono text-destructive">
            {formatCurrency(todayTotal)}
          </p>
        </div>

        {/* Today's Expenses */}
        {todayExpenses.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Today</h2>
            <div className="space-y-2">
              {todayExpenses.map((expense, index) => {
                const Icon = getCategoryIcon(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-4 animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{expense.reason}</p>
                      <p className="text-xs text-muted-foreground capitalize">{expense.category}</p>
                    </div>
                    <p className="font-bold font-mono text-destructive">
                      -{formatCurrency(expense.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Previous Expenses */}
        {expenses.length > todayExpenses.length && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Previous</h2>
            <div className="space-y-2">
              {expenses
                .filter(e => !todayExpenses.find(te => te.id === e.id))
                .slice(0, 10)
                .map((expense, index) => {
                  const Icon = getCategoryIcon(expense.category);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 bg-card/50 border border-border/30 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/50">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{expense.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="font-mono text-muted-foreground">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {expenses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No expenses recorded</p>
            <p className="text-sm mt-1">Tap + to add an expense</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
