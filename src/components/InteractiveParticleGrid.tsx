import React, { useEffect, useRef, useState } from 'react';

interface InteractiveParticleGridProps {
  className?: string;
}

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  col: number;
  row: number;
  // Brownian drift parameters (multi-frequency slow harmonic wander)
  freqX1: number;
  freqX2: number;
  freqY1: number;
  freqY2: number;
  phaseX1: number;
  phaseX2: number;
  phaseY1: number;
  phaseY2: number;
  ampX1: number;
  ampX2: number;
  ampY1: number;
  ampY2: number;
  // Visual properties
  radius: number;
  baseAlpha: number;
}

export const InteractiveParticleGrid: React.FC<InteractiveParticleGridProps> = ({
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    isActive: false,
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let isVisible = true;

    // Grid data
    let particles: Particle[] = [];
    let cols = 0;
    let rows = 0;

    const initNetwork = () => {
      if (width <= 0 || height <= 0) return;

      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;

      // Clean, sparse intricate spacing
      const spacing = isMobile ? 48 : isTablet ? 54 : 60;

      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;

      const totalGridW = (cols - 1) * spacing;
      const totalGridH = (rows - 1) * spacing;
      const startX = (width - totalGridW) / 2;
      const startY = (height - totalGridH) / 2;

      particles = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Add organic spatial jitter so the mesh feels intricate and natural rather than rigid
          const jitterX = (Math.sin(c * 2.3 + r * 1.7) * 0.35 + Math.cos(r * 3.1) * 0.15) * spacing * 0.45;
          const jitterY = (Math.cos(r * 2.1 + c * 1.9) * 0.35 + Math.sin(c * 2.7) * 0.15) * spacing * 0.45;

          const bx = startX + c * spacing + jitterX;
          const by = startY + r * spacing + jitterY;

          // Multi-frequency Brownian motion parameters (slow, continuous, organic drifting)
          const seed = (c * 37 + r * 43) * 0.1;
          const baseSpeed = isMobile ? 0.00032 : 0.00045;

          particles.push({
            baseX: bx,
            baseY: by,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            col: c,
            row: r,
            // Brownian frequencies
            freqX1: baseSpeed * (0.8 + Math.sin(seed) * 0.3),
            freqX2: baseSpeed * (1.6 + Math.cos(seed * 1.3) * 0.4),
            freqY1: baseSpeed * (0.9 + Math.cos(seed * 1.7) * 0.3),
            freqY2: baseSpeed * (1.7 + Math.sin(seed * 1.9) * 0.4),
            phaseX1: seed * 1.1,
            phaseX2: seed * 2.3,
            phaseY1: seed * 1.7,
            phaseY2: seed * 2.9,
            // Brownian amplitudes (gentle, subtle drift)
            ampX1: isMobile ? 6 : 10,
            ampX2: isMobile ? 3 : 5,
            ampY1: isMobile ? 6 : 10,
            ampY2: isMobile ? 3 : 5,
            // Visual refinement: 20%-30% opacity, subtle, deep neon green (#00CF85)
            radius: isMobile ? 1.7 : 2.2,
            baseAlpha: 0.22 + Math.abs(Math.sin(seed)) * 0.08, // Strict 20%-30% range
          });
        }
      }
    };

    // Repulsion bubble radius
    const getRepulsionRadius = () => {
      const isMobile = width < 640;
      return isMobile ? 115 : 155; // Clear, well-defined bubble
    };

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      // Matte dark black background (#05080A)
      ctx.fillStyle = '#05080A';
      ctx.fillRect(0, 0, width, height);

      const isMobile = width < 640;
      const repulsionRadius = getRepulsionRadius();
      const repulsionRadiusSq = repulsionRadius * repulsionRadius;

      // Smooth pointer tracking interpolation
      if (pointerRef.current.isActive) {
        pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.4;
        pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.4;
      } else {
        pointerRef.current.x = -9999;
        pointerRef.current.y = -9999;
      }

      const ptrX = pointerRef.current.x;
      const ptrY = pointerRef.current.y;
      const ptrActive = pointerRef.current.isActive;

      // Physics: Graceful, smooth return to Brownian drifting pattern
      // Gentle spring (0.052) and smooth damping (0.88) ensure particles return gracefully and slowly
      const kSpring = 0.052;
      const friction = 0.88;

      // 1. UPDATE BROWNIAN DRIFT & REPULSION PHYSICS
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Brownian motion drift calculation (slow random wandering)
        let targetX = p.baseX;
        let targetY = p.baseY;

        if (!reducedMotion) {
          const driftX =
            Math.sin(timestamp * p.freqX1 + p.phaseX1) * p.ampX1 +
            Math.cos(timestamp * p.freqX2 + p.phaseX2) * p.ampX2;
          const driftY =
            Math.cos(timestamp * p.freqY1 + p.phaseY1) * p.ampY1 +
            Math.sin(timestamp * p.freqY2 + p.phaseY2) * p.ampY2;

          targetX += driftX;
          targetY += driftY;
        }

        // Powerful and precise repulsion bubble
        if (ptrActive && !reducedMotion) {
          const dx = p.x - ptrX;
          const dy = p.y - ptrY;
          const distSq = dx * dx + dy * dy;

          if (distSq < repulsionRadiusSq) {
            const dist = Math.sqrt(distSq) || 0.001;
            const nx = dx / dist;
            const ny = dy / dist;

            // Non-linear power curve pushes particles clean out of the bubble
            // with a smooth edge transition
            const penetration = (repulsionRadius - dist) / repulsionRadius;
            const force = Math.pow(penetration, 1.25) * (isMobile ? 16 : 24);

            p.vx += nx * force;
            p.vy += ny * force;
          }
        }

        // Spring force returning gracefully to target Brownian drift position
        const returnForceX = (targetX - p.x) * kSpring;
        const returnForceY = (targetY - p.y) * kSpring;

        p.vx = (p.vx + returnForceX) * friction;
        p.vy = (p.vy + returnForceY) * friction;

        p.x += p.vx;
        p.y += p.vy;
      }

      // 2. RENDER INTRICATE CONNECTING MESH LINES
      // Subtlety & Depth: Low opacity (around 10%-25%), deep neon green (#00CF85)
      const maxConnectDist = isMobile ? 74 : 88;
      const maxConnectDistSq = maxConnectDist * maxConnectDist;

      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const p1 = particles[idx];
          if (!p1) continue;

          // Connect to Right neighbor (c + 1)
          if (c + 1 < cols) {
            const p2 = particles[idx + 1];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dSq = dx * dx + dy * dy;

            if (dSq < maxConnectDistSq) {
              const d = Math.sqrt(dSq);
              const alpha = (1 - d / maxConnectDist) * 0.22;
              if (alpha > 0.02) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
              }
            }
          }

          // Connect to Down neighbor (r + 1)
          if (r + 1 < rows) {
            const p2 = particles[idx + cols];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dSq = dx * dx + dy * dy;

            if (dSq < maxConnectDistSq) {
              const d = Math.sqrt(dSq);
              const alpha = (1 - d / maxConnectDist) * 0.22;
              if (alpha > 0.02) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
              }
            }
          }

          // Diagonal neighbor (c + 1, r + 1) for intricate mesh density
          if (c + 1 < cols && r + 1 < rows) {
            const p2 = particles[idx + cols + 1];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dSq = dx * dx + dy * dy;

            if (dSq < maxConnectDistSq) {
              const d = Math.sqrt(dSq);
              const alpha = (1 - d / maxConnectDist) * 0.14;
              if (alpha > 0.02) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
              }
            }
          }
        }
      }

      // Translucent deep neon green lines (#00CF85 -> rgb(0, 207, 133))
      ctx.strokeStyle = 'rgba(0, 207, 133, 0.18)';
      ctx.lineWidth = isMobile ? 0.65 : 0.8;
      ctx.stroke();

      // 3. RENDER LUMINOUS DEEP NEON GREEN PARTICLES (#00CF85)
      // Aesthetic: Subtlety, depth, low opacity (20%-30%), barely visible, highly integrated
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Soft, deep neon green glow emission (very subtle blur, no blinding glare)
        ctx.shadowColor = 'rgba(0, 207, 133, 0.35)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(0, 207, 133, ${p.baseAlpha})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Delicate, soft inner core
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(167, 243, 208, ${p.baseAlpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    };

    const renderLoop = (t: number) => {
      draw(t);
      if (isVisible) {
        animId = requestAnimationFrame(renderLoop);
      }
    };

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initNetwork();
    };

    // Pointer Tracking
    const updatePointerPos = (clientX: number, clientY: number) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x >= -50 && x <= rect.width + 50 && y >= -50 && y <= rect.height + 50) {
        pointerRef.current.targetX = x;
        pointerRef.current.targetY = y;
        pointerRef.current.isActive = true;
      } else {
        pointerRef.current.isActive = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
    };

    const onMouseLeave = () => {
      pointerRef.current.isActive = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointerPos(touch.clientX, touch.clientY);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointerPos(touch.clientX, touch.clientY);
        pointerRef.current.x = pointerRef.current.targetX;
        pointerRef.current.y = pointerRef.current.targetY;
      }
    };

    const onTouchEnd = () => {
      pointerRef.current.isActive = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !animId) {
          animId = requestAnimationFrame(renderLoop);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
      resizeObserver.disconnect();
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
      style={{ backgroundColor: '#05080A' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />
    </div>
  );
};
