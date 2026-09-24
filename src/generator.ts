import { Grid, Difficulty, DIFFICULTY_CONFIGS } from './types';
import { isValidPlacement, countSolutions } from './solver';

/**
 * Shuffles an array in-place using Fisher-Yates algorithm.
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
function fillBox(grid: Grid, startRow: number, startCol: number): void {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let idx = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[startRow + r][startCol + c] = nums[idx++];
    }
  }
}

/**
 * Recursively fills the remaining cells with random candidate order.
 */
function solveRandomly(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of candidates) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveRandomly(grid)) return true;
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
export function generateFullSolution(): Grid {
  const grid = createEmptyGrid();

  // Fill the 3 independent diagonal 3x3 blocks
  fillBox(grid, 0, 0);
  fillBox(grid, 3, 3);
  fillBox(grid, 6, 6);

  // Solve the rest with randomized candidate order
  solveRandomly(grid);

  return grid;
}

export interface GeneratedPuzzle {
  puzzle: Grid;
  solution: Grid;
}

/**
 * Generates a new puzzle with guaranteed unique solution for the specified difficulty.
 */
export function generatePuzzle(difficulty: Difficulty): GeneratedPuzzle {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const solution = generateFullSolution();
  const puzzle = cloneGrid(solution);

  // Generate list of all 81 positions and shuffle them
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

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
