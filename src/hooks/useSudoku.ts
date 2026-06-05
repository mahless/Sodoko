/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, GridType, Cell, HistoryState } from '../types';
import { generateSudoku } from '../lib/sudoku';

const LOCAL_STORAGE_KEY = 'sudoku_game_save_v2';

export function useSudoku(initialDifficulty: Difficulty = 'easy') {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [grid, setGrid] = useState<GridType>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [resetTrigger, setResetTrigger] = useState(0);
  const elapsedSecondsRef = useRef(0);

  // Load game state from local storage or create a new one
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Only restore if the game was unfinished (win/gameOver not achieved, mistakes < 3)
        const isGameUnfinished = 
          parsed.grid && 
          parsed.grid.length > 0 && 
          !parsed.isWon && 
          !parsed.isGameOver && 
          (parsed.mistakes ?? 0) < 3;

        if (isGameUnfinished) {
          setDifficulty(parsed.difficulty || 'easy');
          setGrid(parsed.grid);
          setSolution(parsed.solution || []);
          setActiveCell(parsed.activeCell || null);
          setNotesMode(parsed.notesMode || false);
          setMistakes(parsed.mistakes || 0);
          setIsWon(false);
          setIsGameOver(false);
          setHistory(parsed.history || []);
          elapsedSecondsRef.current = parsed.elapsedSeconds || 0;
          setIsPaused(true); // Auto-pause onload to protect player
          
          // Force update local storage with updated pause state
          const stateToSave = {
            ...parsed,
            isPaused: true,
            isWon: false,
            isGameOver: false,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load saved sudoku state:", e);
    }
    // If no saved state, start new game
    startNewGame(initialDifficulty, false);
  }, []);

  // Centralized Automatic Auto-Save Effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Avoid saving empty grid or finished game screens
    if (!grid || grid.length === 0 || isWon || isGameOver) {
      return;
    }

    try {
      const stateToSave = {
        difficulty,
        grid,
        solution,
        activeCell,
        notesMode,
        mistakes,
        isWon,
        isGameOver,
        history,
        elapsedSeconds: elapsedSecondsRef.current,
        isPaused,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to automatically save game state:", e);
    }
  }, [grid, solution, activeCell, notesMode, mistakes, isWon, isGameOver, history, isPaused, difficulty]);

  // Clean up localStorage on game complete (victory or loss)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isWon || isGameOver) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        console.error("Failed to clean up finished game state:", e);
      }
    }
  }, [isWon, isGameOver]);

  // Redefined helper as no-op; all state mutations are handled automatically by the central useEffect above.
  const saveToLocalStorage = (..._args: any[]) => {};

  // Create a backup snapshot for Undo
  const pushHistory = useCallback((currentGrid: GridType, currentMistakes: number, currentNotesMode: boolean) => {
    // Deep clone grid
    const clonedGrid = currentGrid.map(row => row.map(cell => ({ ...cell, notes: [...cell.notes] })));
    setHistory(prev => {
      const nextHist = [...prev, { grid: clonedGrid, mistakes: currentMistakes, notesMode: currentNotesMode }];
      // Keep history stack reasonable
      if (nextHist.length > 30) {
        nextHist.shift();
      }
      return nextHist;
    });
  }, []);

  // Set up new game
  const startNewGame = useCallback((diff: Difficulty, forceResetTimer = true) => {
    const { startGrid, solution: sol } = generateSudoku(diff);
    setDifficulty(diff);
    setGrid(startGrid);
    setSolution(sol);
    setActiveCell(null);
    setNotesMode(false);
    setMistakes(0);
    setIsWon(false);
    setIsGameOver(false);
    setIsPaused(false);
    setHistory([]);
    if (forceResetTimer) {
      elapsedSecondsRef.current = 0;
      setResetTrigger(prev => prev + 1);
    }

    // Explicit manual cleanup of state on manual restart / new game click
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch {}
  }, []);

  // Handle cell filling
  const setCellValue = useCallback((value: number) => {
    if (!activeCell || isWon || isGameOver || isPaused) return;
    const { row, col } = activeCell;
    const cell = grid[row][col];
    if (cell.isInitial) return;

    // Save history before moving
    pushHistory(grid, mistakes, notesMode);

    const updatedGrid = grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          if (notesMode) {
            // Notes mode: toggle number inside notes
            const alreadyExists = c.notes.includes(value);
            const notes = alreadyExists
              ? c.notes.filter(n => n !== value)
              : [...c.notes, value].sort((a, b) => a - b);
            return {
              ...c,
              val: null, // Clear value in notes mode
              isError: false,
              notes,
            };
          } else {
            // Regular mode: place value
            const isError = value !== c.correctVal;
            return {
              ...c,
              val: value,
              isError,
              notes: [], // Clear any notes in cell
            };
          }
        }
        return c;
      })
    );

    let nextMistakes = mistakes;
    let nextGameOver = isGameOver;

    if (!notesMode) {
      const isError = value !== cell.correctVal;
      if (isError) {
        nextMistakes = mistakes + 1;
        if (nextMistakes >= 3) {
          nextGameOver = true;
          setIsGameOver(true);
        }
        setMistakes(nextMistakes);
      } else {
        // Correct value: auto-clean notes in the same Row, Column, and 3x3 Block
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const inRow = r === row;
            const inCol = c === col;
            const inBlock = Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3);
            if ((inRow || inCol || inBlock) && !(r === row && c === col)) {
              updatedGrid[r][c] = {
                ...updatedGrid[r][c],
                notes: updatedGrid[r][c].notes.filter(n => n !== value),
              };
            }
          }
        }
      }
    }

    setGrid(updatedGrid);

    // Check Win State: every cell is correctly filled
    let win = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (updatedGrid[r][c].val !== updatedGrid[r][c].correctVal) {
          win = false;
          break;
        }
      }
      if (!win) break;
    }

    if (win) {
      setIsWon(true);
    }

    saveToLocalStorage(updatedGrid, solution, nextMistakes, win, nextGameOver, history);
  }, [activeCell, grid, mistakes, notesMode, isWon, isGameOver, isPaused, pushHistory, solution, history, difficulty]);

  // Erase cell value and notes
  const eraseCell = useCallback(() => {
    if (!activeCell || isWon || isGameOver || isPaused) return;
    const { row, col } = activeCell;
    const cell = grid[row][col];
    if (cell.isInitial) return;

    pushHistory(grid, mistakes, notesMode);

    const updatedGrid = grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          return {
            ...c,
            val: null,
            isError: false,
            notes: [],
          };
        }
        return c;
      })
    );

    setGrid(updatedGrid);
    saveToLocalStorage(updatedGrid, solution, mistakes, isWon, isGameOver, history);
  }, [activeCell, grid, mistakes, notesMode, isWon, isGameOver, isPaused, pushHistory, solution, history]);

  // Undo last action
  const undo = useCallback(() => {
    if (history.length === 0 || isWon || isGameOver || isPaused) return;

    const previousState = history[history.length - 1];
    setGrid(previousState.grid);
    setMistakes(previousState.mistakes);
    setNotesMode(previousState.notesMode);
    setHistory(prev => prev.slice(0, prev.length - 1));

    saveToLocalStorage(previousState.grid, solution, previousState.mistakes, isWon, isGameOver, history.slice(0, history.length - 1));
  }, [history, isWon, isGameOver, isPaused, solution]);

  // Request a hint for active cell (or first empty cell)
  const getHint = useCallback(() => {
    if (isWon || isGameOver || isPaused) return;

    let targetRow = -1;
    let targetCol = -1;

    if (activeCell) {
      const cell = grid[activeCell.row][activeCell.col];
      if (!cell.isInitial && cell.val !== cell.correctVal) {
        targetRow = activeCell.row;
        targetCol = activeCell.col;
      }
    }

    // If no active invalid/empty cell is selected, find the first empty cell
    if (targetRow === -1) {
      let found = false;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c].val === null) {
            targetRow = r;
            targetCol = c;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    // If still not found, search cells that have errors
    if (targetRow === -1) {
      let found = false;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c].val !== grid[r][c].correctVal) {
            targetRow = r;
            targetCol = c;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (targetRow !== -1 && targetCol !== -1) {
      pushHistory(grid, mistakes, notesMode);
      setActiveCell({ row: targetRow, col: targetCol });

      const correctVal = grid[targetRow][targetCol].correctVal;

      const updatedGrid = grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === targetRow && ci === targetCol) {
            return {
              ...c,
              val: correctVal,
              isError: false,
              notes: [],
            };
          }
          return c;
        })
      );

      // Clean same row, col, and block notes
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const inRow = r === targetRow;
          const inCol = c === targetCol;
          const inBlock = Math.floor(r / 3) === Math.floor(targetRow / 3) && Math.floor(c / 3) === Math.floor(targetCol / 3);
          if ((inRow || inCol || inBlock) && !(r === targetRow && c === targetCol)) {
            updatedGrid[r][c] = {
              ...updatedGrid[r][c],
              notes: updatedGrid[r][c].notes.filter(n => n !== correctVal),
            };
          }
        }
      }

      setGrid(updatedGrid);

      // Check Win State
      let win = true;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (updatedGrid[r][c].val !== updatedGrid[r][c].correctVal) {
            win = false;
            break;
          }
        }
        if (!win) break;
      }

      if (win) {
        setIsWon(true);
      }

      saveToLocalStorage(updatedGrid, solution, mistakes, win, isGameOver, history);
    }
  }, [grid, activeCell, mistakes, notesMode, isWon, isGameOver, isPaused, pushHistory, solution, history]);

  // Handle key navigation and actions
  const moveActiveCell = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (isWon || isGameOver || isPaused) return;
    if (!activeCell) {
      setActiveCell({ row: 0, col: 0 });
      return;
    }
    const { row, col } = activeCell;
    let nextRow = row;
    let nextCol = col;

    if (dir === 'up') nextRow = row > 0 ? row - 1 : 8;
    if (dir === 'down') nextRow = row < 8 ? row + 1 : 0;
    if (dir === 'left') nextCol = col > 0 ? col - 1 : 8;
    if (dir === 'right') nextCol = col < 8 ? col + 1 : 0;

    setActiveCell({ row: nextRow, col: nextCol });
  }, [activeCell, isWon, isGameOver, isPaused]);

  // Support saving elapsed time
  const handleTimeUpdate = useCallback((seconds: number) => {
    elapsedSecondsRef.current = seconds;
    
    // Direct, ultra-high performance serialization to avoid any rendering lag during gameplay ticks
    if (typeof window !== 'undefined' && !isWon && !isGameOver) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.elapsedSeconds = seconds;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error("Failed to update elapsed time in localStorage:", e);
      }
    }
  }, [isWon, isGameOver]);

  return {
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
    elapsedSeconds: elapsedSecondsRef.current,
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
  };
}
