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
  Achievement,
} from './types';
import { generatePuzzle, hashDateStringToSeed } from './generator';
import { evaluateNewAchievements } from './achievements';

const STORAGE_KEY = 'sudoku_pulse_saved_game_v3';
const STATS_KEY = 'sudoku_pulse_player_stats_v1';

export class SudokuGame {
  public board: CellData[][] = [];
  public selectedCell: { row: number; col: number } | null = null;
  public pinnedNumber: number | null = null;
  public isNotesMode: boolean = false;
  public isAutoNotesActive: boolean = false;
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
  public shieldCharges: number = 0;

  // Run Mode & Seed
  public runStage: number = 1;
  public currentSeed: number = 0;
  public lastSurgeSpawnTime: number = 0;

  // Completed units
  private completedRows: Set<number> = new Set();
  private completedCols: Set<number> = new Set();
  private completedBoxes: Set<number> = new Set();
  private echoCleanupTimer?: number;

  public static hasSavedGame(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return Boolean(
        data &&
        Array.isArray(data.board) &&
        data.board.length === 9 &&
        (data.status === 'playing' || data.status === 'paused')
      );
    } catch {
      return false;
    }
  }

  // Callbacks
  private onStateChangeCallback?: () => void;
  private onWinCallback?: (stats: GameStats) => void;
  private onGameOverCallback?: () => void;
  private onLineCompleteCallback?: (cells: Array<[number, number]>) => void;
  private onSoundTriggerCallback?: (sound: 'select' | 'place' | 'correct' | 'error' | 'line' | 'win' | 'fever' | 'fever_end' | 'shield') => void;
  private onSurgeCapturedCallback?: (bonusScore: number) => void;
  private onAchievementUnlockedCallback?: (ach: Achievement) => void;

  constructor(difficulty: Difficulty = 'medium', mode: GameMode = 'classic') {
    this.difficulty = difficulty;
    this.mode = mode;
  }

  public setCallbacks(options: {
    onStateChange?: () => void;
    onWin?: (stats: GameStats) => void;
    onGameOver?: () => void;
    onLineComplete?: (cells: Array<[number, number]>) => void;
    onSoundTrigger?: (sound: 'select' | 'place' | 'correct' | 'error' | 'line' | 'win' | 'fever' | 'fever_end' | 'shield') => void;
    onSurgeCaptured?: (bonusScore: number) => void;
    onAchievementUnlocked?: (ach: Achievement) => void;
  }) {
    this.onStateChangeCallback = options.onStateChange;
    this.onWinCallback = options.onWin;
    this.onGameOverCallback = options.onGameOver;
    this.onLineCompleteCallback = options.onLineComplete;
    this.onSoundTriggerCallback = options.onSoundTrigger;
    this.onSurgeCapturedCallback = options.onSurgeCaptured;
    this.onAchievementUnlockedCallback = options.onAchievementUnlocked;
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

  public getPerkLevel(id: string): number {
    const perk = this.activePerks.find((p) => p.id === id);
    return perk ? (perk.level || 1) : 0;
  }

  public hasSavedGame(): boolean {
    return (
      this.board.length === 9 &&
      (this.status === 'playing' || this.status === 'paused') &&
      (this.timerSeconds > 0 || this.history.length > 0 || this.score > 0)
    );
  }

  public togglePinNumber(num: number): number | null {
    if (this.pinnedNumber === num) {
      this.pinnedNumber = null;
    } else {
      const counts = this.getNumberCounts();
      if ((counts[num] || 0) >= 9) {
        this.pinnedNumber = null;
      } else {
        this.pinnedNumber = num;
      }
    }
    this.notify();
    return this.pinnedNumber;
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
          isInTorch: false,
          isInEcho: false,
          torchExpireAt: 0,
          isBeacon: false,
          isSurge: false,
          surgeExpireAt: 0,
        };
      })
    );

    if (this.isFogActive()) {
      this.pickInitialBeacons(config.initialBeacons, this.currentSeed);
    }

    this.selectedCell = null;
    this.pinnedNumber = null;
    this.history = [];
    this.redoStack = [];
    this.timerSeconds = 0;
    this.mistakesCount = 0;
    this.maxMistakes = config.maxMistakes + this.getPerkLevel('extra_heart') * 2;
    this.hintsRemaining = config.initialHints + this.getPerkLevel('power_bank');
    this.hintsUsed = 0;

    // Pulse & Score state
    if (!options?.keepScore) {
      this.score = 0;
      this.runStage = 1;
      this.incrementGamesPlayed();
    }
    this.comboCount = 0;
    this.comboMultiplier = 1.0 + this.getPerkLevel('combo_master') * 1.0;
    this.pulseEnergy = 0;
    this.isFeverMode = false;
    this.feverSecondsLeft = 0;
    this.maxComboAchieved = 0;

    // Perks
    this.shieldCharges = this.getPerkLevel('neon_shield');
    this.shieldActive = this.shieldCharges > 0;

    this.completedRows.clear();
    this.completedCols.clear();
    this.completedBoxes.clear();

    this.status = 'playing';
    this.isAutoNotesActive = false;

    this.updateErrorStates();
    this.updateFogVisibility();

    if (this.hasPerk('auto_scanner')) {
      this.fillAllCandidates();
    }

    // Spawn an initial surge cell after 3 seconds in non-daily modes
    if (this.mode !== 'daily') {
      this.spawnSurgeCell();
    }

    this.notify();
  }

  private pickInitialBeacons(count: number, seed: number) {
    if (count <= 0) return;

    // Group all given cells by 3x3 box so beacons are spread across the board
    const boxes: Array<Array<{ r: number; c: number }>> = Array.from({ length: 9 }, () => []);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c].isGiven) {
          const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
          boxes[boxIdx].push({ r, c });
        }
      }
    }

    // Deterministic LCG helper from seed
    let rngState = (seed || 123456) >>> 0;
    const nextRand = () => {
      rngState = (rngState * 1664525 + 1013904223) >>> 0;
      return rngState / 0x100000000;
    };

    const boxOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = boxOrder.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      [boxOrder[i], boxOrder[j]] = [boxOrder[j], boxOrder[i]];
    }

    const chosen: Array<{ r: number; c: number }> = [];
    for (const boxIdx of boxOrder) {
      if (chosen.length >= count) break;
      const candidates = boxes[boxIdx];
      if (candidates.length === 0) continue;

      // Prefer a candidate that is not adjacent to already chosen beacons
      const farCandidates = candidates.filter((cand) =>
        chosen.every((ch) => Math.abs(cand.r - ch.r) > 2 || Math.abs(cand.c - ch.c) > 2)
      );
      const pool = farCandidates.length > 0 ? farCandidates : candidates;
      const pick = pool[Math.floor(nextRand() * pool.length)];
      this.board[pick.r][pick.c].isBeacon = true;
      chosen.push(pick);
    }
  }

  public isFogActive(): boolean {
    if (this.mode === 'fog') return true;
    if (this.mode === 'run' && (this.runStage === 2 || this.runStage >= 5)) return true;
    return false;
  }

  public isSolarStormActive(): boolean {
    return this.mode === 'run' && (this.runStage === 3 || this.runStage >= 5);
  }

  public isCryoLeakActive(): boolean {
    return this.mode === 'run' && (this.runStage === 4 || this.runStage >= 5);
  }

  public getRunModifierDescription(): string {
    if (this.mode !== 'run') return '';
    switch (this.runStage) {
      case 1:
        return 'Базовый сектор (Обычные условия)';
      case 2:
        return '🌌 Аномалия: Тёмный сектор!';
      case 3:
        return '☀️ Солнечный шторм (Вспышки ⚡ в 2 раза чаще и дают +1500 очков!)';
      case 4:
        return '🧊 Крио-утечка (Пульс остывает быстрее, но базовые очки x2!)';
      default:
        return `💀 Сверхновая — Сектор ${this.runStage} (Тёмный сектор + Шторм + Очки x2!)`;
    }
  }

  public advanceRunStage(newPerk: Perk) {
    if (this.mode !== 'run') return;
    this.runStage++;
    const existingIdx = this.activePerks.findIndex((p) => p.id === newPerk.id);
    if (existingIdx >= 0) {
      this.activePerks[existingIdx] = newPerk;
    } else {
      this.activePerks.push(newPerk);
    }
    const stageClearBonus = 1500 * (this.runStage - 1);
    this.score += stageClearBonus;

    this.shieldCharges = this.getPerkLevel('neon_shield');
    this.shieldActive = this.shieldCharges > 0;
    this.hintsRemaining = Math.min(6, this.hintsRemaining + 1);

    this.startNewGame({
      mode: 'run',
      keepScore: true,
    });
  }

  public toggleAutoCandidates(): boolean {
    let cellsWithNotes = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c].notes.size > 0) {
          cellsWithNotes++;
        }
      }
    }

    if (this.isAutoNotesActive || cellsWithNotes > 0) {
      this.clearAllCandidates();
      return false;
    } else {
      this.fillAllCandidates();
      return true;
    }
  }

  public fillAllCandidates() {
    const fogActive = this.isFogActive();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];
        if (cell.value === 0) {
          if (fogActive && cell.isInFog) continue;
          cell.notes.clear();
          for (let n = 1; n <= 9; n++) {
            if (this.isValidPlacement(r, c, n, fogActive)) {
              cell.notes.add(n);
            }
          }
        }
      }
    }
    this.isAutoNotesActive = true;
    this.notify();
  }

  public clearAllCandidates() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this.board[r][c].notes.clear();
      }
    }
    this.isAutoNotesActive = false;
    this.notify();
  }

  public isValidPlacement(row: number, col: number, num: number, respectFog: boolean = false): boolean {
    for (let i = 0; i < 9; i++) {
      const rowCell = this.board[row][i];
      if (i !== col && rowCell.value === num && !rowCell.isError && (!respectFog || !rowCell.isInFog)) return false;
      const colCell = this.board[i][col];
      if (i !== row && colCell.value === num && !colCell.isError && (!respectFog || !colCell.isInFog)) return false;
    }
    const startR = Math.floor(row / 3) * 3;
    const startC = Math.floor(col / 3) * 3;
    for (let r = startR; r < startR + 3; r++) {
      for (let c = startC; c < startC + 3; c++) {
        const boxCell = this.board[r][c];
        if ((r !== row || c !== col) && boxCell.value === num && !boxCell.isError && (!respectFog || !boxCell.isInFog)) return false;
      }
    }
    return true;
  }

  public selectCell(row: number, col: number) {
    if (row < 0 || row >= 9 || col < 0 || col >= 9) return;
    this.selectedCell = { row, col };

    const cell = this.board[row][col];
    if (this.pinnedNumber !== null && !cell.isGiven && !cell.isLocked && this.status === 'playing') {
      this.updateFogVisibility();
      if (this.isFogActive()) {
        this.scheduleEchoCleanup();
      }
      this.inputNumber(this.pinnedNumber);
      return;
    }

    if (this.onSoundTriggerCallback) {
      this.onSoundTriggerCallback('select');
    }
    this.updateFogVisibility();
    if (this.isFogActive()) {
      this.scheduleEchoCleanup();
    }
    this.notify();
  }

  public toggleNotesMode() {
    this.isNotesMode = !this.isNotesMode;
    this.notify();
  }

  public spawnSurgeCell() {
    if (this.mode === 'daily' || this.status !== 'playing') return;

    const now = Date.now();
    // Clear expired surges and check if one is already active
    let activeCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];
        if (cell.isSurge) {
          if (cell.surgeExpireAt && cell.surgeExpireAt <= now) {
            cell.isSurge = false;
            cell.surgeExpireAt = 0;
          } else {
            activeCount++;
          }
        }
      }
    }

    const maxActive = this.isSolarStormActive() ? 2 : 1;
    if (activeCount >= maxActive) return;

    // Pick candidate empty cells (prefer visible cells in Dark Sector)
    const visibleEmpty: Array<{ r: number; c: number }> = [];
    const anyEmpty: Array<{ r: number; c: number }> = [];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];
        if (cell.value === 0 && !cell.isLocked && !cell.isSurge) {
          anyEmpty.push({ r, c });
          if (!cell.isInFog) {
            visibleEmpty.push({ r, c });
          }
        }
      }
    }

    const pool = visibleEmpty.length > 0 ? visibleEmpty : anyEmpty;
    if (pool.length === 0) return;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.board[pick.r][pick.c].isSurge = true;
    this.board[pick.r][pick.c].surgeExpireAt = now + 15000; // 15 seconds duration
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
        this.recordProgressStats((stats) => {
          stats.maxCombo = Math.max(stats.maxCombo || 0, this.maxComboAchieved);
        });

        const cmLvl = this.getPerkLevel('combo_master');
        const baseComboMult = cmLvl > 0 ? 1.0 + cmLvl * 1.0 : 1.0;
        let multiplierBonus = baseComboMult;
        if (this.comboCount >= 8) multiplierBonus = baseComboMult + 4.0;
        else if (this.comboCount >= 5) multiplierBonus = baseComboMult + 2.0;
        else if (this.comboCount >= 3) multiplierBonus = baseComboMult + 1.0;
        else if (this.comboCount >= 2) multiplierBonus = baseComboMult + 0.5;

        if (this.isFeverMode) {
          this.comboMultiplier = 10.0;
        } else {
          this.comboMultiplier = multiplierBonus;
        }

        // Check if this cell had an active ⚡ Surge
        const now = Date.now();
        if (cell.isSurge && (!cell.surgeExpireAt || cell.surgeExpireAt > now)) {
          cell.isSurge = false;
          cell.surgeExpireAt = 0;
          const surgeBonus = this.isSolarStormActive() ? 1500 : 1000;
          this.score += surgeBonus;
          this.pulseEnergy = Math.min(100, this.pulseEnergy + 45);
          this.recordProgressStats((stats) => {
            stats.surgeCaptured = (stats.surgeCaptured || 0) + 1;
          });
          if (this.onSurgeCapturedCallback) {
            this.onSurgeCapturedCallback(surgeBonus);
          }
        }

        // Energy gain
        const surgePerkLvl = this.getPerkLevel('point_surge');
        const energyGain = 18 + surgePerkLvl * 6;
        this.pulseEnergy = Math.min(100, this.pulseEnergy + energyGain);

        // Add score (doubled in Cryo-Leak anomaly)
        const pointsBase = this.isCryoLeakActive() ? 200 : 100;
        const perkScoreMult = 1.0 + surgePerkLvl * 0.5;
        this.score += Math.round(pointsBase * this.comboMultiplier * perkScoreMult);

        // Trigger Fever Mode if full
        if (this.pulseEnergy >= 100 && !this.isFeverMode) {
          this.triggerFeverMode();
        }

        if (this.onSoundTriggerCallback) {
          this.onSoundTriggerCallback('correct');
        }

        this.checkForCompletedUnits(row, col);

        // Unpin number if all 9 instances are now completed
        if (this.pinnedNumber === num) {
          const counts = this.getNumberCounts();
          if ((counts[num] || 0) >= 9) {
            this.pinnedNumber = null;
          }
        }
      } else {
        // Mistake made
        cell.isLocked = false;
        cell.isError = true;

        // Check Neon Shield Perk charges
        if (this.shieldCharges > 0) {
          this.shieldCharges--;
          this.shieldActive = this.shieldCharges > 0;
          if (this.onSoundTriggerCallback) {
            this.onSoundTriggerCallback('shield');
          }
        } else {
          this.mistakesCount++;
          // Reset combo if not in Fever mode
          if (!this.isFeverMode) {
            this.comboCount = 0;
            const cmLvl = this.getPerkLevel('combo_master');
            this.comboMultiplier = cmLvl > 0 ? 1.0 + cmLvl * 1.0 : 1.0;
            this.pulseEnergy = Math.max(0, this.pulseEnergy - 30);
          }

          if (this.onSoundTriggerCallback) {
            this.onSoundTriggerCallback('error');
          }

          if (this.mistakesCount >= this.maxMistakes) {
            this.status = 'gameover';
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
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
    this.feverSecondsLeft = 12 + this.getPerkLevel('fever_overdrive') * 5;
    this.comboMultiplier = 10.0;
    this.recordProgressStats((stats) => {
      stats.feverTriggeredCount = (stats.feverTriggeredCount || 0) + 1;
    });
    if (this.onSoundTriggerCallback) {
      this.onSoundTriggerCallback('fever');
    }
  }

  public updateFogVisibility() {
    if (!this.isFogActive()) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          this.board[r][c].isInFog = false;
          this.board[r][c].isInTorch = false;
          this.board[r][c].isInEcho = false;
        }
      }
      return;
    }

    const now = Date.now();
    const torchRadius = 1 + this.getPerkLevel('keen_eye');
    const selR = this.selectedCell ? this.selectedCell.row : -1;
    const selC = this.selectedCell ? this.selectedCell.col : -1;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];

        // Active scanner beam around cursor (3x3 normal, 5x5 Lv1, 7x7 Lv2)
        const distR = Math.abs(r - selR);
        const distC = Math.abs(c - selC);
        const inTorch = selR !== -1 && distR <= torchRadius && distC <= torchRadius;

        if (inTorch) {
          cell.torchExpireAt = now + 3000;
        }

        const inEcho = !inTorch && Boolean(cell.torchExpireAt && cell.torchExpireAt > now);

        // Beacons: initial difficulty beacons (5/3/1/0) or user-solved cells
        const isBeacon = Boolean(cell.isBeacon);

        // Beacons permanently illuminate a 3x3 area around themselves
        let nearBeacon = false;
        if (!isBeacon) {
          for (let dr = -1; dr <= 1 && !nearBeacon; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && this.board[nr][nc].isBeacon) {
                nearBeacon = true;
                break;
              }
            }
          }
        }

        const isPermanentlyLit = isBeacon || nearBeacon;
        cell.isInFog = !(isPermanentlyLit || inTorch || inEcho);
        cell.isInTorch = inTorch && !isPermanentlyLit;
        cell.isInEcho = inEcho && !isPermanentlyLit;
      }
    }
  }

  private scheduleEchoCleanup() {
    if (this.echoCleanupTimer) {
      clearTimeout(this.echoCleanupTimer);
      this.echoCleanupTimer = undefined;
    }
    if (!this.isFogActive()) return;

    const now = Date.now();
    let earliestExpire = Infinity;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = this.board[r][c];
        if (!cell.isInTorch && cell.torchExpireAt && cell.torchExpireAt > now) {
          if (cell.torchExpireAt < earliestExpire) {
            earliestExpire = cell.torchExpireAt;
          }
        }
      }
    }

    if (earliestExpire < Infinity) {
      const delay = Math.max(40, earliestExpire - now + 25);
      this.echoCleanupTimer = window.setTimeout(() => {
        this.updateFogVisibility();
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback();
        }
        this.scheduleEchoCleanup();
      }, delay);
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
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
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
      for (const [cr, cc] of newlyCompletedCells) {
        this.board[cr][cc].isBeacon = true;
      }
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
        const cell = this.board[r][c];
        const val = cell.value;
        if (val >= 1 && val <= 9 && !cell.isError && val === cell.solution) {
          counts[val]++;
        }
      }
    }
    return counts;
  }

  public tickTimer() {
    if (this.status === 'playing') {
      this.timerSeconds++;

      // Surge cell lifecycle (Arcade modes: classic, fog, run)
      if (this.mode !== 'daily') {
        const now = Date.now();
        let hasActiveSurge = false;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const cell = this.board[r][c];
            if (cell.isSurge) {
              if (cell.surgeExpireAt && now > cell.surgeExpireAt) {
                cell.isSurge = false;
                cell.surgeExpireAt = 0;
              } else {
                hasActiveSurge = true;
              }
            }
          }
        }
        const surgeInterval = this.isSolarStormActive() ? 9 : 15;
        if (!hasActiveSurge && this.timerSeconds - this.lastSurgeSpawnTime >= surgeInterval) {
          this.spawnSurgeCell();
          this.lastSurgeSpawnTime = this.timerSeconds;
        }
      }

      // Fever Timer
      if (this.isFeverMode) {
        this.feverSecondsLeft--;
        if (this.feverSecondsLeft <= 0) {
          this.isFeverMode = false;
          this.pulseEnergy = 0;
          const cmLvl = this.getPerkLevel('combo_master');
          this.comboMultiplier = cmLvl > 0 ? 1.0 + cmLvl * 1.0 : 1.0;
          if (this.onSoundTriggerCallback) {
            this.onSoundTriggerCallback('fever_end');
          }
        }
      } else {
        // Natural combo pulse decay (slower in Dark Sector, faster in Cryo-Leak)
        const twLvl = this.getPerkLevel('time_warp');
        const baseDecay = twLvl > 0 ? Math.max(1, 3 - twLvl) : 4;
        const cryoMult = this.isCryoLeakActive() ? 1.6 : 1.0;
        const fogMult = this.isFogActive() ? 0.65 : 1.0;
        const decayRate = Math.max(1, Math.round(baseDecay * cryoMult * fogMult));
        if (this.pulseEnergy > 0) {
          this.pulseEnergy = Math.max(0, this.pulseEnergy - decayRate);
          if (this.pulseEnergy === 0) {
            this.comboCount = 0;
            const cmLvl = this.getPerkLevel('combo_master');
            this.comboMultiplier = cmLvl > 0 ? 1.0 + cmLvl * 1.0 : 1.0;
          }
        }
      }

      if (this.isFogActive()) {
        this.updateFogVisibility();
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

  // --- DEVICE IDENTITY & STATS SYSTEM ---
  public static getOrCreatePlayerId(): string {
    const KEY = 'sudoku_player_id';
    try {
      let id = localStorage.getItem(KEY);
      if (!id) {
        id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch {
      return 'dev_guest';
    }
  }

  private static getLocalDateStr(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  public static getPlayerStats(): PlayerStats {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        const parsed: PlayerStats = JSON.parse(raw);
        let modified = false;

        // Auto-repair if gamesPlayed was not counted in older versions
        if ((parsed.gamesPlayed || 0) < (parsed.gamesWon || 0)) {
          parsed.gamesPlayed = parsed.gamesWon;
          modified = true;
        }

        // Auto-repair dailyStreak if player already won games today
        const today = SudokuGame.getLocalDateStr();
        const yesterday = SudokuGame.getLocalDateStr(new Date(Date.now() - 86400000));
        if ((parsed.gamesWon || 0) > 0 && (!parsed.dailyStreak || parsed.dailyStreak < 1)) {
          parsed.dailyStreak = 1;
          parsed.lastDailyDate = today;
          modified = true;
        } else if (
          parsed.lastDailyDate &&
          parsed.lastDailyDate !== today &&
          parsed.lastDailyDate !== yesterday
        ) {
          // Streak broken if more than 1 day missed
          parsed.dailyStreak = 0;
          modified = true;
        }

        if (modified) {
          localStorage.setItem(STATS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTimeSeconds: { easy: null, medium: null, hard: null, expert: null },
      maxCombo: 0,
      totalScore: 0,
      dailyStreak: 0,
      lastDailyDate: null,
      surgeCaptured: 0,
      feverTriggeredCount: 0,
      flawlessWins: 0,
      darkSectorWins: 0,
      expertDarkSectorWins: 0,
      unlockedAchievements: [],
    };
  }

  public static savePlayerStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }

  public static mergePlayerStats(incoming: PlayerStats): PlayerStats {
    const current = SudokuGame.getPlayerStats();
    const merged: PlayerStats = {
      gamesPlayed: Math.max(current.gamesPlayed || 0, incoming.gamesPlayed || 0),
      gamesWon: Math.max(current.gamesWon || 0, incoming.gamesWon || 0),
      totalScore: Math.max(current.totalScore || 0, incoming.totalScore || 0),
      maxCombo: Math.max(current.maxCombo || 0, incoming.maxCombo || 0),
      dailyStreak: Math.max(current.dailyStreak || 0, incoming.dailyStreak || 0),
      lastDailyDate: current.lastDailyDate || incoming.lastDailyDate || null,
      bestRunStage: Math.max(current.bestRunStage || 0, incoming.bestRunStage || 0),
      bestRunScore: Math.max(current.bestRunScore || 0, incoming.bestRunScore || 0),
      surgeCaptured: Math.max(current.surgeCaptured || 0, incoming.surgeCaptured || 0),
      feverTriggeredCount: Math.max(current.feverTriggeredCount || 0, incoming.feverTriggeredCount || 0),
      flawlessWins: Math.max(current.flawlessWins || 0, incoming.flawlessWins || 0),
      darkSectorWins: Math.max(current.darkSectorWins || 0, incoming.darkSectorWins || 0),
      expertDarkSectorWins: Math.max(current.expertDarkSectorWins || 0, incoming.expertDarkSectorWins || 0),
      bestTimeSeconds: {
        easy: (current.bestTimeSeconds?.easy !== null && incoming.bestTimeSeconds?.easy !== null)
          ? Math.min(current.bestTimeSeconds.easy, incoming.bestTimeSeconds.easy)
          : (current.bestTimeSeconds?.easy ?? incoming.bestTimeSeconds?.easy ?? null),
        medium: (current.bestTimeSeconds?.medium !== null && incoming.bestTimeSeconds?.medium !== null)
          ? Math.min(current.bestTimeSeconds.medium, incoming.bestTimeSeconds.medium)
          : (current.bestTimeSeconds?.medium ?? incoming.bestTimeSeconds?.medium ?? null),
        hard: (current.bestTimeSeconds?.hard !== null && incoming.bestTimeSeconds?.hard !== null)
          ? Math.min(current.bestTimeSeconds.hard, incoming.bestTimeSeconds.hard)
          : (current.bestTimeSeconds?.hard ?? incoming.bestTimeSeconds?.hard ?? null),
        expert: (current.bestTimeSeconds?.expert !== null && incoming.bestTimeSeconds?.expert !== null)
          ? Math.min(current.bestTimeSeconds.expert, incoming.bestTimeSeconds.expert)
          : (current.bestTimeSeconds?.expert ?? incoming.bestTimeSeconds?.expert ?? null),
      },
      unlockedAchievements: Array.from(new Set([
        ...(current.unlockedAchievements || []),
        ...(incoming.unlockedAchievements || []),
      ])),
    };
    SudokuGame.savePlayerStats(merged);
    return merged;
  }

  private recordProgressStats(updater: (stats: PlayerStats) => void) {
    try {
      const stats = SudokuGame.getPlayerStats();
      updater(stats);
      const newlyUnlocked = evaluateNewAchievements(stats);
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      if (newlyUnlocked.length > 0 && this.onAchievementUnlockedCallback) {
        for (const ach of newlyUnlocked) {
          this.onAchievementUnlockedCallback(ach);
        }
      }
    } catch {}
  }

  private incrementGamesPlayed() {
    try {
      const stats = SudokuGame.getPlayerStats();
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }

  private updatePlayerStatsOnWin() {
    try {
      const stats = SudokuGame.getPlayerStats();
      stats.gamesWon = (stats.gamesWon || 0) + 1;
      if ((stats.gamesPlayed || 0) < stats.gamesWon) {
        stats.gamesPlayed = stats.gamesWon;
      }
      stats.totalScore = (stats.totalScore || 0) + this.score;
      stats.maxCombo = Math.max(stats.maxCombo || 0, this.maxComboAchieved);

      if (this.mistakesCount === 0) {
        stats.flawlessWins = (stats.flawlessWins || 0) + 1;
      }

      if (this.mode === 'fog') {
        stats.darkSectorWins = (stats.darkSectorWins || 0) + 1;
        if (this.difficulty === 'expert') {
          stats.expertDarkSectorWins = (stats.expertDarkSectorWins || 0) + 1;
        }
      }

      // Best time
      const curBest = stats.bestTimeSeconds[this.difficulty];
      if (curBest === null || this.timerSeconds < curBest) {
        stats.bestTimeSeconds[this.difficulty] = this.timerSeconds;
      }

      // Daily streak — counts on first win of each local calendar day across any mode
      const today = SudokuGame.getLocalDateStr();
      const yesterday = SudokuGame.getLocalDateStr(new Date(Date.now() - 86400000));
      if (stats.lastDailyDate === today) {
        stats.dailyStreak = Math.max(1, stats.dailyStreak || 1);
      } else if (stats.lastDailyDate === yesterday) {
        stats.dailyStreak = (stats.dailyStreak || 0) + 1;
        stats.lastDailyDate = today;
      } else {
        stats.dailyStreak = 1;
        stats.lastDailyDate = today;
      }

      // Run records
      if (this.mode === 'run') {
        stats.bestRunStage = Math.max(stats.bestRunStage || 0, this.runStage);
        stats.bestRunScore = Math.max(stats.bestRunScore || 0, this.score);
      }

      const newlyUnlocked = evaluateNewAchievements(stats);
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      if (newlyUnlocked.length > 0 && this.onAchievementUnlockedCallback) {
        for (const ach of newlyUnlocked) {
          this.onAchievementUnlockedCallback(ach);
        }
      }
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
        runStage: this.runStage,
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
        shieldCharges: this.shieldCharges,
        pinnedNumber: this.pinnedNumber,
        isAutoNotesActive: this.isAutoNotesActive,
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
      this.runStage = data.runStage || 1;
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
      this.shieldCharges = data.shieldCharges ?? (data.shieldActive ? 1 : 0);
      this.shieldActive = this.shieldCharges > 0;
      this.pinnedNumber = data.pinnedNumber || null;
      this.isAutoNotesActive = data.isAutoNotesActive ?? false;
      this.status = data.status === 'completed' || data.status === 'gameover' ? 'idle' : data.status || 'playing';
      this.lastSurgeSpawnTime = this.timerSeconds;

      this.board = data.board.map((row: any[]) =>
        row.map((c: any) => {
          const isUserSolved = !c.isGiven && c.value !== 0 && c.value === c.solution;
          return {
            ...c,
            notes: new Set<number>(c.notes || []),
            isLocked: c.isGiven || isUserSolved,
            isInEcho: false,
            torchExpireAt: 0,
            isSurge: false,
            surgeExpireAt: 0,
            isBeacon: c.isBeacon !== undefined ? c.isBeacon : isUserSolved,
          };
        })
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
