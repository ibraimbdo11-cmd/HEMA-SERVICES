import React, { useEffect, useRef, useState } from 'react';

interface DigitalCodeDnaProps {
  className?: string;
}

// Fixed-length canonical binary tokens for seamless mathematical loop
// Length is 12 items: with M = 12 shifts per cycle, state at tau = 1 exactly equals tau = 0
const BINARY_BITS = ['1', '0', '01', '10', '11', '00', '101', '010', '1', '0', '01', '10'];
const BASE_PAIR_TOKENS = ['01', '10', '11', '00', '1·0', '0·1', '10', '01', '00', '11', '01', '10'];

interface FloatingBinary {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  char: string;
  phase: number;
}

export const DigitalCodeDna: React.FC<DigitalCodeDnaProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
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

    // Ambient floating binary bits around the helix (subtle background depth)
    let floatingBits: FloatingBinary[] = [];

    const initFloatingBits = () => {
      const isMobile = width < 640;
      const count = isMobile ? 8 : 16;
      floatingBits = [];

      for (let i = 0; i < count; i++) {
        floatingBits.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (isMobile ? 0.08 : 0.14),
          vy: (Math.random() - 0.5) * (isMobile ? 0.08 : 0.14),
          size: isMobile ? 8 : 9.5,
          alpha: Math.random() * 0.14 + 0.06,
          char: i % 2 === 0 ? '1' : '0',
          phase: (i / count) * Math.PI * 2,
        });
      }
    };

    // 20-Second Infinite Seamless Loop Cycle (18-24s requirement)
    const CYCLE_DURATION_MS = 20000;

    // Main Draw Function
    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;

      // Calculate normalized loop phase tau in [0, 1)
      // Exactly 1.0 = exactly 0.0 with continuous linear progression
      const tau = reducedMotion ? 0 : (timestamp % CYCLE_DURATION_MS) / CYCLE_DURATION_MS;
      const twoPi = Math.PI * 2;

      // Mouse parallax with smooth exponential damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Parallax offsets (halved on mobile for elegance)
      const mouseOffsetX = reducedMotion ? 0 : mouseRef.current.x * (isMobile ? 10 : 26);
      const mouseOffsetY = reducedMotion ? 0 : mouseRef.current.y * (isMobile ? 8 : 20);

      // Subtle organic floating breathing motion (perfectly harmonized with 20s cycle)
      // 2 complete vertical breathing oscillations per 20s (frequency = 2)
      // 1 complete horizontal breathing oscillation per 20s (frequency = 1)
      // This guarantees seamless continuity at tau = 0 and tau = 1
      const floatAmpY = reducedMotion ? 0 : isMobile ? 2.5 : 5.0;
      const floatAmpX = reducedMotion ? 0 : isMobile ? 1.5 : 3.0;
      const organicFloatY = Math.sin(tau * twoPi * 2) * floatAmpY;
      const organicFloatX = Math.cos(tau * twoPi * 1) * floatAmpX;
      const organicTilt = reducedMotion ? 0 : Math.sin(tau * twoPi * 1) * 0.008;

      // Subtle breathing intensity variation (period = 1 cycle)
      const globalGlowMod = reducedMotion
        ? 1.0
        : 1.0 + Math.sin(tau * twoPi) * 0.07 + Math.cos(tau * twoPi * 2) * 0.03;

      // 1. Draw subtle ambient drifting background binary particles
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < floatingBits.length; i++) {
        const b = floatingBits[i];
        if (!reducedMotion) {
          b.x += b.vx;
          b.y += b.vy;

          if (b.x < -20) b.x = width + 20;
          if (b.x > width + 20) b.x = -20;
          if (b.y < -20) b.y = height + 20;
          if (b.y > height + 20) b.y = -20;
        }

        const particlePhase = b.phase + tau * twoPi;
        const pulse = Math.sin(particlePhase) * 0.04;
        const currentAlpha = Math.max(0.03, Math.min(0.22, b.alpha + pulse));

        ctx.font = `500 ${b.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = `rgba(52, 211, 153, ${currentAlpha * 0.6})`;
        ctx.fillText(b.char, b.x + mouseOffsetX * 0.2, b.y + mouseOffsetY * 0.2);
      }

      // 2. STABLE 3D GEOMETRY OF THE DOUBLE HELIX
      // The DNA itself remains structurally stable and permanently recognizable.
      // Diagonal vector: 18-22 degrees (here ~ -19.5 deg) from bottom-right to top-left.
      const centerX = width * (isMobile ? 0.5 : 0.52) + mouseOffsetX + organicFloatX;
      const centerY = height * (isMobile ? 0.48 : 0.5) + mouseOffsetY + organicFloatY;

      const diagonalAngle = (-19.5 * Math.PI) / 180 + organicTilt;
      const ux = Math.cos(diagonalAngle);
      const uy = Math.sin(diagonalAngle);

      // Spine direction from bottom-right towards top-left
      const spineUx = -ux;
      const spineUy = -uy;

      // Perpendicular normal vector
      const nx = -spineUy;
      const ny = spineUx;

      // Length along diagonal
      const diagonalLength = Math.sqrt(width * width + height * height);
      const spineLength = diagonalLength * (isMobile ? 1.05 : 1.15);

      // Helix parameters
      const nodeCount = isMobile ? 44 : isTablet ? 60 : 72;
      const helixRadius = isMobile ? 46 : isTablet ? 76 : 102;
      const turns = isMobile ? 2.4 : 3.0; // Fixed number of helical full turns

      // FIXED STRUCTURAL VIEWING ANGLE
      // We do NOT continuously rotate the entire DNA strip around itself.
      // Instead, we position the 3D double helix at an optimal fixed angle (0.45 rad)
      // where the two intertwined strands and connecting rungs are prominently visible.
      const fixedBaseRotation = 0.45;

      interface HelixNode {
        index: number;
        strand: 'A' | 'B';
        screenX: number;
        screenY: number;
        z: number;
        code: string;
        alpha: number;
        color: string;
        glow: string | null;
        size: number;
        travelingWavePulse: number;
      }

      interface HelixRung {
        index: number;
        nodeA: HelixNode;
        nodeB: HelixNode;
        avgZ: number;
        codePair: string;
        alpha: number;
        pulse: number;
      }

      const nodesA: HelixNode[] = [];
      const nodesB: HelixNode[] = [];
      const rungs: HelixRung[] = [];

      // Token array length = 12. In 1 full cycle of 20s, exactly 12 shifts occur.
      // At tau = 1.0, 12 * 1.0 = 12 = 0 mod 12, so the token sequence loops seamlessly!
      const tokenCycleCount = 12;
      const tokenContinuousShift = tau * tokenCycleCount;

      for (let i = 0; i <= nodeCount; i++) {
        const progress = i / nodeCount; // 0 (bottom-right) to 1 (top-left)
        const s = (progress - 0.5) * spineLength;

        // Natural subtle organic spine curvature
        const curveOffset = Math.sin(progress * Math.PI) * (isMobile ? 14 : 28);

        const spineX = centerX + spineUx * s + nx * curveOffset;
        const spineY = centerY + spineUy * s + ny * curveOffset;

        // FIXED 3D helical angle along the spine (structurally stable geometry)
        const baseAngleA = progress * (turns * twoPi) + fixedBaseRotation;
        const baseAngleB = baseAngleA + Math.PI;

        // Fade envelope at spine ends
        const fadeEnvelope = Math.sin(progress * Math.PI);

        // INTERNAL TRAVELING DATA WAVE:
        // A luminous organic energy wave travels along the strands:
        // Frequency = 3 crests along the strand, shifting by tau * 2*PI per 20s cycle
        const wavePhase = progress * (3 * twoPi) - tau * twoPi;
        const travelingPulse = Math.cos(wavePhase); // in [-1, 1]
        const normalizedPulse = (travelingPulse + 1) * 0.5; // in [0, 1]

        // Very subtle strand micro-flexing along the wave (1.5px desktop, 0.8px mobile)
        const microFlex = reducedMotion ? 0 : travelingPulse * (isMobile ? 0.8 : 1.6);
        const currentRadius = helixRadius * (0.7 + fadeEnvelope * 0.36) + microFlex;

        // 3D coordinates for Strand A
        const xOffsetA = Math.cos(baseAngleA) * currentRadius;
        const zA = Math.sin(baseAngleA) * currentRadius;
        const screenAx = spineX + nx * xOffsetA;
        const screenAy = spineY + ny * xOffsetA;

        // 3D coordinates for Strand B
        const xOffsetB = Math.cos(baseAngleB) * currentRadius;
        const zB = Math.sin(baseAngleB) * currentRadius;
        const screenBx = spineX + nx * xOffsetB;
        const screenBy = spineY + ny * xOffsetB;

        // SEAMLESS DIGITAL CODE STREAMING:
        // The binary characters travel along the strand seamlessly over 20s
        const codeIndexA = Math.floor((i - tokenContinuousShift) % tokenCycleCount + tokenCycleCount) % tokenCycleCount;
        const codeIndexB = Math.floor((i + 5 - tokenContinuousShift) % tokenCycleCount + tokenCycleCount) % tokenCycleCount;

        const codeA = BINARY_BITS[codeIndexA];
        const codeB = BINARY_BITS[codeIndexB];

        // Depth projection (-1 to 1)
        const normZA = zA / helixRadius;
        const normZB = zB / helixRadius;

        // Strand A: Depth styling + Traveling wave illumination
        const depthAlphaA = normZA > 0 ? 0.65 + normZA * 0.35 : 0.2 + (1 + normZA) * 0.25;
        const waveBoostA = normalizedPulse * 0.22;
        const effectiveAlphaA = Math.min(1, (depthAlphaA + waveBoostA) * (0.35 + fadeEnvelope * 0.65) * globalGlowMod);

        const sizeA = isMobile
          ? normZA > 0 ? 10 : 8
          : normZA > 0 ? 12 : 9;

        const colorA =
          normZA > 0.45 || (normZA > 0.1 && normalizedPulse > 0.65)
            ? '#a7f3d0'
            : normZA > 0
            ? '#34d399'
            : normZA > -0.5
            ? '#059669'
            : '#064e3b';

        const glowA =
          normZA > 0.2 || (normZA > -0.1 && normalizedPulse > 0.7)
            ? `rgba(52, 211, 153, ${(0.3 + normalizedPulse * 0.25) * globalGlowMod})`
            : null;

        const nodeObjA: HelixNode = {
          index: i,
          strand: 'A',
          screenX: screenAx,
          screenY: screenAy,
          z: zA,
          code: codeA,
          alpha: effectiveAlphaA,
          color: colorA,
          glow: glowA,
          size: sizeA,
          travelingWavePulse: normalizedPulse,
        };
        nodesA.push(nodeObjA);

        // Strand B: Depth styling + Traveling wave illumination
        const depthAlphaB = normZB > 0 ? 0.65 + normZB * 0.35 : 0.2 + (1 + normZB) * 0.25;
        const waveBoostB = normalizedPulse * 0.22;
        const effectiveAlphaB = Math.min(1, (depthAlphaB + waveBoostB) * (0.35 + fadeEnvelope * 0.65) * globalGlowMod);

        const sizeB = isMobile
          ? normZB > 0 ? 10 : 8
          : normZB > 0 ? 12 : 9;

        const colorB =
          normZB > 0.45 || (normZB > 0.1 && normalizedPulse > 0.65)
            ? '#a7f3d0'
            : normZB > 0
            ? '#34d399'
            : normZB > -0.5
            ? '#059669'
            : '#064e3b';

        const glowB =
          normZB > 0.2 || (normZB > -0.1 && normalizedPulse > 0.7)
            ? `rgba(52, 211, 153, ${(0.3 + normalizedPulse * 0.25) * globalGlowMod})`
            : null;

        const nodeObjB: HelixNode = {
          index: i,
          strand: 'B',
          screenX: screenBx,
          screenY: screenBy,
          z: zB,
          code: codeB,
          alpha: effectiveAlphaB,
          color: colorB,
          glow: glowB,
          size: sizeB,
          travelingWavePulse: normalizedPulse,
        };
        nodesB.push(nodeObjB);

        // BASE-PAIR CONNECTIONS (RUNGS)
        // Occur regularly every 2 nodes
        if (i % 2 === 0) {
          const avgZ = (zA + zB) / 2;
          const rungIndex = i / 2;
          const rungTokenIndex = Math.floor((rungIndex - tokenContinuousShift) % tokenCycleCount + tokenCycleCount) % tokenCycleCount;
          const codePair = BASE_PAIR_TOKENS[rungTokenIndex];

          const rungBaseAlpha = (0.28 + fadeEnvelope * 0.4) * (avgZ > 0 ? 1.0 : 0.65);
          const rungPulseAlpha = Math.min(0.7, (rungBaseAlpha + normalizedPulse * 0.18) * globalGlowMod);

          rungs.push({
            index: i,
            nodeA: nodeObjA,
            nodeB: nodeObjB,
            avgZ,
            codePair,
            alpha: rungPulseAlpha,
            pulse: normalizedPulse,
          });
        }
      }

      // 3. DRAW STRAND BACKBONES
      // Continuous smooth lines tracing Strand A and Strand B
      const drawBackboneStrand = (strandNodes: HelixNode[]) => {
        for (let i = 0; i < strandNodes.length - 1; i++) {
          const n1 = strandNodes[i];
          const n2 = strandNodes[i + 1];
          const segmentAvgZ = (n1.z + n2.z) / 2;
          const segmentAlpha = Math.max(0.08, Math.min(0.75, ((n1.alpha + n2.alpha) / 2) * 0.75));

          ctx.beginPath();
          ctx.moveTo(n1.screenX, n1.screenY);
          ctx.lineTo(n2.screenX, n2.screenY);

          ctx.strokeStyle = segmentAvgZ > 0
            ? `rgba(52, 211, 153, ${segmentAlpha})`
            : `rgba(5, 150, 105, ${segmentAlpha * 0.55})`;
          ctx.lineWidth = segmentAvgZ > 0 ? (isMobile ? 1.2 : 1.6) : (isMobile ? 0.7 : 0.9);
          ctx.stroke();
        }
      };

      drawBackboneStrand(nodesA);
      drawBackboneStrand(nodesB);

      // 4. DEPTH-SORTED RENDERING FOR RUNGS & DIGITAL NODES
      type RenderItem =
        | { type: 'rung'; z: number; rung: HelixRung }
        | { type: 'node'; z: number; node: HelixNode };

      const renderQueue: RenderItem[] = [];

      rungs.forEach((r) => renderQueue.push({ type: 'rung', z: r.avgZ, rung: r }));
      nodesA.forEach((n) => renderQueue.push({ type: 'node', z: n.z, node: n }));
      nodesB.forEach((n) => renderQueue.push({ type: 'node', z: n.z, node: n }));

      // Render back-to-front
      renderQueue.sort((a, b) => a.z - b.z);

      for (let k = 0; k < renderQueue.length; k++) {
        const item = renderQueue[k];

        if (item.type === 'rung') {
          const r = item.rung;

          // Connecting base-pair rung line
          ctx.beginPath();
          ctx.moveTo(r.nodeA.screenX, r.nodeA.screenY);
          ctx.lineTo(r.nodeB.screenX, r.nodeB.screenY);
          ctx.strokeStyle = `rgba(16, 185, 129, ${r.alpha * 0.6})`;
          ctx.lineWidth = isMobile ? 0.8 : 1.1;
          ctx.setLineDash([2, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Base-pair token at midpoint
          const midX = (r.nodeA.screenX + r.nodeB.screenX) / 2;
          const midY = (r.nodeA.screenY + r.nodeB.screenY) / 2;

          ctx.font = `600 ${isMobile ? 7.5 : 9}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = r.pulse > 0.7 ? '#a7f3d0' : `rgba(167, 243, 208, ${r.alpha * 0.9})`;
          ctx.fillText(r.codePair, midX, midY);
        } else {
          const n = item.node;

          // Node junction anchor dot
          ctx.beginPath();
          ctx.arc(n.screenX, n.screenY, isMobile ? 1.8 : 2.4, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.globalAlpha = Math.min(1, n.alpha * 1.15);
          ctx.fill();

          // Soft luminous bloom for front nodes and traveling wave crests
          if (n.glow) {
            ctx.shadowColor = n.glow;
            ctx.shadowBlur = isMobile ? 5 : 9;
          } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }

          // Digital binary character glyph
          ctx.font = `700 ${n.size}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = n.color;
          ctx.globalAlpha = n.alpha;
          ctx.fillText(n.code, n.screenX, n.screenY);

          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
    };

    const renderLoop = (t: number) => {
      draw(t);
      if (!reducedMotion && isVisible) {
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

      initFloatingBits();

      if (reducedMotion) {
        draw(0);
      }
    };

    // Track mouse with gentle parallax damping
    const onMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = relX;
      mouseRef.current.targetY = relY;
    };

    const onMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });

    // Pause animation when tab or element is not visible
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !reducedMotion && !animId) {
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

    if (!reducedMotion) {
      animId = requestAnimationFrame(renderLoop);
    } else {
      draw(0);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
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
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* LAYER 0: Deep background base */}
      <div className="absolute inset-0 bg-[#07090e]" />

      {/* LAYER 1: Ambient Green Light Bloom centered behind DNA */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[520px] sm:w-[820px] lg:w-[980px] h-[320px] sm:h-[480px] bg-emerald-500/[0.07] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[10%] right-[8%] w-[280px] sm:w-[440px] h-[280px] bg-teal-500/[0.04] blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[14%] left-[6%] w-[280px] sm:w-[400px] h-[240px] bg-emerald-600/[0.04] blur-[130px] rounded-full pointer-events-none" />

      {/* LAYER 2: Highly refined, subtle technical grid (very low opacity so DNA is prominent) */}
      <svg
        className="absolute inset-0 w-full h-full text-emerald-500/[0.022]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="hero-dna-grid-pattern"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <circle cx="60" cy="0" r="0.9" fill="#34d399" opacity="0.25" />
            <circle cx="0" cy="60" r="0.9" fill="#34d399" opacity="0.25" />
          </pattern>

          <radialGradient id="hero-dna-grid-radial" cx="50%" cy="48%" r="62%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="88%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="hero-dna-grid-linear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <mask id="hero-dna-grid-mask">
            <rect width="100%" height="100%" fill="url(#hero-dna-grid-radial)" />
            <rect width="100%" height="100%" fill="url(#hero-dna-grid-linear)" />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#hero-dna-grid-pattern)"
          mask="url(#hero-dna-grid-mask)"
        />
      </svg>

      {/* LAYER 3: 3D Digital Code Double Helix Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Seamless edge fades to blend with header and page flow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/60 via-transparent to-[#07090e] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent pointer-events-none" />
    </div>
  );
};
