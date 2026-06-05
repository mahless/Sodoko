/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Undo2, Eraser, Pencil, Lightbulb } from 'lucide-react';

interface ControlsProps {
  onUndo: () => void;
  onErase: () => void;
  onHint: () => void;
  onToggleNotes: () => void;
  notesMode: boolean;
  historyLength: number;
  disabled: boolean;
}

export default function Controls({
  onUndo,
  onErase,
  onHint,
  onToggleNotes,
  notesMode,
  historyLength,
  disabled,
}: ControlsProps) {
  return (
    <div id="sudoku-controls" className="w-full max-w-[480px] mx-auto select-none mt-5">
      <div className="grid grid-cols-4 gap-2.5">
        {/* Undo button */}
        <button
          id="btn-undo"
          onClick={onUndo}
          disabled={historyLength === 0 || disabled}
          className={`
            flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 active:scale-95 text-center
            ${
              historyLength === 0 || disabled
                ? 'bg-zinc-50 dark:bg-zinc-850/50 border-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                : 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-750 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-805 hover:border-zinc-350 shadow-xs cursor-pointer'
            }
          `}
          title="تراجع (Ctrl+Z)"
        >
          <div className="relative">
            <Undo2 size={20} />
            {historyLength > 0 && !disabled && (
              <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[9px] px-1 rounded-full font-bold">
                {historyLength}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold mt-1">تراجع</span>
        </button>

        {/* Erase button */}
        <button
          id="btn-erase"
          onClick={onErase}
          disabled={disabled}
          className={`
            flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 active:scale-95 text-center
            ${
              disabled
                ? 'bg-zinc-50 dark:bg-zinc-850/50 border-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                : 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-750 text-rose-500 md:text-rose-650 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 hover:border-rose-200 shadow-xs cursor-pointer'
            }
          `}
          title="مسح الخلية (Delete/Backspace)"
        >
          <Eraser size={20} />
          <span className="text-xs font-semibold mt-1">مسح</span>
        </button>

        {/* Notes Toggle button */}
        <button
          id="btn-toggle-notes"
          onClick={onToggleNotes}
          disabled={disabled}
          className={`
            relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 active:scale-95 text-center cursor-pointer
            ${
              disabled
                ? 'bg-zinc-50 dark:bg-zinc-850/50 border-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                : notesMode
                ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-750 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-805 hover:border-zinc-350 shadow-xs'
            }
          `}
          title="تفعيل الملاحظات (Pencil Mode)"
        >
          <Pencil size={20} />
          <span className="text-xs font-semibold mt-1">ملاحظات</span>
          {notesMode && !disabled && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-100"></span>
            </span>
          )}
        </button>

        {/* Hint button */}
        <button
          id="btn-hint"
          onClick={onHint}
          disabled={disabled}
          className={`
            flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 active:scale-95 text-center
            ${
              disabled
                ? 'bg-zinc-50 dark:bg-zinc-850/50 border-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                : 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-750 text-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-200 shadow-xs cursor-pointer'
            }
          `}
          title="تلميح خلية (Hint)"
        >
          <Lightbulb size={20} className="stroke-current" />
          <span className="text-xs font-semibold mt-1">تلميح</span>
        </button>
      </div>
    </div>
  );
}
