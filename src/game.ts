import {
  Difficulty,
  DIFFICULTY_CONFIGS,
  GameMode,
  CellData,
  MoveAction,
  GameStatus,
  GameStats,
  Perk,
  PlayerStats,
} from './types';
import { generatePuzzle, hashDateStringToSeed } from './generator';

const STORAGE_KEY = 'sudoku_pulse_saved_game_v3';
const STATS_KEY = 'sudoku_pulse_player_stats_v1';

export class SudokuGame {
  public board: CellData[][] = [];
  public selectedCell: { row: number; col: number } | null = null;
  public isNotesMode: boolean = false;
  public history: MoveAction[] = [];
  public redoStack: MoveAction[] = [];
  public difficulty: Difficulty = 'medium';
  public mode: GameMode = 'classic';
  public status: GameStatus = 'idle';
  public timerSeconds: number = 0;
  public mistakesCount: number = 0;
  public maxMistakes: number = 3;
  public hintsRemaining: number = 3;
  public hintsUsed: number = 0;

  // Pulse & Combo Engine
  public score: number = 0;
  public comboCount: number = 0;
  public comboMultiplier: number = 1.0;
  public pulseEnergy: number = 0; // 0 to 100
  public isFeverMode: boolean = false;
  public feverSecondsLeft: number = 0;
  public maxComboAchieved: number = 0;

  // Perks
  public activePerks: Perk[] = [];
  public shieldActive: boolean = false;

  // Run Mode & Seed
  public runStage: number = 1;
  public currentSeed: number = 0;

  // Completed units
  private completedRows: Set<number> = new Set();
  private completedCols: Set<number> = new Set();
  private completedBoxes: Set<number> = new Set();

  // Callbacks
  private onStateChangeCallback?: () => void;
  private onWinCallback?: (stats: GameStats) => void;
  private onGameOverCallback?: () => void;
  private onLineCompleteCallback?: (cells: Array<[number, number]>) => void;
  private onSoundTriggerCallback?: (sound: 'select' | 'place' | 'correct' | 'error' | 'line' | 'win' | 'fever' | 'shield') => void;

  constructor(difficulty: Difficulty = 'medium', mode: GameMode = 'classic') {
    this.difficulty = difficulty;
    this.mode = mode;
  }

