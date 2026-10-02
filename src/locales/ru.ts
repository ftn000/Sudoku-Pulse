import { LocaleDefinition } from '../types';

export const ru: LocaleDefinition = {
  dict: {
  // Menu
  menu_daily: 'Daily Pulse',
  menu_daily_desc: 'Выбор режима и сложности',
  menu_play: 'Новая игра',
  menu_continue: 'Продолжить партию',
  menu_continue_meta: 'Сохранённая игра ждёт вас',
  menu_hero_subtitle: 'Классика в неоновом ритме с комбо и способностями',
  menu_daily_tag: 'Ежедневный вызов мира',
  menu_streak_title: 'Дней в Pulse',
  menu_streak_desc: 'Сыграйте партию сегодня для серии',
  menu_achievements: 'Достижения',
  menu_ach_tag: 'Испытания и трофеи сектора',
  menu_stats: 'Рекорды',
  menu_tutorial: 'Обучение',
  menu_settings: 'Настройки',
  menu_rules: 'Правила игры',
  menu_leaderboard: 'Зал Славы',
  menu_yandex_login: 'Войти в Яндекс',
  menu_profile: 'Профиль',

  // Mode Selection
  mode_select_title: 'Выберите режим',
  mode_classic_title: 'Классический',
  mode_classic_desc: 'Чистое судоку с комбо-множителем очков и режимом Fever',
  mode_fog_title: 'Тёмный сектор: Зона затмения',
  mode_fog_desc: 'Матрица во тьме! Луч сканера (эхо 3 сек) и маяки-созвездия освещают сектор',
  mode_run_title: 'Pulse Run (Забег)',
  mode_run_desc: 'Серия из уровней с выбором усиливающих перков перед стартом',
  mode_duel_title: 'Pulse AI Дуэль',
  mode_duel_desc: 'Битва в реальном времени против виртуального ИИ-соперника!',
  mode_live_duel_title: '1v1 Онлайн Дуэль',
  mode_live_duel_desc: 'Живая дуэль с другом в реальном времени! Создайте лобби или подключитесь по коду',
  diff_title: 'Сложность',
  diff_easy: 'Легкий',
  diff_medium: 'Средний',
  diff_hard: 'Сложный',
  diff_expert: 'Эксперт',
  btn_choose_perk: 'Выбрать перк →',
  btn_start_game: 'Начать игру →',
  mode_enter_challenge_btn: 'Ввести код вызова друга',
  live_lobby_title: '1v1 Онлайн Дуэль',
  live_lobby_subtitle: 'Сразитесь с другом в реальном времени на одинаковой сетке!',
  live_tab_create: '⚡ Создать лобби',
  live_tab_join: '🔑 Войти по коду',
  live_btn_create: '🚀 Создать комнату',
  live_enter_code_desc: 'Введите 4-значный код комнаты от друга:',
  live_btn_join: '⚔️ Подключиться к дуэли',
  live_room_code_label: 'Код вашей комнаты:',
  live_copy_link: '📋 Скопировать ссылку',
  live_share_link: '📤 Поделиться',
  live_waiting_opponent: 'Ожидание подключения соперника...',
  live_cancel_btn: 'Отмена',
  live_starting: 'Приготовьтесь к старту!',
  live_duel_hud_opponent: 'Соперник',
  live_btn_quick_match: '⚡ Быстрый поиск (Случайный соперник)',
  live_or_friend: 'или дуэль с другом по коду',
  live_quick_searching: 'Ищем соперника в сети...',
  live_quick_searching_desc: 'Автоматическое подключение к первому свободному игроку',
  live_quick_found: 'Соперник найден! Запуск дуэли...',
  live_duel_victory: '🏆 ПОБЕДА В ЖИВОЙ ДУЭЛИ 1v1!',
  live_duel_victory_desc: 'Вы решили судоку быстрее соперника! Чистая победа на скорости.',
  live_btn_rematch: '🔄 Реванш (Новый раунд)',
  live_rematch_waiting: '⏳ Ожидаем согласия соперника...',
  live_rematch_offered: '⚡ Соперник предлагает реванш!',
  live_btn_spectate: '👀 Наблюдать за соперником',
  live_spectate_banner: 'Вы решили судоку первым! Соперник ещё в процессе решения...',
  live_btn_view_result: '🏆 К результатам матча',
  ai_btn_rematch: '🔄 Реванш против бота',
  live_reaction_taunt: 'Эмодзи:',
  stats_tab_lb: '🌐 Лидерборд',
  stats_tab_profile: '👤 Профиль',
  stats_tab_seasons: '🏆 Сезоны',
  stats_tab_duels: '⚔️ Дуэли',

  // Challenge modal
  challenge_enter_title: 'Код вызова друга',
  challenge_enter_desc: 'Вставьте код дуэли или ссылку, полученную от друга:',
  challenge_enter_btn: '🔍 Начать дуэль',
  challenge_challenger: 'Соперник:',
  challenge_target_score: 'Рекорд соперника:',
  challenge_target_time: 'Время соперника:',
  challenge_accept: '⚔️ Принять вызов!',
  challenge_decline: 'Позже',

  // Perks
  perks_title: 'Выберите перк',
  perk_select_title: 'Выберите перк',
  perks_hint: 'Выберите одно пассивное усиление на эту партию:',
  perk_level: 'Ур.',
  perk_active: 'АКТИВЕН',
  perk_select_btn: 'Выбрать',

  // In-Game HUD & Controls
  hud_score: 'Счёт',
  hud_time: 'Время',
  hud_lives: 'Жизни',
  hud_combo: 'Комбо',
  ctrl_undo: 'Отмена',
  ctrl_erase: 'Стереть',
  ctrl_notes: 'Заметки',
  ctrl_hint: 'Подсказка',
  ctrl_restart: 'Заново',
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
  win_share_btn: '📋 Скопировать результат',
  win_challenge_btn: '⚔️ Бросить вызов другу (Код дуэли)',

  gameover_title: '💀 Игра окончена',
  gameover_subtitle: 'Вы совершили 3 ошибки. Попробуйте еще раз!',
  gameover_restart: 'Сыграть снова',
  gameover_menu: 'В меню',
  gameover_revive: '❤️ Второй шанс (+1 жизнь)',

  // Settings
  setting_sound: 'Звуковые эффекты',
  setting_sfx_volume: '🔊 Громкость звуков (SFX)',
  setting_music_volume: '🎵 Громкость музыки (Fever)',
  setting_haptics: '📳 Вибрация (Haptics)',
  haptic_off: 'Выкл',
  haptic_soft: 'Мягко',
  haptic_med: 'Норм',
  haptic_strong: 'Макс',
  menu_daily_rewards: 'Награды за вход',
  menu_daily_rewards_sub: '7 дней ценных бонусов',
  daily_reward_title: 'Награды за вход',
  daily_reward_desc: 'Заходите каждый день и получайте мощные кибер-бонусы для побед!',
  daily_reward_claim_btn: '🎁 Забрать награду',
  daily_reward_claimed: '✅ Награда получена! Возвращайтесь завтра',
  daily_reward_rescue_btn: '📺 Восстановить стрик за рекламу',
  daily_day_label: 'День',
  menu_shortcut_title: 'Добавить на рабочий стол',
  menu_shortcut_reward: 'Игра в 1 клик • Бонус: +2 подсказки',
  shortcut_reward_toast: '📲 Ярлык добавлен! Получено +2 подсказки',
  duel_rating_label: 'Ваш рейтинг 1v1',
  duel_rank_novice: 'Новичок',
  duel_rank_agent: 'Кибер-оперативник',
  duel_rank_master: 'Сектор-мастер',
  duel_rank_grandmaster: 'Грандмастер',
  live_bot_fallback_notice: 'Если игрок не найдется, подключится AI-бот равного рейтинга',
  live_ai_matched_toast: '🤖 К дуэли подключился AI-соперник: ',
  setting_theme: 'Тема оформления',
  setting_grid_skin: '🎨 Скин ячеек сетки (Лиги)',
  setting_lang: '🌐 Язык интерфейса',
  setting_btn_on: 'Вкл',
  setting_btn_off: 'Выкл',
  setting_done: 'Готово',
  yandex_profile_title: 'Профиль Яндекса:',
  yandex_guest: 'Гость',
  yandex_auth_btn: '🔴 Войти через Яндекс Паспорт',
  yandex_auth_connected: '✓ Яндекс аккаунт подключен',
  yandex_sync_desc: 'Синхронизация рекордов и трофеев с вашим аккаунтом Яндекс Игр',

  // Stats
  stats_title: '📊 Рекорды и Зал Славы',
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

  // In-Game UI & HUD
  score_label: 'ОЧКИ',
  pulse_hint_fill: 'Заполняйте верными ходами!',
  game_mistakes_label: 'Ошибки:',
  ai_duel_you: 'Вы',
  ai_bot_taunt_start: 'Посмотрим, на что ты способен!',
  btn_resume: 'Продолжить',
  stat_mode: 'Режим:',
  stat_diff: 'Сложность:',
  stat_time: 'Время:',
  stat_score: 'Очки:',
  stat_max_combo: 'Макс. комбо:',
  stat_mistakes: 'Ошибки:',
  duel_result_title: '⚔️ Результат дуэли',
  duel_result_beat: 'Вы побили рекорд соперника!',
  run_next_upgrade: '⚡ Выберите усиление для Этапа',
  btn_second_chance: '🎬 Второй шанс: +1 жизнь (Реклама)',
  btn_restart_gameover: 'Попробовать снова',
  btn_gameover_menu: 'В главное меню',

  // Leaderboard & Profile
  lb_period: 'Период:',
  lb_tf_all: 'All-Time',
  lb_tf_season: '⏳ Сезон',
  lb_mode_all: 'Все',
  lb_mode_run: '🚀 Забег',
  lb_mode_daily: '📅 Daily',
  lb_mode_fog: '🌌 Сектор',
  lb_mode_pvp_duel: '⚔️ 1v1 PvP',
  lb_mode_duels: '🤖 ИИ-Дуэли',
  lb_mode_classic: '⚡ Классика',
  profile_nickname: 'Никнейм:',
  profile_cyber_league: 'Кибер-Лига:',
  profile_games_ratio: 'Партий сыграно / Побед:',
  profile_max_combo: 'Максимальное комбо:',
  profile_total_score: 'Всего Pulse очков:',
  profile_daily_streak: 'Серия Daily Pulse:',
  profile_run_record: 'Рекорд Забега (Run):',
  season_league_title: 'Сезон Лиги:',
  season_archive_title: '🏆 Архив трофеев и сезонов',
  season_archive_placeholder: 'Трофей сезона будет зафиксирован при завершении недели.',
  duel_played_matches: '⚔️ Сыгранные матчи',
  btn_close: 'Закрыть',
  ach_title: '🏅 Достижения',
  ach_subtitle: 'Открыто 0 из 10 трофеев',

  // Settings & Sync
  settings_title: '⚙️ Настройки',
  guest: 'Гость',
  settings_yandex_profile: 'Профиль Яндекса:',
  settings_yandex_desc: 'Синхронизация рекордов и трофеев с вашим аккаунтом Яндекс Игр',
  settings_yandex_login: '🔴 Войти через Яндекс Паспорт',
  btn_done: 'Готово',

  // Challenge modal
  challenge_modal_title: 'Дуэльный вызов!',
  challenge_modal_subtitle: 'Вам бросили вызов на одинаковом раскладе Sudoku!',
  btn_paste: '📋 Вставить',

  // Mode Category Select
  mode_category_title: 'Выберите тип игры',
  mode_cat_solo_title: 'Соло игра',
  mode_cat_solo_desc: 'Классическое судоку, Тёмный сектор и забег Pulse Run',
  mode_cat_duel_title: '1v1 Дуэли',
  mode_cat_duel_desc: 'Битва на скорость против ИИ-бота или с другом онлайн',
  mode_cat_solo_badge: '3 Режима',
  mode_cat_duel_badge: '2 Режима',

  // Duel Disconnect & Pause
  duel_abandon_title: 'Соперник вышел!',
  duel_abandon_desc: 'Противник покинул дуэль. Вам засчитана безоговорочная победа (+ELO)!',
  duel_abandon_choice: 'Хотите продолжить решать эту доску соло или вернуться в меню?',
  duel_abandon_btn_solo: '🧩 Продолжить соло',
  duel_abandon_btn_menu: '🏠 В главное меню',
  live_paused_by_opp_title: 'Пауза от соперника',
  live_paused_by_opp_desc: 'Соперник приостановил дуэль. Ожидание возобновления матча...',
  rotate_device_title: 'Пожалуйста, поверните устройство',
  rotate_device_desc: 'Для лучшего игрового опыта Sudoku Pulse оптимизирован для портретного режима.',

  // Tutorial
  tutorial_prev: '◀ Назад',
  tutorial_next: 'Далее ▶',

  // Cyber Shop & Monetization
  menu_shop_title: 'Кибер-Маркет',
  menu_shop_sub: 'No Ads • VIP Pass • Подсказки',
  settings_open_shop_btn: 'Кибер-Маркет (No Ads / VIP)',
  shop_title: 'Кибер-Маркет',
  shop_subtitle: 'Премиум возможности и поддержка игры',
  shop_badge_vip: 'ХИТ • VIP',
  shop_badge_noads: 'ПОПУЛЯРНО',
  shop_vip_title: 'Cyber VIP Pass',
  shop_vip_desc: 'No Ads навсегда + Золотой скин «Cyber Gold» + 25 подсказок + VIP значок',
  shop_noads_title: 'Отключение рекламы',
  shop_noads_desc: 'Полное отключение всей межстраничной рекламы и баннеров навсегда',
  shop_hints_title: 'Пакет: 20 подсказок',
  shop_hints_desc: '+20 подсказок для мгновенного раскрытия сложнейших ячеек',
  shop_btn_buy: 'Купить',
  shop_btn_restore: '🔄 Восстановить',
  shop_owned: 'Куплено ✅',
  shop_toast_success: '🎉 Покупка успешно совершена! Спасибо за поддержку!',
  shop_toast_restored: '✨ Покупки успешно восстановлены!',
  win_double_score_btn: 'Удвоить очки партии',
  win_double_score_done: '✅ Очки удвоены!',
  win_double_score_toast: '🎉 Очки победы удвоены!',
  skin_trial_title: 'Примерить стиль',
  skin_trial_desc: 'Этот стиль ячеек ещё закрыт. Хотите примерить его на текущую сессию за просмотр короткого рекламного ролика?',
  skin_trial_btn_watch: '🎬 Примерить за видео',
  skin_trial_active_toast: '🎨 Стиль ячеек временно разблокирован на текущую игру!',
},
  perks: {
  "neon_shield": {
    "name": "Неоновый щит",
    "desc": "Блокирует ошибки на каждом этапе (+1 щит за уровень)"
  },
  "time_warp": {
    "name": "Тайм-варп",
    "desc": "Шкала комбо остывает значительно медленнее"
  },
  "fever_overdrive": {
    "name": "Супер-Овердрайв",
    "desc": "Режим Fever длится на +5 сек дольше за уровень"
  },
  "power_bank": {
    "name": "Генератор энергии",
    "desc": "+1 дополнительная подсказка за уровень перка"
  },
  "keen_eye": {
    "name": "Дальний радар",
    "desc": "В «Тёмном секторе» луч сканера расширен до 5×5 (7×7 на Ур. II)"
  },
  "point_surge": {
    "name": "Импульсный резонанс",
    "desc": "+50% бонусных Pulse очков за каждый уровень перка"
  },
  "extra_heart": {
    "name": "Квантовое сердце",
    "desc": "Лимит ошибок увеличен на +2 жизни за уровень"
  },
  "combo_master": {
    "name": "Комбо-ускоритель",
    "desc": "Базовый множитель комбо начинается с x2.0 (x3.0 на Ур. II)"
  },
  "chrono_boost": {
    "name": "Хроно-буст",
    "desc": "Первые 2 минуты игры начисляют удвоенные очки"
  },
  "emp_pulse": {
    "name": "Импульс ЭМИ",
    "desc": "В начале раунда автоматически расшифровывает +1 ячейку (+2 на Ур. II)"
  },
  "auto_scanner": {
    "name": "Нейро-сканер",
    "desc": "Автоматически заполняет карандашные заметки на старте"
  },
  "overcharge": {
    "name": "Оверчардж",
    "desc": "В режиме Fever множитель очков взлетает до x4.0 вместо x2.0"
  }
},
  achievements: {
  "first_win": {
    "title": "Первая искра",
    "desc": "Одержать первую победу в любом режиме"
  },
  "combo_8": {
    "title": "В ритме пульса",
    "desc": "Достичь комбо-серии из 8 верных ходов подряд"
  },
  "combo_15": {
    "title": "Квантовый резонанс",
    "desc": "Достичь серии комбо из 15 верных ходов подряд"
  },
  "fever_master": {
    "title": "Перегрузка",
    "desc": "Активировать режим Fever Overdrive 10 раз"
  },
  "fever_hyper": {
    "title": "Гипердрайв",
    "desc": "Активировать режим Fever Overdrive 30 раз"
  },
  "flawless": {
    "title": "Чистый разум",
    "desc": "Решить головоломку без единой ошибки"
  },
  "flawless_hard": {
    "title": "Холодный расчёт",
    "desc": "Победить без единой ошибки на сложности Сложный или Эксперт"
  },
  "no_hints": {
    "title": "Абсолютная интуиция",
    "desc": "Пройти партию без использования подсказок"
  },
  "speed_demon": {
    "title": "Сверхзвуковой",
    "desc": "Решить классическое судоку быстрее 3 минут"
  },
  "dark_navigator": {
    "title": "Навигатор бездны",
    "desc": "Одержать 3 победы в режиме «Тёмный сектор»"
  },
  "blind_flight": {
    "title": "Слепой полёт",
    "desc": "Пройти «Тёмный сектор» на сложности Эксперт (0 маяков)"
  },
  "run_stage_3": {
    "title": "Покоритель секторов",
    "desc": "Пройти минимум 3 этапа за один забег Pulse Run"
  },
  "run_stage_5": {
    "title": "Сверхновая",
    "desc": "Достичь 5-го этапа в Pulse Run (Экстремальный сектор)"
  },
  "surge_hunter": {
    "title": "Ловец молний",
    "desc": "Захватить 15 энергетических клеток «⚡ Вспышка»"
  },
  "surge_storm": {
    "title": "Повелитель бури",
    "desc": "Захватить 40 энергетических клеток «⚡ Вспышка»"
  },
  "streak_3": {
    "title": "Ритм дисциплины",
    "desc": "Поддерживать серию побед 3 дня подряд в Daily Pulse"
  },
  "streak_7": {
    "title": "Недельный импульс",
    "desc": "Поддерживать серию побед 7 дней подряд в Daily Pulse"
  },
  "duel_master": {
    "title": "Дуэлянт киберсети",
    "desc": "Одержать 3 победы в дуэлях против виртуального AI"
  },
  "score_25k": {
    "title": "Энергетический пик",
    "desc": "Набрать более 25 000 очков за одну партию"
  },
  "score_50k": {
    "title": "Легенда неонового поля",
    "desc": "Набрать более 50 000 очков за одну партию"
  },
  "total_score_50k": {
    "title": "Мастер ранга",
    "desc": "Набрать суммарно 50 000 очков во всех партиях"
  },
  "grandmaster": {
    "title": "Грандмастер Пульса",
    "desc": "Набрать суммарно 150 000 очков во всех партиях"
  },
  "veteran_10": {
    "title": "Опытный оператор",
    "desc": "Одержать 10 побед в любых режимах"
  },
  "veteran_25": {
    "title": "Ветеран матрицы",
    "desc": "Одержать 25 побед во всех режимах"
  }
}
};
