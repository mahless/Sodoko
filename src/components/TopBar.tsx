/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Timer from './Timer';
import { Difficulty } from '../types';
import { Heart, RefreshCw } from 'lucide-react';

interface TopBarProps {
  difficulty: Difficulty;
  mistakes: number;
  isPaused: boolean;
  isWon: boolean;
  isGameOver: boolean;
  initialSeconds: number;
  resetTrigger: number;
  onTimeUpdate: (seconds: number) => void;
  onTogglePause: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export default function TopBar({
  difficulty,
  mistakes,
  isPaused,
  isWon,
  isGameOver,
  initialSeconds,
  resetTrigger,
  onTimeUpdate,
  onTogglePause,
  onDifficultyChange,
}: TopBarProps) {
  // Translate difficulty to Arabic for the UI
  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return 'سهل جداً (Easy)';
      case 'medium':
        return 'متوسط (Medium)';
      case 'hard':
        return 'صعب (Hard)';
      default:
        return 'سهل (Easy)';
    }
  };

  return (
    <div id="sudoku-topbar" className="w-full max-w-[480px] mx-auto select-none mb-4 flex flex-col gap-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl shadow-xs">
      
      {/* Row 1: Difficulty Level Selector and Timer in the same row with identical heights and borders */}
      <div className="flex items-center gap-2.5 w-full">
        {/* Difficulty Selector container */}
        <div className="flex-1 relative">
          <select
            id="difficulty-selector"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            className="w-full h-10 select-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 px-3.5 rounded-2xl cursor-pointer outline-hidden transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-sky-500"
          >
            <option value="easy">سهل (Easy)</option>
            <option value="medium">متوسط (Medium)</option>
            <option value="hard">صعب (Hard)</option>
          </select>
        </div>

        {/* Timer Component container */}
        <div className="flex-1">
          <Timer
            isPaused={isPaused}
            isWon={isWon}
            isGameOver={isGameOver}
            initialSeconds={initialSeconds}
            resetTrigger={resetTrigger}
            onTimeUpdate={onTimeUpdate}
            onTogglePause={onTogglePause}
          />
        </div>
      </div>

      {/* Row 2: Mistakes Counter and Helper label */}
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-2.5">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">الأخطاء المرتكبة:</span>
        <div id="mistakes-counter" className="flex items-center gap-1.5 bg-rose-50/70 dark:bg-rose-950/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-950/40">
          <div className="flex gap-1">
            {[1, 2, 3].map((index) => {
              const isFilled = index <= mistakes;
              return (
                <Heart
                  id={`mistake-heart-${index}`}
                  key={index}
                  size={12}
                  className={`transition-all duration-300 ${
                    isFilled
                      ? 'text-rose-500 fill-rose-500 scale-110 drop-shadow-sm'
                      : 'text-zinc-300 dark:text-zinc-700'
                  }`}
                />
              );
            })}
          </div>
          <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
            {mistakes}/3
          </span>
        </div>
      </div>

    </div>
  );
}
