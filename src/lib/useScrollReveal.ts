import { useEffect } from 'react';

/**
 * Lightweight IntersectionObserver hook for smooth viewport entrance animations.
 * Triggers once per element to prevent any repeated flashing or jitter during normal scrolling.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const elements = document.querySelectorAll('.reveal-on-scroll:not(.reveal-visible)');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    elements.forEach((el) => {
      el.classList.add('reveal-init');
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
