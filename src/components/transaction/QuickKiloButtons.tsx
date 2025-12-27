import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickKiloButtonsProps {
  onSelect: (kilos: number) => void;
  currentValue: number;
}

const quickValues = [1, 2, 5, 10, 20, 50];

export function QuickKiloButtons({ onSelect, currentValue }: QuickKiloButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickValues.map((value) => (
        <Button
          key={value}
          type="button"
          variant={currentValue === value ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(value)}
          className={cn(
            "min-w-[48px] font-mono",
            currentValue === value && "ring-2 ring-primary/30"
          )}
        >
          {value}kg
        </Button>
      ))}
    </div>
  );
}
