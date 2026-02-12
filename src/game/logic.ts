import type { Grid, Piece } from "./types";

export const GRID_SIZE = 8;

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
}

export function canPlace(grid: Grid, piece: Piece, row: number, col: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const gr = row + r;
      const gc = col + c;
      if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) return false;
      if (grid[gr][gc] !== null) return false;
    }
  }
  return true;
}

export function placePiece(grid: Grid, piece: Piece, row: number, col: number): Grid {
  const newGrid = grid.map(r => [...r]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      newGrid[row + r][col + c] = { color: piece.color };
    }
  }
  return newGrid;
}

export function countPieceCells(piece: Piece): number {
  let count = 0;
  for (const row of piece.shape) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}

interface ClearResult {
  grid: Grid;
  linesCleared: number;
  cellsCleared: number;
  clearedPositions: Set<string>;
}

export function findClears(grid: Grid): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every(cell => cell !== null)) {
      rows.push(r);
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }

  return { rows, cols };
}

export function markClearing(grid: Grid, rows: number[], cols: number[]): Grid {
  const newGrid = grid.map(r => r.map(c => c ? { ...c } : null));
  for (const r of rows) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid[r][c]) newGrid[r][c] = { ...newGrid[r][c]!, clearing: true };
    }
  }
  for (const c of cols) {
    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r][c]) newGrid[r][c] = { ...newGrid[r][c]!, clearing: true };
    }
  }
  return newGrid;
}

export function clearLines(grid: Grid, rows: number[], cols: number[]): ClearResult {
  const linesCleared = rows.length + cols.length;

  if (linesCleared === 0) {
    return { grid, linesCleared: 0, cellsCleared: 0, clearedPositions: new Set() };
  }

  const clearedPositions = new Set<string>();
  const newGrid = grid.map(r => [...r]);

  for (const r of rows) {
    for (let c = 0; c < GRID_SIZE; c++) {
      clearedPositions.add(`${r},${c}`);
      newGrid[r][c] = null;
    }
  }

  for (const c of cols) {
    for (let r = 0; r < GRID_SIZE; r++) {
      clearedPositions.add(`${r},${c}`);
      newGrid[r][c] = null;
    }
  }

  return {
    grid: newGrid,
    linesCleared,
    cellsCleared: clearedPositions.size,
    clearedPositions,
  };
}

export function calculateScore(cellsPlaced: number, linesCleared: number): number {
  let score = cellsPlaced;
  if (linesCleared > 0) {
    // Bonus for clearing: 10 per line, with combo multiplier
    score += linesCleared * 10 * linesCleared;
  }
  return score;
}

export function canPieceFitAnywhere(grid: Grid, piece: Piece): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (canPlace(grid, piece, r, c)) return true;
    }
  }
  return false;
}

export function isGameOver(grid: Grid, pieces: (Piece | null)[]): boolean {
  const remaining = pieces.filter((p): p is Piece => p !== null);
  if (remaining.length === 0) return false;
  return remaining.every(piece => !canPieceFitAnywhere(grid, piece));
}
