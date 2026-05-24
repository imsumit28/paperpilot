import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, ...rest },
  ref,
) {
  return (
    <div className="relative inline-flex items-center w-full">
      <select
        ref={ref}
        className={cn(
          'h-11 w-full appearance-none rounded-full border border-border bg-white pl-4 pr-10 text-sm text-ink',
          'focus:outline-none focus:border-ink/40 focus:ring-2 focus:ring-brand/20',
          className,
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-ink-muted" />
    </div>
  );
});
