/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  isPaused: boolean;
  isWon: boolean;
  isGameOver: boolean;
  initialSeconds: number;
  resetTrigger: number;
  onTimeUpdate: (seconds: number) => void;
  onTogglePause: () => void;
}

export default function Timer({
  isPaused,
  isWon,
  isGameOver,
  initialSeconds,
  resetTrigger,
  onTimeUpdate,
  onTogglePause,
}: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }); // Keep updated on any render

  // Reset timer on new game trigger
  useEffect(() => {
    setSeconds(0);
  }, [resetTrigger]);

  // Sync with initialSeconds when loaded from localStorage on start
  useEffect(() => {
    if (initialSeconds > 0) {
      setSeconds(initialSeconds);
    }
  }, [initialSeconds]);

  // Track the seconds using a ref to read on unmount safely
  const secondsRef = useRef(seconds);
  useEffect(() => {
    secondsRef.current = seconds;
    // Safely update parent ref using callback inside dedicated effect hook
    onTimeUpdateRef.current(seconds);
  }, [seconds]);

  // Handle ticking
  useEffect(() => {
    if (isPaused || isWon || isGameOver) {
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isPaused, isWon, isGameOver]);

  // Sync last known time when component unmounts
  useEffect(() => {
    return () => {
      onTimeUpdateRef.current(secondsRef.current);
    };
  }, []);

  // Format seconds to MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="sudoku-timer" className="flex items-center justify-between w-full h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 md:px-3.5 rounded-2xl shadow-xs shrink-0 select-none">
      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        <span className="sr-only">الوقت</span>
        <TimerIcon size={14} className="animate-pulse text-sky-500" />
        <span className="font-mono text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 tracking-wider">
          {formatTime(seconds)}
        </span>
      </div>
      
      {!isGameOver && !isWon && (
        <button
          id={`btn-pause-toggle-${isPaused ? 'play' : 'pause'}`}
          onClick={onTogglePause}
          className={`p-1 rounded-lg transition-all cursor-pointer ${
            isPaused
              ? 'bg-sky-500 text-white hover:bg-sky-600'
              : 'bg-zinc-200/60 dark:bg-zinc-700 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-250 dark:hover:bg-zinc-600'
          }`}
          title={isPaused ? 'استمرار اللعب (Resume)' : 'إيقاف مؤقت (Pause)'}
        >
          {isPaused ? <Play size={12} className="fill-current" /> : <Pause size={12} className="fill-current" />}
        </button>
      )}
    </div>
  );
}
