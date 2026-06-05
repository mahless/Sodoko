/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo } from 'react';
import { Cell } from '../types';

interface SudokuCellProps {
  cell: Cell;
  isActive: boolean;
  isSameDigitHighlight: boolean;
  isCrosshairHighlight: boolean;
  onSelect: (row: number, col: number) => void;
}

export const SudokuCell = memo(function SudokuCell({
  cell,
  isActive,
  isSameDigitHighlight,
  isCrosshairHighlight,
  onSelect,
}: SudokuCellProps) {
  const { row, col, val, isInitial, isError, notes } = cell;

  // Determine borders based on 3x3 box boundaries
  const borderTop = row % 3 === 0 ? 'border-t-3 border-t-zinc-700 dark:border-t-zinc-400' : 'border-t border-t-zinc-200 dark:border-t-zinc-800';
  const borderBottom = row === 8 ? 'border-b-3 border-b-zinc-700 dark:border-b-zinc-400' : '';
  const borderLeft = col % 3 === 0 ? 'border-l-3 border-l-zinc-700 dark:border-l-zinc-400' : 'border-l border-l-zinc-200 dark:border-l-zinc-800';
  const borderRight = col === 8 ? 'border-r-3 border-r-zinc-700 dark:border-r-zinc-400' : '';

  // Determine background color based on active, same digit, and crosshair highlights
  let bgClass = 'bg-white dark:bg-zinc-900';

  if (isActive) {
    if (isError) {
      bgClass = 'bg-red-100 dark:bg-red-950/60 ring-4 ring-red-500/35 ring-inset z-10';
    } else {
      bgClass = 'bg-sky-200 dark:bg-sky-900 ring-4 ring-sky-500/35 ring-inset z-10';
    }
  } else if (isSameDigitHighlight) {
    bgClass = 'bg-amber-100 dark:bg-amber-950/40';
  } else if (isCrosshairHighlight) {
    bgClass = 'bg-sky-50/50 dark:bg-sky-950/15';
  }

  // Determine text color and font weight
  let textClass = 'font-sans font-bold text-lg sm:text-xl md:text-2xl';
  if (isInitial) {
    textClass += ' text-zinc-900 dark:text-zinc-50 font-black';
  } else if (isError) {
    textClass += ' text-rose-600 dark:text-rose-400';
  } else {
    textClass += ' text-sky-600 dark:text-sky-400 font-semibold';
  }

  return (
    <button
      id={`sudoku-cell-${row}-${col}`}
      onClick={() => onSelect(row, col)}
      className={`
        relative aspect-square flex items-center justify-center outline-hidden transition-all duration-100 select-none
        ${borderTop} ${borderBottom} ${borderLeft} ${borderRight} ${bgClass}
        hover:bg-sky-100/50 dark:hover:bg-sky-900/30
      `}
    >
      {val === null ? (
        // Notes grid for pencil markings
        <div id={`notes-grid-${row}-${col}`} className="grid grid-cols-3 grid-rows-3 h-full w-full p-0.5 text-[9px] sm:text-[11px] leading-none text-zinc-400 dark:text-zinc-500 font-mono">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <span
              id={`note-cell-${row}-${col}-${num}`}
              key={num}
              className="flex items-center justify-center font-semibold"
            >
              {notes.includes(num) ? num : ''}
            </span>
          ))}
        </div>
      ) : (
        // Standard cell value
        <span id={`cell-value-${row}-${col}`} className={textClass}>
          {val}
        </span>
      )}
    </button>
  );
}, (prevProps, nextProps) => {
  // Deep comparison logic to only re-render cells whose state has changed!
  // This is a CRUCIAL optimization for performance!
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSameDigitHighlight === nextProps.isSameDigitHighlight &&
    prevProps.isCrosshairHighlight === nextProps.isCrosshairHighlight &&
    prevProps.cell.val === nextProps.cell.val &&
    prevProps.cell.isError === nextProps.cell.isError &&
    // Compare notes arrays
    prevProps.cell.notes.length === nextProps.cell.notes.length &&
    prevProps.cell.notes.every((val, index) => val === nextProps.cell.notes[index])
  );
});
