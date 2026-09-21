import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'text-action' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
}

/**
 * Universal HEMA Button Component
 * Standardizes the platform button hierarchy across all pages and modals.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'end',
  fullWidth = false,
  className = '',
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  // Base sizing styles
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-9 px-3.5 text-xs rounded-xl gap-1.5',
    md: 'h-11 sm:h-11.5 px-5 text-xs sm:text-sm rounded-[14px] gap-2',
    lg: 'h-12 sm:h-13 px-6 sm:px-7 text-sm sm:text-base rounded-2xl gap-2.5',
  };

  // Text-action sizing differs (no heavy box padding)
  const textActionSizes: Record<ButtonSize, string> = {
    sm: 'py-1 text-xs gap-1.5',
    md: 'py-1.5 text-xs sm:text-sm gap-2',
    lg: 'py-2 text-sm sm:text-base gap-2.5',
  };

  // Variant styles
  let variantStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles =
        'bg-[#00FF9D] text-slate-950 font-extrabold shadow-[0_0_16px_rgba(0,255,157,0.22)] ' +
        'hover:bg-[#1affaa] hover:shadow-[0_0_24px_rgba(0,255,157,0.35)] active:bg-[#00E58D] ' +
        'active:scale-[0.98] active:translate-y-0.5 border border-emerald-400/40';
      break;

    case 'secondary':
      variantStyles =
        'bg-[#0A0E17]/80 text-slate-200 hover:text-white border border-white/[0.1] ' +
        'hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] active:scale-[0.98] ' +
        'active:translate-y-0.5 shadow-sm font-bold';
      break;

    case 'outline':
      variantStyles =
        'bg-transparent text-slate-300 hover:text-white border border-white/[0.14] ' +
        'hover:border-emerald-400/50 hover:bg-white/[0.03] active:scale-[0.98] font-bold';
      break;

    case 'danger':
      variantStyles =
        'bg-rose-500/15 text-rose-300 hover:text-rose-200 border border-rose-500/30 ' +
        'hover:bg-rose-500/25 hover:border-rose-500/50 active:scale-[0.98] font-bold';
      break;

    case 'text-action':
      variantStyles =
        'bg-transparent text-slate-300 hover:text-white font-bold p-0 border-b border-transparent ' +
        'hover:border-[#00FF9D]/60 active:opacity-85 transition-all';
      break;
  }

  const baseClasses =
    variant === 'text-action'
      ? `inline-flex items-center justify-center font-cairo select-none transition-all duration-200 group cursor-pointer ${textActionSizes[size]}`
      : `inline-flex items-center justify-center font-cairo select-none transition-all duration-200 group cursor-pointer font-bold ${sizeStyles[size]}`;

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = isDisabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseClasses} ${variantStyles} ${widthClass} ${disabledClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'start' && (
            <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
              {icon}
            </span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'end' && (
            <span className="shrink-0 transition-transform duration-200 group-hover:-translate-x-1">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
