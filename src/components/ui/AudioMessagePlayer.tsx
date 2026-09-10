import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

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
    };

    const handlePause = () => {
      setIsPlaying(false);
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      syncDuration();
    };

    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('canplaythrough', syncDuration);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadedmetadata', syncDuration);
      audio.removeEventListener('durationchange', syncDuration);
      audio.removeEventListener('canplaythrough', syncDuration);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [src, initialDuration]);

  // Silky 60fps playback synchronization via requestAnimationFrame
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
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play error:', err));
    }
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

  return (
    <div
      dir="ltr"
      className={`flex items-center gap-3 p-2 sm:p-2.5 rounded-xl border min-w-[210px] sm:min-w-[240px] max-w-[280px] select-none transition-colors ${
        isMine
          ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-100'
          : 'bg-[#090d16] border-slate-800/90 text-slate-200'
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isMine
            ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
        }`}
        title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الرسالة الصوتية'}
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
            className="w-full h-1.5 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-emerald-400 transition-all"
            style={{
              background: `linear-gradient(to right, #10b981 ${progressPercent}%, #334155 ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-payment-digits text-slate-400 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 opacity-60" />
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
