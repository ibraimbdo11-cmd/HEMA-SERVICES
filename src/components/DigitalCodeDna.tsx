import React, { useEffect, useRef, useState } from 'react';

interface DigitalCodeDnaProps {
  className?: string;
}

// Canonical binary tokens for DNA nodes and base pairs
const BINARY_BITS = ['01', '10', '00', '11', '10', '01', '11', '00', '01', '10', '11', '00'];
const BASE_PAIR_TOKENS = ['01', '10', '11', '00', '10', '01', '00', '11', '01', '10', '11', '00'];

// Ambient floating particle
interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  phase: number;
  orbitRadius: number;
  orbitSpeed: number;
}

// Ambient digital fragment ('01', '10', '00', '11')
interface DigitalFragment {
  relX: number;
  relY: number;
  char: string;
  size: number;
  alpha: number;
  phase: number;
  speed: number;
  orbitR: number;
}

// Data flow stream line in the surrounding space
interface DataStreamLine {
  p0: [number, number]; // Normalized start
  p1: [number, number]; // Control 1
  p2: [number, number]; // Control 2
  p3: [number, number]; // Normalized end
  speed: number;        // Cycle duration in ms
  packets: { offset: number; token: string; size: number }[];
}

// Subtle technical reference node in the empty space
interface TechnicalNode {
  relX: number;
  relY: number;
  label: string;
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

    // AMBIENT DIGITAL ENVIRONMENT STATE
    let ambientParticles: AmbientParticle[] = [];
    let digitalFragments: DigitalFragment[] = [];
    let technicalNodes: TechnicalNode[] = [];

    // Technical data stream paths in surrounding space
    const dataStreams: DataStreamLine[] = [
      {
        p0: [0.88, 0.16],
        p1: [0.65, 0.22],
        p2: [0.42, 0.18],
        p3: [0.12, 0.28],
        speed: 16000,
        packets: [
          { offset: 0.0, token: '01', size: 8 },
          { offset: 0.5, token: '10', size: 8 },
        ],
      },
      {
        p0: [0.92, 0.72],
        p1: [0.68, 0.82],
        p2: [0.38, 0.78],
        p3: [0.08, 0.86],
        speed: 21000,
        packets: [
          { offset: 0.15, token: '11', size: 8 },
          { offset: 0.65, token: '00', size: 8 },
        ],
      },
      {
        p0: [0.82, 0.38],
        p1: [0.62, 0.44],
        p2: [0.36, 0.48],
        p3: [0.16, 0.56],
        speed: 18000,
        packets: [
          { offset: 0.3, token: '10', size: 7.5 },
          { offset: 0.8, token: '01', size: 7.5 },
        ],
      },
    ];

