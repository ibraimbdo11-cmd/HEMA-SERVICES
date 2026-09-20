import React, { useEffect, useRef, useState } from 'react';

interface HeroCodeNetworkProps { className?: string }

const TOKENS = ['const', 'function', 'return', 'async', 'await', 'API', 'JSON', '<>', '{}', '=>', '0x7F', 'useState', 'fetch', 'npm', 'if', 'else'];

export const HeroCodeNetwork: React.FC<HeroCodeNetworkProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !container || !ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let pointerX = 0;
    let pointerY = 0;
    let time = 0;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    };
    const onPointerLeave = () => { pointerX = 0; pointerY = 0; };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const mobile = width < 640;
      const count = mobile ? 30 : 52;
      const length = mobile ? width * 1.35 : Math.max(width * 0.9, 760);
      const startX = width * 0.08 + pointerX * 10;
      const startY = height * 0.84 + pointerY * 8;
      const angle = -0.34;
      const amplitude = mobile ? 40 : 72;
      const step = length / count;
      const depth = (i: number) => 0.42 + 0.58 * ((Math.sin(i * 0.52 + time * 0.28) + 1) / 2);
      const point = (i: number, side: number) => {
        const u = i * step;
        const wave = Math.sin(i * 0.52 + time * 0.22) * amplitude * side;
        return {
          x: startX + u * Math.cos(angle) - wave * Math.sin(angle),
          y: startY + u * Math.sin(angle) + wave * Math.cos(angle),
        };
      };
      ctx.save();
      ctx.lineCap = 'round';
      ctx.font = `${mobile ? 8 : 10}px JetBrains Mono, monospace`;
      for (let i = 0; i < count; i++) {
        const a = point(i, 1);
        const b = point(i, -1);
        const alpha = (0.2 + depth(i) * 0.48) * (mobile ? 0.72 : 1);
        if (i % 2 === 0) {
          ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 0.28})`;
          ctx.lineWidth = 0.7 + depth(i) * 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        [a, b].forEach((p, side) => {
          const token = TOKENS[(i * 3 + side * 5) % TOKENS.length];
          ctx.fillStyle = `rgba(${side ? '16,185,129' : '110,231,183'}, ${alpha})`;
          ctx.fillText(token, p.x - ctx.measureText(token).width / 2, p.y + 3);
          if (depth(i) > 0.72) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(16,185,129,.35)';
            ctx.fillStyle = `rgba(167,243,208,${alpha * 0.7})`;
            ctx.fillText(token, p.x - ctx.measureText(token).width / 2, p.y + 3);
            ctx.shadowBlur = 0;
          }
        });
      }
      for (let i = 0; i < count; i += 3) {
        const p = point(i, i % 2 ? 1 : -1);
        ctx.fillStyle = `rgba(110,231,183,${0.14 + depth(i) * 0.22})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1 + depth(i) * 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (!reducedMotion) { time += 0.018; frame = requestAnimationFrame(draw); }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
    resize(); draw();
    return () => { observer.disconnect(); container.removeEventListener('pointermove', onPointerMove); container.removeEventListener('pointerleave', onPointerLeave); cancelAnimationFrame(frame); };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden select-none z-0 ${className}`} aria-hidden="true">
      <div className="absolute left-[32%] top-[24%] h-[38%] w-[42%] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(52,211,153,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.035) 1px, transparent 1px)', backgroundSize: '58px 58px', maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 72%)' }} />
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07090e]/55 via-transparent to-[#07090e]" />
    </div>
  );
};
