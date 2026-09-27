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
    title: 'В ритме пульса',
    description: 'Достичь комбо-серии из 8 верных ходов подряд',
    icon: '🔥',
    checkUnlocked: (s) => (s.maxCombo || 0) >= 8,
    getProgress: (s) => ({ current: Math.min(8, s.maxCombo || 0), target: 8 }),
  },
  {
    id: 'combo_15',
    title: 'Квантовый резонанс',
    description: 'Достичь серии комбо из 15 верных ходов подряд',
    icon: '⚡',
    checkUnlocked: (s) => (s.maxCombo || 0) >= 15,
    getProgress: (s) => ({ current: Math.min(15, s.maxCombo || 0), target: 15 }),
  },
  {
    id: 'fever_master',
    title: 'Перегрузка',
    description: 'Активировать режим Fever Overdrive 10 раз',
    icon: '💥',
    checkUnlocked: (s) => (s.feverTriggeredCount || 0) >= 10,
    getProgress: (s) => ({ current: Math.min(10, s.feverTriggeredCount || 0), target: 10 }),
  },
  {
    id: 'fever_hyper',
    title: 'Гипердрайв',
    description: 'Активировать режим Fever Overdrive 30 раз',
    icon: '🌀',
    checkUnlocked: (s) => (s.feverTriggeredCount || 0) >= 30,
    getProgress: (s) => ({ current: Math.min(30, s.feverTriggeredCount || 0), target: 30 }),
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
    id: 'flawless_hard',
    title: 'Холодный расчёт',
    description: 'Победить без единой ошибки на сложности Сложный или Эксперт',
    icon: '🧊',
    checkUnlocked: (s) => (s.flawlessHardWins || 0) >= 1,
    getProgress: (s) => ({ current: Math.min(1, s.flawlessHardWins || 0), target: 1 }),
  },
  {
    id: 'no_hints',
    title: 'Абсолютная интуиция',
    description: 'Пройти партию без использования подсказок',
    icon: '🧠',
    checkUnlocked: (s) => (s.noHintsWins || 0) >= 1,
    getProgress: (s) => ({ current: Math.min(1, s.noHintsWins || 0), target: 1 }),
  },
  {
    id: 'speed_demon',
    title: 'Сверхзвуковой',
    description: 'Решить классическое судоку быстрее 3 минут',
    icon: '⏱️',
    checkUnlocked: (s) => (s.fastestWinSeconds !== null && s.fastestWinSeconds !== undefined && s.fastestWinSeconds <= 180),
    getProgress: (s) => ({ current: (s.fastestWinSeconds && s.fastestWinSeconds <= 180) ? 1 : 0, target: 1 }),
  },
  {
    id: 'dark_navigator',
    title: 'Навигатор бездны',
    description: 'Одержать 3 победы в режиме «Тёмный сектор»',
    icon: '🌌',
    checkUnlocked: (s) => (s.darkSectorWins || 0) >= 3,
    getProgress: (s) => ({ current: Math.min(3, s.darkSectorWins || 0), target: 3 }),
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
    id: 'run_stage_5',
    title: 'Сверхновая',
    description: 'Достичь 5-го этапа в Pulse Run (Экстремальный сектор)',
    icon: '🪐',
    checkUnlocked: (s) => (s.bestRunStage || 0) >= 5,
    getProgress: (s) => ({ current: Math.min(5, s.bestRunStage || 0), target: 5 }),
  },
  {
    id: 'surge_hunter',
    title: 'Ловец молний',
    description: 'Захватить 15 энергетических клеток «⚡ Вспышка»',
    icon: '🌩️',
    checkUnlocked: (s) => (s.surgeCaptured || 0) >= 15,
    getProgress: (s) => ({ current: Math.min(15, s.surgeCaptured || 0), target: 15 }),
  },
  {
    id: 'surge_storm',
    title: 'Повелитель бури',
    description: 'Захватить 40 энергетических клеток «⚡ Вспышка»',
    icon: '⚡',
    checkUnlocked: (s) => (s.surgeCaptured || 0) >= 40,
    getProgress: (s) => ({ current: Math.min(40, s.surgeCaptured || 0), target: 40 }),
  },
  {
    id: 'streak_3',
    title: 'Ритм дисциплины',
    description: 'Поддерживать серию побед 3 дня подряд в Daily Pulse',
    icon: '📅',
    checkUnlocked: (s) => (s.dailyStreak || 0) >= 3,
    getProgress: (s) => ({ current: Math.min(3, s.dailyStreak || 0), target: 3 }),
  },
  {
    id: 'streak_7',
    title: 'Недельный импульс',
    description: 'Поддерживать серию побед 7 дней подряд в Daily Pulse',
    icon: '🗓️',
    checkUnlocked: (s) => (s.dailyStreak || 0) >= 7,
    getProgress: (s) => ({ current: Math.min(7, s.dailyStreak || 0), target: 7 }),
  },
  {
    id: 'duel_master',
    title: 'Дуэлянт киберсети',
    description: 'Одержать 3 победы в дуэлях против виртуального AI',
    icon: '🤖',
    checkUnlocked: (s) => (s.aiDuelWins || 0) >= 3,
    getProgress: (s) => ({ current: Math.min(3, s.aiDuelWins || 0), target: 3 }),
  },
  {
    id: 'score_25k',
    title: 'Энергетический пик',
    description: 'Набрать более 25 000 очков за одну партию',
    icon: '💎',
    checkUnlocked: (s) => (s.highScore || 0) >= 25000,
    getProgress: (s) => ({ current: Math.min(25000, s.highScore || 0), target: 25000 }),
  },
  {
    id: 'score_50k',
    title: 'Легенда неонового поля',
    description: 'Набрать более 50 000 очков за одну партию',
    icon: '👑',
    checkUnlocked: (s) => (s.highScore || 0) >= 50000,
    getProgress: (s) => ({ current: Math.min(50000, s.highScore || 0), target: 50000 }),
  },
  {
    id: 'total_score_50k',
    title: 'Мастер ранга',
    description: 'Набрать суммарно 50 000 очков во всех партиях',
    icon: '🎖️',
    checkUnlocked: (s) => (s.totalScore || 0) >= 50000,
    getProgress: (s) => ({ current: Math.min(50000, s.totalScore || 0), target: 50000 }),
  },
  {
    id: 'grandmaster',
    title: 'Грандмастер Пульса',
    description: 'Набрать суммарно 150 000 очков во всех партиях',
    icon: '🏆',
    checkUnlocked: (s) => (s.totalScore || 0) >= 150000,
    getProgress: (s) => ({ current: Math.min(150000, s.totalScore || 0), target: 150000 }),
  },
  {
    id: 'veteran_10',
    title: 'Опытный оператор',
    description: 'Одержать 10 побед в любых режимах',
    icon: '🛡️',
    checkUnlocked: (s) => (s.gamesWon || 0) >= 10,
    getProgress: (s) => ({ current: Math.min(10, s.gamesWon || 0), target: 10 }),
  },
  {
    id: 'veteran_25',
    title: 'Ветеран матрицы',
    description: 'Одержать 25 побед во всех режимах',
    icon: '🌟',
    checkUnlocked: (s) => (s.gamesWon || 0) >= 25,
    getProgress: (s) => ({ current: Math.min(25, s.gamesWon || 0), target: 25 }),
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

