import {
  Difficulty,
  DIFFICULTY_CONFIGS,
  CellData,
  MoveAction,
  GameStatus,
  GameStats,
} from './types';
import { generatePuzzle } from './generator';

const STORAGE_KEY = 'sudoku_ts_saved_game_v2';

export class SudokuGame {
  public board: CellData[][] = [];
  public selectedCell: { row: number; col: number } | null = null;
  public isNotesMode: boolean = false;
  public history: MoveAction[] = [];
  public redoStack: MoveAction[] = [];
  public difficulty: Difficulty = 'medium';
  public status: GameStatus = 'idle';
  public timerSeconds: number = 0;
  public mistakesCount: number = 0;
  public maxMistakes: number = 3;
  public hintsRemaining: number = 3;
  public hintsUsed: number = 0;

  // Track completed lines to only celebrate each line once
  private completedRows: Set<number> = new Set();
  private completedCols: Set<number> = new Set();
  private completedBoxes: Set<number> = new Set();

  private onStateChangeCallback?: () => void;
  private onWinCallback?: (stats: GameStats) => void;
  private onGameOverCallback?: () => void;
  private onLineCompleteCallback?: (cells: Array<[number, number]>) => void;
  private onSoundTriggerCallback?: (sound: 'select' | 'place' | 'correct' | 'error' | 'line' | 'win') => void;

  constructor(difficulty: Difficulty = 'medium') {
    this.difficulty = difficulty;
    this.startNewGame(difficulty);
  }

  public setCallbacks(options: {
    onStateChange?: () => void;
    onWin?: (stats: GameStats) => void;
    onGameOver?: () => void;
    onLineComplete?: (cells: Array<[number, number]>) => void;
    onSoundTrigger?: (sound: 'select' | 'place' | 'correct' | 'error' | 'line' | 'win') => void;
  }) {
    this.onStateChangeCallback = options.onStateChange;
    this.onWinCallback = options.onWin;
    this.onGameOverCallback = options.onGameOver;
    this.onLineCompleteCallback = options.onLineComplete;
    this.onSoundTriggerCallback = options.onSoundTrigger;
  }

  private notify() {
    this.saveToStorage();
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  public startNewGame(difficulty?: Difficulty) {
    if (difficulty) {
      this.difficulty = difficulty;
    }

    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const { puzzle, solution } = generatePuzzle(this.difficulty);

    this.board = Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => {
        const val = puzzle[r][c];
        const isGiven = val !== 0;
        return {
          row: r,
          col: c,
          value: val,
          solution: solution[r][c],
          isGiven,
          isLocked: isGiven, // Given clues start locked
          notes: new Set<number>(),
          isError: false,
          isConflictPeer: false,
        };
      })
    );

    this.selectedCell = null;
    this.history = [];
    this.redoStack = [];
    this.timerSeconds = 0;
    this.mistakesCount = 0;
    this.maxMistakes = config.maxMistakes;
    this.hintsRemaining = config.initialHints;
    this.hintsUsed = 0;
    this.status = 'playing';

    this.completedRows.clear();
    this.completedCols.clear();
    this.completedBoxes.clear();

