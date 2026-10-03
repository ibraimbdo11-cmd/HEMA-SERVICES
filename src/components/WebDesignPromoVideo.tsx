import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Smartphone,
  Layout,
  FileText,
  Lock,
  Database,
  Code2,
  Briefcase,
  Globe,
  Compass,
  Monitor,
  Tablet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WebDesignPromoVideoProps {
  onStartProject: () => void;
  onOpenSupport?: () => void;
}

// Total Duration: Exactly 48.0 seconds matching the authentic commercial master track
const TOTAL_DURATION = 48.0;

export const WebDesignPromoVideo: React.FC<WebDesignPromoVideoProps> = ({
  onStartProject,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-hide controls timer
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !isDraggingScrubber) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2800);
    }
  }, [isPlaying, isDraggingScrubber]);

  // Sync state with HTML Audio element
  const syncPlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Autoplay policy or media load delay handled gracefully
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    syncPlayback();
  }, [isPlaying, syncPlayback]);

  // Continuous time tracking loop for smooth 60fps visuals locked to audio
  useEffect(() => {
    let lastTime = performance.now();

    const tick = () => {
      if (isPlaying && !isDraggingScrubber) {
        if (audioRef.current && !audioRef.current.paused && audioRef.current.currentTime > 0) {
          const audioTime = audioRef.current.currentTime;
          setCurrentTime(audioTime);

          if (audioTime >= TOTAL_DURATION) {
            setIsPlaying(false);
            setCurrentTime(TOTAL_DURATION);
            return;
          }
        } else {
          const now = performance.now();
          const delta = (now - lastTime) / 1000;
          lastTime = now;

          setCurrentTime((prev) => {
            const next = prev + delta;
            if (next >= TOTAL_DURATION) {
              setIsPlaying(false);
              return TOTAL_DURATION;
            }
            return next;
          });
        }
      } else {
        lastTime = performance.now();
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isDraggingScrubber]);

  // Handle Play/Pause
  const togglePlay = () => {
    setHasStarted(true);
    setHasError(false);

    if (currentTime >= TOTAL_DURATION) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
    resetControlsTimeout();
  };

  // Handle Restart
  const handleRestart = () => {
    if (audioRef.current) audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(true);
    resetControlsTimeout();
  };

  // Handle Seek
  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION, newTime));
    setCurrentTime(clamped);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  // ========================================================
  // RTL PROGRESS BAR & SEEK INTERACTION (CRITICAL FIX)
  // Track starts at RIGHT (0s) and ends at LEFT (48s).
  // Fill expands from right to left.
  // Thumb moves from right to left.
  // Seeking maps clientX distance from right edge to time.
  // ========================================================
  const handleScrubberChange = (clientX: number) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    // In RTL: right edge is 0 (start), left edge is 1 (end)
    const distFromRight = rect.right - clientX;
    const ratio = Math.max(0, Math.min(1, distFromRight / rect.width));
    handleSeek(ratio * TOTAL_DURATION);
  };

  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingScrubber(true);
    handleScrubberChange(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleScrubberChange(moveEvent.clientX);
    };

    const onMouseUp = () => {
      setIsDraggingScrubber(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resetControlsTimeout();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleScrubberTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDraggingScrubber(true);
    handleScrubberChange(e.touches[0].clientX);

    const onTouchMove = (moveEvent: TouchEvent) => {
      handleScrubberChange(moveEvent.touches[0].clientX);
    };

    const onTouchEnd = () => {
      setIsDraggingScrubber(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      resetControlsTimeout();
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };

  // Mute / Volume
  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (audioRef.current) {
      audioRef.current.muted = newMute;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard Navigation on Desktop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        // In RTL: ArrowLeft advances forward
        e.preventDefault();
        handleSeek(currentTime + 5);
      } else if (e.code === 'ArrowRight') {
        // In RTL: ArrowRight seeks backward
        e.preventDefault();
        handleSeek(currentTime - 5);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTime, isPlaying, isMuted]);

  // Format Time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine current active scene based on precise voiceover timing:
  // Scene 1: 0.0s - 5.5s
  // Scene 2: 5.5s - 11.0s
  // Scene 3: 11.0s - 17.5s
  // Scene 4: 17.5s - 24.5s
  // Scene 5: 24.5s - 30.5s
  // Scene 6: 30.5s - 38.0s
  // Scene 7: 38.0s - 44.5s
  // Scene 8: 44.5s - 48.0s
  let sceneIndex = 1;
  if (currentTime >= 44.5) sceneIndex = 8;
  else if (currentTime >= 38.0) sceneIndex = 7;
  else if (currentTime >= 30.5) sceneIndex = 6;
  else if (currentTime >= 24.5) sceneIndex = 5;
  else if (currentTime >= 17.5) sceneIndex = 4;
  else if (currentTime >= 11.0) sceneIndex = 3;
  else if (currentTime >= 5.5) sceneIndex = 2;
  else sceneIndex = 1;

  // Exact progress ratio from 0 to 1
  const progressRatio = Math.max(0, Math.min(1, currentTime / TOTAL_DURATION));
  const progressPercentage = progressRatio * 100;

  return (
    <div
      ref={containerRef}
      dir="rtl"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#06090E] border border-white/[0.08] shadow-2xl select-none text-right transition-all group font-cairo ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen'
          : 'aspect-[16/10] sm:aspect-[16/9] min-h-[380px] sm:min-h-[480px] max-h-[600px]'
      }`}
    >
      {/* Master Voiceover & Ambient Sound Effects Track */}
      <audio
        ref={audioRef}
        src="/audio/hema_promo_final_mix.mp3"
        preload="auto"
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(TOTAL_DURATION);
        }}
        onError={() => setHasError(true)}
      />

      {/* ========================================================
          BACKGROUND: HEMA Dark Technical Minimal Environment
      ======================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle digital grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(0, 255, 157, 0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Slow moving geometric accent lines */}
        <div
          className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00FF9D]/25 to-transparent transition-transform duration-1000"
          style={{ transform: `translateX(${((currentTime * 3) % 80) - 40}px)` }}
        />

        {/* Soft, calm green ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] bg-emerald-500/[0.05] rounded-full blur-3xl transition-transform duration-700 pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) scale(${1 + (sceneIndex % 4) * 0.04})`,
          }}
        />

        {/* Top Minimal HUD Header (Mobile-Friendly, RTL correctly aligned) */}
        <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-5 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 border border-white/[0.07] backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
            <span className="font-bold text-slate-200">HEMA SERVICES</span>
          </div>

          <div className="px-2.5 py-1 rounded-md bg-black/50 border border-white/[0.07] text-emerald-400/90 font-medium backdrop-blur-xs">
            0{sceneIndex} / 08
          </div>
        </div>
      </div>

      {/* ========================================================
          SCENE CANVAS (Safe Area: pt-12 pb-16 px-4, Mobile-First, NO Truncate)
      ======================================================== */}
      <div className="absolute inset-0 flex items-center justify-center pt-12 sm:pt-14 pb-14 sm:pb-16 px-4 sm:px-8 z-10 pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ----------------------------------------------------
              SCENE 1 (0:00 - 5.5s) — Hook Question
          ---------------------------------------------------- */}
          {sceneIndex === 1 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-xl text-center space-y-3 sm:space-y-4 px-2"
            >
              <h2
                className={`text-lg sm:text-2xl md:text-3xl font-black font-cairo tracking-tight leading-snug transition-all duration-500 break-words ${
                  currentTime >= 2.6
                    ? 'text-slate-400/60 scale-[0.98]'
                    : 'text-slate-100 scale-100'
                }`}
              >
                هل تبحث عن مصمم مواقع محترف؟
              </h2>

              {currentTime >= 2.6 && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="text-xs sm:text-base md:text-lg font-medium text-emerald-300 font-cairo leading-relaxed break-words max-w-md mx-auto"
                >
                  موقع يعكس مشروعك ويقدم تجربة احترافية لعملائك؟
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 2 (5.5s - 11.0s) — Pathway (Idea -> Live Site)
          ---------------------------------------------------- */}
          {sceneIndex === 2 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl text-center space-y-4 sm:space-y-6 px-2"
            >
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-400 font-cairo">
                  نصمم ونطور مواقع
                </p>
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-[#00FF9D] to-teal-300 font-cairo break-words">
                  مخصصة لاحتياجات مشروعك
                </h2>
              </div>

              {/* RTL Pathway from Right to Left: فكرة → تصميم → تطوير → موقع جاهز */}
              <div className="pt-2 px-1">
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3 relative">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 right-4 left-4 h-[2px] -translate-y-1/2 bg-white/[0.08] z-0" />
                  <div
                    className="absolute top-1/2 right-4 h-[2px] -translate-y-1/2 bg-[#00FF9D] transition-all duration-300 z-0"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((currentTime - 5.5) / 5) * 100))}%`,
                    }}
                  />

                  {[
                    { step: 'فكرة', time: 5.6 },
                    { step: 'تصميم', time: 7.0 },
                    { step: 'تطوير', time: 8.4 },
                    { step: 'موقع جاهز', time: 9.8 },
                  ].map((node, i) => {
                    const isReached = currentTime >= node.time;
                    return (
                      <div
                        key={i}
                        className="relative z-10 flex flex-col items-center space-y-1 sm:space-y-1.5"
                      >
                        <div
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isReached
                              ? 'bg-[#00FF9D] text-slate-950 shadow-[0_0_12px_rgba(0,255,157,0.4)] scale-105'
                              : 'bg-[#0A0E17] text-slate-500 border border-white/[0.1]'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-bold font-cairo text-center leading-tight whitespace-normal ${
                            isReached ? 'text-slate-100' : 'text-slate-500'
                          }`}
                        >
                          {node.step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 3 (11.0s - 17.5s) — Responsive Mockup & Cued Words
          ---------------------------------------------------- */}
          {sceneIndex === 3 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl flex flex-col items-center space-y-3 sm:space-y-4 px-2"
            >
              {/* Abstract Frame Morphing (Desktop -> Tablet -> Mobile) */}
              <div className="relative w-full flex items-center justify-center h-28 sm:h-34">
                <motion.div
                  animate={{
                    width: currentTime >= 15.2 ? '130px' : currentTime >= 13.4 ? '200px' : '260px',
                    height: currentTime >= 15.2 ? '105px' : '95px',
                  }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  className="rounded-xl border border-white/[0.14] bg-[#0E1524] p-2 flex flex-col justify-between shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-400">
                      {currentTime >= 15.2 ? 'MOBILE' : currentTime >= 13.4 ? 'TABLET' : 'DESKTOP'}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <div className="h-2 w-3/4 rounded bg-emerald-400/30" />
                    <div className="h-1.5 w-full rounded bg-white/[0.08]" />
                    <div className="h-1.5 w-2/3 rounded bg-white/[0.06]" />
                  </div>

                  <div className="h-2.5 w-1/3 rounded bg-[#00FF9D]/40 mr-auto" />
                </motion.div>
              </div>

              {/* Sequential Cued Words with Clear Bilingual Badges */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {currentTime >= 11.4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5"
                  >
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Responsive (متجاوب)</span>
                  </motion.div>
                )}

                {currentTime >= 13.6 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5"
                  >
                    <Tablet className="w-3.5 h-3.5 text-[#00FF9D]" />
                    <span>Modern UI (عصري)</span>
                  </motion.div>
                )}

                {currentTime >= 15.5 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>User Friendly (مريح)</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 4 (17.5s - 24.5s) — Capabilities (Full Text, No Truncate)
          ---------------------------------------------------- */}
          {sceneIndex === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xl text-center space-y-2.5 sm:space-y-3.5 px-2"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 font-cairo">
                إمكانيات متكاملة حسب احتياج مشروعك
              </h3>

              {/* 6 Capabilities Cards — Wraps text naturally on 2 lines */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Pages', ar: 'صفحات متعددة', icon: Layers, time: 17.6 },
                  { name: 'Forms', ar: 'نماذج واستمارات', icon: FileText, time: 18.8 },
                  { name: 'Animations', ar: 'حركات وتفاعلات', icon: Layout, time: 20.0 },
                  { name: 'Authentication', ar: 'تسجيل دخول وتوثيق', icon: Lock, time: 21.2 },
                  { name: 'Backend', ar: 'أنظمة وواجهات برمجية', icon: Code2, time: 22.4 },
                  { name: 'Database', ar: 'قواعد بيانات سريعة', icon: Database, time: 23.4 },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  const isVisible = currentTime >= item.time;
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border text-right flex items-center gap-2 transition-all duration-300 min-h-[46px] ${
                        isVisible
                          ? 'bg-[#0B101A] border-emerald-500/40 text-slate-100 shadow-sm'
                          : 'bg-[#080B12]/40 border-white/[0.04] text-slate-600 opacity-30'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isVisible
                            ? 'bg-emerald-500/15 text-[#00FF9D]'
                            : 'bg-white/[0.02] text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="text-[11px] sm:text-xs font-mono font-bold whitespace-normal">
                          {item.name}
                        </div>
                        <div className="text-[9.5px] sm:text-[10px] text-slate-400 font-cairo whitespace-normal">
                          {item.ar}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 5 (24.5s - 30.5s) — 4 Website Types (Full Text)
          ---------------------------------------------------- */}
          {sceneIndex === 5 && (
            <motion.div
              key="scene-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xl text-center space-y-2.5 sm:space-y-3.5 px-2"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 font-cairo">
                مناسب لمختلف أنواع المشاريع
              </h3>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {[
                  { title: 'Business Website', ar: 'مواقع الشركات والأعمال', icon: Briefcase, time: 24.7 },
                  { title: 'Service Website', ar: 'مواقع الخدمات والحجز', icon: Globe, time: 26.2 },
                  { title: 'Landing Page', ar: 'صفحات الهبوط الترويجية', icon: Compass, time: 27.6 },
                  { title: 'Portfolio Website', ar: 'معارض الأعمال الشخصية', icon: Layout, time: 29.0 },
                ].map((type, idx) => {
                  const Icon = type.icon;
                  const isActive = currentTime >= type.time;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center space-y-1 transition-all duration-300 min-h-[72px] justify-center ${
                        isActive
                          ? 'bg-[#0B101A] border-emerald-500/40 text-slate-100 shadow-md scale-[1.01]'
                          : 'bg-[#080B12]/50 border-white/[0.04] text-slate-600 opacity-40'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-emerald-500/15 text-[#00FF9D]'
                            : 'bg-white/[0.02] text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 w-full">
                        <div className="text-[11px] sm:text-xs font-mono font-bold whitespace-normal leading-tight">
                          {type.title}
                        </div>
                        <div className="text-[9.5px] sm:text-[10px] text-slate-400 font-cairo whitespace-normal leading-tight">
                          {type.ar}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 6 (30.5s - 38.0s) — Workflow Timeline (Full Text)
          ---------------------------------------------------- */}
          {sceneIndex === 6 && (
            <motion.div
              key="scene-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xl text-center space-y-3 px-2"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 font-cairo">
                مراحل العمل من البداية حتى التسليم
              </h3>

              {/* 5 Timeline steps in RTL order */}
              <div className="grid grid-cols-5 gap-1 sm:gap-1.5 relative">
                {[
                  { step: '1', title: 'متطلباتك', time: 30.8 },
                  { step: '2', title: 'مناقشة الفكرة', time: 32.2 },
                  { step: '3', title: 'التصميم والتطوير', time: 33.6 },
                  { step: '4', title: 'المراجعة', time: 35.0 },
                  { step: '5', title: 'التسليم', time: 36.4 },
                ].map((item, idx) => {
                  const isDone = currentTime >= item.time;
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border flex flex-col items-center text-center space-y-1 transition-all duration-300 min-h-[58px] justify-center ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-[#080B12]/40 border-white/[0.04] text-slate-600'
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs font-mono font-bold">{item.step}</span>
                      <span className="text-[9px] sm:text-[10.5px] font-bold font-cairo leading-tight whitespace-normal">
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {currentTime >= 36.4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-cairo"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF9D]" />
                  <span>تسليم وتشغيل متكامل</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 7 (38.0s - 44.5s) — The Vision & Motivational Call
          ---------------------------------------------------- */}
          {sceneIndex === 7 && (
            <motion.div
              key="scene-7"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl text-center space-y-3 sm:space-y-4 px-2"
            >
              <p className="text-sm sm:text-xl font-bold text-slate-400 font-cairo break-words">
                لديك مشروع في ذهنك؟
              </p>

              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-[#00FF9D] to-teal-300 font-cairo tracking-tight leading-snug drop-shadow-md break-words">
                لنحوّل فكرتك إلى موقع حقيقي
              </h2>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 8 (44.5s - 48.0s) — Final HEMA CTA
          ---------------------------------------------------- */}
          {sceneIndex === 8 && (
            <motion.div
              key="scene-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md text-center space-y-3 px-2 pointer-events-auto"
            >
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-xl font-black text-slate-100 font-cairo">
                  HEMA Services
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                  Web Design & Development
                </p>
              </div>

              {/* Native HEMA CTA Button */}
              <button
                type="button"
                onClick={onStartProject}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#00FF9D] hover:bg-[#1affaa] active:scale-[0.98] text-slate-950 font-black text-sm sm:text-base font-cairo transition-all shadow-[0_0_20px_rgba(0,255,157,0.35)] flex items-center justify-center gap-2 cursor-pointer mx-auto"
              >
                <span>ابدأ مشروعك الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================
          INITIAL POSTER STATE (Clean, Centered HEMA Play Button)
      ======================================================== */}
      {!hasStarted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-[#06090E]/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-20 cursor-pointer pointer-events-auto"
        >
          <div className="relative mb-3 group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00FF9D] text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,157,0.4)] group-hover:scale-105 active:scale-95 transition-transform">
              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-slate-950 ml-1 text-slate-950" />
            </div>
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className="text-base sm:text-xl font-black text-slate-100 font-cairo">
              فيديو تعريفي بخدمة تصميم المواقع
            </h3>
            <p className="text-xs text-slate-400 font-cairo">
              عرض إعلاني رقمي بصوت عربي احترافي يشرح مميزات ومراحل الخدمة.
            </p>
          </div>
        </div>
      )}

      {/* Error Fallback (Graceful HEMA format) */}
      {hasError && (
        <div className="absolute inset-0 bg-[#06090E]/90 flex flex-col items-center justify-center p-4 text-center z-25 pointer-events-auto">
          <p className="text-sm text-slate-300 font-cairo mb-3">
            تعذر تحميل الصوت، يمكنك متابعة العرض بصرياً.
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold font-cairo border border-emerald-500/40"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ========================================================
          CUSTOM HEMA CONTROLS BAR (Auto-hiding, Touch-friendly)
      ======================================================== */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-2.5 sm:p-4 z-30 transition-opacity duration-300 pointer-events-auto ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* ========================================================
            RTL PROGRESS BAR: Starts at Right, advances to Left.
            Fill & Thumb share identical coordinates and direction.
        ======================================================== */}
        <div
          ref={progressBarRef}
          onMouseDown={handleScrubberMouseDown}
          onTouchStart={handleScrubberTouchStart}
          className="relative w-full h-4 sm:h-3.5 flex items-center cursor-pointer group/bar mb-2.5 touch-none select-none"
        >
          {/* Neutral Track */}
          <div className="w-full h-1.5 bg-white/[0.14] rounded-full overflow-hidden relative">
            {/* Active HEMA Green Fill (Expands from RIGHT in RTL) */}
            <div
              className="h-full bg-[#00FF9D] absolute right-0 top-0 transition-all duration-75"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Thumb Indicator (Anchored to right edge, moves towards left) */}
          <div
            className="absolute top-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(0,255,157,0.9)] pointer-events-none transition-all duration-75"
            style={{
              right: `${progressPercentage}%`,
              transform: 'translate(50%, -50%)',
            }}
          />
        </div>

        {/* Control Buttons & Timings */}
        <div className="flex items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Replay Button */}
            <button
              type="button"
              onClick={handleRestart}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="إعادة التشغيل من البداية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Mute/Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-colors cursor-pointer ${
                isMuted ? 'text-slate-500' : 'text-[#00FF9D]'
              }`}
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Desktop Volume Slider */}
            <div className="hidden sm:flex items-center w-16 px-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none accent-[#00FF9D] cursor-pointer"
                title="مستوى الصوت"
              />
            </div>

            {/* Time Display */}
            <div className="text-[11px] font-mono text-slate-400 pr-1">
              <span className="text-emerald-400 font-bold">{formatTime(currentTime)}</span>
              <span className="text-slate-600"> / </span>
              <span>{formatTime(TOTAL_DURATION)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
