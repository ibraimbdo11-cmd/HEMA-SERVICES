import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';

interface AudioMessagePlayerProps {
  src: string;
  duration?: number;
  isMine?: boolean;
}

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  src,
  duration: initialDuration,
  isMine = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) audio.currentTime = 0;
    };

    const handlePause = () => {
      setIsPlaying(false);
      setCurrentTime(audio.currentTime);
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
  }, [src, initialDuration]);

  // Silky playback synchronization via requestAnimationFrame
  useEffect(() => {
    let animId: number;
    if (isPlaying && audioRef.current) {
      const updateFrame = () => {
        if (audioRef.current) {
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  };

  const effectiveDuration = duration > 0 ? duration : (initialDuration || 1);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  if (hasError) {
    return (
      <div
        dir="ltr"
        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-xs min-w-[210px]"
      >
        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
        <span className="font-cairo">تعذر تشغيل الملف الصوتي</span>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border min-w-[210px] sm:min-w-[250px] max-w-[300px] select-none transition-all shadow-sm ${
        isMine
          ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-50'
          : 'bg-[#090e18] border-white/[0.08] text-slate-200'
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer ${
          isMine
            ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
        }`}
        title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الرسالة الصوتية'}
        aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الرسالة الصوتية'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Progress Track & Times */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={0.02}
            value={currentTime}
            onChange={handleSeek}
            aria-label="موضع الصوت"
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all"
            style={{
              background: `linear-gradient(to right, #10b981 ${progressPercent}%, rgba(255, 255, 255, 0.12) ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-payment-digits text-slate-400 px-0.5">
          <span className="tabular-nums font-mono">{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 opacity-60" />
            <span className="tabular-nums font-mono">{formatTime(effectiveDuration)}</span>
          </div>
        </div>
      </div>

      {/* Playback Speed Pill */}
      <button
        type="button"
        onClick={cyclePlaybackRate}
        className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-tight bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer border border-white/[0.06]"
        title="سرعة التشغيل"
        aria-label={`سرعة التشغيل ${playbackRate}x`}
      >
        {playbackRate}x
      </button>
    </div>
  );
};
