import React, { useEffect, useRef, useState } from 'react';

interface HeroCodeNetworkProps {
  className?: string;
}

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulsePhase: number;
  pulseSpeed: number;
}

export const HeroCodeNetwork: React.FC<HeroCodeNetworkProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 1. Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // 2. Setup Canvas & Physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let nodes: NetworkNode[] = [];

    const isMobile = () => width < 640;

    const initNodes = () => {
      const nodeCount = isMobile() ? 12 : 24;
      nodes = [];

      for (let i = 0; i < nodeCount; i++) {
        // Bias nodes towards outer margins (around edges), leaving center clearer
        const zone = Math.random();
        let x = 0;
        let y = 0;

        if (zone < 0.35) {
          // Top zone
          x = Math.random() * width;
          y = Math.random() * (height * 0.35);
        } else if (zone < 0.65) {
          // Bottom zone
          x = Math.random() * width;
          y = height * 0.65 + Math.random() * (height * 0.35);
        } else if (zone < 0.82) {
          // Left flank
          x = Math.random() * (width * 0.25);
          y = Math.random() * height;
        } else {
          // Right flank
          x = width * 0.75 + Math.random() * (width * 0.25);
          y = Math.random() * height;
        }

        // Keep inside bounds
        x = Math.max(10, Math.min(width - 10, x));
        y = Math.max(10, Math.min(height - 10, y));

        // Subconscious, very slow drift speed (0.12 - 0.22 px/frame)
        const speed = 0.12 + Math.random() * 0.1;
        const angle = Math.random() * Math.PI * 2;

        nodes.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.4 + Math.random() * 1.1,
          baseAlpha: 0.25 + Math.random() * 0.35,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.012 + Math.random() * 0.015,
        });
      }
    };

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initNodes();
      // If reduced motion is active, draw single static frame
      if (reducedMotion) {
        drawFrame(0);
      }
    };

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const maxDist = isMobile() ? 75 : 120;
      const maxConnectionsPerNode = 2;
      const connectionCounts = new Array(nodes.length).fill(0);

      // 1. Draw subtle connection lines between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        if (connectionCounts[i] >= maxConnectionsPerNode) continue;

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          if (connectionCounts[j] >= maxConnectionsPerNode) continue;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const proximity = 1 - dist / maxDist;
            // Extremely subtle line opacity (max ~0.15)
            const alpha = proximity * 0.15 * ((n1.baseAlpha + n2.baseAlpha) / 2);

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();

            connectionCounts[i]++;
            connectionCounts[j]++;
          }
        }
      }

      // 2. Draw nodes (dots with soft emerald tint)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // If not reduced motion, update position gently
        if (!reducedMotion) {
          n.x += n.vx;
          n.y += n.vy;
          n.pulsePhase += n.pulseSpeed;

          // Gentle bounds containment with margin
          if (n.x <= 8) {
            n.x = 8;
            n.vx = Math.abs(n.vx);
          } else if (n.x >= width - 8) {
            n.x = width - 8;
            n.vx = -Math.abs(n.vx);
          }

          if (n.y <= 8) {
            n.y = 8;
            n.vy = Math.abs(n.vy);
          } else if (n.y >= height - 8) {
            n.y = height - 8;
            n.vy = -Math.abs(n.vy);
          }
        }

        // Subtle alpha breathing
        const alphaPulse = reducedMotion ? 0 : Math.sin(n.pulsePhase) * 0.12;
        const currentAlpha = Math.max(0.12, Math.min(0.65, n.baseAlpha + alphaPulse));

        // Outer soft glow ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${currentAlpha * 0.2})`;
        ctx.fill();

        // Core solid dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${currentAlpha})`;
        ctx.fill();
      }

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(drawFrame);
      }
    };

    // ResizeObserver for zero-layout-shift responsive syncing
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    if (!reducedMotion) {
      animationFrameId = requestAnimationFrame(drawFrame);
    }

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* LAYER 5: Emerald Glows — Soft, low opacity, no neon blobs */}
      <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[520px] sm:w-[820px] h-[280px] sm:h-[420px] bg-emerald-500/[0.08] blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[10%] right-[8%] w-[260px] sm:w-[380px] h-[220px] bg-teal-500/[0.04] blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[18%] left-[6%] w-[240px] sm:w-[360px] h-[200px] bg-emerald-600/[0.04] blur-[110px] rounded-full pointer-events-none" />

      {/* LAYER 1: Engineering Grid — Subtle thin lines with radial & bottom masks */}
      <svg
        className="absolute inset-0 w-full h-full text-emerald-500/[0.08]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="hero-eng-grid-pattern"
            width="52"
            height="52"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 52 0 L 0 0 0 52"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <circle cx="52" cy="0" r="1.2" fill="#34d399" opacity="0.45" />
            <circle cx="0" cy="52" r="1.2" fill="#34d399" opacity="0.45" />
          </pattern>

          <radialGradient id="hero-grid-radial-fade" cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="hero-grid-linear-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <mask id="hero-eng-grid-mask">
            <rect width="100%" height="100%" fill="url(#hero-grid-radial-fade)" />
            <rect width="100%" height="100%" fill="url(#hero-grid-linear-fade)" />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#hero-eng-grid-pattern)"
          mask="url(#hero-eng-grid-mask)"
        />
      </svg>

      {/* LAYER 2 & 3: Canvas for Network Nodes & Subtle Slow Movement */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* LAYER 4: Code Fragments — Discrete hints around outer perimeter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none font-mono text-[10px] sm:text-xs select-none">
        {/* Top Left */}
        <span
          className={`absolute top-8 sm:top-12 left-6 sm:left-12 text-emerald-400/25 tracking-widest ${
            reducedMotion ? '' : 'transition-opacity duration-1000'
          }`}
        >
          &lt; /&gt;
        </span>

        {/* Top Right */}
        <span
          className={`absolute top-10 sm:top-14 right-8 sm:right-16 text-emerald-400/20 tracking-wider ${
            reducedMotion ? '' : 'transition-opacity duration-1000'
          }`}
        >
          const
        </span>

        {/* Mid Left */}
        <span className="hidden sm:inline-block absolute top-1/2 -translate-y-12 left-8 text-emerald-400/20 tracking-widest">
          01
        </span>

        {/* Mid Right */}
        <span className="hidden sm:inline-block absolute top-1/2 -translate-y-6 right-10 text-emerald-400/20 tracking-wider">
          function
        </span>

        {/* Bottom Left */}
        <span className="absolute bottom-16 sm:bottom-20 left-8 sm:left-14 text-emerald-400/25 font-bold tracking-wider">
          API
        </span>

        {/* Bottom Right */}
        <span className="absolute bottom-14 sm:bottom-16 right-8 sm:right-14 text-emerald-400/25 font-bold tracking-widest">
          {'{ }'}
        </span>

        {/* Bottom Center-Left */}
        <span className="hidden md:inline-block absolute bottom-24 left-1/4 text-emerald-400/15 tracking-widest">
          101
        </span>
      </div>

      {/* Edge Fades to seamlessly blend with page header and sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/60 via-transparent to-[#07090e] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent pointer-events-none" />
    </div>
  );
};
