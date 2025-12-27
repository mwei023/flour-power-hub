import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Wallet, Scale, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { getTodayTransactions, getTodaySummary, getCreditCustomers } from '@/lib/storage';
import { Transaction, DailySummary, Customer } from '@/types';

export default function Index() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [creditCustomers, setCreditCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setTransactions(getTodayTransactions());
    setSummary(getTodaySummary());
    setCreditCustomers(getCreditCustomers());
  }, []);

  const totalCredit = creditCustomers.reduce((sum, c) => sum + c.creditBalance, 0);

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const currentDate = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-background to-background px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Posho Mill</h1>
              <p className="text-sm text-muted-foreground">{currentDate}</p>
            </div>
            <Link to="/new-transaction">
              <Button size="touch" className="gap-2">
                <Plus className="w-5 h-5" />
                New
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="px-4 -mt-2">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          <StatCard
            label="Today's Income"
            value={formatCurrency(summary?.totalIncome || 0)}
            icon={<Wallet className="w-5 h-5 text-accent" />}
            variant="success"
          />
          <StatCard
            label="Profit"
            value={formatCurrency(summary?.netProfit || 0)}
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            variant="primary"
          />
          <StatCard
            label="Total Kilos"
            value={`${summary?.totalKilos || 0} kg`}
            icon={<Scale className="w-5 h-5 text-foreground" />}
          />
          <StatCard
            label="Transactions"
            value={summary?.totalTransactions || 0}
            icon={<span className="text-lg font-bold">#{summary?.totalTransactions || 0}</span>}
          />
        </div>
      </section>

      {/* Credit Alert */}
      {totalCredit > 0 && (
        <section className="px-4 mt-4">
          <div className="max-w-lg mx-auto">
            <Link to="/customers">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Outstanding Credit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {creditCustomers.length} customer{creditCustomers.length !== 1 ? 's' : ''} owe {formatCurrency(totalCredit)}
                  </p>
                </div>
                <span className="text-lg font-bold font-mono text-destructive">
                  {formatCurrency(totalCredit)}
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Payment Breakdown */}
      <section className="px-4 mt-4">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg bg-accent/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">Cash</p>
              <p className="font-bold font-mono text-accent">{formatCurrency(summary?.cashIncome || 0)}</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-info/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">M-Pesa</p>
              <p className="font-bold font-mono text-info">{formatCurrency(summary?.mpesaIncome || 0)}</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-destructive/10 text-center">
              <p className="text-xs text-muted-foreground mb-1">On Credit</p>
              <p className="font-bold font-mono text-destructive">{formatCurrency(summary?.creditGiven || 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="px-4 mt-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Jobs</h2>
            {transactions.length > 0 && (
              <Link to="/history" className="text-sm text-primary font-medium">
                View All
              </Link>
            )}
          </div>
          <RecentTransactions transactions={transactions} />
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
