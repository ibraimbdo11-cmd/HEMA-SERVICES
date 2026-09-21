import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  iconPosition?: 'left' | 'right';
  variant?: 'full' | 'compact' | 'monogram';
  layout?: 'stacked' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  onClick,
  variant = 'full',
  layout = 'stacked',
  size = 'md',
}) => {
  // Size mapping for the SVG wordmark
  const svgHeightClass = {
    sm: 'h-5',
    md: 'h-6.5 sm:h-7',
    lg: 'h-8 sm:h-9',
  }[size];

  // Monogram for compact/avatar contexts (Custom Geometric 'H' with Neon Signature Detail)
  if (variant === 'monogram') {
    return (
      <div
        dir="ltr"
        onClick={onClick}
        id="hema-monogram"
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl bg-[#0A0E17] border border-white/[0.08] hover:border-emerald-500/40 text-slate-100 hover:text-white transition-all duration-200 select-none group ${
          onClick ? 'cursor-pointer active:scale-95' : ''
        } ${className}`}
        aria-label="HEMA"
      >
        <svg
          viewBox="0 0 34 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 shrink-0"
        >
          <defs>
            <filter id="hema-mono-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00FF9D" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Geometric H */}
          <path
            d="M 3 5 H 8.5 V 13.6 H 20 V 5 H 25.5 V 27 H 20 V 18.4 H 8.5 V 27 H 3 Z"
            fill="currentColor"
            className="transition-colors group-hover:fill-white"
          />
          {/* Signature Neon Accent */}
          <rect
            x="27.5"
            y="21.5"
            width="5"
            height="5.5"
            rx="1"
            fill="#00FF9D"
            filter="url(#hema-mono-glow)"
          />
        </svg>
      </div>
    );
  }

  // Primary HEMA Geometric Wordmark SVG
  const wordmarkSvg = (
    <svg
      viewBox="0 0 128 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${svgHeightClass} w-auto transition-all duration-200 shrink-0`}
      aria-hidden="true"
    >
      <defs>
        <filter id="hema-wordmark-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00FF9D" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* Letter H */}
      <path
        d="M 2 5 H 7.2 V 13.6 H 18.8 V 5 H 24 V 27 H 18.8 V 18.4 H 7.2 V 27 H 2 Z"
        fill="currentColor"
        className="transition-colors group-hover:fill-white"
      />

      {/* Letter E with technical chamfer */}
      <path
        d="M 30 5 H 49 V 9.8 H 35.2 V 13.6 H 45.5 V 18.2 H 35.2 V 22.2 H 49 V 27 H 30 Z"
        fill="currentColor"
        className="transition-colors group-hover:fill-white"
      />

      {/* Letter M with technical apex */}
      <path
        d="M 55 5 H 61 L 69 17.5 L 77 5 H 83 V 27 H 78 V 12.5 L 70.8 23.5 H 67.2 L 60 12.5 V 27 H 55 Z"
        fill="currentColor"
        className="transition-colors group-hover:fill-white"
      />

      {/* Letter A with architectural geometry */}
      <path
        d="M 89 27 L 98 5 H 104 L 113 27 H 107.5 L 105.4 21.6 H 96.6 L 94.5 27 Z M 98 17 H 104 L 101 8.5 Z"
        fill="currentColor"
        className="transition-colors group-hover:fill-white"
      />

      {/* Signature Restrained Neon Green Geometric Accent */}
      <rect
        x="117.5"
        y="21.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        fill="#00FF9D"
        filter="url(#hema-wordmark-glow)"
        className="transition-transform duration-300 group-hover:scale-110 origin-center"
      />
    </svg>
  );

  return (
    <div
      dir="ltr"
      onClick={onClick}
      id="hema-logo"
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`inline-flex items-center select-none text-slate-100 group transition-all duration-200 ${
        onClick ? 'cursor-pointer active:scale-98' : ''
      } ${className}`}
      aria-label="HEMA SERVICES"
    >
      {layout === 'inline' ? (
        <div className="flex items-center gap-2.5">
          {wordmarkSvg}
          <div className="w-px h-3.5 bg-white/[0.12] shrink-0" aria-hidden="true" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.26em] text-slate-400 group-hover:text-slate-200 font-mono transition-colors uppercase leading-none">
            SERVICES
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-center">
          {wordmarkSvg}
          <span className="text-[8.5px] sm:text-[9.5px] font-bold tracking-[0.28em] text-slate-400 group-hover:text-slate-300 font-mono transition-colors uppercase leading-none mt-1 pl-0.5">
            SERVICES
          </span>
        </div>
      )}
    </div>
  );
};
