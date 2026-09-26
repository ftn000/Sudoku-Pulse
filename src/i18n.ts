export type Language = 'ru' | 'en';

export interface TranslationDict {
  [key: string]: string;
}

const RU: TranslationDict = {
  // Menu
  menu_daily: 'Ежедневный вызов',
  menu_daily_desc: 'Новая головоломка каждый день',
  menu_play: 'Играть',
  menu_achievements: 'Достижения',
  menu_stats: 'Статистика',
  menu_settings: 'Настройки',
  menu_rules: 'Правила игры',
  menu_leaderboard: 'Зал Славы',
  menu_tg_login: 'Войти через Telegram',
  menu_yandex_login: 'Войти в Яндекс',

  // Mode Selection
  mode_select_title: 'Выберите режим',
  mode_classic_title: 'Классика',
  mode_classic_desc: 'Стандартное судоку без давления времени. Расслабьтесь и тренируйте мозг',
  mode_fog_title: 'Тёмный сектор (Fog of War)',
  mode_fog_desc: 'Сетка скрыта туманом! Освещайте соседние клетки правильными ходами',
  mode_run_title: 'Pulse Run (Забег)',
  mode_run_desc: 'Серия из уровней с выбором усиливающих перков перед стартом',
  mode_duel_title: 'Pulse AI Дуэль',
  mode_duel_desc: 'Битва в реальном времени против виртуального ИИ-соперника!',
  diff_title: 'Сложность',
  diff_easy: 'Легкий',
  diff_medium: 'Средний',
  diff_hard: 'Сложный',
  diff_expert: 'Эксперт',
  btn_choose_perk: 'Выбрать перк →',
  btn_start_game: 'Начать игру →',

  // Perks
  perks_title: 'Выберите перк',
  perks_hint: 'Выберите одно пассивное усиление на эту партию:',
  perk_level: 'Ур.',
  perk_active: 'АКТИВЕН',
  perk_select_btn: 'Выбрать',

  // In-Game HUD & Controls
  hud_score: 'Счёт',
  hud_time: 'Время',
  hud_lives: 'Жизни',
  hud_combo: 'Комбо',
  ctrl_erase: 'Стереть',
  ctrl_notes: 'Заметки',
  ctrl_hint: 'Подсказка',
  ctrl_autonotes: 'Авто',
  ctrl_pause: 'Пауза',

  // Modals
  pause_title: '⏸ Игра на паузе',
  pause_resume: 'Продолжить',
  pause_restart: 'Начать заново',
  pause_menu: 'Главное меню',

  win_title: '🎉 Победа!',
  win_time: 'Время',
  win_score: 'Счёт',
  win_combo: 'Макс. комбо',
  win_play_again: 'Сыграть снова',
  win_next_stage: 'Следующий этап →',
  win_menu: 'В меню',
  win_share: 'Поделиться результатом',

  gameover_title: '💀 Игра окончена',
  gameover_subtitle: 'Вы совершили 3 ошибки. Попробуйте еще раз!',
  gameover_restart: 'Сыграть снова',
  gameover_menu: 'В меню',
  gameover_revive: '❤️ Второй шанс (+1 жизнь)',

  // Settings
  settings_title: '⚙️ Настройки',
  setting_sound: 'Звуковые эффекты',
  setting_theme: 'Тема оформления',
  setting_grid_skin: '🎨 Скин ячеек сетки (Лиги)',
  setting_lang: '🌐 Язык интерфейса',
  setting_daily_notify: '🔔 Напоминания Daily Pulse',
  setting_daily_notify_sub: 'Утреннее сообщение от Telegram-бота',
  setting_btn_on: 'Вкл',
  setting_btn_off: 'Выкл',
  setting_done: 'Готово',
  yandex_profile_title: 'Профиль Яндекса:',
  yandex_guest: 'Гость',
  yandex_auth_btn: '🔴 Войти через Яндекс Паспорт',
  yandex_auth_connected: '✓ Яндекс аккаунт подключен',
  yandex_sync_desc: 'Синхронизация рекордов и трофеев с вашим аккаунтом Яндекс Игр',

  // Stats
  stats_title: '📊 Статистика игрока',
  stats_games_played: 'Всего игр',
  stats_games_won: 'Побед',
  stats_win_rate: 'Процент побед',
  stats_best_time: 'Лучшее время',
  stats_best_score: 'Рекорд очков',
  stats_current_streak: 'Текущая серия',
  stats_best_streak: 'Лучшая серия',
  stats_player_name: 'Имя игрока:',

  // Achievements
  achievements_title: '🏅 Достижения',
  ach_unlocked: '✅ Получено',
};

