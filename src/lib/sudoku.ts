/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Difficulty, GridType, Cell } from '../types';

// Helper to shuffle an array in place
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Check if placing a number in a board position is valid
export function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    // Check row
    if (board[row][i] === num && i !== col) return false;
    // Check col
    if (board[i][col] === num && i !== row) return false;
    // Check 3x3 Box
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num && (boxRow !== row || boxCol !== col)) return false;
  }
  return true;
}

// Fill a 3x3 box with shuffled numbers 1-9
function fillBox(board: number[][], row: number, col: number) {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let idx = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      board[row + r][col + c] = nums[idx++];
    }
  }
}

// Generate a completed valid Sudoku board with absolute safety limits
function generateCompleteGrid(): number[][] {
  let attempts = 0;
  const maxOverallAttempts = 10; // restart overall generation if somehow stuck

  while (attempts < maxOverallAttempts) {
    attempts++;
    const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
    
    // Optimize backtracking entry: prefill three independent diagonal 3x3 boxes (0,0; 3,3; 6,6)
    // This reduces searching space dramatically and makes solving ~100x faster
    fillBox(board, 0, 0);
    fillBox(board, 3, 3);
    fillBox(board, 6, 6);

    let steps = 0;
    const maxSteps = 5000; // safe upper bound for single board backtrack recursive steps
    let success = false;

    function fill(row = 0, col = 0): boolean {
      steps++;
      if (steps > maxSteps) return false; // trigger fail-fast restart if stuck in highly contested branch

      if (col === 9) {
        row++;
        col = 0;
      }
      if (row === 9) return true;

      // Skip already filled diagonal box cells
      if (board[row][col] !== 0) {
        return fill(row, col + 1);
      }

      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const num of nums) {
        if (isValidPlacement(board, row, col, num)) {
          board[row][col] = num;
          if (fill(row, col + 1)) return true;
          board[row][col] = 0;
        }
      }
      return false;
    }

    if (fill(0, 0)) {
      return board;
    }
  }

  // Absolute fallback case if random shuffles run into ultra-rare worst cases 
  // Return a seeded valid Sudoku grid to ensure 100% successful and silent recovery
  return [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, 9, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, 8, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, 3, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8]
  ];
}

// Count solutions of a board to verify uniqueness with strict speed limits
function countSolutions(board: number[][], limit = 2): number {
  let solutionsCount = 0;
  let statesExamined = 0;
  const maxStates = 1200; // strict recursion cutoff to avoid hanging user browser during masking

  function solve(row = 0, col = 0): boolean {
    statesExamined++;
    if (statesExamined > maxStates) {
      solutionsCount = limit; // treat as multi-solution to fallback safely
      return true; 
    }

    if (col === 9) {
      row++;
      col = 0;
    }
    if (row === 9) {
      solutionsCount++;
      return solutionsCount >= limit; // stop early if we find 'limit' solutions (not unique)
    }

    if (board[row][col] !== 0) {
      return solve(row, col + 1);
    }

    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        if (solve(row, col + 1)) {
          board[row][col] = 0;
          return true;
        }
        board[row][col] = 0;
      }
    }
    return false;
  }

  solve();
  return solutionsCount;
}

/**
 * Generates a starting puzzle grid and the correct solution grid.
 * Target clue counts:
 * - Easy: ~45 clue cells
 * - Medium: ~35 clue cells
 * - Hard: ~26 clue cells
 */
export function generateSudoku(difficulty: Difficulty): {
  startGrid: GridType;
  solution: number[][];
} {
  const complete = generateCompleteGrid();
  
  // Clone the solved matrix to create the starting puzzle
  const puzzle = complete.map(row => [...row]);

  // Target clues based on difficulty
  let targetClues = 45;
  if (difficulty === 'medium') {
    targetClues = 35;
  } else if (difficulty === 'hard') {
    targetClues = 26;
  }

  // Create list of all 81 positions
  let cells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push({ r, c });
    }
  }
  cells = shuffle(cells);

  let clearedCells = 0;
  const maxToClear = 81 - targetClues;

  for (const cell of cells) {
    if (clearedCells >= maxToClear) break;

    const originalVal = puzzle[cell.r][cell.c];
    puzzle[cell.r][cell.c] = 0; // Temp clear

    // Check if unique solution is preserved
    const tempBoard = puzzle.map(row => [...row]);
    if (countSolutions(tempBoard) === 1) {
      clearedCells++;
    } else {
      puzzle[cell.r][cell.c] = originalVal; // Put it back
    }
  }

  // Convert boards into custom GridType components
  const startGrid: GridType = [];
  for (let r = 0; r < 9; r++) {
    const rowCells: Cell[] = [];
    for (let c = 0; c < 9; c++) {
      const val = puzzle[r][c] === 0 ? null : puzzle[r][c];
      rowCells.push({
        row: r,
        col: c,
        val: val,
        correctVal: complete[r][c],
        isInitial: val !== null,
        isError: false,
        notes: [],
      });
    }
    startGrid.push(rowCells);
  }

  return {
    startGrid,
    solution: complete,
  };
}
