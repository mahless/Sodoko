/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GridType, Cell } from '../types';
import { SudokuCell } from './SudokuCell';
import { Play } from 'lucide-react';

interface SudokuGridProps {
  grid: GridType;
  activeCell: { row: number; col: number } | null;
  isPaused: boolean;
  onSelectCell: (row: number, col: number) => void;
  onResume: () => void;
}

export default function SudokuGrid({
  grid,
  activeCell,
  isPaused,
  onSelectCell,
  onResume,
}: SudokuGridProps) {
  // Safe extraction of the currently selected cell value
  const activeCellValue = activeCell ? grid[activeCell.row][activeCell.col].val : null;

  return (
    <div id="sudoku-grid-container" className="relative w-full aspect-square max-w-[480px] mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-xl border-4 border-zinc-800 dark:border-zinc-500">
      
      {/* 9x9 Grid layout */}
      <div id="grid-9x9" className="grid grid-cols-9 h-full w-full select-none bg-zinc-300 dark:bg-zinc-700">
        {grid.map((rowCells, rIndex) =>
          rowCells.map((cell, cIndex) => {
            const isActive = activeCell !== null && activeCell.row === rIndex && activeCell.col === cIndex;
            
            // Check identical digit highlighting
            const isSameDigitHighlight =
              activeCellValue !== null &&
              cell.val === activeCellValue &&
              !isActive;

            // Check crosshair (row, col, or 3x3 block) highlighting
            const isSameRow = activeCell !== null && activeCell.row === rIndex;
            const isSameCol = activeCell !== null && activeCell.col === cIndex;
            const isSameBlock =
              activeCell !== null &&
              Math.floor(rIndex / 3) === Math.floor(activeCell.row / 3) &&
              Math.floor(cIndex / 3) === Math.floor(activeCell.col / 3);

            const isCrosshairHighlight =
              activeCell !== null &&
              (isSameRow || isSameCol || isSameBlock) &&
              !isActive;

            return (
              <SudokuCell
                key={`${rIndex}-${cIndex}`}
                cell={cell}
                isActive={isActive}
                isSameDigitHighlight={isSameDigitHighlight}
                isCrosshairHighlight={isCrosshairHighlight}
                onSelect={onSelectCell}
              />
            );
          })
        )}
      </div>

      {/* Paused Overlay Cover */}
      {isPaused && (
        <div id="paused-overlay" className="absolute inset-0 bg-zinc-900/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20 animate-fade-in">
          <div className="bg-sky-500/10 border border-sky-400/20 p-5 rounded-full mb-4 animate-bounce">
            <Play className="text-sky-400 fill-sky-450 h-10 w-10 ml-1" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">لعبة متوقفة مؤقتاً</h3>
          <p className="text-zinc-400 text-sm md:text-base max-w-[260px] leading-relaxed mb-6">
            لوحة الأرقام مخفية للحفاظ على نزاهة اللعب. اضغط أدناه للمتابعة.
          </p>
          <button
            id="paused-resume-button"
            onClick={onResume}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-sky-500/20"
          >
            استئناف اللعب
          </button>
        </div>
      )}
    </div>
  );
}
