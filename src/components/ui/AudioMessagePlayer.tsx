import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';

interface AudioMessagePlayerProps {
  src?: string;
  audioUrl?: string;
  duration?: number;
  isMine?: boolean;
  isSender?: boolean;
  senderName?: string;
  createdAt?: string;
}

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  src,
  audioUrl,
  duration: initialDuration,
  isMine,
  isSender,
}) => {
  const resolvedSrc = src || audioUrl || '';
  const mine = Boolean(isMine ?? isSender);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [hasError, setHasError] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(false);
  const wasPlayingBeforeScrubRef = useRef(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveDuration = duration > 0 ? duration : initialDuration && initialDuration > 0 ? initialDuration : 1;

  // Sync duration and events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      setHasError(false);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (initialDuration && initialDuration > 0) {
        setDuration(initialDuration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isScrubbingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) audio.currentTime = 0;
    };

    const handlePause = () => {
      if (!isScrubbingRef.current) {
        setIsPlaying(false);
        setCurrentTime(audio.currentTime);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setHasError(false);
      syncDuration();
    };

    const handleError = () => {
      setIsPlaying(false);
      setHasError(true);
    };

    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('canplaythrough', syncDuration);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      try {
        audio.pause();
      } catch {}
      audio.removeEventListener('loadedmetadata', syncDuration);
      audio.removeEventListener('durationchange', syncDuration);
      audio.removeEventListener('canplaythrough', syncDuration);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [resolvedSrc, initialDuration]);

  // High precision playback synchronization via requestAnimationFrame
  useEffect(() => {
    let animId: number;
    if (isPlaying && audioRef.current) {
      const updateFrame = () => {
        if (audioRef.current && !isScrubbingRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          if (
            audioRef.current.duration &&
            isFinite(audioRef.current.duration) &&
            audioRef.current.duration > 0
          ) {
            setDuration(audioRef.current.duration);
          }
        }
        animId = requestAnimationFrame(updateFrame);
      };
      animId = requestAnimationFrame(updateFrame);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (currentTime >= effectiveDuration || audio.ended) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasError(false);
        })
        .catch((err) => {
          console.error('Audio play error:', err);
          setIsPlaying(false);
          setHasError(true);
        });
    }
  };

  const cyclePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  // Helper to compute time from a pointer event on the track
  const getTimeFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * effectiveDuration;
    },
    [effectiveDuration]
  );

  // Pointer event handlers for silky smooth click and drag scrubbing
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const audio = audioRef.current;
    if (!audio) return;

    isScrubbingRef.current = true;
    setIsScrubbing(true);
    wasPlayingBeforeScrubRef.current = isPlaying;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const newTime = getTimeFromEvent(e.clientX);
    setCurrentTime(newTime);
    audio.currentTime = newTime;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.preventDefault();
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = getTimeFromEvent(e.clientX);
    setCurrentTime(newTime);
    audio.currentTime = newTime;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.preventDefault();
    const audio = audioRef.current;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const finalTime = getTimeFromEvent(e.clientX);
    if (audio) {
      audio.currentTime = finalTime;
    }
    setCurrentTime(finalTime);

    isScrubbingRef.current = false;
    setIsScrubbing(false);

    if (wasPlayingBeforeScrubRef.current && audio && finalTime < effectiveDuration) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handlePointerCancel = () => {
    isScrubbingRef.current = false;
    setIsScrubbing(false);
  };

  // Keyboard accessibility seeking
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const step = 2; // 2 seconds step
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newTime = Math.min(effectiveDuration, currentTime + step);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newTime = Math.max(0, currentTime - step);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  if (hasError) {
    return (
      <div
        dir="ltr"
        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-xs w-full max-w-[280px] min-w-0"
      >
        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
        <span className="font-cairo truncate">تعذر تشغيل الملف الصوتي</span>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className={`flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl border w-full max-w-[280px] sm:max-w-[320px] min-w-0 select-none transition-all shadow-sm ${
        mine
          ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-50'
          : 'bg-[#090e18] border-white/[0.08] text-slate-200'
      }`}
    >
      <audio ref={audioRef} src={resolvedSrc} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm cursor-pointer ${
          mine
            ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-400/20'
            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
        }`}
        title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الرسالة الصوتية'}
        aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الرسالة الصوتية'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Progress Track & Times */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        {/* Interactive Scrubbing Track */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="موضع الصوت"
          aria-valuemin={0}
          aria-valuemax={effectiveDuration}
          aria-valuenow={currentTime}
          aria-valuetext={formatTime(currentTime)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onKeyDown={handleKeyDown}
          className="relative w-full h-5 sm:h-6 flex items-center cursor-pointer touch-none group"
        >
          {/* Base Track Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/[0.12] overflow-hidden relative group-hover:h-2 transition-all">
            {/* Filled Progress Bar */}
            <div
              className={`h-full rounded-full transition-none ${
                mine ? 'bg-emerald-300' : 'bg-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Scrubbing Thumb Indicator */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#090e18] shadow-md transition-transform pointer-events-none ${
              mine ? 'bg-emerald-300' : 'bg-emerald-400'
            } ${isScrubbing ? 'scale-125' : 'scale-90 opacity-90 group-hover:scale-110'}`}
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-payment-digits text-slate-400 px-0.5 leading-none">
          <span className={`tabular-nums font-mono ${isScrubbing ? 'text-emerald-400 font-bold' : ''}`}>
            {formatTime(currentTime)}
          </span>
          <div className="flex items-center gap-1 opacity-75">
            <Volume2 className="w-2.5 h-2.5" />
            <span className="tabular-nums font-mono">{formatTime(effectiveDuration)}</span>
          </div>
        </div>
      </div>

      {/* Playback Speed Pill */}
      <button
        type="button"
        onClick={cyclePlaybackRate}
        className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9.5px] sm:text-[10px] font-mono font-bold tracking-tight bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer border border-white/[0.06]"
        title="سرعة التشغيل"
        aria-label={`سرعة التشغيل ${playbackRate}x`}
      >
        {playbackRate}x
      </button>
    </div>
  );
};
