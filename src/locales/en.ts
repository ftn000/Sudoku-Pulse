import { LocaleDefinition } from '../types';

export const en: LocaleDefinition = {
  dict: {
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
  lb_mode_pvp_duel: '⚔️ 1v1 PvP',
  lb_mode_duels: '🤖 AI Duels',
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
},
  perks: {
  "neon_shield": {
    "name": "Neon Shield",
    "desc": "Absorbs mistakes on each stage (+1 shield per level)"
  },
  "time_warp": {
    "name": "Time Warp",
    "desc": "Combo decay rate is significantly reduced"
  },
  "fever_overdrive": {
    "name": "Super Overdrive",
    "desc": "Fever Overdrive lasts +5s longer per level"
  },
  "power_bank": {
    "name": "Power Bank",
    "desc": "+1 bonus hint per perk level"
  },
  "keen_eye": {
    "name": "Long-range Radar",
    "desc": "In Dark Sector, scanner radius expands to 5×5 (7×7 on Lvl II)"
  },
  "point_surge": {
    "name": "Pulse Resonance",
    "desc": "+50% bonus Pulse points per perk level"
  },
  "extra_heart": {
    "name": "Quantum Heart",
    "desc": "Mistake limit increased by +2 lives per level"
  },
  "combo_master": {
    "name": "Combo Accelerator",
    "desc": "Base combo starts at x2.0 (x3.0 on Lvl II)"
  },
  "chrono_boost": {
    "name": "Chrono Boost",
    "desc": "First 2 minutes of match award 2x bonus score"
  },
  "emp_pulse": {
    "name": "EMP Pulse",
    "desc": "Auto-solves +1 random cell at the start of each stage (+2 on Lvl II)"
  },
  "auto_scanner": {
    "name": "Neuro-Scanner",
    "desc": "Auto-fills pencil candidate notes at stage start"
  },
  "overcharge": {
    "name": "Overcharge",
    "desc": "In Fever mode, score multiplier skyrockets to x4.0 instead of x2.0"
  }
},
  achievements: {
  "first_win": {
    "title": "First Spark",
    "desc": "Win your first game in any mode"
  },
  "combo_8": {
    "title": "Rhythm of the Pulse",
    "desc": "Achieve a combo streak of 8 correct moves"
  },
  "combo_15": {
    "title": "Quantum Resonance",
    "desc": "Achieve an unbroken combo streak of 15 correct moves"
  },
  "fever_master": {
    "title": "Overdrive",
    "desc": "Trigger Fever Overdrive mode 10 times"
  },
  "fever_hyper": {
    "title": "Hyperdrive",
    "desc": "Trigger Fever Overdrive mode 30 times"
  },
  "flawless": {
    "title": "Pure Mind",
    "desc": "Solve a puzzle without making a single mistake"
  },
  "flawless_hard": {
    "title": "Cold Calculation",
    "desc": "Win without any mistakes on Hard or Expert difficulty"
  },
  "no_hints": {
    "title": "Pure Intuition",
    "desc": "Win a game without using any hints"
  },
  "speed_demon": {
    "title": "Supersonic",
    "desc": "Solve classic Sudoku in under 3 minutes"
  },
  "dark_navigator": {
    "title": "Abyss Navigator",
    "desc": "Win 3 games in Dark Sector mode"
  },
  "blind_flight": {
    "title": "Blind Flight",
    "desc": "Complete Dark Sector on Expert difficulty (0 beacons)"
  },
  "run_stage_3": {
    "title": "Sector Conqueror",
    "desc": "Clear at least 3 stages in a single Pulse Run"
  },
  "run_stage_5": {
    "title": "Supernova",
    "desc": "Reach Sector 5 in Pulse Run (Extreme modifier)"
  },
  "surge_hunter": {
    "title": "Lightning Catcher",
    "desc": "Capture 15 lightning surge cells"
  },
  "surge_storm": {
    "title": "Storm Master",
    "desc": "Capture 40 lightning surge cells"
  },
  "streak_3": {
    "title": "Discipline Rhythm",
    "desc": "Maintain a 3-day winning streak in Daily Pulse"
  },
  "streak_7": {
    "title": "Weekly Pulse",
    "desc": "Maintain a 7-day winning streak in Daily Pulse"
  },
  "duel_master": {
    "title": "Cyber Duelist",
    "desc": "Win 3 duels against virtual AI bots"
  },
  "score_25k": {
    "title": "Energy Peak",
    "desc": "Score over 25,000 points in a single match"
  },
  "score_50k": {
    "title": "Neon Legend",
    "desc": "Score over 50,000 points in a single match"
  },
  "total_score_50k": {
    "title": "Rank Master",
    "desc": "Accumulate 50,000 total career points across all games"
  },
  "grandmaster": {
    "title": "Pulse Grandmaster",
    "desc": "Accumulate 150,000 total career points across all games"
  },
  "veteran_10": {
    "title": "Seasoned Operator",
    "desc": "Achieve 10 total victories in any game modes"
  },
  "veteran_25": {
    "title": "Matrix Veteran",
    "desc": "Achieve 25 total victories across all game modes"
  }
}
};
