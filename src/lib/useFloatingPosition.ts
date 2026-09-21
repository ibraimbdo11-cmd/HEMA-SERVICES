import { useState, useEffect, useCallback, RefObject } from 'react';

export interface FloatingPositionOptions {
  triggerRef?: RefObject<HTMLElement | null>;
  isOpen: boolean;
  preferredWidth?: number;
  offset?: number;
  safeMargin?: number;
}

export interface FloatingPositionResult {
  coords: {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  };
  isMobile: boolean;
}

/**
 * useFloatingPosition
 * Dynamically computes viewport-safe floating coordinates for popovers/dropdowns.
 * Ensures the floating UI never clips outside screen edges in LTR or RTL,
 * regardless of trigger location or scroll position.
 */
export function useFloatingPosition({
  triggerRef,
  isOpen,
  preferredWidth = 384,
  offset = 8,
  safeMargin = 16,
}: FloatingPositionOptions): FloatingPositionResult {
  const [coords, setCoords] = useState({
    top: 72,
    left: 16,
    width: preferredWidth,
    maxHeight: 520,
  });
  const [isMobile, setIsMobile] = useState(false);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !isOpen) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 640;
    setIsMobile(mobile);

    if (mobile) {
      // Mobile fallback: centered/safe inset sheet
      setCoords({
        top: 68,
        left: safeMargin,
        width: vw - safeMargin * 2,
        maxHeight: Math.floor(vh * 0.82),
      });
      return;
    }

    const actualWidth = Math.min(preferredWidth, vw - safeMargin * 2);

    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const top = rect.bottom + offset;

      // Smart horizontal alignment:
      // If trigger is on the left half (common in RTL for action clusters),
      // align dropdown's left edge to trigger's left edge.
      // If trigger is on the right half, align dropdown's right edge to trigger's right edge.
      let idealLeft: number;
      if (rect.left + rect.width / 2 < vw / 2) {
        idealLeft = rect.left;
      } else {
        idealLeft = rect.right - actualWidth;
      }

      // Clamp within safe viewport margins
      const clampedLeft = Math.max(
        safeMargin,
        Math.min(idealLeft, vw - actualWidth - safeMargin)
      );

      const maxHeight = Math.max(260, Math.min(540, vh - top - safeMargin));

      setCoords({
        top,
        left: clampedLeft,
        width: actualWidth,
        maxHeight,
      });
    } else {
      // Fallback if triggerRef not provided: anchor safely to viewport left in RTL
      setCoords({
        top: 72,
        left: safeMargin,
        width: actualWidth,
        maxHeight: Math.min(520, vh - 90),
      });
    }
  }, [triggerRef, isOpen, preferredWidth, offset, safeMargin]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return { coords, isMobile };
}
