import { PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';

interface PaymentSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const paymentOptions: { method: PaymentMethod; label: string; icon: typeof Banknote; color: string }[] = [
  { method: 'cash', label: 'Cash', icon: Banknote, color: 'bg-accent/10 border-accent/30 hover:bg-accent/20 data-[selected=true]:border-accent' },
  { method: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'bg-info/10 border-info/30 hover:bg-info/20 data-[selected=true]:border-info' },
  { method: 'credit', label: 'Credit', icon: CreditCard, color: 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20 data-[selected=true]:border-destructive' },
];

export function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  return (
    <div className="flex gap-2">
      {paymentOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.method}
            type="button"
            onClick={() => onSelect(option.method)}
            data-selected={selected === option.method}
            className={cn(
              "flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
              option.color,
              selected === option.method && "ring-2 ring-offset-2"
            )}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