    this.updateErrorStates();
    this.notify();
  }

  public selectCell(row: number, col: number) {
    if (row < 0 || row >= 9 || col < 0 || col >= 9) return;
    this.selectedCell = { row, col };
    if (this.onSoundTriggerCallback) {
      this.onSoundTriggerCallback('select');
    }
    this.notify();
  }

  public toggleNotesMode() {
    this.isNotesMode = !this.isNotesMode;
    this.notify();
  }

  public inputNumber(num: number) {
    if (!this.selectedCell || this.status !== 'playing') return;
    const { row, col } = this.selectedCell;
    const cell = this.board[row][col];

    // Cannot edit given clues or already correctly solved/locked cells
    if (cell.isGiven || cell.isLocked) return;

    if (this.isNotesMode) {
      // Toggle note candidate
      const hasNote = cell.notes.has(num);
      if (hasNote) {
        cell.notes.delete(num);
      } else {
        cell.notes.add(num);
      }

      this.history.push({
        type: 'toggleNote',
        row,
        col,
        num,
        added: !hasNote,
      });
      this.redoStack = [];
      if (this.onSoundTriggerCallback) {
        this.onSoundTriggerCallback('place');
      }
    } else {
      // Direct value placement
      if (cell.value === num && cell.isError) {
        // Pressing same wrong number clears it
        this.eraseCell();
        return;
      }

      const prevValue = cell.value;
      const prevNotes = Array.from(cell.notes);
      const wasLocked = cell.isLocked;

      cell.value = num;
      cell.notes.clear();

      const isCorrect = num === cell.solution;

      if (isCorrect) {
        // Correct answer: Lock cell permanently
        cell.isLocked = true;
        cell.isError = false;
        this.removeConflictingNotes(row, col, num);

        if (this.onSoundTriggerCallback) {
          this.onSoundTriggerCallback('correct');
        }

        // Check for completed row, column, or 3x3 block
        this.checkForCompletedUnits(row, col);
      } else {
        // Incorrect answer
        cell.isLocked = false;
        cell.isError = true;
        this.mistakesCount++;

        if (this.onSoundTriggerCallback) {
          this.onSoundTriggerCallback('error');
        }

        // Check game over
        if (this.mistakesCount >= this.maxMistakes) {
          this.status = 'gameover';
          this.updateErrorStates();
          this.notify();
          if (this.onGameOverCallback) {
            this.onGameOverCallback();
          }
          return;
        }
      }

      this.history.push({
        type: 'setValue',
        row,
        col,
        prevValue,
        newValue: num,
        prevNotes,
        newNotes: [],
        wasLocked,
      });
      this.redoStack = [];

      this.updateErrorStates();

      if (this.checkWin()) {
        this.status = 'completed';
        if (this.onSoundTriggerCallback) {
          this.onSoundTriggerCallback('win');
        }
        if (this.onWinCallback) {
          this.onWinCallback({
            difficulty: this.difficulty,
            timeSeconds: this.timerSeconds,
            mistakes: this.mistakesCount,
            hintsUsed: this.hintsUsed,
          });
        }
      }
    }

    this.notify();
  }

  public eraseCell() {
    if (!this.selectedCell || this.status !== 'playing') return;
    const { row, col } = this.selectedCell;
    const cell = this.board[row][col];

    // Cannot erase given clues or locked correctly answered cells
    if (cell.isGiven || cell.isLocked || (cell.value === 0 && cell.notes.size === 0)) return;

    const prevValue = cell.value;
    const prevNotes = Array.from(cell.notes);

    cell.value = 0;
    cell.notes.clear();
    cell.isError = false;

    this.history.push({
      type: 'clear',
      row,
      col,
      prevValue,
      prevNotes,
    });
    this.redoStack = [];

    this.updateErrorStates();
    this.notify();
  }

  public undo() {
    if (this.history.length === 0 || this.status !== 'playing') return;
    const action = this.history.pop()!;
    this.redoStack.push(action);

    const cell = this.board[action.row][action.col];

    // If cell was locked by a correct input, do not allow reverting solved cell
    if (cell.isLocked && !cell.isGiven && action.type === 'setValue' && action.newValue === cell.solution) {
      // Keep locked solved cell
      return;
    }

    if (action.type === 'setValue') {
      cell.value = action.prevValue;
      cell.isLocked = action.wasLocked;
      cell.notes = new Set(action.prevNotes);
    } else if (action.type === 'toggleNote') {
      if (action.added) {
        cell.notes.delete(action.num);
      } else {
        cell.notes.add(action.num);
      }
    } else if (action.type === 'clear') {
      cell.value = action.prevValue;
      cell.notes = new Set(action.prevNotes);
    }

    this.selectedCell = { row: action.row, col: action.col };
    this.updateErrorStates();
    this.notify();
  }

  public redo() {
    if (this.redoStack.length === 0 || this.status !== 'playing') return;
    const action = this.redoStack.pop()!;
    this.history.push(action);

    const cell = this.board[action.row][action.col];

    if (action.type === 'setValue') {
      cell.value = action.newValue;
      cell.notes = new Set(action.newNotes);
      if (cell.value === cell.solution) {
        cell.isLocked = true;
        this.removeConflictingNotes(action.row, action.col, cell.value);
      }
    } else if (action.type === 'toggleNote') {
      if (action.added) {
        cell.notes.add(action.num);
      } else {
        cell.notes.delete(action.num);
      }
    } else if (action.type === 'clear') {
      cell.value = 0;
      cell.notes.clear();
      cell.isError = false;
    }

    this.selectedCell = { row: action.row, col: action.col };
    this.updateErrorStates();
    this.notify();
  }

  public giveHint(): boolean {
    if (this.status !== 'playing' || this.hintsRemaining <= 0) return false;

    // Pick target cell: selected cell if empty/wrong, else a random unsolved cell
    let targetRow = -1;
    let targetCol = -1;

    if (
      this.selectedCell &&
      !this.board[this.selectedCell.row][this.selectedCell.col].isLocked &&
      this.board[this.selectedCell.row][this.selectedCell.col].value !==
        this.board[this.selectedCell.row][this.selectedCell.col].solution
    ) {
      targetRow = this.selectedCell.row;
      targetCol = this.selectedCell.col;
    } else {
      const candidates: Array<{ r: number; c: number }> = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = this.board[r][c];
          if (!cell.isLocked && cell.value !== cell.solution) {
            candidates.push({ r, c });
          }
        }
      }

      if (candidates.length === 0) return false;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      targetRow = pick.r;
      targetCol = pick.c;
    }

    const cell = this.board[targetRow][targetCol];
    const prevValue = cell.value;
    const prevNotes = Array.from(cell.notes);
    const wasLocked = cell.isLocked;

    cell.value = cell.solution;
    cell.isLocked = true; // Lock hint cell as well
    cell.isError = false;
    cell.notes.clear();

    this.hintsRemaining--;
    this.hintsUsed++;

    if (this.onSoundTriggerCallback) {
      this.onSoundTriggerCallback('correct');
    }

    this.removeConflictingNotes(targetRow, targetCol, cell.solution);
    this.checkForCompletedUnits(targetRow, targetCol);

    this.history.push({
      type: 'setValue',
      row: targetRow,
      col: targetCol,
      prevValue,
      newValue: cell.solution,
      prevNotes,
      newNotes: [],
      wasLocked,
    });

    this.selectedCell = { row: targetRow, col: targetCol };
    this.updateErrorStates();

    if (this.checkWin()) {
      this.status = 'completed';
      if (this.onSoundTriggerCallback) {
        this.onSoundTriggerCallback('win');
      }
      if (this.onWinCallback) {
        this.onWinCallback({
          difficulty: this.difficulty,
          timeSeconds: this.timerSeconds,
          mistakes: this.mistakesCount,
          hintsUsed: this.hintsUsed,
        });
      }
    }

    this.notify();
    return true;
  }

  public addBonusHint() {
    this.hintsRemaining++;
    this.notify();
  }

  public reviveSecondChance() {
    if (this.status === 'gameover') {
      this.mistakesCount = Math.max(0, this.maxMistakes - 1);
      this.status = 'playing';
      this.notify();
    }
  }

  private checkForCompletedUnits(row: number, col: number) {
    const newlyCompletedCells: Array<[number, number]> = [];

    // Check row
    if (!this.completedRows.has(row)) {
      let rowComplete = true;
      for (let c = 0; c < 9; c++) {
        if (this.board[row][c].value !== this.board[row][c].solution) {
          rowComplete = false;
          break;
        }
      }
      if (rowComplete) {
        this.completedRows.add(row);
        for (let c = 0; c < 9; c++) newlyCompletedCells.push([row, c]);
      }
    }

    // Check col
    if (!this.completedCols.has(col)) {
      let colComplete = true;
      for (let r = 0; r < 9; r++) {
        if (this.board[r][col].value !== this.board[r][col].solution) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) {
        this.completedCols.add(col);
        for (let r = 0; r < 9; r++) newlyCompletedCells.push([r, col]);
      }
    }

    // Check 3x3 block
    const boxIdx = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    if (!this.completedBoxes.has(boxIdx)) {
      let boxComplete = true;
      const startR = Math.floor(row / 3) * 3;
      const startC = Math.floor(col / 3) * 3;
      for (let r = startR; r < startR + 3; r++) {
        for (let c = startC; c < startC + 3; c++) {
          if (this.board[r][c].value !== this.board[r][c].solution) {
            boxComplete = false;
            break;
          }
        }
      }
      if (boxComplete) {
        this.completedBoxes.add(boxIdx);
        for (let r = startR; r < startR + 3; r++) {
          for (let c = startC; c < startC + 3; c++) {
            newlyCompletedCells.push([r, c]);
          }
        }
      }
    }

    if (newlyCompletedCells.length > 0) {
      if (this.onSoundTriggerCallback) {
        this.onSoundTriggerCallback('line');
      }
      if (this.onLineCompleteCallback) {
        this.onLineCompleteCallback(newlyCompletedCells);
      }
    }
  }

  private removeConflictingNotes(row: number, col: number, num: number) {
    // Row and column
    for (let i = 0; i < 9; i++) {
      this.board[row][i].notes.delete(num);
      this.board[i][col].notes.delete(num);
    }
    // 3x3 Box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        this.board[r][c].notes.delete(num);
      }
    }
  }

  /**
   * Identifies errors and conflict peers:
   * - cell.isError = true ONLY for incorrect user values (red background + shake digit)
   * - cell.isConflictPeer = true for cells that share the same number in row/col/box (blue matching + pulse)
   */
  public updateErrorStates() {
    // Reset all flags first
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this.board[r][c].isError = false;
        this.board[r][c].isConflictPeer = false;
      }
    }

    // 1. Identify erroneous cells (non-zero value that does NOT equal solution)
    const errorCells: Array<{ r: number; c: number; val: number }> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];
        if (cell.value !== 0 && cell.value !== cell.solution) {
          cell.isError = true;
          errorCells.push({ r, c, val: cell.value });
        }
      }
    }

    // 2. For each error cell, find conflicting peers with the same number in row, col, or box
    for (const err of errorCells) {
      const errBoxR = Math.floor(err.r / 3);
      const errBoxC = Math.floor(err.c / 3);

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (r === err.r && c === err.c) continue;
          const other = this.board[r][c];
          if (other.value === err.val) {
            const sameRow = r === err.r;
            const sameCol = c === err.c;
            const sameBox = Math.floor(r / 3) === errBoxR && Math.floor(c / 3) === errBoxC;

            if (sameRow || sameCol || sameBox) {
              // The other cell is a conflict peer (should NOT be red, but animated peer)
              if (!other.isError) {
                other.isConflictPeer = true;
              }
            }
          }
        }
      }
    }
  }

  public checkWin(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];
        if (cell.value === 0 || cell.value !== cell.solution || cell.isError) {
          return false;
        }
      }
    }
    return true;
  }

  public getNumberCounts(): Record<number, number> {
    const counts: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = this.board[r][c].value;
        if (val >= 1 && val <= 9) {
          counts[val]++;
        }
      }
    }
    return counts;
  }

  public tickTimer() {
    if (this.status === 'playing') {
      this.timerSeconds++;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback();
      }
    }
  }

  public togglePause() {
    if (this.status === 'playing') {
      this.status = 'paused';
    } else if (this.status === 'paused') {
      this.status = 'playing';
    }
    this.notify();
  }

  public saveToStorage() {
    try {
      const serializableBoard = this.board.map((row) =>
        row.map((cell) => ({
          ...cell,
          notes: Array.from(cell.notes),
        }))
      );
      const data = {
        board: serializableBoard,
        difficulty: this.difficulty,
        timerSeconds: this.timerSeconds,
        mistakesCount: this.mistakesCount,
        maxMistakes: this.maxMistakes,
        hintsRemaining: this.hintsRemaining,
        hintsUsed: this.hintsUsed,
        status: this.status,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  public loadFromStorage(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;
      const data = JSON.parse(saved);

      if (!data.board || !Array.isArray(data.board) || data.board.length !== 9) {
        return false;
      }

      this.difficulty = data.difficulty || 'medium';
      this.timerSeconds = data.timerSeconds || 0;
      this.mistakesCount = data.mistakesCount || 0;
      this.maxMistakes = data.maxMistakes || 3;
      this.hintsRemaining = data.hintsRemaining ?? DIFFICULTY_CONFIGS[this.difficulty].initialHints;
      this.hintsUsed = data.hintsUsed || 0;
      this.status = data.status === 'completed' || data.status === 'gameover' ? 'playing' : data.status || 'playing';

      this.board = data.board.map((row: any[]) =>
        row.map((c: any) => ({
          ...c,
          notes: new Set<number>(c.notes || []),
          isLocked: c.isGiven || (c.value !== 0 && c.value === c.solution),
        }))
      );

      this.history = [];
      this.redoStack = [];
      this.selectedCell = null;
      this.updateErrorStates();
      this.notify();
      return true;
    } catch {
      return false;
    }
  }
}
