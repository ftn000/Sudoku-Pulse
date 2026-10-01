export type Language = 'ru' | 'en';

export interface TranslationDict {
  [key: string]: string;
}

const RU: TranslationDict = {
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
  lb_mode_duels: '🤖 Дуэли',
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
};

const EN: TranslationDict = {
  // Menu
  menu_daily: 'Daily Pulse',
  menu_daily_desc: 'Choose mode and difficulty',
  menu_play: 'New Game',
  menu_continue: 'Continue Game',
  menu_continue_meta: 'Saved puzzle is waiting for you',
  menu_hero_subtitle: 'Neon-cyber rhythm Sudoku with combos and perks',
  menu_daily_tag: 'Daily World Challenge',
  menu_streak_title: 'Days in Pulse',
  menu_streak_desc: 'Play any game today to keep streak',
  menu_achievements: 'Achievements',
  menu_ach_tag: 'Sector Trials & Trophies',
  menu_stats: 'Records',
  menu_tutorial: 'Tutorial',
  menu_settings: 'Settings',
  menu_rules: 'How to Play',
  menu_leaderboard: 'Hall of Fame',
  menu_yandex_login: 'Login with Yandex',
  menu_profile: 'Profile',

  // Mode Selection
  mode_select_title: 'Select Game Mode',
  mode_classic_title: 'Classic',
  mode_classic_desc: 'Pure sudoku with dynamic combo scoring and Fever mode',
  mode_fog_title: 'Dark Sector: Eclipse Zone',
  mode_fog_desc: 'Grid veiled in darkness! Scanner echo beam (3s) and constellation beacons illuminate cells',
  mode_run_title: 'Pulse Run',
  mode_run_desc: 'Progressive stage gauntlet with powerful cyber perk upgrades',
  mode_duel_title: 'Pulse AI Duel',
  mode_duel_desc: 'Real-time cyber battle against an adaptive virtual AI bot!',
  mode_live_duel_title: '1v1 Online Duel',
  mode_live_duel_desc: 'Live real-time duel with a friend! Create a lobby or join by code',
  diff_title: 'Difficulty',
  diff_easy: 'Easy',
  diff_medium: 'Medium',
  diff_hard: 'Hard',
  diff_expert: 'Expert',
  btn_choose_perk: 'Select Perk →',
  btn_start_game: 'Start Game →',
  mode_enter_challenge_btn: 'Enter Friend Duel Code',
  live_lobby_title: '1v1 Online Duel',
  live_lobby_subtitle: 'Battle a friend in real time on the exact same grid!',
  live_tab_create: '⚡ Create Lobby',
  live_tab_join: '🔑 Join by Code',
  live_btn_create: '🚀 Create Room',
  live_enter_code_desc: 'Enter 4-digit room code from your friend:',
  live_btn_join: '⚔️ Join Duel',
  live_room_code_label: 'Your Room Code:',
  live_copy_link: '📋 Copy Link',
  live_share_link: '📤 Share',
  live_waiting_opponent: 'Waiting for opponent to join...',
  live_cancel_btn: 'Cancel',
  live_starting: 'Get ready for battle!',
  live_duel_hud_opponent: 'Opponent',
  live_btn_quick_match: '⚡ Quick Match (Random Duel)',
  live_or_friend: 'or duel a friend by code',
  live_quick_searching: 'Searching for online opponent...',
  live_quick_searching_desc: 'Connecting automatically to the first available player',
  live_quick_found: 'Opponent found! Starting duel...',
  live_duel_victory: '🏆 VICTORY IN 1v1 DUEL!',
  live_duel_victory_desc: 'You solved the puzzle faster than your opponent! Pure speed victory.',
  live_btn_rematch: '🔄 Rematch (New Round)',
  live_rematch_waiting: '⏳ Waiting for opponent confirmation...',
  live_rematch_offered: '⚡ Opponent offered a rematch!',
  live_btn_spectate: '👀 Spectate Opponent',
  live_spectate_banner: 'You solved the grid first! Opponent is still solving...',
  live_btn_view_result: '🏆 Return to Match Results',
  ai_btn_rematch: '🔄 Rematch vs Bot',
  live_reaction_taunt: 'Emotes:',
  stats_tab_lb: '🌐 Leaderboard',
  stats_tab_profile: '👤 Profile',
  stats_tab_seasons: '🏆 Seasons',
  stats_tab_duels: '⚔️ Duels',

  // Challenge modal
  challenge_enter_title: 'Friend Challenge Code',
  challenge_enter_desc: 'Paste the duel code or invite link from your friend:',
  challenge_enter_btn: '🔍 Start Duel',
  challenge_challenger: 'Challenger:',
  challenge_target_score: 'Target Score:',
  challenge_target_time: 'Target Time:',
  challenge_accept: '⚔️ Accept Challenge!',
  challenge_decline: 'Later',

  // Perks
  perks_title: 'Select Cyber Perk',
  perk_select_title: 'Select Cyber Perk',
  perks_hint: 'Choose one passive upgrade for this match:',
  perk_level: 'Lvl',
  perk_active: 'ACTIVE',
  perk_select_btn: 'Select',

  // In-Game HUD & Controls
  hud_score: 'Score',
  hud_time: 'Time',
  hud_lives: 'Lives',
  hud_combo: 'Combo',
  ctrl_undo: 'Undo',
  ctrl_erase: 'Erase',
  ctrl_notes: 'Notes',
  ctrl_hint: 'Hint',
  ctrl_restart: 'Restart',
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
  win_share_btn: '📋 Copy Score Card',
  win_challenge_btn: '⚔️ Challenge a Friend (Duel Code)',

  gameover_title: '💀 Game Over',
  gameover_subtitle: '3 errors made. Try again!',
  gameover_restart: 'Play Again',
  gameover_menu: 'Main Menu',
  gameover_revive: '❤️ Second Chance (+1 life)',

  // Settings
  settings_title: '⚙️ Settings',
  setting_sound: 'Sound Effects',
  setting_sfx_volume: '🔊 Sound FX Volume',
  setting_music_volume: '🎵 Music Volume (Fever)',
  setting_haptics: '📳 Haptic Feedback',
  haptic_off: 'Off',
  haptic_soft: 'Soft',
  haptic_med: 'Med',
  haptic_strong: 'Max',
  menu_daily_rewards: 'Daily Login Rewards',
  menu_daily_rewards_sub: '7 days of cyber bonuses',
  daily_reward_title: 'Daily Login Rewards',
  daily_reward_desc: 'Log in daily to claim tactical cyber bonuses and boosts!',
  daily_reward_claim_btn: '🎁 Claim Reward',
  daily_reward_claimed: '✅ Reward claimed! Return tomorrow',
  daily_reward_rescue_btn: '📺 Restore streak with Ad',
  daily_day_label: 'Day',
  menu_shortcut_title: 'Add to Home Screen',
  menu_shortcut_reward: 'Instant 1-tap play • Bonus: +2 Hints',
  shortcut_reward_toast: '📲 Shortcut added! +2 Hints received',
  duel_rating_label: 'Your 1v1 Rating',
  duel_rank_novice: 'Novice',
  duel_rank_agent: 'Cyber Agent',
  duel_rank_master: 'Sector Master',
  duel_rank_grandmaster: 'Grandmaster',
  live_bot_fallback_notice: 'If no players are found, an AI bot of equal rank connects',
  live_ai_matched_toast: '🤖 AI challenger matched: ',
  setting_theme: 'Color Theme',
  setting_grid_skin: '🎨 Grid Cell Skin (Leagues)',
  setting_lang: '🌐 Interface Language',
  setting_btn_on: 'On',
  setting_btn_off: 'Off',
  setting_done: 'Done',
  yandex_profile_title: 'Yandex Profile:',
  yandex_guest: 'Guest',
  yandex_auth_btn: '🔴 Login with Yandex Passport',
  yandex_auth_connected: '✓ Yandex Account Connected',
  yandex_sync_desc: 'Synchronize high scores and achievements with your Yandex Games account',

  // Stats
  stats_title: '📊 Leaderboards & Hall of Fame',
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

  // In-Game UI & HUD
  score_label: 'SCORE',
  pulse_hint_fill: 'Fill cells with correct moves!',
  game_mistakes_label: 'Mistakes:',
  ai_duel_you: 'You',
  ai_bot_taunt_start: "Let's see what you've got!",
  btn_resume: 'Resume',
  stat_mode: 'Mode:',
  stat_diff: 'Difficulty:',
  stat_time: 'Time:',
  stat_score: 'Score:',
  stat_max_combo: 'Max Combo:',
  stat_mistakes: 'Mistakes:',
  duel_result_title: '⚔️ Duel Result',
  duel_result_beat: "You beat your opponent's record!",
  run_next_upgrade: '⚡ Choose perk upgrade for Stage',
  btn_second_chance: '🎬 Second Chance: +1 Life (Ad)',
  btn_restart_gameover: 'Try Again',
  btn_gameover_menu: 'Main Menu',

  // Leaderboard & Profile
  lb_period: 'Period:',
  lb_tf_all: 'All-Time',
  lb_tf_season: '⏳ Season',
  lb_mode_all: 'All',
  lb_mode_run: '🚀 Run',
  lb_mode_daily: '📅 Daily',
  lb_mode_fog: '🌌 Sector',
  lb_mode_duels: '🤖 Duels',
  lb_mode_classic: '⚡ Classic',
  profile_nickname: 'Nickname:',
  profile_cyber_league: 'Cyber League:',
  profile_games_ratio: 'Games Played / Victories:',
  profile_max_combo: 'Max Combo:',
  profile_total_score: 'Total Pulse Score:',
  profile_daily_streak: 'Daily Pulse Streak:',
  profile_run_record: 'Pulse Run Record:',
  season_league_title: 'League Season:',
  season_archive_title: '🏆 Trophy & Season Archive',
  season_archive_placeholder: 'The season trophy will be locked when the week ends.',
  duel_played_matches: '⚔️ Played Matches',
  btn_close: 'Close',
  ach_title: '🏅 Achievements',
  ach_subtitle: '0 of 10 trophies unlocked',

  // Settings & Sync
  guest: 'Guest',
  settings_yandex_profile: 'Yandex Profile:',
  settings_yandex_desc: 'Sync high scores and achievements with your Yandex Games account',
  settings_yandex_login: '🔴 Login with Yandex ID',
  btn_done: 'Done',

  // Challenge modal
  challenge_modal_title: 'Duel Challenge!',
  challenge_modal_subtitle: 'You have been challenged on the exact same Sudoku grid!',
  btn_paste: '📋 Paste',

  // Mode Category Select
  mode_category_title: 'Select Game Type',
  mode_cat_solo_title: 'Solo Game',
  mode_cat_solo_desc: 'Classic Sudoku, Dark Sector & Pulse Run',
  mode_cat_duel_title: '1v1 Duels',
  mode_cat_duel_desc: 'Speed battles vs AI Bot or Live Online Player',
  mode_cat_solo_badge: '3 Modes',
  mode_cat_duel_badge: '2 Modes',

  // Duel Disconnect & Pause
  duel_abandon_title: 'Opponent Left!',
  duel_abandon_desc: 'Opponent disconnected from the duel. Victory (+ELO) awarded to you!',
  duel_abandon_choice: 'Would you like to finish solving this board solo or return to menu?',
  duel_abandon_btn_solo: '🧩 Continue Solo',
  duel_abandon_btn_menu: '🏠 Main Menu',
  live_paused_by_opp_title: 'Paused by Opponent',
  live_paused_by_opp_desc: 'Opponent paused the duel. Waiting for match to resume...',
  rotate_device_title: 'Please Rotate Device',
  rotate_device_desc: 'Sudoku Pulse is best experienced in portrait orientation.',

  // Tutorial
  tutorial_prev: '◀ Back',
  tutorial_next: 'Next ▶',

  // Cyber Shop & Monetization
  menu_shop_title: 'Cyber Market',
  menu_shop_sub: 'No Ads • VIP Pass • Hints',
  settings_open_shop_btn: 'Cyber Market (No Ads / VIP)',
  shop_title: 'Cyber Market',
  shop_subtitle: 'Premium perks and game support',
  shop_badge_vip: 'BEST VALUE',
  shop_badge_noads: 'POPULAR',
  shop_vip_title: 'Cyber VIP Pass',
  shop_vip_desc: 'No Ads forever + Cyber Gold grid skin + 25 hints + VIP badge',
  shop_noads_title: 'No Ads Pass',
  shop_noads_desc: 'Permanent removal of all fullscreen ads and banners',
  shop_hints_title: '20 Hints Pack',
  shop_hints_desc: '+20 hints for instant solution of tough cells',
  shop_btn_buy: 'Buy',
  shop_btn_restore: '🔄 Restore',
  shop_owned: 'Owned ✅',
  shop_toast_success: '🎉 Purchase successful! Thank you for supporting the game!',
  shop_toast_restored: '✨ Purchases restored successfully!',
  win_double_score_btn: 'Double Round Score',
  win_double_score_done: '✅ Score Doubled!',
  win_double_score_toast: '🎉 Victory score doubled!',
  skin_trial_title: 'Try Skin',
  skin_trial_desc: 'This grid skin is locked. Would you like to try it for this session by watching a short video?',
  skin_trial_btn_watch: '🎬 Try via Video',
  skin_trial_active_toast: '🎨 Grid skin temporarily unlocked for this game!',
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
    ru: { title: 'В ритме пульса', desc: 'Достичь комбо-серии из 8 верных ходов подряд' },
    en: { title: 'Rhythm of the Pulse', desc: 'Achieve a combo streak of 8 correct moves' },
  },
  combo_15: {
    ru: { title: 'Квантовый резонанс', desc: 'Достичь серии комбо из 15 верных ходов подряд' },
    en: { title: 'Quantum Resonance', desc: 'Achieve an unbroken combo streak of 15 correct moves' },
  },
  fever_master: {
    ru: { title: 'Перегрузка', desc: 'Активировать режим Fever Overdrive 10 раз' },
    en: { title: 'Overdrive', desc: 'Trigger Fever Overdrive mode 10 times' },
  },
  fever_hyper: {
    ru: { title: 'Гипердрайв', desc: 'Активировать режим Fever Overdrive 30 раз' },
    en: { title: 'Hyperdrive', desc: 'Trigger Fever Overdrive mode 30 times' },
  },
  flawless: {
    ru: { title: 'Чистый разум', desc: 'Решить головоломку без единой ошибки' },
    en: { title: 'Pure Mind', desc: 'Solve a puzzle without making a single mistake' },
  },
  flawless_hard: {
    ru: { title: 'Холодный расчёт', desc: 'Победить без единой ошибки на сложности Сложный или Эксперт' },
    en: { title: 'Cold Calculation', desc: 'Win without any mistakes on Hard or Expert difficulty' },
  },
  no_hints: {
    ru: { title: 'Абсолютная интуиция', desc: 'Пройти партию без использования подсказок' },
    en: { title: 'Pure Intuition', desc: 'Win a game without using any hints' },
  },
  speed_demon: {
    ru: { title: 'Сверхзвуковой', desc: 'Решить классическое судоку быстрее 3 минут' },
    en: { title: 'Supersonic', desc: 'Solve classic Sudoku in under 3 minutes' },
  },
  dark_navigator: {
    ru: { title: 'Навигатор бездны', desc: 'Одержать 3 победы в режиме «Тёмный сектор»' },
    en: { title: 'Abyss Navigator', desc: 'Win 3 games in Dark Sector mode' },
  },
  blind_flight: {
    ru: { title: 'Слепой полёт', desc: 'Пройти «Тёмный сектор» на сложности Эксперт (0 маяков)' },
    en: { title: 'Blind Flight', desc: 'Complete Dark Sector on Expert difficulty (0 beacons)' },
  },
  run_stage_3: {
    ru: { title: 'Покоритель секторов', desc: 'Пройти минимум 3 этапа за один забег Pulse Run' },
    en: { title: 'Sector Conqueror', desc: 'Clear at least 3 stages in a single Pulse Run' },
  },
  run_stage_5: {
    ru: { title: 'Сверхновая', desc: 'Достичь 5-го этапа в Pulse Run (Экстремальный сектор)' },
    en: { title: 'Supernova', desc: 'Reach Sector 5 in Pulse Run (Extreme modifier)' },
  },
  surge_hunter: {
    ru: { title: 'Ловец молний', desc: 'Захватить 15 энергетических клеток «⚡ Вспышка»' },
    en: { title: 'Lightning Catcher', desc: 'Capture 15 lightning surge cells' },
  },
  surge_storm: {
    ru: { title: 'Повелитель бури', desc: 'Захватить 40 энергетических клеток «⚡ Вспышка»' },
    en: { title: 'Storm Master', desc: 'Capture 40 lightning surge cells' },
  },
  streak_3: {
    ru: { title: 'Ритм дисциплины', desc: 'Поддерживать серию побед 3 дня подряд в Daily Pulse' },
    en: { title: 'Discipline Rhythm', desc: 'Maintain a 3-day winning streak in Daily Pulse' },
  },
  streak_7: {
    ru: { title: 'Недельный импульс', desc: 'Поддерживать серию побед 7 дней подряд в Daily Pulse' },
    en: { title: 'Weekly Pulse', desc: 'Maintain a 7-day winning streak in Daily Pulse' },
  },
  duel_master: {
    ru: { title: 'Дуэлянт киберсети', desc: 'Одержать 3 победы в дуэлях против виртуального AI' },
    en: { title: 'Cyber Duelist', desc: 'Win 3 duels against virtual AI bots' },
  },
  score_25k: {
    ru: { title: 'Энергетический пик', desc: 'Набрать более 25 000 очков за одну партию' },
    en: { title: 'Energy Peak', desc: 'Score over 25,000 points in a single match' },
  },
  score_50k: {
    ru: { title: 'Легенда неонового поля', desc: 'Набрать более 50 000 очков за одну партию' },
    en: { title: 'Neon Legend', desc: 'Score over 50,000 points in a single match' },
  },
  total_score_50k: {
    ru: { title: 'Мастер ранга', desc: 'Набрать суммарно 50 000 очков во всех партиях' },
    en: { title: 'Rank Master', desc: 'Accumulate 50,000 total career points across all games' },
  },
  grandmaster: {
    ru: { title: 'Грандмастер Пульса', desc: 'Набрать суммарно 150 000 очков во всех партиях' },
    en: { title: 'Pulse Grandmaster', desc: 'Accumulate 150,000 total career points across all games' },
  },
  veteran_10: {
    ru: { title: 'Опытный оператор', desc: 'Одержать 10 побед в любых режимах' },
    en: { title: 'Seasoned Operator', desc: 'Achieve 10 total victories in any game modes' },
  },
  veteran_25: {
    ru: { title: 'Ветеран матрицы', desc: 'Одержать 25 побед во всех режимах' },
    en: { title: 'Matrix Veteran', desc: 'Achieve 25 total victories across all game modes' },
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

    // Check Yandex Games environment if already loaded
    const yLang = (window as any).ysdk?.environment?.i18n?.lang || (window as any).YaGames?.environment?.i18n?.lang;
    if (yLang && typeof yLang === 'string') {
      const lower = yLang.toLowerCase();
      this.currentLang = (lower.startsWith('ru') || lower.startsWith('be') || lower.startsWith('kk') || lower.startsWith('uk') || lower.startsWith('uz')) ? 'ru' : 'en';
      return this.currentLang;
    }

    // Check navigator / system
    if (typeof navigator !== 'undefined') {
      const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
      if (navLang.startsWith('ru') || navLang.startsWith('be') || navLang.startsWith('kk') || navLang.startsWith('uk') || navLang.startsWith('uz')) {
        this.currentLang = 'ru';
      } else {
        this.currentLang = 'en';
      }
    } else {
      this.currentLang = 'ru';
    }

    return this.currentLang;
  }

  public applyPlatformDetectedLanguage(langCode: string): void {
    try {
      if (localStorage.getItem('sudoku_pulse_lang')) return;
    } catch {}
    const lower = (langCode || '').toLowerCase();
    const resolved: Language = (lower.startsWith('ru') || lower.startsWith('be') || lower.startsWith('kk') || lower.startsWith('uk') || lower.startsWith('uz')) ? 'ru' : 'en';
    if (this.currentLang !== resolved) {
      this.setLanguage(resolved);
    }
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
