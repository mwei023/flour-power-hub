import { useState, useEffect } from 'react';
import { Smartphone, DollarSign, History, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTransactions, getExpenses, getTodaySummary } from '@/lib/storage';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function Settings() {
  const [weeklyStats, setWeeklyStats] = useState({ income: 0, expenses: 0, profit: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ income: 0, expenses: 0, profit: 0 });

  useEffect(() => {
    const transactions = getTransactions();
    const expenses = getExpenses();

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Weekly calculations
    const weekTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date >= weekStart && date <= weekEnd && t.paymentMethod !== 'credit';
    });
    const weekExpenses = expenses.filter(e => {
      const date = new Date(e.createdAt);
      return date >= weekStart && date <= weekEnd;
    });
    const weekIncome = weekTransactions.reduce((sum, t) => sum + t.totalPrice, 0);
    const weekExpenseTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

    setWeeklyStats({
      income: weekIncome,
      expenses: weekExpenseTotal,
      profit: weekIncome - weekExpenseTotal,
    });

    // Monthly calculations
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date >= monthStart && date <= monthEnd && t.paymentMethod !== 'credit';
    });
    const monthExpenses = expenses.filter(e => {
      const date = new Date(e.createdAt);
      return date >= monthStart && date <= monthEnd;
    });
    const monthIncome = monthTransactions.reduce((sum, t) => sum + t.totalPrice, 0);
    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    setMonthlyStats({
      income: monthIncome,
      expenses: monthExpenseTotal,
      profit: monthIncome - monthExpenseTotal,
    });
  }, []);

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Settings & Reports" />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* M-Pesa Info */}
        <Card className="border-info/30 bg-info/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-info" />
              M-Pesa Till Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-info">9778129</p>
            <p className="text-sm text-muted-foreground mt-1">Share with customers for mobile payments</p>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-5 h-5" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Income</span>
              <span className="font-mono font-semibold text-accent">{formatCurrency(weeklyStats.income)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-mono font-semibold text-destructive">-{formatCurrency(weeklyStats.expenses)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Profit</span>
              <span className={`font-mono font-bold text-lg ${weeklyStats.profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {formatCurrency(weeklyStats.profit)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              This Month ({format(new Date(), 'MMMM')})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Income</span>
              <span className="font-mono font-semibold text-accent">{formatCurrency(monthlyStats.income)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-mono font-semibold text-destructive">-{formatCurrency(monthlyStats.expenses)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Profit</span>
              <span className={`font-mono font-bold text-lg ${monthlyStats.profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {formatCurrency(monthlyStats.profit)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Reference */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Milling Prices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="grain-badge grain-badge-maize">Maize No.1</span>
              <span className="font-mono">KSh 10/kg</span>
            </div>
            <div className="flex justify-between">
              <span className="grain-badge grain-badge-maize">Maize No.2</span>
              <span className="font-mono">KSh 5/kg</span>
            </div>
            <div className="flex justify-between">
              <span className="grain-badge grain-badge-wheat">Wheat</span>
              <span className="font-mono">KSh 5/kg (1x) or 10/kg (2x)</span>
            </div>
            <div className="flex justify-between">
              <span className="grain-badge grain-badge-wimbi">Wimbi</span>
              <span className="font-mono">KSh 5/kg (1x) or 10/kg (2x)</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Data stored locally</p>
            <p className="text-xs text-muted-foreground mt-1">
              All data is saved on this device only. Clearing browser data will erase records.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