const EN: TranslationDict = {
  // Menu
  menu_daily: 'Daily Challenge',
  menu_daily_desc: 'Unique puzzle generated every day',
  menu_play: 'Play',
  menu_achievements: 'Achievements',
  menu_stats: 'Statistics',
  menu_settings: 'Settings',
  menu_rules: 'How to Play',
  menu_leaderboard: 'Hall of Fame',
  menu_tg_login: 'Login with Telegram',
  menu_yandex_login: 'Login with Yandex',

  // Mode Selection
  mode_select_title: 'Select Game Mode',
  mode_classic_title: 'Classic',
  mode_classic_desc: 'Standard sudoku with no time pressure. Relax and train your brain',
  mode_fog_title: 'Dark Sector (Fog of War)',
  mode_fog_desc: 'The grid is enveloped in cyber fog! Light up cells with correct answers',
  mode_run_title: 'Pulse Run',
  mode_run_desc: 'Progressive stage gauntlet with powerful cyber perk upgrades',
  mode_duel_title: 'Pulse AI Duel',
  mode_duel_desc: 'Real-time cyber battle against an adaptive virtual AI bot!',
  diff_title: 'Difficulty',
  diff_easy: 'Easy',
  diff_medium: 'Medium',
  diff_hard: 'Hard',
  diff_expert: 'Expert',
  btn_choose_perk: 'Select Perk →',
  btn_start_game: 'Start Game →',

  // Perks
  perks_title: 'Select Cyber Perk',
  perks_hint: 'Choose one passive upgrade for this match:',
  perk_level: 'Lvl',
  perk_active: 'ACTIVE',
  perk_select_btn: 'Select',

  // In-Game HUD & Controls
  hud_score: 'Score',
  hud_time: 'Time',
  hud_lives: 'Lives',
  hud_combo: 'Combo',
  ctrl_erase: 'Erase',
  ctrl_notes: 'Notes',
  ctrl_hint: 'Hint',
  ctrl_autonotes: 'Auto',
  ctrl_pause: 'Pause',

  // Modals
  pause_title: '⏸ Game Paused',
  pause_resume: 'Resume',
  pause_restart: 'Restart',
  pause_menu: 'Main Menu',

  win_title: '🎉 Victory!',
  win_time: 'Time',
  win_score: 'Score',
  win_combo: 'Max Combo',
  win_play_again: 'Play Again',
  win_next_stage: 'Next Stage →',
  win_menu: 'To Menu',
  win_share: 'Share Result',

  gameover_title: '💀 Game Over',
  gameover_subtitle: '3 errors made. Try again!',
  gameover_restart: 'Play Again',
  gameover_menu: 'Main Menu',
  gameover_revive: '❤️ Second Chance (+1 life)',

  // Settings
  settings_title: '⚙️ Settings',
  setting_sound: 'Sound Effects',
  setting_theme: 'Color Theme',
  setting_grid_skin: '🎨 Grid Cell Skin (Leagues)',
  setting_lang: '🌐 Interface Language',
  setting_daily_notify: '🔔 Daily Pulse Reminder',
  setting_daily_notify_sub: 'Morning notification from Telegram bot',
  setting_btn_on: 'On',
  setting_btn_off: 'Off',
  setting_done: 'Done',
  yandex_profile_title: 'Yandex Profile:',
  yandex_guest: 'Guest',
  yandex_auth_btn: '🔴 Login with Yandex Passport',
  yandex_auth_connected: '✓ Yandex Account Connected',
  yandex_sync_desc: 'Synchronize high scores and achievements with your Yandex Games account',

  // Stats
  stats_title: '📊 Player Statistics',
  stats_games_played: 'Total Games',
  stats_games_won: 'Victories',
  stats_win_rate: 'Win Rate',
  stats_best_time: 'Best Time',
  stats_best_score: 'High Score',
  stats_current_streak: 'Current Streak',
  stats_best_streak: 'Best Streak',
  stats_player_name: 'Player Name:',

  // Achievements
  achievements_title: '🏅 Achievements',
  ach_unlocked: '✅ Unlocked',
};

