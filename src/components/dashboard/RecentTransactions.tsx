import { Transaction, GRAIN_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const grainBadgeClass: Record<string, string> = {
  'maize-1': 'grain-badge-maize',
  'maize-2': 'grain-badge-maize',
  'wheat': 'grain-badge-wheat',
  'wimbi': 'grain-badge-wimbi',
};

const paymentBadgeClass: Record<string, string> = {
  cash: 'payment-badge-cash',
  mpesa: 'payment-badge-mpesa',
  credit: 'payment-badge-credit',
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No transactions yet today</p>
        <p className="text-xs mt-1">Tap + to add a new milling job</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.slice(0, 5).map((transaction, index) => (
        <div
          key={transaction.id}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg bg-secondary/50 animate-slide-up",
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("grain-badge", grainBadgeClass[transaction.grainType])}>
                {GRAIN_LABELS[transaction.grainType]}
              </span>
              <span className="text-xs text-muted-foreground">
                {transaction.kilos}kg
              </span>
            </div>
            <p className="text-sm text-foreground truncate">
              {transaction.customerName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-foreground">
              {transaction.totalPrice}
            </p>
            <span className={cn("grain-badge text-[10px]", paymentBadgeClass[transaction.paymentMethod])}>
              {transaction.paymentMethod.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
