import { Grid, Difficulty, DIFFICULTY_CONFIGS } from './types';
import { isValidPlacement, countSolutions } from './solver';

/**
 * Fast Mulberry32 PRNG for deterministic Daily seed generation.
 */
export function createMulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a string like "2026-09-24" into a numeric seed.
 */
export function hashDateStringToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) + 1234567;
}

/**
 * Shuffles an array in-place using Fisher-Yates with optional random function.
 */
function shuffle<T>(array: T[], randFn: () => number = Math.random): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randFn() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Creates an empty 9x9 grid.
 */
export function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/**
 * Clones a 9x9 grid.
 */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

/**
 * Fills a 3x3 block with random permutation of numbers 1-9.
 */
function fillBox(grid: Grid, startRow: number, startCol: number, randFn: () => number = Math.random): void {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], randFn);
  let idx = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[startRow + r][startCol + c] = nums[idx++];
    }
  }
}

/**
 * Recursively fills the remaining cells with randomized candidate order.
 */
function solveRandomly(grid: Grid, randFn: () => number = Math.random): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], randFn);
        for (const num of candidates) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveRandomly(grid, randFn)) return true;
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
 * Generates a completely solved, valid random 9x9 Sudoku board.
 */
export function generateFullSolution(randFn: () => number = Math.random): Grid {
  const grid = createEmptyGrid();

  // Fill the 3 independent diagonal 3x3 blocks
  fillBox(grid, 0, 0, randFn);
  fillBox(grid, 3, 3, randFn);
  fillBox(grid, 6, 6, randFn);

  // Solve the rest with randomized candidate order
  solveRandomly(grid, randFn);

  return grid;
}

export interface GeneratedPuzzle {
  puzzle: Grid;
  solution: Grid;
}

/**
 * Generates a new puzzle with guaranteed unique solution.
 * Accepts an optional numeric seed for deterministic daily puzzles.
 */
export function generatePuzzle(difficulty: Difficulty, seed?: number): GeneratedPuzzle {
  const randFn = seed !== undefined ? createMulberry32(seed) : Math.random;
  const config = DIFFICULTY_CONFIGS[difficulty];
  const solution = generateFullSolution(randFn);
  const puzzle = cloneGrid(solution);

  // Generate list of all 81 positions and shuffle them
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions, randFn);

  let remainingClues = 81;
  const targetClues = config.clues;

  for (const [r, c] of positions) {
    if (remainingClues <= targetClues) {
      break;
    }

    const originalValue = puzzle[r][c];
    puzzle[r][c] = 0;

    // Check if puzzle still has exactly one unique solution
    const testCopy = cloneGrid(puzzle);
    if (countSolutions(testCopy, 2) === 1) {
      remainingClues--;
    } else {
      // Revert if clearing this cell creates ambiguity
      puzzle[r][c] = originalValue;
    }
  }

  return { puzzle, solution };
}