export const PERK_TRANSLATIONS: Record<string, { ru: { name: string; desc: string }; en: { name: string; desc: string } }> = {
  neon_shield: {
    ru: { name: 'Неоновый щит', desc: 'Блокирует ошибки на каждом этапе (+1 щит за уровень)' },
    en: { name: 'Neon Shield', desc: 'Absorbs mistakes on each stage (+1 shield per level)' },
  },
  time_warp: {
    ru: { name: 'Тайм-варп', desc: 'Шкала комбо остывает значительно медленнее' },
    en: { name: 'Time Warp', desc: 'Combo decay rate is significantly reduced' },
  },
  fever_overdrive: {
    ru: { name: 'Супер-Овердрайв', desc: 'Режим Fever длится на +5 сек дольше за уровень' },
    en: { name: 'Super Overdrive', desc: 'Fever Overdrive lasts +5s longer per level' },
  },
  power_bank: {
    ru: { name: 'Генератор энергии', desc: '+1 дополнительная подсказка за уровень перка' },
    en: { name: 'Power Bank', desc: '+1 bonus hint per perk level' },
  },
  keen_eye: {
    ru: { name: 'Дальний радар', desc: 'В «Тёмном секторе» луч сканера расширен до 5×5 (7×7 на Ур. II)' },
    en: { name: 'Long-range Radar', desc: 'In Dark Sector, scanner radius expands to 5×5 (7×7 on Lvl II)' },
  },
  point_surge: {
    ru: { name: 'Импульсный резонанс', desc: '+50% бонусных Pulse очков за каждый уровень перка' },
    en: { name: 'Pulse Resonance', desc: '+50% bonus Pulse points per perk level' },
  },
  extra_heart: {
    ru: { name: 'Квантовое сердце', desc: 'Лимит ошибок увеличен на +2 жизни за уровень' },
    en: { name: 'Quantum Heart', desc: 'Mistake limit increased by +2 lives per level' },
  },
  combo_master: {
    ru: { name: 'Комбо-ускоритель', desc: 'Базовый множитель комбо начинается с x2.0 (x3.0 на Ур. II)' },
    en: { name: 'Combo Accelerator', desc: 'Base combo starts at x2.0 (x3.0 on Lvl II)' },
  },
  chrono_boost: {
    ru: { name: 'Хроно-буст', desc: 'Первые 2 минуты игры начисляют удвоенные очки' },
    en: { name: 'Chrono Boost', desc: 'First 2 minutes of match award 2x bonus score' },
  },
  emp_pulse: {
    ru: { name: 'Импульс ЭМИ', desc: 'В начале раунда автоматически расшифровывает +1 ячейку (+2 на Ур. II)' },
    en: { name: 'EMP Pulse', desc: 'Auto-solves +1 random cell at the start of each stage (+2 on Lvl II)' },
  },
  overcharge: {
    ru: { name: 'Оверчардж', desc: 'В режиме Fever множитель очков взлетает до x4.0 вместо x2.0' },
    en: { name: 'Overcharge', desc: 'In Fever mode, score multiplier skyrockets to x4.0 instead of x2.0' },
  },
};

