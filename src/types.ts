/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Cell {
  row: number;
  col: number;
  val: number | null; // Value typed by player or initial clue
  correctVal: number; // The correct solved value (1-9)
  isInitial: boolean; // Whether this cell is part of the starting board
  isError: boolean; // True if val is incorrect (val !== correctVal)
  notes: number[]; // Pencil marks/notes (1-9)
}

export type GridType = Cell[][];

export interface HistoryState {
  grid: GridType;
  mistakes: number;
  notesMode: boolean;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimeEasy: number | null;
  bestTimeMedium: number | null;
  bestTimeHard: number | null;
}
