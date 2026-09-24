import { Grid } from './types';

/**
 * Checks if placing `num` at (row, col) is valid according to Sudoku rules.
 */
export function isValidPlacement(grid: Grid, row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }

  // Check 3x3 block
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) return false;
    }
  }

  return true;
}

/**
 * Finds all cell coordinates that violate Sudoku rules (duplicates in row, col, or 3x3 block).
 */
export function findConflictingCells(grid: Grid): boolean[][] {
  const conflicts: boolean[][] = Array.from({ length: 9 }, () => Array(9).fill(false));

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val !== 0) {
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(c);
      }
    }
    for (const cols of seen.values()) {
      if (cols.length > 1) {
        for (const c of cols) conflicts[r][c] = true;
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (val !== 0) {
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(r);
      }
    }
    for (const rows of seen.values()) {
      if (rows.length > 1) {
        for (const r of rows) conflicts[r][c] = true;
      }
    }
  }

  // Check 3x3 blocks
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map<number, Array<[number, number]>>();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const val = grid[r][c];
          if (val !== 0) {
            if (!seen.has(val)) seen.set(val, []);
            seen.get(val)!.push([r, c]);
          }
        }
      }
      for (const coords of seen.values()) {
        if (coords.length > 1) {
          for (const [r, c] of coords) conflicts[r][c] = true;
        }
      }
    }
  }

  return conflicts;
}

/**
 * Solves a 9x9 Sudoku board in-place using backtracking.
 * Returns true if a solution was found, false otherwise.
 */
export function solveSudoku(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveSudoku(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Counts the number of solutions for a given board, up to `limit`.
 * Useful to ensure a puzzle has exactly 1 unique solution.
 */
export function countSolutions(grid: Grid, limit: number = 2): number {
  let count = 0;

  function backtrack(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              if (backtrack()) return true; // Stop early if limit reached
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }

  backtrack();
  return count;
}
