export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type GameMode = 'classic' | 'fog' | 'daily' | 'run' | 'ai_duel';

export type AppScreen = 'menu' | 'mode_select' | 'perk_select' | 'game';

export interface DifficultyConfig {
  name: string;
  label: string;
  clues: number; // Number of clues to keep
  initialHints: number; // Max hints given for this difficulty
  maxMistakes: number; // Maximum mistakes before game over
  initialBeacons: number; // Initial static beacons in Dark Sector mode
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { name: 'easy', label: 'Легкий', clues: 40, initialHints: 3, maxMistakes: 3, initialBeacons: 5 },
  medium: { name: 'medium', label: 'Средний', clues: 32, initialHints: 3, maxMistakes: 3, initialBeacons: 3 },
  hard: { name: 'hard', label: 'Сложный', clues: 26, initialHints: 3, maxMistakes: 3, initialBeacons: 1 },
  expert: { name: 'expert', label: 'Эксперт', clues: 22, initialHints: 3, maxMistakes: 3, initialBeacons: 0 },
};

export interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
  level?: number; // 1, 2, or 3
}

export interface CellData {
  row: number;
  col: number;
  value: number; // 0 for empty, 1-9 for filled
  solution: number; // The correct answer (1-9)
  isGiven: boolean; // Initial puzzle clue (cannot be edited)
  isLocked: boolean; // Locked after correct user input (cannot be edited)
  notes: Set<number>; // Pencil marks / candidates (1-9)
  isError: boolean; // True if this cell has a wrong value
  isConflictPeer: boolean; // True if this cell is a matching peer of an error cell
  justFilledCorrectly?: boolean; // For triggering celebratory glow animation
  isInFog?: boolean; // For Dark Sector mode: true if hidden in darkness
  isInTorch?: boolean; // True if currently illuminated by cursor scanner
  isInEcho?: boolean; // True if in 3-second echo afterglow after cursor moved away
  torchExpireAt?: number; // Timestamp (ms) when 3-second echo expires
  isBeacon?: boolean; // True if this static/solved cell permanently illuminates its 3x3 zone
  isSurge?: boolean; // True if this empty cell has an active ⚡ Surge energy bonus
  surgeExpireAt?: number; // Timestamp (ms) when surge bonus expires
}

export type Grid = number[][];

export type MoveAction =
  | {
      type: 'setValue';
      row: number;
      col: number;
      prevValue: number;
      newValue: number;
      prevNotes: number[];
      newNotes: number[];
      wasLocked: boolean;
    }
  | {
      type: 'toggleNote';
      row: number;
      col: number;
      num: number;
      added: boolean;
    }
  | {
      type: 'clear';
      row: number;
      col: number;
      prevValue: number;
      prevNotes: number[];
    };

export type GameStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'gameover';

export interface GameStats {
  difficulty: Difficulty;
  mode: GameMode;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  score: number;
  maxCombo: number;
  activePerks: Perk[];
  runStage?: number;
}

export interface SeasonBadge {
  id: string;
  seasonId: string;
  title: string;
  icon: string;
  tier: 'gold' | 'silver' | 'bronze' | 'champion' | 'veteran';
  dateAwarded: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimeSeconds: Record<Difficulty, number | null>;
  maxCombo: number;
  totalScore: number;
  dailyStreak: number;
  lastDailyDate: string | null;
  bestRunStage?: number;
  bestRunScore?: number;
  surgeCaptured?: number;
  feverTriggeredCount?: number;
  flawlessWins?: number;
  darkSectorWins?: number;
  expertDarkSectorWins?: number;
  unlockedAchievements?: string[];
  seasonBadges?: SeasonBadge[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  checkUnlocked: (stats: PlayerStats) => boolean;
  getProgress: (stats: PlayerStats) => { current: number; target: number };
}
