import React, { useState, useEffect, useRef } from 'react';

interface FadeInCardProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * FadeInCard implements a strict, smooth, recurring OPACITY-ONLY fade in
 * whenever the element enters the viewport.
 *
 * Rules:
 * - Strictly NO translateY, scale, rotate, bounce, zoom, or parallax.
 * - Re-triggers every time the card enters the viewport.
 * - Resets when exiting viewport, so scrolling back into view replays the fade.
 * - Uses calibrated threshold & rootMargin to eliminate intersection observer jitter.
 * - Respects prefers-reduced-motion: displays immediately with no transition if reduced motion is preferred.
 */
export const FadeInCard: React.FC<FadeInCardProps> = ({
  children,
  id,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionHandler);

    if (mediaQuery.matches || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return () => mediaQuery.removeEventListener('change', motionHandler);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Re-triggers every time card enters / exits viewport
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    const currentEl = domRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      mediaQuery.removeEventListener('change', motionHandler);
      if (currentEl) {
        observer.unobserve(currentEl);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={domRef}
      id={id}
      className={`h-full ${className}`}
      style={{
        opacity: reducedMotion || isVisible ? 1 : 0.05,
        transition: reducedMotion
          ? 'none'
          : isVisible
          ? 'opacity 380ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'opacity 220ms ease-out',
        willChange: reducedMotion ? 'auto' : 'opacity',
      }}
    >
      {children}
    </div>
  );
};
