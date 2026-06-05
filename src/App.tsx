/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { useSudoku } from './hooks/useSudoku';
import TopBar from './components/TopBar';
import SudokuGrid from './components/SudokuGrid';
import Controls from './components/Controls';
import NumberPad from './components/NumberPad';
import { Difficulty } from './types';
import { Sun, Moon, Gamepad2, Award, AlertOctagon, RotateCcw } from 'lucide-react';

export default function App() {
  const {
    difficulty,
    grid,
    activeCell,
    notesMode,
    mistakes,
    isWon,
    isGameOver,
    isPaused,
    history,
    resetTrigger,
    elapsedSeconds,
    setNotesMode,
    setIsPaused,
    setActiveCell,
    startNewGame,
    setCellValue,
    eraseCell,
    undo,
    getHint,
    moveActiveCell,
    handleTimeUpdate,
  } = useSudoku('easy');

  // Dark/Light Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('sudoku_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply dark class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('sudoku_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('sudoku_theme', 'light');
      } catch {}
    }
  }, [isDarkMode]);

  // Restart confirmation state
  const [confirmRestart, setConfirmRestart] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRestartClick = () => {
    if (confirmRestart) {
      startNewGame(difficulty);
      setConfirmRestart(false);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = null;
      }
    } else {
      setConfirmRestart(true);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmRestart(false);
      }, 3000);
    }
  };

  // Clean up confirmation timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation & controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // If paused, ONLY Escape key is allowed to toggle/unpause.
      if (isPaused) {
        if (key === 'Escape') {
          e.preventDefault();
          setIsPaused(false);
        }
        return;
      }

      if (isWon || isGameOver) return;

      // Cell navigation
      if (key === 'ArrowUp') {
        e.preventDefault();
        moveActiveCell('up');
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        moveActiveCell('down');
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        moveActiveCell('left');
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        moveActiveCell('right');
      }

      // Values injection
      if (/^[1-9]$/.test(key)) {
        e.preventDefault();
        setCellValue(parseInt(key));
      }

      // Erasers
      if (key === 'Backspace' || key === 'Delete') {
        e.preventDefault();
        eraseCell();
      }

      // Notes toggle
      if (key.toLowerCase() === 'n') {
        e.preventDefault();
        setNotesMode(prev => !prev);
      }

      // Undo triggers
      if (key.toLowerCase() === 'u' || (e.ctrlKey && key.toLowerCase() === 'z')) {
        e.preventDefault();
        undo();
      }

      // Hints
      if (key.toLowerCase() === 'h') {
        e.preventDefault();
        getHint();
      }

      // Escape to Pause
      if (key === 'Escape') {
        e.preventDefault();
        setIsPaused(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWon, isGameOver, isPaused, moveActiveCell, setCellValue, eraseCell, setNotesMode, undo, getHint, setIsPaused]);

  // Format final completion time nicely
  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    
    if (mins === 0) {
      return `${secs} ثانية (Seconds)`;
    }
    return `${mins} دقيقة (Minutes) و ${secs} ثانية (Seconds)`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-colors duration-250 flex flex-col py-6 px-4 md:px-8">
      
      {/* 1. Header & Actions Dashboard */}
      <header className="w-full max-w-[480px] mx-auto mb-5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="bg-sky-500 text-white p-2 rounded-2xl shadow-md rotate-12 transition-transform hover:rotate-3">
            <Gamepad2 size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight font-sans text-zinc-900 dark:text-zinc-50">
              سودوكو الفائقة
            </h1>
            <p className="text-[10px] md:text-xs text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
              SUPER SUDOKU CHAMPIONSHIP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Restart Button */}
          <button
            id="btn-restart-game"
            onClick={handleRestartClick}
            className={`flex items-center gap-1.5 p-2.5 rounded-2xl transition-all text-xs font-bold whitespace-nowrap cursor-pointer active:scale-95 ${
              confirmRestart
                ? 'bg-rose-500 text-white border-transparent hover:bg-rose-600 animate-pulse'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20'
            }`}
            title={confirmRestart ? 'انقر مجدداً للتأكيد' : 'إعادة اللعب من جديد (Restart)'}
          >
            <RotateCcw size={18} className={confirmRestart ? 'animate-spin' : ''} />
            {confirmRestart && <span className="text-[10px] sm:text-xs">تأكيد البدء؟</span>}
          </button>

          {/* Theme Switcher Button */}
          <button
            id="btn-theme-switcher"
            onClick={() => setIsDarkMode(prev => !prev)}
            className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 active:scale-95 transition-all text-sm font-semibold cursor-pointer"
            title={isDarkMode ? 'الوضع المضيء (Light mode)' : 'الوضع المظلم (Dark mode)'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 w-full max-w-[480px] mx-auto flex flex-col justify-center">
        
        {/* 2. Game Level Status & Timer & Mistakes wrapper */}
        <TopBar
          difficulty={difficulty}
          mistakes={mistakes}
          isPaused={isPaused}
          isWon={isWon}
          isGameOver={isGameOver}
          initialSeconds={elapsedSeconds}
          resetTrigger={resetTrigger}
          onTimeUpdate={handleTimeUpdate}
          onTogglePause={() => setIsPaused(prev => !prev)}
          onDifficultyChange={(newDiff: Difficulty) => {
            startNewGame(newDiff);
          }}
        />

        {/* 3. The Interactive 9x9 Sudoku Board Grid */}
        <SudokuGrid
          grid={grid}
          activeCell={activeCell}
          isPaused={isPaused}
          onSelectCell={(row, col) => {
            if (!isPaused && !isWon && !isGameOver) {
              setActiveCell({ row, col });
            }
          }}
          onResume={() => setIsPaused(false)}
        />

        {/* 4. Controls Console (Undo, Erase, Notes, Hint) */}
        <Controls
          onUndo={undo}
          onErase={eraseCell}
          onHint={getHint}
          onToggleNotes={() => setNotesMode(prev => !prev)}
          notesMode={notesMode}
          historyLength={history.length}
          disabled={isPaused || isWon || isGameOver}
        />

        {/* 5. Numeric Keyboard input buttons */}
        <NumberPad
          grid={grid}
          onNumberSelect={(val) => setCellValue(val)}
          disabled={isPaused || isWon || isGameOver || !activeCell}
        />

        {/* Bottom Status Info Banner */}
        <div className="mt-5 text-center text-[10px] md:text-xs text-zinc-400 dark:text-zinc-650 font-semibold uppercase tracking-wider select-none">
          انقر فوق خلية في الشبكة ثم اختر رقماً لإدخاله
        </div>
      </main>

      {/* 6. Modals & Popup screens */}

      {/* WIN / SUCCESS MODAL SCREEN */}
      {isWon && (
        <div id="win-modal" className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white dark:bg-zinc-900 max-w-sm w-full p-6 sm:p-8 rounded-4xl shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden transform transition-all animate-scale-up">
            
            {/* Victory Badge */}
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center rounded-3xl text-emerald-500 mb-4 animate-pulse">
              <Award className="h-10 w-10 stroke-current animate-bounce" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 mb-2">تهانينا! فوز ساحر</h2>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mb-6">لقد حللت اللعبة بنجاح وبكفاءة ذكاء تامة!</p>
            
            {/* Stats list */}
            <div className="bg-zinc-50 dark:bg-zinc-850/50 p-4 rounded-3xl text-right text-xs sm:text-sm space-y-2 mb-6 border border-zinc-150 dark:border-zinc-800">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">مستوى الصعوبة:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-100 z-10">
                  {difficulty === 'easy' ? 'سهل (Easy)' : difficulty === 'medium' ? 'متوسط (Medium)' : 'صعب (Hard)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">الوقت المستغرق:</span>
                <span className="font-bold font-mono text-zinc-800 dark:text-zinc-100">
                  {formatSeconds(elapsedSeconds)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">عدد الأخطاء المرتكبة:</span>
                <span className="font-bold text-zinc-805 dark:text-zinc-102">
                  {mistakes} / 3
                </span>
              </div>
            </div>

            {/* Restart match */}
            <button
              id="win-restart-btn"
              onClick={() => startNewGame(difficulty)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-md rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>لعب مباراة جديدة</span>
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL SCREEN */}
      {isGameOver && (
        <div id="game-over-modal" className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white dark:bg-zinc-900 max-w-sm w-full p-6 sm:p-8 rounded-4xl shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden transform transition-all animate-scale-up">
            
            {/* Game over Badge */}
            <div className="mx-auto w-16 h-16 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-400/20 flex items-center justify-center rounded-3xl text-rose-500 mb-4 scale-110">
              <AlertOctagon className="h-10 w-10 stroke-current animate-pulse animate-bounce" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 mb-2">انتهت اللعبة! Game Over</h2>
            <p className="text-rose-600 dark:text-rose-400 text-sm font-bold mb-6">لقد تجاوزت الحد الأقصى للأخطاء المسموح بها (3/3).</p>
            
            {/* Game stats panel */}
            <div className="bg-zinc-50 dark:bg-zinc-850/50 p-4 rounded-3xl text-right text-xs sm:text-sm space-y-2 mb-6 border border-zinc-150 dark:border-zinc-800">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">مستوى الصعوبة:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-100">
                  {difficulty === 'easy' ? 'سهل (Easy)' : difficulty === 'medium' ? 'متوسط (Medium)' : 'صعب (Hard)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">تم البقاء لمدة:</span>
                <span className="font-bold font-mono text-zinc-800 dark:text-zinc-100">
                  {formatSeconds(elapsedSeconds)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* Restart current difficulty */}
              <button
                id="gameover-restart-btn"
                onClick={() => startNewGame(difficulty)}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-md rounded-2xl transition-all shadow-lg hover:shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>إعادة المحاولة مجدداً</span>
              </button>

              {/* Try easy match */}
              {difficulty !== 'easy' && (
                <button
                  id="gameover-easy-btn"
                  onClick={() => startNewGame('easy')}
                  className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-805 hover:bg-zinc-200 dark:hover:bg-zinc-755 text-zinc-700 dark:text-zinc-200 font-bold text-sm rounded-2xl transition-all"
                >
                  جرب المستوى السهل (Easy)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer credits and information */}
      <footer className="w-full max-w-[480px] mx-auto mt-6 border-t border-zinc-200 dark:border-zinc-900 pt-4 text-center select-none">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-semibold tracking-wide">
          صُنِعَ بأعلى أداء وتجاوب للعمل بكل الأجهزة • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
