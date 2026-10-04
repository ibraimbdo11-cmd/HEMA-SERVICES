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
  Smartphone,
  Layout,
  FileText,
  Lock,
  Database,
  Briefcase,
  Globe,
  Compass,
  Monitor,
  MousePointer2,
  Sparkles,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WebDesignPromoVideoProps {
  onStartProject: () => void;
  onOpenSupport?: () => void;
}

// Total Duration: Exactly 44.0 seconds (matching the Egyptian Commercial Voice track)
const TOTAL_DURATION = 44.0;

interface SceneMeta {
  index: number;
  title: string;
  category: string;
  image: string;
  sceneName: string;
}

const SCENES_CONFIG: Record<number, SceneMeta> = {
  1: {
    index: 1,
    title: 'دراسة الفكرة والهدف',
    category: 'Scene 01 • The Hook',
    image: '/images/scene1.jpg',
    sceneName: 'بيئة عمل حقيقية • جلسة تخطيط',
  },
  2: {
    index: 2,
    title: 'من الفكرة إلى التنفيذ',
    category: 'Scene 02 • Solution',
    image: '/images/scene2.jpg',
    sceneName: 'كتابة الكود وهندسة الواجهات',
  },
  3: {
    index: 3,
    title: 'تصميم حديث وتجاوب كامل',
    category: 'Scene 03 • Responsive Design',
    image: '/images/scene3.jpg',
    sceneName: 'تجربة حية على الجوال والكمبيوتر',
  },
  4: {
    index: 4,
    title: 'إمكانيات برمجية شاملة',
    category: 'Scene 04 • Capabilities',
    image: '/images/scene4.jpg',
    sceneName: 'تفاعل حي مع النظام وقواعد البيانات',
  },
  5: {
    index: 5,
    title: 'حلول لمختلف أنواع المشاريع',
    category: 'Scene 05 • Archetypes',
    image: '/images/scene5.jpg',
    sceneName: 'مواقع شركات، خدمات، ومعارض أعمال',
  },
  6: {
    index: 6,
    title: 'مراحل العمل والتسليم',
    category: 'Scene 06 • Workflow',
    image: '/images/scene6.jpg',
    sceneName: 'مراجعة وتنسيق مباشر حتى الإطلاق',
  },
  7: {
    index: 7,
    title: 'انطلاق مشروعك الآن',
    category: 'Scene 07 • Launch & CTA',
    image: '/images/scene7.jpg',
    sceneName: 'الموقع جاهز للعمل والنجاح',
  },
};

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
  const [activeDeviceView, setActiveDeviceView] = useState<'desktop' | 'mobile'>('desktop');

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
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    syncPlayback();
  }, [isPlaying, syncPlayback]);

  // High-performance time tracking loop
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

  // Play / Pause
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

  // Restart
  const handleRestart = () => {
    if (audioRef.current) audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(true);
    resetControlsTimeout();
  };

  // Seek
  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION, newTime));
    setCurrentTime(clamped);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  // RTL Scrubber & Seek
  const handleScrubberChange = (clientX: number) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
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

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(currentTime + 5);
      } else if (e.code === 'ArrowRight') {
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

  // Active scene calculation:
  // Scene 1: 0.0 - 5.0s  (Hook: عندك مشروع في دماغك... بس لسه معندكش موقع يليق بيه؟)
  // Scene 2: 5.0 - 11.0s (Solution: بنحوّل فكرتك لموقع احترافي معمول مخصوص لاحتياجاتك)
  // Scene 3: 11.0 - 17.0s (Responsive: تصميم عصري، متجاوب، وتجربة سهلة على كل شاشة)
  // Scene 4: 17.0 - 23.0s (Capabilities: صفحات، نماذج، تسجيل دخول، أنظمة وقواعد بيانات)
  // Scene 5: 23.0 - 28.0s (Types: شركات، خدمات، صفحات هبوط، معارض أعمال)
  // Scene 6: 28.0 - 35.0s (Workflow: نفهم فكرتك، تخطيط، تصميم وتطوير، مراجعة، موقعك جاهز)
  // Scene 7: 35.0 - 44.0s (Final CTA: عندك فكرة؟ خلّينا نحوّلها لموقع حقيقي)
  let sceneIndex = 1;
  if (currentTime >= 35.0) sceneIndex = 7;
  else if (currentTime >= 28.0) sceneIndex = 6;
  else if (currentTime >= 23.0) sceneIndex = 5;
  else if (currentTime >= 17.0) sceneIndex = 4;
  else if (currentTime >= 11.0) sceneIndex = 3;
  else if (currentTime >= 5.0) sceneIndex = 2;
  else sceneIndex = 1;

  const currentSceneMeta = SCENES_CONFIG[sceneIndex];
  const progressRatio = Math.max(0, Math.min(1, currentTime / TOTAL_DURATION));
  const progressPercentage = progressRatio * 100;

  // Toggle device view in Scene 3 based on elapsed scene time
  useEffect(() => {
    if (sceneIndex === 3) {
      if (currentTime >= 14.2) {
        setActiveDeviceView('mobile');
      } else {
        setActiveDeviceView('desktop');
      }
    }
  }, [sceneIndex, currentTime]);

  return (
    <div
      ref={containerRef}
      dir="rtl"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#05080C] border border-white/[0.08] shadow-2xl select-none text-right transition-all group font-cairo ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen'
          : 'aspect-[16/10] sm:aspect-[16/9] min-h-[400px] sm:min-h-[500px] max-h-[640px]'
      }`}
    >
      {/* Real Voice-over & Mixed Ambient Audio Track */}
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
          1. REALISTIC LIVE-ACTION CINEMATIC FOOTAGE LAYER
          High-definition photography with Ken-Burns camera movement
      ======================================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSceneMeta.image}
            initial={{ opacity: 0, scale: 1.0 }}
            animate={{
              opacity: 1,
              scale: 1.05,
              x: sceneIndex % 2 === 0 ? 8 : -8,
            }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut',
              scale: { duration: 6, ease: 'linear' },
              x: { duration: 6, ease: 'linear' },
            }}
            className="w-full h-full absolute inset-0"
          >
            <img
              src={currentSceneMeta.image}
              alt={currentSceneMeta.sceneName}
              className="w-full h-full object-cover brightness-[0.78] contrast-[1.08] saturate-[1.06]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Soft Vignette & Cinematic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080C]/95 via-[#05080C]/35 to-[#05080C]/75" />
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none" />

        {/* Subtle Ambient Green Accent Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Real Live-Production HUD Header */}
        <div className="absolute top-3.5 inset-x-4 sm:top-5 sm:inset-x-6 flex items-center justify-between text-xs text-slate-200 z-10 font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF9D] shadow-[0_0_8px_#00FF9D] animate-pulse" />
            <span className="font-bold text-white font-cairo tracking-wide">HEMA Services</span>
            <span className="text-emerald-400 text-[10px] hidden sm:inline">| تصميم مواقع احترافية</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-slate-300 text-[10px] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>LIVE DEMO</span>
              <span className="text-slate-500">•</span>
              <span>4K CINEMATIC</span>
            </div>

            <div className="px-3 py-1 rounded-full bg-black/70 border border-white/15 text-[#00FF9D] font-bold backdrop-blur-md text-[11px] font-mono shadow-sm">
              0{sceneIndex} / 07
            </div>
          </div>
        </div>

        {/* Bottom-right Scene Indicator Stamp */}
        <div className="absolute bottom-16 right-4 sm:bottom-20 sm:right-6 hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-[10px] text-slate-300 font-mono backdrop-blur-md z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D]" />
          <span>{currentSceneMeta.sceneName}</span>
        </div>
      </div>

      {/* ========================================================
          2. SCENE LAYER (Live-action Real Content & Interactive HUD)
      ======================================================== */}
      <div className="absolute inset-0 flex items-center justify-center pt-14 pb-20 px-4 sm:px-8 z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {/* ----------------------------------------------------
              SCENE 1 (0:00 - 5.0s) — The Hook: "هل تبحث عن مصمم مواقع محترف؟"
          ---------------------------------------------------- */}
          {sceneIndex === 1 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl text-center space-y-4 px-2"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold backdrop-blur-md shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-[#00FF9D]" />
                <span>انطلاقة موقعك الحقيقي تبدأ هنا</span>
              </div>

              {/* Glassmorphism Title Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-black/65 border border-white/10 backdrop-blur-md shadow-2xl space-y-2.5">
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white font-cairo leading-snug drop-shadow-md">
                  هل تبحث عن مصمم مواقع محترف؟
                </h2>

                {currentTime >= 2.2 && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="text-sm sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 via-[#00FF9D] to-teal-200 leading-relaxed"
                  >
                    موقع يعكس مشروعك ويقدم تجربة احترافية لعملائك؟
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 2 (5.0s - 11.0s) — Solution: "نحن نصمم ونطور مواقع مخصصة"
          ---------------------------------------------------- */}
          {sceneIndex === 2 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl text-center space-y-4 px-2"
            >
              <div className="p-4 sm:p-6 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md shadow-2xl space-y-3">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-300 block">
                    نحن نصمم ونطور مواقع
                  </span>
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 via-[#00FF9D] to-teal-200">
                    مخصصة بالكامل لاحتياجات مشروعك
                  </h2>
                </div>

                <div className="pt-1 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-200 font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-[#00FF9D] border border-emerald-500/30">
                    من الفكرة
                  </span>
                  <ChevronLeft className="w-4 h-4 text-emerald-400" />
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/20">
                    إلى موقع جاهز للعمل والإنتاج
                  </span>
                </div>

                {/* 3 Interactive Pipeline Nodes */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 relative max-w-md mx-auto">
                  {[
                    { step: 'الفكرة', desc: 'دراسة المتطلبات', time: 5.2 },
                    { step: 'التصميم', desc: 'واجهات عصرية فائقة', time: 7.0 },
                    { step: 'التطوير', desc: 'كود سريع وآمن', time: 9.0 },
                  ].map((node, i) => {
                    const isReached = currentTime >= node.time;
                    return (
                      <div key={i} className="flex flex-col items-center space-y-1">
                        <div
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isReached
                              ? 'bg-[#00FF9D] text-slate-950 shadow-[0_0_12px_rgba(0,255,157,0.6)] scale-105'
                              : 'bg-black/80 text-slate-400 border border-white/15'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className={`text-[11px] sm:text-xs font-bold ${isReached ? 'text-white' : 'text-slate-400'}`}>
                          {node.step}
                        </span>
                        <span className="text-[9.5px] text-slate-400 hidden sm:block">
                          {node.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 3 (11.0s - 17.0s) — Responsive Design Showcase (Desktop ↔ Mobile)
          ---------------------------------------------------- */}
          {sceneIndex === 3 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl flex flex-col items-center space-y-3 px-2"
            >
              {/* Device Selector Pill */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/75 border border-white/15 backdrop-blur-md text-xs">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    activeDeviceView === 'desktop'
                      ? 'bg-emerald-500/25 text-[#00FF9D] border border-emerald-500/40 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    activeDeviceView === 'mobile'
                      ? 'bg-emerald-500/25 text-[#00FF9D] border border-emerald-500/40 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </div>
              </div>

              {/* Realistic Adaptive Browser / Phone Screen Simulation */}
              <motion.div
                animate={{
                  width: activeDeviceView === 'mobile' ? '180px' : '320px',
                  height: activeDeviceView === 'mobile' ? '140px' : '110px',
                }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="rounded-2xl border border-white/25 bg-[#070B12]/90 p-2.5 flex flex-col justify-between shadow-2xl backdrop-blur-lg relative overflow-hidden"
              >
                {/* Header Bar */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400/80" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400/80" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="px-2 py-0.5 rounded bg-black/60 text-[8px] font-mono text-[#00FF9D]">
                    hemaservices.com
                  </div>
                </div>

                {/* Simulated Content */}
                <div className="space-y-1.5 py-1 text-right">
                  <div className="h-2 w-3/4 rounded bg-emerald-400/50" />
                  <div className="h-1.5 w-full rounded bg-white/20" />
                  <div className="h-1.5 w-1/2 rounded bg-white/15" />
                </div>

                {/* Simulated CTA & Cursor */}
                <div className="flex items-center justify-between pt-1">
                  <div className="h-4 px-2.5 rounded-md bg-[#00FF9D] text-[9px] font-bold text-slate-950 flex items-center">
                    <span>طلب الخدمة</span>
                  </div>
                  <MousePointer2 className="w-3.5 h-3.5 text-[#00FF9D] animate-bounce" />
                </div>
              </motion.div>

              {/* 3 Pillars Badge */}
              <div className="p-3 rounded-2xl bg-black/75 border border-white/10 backdrop-blur-md text-center space-y-1 max-w-md">
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Modern Design • Responsive Layout • Smooth Experience
                </h3>
                <p className="text-[11px] sm:text-xs text-[#00FF9D] font-medium">
                  بتصميم حديث ومتجاوب مع مختلف الأجهزة والشاشات
                </p>
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 4 (17.0s - 23.0s) — Real Capabilities Motion Graphics
          ---------------------------------------------------- */}
          {sceneIndex === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xl text-center space-y-3 px-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-emerald-500/40 text-[#00FF9D] text-xs font-bold backdrop-blur-md">
                <span>يمكن تطوير موقعك ليشمل:</span>
              </div>

              {/* 4 Core Real Interactive Feature Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 max-w-md mx-auto">
                {[
                  { name: 'Multiple Pages & Forms', desc: 'صفحات ونماذج استقبال طلبات', icon: FileText, time: 17.2 },
                  { name: 'Authentication & Security', desc: 'تسجيل دخول وتوثيق آمن', icon: Lock, time: 18.8 },
                  { name: 'Animations & Modern UI', desc: 'مؤثرات بصرية سلسة وتفاعلية', icon: Layout, time: 20.2 },
                  { name: 'Backend & Database', desc: 'قواعد بيانات وأنظمة خلفية سريعة', icon: Database, time: 21.6 },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  const isVisible = currentTime >= item.time;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-right flex items-center gap-2.5 transition-all duration-300 min-h-[54px] ${
                        isVisible
                          ? 'bg-black/80 border-emerald-500/50 text-white shadow-xl backdrop-blur-md'
                          : 'bg-black/50 border-white/5 text-slate-500 opacity-40'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isVisible
                            ? 'bg-emerald-500/25 text-[#00FF9D]'
                            : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="text-[11px] sm:text-xs font-bold whitespace-normal">
                          {item.name}
                        </div>
                        <div className="text-[9.5px] text-slate-300 whitespace-normal">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 5 (23.0s - 28.0s) — Real Website Archetypes
          ---------------------------------------------------- */}
          {sceneIndex === 5 && (
            <motion.div
              key="scene-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xl text-center space-y-3 px-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold backdrop-blur-md">
                <span>مناسب لمختلف أنواع المشاريع:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 max-w-md mx-auto">
                {[
                  { title: 'Business Websites', ar: 'مواقع الشركات والمؤسسات', icon: Briefcase, time: 23.2 },
                  { title: 'Service Websites', ar: 'مواقع الخدمات والحجوزات', icon: Globe, time: 24.4 },
                  { title: 'Landing Pages', ar: 'صفحات هبوط ترويجية عالية التحويل', icon: Compass, time: 25.6 },
                  { title: 'Portfolio Websites', ar: 'معارض أعمال شخصية واحترافية', icon: Layout, time: 26.8 },
                ].map((type, idx) => {
                  const Icon = type.icon;
                  const isActive = currentTime >= type.time;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center space-y-1 transition-all duration-300 min-h-[68px] justify-center ${
                        isActive
                          ? 'bg-black/85 border-emerald-500/50 text-white shadow-xl backdrop-blur-md scale-[1.02]'
                          : 'bg-black/50 border-white/5 text-slate-500 opacity-40'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-emerald-500/25 text-[#00FF9D]'
                            : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-full">
                        <div className="text-[11px] sm:text-xs font-bold leading-tight">
                          {type.title}
                        </div>
                        <div className="text-[9px] text-slate-300 font-cairo">
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
              SCENE 6 (28.0s - 35.0s) — Real Workflow to Finished Product
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold backdrop-blur-md">
                <span>كيف نعمل معك؟ خط زمني تقني واضح</span>
              </div>

              {/* 5 Real Workflow Milestones */}
              <div className="grid grid-cols-5 gap-1 sm:gap-1.5 relative max-w-lg mx-auto">
                {[
                  { step: '1', title: 'فكرتك', desc: 'دراسة وتحليل', time: 28.2 },
                  { step: '2', title: 'المتطلبات', desc: 'هيكلة وتخطيط', time: 29.6 },
                  { step: '3', title: 'التصميم والتطوير', desc: 'برمجة دقيقة', time: 31.0 },
                  { step: '4', title: 'المراجعة', desc: 'فحص وتعديل', time: 32.5 },
                  { step: '5', title: 'التسليم', desc: 'موقعك جاهز', time: 33.8 },
                ].map((item, idx) => {
                  const isDone = currentTime >= item.time;
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center text-center space-y-1 transition-all duration-300 min-h-[62px] justify-center ${
                        isDone
                          ? 'bg-emerald-500/25 border-emerald-500/60 text-[#00FF9D] shadow-lg backdrop-blur-md scale-105'
                          : 'bg-black/60 border-white/5 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs font-mono font-bold">{item.step}</span>
                      <span className="text-[9.5px] sm:text-[11px] font-bold leading-tight whitespace-normal">
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {currentTime >= 33.8 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 border border-emerald-400/40 text-[#00FF9D] text-xs font-bold backdrop-blur-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF9D]" />
                  <span>تسليم وتشغيل بأعلى معايير الجودة والسرعة</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ----------------------------------------------------
              SCENE 7 (35.0s - 44.0s) — Final Climax CTA: "لديك مشروع في ذهنك؟"
          ---------------------------------------------------- */}
          {sceneIndex === 7 && (
            <motion.div
              key="scene-7"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md text-center space-y-4 px-2 pointer-events-auto"
            >
              <div className="p-5 sm:p-7 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md shadow-2xl space-y-3">
                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-bold text-slate-300">
                    لديك مشروع في ذهنك؟
                  </p>
                  <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 via-[#00FF9D] to-teal-200 leading-snug drop-shadow-md">
                    لنحوّل فكرتك إلى موقع حقيقي.
                  </h2>
                </div>

                <div className="space-y-0.5 pt-1">
                  <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
                    HEMA Services
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    تصميم وتطوير مواقع الويب الاحترافية
                  </p>
                </div>

                {/* Direct Touch-friendly HEMA CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onStartProject}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#00FF9D] hover:bg-[#1affaa] active:scale-[0.98] text-slate-950 font-black text-sm sm:text-base font-cairo transition-all shadow-[0_0_24px_rgba(0,255,157,0.5)] flex items-center justify-center gap-2 cursor-pointer mx-auto"
                  >
                    <span>ابدأ مشروعك الآن</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================
          3. INITIAL POSTER (Photorealistic First Frame with Center Play)
      ======================================================== */}
      {!hasStarted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-20 cursor-pointer pointer-events-auto group"
        >
          <div className="relative mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00FF9D] text-slate-950 flex items-center justify-center shadow-[0_0_35px_rgba(0,255,157,0.5)] group-hover:scale-110 active:scale-95 transition-transform duration-300">
              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-slate-950 ml-1 text-slate-950" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-sm p-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
            <h3 className="text-base sm:text-xl font-black text-white">
              فيديو تعريفي بخدمة تصميم المواقع
            </h3>
            <p className="text-xs text-slate-300">
              مشاهد واقعية حية تبين كيف نحوّل فكرتك إلى موقع احترافي متجاوب وسريع.
            </p>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-[#06090E]/90 flex flex-col items-center justify-center p-4 text-center z-25 pointer-events-auto">
          <p className="text-sm text-slate-300 mb-3">
            تعذر تحميل ملف الصوت، يمكنك متابعة العرض بصرياً.
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ========================================================
          4. CUSTOM RTL CONTROLS BAR (Auto-hiding, Touch-friendly)
      ======================================================== */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-2.5 sm:p-4 z-30 transition-opacity duration-300 pointer-events-auto ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* RTL Progress Bar: Starts at Right, advances to Left */}
        <div
          ref={progressBarRef}
          onMouseDown={handleScrubberMouseDown}
          onTouchStart={handleScrubberTouchStart}
          className="relative w-full h-4 sm:h-3.5 flex items-center cursor-pointer group/bar mb-2.5 touch-none select-none"
        >
          {/* Neutral Track */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
            {/* Active HEMA Green Fill (Expands from RIGHT) */}
            <div
              className="h-full bg-[#00FF9D] absolute right-0 top-0 transition-all duration-75"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Thumb Indicator */}
          <div
            className="absolute top-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_12px_rgba(0,255,157,0.95)] pointer-events-none transition-all duration-75"
            style={{
              right: `${progressPercentage}%`,
              transform: 'translate(50%, -50%)',
            }}
          />
        </div>

        {/* Buttons & Timings */}
        <div className="flex items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Replay */}
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
