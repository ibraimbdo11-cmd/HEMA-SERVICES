import React, { useEffect, useMemo, useRef, useState } from 'react';

interface HeroCodeNetworkProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
}

const codeTokens = [
  'const', '=>', '{ }', 'async', 'API', '</>', 'return', 'JSON',
  'await', 'fetch()', '0x7F', 'useState', 'function', '{}', 'npm', 'if',
];

const DNA_POINTS = 18;

export const HeroCodeNetwork: React.FC<HeroCodeNetworkProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0, active: false });
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 640 ? 18 : width < 1024 ? 28 : 42;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        radius: 0.6 + Math.random() * 1.4,
        alpha: 0.08 + Math.random() * 0.24,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const currentPointer = pointerRef.current;
      const mouseX = currentPointer.active ? currentPointer.x : width * 0.55;
      const mouseY = currentPointer.active ? currentPointer.y : height * 0.46;

      particles.forEach((p) => {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.phase += 0.006;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = currentPointer.active ? Math.max(0, 1 - distance / 190) : 0;
        const alpha = p.alpha + Math.sin(p.phase) * 0.035 + influence * 0.12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + influence * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${Math.max(0.03, alpha)})`;
        ctx.fill();
      });

      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    resize();
    frame = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  const dnaTokens = useMemo(() => {
    return Array.from({ length: DNA_POINTS }, (_, index) => ({
      left: codeTokens[(index * 2) % codeTokens.length],
      right: codeTokens[(index * 2 + 5) % codeTokens.length],
      rung: codeTokens[(index + 3) % codeTokens.length],
      delay: `${(index * 0.13).toFixed(2)}s`,
    }));
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nextPointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    };
    pointerRef.current = nextPointer;
    setPointer(nextPointer);
  };

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-0 pointer-events-auto overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerRef.current = { ...pointerRef.current, active: false };
        setPointer((current) => ({ ...current, active: false }));
      }}
    >
      {/* Ambient atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(16,185,129,0.08),transparent_34%),radial-gradient(circle_at_82%_38%,rgba(20,184,166,0.06),transparent_28%)]" />
      <div className="absolute inset-0 opacity-[0.32] hero-grid" />

      {/* Code DNA: intentionally built from DOM code tokens rather than an image. */}
      <div
        className="hero-dna absolute left-1/2 top-[47%] w-[760px] sm:w-[920px] lg:w-[1120px] h-[360px] sm:h-[420px] lg:h-[500px]"
        style={{
          transform: `translate(-50%, -50%) rotate(20deg) translate(${pointer.active ? pointer.x * 0.012 - 4 : 0}px, ${pointer.active ? pointer.y * 0.008 - 3 : 0}px)`,
        }}
      >
        <div className="hero-dna-aura" />
        {dnaTokens.map((token, index) => {
          const t = index / (DNA_POINTS - 1);
          const y = 30 + t * 440;
          const wave = Math.sin(t * Math.PI * 3.2) * 112;
          const depth = Math.sin(t * Math.PI * 2.8);
          const leftX = 50 + wave;
          const rightX = 50 - wave;
          const fade = 0.25 + Math.sin(t * Math.PI) * 0.75;
          const scale = 0.82 + (depth + 1) * 0.09;

          return (
            <React.Fragment key={index}>
              <span
                className="hero-dna-token hero-dna-left"
                style={{
                  top: `${y}px`,
                  left: `${leftX}%`,
                  opacity: fade,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  animationDelay: token.delay,
                }}
              >
                {token.left}
              </span>
              <span
                className="hero-dna-token hero-dna-right"
                style={{
                  top: `${y}px`,
                  left: `${rightX}%`,
                  opacity: fade,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  animationDelay: `${(index * 0.13 + 0.06).toFixed(2)}s`,
                }}
              >
                {token.right}
              </span>
              <span
                className="hero-dna-rung"
                style={{
                  top: `${y}px`,
                  left: `${50}%`,
                  width: `${Math.max(42, Math.abs(leftX - rightX) * 0.82)}%`,
                  opacity: fade * 0.45,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span>{token.rung}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Sparse code fragments at the edges */}
      <div className="absolute inset-0 pointer-events-none font-mono text-[9px] sm:text-[10px] text-emerald-300/20">
        <span className="absolute top-[17%] left-[7%]">const HEMA = {'{}'}</span>
        <span className="absolute top-[29%] right-[8%]">async function()</span>
        <span className="absolute bottom-[22%] left-[9%]">API // 0x7F</span>
        <span className="absolute bottom-[16%] right-[11%]">return {'<HEMA/>'}</span>
      </div>

      {/* Edge fades */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/72 via-transparent to-[#07090e]/90 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07090e] via-[#07090e]/75 to-transparent pointer-events-none" />
    </div>
  );
};
