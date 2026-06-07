/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Keeps native textarea value/change semantics while applying tokenized styling.
 */
import React from 'react';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => (
    <textarea
      ref={ref}
      className={className}
      style={{
        width: '100%',
        minHeight: 120,
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(108,71,255,0.22)',
        padding: '12px 14px',
        font: 'inherit',
        color: 'var(--color-text-primary)',
        background: 'var(--color-surface-card)',
        transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
        ...style,
      }}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
