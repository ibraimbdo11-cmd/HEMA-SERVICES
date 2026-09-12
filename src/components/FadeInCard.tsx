import React, { useState, useEffect, useRef } from 'react';

interface FadeInCardProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * FadeInCard implements a strict, smooth, one-time OPACITY-ONLY fade in
 * when an element enters the viewport.
 *
 * Rules:
 * - Strictly NO translateY, scale, rotate, bounce, zoom, or parallax.
 * - Triggers ONCE: scrolling away and back does NOT replay the animation.
 * - Respects prefers-reduced-motion: displays immediately if reduced motion is preferred.
 */
export const FadeInCard: React.FC<FadeInCardProps> = ({
  children,
  id,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)
      );
    }
    return false;
  });

  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // Check prefers-reduced-motion dynamically
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) {
            observer.unobserve(domRef.current);
          }
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    const currentEl = domRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
      observer.disconnect();
    };
  }, [isVisible]);

  return (
    <div
      ref={domRef}
      id={id}
      className={`h-full ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: isVisible ? 'opacity 0.5s ease-out' : 'none',
        willChange: isVisible ? 'auto' : 'opacity',
      }}
    >
      {children}
    </div>
  );
};
