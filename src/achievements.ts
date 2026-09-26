import { Achievement, PlayerStats } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    title: 'Первая искра',
    description: 'Одержать первую победу в любом режиме',
    icon: '🏅',
    checkUnlocked: (s) => (s.gamesWon || 0) >= 1,
    getProgress: (s) => ({ current: Math.min(1, s.gamesWon || 0), target: 1 }),
  },
  {
    id: 'combo_8',
    title: 'На гребне волны',
    description: 'Достичь комбо-серии из 8 верных ходов подряд',
    icon: '🔥',
    checkUnlocked: (s) => (s.maxCombo || 0) >= 8,
    getProgress: (s) => ({ current: Math.min(8, s.maxCombo || 0), target: 8 }),
  },
  {
    id: 'fever_master',
    title: 'Перегрузка',
    description: 'Активировать режим Fever Overdrive 5 раз',
    icon: '⚡',
    checkUnlocked: (s) => (s.feverTriggeredCount || 0) >= 5,
    getProgress: (s) => ({ current: Math.min(5, s.feverTriggeredCount || 0), target: 5 }),
  },
  {
    id: 'flawless',
    title: 'Чистый разум',
    description: 'Решить головоломку без единой ошибки',
    icon: '🎯',
    checkUnlocked: (s) => (s.flawlessWins || 0) >= 1,
    getProgress: (s) => ({ current: Math.min(1, s.flawlessWins || 0), target: 1 }),
  },
  {
    id: 'dark_navigator',
    title: 'Навигатор бездны',
    description: 'Одержать победу в режиме «Тёмный сектор»',
    icon: '🌌',
    checkUnlocked: (s) => (s.darkSectorWins || 0) >= 1,
    getProgress: (s) => ({ current: Math.min(1, s.darkSectorWins || 0), target: 1 }),
  },
  {
    id: 'blind_flight',
    title: 'Слепой полёт',
    description: 'Пройти «Тёмный сектор» на сложности Эксперт (0 маяков)',
    icon: '🌑',
    checkUnlocked: (s) => (s.expertDarkSectorWins || 0) >= 1,
    getProgress: (s) => ({ current: Math.min(1, s.expertDarkSectorWins || 0), target: 1 }),
  },
  {
    id: 'run_stage_3',
    title: 'Покоритель секторов',
    description: 'Пройти минимум 3 этапа за один забег Pulse Run',
    icon: '🚀',
    checkUnlocked: (s) => (s.bestRunStage || 0) >= 3,
    getProgress: (s) => ({ current: Math.min(3, s.bestRunStage || 0), target: 3 }),
  },
  {
    id: 'surge_hunter',
    title: 'Ловец молний',
    description: 'Захватить 5 энергетических клеток «⚡ Вспышка»',
    icon: '🌩️',
    checkUnlocked: (s) => (s.surgeCaptured || 0) >= 5,
    getProgress: (s) => ({ current: Math.min(5, s.surgeCaptured || 0), target: 5 }),
  },
  {
    id: 'streak_3',
    title: 'Ритм дисциплины',
    description: 'Поддерживать серию побед 3 дня подряд',
    icon: '📅',
    checkUnlocked: (s) => (s.dailyStreak || 0) >= 3,
    getProgress: (s) => ({ current: Math.min(3, s.dailyStreak || 0), target: 3 }),
  },
  {
    id: 'grandmaster',
    title: 'Грандмастер Пульса',
    description: 'Набрать суммарно 50 000 очков во всех играх',
    icon: '👑',
    checkUnlocked: (s) => (s.totalScore || 0) >= 50000,
    getProgress: (s) => ({ current: Math.min(50000, s.totalScore || 0), target: 50000 }),
  },
];

/**
 * Evaluates player stats against all achievements, synchronizes unlocked IDs, and returns newly unlocked achievements.
 */
export function evaluateAllAchievements(stats: PlayerStats): { newlyUnlocked: Achievement[]; allUnlockedIds: string[] } {
  if (!stats.unlockedAchievements) {
    stats.unlockedAchievements = [];
  }

  const newlyUnlocked: Achievement[] = [];
  for (const ach of ACHIEVEMENTS) {
    const isMet = ach.checkUnlocked(stats);
    const alreadyHas = stats.unlockedAchievements.includes(ach.id);
    if (isMet && !alreadyHas) {
      stats.unlockedAchievements.push(ach.id);
      newlyUnlocked.push(ach);
    }
  }
  return { newlyUnlocked, allUnlockedIds: stats.unlockedAchievements };
}

/**
 * Evaluates player stats against all achievements and returns newly unlocked achievements.
 */
export function evaluateNewAchievements(stats: PlayerStats): Achievement[] {
  return evaluateAllAchievements(stats).newlyUnlocked;
}

