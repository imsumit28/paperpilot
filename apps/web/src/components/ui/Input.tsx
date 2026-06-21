import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-full border border-border bg-white px-4 text-sm text-ink',
          'placeholder:text-ink-subtle',
          'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand/20',
          'disabled:opacity-50',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[88px] rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink',
        'placeholder:text-ink-subtle',
        'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand/20',
        className,
      )}
      {...rest}
    />
  );
});

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
}

export function Label({ className, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-sm font-medium text-ink mb-1.5', className)}
      {...rest}
    />
  );
}