export const ACHIEVEMENT_TRANSLATIONS: Record<string, { ru: { title: string; desc: string }; en: { title: string; desc: string } }> = {
  first_win: {
    ru: { title: 'Первая искра', desc: 'Одержать первую победу в любом режиме' },
    en: { title: 'First Spark', desc: 'Win your first game in any mode' },
  },
  combo_8: {
    ru: { title: 'На гребне волны', desc: 'Достичь комбо-серии из 8 верных ходов подряд' },
    en: { title: 'Riding the Wave', desc: 'Achieve a combo streak of 8 correct moves' },
  },
  fever_master: {
    ru: { title: 'Перегрузка', desc: 'Активировать режим Fever Overdrive 5 раз' },
    en: { title: 'Overdrive', desc: 'Trigger Fever Overdrive 5 times' },
  },
  flawless: {
    ru: { title: 'Чистый разум', desc: 'Решить головоломку без единой ошибки' },
    en: { title: 'Pure Mind', desc: 'Solve a puzzle without making a single mistake' },
  },
  dark_navigator: {
    ru: { title: 'Навигатор бездны', desc: 'Одержать победу в режиме «Тёмный сектор»' },
    en: { title: 'Abyss Navigator', desc: 'Win a game in Dark Sector mode' },
  },
  blind_flight: {
    ru: { title: 'Слепой полёт', desc: 'Пройти «Тёмный сектор» на сложности Эксперт (0 маяков)' },
    en: { title: 'Blind Flight', desc: 'Complete Dark Sector on Expert difficulty (0 beacons)' },
  },
  run_stage_3: {
    ru: { title: 'Покоритель секторов', desc: 'Пройти минимум 3 этапа за один забег Pulse Run' },
    en: { title: 'Sector Conqueror', desc: 'Clear at least 3 stages in a single Pulse Run' },
  },
  speed_demon: {
    ru: { title: 'Демон скорости', desc: 'Решить судоку быстрее чем за 3 минуты' },
    en: { title: 'Speed Demon', desc: 'Solve any Sudoku in under 3 minutes' },
  },
  grandmaster: {
    ru: { title: 'Кибер-Гроссмейстер', desc: 'Выиграть 25 игр и набрать 100 000+ очков' },
    en: { title: 'Cyber Grandmaster', desc: 'Win 25 games and reach 100,000+ score' },
  },
};

class I18nManager {
  private currentLang: Language = 'ru';
  private listeners: Array<(lang: Language) => void> = [];

  constructor() {
    this.detectLanguage();
  }

  public detectLanguage(): Language {
    try {
      const saved = localStorage.getItem('sudoku_pulse_lang');
      if (saved === 'ru' || saved === 'en') {
        this.currentLang = saved;
        return this.currentLang;
      }
    } catch {}

    // Check navigator / system
    if (typeof navigator !== 'undefined') {
      const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
      if (navLang.startsWith('ru') || navLang.startsWith('be') || navLang.startsWith('kk') || navLang.startsWith('uk')) {
        this.currentLang = 'ru';
      } else {
        this.currentLang = 'en';
      }
    } else {
      this.currentLang = 'ru';
    }

    return this.currentLang;
  }

  public getLanguage(): Language {
    return this.currentLang;
  }

  public setLanguage(lang: Language): void {
    this.currentLang = lang;
    try {
      localStorage.setItem('sudoku_pulse_lang', lang);
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      this.applyTranslationsToDOM();
    }

    this.listeners.forEach((fn) => fn(lang));
  }

  public onLanguageChange(fn: (lang: Language) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public t(key: string, defaultText?: string): string {
    const dict = this.currentLang === 'en' ? EN : RU;
    return dict[key] || defaultText || key;
  }

  public applyTranslationsToDOM(): void {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translation = this.t(key);
        if (translation) {
          el.textContent = translation;
        }
      }
    });

    // Update active state on lang switcher buttons
    const btnRu = document.getElementById('lang-btn-ru');
    const btnEn = document.getElementById('lang-btn-en');
    if (btnRu && btnEn) {
      btnRu.classList.toggle('active', this.currentLang === 'ru');
      btnEn.classList.toggle('active', this.currentLang === 'en');
    }
  }
}

export const i18n = new I18nManager();
export const t = (key: string, defaultText?: string): string => i18n.t(key, defaultText);
