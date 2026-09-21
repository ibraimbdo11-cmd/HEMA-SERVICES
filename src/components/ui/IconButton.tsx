import React from 'react';
import { Loader2 } from 'lucide-react';

export type IconButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  'aria-label': string; // Enforce accessible label
}

/**
 * Universal HEMA Icon Button Component
 * Standardizes circular or rounded-square icon actions (Close, Back, Edit, Delete, Send, etc.)
 */
export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const sizeClasses: Record<IconButtonSize, string> = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl text-sm',
    lg: 'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-base',
  };

  let variantClasses = '';

  switch (variant) {
    case 'default':
      variantClasses =
        'bg-[#0A0E17]/80 hover:bg-[#121927] text-slate-400 hover:text-white ' +
        'border border-white/[0.08] hover:border-emerald-500/40 shadow-sm';
      break;

    case 'primary':
      variantClasses =
        'bg-[#00FF9D] text-slate-950 hover:bg-[#15FFA5] shadow-[0_0_12px_rgba(0,255,157,0.3)] ' +
        'border border-emerald-400/50';
      break;

    case 'danger':
      variantClasses =
        'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 ' +
        'border border-rose-500/25 hover:border-rose-500/40';
      break;

    case 'ghost':
      variantClasses =
        'bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white border border-transparent';
      break;
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        sizeClasses[size]
      } ${variantClasses} ${
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : children}
    </button>
  );
};
