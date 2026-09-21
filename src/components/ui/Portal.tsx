import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

/**
 * Universal Portal component.
 * Safely teleports floating UI, modals, notifications, and tooltips
 * to document.body, escaping parent containers with overflow:hidden or transforms.
 */
export const Portal: React.FC<PortalProps> = ({ children, containerId }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  const targetContainer = containerId
    ? document.getElementById(containerId) || document.body
    : document.body;

  return createPortal(children, targetContainer);
};
