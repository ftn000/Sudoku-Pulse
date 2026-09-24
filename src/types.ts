export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface DifficultyConfig {
  name: string;
  label: string;
  clues: number; // Number of clues to keep
  initialHints: number; // Max hints given for this difficulty
  maxMistakes: number; // Maximum mistakes before game over
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { name: 'easy', label: 'Легкий', clues: 40, initialHints: 5, maxMistakes: 3 },
  medium: { name: 'medium', label: 'Средний', clues: 32, initialHints: 3, maxMistakes: 3 },
  hard: { name: 'hard', label: 'Сложный', clues: 26, initialHints: 2, maxMistakes: 3 },
  expert: { name: 'expert', label: 'Эксперт', clues: 22, initialHints: 1, maxMistakes: 3 },
};

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
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
}