  public setCallbacks(options: {
    onStateChange?: () => void;
    onWin?: (stats: GameStats) => void;
    onGameOver?: () => void;
    onLineComplete?: (cells: Array<[number, number]>) => void;
    onSoundTrigger?: (sound: 'select' | 'place' | 'correct' | 'error' | 'line' | 'win' | 'fever' | 'shield') => void;
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

  public hasPerk(id: string): boolean {
    return this.activePerks.some((p) => p.id === id);
  }

  public startNewGame(options?: {
    difficulty?: Difficulty;
    mode?: GameMode;
    perks?: Perk[];
    seed?: number;
    keepScore?: boolean;
  }) {
    if (options?.difficulty) this.difficulty = options.difficulty;
    if (options?.mode) this.mode = options.mode;
    if (options?.perks) this.activePerks = options.perks;

    // Automatic difficulty scaling in Pulse Run
    if (this.mode === 'run') {
      if (this.runStage === 1) this.difficulty = 'easy';
      else if (this.runStage === 2) this.difficulty = 'medium';
      else if (this.runStage === 3) this.difficulty = 'hard';
      else this.difficulty = 'expert';
    }

    const config = DIFFICULTY_CONFIGS[this.difficulty];

    // Seed logic
    let seed: number | undefined = options?.seed;
    if (this.mode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      seed = hashDateStringToSeed(today);
    } else if (seed === undefined) {
      seed = Math.floor(Math.random() * 899999) + 100000;
    }
    this.currentSeed = seed;

    const { puzzle, solution } = generatePuzzle(this.difficulty, seed);

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
          isLocked: isGiven,
          notes: new Set<number>(),
          isError: false,
          isConflictPeer: false,
          isInFog: this.isFogActive(),
          isBeacon: isGiven,
        };
      })
    );

    this.selectedCell = null;
    this.history = [];
    this.redoStack = [];
    this.timerSeconds = 0;
    this.mistakesCount = 0;
    this.maxMistakes = config.maxMistakes + (this.hasPerk('extra_heart') ? 2 : 0);
    this.hintsRemaining = config.initialHints + (this.hasPerk('power_bank') ? 1 : 0);
    this.hintsUsed = 0;

    // Pulse & Score state
    if (!options?.keepScore) {
      this.score = 0;
      this.runStage = 1;
    }
    this.comboCount = 0;
    this.comboMultiplier = this.hasPerk('combo_master') ? 2.0 : 1.0;
    this.pulseEnergy = 0;
    this.isFeverMode = false;
    this.feverSecondsLeft = 0;
    this.maxComboAchieved = 0;

    // Perks
    this.shieldActive = this.hasPerk('neon_shield');

    this.completedRows.clear();
    this.completedCols.clear();
    this.completedBoxes.clear();

    this.status = 'playing';

    if (this.hasPerk('auto_scanner')) {
      this.fillAllCandidates();
    }

    this.updateErrorStates();
    this.updateFogVisibility();
    this.notify();
  }

  public isFogActive(): boolean {
    if (this.mode === 'fog') return true;
    if (this.mode === 'run' && this.runStage >= 2 && this.runStage % 2 === 0) return true;
    return false;
  }

  public getRunModifierDescription(): string {
    if (this.mode !== 'run') return '';
    switch (this.runStage) {
      case 1:
        return 'Базовый сектор (Обычные условия)';
      case 2:
        return '🌫️ Аномалия: Туман войны!';
      case 3:
        return '⚡ Импульсный шторм (Сложная сетка)';
      case 4:
        return '🔥 Босс-сектор (Экспертная сетка)';
      default:
        return `💀 Глубокий космос (Сектор ${this.runStage})`;
    }
  }

  public advanceRunStage(newPerk: Perk) {
    if (this.mode !== 'run') return;
    this.runStage++;
    if (!this.activePerks.some((p) => p.id === newPerk.id)) {
      this.activePerks.push(newPerk);
    }
    const stageClearBonus = 1500 * (this.runStage - 1);
    this.score += stageClearBonus;

    if (this.hasPerk('neon_shield')) {
      this.shieldActive = true;
    }
    this.hintsRemaining = Math.min(5, this.hintsRemaining + 1);

    this.startNewGame({
      mode: 'run',
      keepScore: true,
    });
  }

  public fillAllCandidates() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];
        if (cell.value === 0) {
          cell.notes.clear();
          for (let n = 1; n <= 9; n++) {
            if (this.isValidPlacement(r, c, n)) {
              cell.notes.add(n);
            }
          }
        }
      }
    }
    this.notify();
  }

  public isValidPlacement(row: number, col: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (i !== col && this.board[row][i].value === num) return false;
      if (i !== row && this.board[i][col].value === num) return false;
    }
    const startR = Math.floor(row / 3) * 3;
    const startC = Math.floor(col / 3) * 3;
    for (let r = startR; r < startR + 3; r++) {
      for (let c = startC; c < startC + 3; c++) {
        if ((r !== row || c !== col) && this.board[r][c].value === num) return false;
      }
    }
    return true;
  }

  public selectCell(row: number, col: number) {
    if (row < 0 || row >= 9 || col < 0 || col >= 9) return;
    this.selectedCell = { row, col };
    if (this.onSoundTriggerCallback) {
      this.onSoundTriggerCallback('select');
    }
    this.updateFogVisibility();
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

    if (cell.isGiven || cell.isLocked) return;

    if (this.isNotesMode) {
      // Notes toggle
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
      // Direct placement
      if (cell.value === num && cell.isError) {
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
        // Correct Move
        cell.isLocked = true;
        cell.isBeacon = true;
        cell.isError = false;
        this.removeConflictingNotes(row, col, num);

        // Combo & Pulse calculation
        this.comboCount++;
        this.maxComboAchieved = Math.max(this.maxComboAchieved, this.comboCount);

        let multiplierBonus = 1.0;
        if (this.comboCount >= 8) multiplierBonus = 5.0;
        else if (this.comboCount >= 5) multiplierBonus = 3.0;
        else if (this.comboCount >= 3) multiplierBonus = 2.0;
        else if (this.comboCount >= 2) multiplierBonus = 1.5;

        if (this.isFeverMode) {
          this.comboMultiplier = 10.0;
        } else {
          this.comboMultiplier = multiplierBonus;
        }

        // Energy gain
        const energyGain = (this.hasPerk('point_surge') ? 25 : 18);
        this.pulseEnergy = Math.min(100, this.pulseEnergy + energyGain);

        // Add score
        const pointsBase = 100;
        const perkScoreMult = this.hasPerk('point_surge') ? 1.5 : 1.0;
        this.score += Math.round(pointsBase * this.comboMultiplier * perkScoreMult);

        // Trigger Fever Mode if full
        if (this.pulseEnergy >= 100 && !this.isFeverMode) {
          this.triggerFeverMode();
        }

        if (this.onSoundTriggerCallback) {
          this.onSoundTriggerCallback('correct');
        }

        this.checkForCompletedUnits(row, col);
      } else {
        // Mistake made
        cell.isLocked = false;
        cell.isError = true;

        // Check Neon Shield Perk
        if (this.shieldActive) {
          this.shieldActive = false; // Consumed
          if (this.onSoundTriggerCallback) {
            this.onSoundTriggerCallback('shield');
          }
        } else {
          this.mistakesCount++;
          // Reset combo if not in Fever mode
          if (!this.isFeverMode) {
            this.comboCount = 0;
            this.comboMultiplier = 1.0;
            this.pulseEnergy = Math.max(0, this.pulseEnergy - 30);
          }

          if (this.onSoundTriggerCallback) {
            this.onSoundTriggerCallback('error');
          }

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
      this.updateFogVisibility();

      if (this.checkWin()) {
        this.handleGameWin();
      }
    }

    this.notify();
  }

  private triggerFeverMode() {
    this.isFeverMode = true;
    this.feverSecondsLeft = this.hasPerk('fever_overdrive') ? 17 : 12;
    this.comboMultiplier = 10.0;
    if (this.onSoundTriggerCallback) {
      this.onSoundTriggerCallback('fever');
    }
  }

  public updateFogVisibility() {
    if (!this.isFogActive()) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          this.board[r][c].isInFog = false;
        }
      }
      return;
    }

    const torchRadius = this.hasPerk('keen_eye') ? 2 : 1;
    const selR = this.selectedCell ? this.selectedCell.row : -1;
    const selC = this.selectedCell ? this.selectedCell.col : -1;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];

        // Torch visibility around cursor
        const distR = Math.abs(r - selR);
        const distC = Math.abs(c - selC);
        const inTorch = selR !== -1 && distR <= torchRadius && distC <= torchRadius;

        // Beacons: solved/given cells are illuminated
        const isBeacon = cell.isGiven || cell.isLocked;

        // Beacons also illuminate orthogonal neighbors
        let nearBeacon = false;
        if (!isBeacon) {
          const neighbors = [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ];
          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
              if (this.board[nr][nc].isBeacon) {
                nearBeacon = true;
                break;
              }
            }
          }
        }

        cell.isInFog = !(inTorch || isBeacon || nearBeacon);
      }
    }
  }

  public eraseCell() {
    if (!this.selectedCell || this.status !== 'playing') return;
    const { row, col } = this.selectedCell;
    const cell = this.board[row][col];

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
    this.updateFogVisibility();
    this.notify();
  }

  public undo() {
    if (this.history.length === 0 || this.status !== 'playing') return;
    const action = this.history.pop()!;
    this.redoStack.push(action);

    const cell = this.board[action.row][action.col];

    if (cell.isLocked && !cell.isGiven && action.type === 'setValue' && action.newValue === cell.solution) {
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
    this.updateFogVisibility();
    this.notify();
  }

  public giveHint(): string | null {
    if (this.status !== 'playing' || this.hintsRemaining <= 0) return null;

    let targetRow = -1;
    let targetCol = -1;
    let explanation = '';

    if (
      this.selectedCell &&
      !this.board[this.selectedCell.row][this.selectedCell.col].isLocked &&
      this.board[this.selectedCell.row][this.selectedCell.col].value !==
        this.board[this.selectedCell.row][this.selectedCell.col].solution
    ) {
      targetRow = this.selectedCell.row;
      targetCol = this.selectedCell.col;
      const sol = this.board[targetRow][targetCol].solution;
      const validNums = [];
      for (let n = 1; n <= 9; n++) {
        if (this.isValidPlacement(targetRow, targetCol, n)) validNums.push(n);
      }
      if (validNums.length === 1) {
        explanation = `💡 Одиночка (Naked Single): в [Р${targetRow + 1}, С${targetCol + 1}] подходит только ${sol} (остальные цифры уже есть в линиях/блоке)!`;
      } else {
        explanation = `💡 Подсказка: в ячейке [Р${targetRow + 1}, С${targetCol + 1}] верная цифра — ${sol}.`;
      }
    } else {
      // Search for Naked Single across the board
      for (let r = 0; r < 9 && targetRow === -1; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = this.board[r][c];
          if (!cell.isLocked && cell.value !== cell.solution) {
            const validNums = [];
            for (let n = 1; n <= 9; n++) {
              if (this.isValidPlacement(r, c, n)) validNums.push(n);
            }
            if (validNums.length === 1) {
              targetRow = r;
              targetCol = c;
              explanation = `💡 Одиночка (Naked Single): в [Р${r + 1}, С${c + 1}] может стоять только ${cell.solution}!`;
              break;
            }
          }
        }
      }

      // Search for Hidden Single in rows if no Naked Single found
      if (targetRow === -1) {
        for (let r = 0; r < 9 && targetRow === -1; r++) {
          for (let num = 1; num <= 9; num++) {
            const possibleCols: number[] = [];
            for (let c = 0; c < 9; c++) {
              if (this.board[r][c].value === num) {
                possibleCols.length = 0;
                break;
              }
              if (this.board[r][c].value === 0 && this.isValidPlacement(r, c, num)) {
                possibleCols.push(c);
              }
            }
            if (possibleCols.length === 1) {
              const c = possibleCols[0];
              if (this.board[r][c].solution === num) {
                targetRow = r;
                targetCol = c;
                explanation = `💡 Скрытая одиночка: в строке ${r + 1} цифра ${num} может стоять только в столбце ${c + 1}!`;
                break;
              }
            }
          }
        }
      }

      // Fallback to random unsolved cell
      if (targetRow === -1) {
        const candidates: Array<{ r: number; c: number }> = [];
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const cell = this.board[r][c];
            if (!cell.isLocked && cell.value !== cell.solution) {
              candidates.push({ r, c });
            }
          }
        }

        if (candidates.length === 0) return null;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        targetRow = pick.r;
        targetCol = pick.c;
        explanation = `💡 Тактический ход: в [Р${targetRow + 1}, С${targetCol + 1}] раскрыта цифра ${this.board[targetRow][targetCol].solution}.`;
      }
    }

    const cell = this.board[targetRow][targetCol];
    const prevValue = cell.value;
    const prevNotes = Array.from(cell.notes);
    const wasLocked = cell.isLocked;

    cell.value = cell.solution;
    cell.isLocked = true;
    cell.isBeacon = true;
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
    this.updateFogVisibility();

    if (this.checkWin()) {
      this.handleGameWin();
    }

    this.notify();
    return explanation;
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

  private handleGameWin() {
    this.status = 'completed';
    this.updatePlayerStatsOnWin();

    if (this.onSoundTriggerCallback) {
      this.onSoundTriggerCallback('win');
    }
    if (this.onWinCallback) {
      this.onWinCallback({
        difficulty: this.difficulty,
        mode: this.mode,
        timeSeconds: this.timerSeconds,
        mistakes: this.mistakesCount,
        hintsUsed: this.hintsUsed,
        score: this.score,
        maxCombo: this.maxComboAchieved,
        activePerks: this.activePerks,
        runStage: this.runStage,
      });
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
        this.score += 500 * Math.round(this.comboMultiplier);
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
        this.score += 500 * Math.round(this.comboMultiplier);
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
        this.score += 750 * Math.round(this.comboMultiplier);
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
    for (let i = 0; i < 9; i++) {
      this.board[row][i].notes.delete(num);
      this.board[i][col].notes.delete(num);
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        this.board[r][c].notes.delete(num);
      }
    }
  }

  public updateErrorStates() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this.board[r][c].isError = false;
        this.board[r][c].isConflictPeer = false;
      }
    }

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

      // Fever Timer
      if (this.isFeverMode) {
        this.feverSecondsLeft--;
        if (this.feverSecondsLeft <= 0) {
          this.isFeverMode = false;
          this.pulseEnergy = 0;
          this.comboMultiplier = 1.0;
        }
      } else {
        // Natural combo pulse decay
        const decayRate = this.hasPerk('time_warp') ? 2 : 4;
        if (this.pulseEnergy > 0) {
          this.pulseEnergy = Math.max(0, this.pulseEnergy - decayRate);
          if (this.pulseEnergy === 0) {
            this.comboCount = 0;
            this.comboMultiplier = 1.0;
          }
        }
      }

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

  // --- STATS SYSTEM ---
  public static getPlayerStats(): PlayerStats {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTimeSeconds: { easy: null, medium: null, hard: null, expert: null },
      maxCombo: 0,
      totalScore: 0,
      dailyStreak: 0,
      lastDailyDate: null,
    };
  }

  private updatePlayerStatsOnWin() {
    try {
      const stats = SudokuGame.getPlayerStats();
      stats.gamesWon++;
      stats.totalScore += this.score;
      stats.maxCombo = Math.max(stats.maxCombo, this.maxComboAchieved);

      // Best time
      const curBest = stats.bestTimeSeconds[this.difficulty];
      if (curBest === null || this.timerSeconds < curBest) {
        stats.bestTimeSeconds[this.difficulty] = this.timerSeconds;
      }

      // Daily streak
      if (this.mode === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        if (stats.lastDailyDate !== today) {
          stats.dailyStreak++;
          stats.lastDailyDate = today;
        }
      }

      // Run records
      if (this.mode === 'run') {
        stats.bestRunStage = Math.max(stats.bestRunStage || 0, this.runStage);
        stats.bestRunScore = Math.max(stats.bestRunScore || 0, this.score);
      }

      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
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
        mode: this.mode,
        timerSeconds: this.timerSeconds,
        mistakesCount: this.mistakesCount,
        maxMistakes: this.maxMistakes,
        hintsRemaining: this.hintsRemaining,
        hintsUsed: this.hintsUsed,
        score: this.score,
        comboCount: this.comboCount,
        pulseEnergy: this.pulseEnergy,
        isFeverMode: this.isFeverMode,
        feverSecondsLeft: this.feverSecondsLeft,
        activePerks: this.activePerks,
        shieldActive: this.shieldActive,
        status: this.status,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
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
      this.mode = data.mode || 'classic';
      this.timerSeconds = data.timerSeconds || 0;
      this.mistakesCount = data.mistakesCount || 0;
      this.maxMistakes = data.maxMistakes || 3;
      this.hintsRemaining = data.hintsRemaining ?? 3;
      this.hintsUsed = data.hintsUsed || 0;
      this.score = data.score || 0;
      this.comboCount = data.comboCount || 0;
      this.pulseEnergy = data.pulseEnergy || 0;
      this.isFeverMode = data.isFeverMode || false;
      this.feverSecondsLeft = data.feverSecondsLeft || 0;
      this.activePerks = data.activePerks || [];
      this.shieldActive = data.shieldActive ?? false;
      this.status = data.status === 'completed' || data.status === 'gameover' ? 'idle' : data.status || 'playing';

      this.board = data.board.map((row: any[]) =>
        row.map((c: any) => ({
          ...c,
          notes: new Set<number>(c.notes || []),
          isLocked: c.isGiven || (c.value !== 0 && c.value === c.solution),
          isBeacon: c.isGiven || (c.value !== 0 && c.value === c.solution),
        }))
      );

      this.history = [];
      this.redoStack = [];
      this.selectedCell = null;
      this.updateErrorStates();
      this.updateFogVisibility();
      this.notify();
      return true;
    } catch {
      return false;
    }
  }
}