    const initAmbientEnvironment = () => {
      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;

      // 1. Ambient particles
      const particleCount = isMobile ? 10 : isTablet ? 16 : 24;
      ambientParticles = [];
      for (let i = 0; i < particleCount; i++) {
        ambientParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (isMobile ? 0.06 : 0.12),
          vy: (Math.random() - 0.5) * (isMobile ? 0.06 : 0.12),
          size: Math.random() * 1.5 + 1.2,
          baseAlpha: Math.random() * 0.16 + 0.08,
          phase: (i / particleCount) * Math.PI * 2,
          orbitRadius: Math.random() * 18 + 8,
          orbitSpeed: (Math.random() * 0.0008 + 0.0004) * (Math.random() > 0.5 ? 1 : -1),
        });
      }

      // 2. Digital fragments ('01', '10', '00', '11') in peripheral empty spaces
      const fragmentTokens = ['01', '10', '00', '11', '01', '10'];
      const fragmentCount = isMobile ? 6 : isTablet ? 10 : 16;
      digitalFragments = [];

      // Predefined distributed peripheral positions so they frame the center
      const peripheralPositions: [number, number][] = [
        [0.18, 0.22], [0.82, 0.18], [0.22, 0.78], [0.84, 0.74],
        [0.12, 0.48], [0.88, 0.44], [0.32, 0.14], [0.68, 0.15],
        [0.28, 0.86], [0.72, 0.84], [0.08, 0.32], [0.92, 0.62],
        [0.38, 0.28], [0.62, 0.72], [0.15, 0.68], [0.85, 0.28],
      ];

      for (let i = 0; i < fragmentCount; i++) {
        const basePos = peripheralPositions[i % peripheralPositions.length];
        digitalFragments.push({
          relX: basePos[0] + (Math.random() - 0.5) * 0.06,
          relY: basePos[1] + (Math.random() - 0.5) * 0.06,
          char: fragmentTokens[i % fragmentTokens.length],
          size: isMobile ? 7.5 : 8.5,
          alpha: Math.random() * 0.12 + 0.08,
          phase: (i / fragmentCount) * Math.PI * 2,
          speed: Math.random() * 0.0006 + 0.0004,
          orbitR: Math.random() * 12 + 6,
        });
      }

      // 3. Technical reference connection points in surrounding space
      technicalNodes = [
        { relX: 0.16, relY: 0.24, label: '01' },
        { relX: 0.84, relY: 0.20, label: '10' },
        { relX: 0.14, relY: 0.76, label: '00' },
        { relX: 0.86, relY: 0.78, label: '11' },
      ];
    };

    // Helper: Cubic bezier point calculation
    const getCubicBezierPoint = (
      t: number,
      p0: [number, number],
      p1: [number, number],
      p2: [number, number],
      p3: [number, number]
    ): [number, number] => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
      const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];
      return [x, y];
    };

    // ==========================================
    // PRECISE ANIMATION CYCLE PARAMETERS
    // ==========================================
    // A. Primary DNA Drift Cycle: 21.0s (within 18-24s target)
    const DRIFT_CYCLE_MS = 21000;
    // B. Internal Digital Flow Cycle: 8.0s (within 6-10s target)
    const FLOW_CYCLE_MS = 8000;
    // C. Ambient Light Breathing Cycle: 10.0s (within 8-12s target)
    const GLOW_CYCLE_MS = 10000;

    // Main Draw Function
    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;
      const twoPi = Math.PI * 2;

      // 1. TIME CYCLES (SEAMLESS INFINITE LOOPING)
      // Primary Macro Drift Phase (tauDrift in [0, 1))
      const tauDrift = reducedMotion ? 0 : (timestamp % DRIFT_CYCLE_MS) / DRIFT_CYCLE_MS;
      const angleDrift = tauDrift * twoPi;

      // Internal Digital Flow Phase (tauFlow in [0, 1))
      const tauFlow = reducedMotion ? 0 : (timestamp % FLOW_CYCLE_MS) / FLOW_CYCLE_MS;

      // Ambient Light Breathing Phase (tauGlow in [0, 1))
      const tauGlow = reducedMotion ? 0 : (timestamp % GLOW_CYCLE_MS) / GLOW_CYCLE_MS;
      const ambientGlowMod = reducedMotion ? 1.0 : 1.0 + Math.sin(tauGlow * twoPi) * 0.08;

      // Mouse parallax with smooth exponential damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.035;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.035;

      const mouseOffsetX = reducedMotion ? 0 : mouseRef.current.x * (isMobile ? 8 : 22);
      const mouseOffsetY = reducedMotion ? 0 : mouseRef.current.y * (isMobile ? 6 : 18);

      // ==========================================
      // SECTION A: PRIMARY DNA DRIFT & FLOATING MOTION
      // Continuous smooth closed trajectory in 2D space (No start/stop, steady velocity)
      // ==========================================
      const driftAmpX = isMobile ? 6 : 16;
      const driftAmpY = isMobile ? 4 : 11;
      const driftX = reducedMotion
        ? 0
        : Math.sin(angleDrift) * driftAmpX + Math.cos(angleDrift * 2) * (driftAmpX * 0.35);
      const driftY = reducedMotion
        ? 0
        : Math.cos(angleDrift) * driftAmpY + Math.sin(angleDrift * 2) * (driftAmpY * 0.35);

      // Secondary organic floating motion (very subtle micro-suspension)
      const floatX = reducedMotion ? 0 : Math.sin(timestamp / 3200) * (isMobile ? 1.0 : 2.2);
      const floatY = reducedMotion ? 0 : Math.cos(timestamp / 3900) * (isMobile ? 1.2 : 2.8);
      const subtleTilt = reducedMotion ? 0 : Math.sin(angleDrift) * 0.012;

      // DNA Center Anchor
      const centerX = width * (isMobile ? 0.50 : 0.52) + mouseOffsetX + driftX + floatX;
      const centerY = height * (isMobile ? 0.44 : 0.48) + mouseOffsetY + driftY + floatY;

      // ==========================================
      // SECTION B: AMBIENT DIGITAL ENVIRONMENT
      // (Very subtle background layer in the empty space)
      // ==========================================

      // 1. Curved Data Streamlines
      if (!isMobile || width > 480) {
        ctx.save();
        const activeStreams = isMobile ? dataStreams.slice(0, 1) : dataStreams;

        for (let sIdx = 0; sIdx < activeStreams.length; sIdx++) {
          const stream = activeStreams[sIdx];
          const p0: [number, number] = [stream.p0[0] * width, stream.p0[1] * height];
          const p1: [number, number] = [stream.p1[0] * width, stream.p1[1] * height];
          const p2: [number, number] = [stream.p2[0] * width, stream.p2[1] * height];
          const p3: [number, number] = [stream.p3[0] * width, stream.p3[1] * height];

          // Draw thin faint dashed curve
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.07)';
          ctx.lineWidth = 0.6;
          ctx.setLineDash([3, 8]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw small data packets traveling along stream
          const streamTau = reducedMotion ? 0 : (timestamp % stream.speed) / stream.speed;
          for (let p = 0; p < stream.packets.length; p++) {
            const pkt = stream.packets[p];
            const packetT = (streamTau + pkt.offset) % 1.0;
            const [ptX, ptY] = getCubicBezierPoint(packetT, p0, p1, p2, p3);

            // Packet edge fade
            const edgeFade = Math.sin(packetT * Math.PI);
            const pktAlpha = edgeFade * 0.18 * ambientGlowMod;

            if (pktAlpha > 0.03) {
              ctx.font = `600 ${pkt.size}px 'JetBrains Mono', monospace`;
              ctx.fillStyle = `rgba(167, 243, 208, ${pktAlpha})`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(pkt.token, ptX, ptY);

              // Tiny trailing glow bead
              ctx.beginPath();
              ctx.arc(ptX, ptY - 8, 1.2, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(52, 211, 153, ${pktAlpha * 0.7})`;
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }

      // 2. Technical Connection Points (Crosshairs & Node labels)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < technicalNodes.length; i++) {
        const tn = technicalNodes[i];
        const tx = tn.relX * width + mouseOffsetX * 0.2;
        const ty = tn.relY * height + mouseOffsetY * 0.2;

        // Subtle '+' crosshair
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.12)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(tx - 4, ty);
        ctx.lineTo(tx + 4, ty);
        ctx.moveTo(tx, ty - 4);
        ctx.lineTo(tx, ty + 4);
        ctx.stroke();

        // Tiny center node
        ctx.beginPath();
        ctx.arc(tx, ty, 1.0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167, 243, 208, 0.25)';
        ctx.fill();

        // Monospace coordinate label
        ctx.font = `600 7.5px 'JetBrains Mono', monospace`;
        ctx.fillStyle = 'rgba(52, 211, 153, 0.14)';
        ctx.fillText(tn.label, tx + 6, ty);
      }

      // 3. Peripheral Digital Fragments ('01', '10', '00', '11')
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < digitalFragments.length; i++) {
        const df = digitalFragments[i];
        const phase = df.phase + (reducedMotion ? 0 : timestamp * df.speed);
        const fragX = df.relX * width + Math.cos(phase) * df.orbitR + mouseOffsetX * 0.15;
        const fragY = df.relY * height + Math.sin(phase) * df.orbitR + mouseOffsetY * 0.15;

        const pulseAlpha = Math.max(0.04, Math.min(0.20, df.alpha + Math.sin(phase * 2) * 0.04));

        ctx.font = `600 ${df.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = `rgba(52, 211, 153, ${pulseAlpha * ambientGlowMod})`;
        ctx.fillText(df.char, fragX, fragY);
      }

      // 4. Ambient Floating Dust Particles
      for (let i = 0; i < ambientParticles.length; i++) {
        const ap = ambientParticles[i];
        if (!reducedMotion) {
          ap.x += ap.vx;
          ap.y += ap.vy;

          if (ap.x < -20) ap.x = width + 20;
          if (ap.x > width + 20) ap.x = -20;
          if (ap.y < -20) ap.y = height + 20;
          if (ap.y > height + 20) ap.y = -20;
        }

        const particleAngle = ap.phase + (reducedMotion ? 0 : timestamp * ap.orbitSpeed);
        const px = ap.x + Math.cos(particleAngle) * ap.orbitRadius + mouseOffsetX * 0.2;
        const py = ap.y + Math.sin(particleAngle) * ap.orbitRadius + mouseOffsetY * 0.2;

        const pulse = Math.sin(particleAngle * 2) * 0.03;
        const alpha = Math.max(0.04, Math.min(0.22, ap.baseAlpha + pulse)) * ambientGlowMod;

        ctx.beginPath();
        ctx.arc(px, py, ap.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
        ctx.fill();
      }

      // ==========================================
      // SECTION C: THE DNA DOUBLE HELIX (PRIMARY CENTERPIECE)
      // Recognizable Double Helix with fixed 3D perspective
      // and internal continuous flowing digital signals
      // ==========================================

      // Subtle diagonal: ~ -19.5 degrees from bottom-right towards top-left
      const diagonalAngle = (-19.5 * Math.PI) / 180 + subtleTilt;
      const ux = Math.cos(diagonalAngle);
      const uy = Math.sin(diagonalAngle);

      // Spine direction (bottom-right towards top-left)
      const spineUx = -ux;
      const spineUy = -uy;

      // Normal perpendicular vector
      const nx = -spineUy;
      const ny = spineUx;

      // Total spine length along diagonal
      const diagonalLength = Math.sqrt(width * width + height * height);
      const spineLength = diagonalLength * (isMobile ? 1.05 : 1.15);

      // Helix parameters (strictly responsive)
      const nodeCount = isMobile ? 42 : isTablet ? 56 : 68;
      const helixRadius = isMobile ? 42 : isTablet ? 72 : 98;
      const turns = isMobile ? 2.4 : 3.0; // Number of full twists

      // FIXED STRUCTURAL PERSPECTIVE
      // The DNA is held at fixed 3D perspective angle (0.42 rad) so its double helix
      // silhouette, crossings, and base pairs are permanently visible and recognizable.
      const fixedPerspective = 0.42;

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

      // INTERNAL DIGITAL FLOW
      // Tokens shift smoothly along the helix nodes every 8.0s
      // 12 tokens in array: at tauFlow = 1.0, 12 * 1.0 = 12 = 0 mod 12 (seamless!)
      const tokenCycleCount = 12;
      const tokenContinuousShift = tauFlow * tokenCycleCount;

      for (let i = 0; i <= nodeCount; i++) {
        const progress = i / nodeCount; // 0 (bottom-right) to 1 (top-left)
        const s = (progress - 0.5) * spineLength;

        // Subtle natural organic curvature along spine
        const curveOffset = Math.sin(progress * Math.PI) * (isMobile ? 14 : 28);

        const spineX = centerX + spineUx * s + nx * curveOffset;
        const spineY = centerY + spineUy * s + ny * curveOffset;

        // FIXED 3D helical angle along the spine
        const baseAngleA = progress * (turns * twoPi) + fixedPerspective;
        const baseAngleB = baseAngleA + Math.PI;

        // Fade envelope at spine ends
        const fadeEnvelope = Math.sin(progress * Math.PI);

        // INTERNAL TRAVELING DATA WAVE (Pulsing photonic energy along the strands)
        // 3 wave crests traversing the strands every 8.0 seconds
        const wavePhase = progress * (3 * twoPi) - tauFlow * twoPi;
        const travelingPulse = Math.cos(wavePhase); // in [-1, 1]
        const normalizedPulse = (travelingPulse + 1) * 0.5; // in [0, 1]

        // Very subtle micro-flexing along the wave (1.5px desktop, 0.7px mobile)
        const microFlex = reducedMotion ? 0 : travelingPulse * (isMobile ? 0.7 : 1.5);
        const currentRadius = helixRadius * (0.72 + fadeEnvelope * 0.35) + microFlex;

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

        // CONTINUOUS STREAMING OF DIGITAL CODE TOKENS ('01', '10', '00', '11')
        const codeIndexA = Math.floor((i - tokenContinuousShift) % tokenCycleCount + tokenCycleCount) % tokenCycleCount;
        const codeIndexB = Math.floor((i + 5 - tokenContinuousShift) % tokenCycleCount + tokenCycleCount) % tokenCycleCount;

        const codeA = BINARY_BITS[codeIndexA];
        const codeB = BINARY_BITS[codeIndexB];

        // Depth projection (-1 to 1)
        const normZA = zA / helixRadius;
        const normZB = zB / helixRadius;

        // Strand A: Depth-based lighting + Traveling wave boost
        const depthAlphaA = normZA > 0 ? 0.65 + normZA * 0.35 : 0.22 + (1 + normZA) * 0.25;
        const waveBoostA = normalizedPulse * 0.22;
        const effectiveAlphaA = Math.min(1, (depthAlphaA + waveBoostA) * (0.35 + fadeEnvelope * 0.65) * ambientGlowMod);

        const sizeA = isMobile
          ? normZA > 0 ? 9.5 : 7.5
          : normZA > 0 ? 11.5 : 8.5;

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
            ? `rgba(52, 211, 153, ${(0.3 + normalizedPulse * 0.25) * ambientGlowMod})`
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

        // Strand B: Depth-based lighting + Traveling wave boost
        const depthAlphaB = normZB > 0 ? 0.65 + normZB * 0.35 : 0.22 + (1 + normZB) * 0.25;
        const waveBoostB = normalizedPulse * 0.22;
        const effectiveAlphaB = Math.min(1, (depthAlphaB + waveBoostB) * (0.35 + fadeEnvelope * 0.65) * ambientGlowMod);

        const sizeB = isMobile
          ? normZB > 0 ? 9.5 : 7.5
          : normZB > 0 ? 11.5 : 8.5;

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
            ? `rgba(52, 211, 153, ${(0.3 + normalizedPulse * 0.25) * ambientGlowMod})`
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

        // CONNECTING BASE-PAIR RUNGS (Occur regularly every 2 nodes)
        if (i % 2 === 0) {
          const avgZ = (zA + zB) / 2;
          const rungIndex = i / 2;
          const rungTokenIndex = Math.floor((rungIndex - tokenContinuousShift) % tokenCycleCount + tokenCycleCount) % tokenCycleCount;
          const codePair = BASE_PAIR_TOKENS[rungTokenIndex];

          const rungBaseAlpha = (0.28 + fadeEnvelope * 0.4) * (avgZ > 0 ? 1.0 : 0.65);
          const rungPulseAlpha = Math.min(0.75, (rungBaseAlpha + normalizedPulse * 0.2) * ambientGlowMod);

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

      // 1. Draw continuous smooth lines tracing Strand A and Strand B
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

      // 2. Depth-Sorted Rendering for Base-Pair Rungs and Digital Nodes
      type RenderItem =
        | { type: 'rung'; z: number; rung: HelixRung }
        | { type: 'node'; z: number; node: HelixNode };

      const renderQueue: RenderItem[] = [];

      rungs.forEach((r) => renderQueue.push({ type: 'rung', z: r.avgZ, rung: r }));
      nodesA.forEach((n) => renderQueue.push({ type: 'node', z: n.z, node: n }));
      nodesB.forEach((n) => renderQueue.push({ type: 'node', z: n.z, node: n }));

      // Render strictly back-to-front
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
          ctx.lineWidth = isMobile ? 0.75 : 1.1;
          ctx.setLineDash([2, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Base-pair token at midpoint
          const midX = (r.nodeA.screenX + r.nodeB.screenX) / 2;
          const midY = (r.nodeA.screenY + r.nodeB.screenY) / 2;

          ctx.font = `600 ${isMobile ? 7 : 8.5}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = r.pulse > 0.7 ? '#a7f3d0' : `rgba(167, 243, 208, ${r.alpha * 0.9})`;
          ctx.fillText(r.codePair, midX, midY);
        } else {
          const n = item.node;

          // Node junction anchor dot
          ctx.beginPath();
          ctx.arc(n.screenX, n.screenY, isMobile ? 1.7 : 2.2, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.globalAlpha = Math.min(1, n.alpha * 1.15);
          ctx.fill();

          // Soft luminous bloom for front nodes and traveling wave crests
          if (n.glow) {
            ctx.shadowColor = n.glow;
            ctx.shadowBlur = isMobile ? 4 : 8;
          } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }

          // Digital binary character glyph ('01', '10', '00', '11')
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

      initAmbientEnvironment();

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
      {/* LAYER 0: Deep background base (#07090e dark technical canvas) */}
      <div className="absolute inset-0 bg-[#07090e]" />

      {/* LAYER 1: Ambient Radial Light Blooms (Soft atmospheric depth behind DNA) */}
      <div className="absolute top-[26%] left-1/2 -translate-x-1/2 w-[580px] sm:w-[840px] lg:w-[1040px] h-[340px] sm:h-[500px] bg-emerald-500/[0.065] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-[12%] right-[10%] w-[320px] sm:w-[460px] h-[300px] bg-teal-500/[0.035] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[16%] left-[8%] w-[300px] sm:w-[420px] h-[260px] bg-emerald-600/[0.035] blur-[140px] rounded-full pointer-events-none" />

      {/* LAYER 2: Refined, Spacious Technical Grid (76px x 76px pattern, low opacity, soft edge fade) */}
      <svg
        className="absolute inset-0 w-full h-full text-emerald-500/[0.018]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="hero-dna-grid-pattern"
            width="76"
            height="76"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 76 0 L 0 0 0 76"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            {/* Faint crosshair nodes at grid intersections */}
            <circle cx="76" cy="0" r="0.8" fill="#34d399" opacity="0.22" />
            <circle cx="0" cy="76" r="0.8" fill="#34d399" opacity="0.22" />
          </pattern>

          <radialGradient id="hero-dna-grid-radial" cx="50%" cy="46%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="52%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="hero-dna-grid-linear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.45" />
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

      {/* LAYER 3: Interactive Canvas (Ambient data streamlines, fragments, particles, and DNA Double Helix) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Atmospheric perimeter vignettes (Darker edges to frame central focus) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/70 via-transparent to-[#07090e] pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-24 sm:w-36 bg-gradient-to-r from-[#07090e] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 sm:w-36 bg-gradient-to-l from-[#07090e] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent pointer-events-none" />
    </div>
  );
};
