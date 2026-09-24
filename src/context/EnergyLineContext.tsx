import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

export type EnergyLineStatus = 'idle' | 'running' | 'completing' | 'fading';

export interface EnergyLineContextType {
  start: () => void;
  complete: () => void;
  fail: () => void;
  status: EnergyLineStatus;
  progress: number;
  isPulse: boolean;
}

const EnergyLineContext = createContext<EnergyLineContextType | undefined>(undefined);

export const EnergyLineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<EnergyLineStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [isPulse, setIsPulse] = useState(false);

  const statusRef = useRef<EnergyLineStatus>('idle');
  const startTimeRef = useRef<number>(0);
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const creepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep statusRef synchronized with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearAllTimers = useCallback(() => {
    stepTimersRef.current.forEach((t) => clearTimeout(t));
    stepTimersRef.current = [];
    if (creepIntervalRef.current) {
      clearInterval(creepIntervalRef.current);
      creepIntervalRef.current = null;
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (withPulse = true) => {
      clearAllTimers();
      statusRef.current = 'completing';
      setStatus('completing');
      setProgress(100);

      // 1. Subtle brightness pulse at 100% completion
      const pulseTimer = setTimeout(() => {
        if (withPulse) {
          setIsPulse(true);
        }
      }, 190);

      // 2. Begin smooth fade-out
      const fadeTimer = setTimeout(() => {
        statusRef.current = 'fading';
        setStatus('fading');
        setIsPulse(false);
      }, 250);

      // 3. Reset cleanly back to idle
      const idleTimer = setTimeout(() => {
        statusRef.current = 'idle';
        setStatus('idle');
        setProgress(0);
        setIsPulse(false);
      }, 540);

      stepTimersRef.current = [pulseTimer, fadeTimer, idleTimer];
    },
    [clearAllTimers]
  );

  const start = useCallback(() => {
    clearAllTimers();
    startTimeRef.current = Date.now();
    statusRef.current = 'running';
    setStatus('running');
    setIsPulse(false);
    setProgress(14); // Immediate initial energy onset

    // Pacing curve:
    // 0 -> ~32% relatively quick
    const t1 = setTimeout(() => {
      setProgress(34);
    }, 110);

    // 32 -> ~64% smooth continuation
    const t2 = setTimeout(() => {
      setProgress(64);
    }, 360);

    // 64 -> ~84% gently slowing down
    const t3 = setTimeout(() => {
      setProgress(84);
    }, 760);

    // 84 -> ~90% approaching destination
    const t4 = setTimeout(() => {
      setProgress(90);
    }, 1300);

    stepTimersRef.current = [t1, t2, t3, t4];

    // Slow organic living creep (90% -> max 95%) if navigation takes longer
    const creepTimer = setTimeout(() => {
      creepIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 0.6;
        });
      }, 650);
    }, 1900);

    stepTimersRef.current.push(creepTimer);

    // 12s safety timeout to prevent hanging in error cases
    safetyTimerRef.current = setTimeout(() => {
      if (statusRef.current === 'running') {
        finish(false);
      }
    }, 12000);
  }, [clearAllTimers, finish]);

  const complete = useCallback(() => {
    if (statusRef.current === 'idle' || statusRef.current === 'fading') return;
    if (statusRef.current === 'completing') return;

    // Minimum visible duration (280ms) prevents harsh flickering on instant navigations
    const elapsed = Date.now() - startTimeRef.current;
    const minDuration = 280;
    const remaining = Math.max(0, minDuration - elapsed);

    if (remaining > 0) {
      completeTimerRef.current = setTimeout(() => {
        finish(true);
      }, remaining);
    } else {
      finish(true);
    }
  }, [finish]);

  const fail = useCallback(() => {
    if (statusRef.current === 'idle' || statusRef.current === 'fading') return;
    const elapsed = Date.now() - startTimeRef.current;
    const minDuration = 280;
    const remaining = Math.max(0, minDuration - elapsed);

    if (remaining > 0) {
      completeTimerRef.current = setTimeout(() => {
        finish(false);
      }, remaining);
    } else {
      finish(false);
    }
  }, [finish]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return (
    <EnergyLineContext.Provider
      value={{
        start,
        complete,
        fail,
        status,
        progress,
        isPulse,
      }}
    >
      {children}
    </EnergyLineContext.Provider>
  );
};

export const useEnergyLine = (): EnergyLineContextType => {
  const context = useContext(EnergyLineContext);
  if (!context) {
    throw new Error('useEnergyLine must be used within an EnergyLineProvider');
  }
  return context;
};
