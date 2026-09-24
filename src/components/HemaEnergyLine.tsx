import React, { useEffect, useState } from 'react';
import { useEnergyLine } from '../context/EnergyLineContext';

export const HemaEnergyLine: React.FC = () => {
  const { status, progress, isPulse } = useEnergyLine();
  const [isRtl, setIsRtl] = useState(true);

  // Check document direction (Arabic RTL vs LTR)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsRtl(document.documentElement.dir === 'rtl');
    }
  }, []);

  // Do not render anything when idle to avoid any DOM presence
  if (status === 'idle') {
    return null;
  }

  const isFading = status === 'fading';
  const isCompleting = status === 'completing';

  // Smooth easing tailored for progress state
  const transitionDuration = isCompleting ? '190ms' : '380ms';
  const transitionTiming = isCompleting
    ? 'cubic-bezier(0.16, 1, 0.3, 1)'
    : 'cubic-bezier(0.12, 0.8, 0.32, 1)';

  return (
    <>
      <style>{`
        @keyframes hema-sweep-rtl {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes hema-sweep-ltr {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes hema-energy-pulse {
          0%, 100% { transform: translate(var(--tw-translate-x, 0), -50%) scale(1); opacity: 0.85; }
          50% { transform: translate(var(--tw-translate-x, 0), -50%) scale(1.15); opacity: 1; }
        }
      `}</style>

      {/* Fixed Root Container — Sits on the absolute top edge, 0 layout footprint */}
      <div
        id="hema-energy-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="HEMA Energy Line"
        className={`fixed top-0 left-0 right-0 w-full h-[2.5px] sm:h-[3px] z-[99999] pointer-events-none select-none transition-opacity duration-260 ease-out ${
          isFading ? 'opacity-0' : 'opacity-100'
        } ${isPulse ? 'brightness-125' : ''}`}
        style={{
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        {/* The Active Advancing Green Energy Line */}
        <div
          className="absolute top-0 bottom-0 overflow-visible"
          style={{
            [isRtl ? 'right' : 'left']: 0,
            width: `${Math.min(100, Math.max(0, progress))}%`,
            transition: `width ${transitionDuration} ${transitionTiming}`,
            background: isRtl
              ? 'linear-gradient(to left, rgba(5, 150, 105, 0.5) 0%, #10B981 35%, #00FF9D 85%, #A7F3D0 100%)'
              : 'linear-gradient(to right, rgba(5, 150, 105, 0.5) 0%, #10B981 35%, #00FF9D 85%, #A7F3D0 100%)',
            boxShadow: '0 1px 6px rgba(0, 255, 157, 0.35), 0 0 2px rgba(0, 255, 157, 0.6)',
          }}
        >
          {/* Internal Energy Sweep / Shimmer */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none opacity-40"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%)',
                animation: isRtl
                  ? 'hema-sweep-rtl 1.5s ease-in-out infinite'
                  : 'hema-sweep-ltr 1.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Advancing Energy Glow Head (Leading Edge) */}
          <div
            className="absolute top-1/2 pointer-events-none flex items-center justify-center"
            style={{
              [isRtl ? 'left' : 'right']: 0,
              transform: `translate(${isRtl ? '-50%' : '50%'}, -50%)`,
              animation:
                status === 'running' && progress >= 85
                  ? 'hema-energy-pulse 1.4s ease-in-out infinite'
                  : undefined,
            }}
            aria-hidden="true"
          >
            {/* Soft Ambient Radial Energy Glow Capsule */}
            <div
              className="absolute w-7 h-2.5 sm:w-9 sm:h-3 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(0, 255, 157, 0.95) 0%, rgba(0, 255, 157, 0.4) 45%, rgba(0, 255, 157, 0) 75%)',
                boxShadow: '0 0 10px 1px rgba(0, 255, 157, 0.55)',
              }}
            />

            {/* Directional Forward Light Fan */}
            <div
              className="absolute w-5 h-2 rounded-full pointer-events-none opacity-75"
              style={{
                transform: isRtl ? 'translateX(-4px)' : 'translateX(4px)',
                background: isRtl
                  ? 'linear-gradient(to left, rgba(0, 255, 157, 0.9), transparent)'
                  : 'linear-gradient(to right, rgba(0, 255, 157, 0.9), transparent)',
              }}
            />

            {/* High-Intensity Center Energy Spark */}
            <div
              className="relative w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white shadow-[0_0_6px_#00FF9D,0_0_12px_rgba(0,255,157,0.85)] z-10"
            />
          </div>
        </div>
      </div>
    </>
  );
};
