/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { GridType } from '../types';

interface NumberPadProps {
  grid: GridType;
  onNumberSelect: (value: number) => void;
  disabled: boolean;
}

export default function NumberPad({ grid, onNumberSelect, disabled }: NumberPadProps) {
  // Calculated remaining counts: 9 - correct counts in grid
  const remainingCounts = useMemo(() => {
    const counts = Array(10).fill(0);
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.val !== null && !cell.isError) {
          counts[cell.val]++;
        }
      });
    });

    const remaining: Record<number, number> = {};
    for (let num = 1; num <= 9; num++) {
      remaining[num] = Math.max(0, 9 - counts[num]);
    }
    return remaining;
  }, [grid]);

  return (
    <div id="sudoku-numberpad" className="w-full max-w-[480px] mx-auto select-none mt-4">
      <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const remaining = remainingCounts[num];
          const isCompleted = remaining === 0;

          return (
            <button
              id={`num-key-${num}`}
              key={num}
              onClick={() => !isCompleted && !disabled && onNumberSelect(num)}
              disabled={isCompleted || disabled}
              className={`
                relative flex flex-col items-center justify-between py-2 sm:py-3 rounded-2xl transition-all duration-150 active:scale-95
                ${
                  isCompleted
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed border border-transparent opacity-40'
                    : disabled
                    ? 'bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 shadow-xs cursor-pointer'
                }
              `}
            >
              <span className="text-xl sm:text-2xl font-black font-sans leading-none">
                {num}
              </span>
              
              <span
                id={`remaining-count-${num}`}
                className={`
                  text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full leading-none
                  ${
                    isCompleted
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                      : 'bg-zinc-100 dark:bg-zinc-750 text-zinc-500 dark:text-zinc-400 font-mono'
                  }
                `}
              >
                {remaining}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
