import React, { useEffect, useRef, useState } from 'react';

interface DigitalCoreHeroBackgroundProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number; // 0.2 (far) to 1.0 (near)
  vx: number;
  vy: number;
  baseRadius: number;
  baseAlpha: number;
  phase: number;
  pulseSpeed: number;
}

interface Connection {
  p1: number;
  p2: number;
  alpha: number;
  targetAlpha: number;
  fadeSpeed: number;
}

interface DataStream {
  // Polyline or segmented horizontal/diagonal bus
  points: { x: number; y: number }[];
  totalLength: number;
  progress: number;
  speed: number;
  packetLength: number;
  alpha: number;
  pulsePhase: number;
}

interface CodeToken {
  text: string;
  x: number; // 0 to 1 percentage
  y: number; // 0 to 1 percentage
  alpha: number;
  baseAlpha: number;
  phase: number;
  driftSpeed: number;
  fontSize: number;
}

export const DigitalCoreHeroBackground: React.FC<DigitalCoreHeroBackgroundProps> = ({
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Pointer position for subtle atmospheric response
  const pointerRef = useRef({
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    isActive: false,
  });

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

    // Simulation entities
    let particles: Particle[] = [];
    let connections: Connection[] = [];
    let dataStreams: DataStream[] = [];
    let codeTokens: CodeToken[] = [];
    let gridOffsetZ = 0;

    // 1. INITIALIZE PERSPECTIVE & PARTICLES
    const initScene = () => {
      if (width <= 0 || height <= 0) return;

      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;

      // Particle count: rich, elegant, luminous neon dots
      const count = isMobile ? 44 : isTablet ? 68 : 88;
      particles = [];

      for (let i = 0; i < count; i++) {
        const z = 0.2 + Math.random() * 0.8; // Depth layer
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.5) * (isMobile ? 0.14 : 0.22) * z,
          vy: (Math.random() - 0.5) * (isMobile ? 0.14 : 0.22) * z,
          baseRadius: isMobile ? 1.3 + z * 1.5 : 1.6 + z * 2.0,
          // Clearly visible luminous neon green dots
          baseAlpha: 0.35 + z * 0.5,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.001 + Math.random() * 0.0015,
        });
      }

      // Initialize sparse connections
      connections = [];
      const maxConnections = isMobile ? 10 : 18;
      for (let i = 0; i < maxConnections; i++) {
        connections.push({
          p1: Math.floor(Math.random() * count),
          p2: Math.floor(Math.random() * count),
          alpha: 0,
          targetAlpha: 0.08 + Math.random() * 0.12,
          fadeSpeed: 0.002 + Math.random() * 0.003,
        });
      }

      // Initialize Data Streams (subtle circuit traces in background)
      dataStreams = [];
      const streamCount = isMobile ? 3 : 5;
      for (let s = 0; s < streamCount; s++) {
        // Build a multi-point stepped/curved trajectory across negative space
        const startY = height * (0.18 + s * 0.16 + (Math.random() - 0.5) * 0.08);
        const points: { x: number; y: number }[] = [];

        const startX = -100;
        const midX1 = width * (0.2 + s * 0.12);
        const midY1 = startY;
        const midX2 = midX1 + (isMobile ? 60 : 100);
        const midY2 = startY + (s % 2 === 0 ? 35 : -35);
        const endX = width + 100;
        const endY = midY2;

        points.push({ x: startX, y: startY });
        points.push({ x: midX1, y: midY1 });
        points.push({ x: midX2, y: midY2 });
        points.push({ x: endX, y: endY });

        // Calculate approximate path length
        let len = 0;
        for (let p = 0; p < points.length - 1; p++) {
          const dx = points[p + 1].x - points[p].x;
          const dy = points[p + 1].y - points[p].y;
          len += Math.sqrt(dx * dx + dy * dy);
        }

        dataStreams.push({
          points,
          totalLength: len,
          progress: Math.random() * len,
          speed: isMobile ? 0.35 + s * 0.12 : 0.55 + s * 0.18,
          packetLength: isMobile ? 40 : 70,
          alpha: 0.12 + (s % 3) * 0.05, // very low opacity (0.12 to 0.22)
          pulsePhase: s * 1.5,
        });
      }

      // Initialize Abstract Programming Elements in the far background
      // Token list: abstract, embedded, non-distracting
      const rawTokens = [
        '</>',
        '{ }',
        '01',
        '0x7E',
        'const',
        '=>',
        '[ ]',
        '// core',
        '::',
        '10',
        'fn()',
        '#00',
        '0101',
      ];

      codeTokens = [];
      const tokenCount = isMobile ? 8 : 16;
      for (let t = 0; t < tokenCount; t++) {
        // Distribute mainly around the periphery and mid-height, avoiding directly covering headline
        const isLeft = t % 2 === 0;
        const xMin = isLeft ? 0.03 : 0.68;
        const xMax = isLeft ? 0.32 : 0.97;
        const posX = xMin + Math.random() * (xMax - xMin);
        const posY = 0.12 + Math.random() * 0.74;

        codeTokens.push({
          text: rawTokens[t % rawTokens.length],
          x: posX,
          y: posY,
          alpha: 0.04 + Math.random() * 0.05, // 0.04 - 0.09 (barely visible)
          baseAlpha: 0.04 + Math.random() * 0.05,
          phase: Math.random() * Math.PI * 2,
          driftSpeed: 0.0004 + Math.random() * 0.0006,
          fontSize: isMobile ? 10 : 12,
        });
      }
    };

    // 2. MAIN RENDER LOOP
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Smooth pointer position
      if (pointerRef.current.isActive) {
        pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.25;
        pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.25;
      }

      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;

      // -------------------------------------------------------------
      // LAYER 0: BASE ATMOSPHERE & DEEP "DIGITAL CORE" GLOW
      // -------------------------------------------------------------
      // Base background: Deep matte obsidian (#06080B)
      ctx.fillStyle = '#06080B';
      ctx.fillRect(0, 0, width, height);

      // A. Global Atmospheric dark-emerald wash
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.44,
        0,
        width * 0.5,
        height * 0.44,
        Math.max(width, height) * 0.78
      );
      bgGrad.addColorStop(0, 'rgba(6, 42, 32, 0.45)');
      bgGrad.addColorStop(0.38, 'rgba(5, 26, 20, 0.25)');
      bgGrad.addColorStop(0.72, 'rgba(6, 12, 14, 0.85)');
      bgGrad.addColorStop(1, '#050709');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // B. The Central "Digital Core" Diffuse Glow
      // Large, soft, non-spotlight volumetric glow hidden behind the UI
      const coreBreath = reducedMotion
        ? 1.0
        : 1.0 + Math.sin(time * 0.0007) * 0.04;
      const coreRadius = (isMobile ? width * 0.75 : width * 0.46) * coreBreath;

      const coreGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        0,
        width * 0.5,
        height * 0.42,
        coreRadius
      );
      // Soft diffused emerald illumination (#10b981 / #00cf85)
      coreGlow.addColorStop(0, 'rgba(16, 185, 129, 0.14)');
      coreGlow.addColorStop(0.24, 'rgba(16, 185, 129, 0.08)');
      coreGlow.addColorStop(0.55, 'rgba(5, 150, 105, 0.03)');
      coreGlow.addColorStop(1, 'rgba(6, 8, 11, 0)');
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // LAYER 1: PERSPECTIVE DEPTH GRID (Lower Ground Plane)
      // -------------------------------------------------------------
      // Horizon is placed around 48% of height, grid extends to bottom
      const horizonY = height * 0.48;
      const gridBottomY = height;
      const gridHeight = gridBottomY - horizonY;
      const vpX = width * 0.5; // Vanishing point X

      if (gridHeight > 40) {
        ctx.save();
        // Forward motion along Z
        if (!reducedMotion) {
          gridOffsetZ = (gridOffsetZ + (isMobile ? 0.0018 : 0.0028)) % 1;
        }

        // Transverse horizontal grid lines (logarithmic spacing for true 3D perspective)
        const transLinesCount = isMobile ? 12 : 18;
        for (let i = 0; i < transLinesCount; i++) {
          // Normalized depth ratio: 0 (at horizon) to 1 (at bottom)
          const norm = (i + gridOffsetZ) / transLinesCount;
          // Perspective projection curve
          const pFactor = Math.pow(norm, 2.4);
          const y = horizonY + pFactor * gridHeight;

          // Line opacity: fades completely near horizon, subtle at bottom (0.02 to 0.12)
          const lineAlpha = pFactor * (isMobile ? 0.09 : 0.13);
          if (lineAlpha > 0.008 && y <= gridBottomY) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }

        // Longitudinal radiating lines (radiating outward from horizon center)
        const longLinesCount = isMobile ? 14 : 26;
        for (let j = 0; j <= longLinesCount; j++) {
          // Spread across bottom width
          const bottomSpread = width * (isMobile ? 1.6 : 2.0);
          const bottomStartX = (width - bottomSpread) / 2;
          const targetX = bottomStartX + (j / longLinesCount) * bottomSpread;

          // Graduated stroke from horizon to bottom
          const grad = ctx.createLinearGradient(vpX, horizonY, targetX, gridBottomY);
          grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
          grad.addColorStop(0.35, 'rgba(16, 185, 129, 0.03)');
          grad.addColorStop(0.85, isMobile ? 'rgba(16, 185, 129, 0.09)' : 'rgba(16, 185, 129, 0.12)');
          grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

          ctx.beginPath();
          ctx.moveTo(vpX, horizonY);
          ctx.lineTo(targetX, gridBottomY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // LAYER 2: ABSTRACT PROGRAMMING ELEMENTS (Far Background)
      // -------------------------------------------------------------
      ctx.font = '11px "JetBrains Mono", "Cairo", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < codeTokens.length; i++) {
        const token = codeTokens[i];

        if (!reducedMotion) {
          // Very gentle float
          token.y += Math.sin(time * token.driftSpeed + token.phase) * 0.00015;
          // Subtle pulse
          token.alpha =
            token.baseAlpha *
            (0.8 + Math.sin(time * 0.001 + token.phase) * 0.2);
        }

        const px = token.x * width;
        const py = token.y * height;

        ctx.fillStyle = `rgba(52, 211, 153, ${token.alpha})`;
        ctx.fillText(token.text, px, py);
      }

      // -------------------------------------------------------------
      // LAYER 3: DATA STREAMS (Light Paths / Circuit Traces)
      // -------------------------------------------------------------
      for (let s = 0; s < dataStreams.length; s++) {
        const stream = dataStreams[s];

        if (!reducedMotion) {
          stream.progress = (stream.progress + stream.speed) % stream.totalLength;
        }

        // Draw faint static trace line
        ctx.beginPath();
        for (let p = 0; p < stream.points.length; p++) {
          const pt = stream.points[p];
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = `rgba(16, 185, 129, ${stream.alpha * 0.35})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();

        // Trace and draw moving energy packet along polyline
        // Find position of current packet on the path
        let accum = 0;
        let packetX = stream.points[0].x;
        let packetY = stream.points[0].y;
        let angle = 0;

        for (let p = 0; p < stream.points.length - 1; p++) {
          const pA = stream.points[p];
          const pB = stream.points[p + 1];
          const dx = pB.x - pA.x;
          const dy = pB.y - pA.y;
          const segLen = Math.sqrt(dx * dx + dy * dy);

          if (accum + segLen >= stream.progress) {
            const segProgress = (stream.progress - accum) / segLen;
            packetX = pA.x + dx * segProgress;
            packetY = pA.y + dy * segProgress;
            angle = Math.atan2(dy, dx);
            break;
          }
          accum += segLen;
        }

        // Render soft glowing packet tail
        const tailLen = stream.packetLength;
        const tailX = packetX - Math.cos(angle) * tailLen;
        const tailY = packetY - Math.sin(angle) * tailLen;

        const packetGrad = ctx.createLinearGradient(tailX, tailY, packetX, packetY);
        packetGrad.addColorStop(0, 'rgba(52, 211, 153, 0)');
        packetGrad.addColorStop(0.7, `rgba(52, 211, 153, ${stream.alpha * 0.8})`);
        packetGrad.addColorStop(1, `rgba(167, 243, 208, ${stream.alpha * 1.3})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(packetX, packetY);
        ctx.strokeStyle = packetGrad;
        ctx.lineWidth = isMobile ? 1.0 : 1.4;
        ctx.stroke();

        // Tiny head spark
        ctx.beginPath();
        ctx.arc(packetX, packetY, isMobile ? 1.1 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(209, 250, 229, ${stream.alpha * 1.4})`;
        ctx.fill();
      }

      // -------------------------------------------------------------
      // LAYER 4: DIGITAL PARTICLES & LIVING NETWORK CONNECTIONS
      // -------------------------------------------------------------
      // Update particles with organic motion and subtle pointer repulsion
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Interactive subtle pointer repulsion for neon green dots
          if (pointerRef.current.isActive) {
            const dx = p.x - pointerRef.current.x;
            const dy = p.y - pointerRef.current.y;
            const distSq = dx * dx + dy * dy;
            const repRadius = isMobile ? 95 : 135;
            if (distSq < repRadius * repRadius && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / repRadius) * (isMobile ? 1.6 : 2.5);
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }
          }

          // Wrap around edges gracefully
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;
        }
      }

      // Render subtle connections that slowly fade in and out
      for (let c = 0; c < connections.length; c++) {
        const conn = connections[c];
        const p1 = particles[conn.p1];
        const p2 = particles[conn.p2];

        if (!p1 || !p2) continue;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = isMobile ? 95 : 135;

        if (dist < maxDist) {
          // Fade cycle
          if (!reducedMotion) {
            if (conn.alpha < conn.targetAlpha) {
              conn.alpha += conn.fadeSpeed;
              if (conn.alpha >= conn.targetAlpha) {
                conn.targetAlpha = 0; // Turn around to fade out
              }
            } else {
              conn.alpha -= conn.fadeSpeed;
              if (conn.alpha <= 0.005) {
                // Re-link to new random particles
                conn.p1 = Math.floor(Math.random() * particles.length);
                conn.p2 = Math.floor(Math.random() * particles.length);
                conn.alpha = 0;
                conn.targetAlpha = 0.07 + Math.random() * 0.12;
              }
            }
          } else {
            conn.alpha = 0.08;
          }

          const distFactor = 1 - dist / maxDist;
          const actualAlpha = conn.alpha * distFactor;

          if (actualAlpha > 0.01) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${actualAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        } else {
          // Too far, pick another pair
          if (!reducedMotion) {
            conn.p1 = Math.floor(Math.random() * particles.length);
            conn.p2 = Math.floor(Math.random() * particles.length);
          }
        }
      }

      // Render luminous neon green dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pulse = reducedMotion ? 1 : 1 + Math.sin(time * p.pulseSpeed + p.phase) * 0.18;
        const r = p.baseRadius * pulse;
        const alpha = Math.min(1, p.baseAlpha * pulse);

        // Soft vibrant neon green atmospheric aura
        const glowR = r * (p.z > 0.6 ? 3.5 : 2.5);
        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        pGrad.addColorStop(0, `rgba(0, 255, 157, ${alpha * 0.75})`);
        pGrad.addColorStop(0.5, `rgba(0, 207, 133, ${alpha * 0.25})`);
        pGrad.addColorStop(1, 'rgba(0, 255, 157, 0)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Neon Green Dot Body (#00FF9D)
        ctx.fillStyle = `rgba(0, 255, 157, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // High-contrast brilliant white-cyan core for distinct luminescence
        ctx.fillStyle = `rgba(235, 255, 250, ${Math.min(1, alpha * 1.35)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }

      // -------------------------------------------------------------
      // LAYER 5: TRANSITIONS — SOFT SEAMLESS BLEND TO BOTTOM
      // -------------------------------------------------------------
      // Bottom fade mask to seamlessly blend the Hero into the next section
      const bottomFadeHeight = Math.min(height * 0.28, 180);
      const bottomFade = ctx.createLinearGradient(
        0,
        height - bottomFadeHeight,
        0,
        height
      );
      bottomFade.addColorStop(0, 'rgba(5, 7, 9, 0)');
      bottomFade.addColorStop(0.55, 'rgba(5, 7, 9, 0.45)');
      bottomFade.addColorStop(1, '#050709');

      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, height - bottomFadeHeight, width, bottomFadeHeight);
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

      initScene();
    };

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

    const onMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      pointerRef.current.targetX = e.clientX - rect.left;
      pointerRef.current.targetY = e.clientY - rect.top;
      pointerRef.current.isActive = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!container || !e.touches || e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      pointerRef.current.targetX = e.touches[0].clientX - rect.left;
      pointerRef.current.targetY = e.touches[0].clientY - rect.top;
      pointerRef.current.isActive = true;
    };

    const onMouseLeave = () => {
      pointerRef.current.isActive = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseLeave, { passive: true });
    window.addEventListener('touchcancel', onMouseLeave, { passive: true });

    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseLeave);
      window.removeEventListener('touchcancel', onMouseLeave);
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
      className={`absolute inset-0 overflow-hidden select-none pointer-events-none z-0 ${className}`}
      aria-hidden="true"
      style={{ backgroundColor: '#050709' }}
    >
      {/* High-Performance Canvas for perspective grid, digital core glow, streams & network */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Layered Vignette (CSS Overlay) ensuring darker edges and total focus on Arabic headline */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 110% 90% at 50% 45%, transparent 40%, rgba(5, 7, 9, 0.55) 75%, rgba(5, 7, 9, 0.95) 100%)',
        }}
      />

      {/* Bottom gradient overlay ensuring a 100% natural, smooth transition into #services-section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent"
      />
    </div>
  );
};
