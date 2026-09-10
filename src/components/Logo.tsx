import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  iconPosition?: 'left' | 'right';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  onClick,
  iconPosition = 'right',
}) => {
  // Programming </> Logo Icon
  const iconNode = (
    <div
      key="logo-icon"
      className="relative w-10 h-10 sm:w-10.5 sm:h-10.5 rounded-xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-emerald-950/40 border border-emerald-500/35 flex items-center justify-center shadow-sm shadow-emerald-950/40 group-hover:border-emerald-400 group-hover:shadow-emerald-500/20 transition-all duration-300 shrink-0"
    >
      <svg
        className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-400 transition-transform duration-300 group-hover:scale-105"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* < code bracket */}
        <polyline points="7 8 3 12 7 16" />
        {/* / code slash */}
        <line x1="14" y1="4" x2="10" y2="20" strokeWidth="2.4" className="text-emerald-300" />
        {/* > code bracket */}
        <polyline points="17 8 21 12 17 16" />
      </svg>
    </div>
  );

  // Wordmark: Two lines, HEMA centered over SERVICES, clean and proportional
  const textNode = (
    <div
      key="logo-text"
      className="h-10 sm:h-10.5 flex flex-col items-center justify-center text-center select-none"
    >
      <span className="font-black text-[15px] sm:text-base tracking-[0.14em] text-slate-100 group-hover:text-white transition-colors leading-none">
        HEMA
      </span>
      <span className="font-bold text-[10px] sm:text-[11px] tracking-[0.22em] text-slate-300 group-hover:text-white transition-colors leading-none mt-1">
        SERVICES
      </span>
    </div>
  );

  return (
    <div
      dir="ltr"
      onClick={onClick}
      id="hema-logo"
      className={`inline-flex items-center gap-3 cursor-pointer select-none group ${className}`}
    >
      {iconPosition === 'left' ? (
        <>
          {iconNode}
          {textNode}
        </>
      ) : (
        <>
          {textNode}
          {iconNode}
        </>
      )}
    </div>
  );
};
