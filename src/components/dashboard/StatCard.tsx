import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border/50',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-accent/10 border-accent/20',
  warning: 'bg-warning/10 border-warning/20',
  danger: 'bg-destructive/10 border-destructive/20',
};

const valueStyles = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-accent',
  warning: 'text-warning',
  danger: 'text-destructive',
};

export function StatCard({ 
  label, 
  value, 
  icon, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl p-4 border transition-all duration-200 animate-fade-in",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
          <p className={cn("text-2xl font-bold font-mono tracking-tight", valueStyles[variant])}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            variant === 'default' ? 'bg-secondary' : 'bg-background/50'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
