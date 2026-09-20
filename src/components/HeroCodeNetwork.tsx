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
      const length = mobile ? width * 1.25 : Math.max(width * 1.05, 860);
      const startX = width * 0.94 + pointerX * 10;
      const startY = height * 0.82 + pointerY * 8;
      const angle = -Math.PI + 0.34;
      const amplitude = mobile ? 34 : 66;
      const step = length / (count - 1);
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
          ctx.strokeStyle = `rgba(110, 231, 183, ${alpha * 0.5})`;
          ctx.lineWidth = 0.9 + depth(i) * 1.1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.fillStyle = `rgba(167,243,208,${alpha * 0.55})`;
          ctx.beginPath(); ctx.arc(a.x, a.y, 1.4 + depth(i) * 1.8, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(b.x, b.y, 1.4 + depth(i) * 1.8, 0, Math.PI * 2); ctx.fill();
        }
        [a, b].forEach((p, side) => {
          const token = TOKENS[(i * 3 + side * 5) % TOKENS.length];
          ctx.fillStyle = `rgba(${side ? '52,211,153' : '167,243,208'}, ${Math.min(0.92, alpha + 0.12)})`;
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
      <div className="absolute left-[24%] top-[16%] h-[62%] w-[58%] rounded-full bg-emerald-400/[0.11] blur-[110px]" />
      <div className="absolute left-[42%] top-[28%] h-[30%] w-[28%] rounded-full bg-teal-300/[0.08] blur-[80px]" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(52,211,153,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.055) 1px, transparent 1px)', backgroundSize: '58px 58px', maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 72%)' }} />
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#05070b]/25 via-transparent to-[#05070b]/72" />
    </div>
  );
};
