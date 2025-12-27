import { GrainType, GRAIN_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { Wheat } from 'lucide-react';

interface GrainSelectorProps {
  selected: GrainType | null;
  onSelect: (grain: GrainType) => void;
}

const grainOptions: { type: GrainType; description: string; color: string }[] = [
  { type: 'maize-1', description: 'Dehulled + Milled (10/kg)', color: 'bg-maize/20 border-maize/40 hover:bg-maize/30' },
  { type: 'maize-2', description: 'Milled only (5/kg)', color: 'bg-maize/10 border-maize/30 hover:bg-maize/20' },
  { type: 'wheat', description: '5/kg once, 10/kg twice', color: 'bg-wheat/20 border-wheat/40 hover:bg-wheat/30' },
  { type: 'wimbi', description: '5/kg once, 10/kg twice', color: 'bg-wimbi/20 border-wimbi/40 hover:bg-wimbi/30' },
];

export function GrainSelector({ selected, onSelect }: GrainSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {grainOptions.map((grain) => (
        <button
          key={grain.type}
          type="button"
          onClick={() => onSelect(grain.type)}
          className={cn(
            "flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left",
            grain.color,
            selected === grain.type 
              ? "ring-2 ring-primary ring-offset-2 border-primary" 
              : "border-transparent"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wheat className="w-4 h-4" />
            <span className="font-semibold text-foreground">
              {GRAIN_LABELS[grain.type]}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {grain.description}
          </span>
        </button>
      ))}
    </div>
  );
}
