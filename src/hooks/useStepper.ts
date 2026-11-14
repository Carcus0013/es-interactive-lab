import { useCallback, useEffect, useRef, useState } from 'react';

export interface Stepper {
  step: number;
  total: number;
  playing: boolean;
  speed: number;
  atEnd: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  next: () => void;
  prev: () => void;
  setStep: (n: number) => void;
  setSpeed: (s: number) => void;
}

/** Discrete step animation with play / pause / step / restart / speed. */
export function useStepper(total: number, opts: { interval?: number; loop?: boolean; autoplay?: boolean } = {}): Stepper {
  const { interval = 900, loop = false, autoplay = false } = opts;
  const [step, setStepRaw] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const totalRef = useRef(total);
  totalRef.current = total;

  const clamp = (n: number) => Math.max(0, Math.min(totalRef.current - 1, n));
  const setStep = useCallback((n: number) => setStepRaw(clamp(n)), []);

  useEffect(() => {
    // keep step valid when the program/steps change underneath
    setStepRaw((s) => Math.min(s, Math.max(0, total - 1)));
  }, [total]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStepRaw((s) => {
        if (s >= totalRef.current - 1) {
          if (loop) return 0;
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, interval / speed);
    return () => window.clearInterval(id);
  }, [playing, interval, speed, loop]);

  return {
    step,
    total,
    playing,
    speed,
    atEnd: step >= total - 1,
    play: () => {
      if (step >= total - 1 && !loop) setStepRaw(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    toggle: () => {
      if (playing) setPlaying(false);
      else {
        if (step >= total - 1 && !loop) setStepRaw(0);
        setPlaying(true);
      }
    },
    restart: () => {
      setStepRaw(0);
      setPlaying(false);
    },
    next: () => {
      setPlaying(false);
      setStepRaw((s) => clamp(s + 1));
    },
    prev: () => {
      setPlaying(false);
      setStepRaw((s) => clamp(s - 1));
    },
    setStep,
    setSpeed,
  };
}

/** Continuous animation clock (seconds), driven by requestAnimationFrame. */
export function useClock(playing: boolean, speed = 1) {
  const [t, setT] = useState(0);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (last.current != null) {
        const dt = Math.min(0.1, (now - last.current) / 1000);
        setT((x) => x + dt * speed);
      }
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);
  return [t, setT] as const;
}

export function usePrefersReducedMotion() {
  const [r, setR] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    const h = () => setR(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return r;
}
