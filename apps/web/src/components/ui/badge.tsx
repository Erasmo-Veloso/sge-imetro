import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

const VARIANTS = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  outline: 'border bg-background text-foreground',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
