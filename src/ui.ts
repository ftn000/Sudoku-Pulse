import { SudokuGame } from './game';
import { Difficulty, GameMode, GameStats, AppScreen, SeasonBadge } from './types';
import { soundManager } from './audio';
import { getRandomPerks, formatRomanLevel } from './perks';
import { ACHIEVEMENTS, evaluateAllAchievements } from './achievements';
import { haptics, TelegramUser } from './haptics';

export function getApiBaseUrl(): string {
  const isNative = Boolean(
    (window as any).Capacitor?.isNativePlatform?.() ||
    (window as any).Capacitor ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '5173')
  );

  if (isNative) {
    return 'https://109.69.17.170.sslip.io/sudoku/api';
  }

  return window.location.pathname.startsWith('/sudoku') ? '/sudoku/api' : '/api';
}

export interface DuelRecord {
  id: string;
  date: string;
  challenger: string;
  won: boolean;
  myScore: number;
  myTime: number;
  targetScore: number;
  targetTime: number;
  diff: Difficulty;
  mode: GameMode;
}

export interface LeagueInfo {
  id: 'bronze' | 'silver' | 'gold' | 'platinum' | 'grandmaster';
  name: string;
  icon: string;
  badgeClass: string;
  frameClass: string;
  minScore: number;
}

export function getLeagueForScore(totalScore: number): LeagueInfo {
  if (totalScore >= 150000) return { id: 'grandmaster', name: 'Кибер-Мастер', icon: '👑', badgeClass: 'league-badge grandmaster', frameClass: 'avatar-frame-grandmaster', minScore: 150000 };
  if (totalScore >= 75000) return { id: 'platinum', name: 'Платиновая', icon: '💎', badgeClass: 'league-badge platinum', frameClass: 'avatar-frame-platinum', minScore: 75000 };
  if (totalScore >= 30000) return { id: 'gold', name: 'Золотая', icon: '🥇', badgeClass: 'league-badge gold', frameClass: 'avatar-frame-gold', minScore: 30000 };
  if (totalScore >= 10000) return { id: 'silver', name: 'Серебряная', icon: '🥈', badgeClass: 'league-badge silver', frameClass: 'avatar-frame-silver', minScore: 10000 };
  return { id: 'bronze', name: 'Бронзовая', icon: '🥉', badgeClass: 'league-badge bronze', frameClass: 'avatar-frame-bronze', minScore: 0 };
}

export function getSeasonRemainingText(): string {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const daysUntilMonday = ((8 - currentDay) % 7) || 7;
  const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0));
  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
  const diffHoursTotal = Math.floor(diffMs / (1000 * 3600));
  const days = Math.floor(diffHoursTotal / 24);
  const hours = diffHoursTotal % 24;
  return `${days} дн. ${hours} ч.`;
}

export interface SeasonTrophy {
  seasonId: string;
  seasonName: string;
  leagueId: string;
  leagueName: string;
  icon: string;
  points: number;
  dateAwarded: string;
}

export function getCurrentSeasonId(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export class SudokuUI {
  private game: SudokuGame;
  private timerInterval?: number;
  private currentScreen: AppScreen = 'menu';

  // Pending setup for new game
  private selectedMode: GameMode = 'classic';
  private selectedDifficulty: Difficulty = 'medium';

  // Screen Elements
  private screenMenu!: HTMLElement;
  private screenModes!: HTMLElement;
  private screenPerks!: HTMLElement;
  private screenGame!: HTMLElement;

  // Main Menu Elements
  private btnMenuContinue!: HTMLButtonElement;
  private menuContinueMeta!: HTMLElement;
  private btnMenuPlay!: HTMLButtonElement;
  private btnMenuDaily!: HTMLButtonElement;
  private btnMenuAchievements!: HTMLButtonElement;
  private menuAchCounter!: HTMLElement;
  private btnMenuStats!: HTMLButtonElement;
  private btnMenuSettings!: HTMLButtonElement;
  private menuDailyDate!: HTMLElement;
  private menuDailyStreak!: HTMLElement;
  private btnMenuTgAuth!: HTMLButtonElement;
  private menuTgAuthLabel!: HTMLElement;
  private menuLeagueBadge!: HTMLElement;

  // Mode Select Elements
  private btnModesBack!: HTMLButtonElement;
  private btnStartSelectedMode!: HTMLButtonElement;
  private modeCards: HTMLElement[] = [];
  private diffPills: HTMLButtonElement[] = [];

  // Perk Select Elements
  private btnPerksBack!: HTMLButtonElement;
  private perksListContainer!: HTMLElement;

  // Game Screen Elements
  private btnGameHome!: HTMLButtonElement;
  private gameModeBadge!: HTMLElement;
  private gamePerkBadge!: HTMLElement;
  private scoreCounter!: HTMLElement;
  private comboBadge!: HTMLElement;
  private pulseFill!: HTMLElement;
  private pulseStatusText!: HTMLElement;

  private boardElement!: HTMLElement;
  private multiClearContainer!: HTMLElement;
  private timerElement!: HTMLElement;
  private mistakesElement!: HTMLElement;
  private pauseOverlay!: HTMLElement;
  private pauseBtn!: HTMLButtonElement;
  private resumeBtn!: HTMLButtonElement;
  private notesBtn!: HTMLButtonElement;
  private btnAutoNotes!: HTMLButtonElement;
  private undoBtn!: HTMLButtonElement;
  private eraseBtn!: HTMLButtonElement;
  private hintBtn!: HTMLButtonElement;
  private hintBtnLabel!: HTMLElement;
  private hintCounterBadge!: HTMLElement;
  private newGameBtn!: HTMLButtonElement;
  private themeToggleBtn!: HTMLButtonElement;
  private soundToggleBtn!: HTMLButtonElement;
  private numpadButtons: HTMLButtonElement[] = [];

  // Modals
  private winModal!: HTMLElement;
  private modalWinTitle!: HTMLElement;
  private modalSubtitle!: HTMLElement;
  private modalTime!: HTMLElement;
  private modalScore!: HTMLElement;
  private modalCombo!: HTMLElement;
  private modalMistakes!: HTMLElement;
  private modalMode!: HTMLElement;
  private modalDiff!: HTMLElement;
  private runStageUpgrade!: HTMLElement;
  private nextStageNum!: HTMLElement;
  private runPerksDraft!: HTMLElement;
  private btnDailyShare!: HTMLButtonElement;
  private btnChallengeShare!: HTMLButtonElement;
  private btnWinMenu!: HTMLButtonElement;
  private playAgainBtn!: HTMLButtonElement;

  private gameOverModal!: HTMLElement;
  private gameOverSubtitle!: HTMLElement;
  private secondChanceBtn!: HTMLButtonElement;
  private restartGameOverBtn!: HTMLButtonElement;
  private btnGameOverMenu!: HTMLButtonElement;

  private statsModal!: HTMLElement;
  private btnCloseStats!: HTMLButtonElement;
  private playerNameInput!: HTMLInputElement;
  private statLeagueBadge!: HTMLElement;
  private statSeasonTimer!: HTMLElement;
  private seasonArchiveList!: HTMLElement;
  private duelHistorySummary!: HTMLElement;
  private duelHistoryList!: HTMLElement;
  private leaderboardList!: HTMLElement;
  private leaderboardFilterTabs: HTMLButtonElement[] = [];
  private currentLeaderboardModeFilter: string = 'all';
  private currentLeaderboardTimeframe: 'all' | 'season' = 'all';
  private currentSeasonId: string = '';
  private lbTimeframeAll!: HTMLButtonElement;
  private lbTimeframeSeason!: HTMLButtonElement;
  private cachedLeaderboardEntries: Array<{
    playerId?: string;
    name: string;
    score: number;
    mode: string;
    difficulty?: string;
    runStage?: number;
  }> = [];
  private statPlayed!: HTMLElement;
  private statWon!: HTMLElement;
  private statCombo!: HTMLElement;
  private statScore!: HTMLElement;
  private statStreak!: HTMLElement;
  private statRunStage!: HTMLElement;

  private achievementsModal!: HTMLElement;
  private achievementsSubtitle!: HTMLElement;
  private achievementsList!: HTMLElement;
  private btnCloseAchievements!: HTMLButtonElement;

  private settingsModal!: HTMLElement;
  private btnCloseSettings!: HTMLButtonElement;
  private settingSoundBtn!: HTMLButtonElement;
  private settingThemeBtn!: HTMLButtonElement;
  private settingNotifyBtn!: HTMLButtonElement;
  private themeSkinPills: HTMLButtonElement[] = [];
  private boardSkinPills: HTMLButtonElement[] = [];
  private syncAccountBadge!: HTMLElement;
  private syncKeyInput!: HTMLInputElement;
  private btnSyncImport!: HTMLButtonElement;
  private btnSyncCopyKey!: HTMLButtonElement;
  private btnSyncCloud!: HTMLButtonElement;
  private btnSyncTgAuth!: HTMLButtonElement;
  private notificationsEnabled: boolean = true;

  // AI Duel HUD elements
  private aiDuelHud!: HTMLElement;
  private playerDuelCount!: HTMLElement;
  private playerDuelFill!: HTMLElement;
  private aiBotName!: HTMLElement;
  private aiBotCount!: HTMLElement;
  private aiBotFill!: HTMLElement;
  private aiBotAvatar!: HTMLElement;
  private aiBotEmotionTimeout?: number;
  private aiBotTaunt!: HTMLElement;
  private aiBotTauntText!: HTMLElement;
  private aiBotTauntTimeout?: number;
  private playerSeasonMedals!: HTMLElement;
  private aiBotInterval?: number;
  private aiBotProgress = {
    name: 'PulseBot',
    filled: 0,
    total: 45,
    score: 0,
    stepIntervalMs: 5000,
    reachedHalf: false,
    reachedEighty: false,
  };

  // Telegram Auth Modal Elements
  private tgAuthModal!: HTMLElement;
  private tgAuthActiveView!: HTMLElement;
  private tgAuthLoginView!: HTMLElement;
  private tgAuthUserAvatar!: HTMLElement;
  private tgAuthUserName!: HTMLElement;
  private tgAuthUserHandle!: HTMLElement;
  private btnTgManualSync!: HTMLButtonElement;
  private btnTgLogout!: HTMLButtonElement;
  private tgTabs: HTMLButtonElement[] = [];
  private tgTabPanes: HTMLElement[] = [];
  private tgAuthQrImg!: HTMLImageElement;
  private tgQrSpinner!: HTMLElement;
  private btnTgOpenBotLink!: HTMLAnchorElement;
  private tgPollStatusText!: HTMLElement;
  private tgWidgetContainer!: HTMLElement;
  private tgManualInput!: HTMLInputElement;
  private btnTgManualLogin!: HTMLButtonElement;
  private btnCloseTgAuth!: HTMLButtonElement;
  private tgAuthPollTimer?: number;

  // Challenge / Duel Modal Elements
  private challengeModal!: HTMLElement;
  private challengeChallengerName!: HTMLElement;
  private challengeDiff!: HTMLElement;
  private challengeMode!: HTMLElement;
  private challengeTargetScore!: HTMLElement;
  private challengeTargetTime!: HTMLElement;
  private btnChallengeAccept!: HTMLButtonElement;
  private btnChallengeDecline!: HTMLButtonElement;

  private duelResultBanner!: HTMLElement;
  private duelResultTitle!: HTMLElement;
  private duelResultText!: HTMLElement;

  private activeChallenge?: {
    seed: number;
    diff: Difficulty;
    mode: GameMode;
    targetScore: number;
    targetTime: number;
    challenger: string;
  };

  private adModal!: HTMLElement;
  private adRewardTitle!: HTMLElement;
  private adProgressFill!: HTMLElement;
  private adTimerText!: HTMLElement;

  // Background Particles & Confetti
  private bgParticlesCanvas!: HTMLCanvasElement;
  private bgParticlesCtx!: CanvasRenderingContext2D | null;
  private confettiCanvas!: HTMLCanvasElement;
  private confettiCtx!: CanvasRenderingContext2D | null;
  private confettiAnimationId?: number;

  constructor(game: SudokuGame) {
    this.game = game;
    this.initDOMElements();
    this.initEventListeners();
    this.initConfetti();
    this.initBgParticles();
    this.updateDailyInfoOnMenu();
    this.checkSeasonTransition();

    if (!this.checkUrlChallenge()) {
      this.showScreen('menu');
    }

    this.game.setCallbacks({
      onStateChange: () => this.render(),
      onWin: (stats) => this.showWinModal(stats),
      onGameOver: () => this.showGameOverModal(),
      onLineComplete: (cells, types) => {
        this.triggerLineWave(cells);
        const count = types?.length || 1;
        if (count >= 2) {
          const bonus = count >= 4 ? 3000 : (count === 3 ? 1500 : 600);
          this.showMultiClearBanner(count, bonus);
          haptics.overdrive(count);
        } else {
          haptics.success();
        }
        soundManager.playLineChord(count, types || ['row']);
      },
      onAchievementUnlocked: (ach) => {
        soundManager.playAchievement();
        haptics.achievement();
        this.updateDailyInfoOnMenu();
        setTimeout(() => {
          this.showToast(`🏅 Открыто достижение: ${ach.icon} ${ach.title}!`);
        }, 450);
      },
      onSurgeCaptured: (bonusScore: number) => {
        soundManager.playLineChord(2, ['row', 'col']);
        haptics.fever();
        this.showToast(`⚡ Вспышка перехвачена! +${bonusScore} очков и +45% пульса`);
      },
      onSoundTrigger: (sound) => {
        if (sound === 'select') {
          soundManager.playSelect();
          haptics.selection();
        } else if (sound === 'place') {
          soundManager.playSelect();
          haptics.light();
        } else if (sound === 'correct') {
          soundManager.playCorrect(this.game.comboCount);
          haptics.success();
          if (this.game.mode === 'ai_duel' && this.game.comboCount >= 4) {
            const comboTaunts = [
              `Ого, комбо x${this.game.comboCount}?! Неплохой разгон!`,
              `Комбо x${this.game.comboCount}! Но я всё равно быстрее.`,
              'Впечатляющий темп... Принимаю вызов!',
            ];
            this.showAiBotTaunt(comboTaunts[Math.floor(Math.random() * comboTaunts.length)], 2600);
          }
        } else if (sound === 'error') {
          soundManager.playError();
          haptics.error();
          if (this.game.mode === 'ai_duel') {
            this.setAiBotEmotion('smug', 2800);
            const mistakeTaunts = [
              'Ошибочка! Мой алгоритм таких промахов не делает.',
              'Минус попытка! Твоя концентрация падает.',
              'Нервы сдают? Скорость требует предельной точности!',
            ];
            this.showAiBotTaunt(mistakeTaunts[Math.floor(Math.random() * mistakeTaunts.length)], 2800);
          }
        } else if (sound === 'line') {
          // Handled via onLineComplete with chord synthesizer
        } else if (sound === 'win') {
          soundManager.playVictory();
          haptics.victory();
        } else if (sound === 'fever') {
          soundManager.playFeverStart();
          haptics.fever();
          if (this.game.mode === 'ai_duel') {
            this.setAiBotEmotion('fever');
            this.showAiBotTaunt('🔥 Режим FEVER?! Форсирую ядра процессора!', 3000);
          }
        } else if (sound === 'fever_end') {
          soundManager.stopFeverTrack();
          if (this.game.mode === 'ai_duel') {
            this.setAiBotEmotion('idle');
          }
        } else if (sound === 'shield') {
          soundManager.playShieldDeflect();
          haptics.light();
        }
      },
    });
  }

  private initDOMElements() {
    // Screens
    this.screenMenu = document.getElementById('screen-menu')!;
    this.screenModes = document.getElementById('screen-modes')!;
    this.screenPerks = document.getElementById('screen-perks')!;
    this.screenGame = document.getElementById('screen-game')!;

    // Menu
    this.btnMenuContinue = document.getElementById('btn-menu-continue') as HTMLButtonElement;
    this.menuContinueMeta = document.getElementById('menu-continue-meta')!;
    this.btnMenuPlay = document.getElementById('btn-menu-play') as HTMLButtonElement;
    this.btnMenuDaily = document.getElementById('btn-menu-daily') as HTMLButtonElement;
    this.btnMenuAchievements = document.getElementById('btn-menu-achievements') as HTMLButtonElement;
    this.menuAchCounter = document.getElementById('menu-ach-counter')!;
    this.btnMenuStats = document.getElementById('btn-menu-stats') as HTMLButtonElement;
    this.btnMenuSettings = document.getElementById('btn-menu-settings') as HTMLButtonElement;
    this.menuDailyDate = document.getElementById('menu-daily-date')!;
    this.menuDailyStreak = document.getElementById('menu-daily-streak')!;
    this.btnMenuTgAuth = document.getElementById('btn-menu-tg-auth') as HTMLButtonElement;
    this.menuTgAuthLabel = document.getElementById('menu-tg-auth-label')!;
    this.menuLeagueBadge = document.getElementById('menu-league-badge')!;

    // Mode Select
    this.btnModesBack = document.getElementById('btn-modes-back') as HTMLButtonElement;
    this.btnStartSelectedMode = document.getElementById('btn-start-selected-mode') as HTMLButtonElement;
    this.modeCards = Array.from(document.querySelectorAll('.mode-card'));
    this.diffPills = Array.from(document.querySelectorAll('.diff-pill[data-diff]'));

    // Perk Select
    this.btnPerksBack = document.getElementById('btn-perks-back') as HTMLButtonElement;
    this.perksListContainer = document.getElementById('perks-list')!;

    // Game Screen
    this.btnGameHome = document.getElementById('btn-game-home') as HTMLButtonElement;
    this.gameModeBadge = document.getElementById('game-mode-badge')!;
    this.gamePerkBadge = document.getElementById('game-perk-badge')!;
    this.scoreCounter = document.getElementById('score-counter')!;
    this.comboBadge = document.getElementById('combo-badge')!;
    this.pulseFill = document.getElementById('pulse-fill')!;
    this.pulseStatusText = document.getElementById('pulse-status-text')!;

    this.boardElement = document.getElementById('sudoku-board')!;
    this.multiClearContainer = document.getElementById('multi-clear-container')!;
    this.aiDuelHud = document.getElementById('ai-duel-hud')!;
    this.playerDuelCount = document.getElementById('player-duel-count')!;
    this.playerDuelFill = document.getElementById('player-duel-fill')!;
    this.aiBotName = document.getElementById('ai-bot-name')!;
    this.aiBotCount = document.getElementById('ai-bot-count')!;
    this.aiBotFill = document.getElementById('ai-bot-fill')!;
    this.aiBotAvatar = document.getElementById('ai-bot-avatar')!;
    this.aiBotTaunt = document.getElementById('ai-bot-taunt')!;
    this.aiBotTauntText = document.getElementById('ai-bot-taunt-text')!;
    this.playerSeasonMedals = document.getElementById('player-season-medals')!;
    this.timerElement = document.getElementById('timer')!;
    this.mistakesElement = document.getElementById('mistakes')!;
    this.pauseOverlay = document.getElementById('pause-overlay')!;
    this.pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement;
    this.resumeBtn = document.getElementById('btn-resume') as HTMLButtonElement;
    this.notesBtn = document.getElementById('btn-notes') as HTMLButtonElement;
    this.btnAutoNotes = document.getElementById('btn-auto-notes') as HTMLButtonElement;
    this.undoBtn = document.getElementById('btn-undo') as HTMLButtonElement;
    this.eraseBtn = document.getElementById('btn-erase') as HTMLButtonElement;
    this.hintBtn = document.getElementById('btn-hint') as HTMLButtonElement;
    this.hintBtnLabel = document.getElementById('hint-btn-label')!;
    this.hintCounterBadge = document.getElementById('hint-counter')!;
    this.newGameBtn = document.getElementById('btn-new-game') as HTMLButtonElement;
    this.themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;
    this.soundToggleBtn = document.getElementById('sound-toggle') as HTMLButtonElement;

    // Modals
    this.winModal = document.getElementById('win-modal')!;
    this.modalWinTitle = document.getElementById('modal-win-title')!;
    this.modalSubtitle = document.getElementById('modal-subtitle')!;
    this.modalTime = document.getElementById('modal-time')!;
    this.modalScore = document.getElementById('modal-score')!;
    this.modalCombo = document.getElementById('modal-combo')!;
    this.modalMistakes = document.getElementById('modal-mistakes')!;
    this.modalMode = document.getElementById('modal-mode')!;
    this.modalDiff = document.getElementById('modal-diff')!;
    this.runStageUpgrade = document.getElementById('run-stage-upgrade')!;
    this.nextStageNum = document.getElementById('next-stage-num')!;
    this.runPerksDraft = document.getElementById('run-perks-draft')!;
    this.btnDailyShare = document.getElementById('btn-daily-share') as HTMLButtonElement;
    this.btnChallengeShare = document.getElementById('btn-challenge-share') as HTMLButtonElement;
    this.btnWinMenu = document.getElementById('btn-win-menu') as HTMLButtonElement;
    this.playAgainBtn = document.getElementById('btn-play-again') as HTMLButtonElement;

    this.gameOverModal = document.getElementById('gameover-modal')!;
    this.gameOverSubtitle = document.getElementById('gameover-subtitle')!;
    this.secondChanceBtn = document.getElementById('btn-second-chance') as HTMLButtonElement;
    this.restartGameOverBtn = document.getElementById('btn-restart-gameover') as HTMLButtonElement;
    this.btnGameOverMenu = document.getElementById('btn-gameover-menu') as HTMLButtonElement;

    this.statsModal = document.getElementById('stats-modal')!;
    this.btnCloseStats = document.getElementById('btn-close-stats') as HTMLButtonElement;
    this.playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
    this.statLeagueBadge = document.getElementById('stat-league-badge')!;
    this.statSeasonTimer = document.getElementById('stat-season-timer')!;
    this.seasonArchiveList = document.getElementById('season-archive-list')!;
    this.duelHistorySummary = document.getElementById('duel-history-summary')!;
    this.duelHistoryList = document.getElementById('duel-history-list')!;
    this.leaderboardList = document.getElementById('leaderboard-list')!;
    this.leaderboardFilterTabs = Array.from(document.querySelectorAll('.lb-tab'));
    this.lbTimeframeAll = document.getElementById('lb-timeframe-all') as HTMLButtonElement;
    this.lbTimeframeSeason = document.getElementById('lb-timeframe-season') as HTMLButtonElement;
    this.statPlayed = document.getElementById('stat-played')!;
    this.statWon = document.getElementById('stat-won')!;
    this.statCombo = document.getElementById('stat-combo')!;
    this.statScore = document.getElementById('stat-score')!;
    this.statStreak = document.getElementById('stat-streak')!;
    this.statRunStage = document.getElementById('stat-run-stage')!;

    this.achievementsModal = document.getElementById('achievements-modal')!;
    this.achievementsSubtitle = document.getElementById('achievements-subtitle')!;
    this.achievementsList = document.getElementById('achievements-list')!;
    this.btnCloseAchievements = document.getElementById('btn-close-achievements') as HTMLButtonElement;

    this.settingsModal = document.getElementById('settings-modal')!;
    this.btnCloseSettings = document.getElementById('btn-close-settings') as HTMLButtonElement;
    this.settingSoundBtn = document.getElementById('setting-sound-btn') as HTMLButtonElement;
    this.settingThemeBtn = document.getElementById('setting-theme-btn') as HTMLButtonElement;
    this.settingNotifyBtn = document.getElementById('setting-notify-btn') as HTMLButtonElement;
    this.themeSkinPills = Array.from(document.querySelectorAll('.theme-skin-pill'));
    this.boardSkinPills = Array.from(document.querySelectorAll('.board-skin-pill'));
    this.syncAccountBadge = document.getElementById('sync-account-badge')!;
    this.syncKeyInput = document.getElementById('sync-key-input') as HTMLInputElement;
    this.btnSyncImport = document.getElementById('btn-sync-import') as HTMLButtonElement;
    this.btnSyncCopyKey = document.getElementById('btn-sync-copy-key') as HTMLButtonElement;
    this.btnSyncCloud = document.getElementById('btn-sync-cloud') as HTMLButtonElement;
    this.btnSyncTgAuth = document.getElementById('btn-sync-tg-auth') as HTMLButtonElement;

    // Challenge / Duel Modal
    this.challengeModal = document.getElementById('challenge-modal')!;
    this.challengeChallengerName = document.getElementById('challenge-challenger-name')!;
    this.challengeDiff = document.getElementById('challenge-diff')!;
    this.challengeMode = document.getElementById('challenge-mode')!;
    this.challengeTargetScore = document.getElementById('challenge-target-score')!;
    this.challengeTargetTime = document.getElementById('challenge-target-time')!;
    this.btnChallengeAccept = document.getElementById('btn-challenge-accept') as HTMLButtonElement;
    this.btnChallengeDecline = document.getElementById('btn-challenge-decline') as HTMLButtonElement;
    this.duelResultBanner = document.getElementById('duel-result-banner')!;
    this.duelResultTitle = document.getElementById('duel-result-title')!;
    this.duelResultText = document.getElementById('duel-result-text')!;

    // Telegram Auth Modal
    this.tgAuthModal = document.getElementById('tg-auth-modal')!;
    this.tgAuthActiveView = document.getElementById('tg-auth-active-view')!;
    this.tgAuthLoginView = document.getElementById('tg-auth-login-view')!;
    this.tgAuthUserAvatar = document.getElementById('tg-auth-user-avatar')!;
    this.tgAuthUserName = document.getElementById('tg-auth-user-name')!;
    this.tgAuthUserHandle = document.getElementById('tg-auth-user-handle')!;
    this.btnTgManualSync = document.getElementById('btn-tg-manual-sync') as HTMLButtonElement;
    this.btnTgLogout = document.getElementById('btn-tg-logout') as HTMLButtonElement;
    this.tgTabs = Array.from(document.querySelectorAll('.tg-tab'));
    this.tgTabPanes = Array.from(document.querySelectorAll('.tg-tab-pane'));
    this.tgAuthQrImg = document.getElementById('tg-auth-qr-img') as HTMLImageElement;
    this.tgQrSpinner = document.getElementById('tg-qr-spinner')!;
    this.btnTgOpenBotLink = document.getElementById('btn-tg-open-bot-link') as HTMLAnchorElement;
    this.tgPollStatusText = document.getElementById('tg-poll-status-text')!;
    this.tgWidgetContainer = document.getElementById('tg-widget-container')!;
    this.tgManualInput = document.getElementById('tg-manual-input') as HTMLInputElement;
    this.btnTgManualLogin = document.getElementById('btn-tg-manual-login') as HTMLButtonElement;
    this.btnCloseTgAuth = document.getElementById('btn-close-tg-auth') as HTMLButtonElement;

    this.adModal = document.getElementById('ad-modal')!;
    this.adRewardTitle = document.getElementById('ad-reward-title')!;
    this.adProgressFill = document.getElementById('ad-progress-fill')!;
    this.adTimerText = document.getElementById('ad-timer-text')!;

    this.bgParticlesCanvas = document.getElementById('bg-particles-canvas') as HTMLCanvasElement;
    this.bgParticlesCtx = this.bgParticlesCanvas.getContext('2d');
    this.confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    this.confettiCtx = this.confettiCanvas.getContext('2d');

    this.numpadButtons = [];
    for (let i = 1; i <= 9; i++) {
      const btn = document.getElementById(`num-${i}`) as HTMLButtonElement;
      if (btn) this.numpadButtons.push(btn);
    }

    // Initialize Telegram WebApp SDK
    haptics.initTelegram();

    // Register Telegram Login Widget Callback
    (window as any).onTelegramAuth = async (user: any) => {
      try {
        const apiBase = `${getApiBaseUrl()}/auth/widget`;
        const res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });
        const data = await res.json();
        this.applyTelegramUser(user, data.profile);
      } catch {
        this.applyTelegramUser(user);
      }
    };

    // Load initial settings & player name
    const tgUser = this.getStoredTelegramUser();
    const defaultName = tgUser?.username ? `@${tgUser.username}` : tgUser?.first_name || `Pulse#${Math.floor(100 + Math.random() * 899)}`;
    const savedName = localStorage.getItem('sudoku_player_name') || defaultName;
    this.playerNameInput.value = savedName;
    localStorage.setItem('sudoku_player_name', savedName);

    const savedTheme = localStorage.getItem('sudoku_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButtons(savedTheme);
    this.updateSoundButtons(soundManager.enabled);
    this.updateSyncBadge();
    this.updateTgMenuPill();

    const savedBoardSkin = this.getBoardSkin();
    document.documentElement.setAttribute('data-board-skin', savedBoardSkin);
    soundManager.setSoundTheme(savedBoardSkin);
    this.updateBoardSkinButtons();

    // Background cloud sync on start
    setTimeout(() => {
      this.syncWithCloud(false);
    }, 800);
  }

  public showScreen(screen: AppScreen) {
    this.currentScreen = screen;
    this.screenMenu.classList.toggle('hidden', screen !== 'menu');
    this.screenModes.classList.toggle('hidden', screen !== 'mode_select');
    this.screenPerks.classList.toggle('hidden', screen !== 'perk_select');
    this.screenGame.classList.toggle('hidden', screen !== 'game');

    this.updateScreenBackButton();

    if (screen === 'menu') {
      this.updateDailyInfoOnMenu();
      this.updateSyncBadge();
      this.updateTgMenuPill();
    }

    if (screen === 'game') {
      this.startTimer();
      this.render();
    } else {
      this.stopTimer();
      this.stopAiBotDuel();
      soundManager.stopFeverTrack();
    }
  }

  private initEventListeners() {
    // Menu navigation
    if (this.btnMenuContinue) {
      this.btnMenuContinue.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.light();
        if (this.game.loadFromStorage()) {
          this.showScreen('game');
          this.showToast('▶️ Игра успешно восстановлена!');
        }
      });
    }

    if (this.btnMenuTgAuth) {
      this.btnMenuTgAuth.addEventListener('click', () => {
        this.openTgAuthModal();
      });
    }

    this.btnMenuPlay.addEventListener('click', () => {
      soundManager.playSelect();
      this.showScreen('mode_select');
    });

    this.btnMenuDaily.addEventListener('click', () => {
      soundManager.playSelect();
      // Start daily challenge directly!
      this.game.startNewGame({
        difficulty: 'medium',
        mode: 'daily',
        perks: [],
      });
      this.showScreen('game');
    });

    this.btnMenuAchievements.addEventListener('click', () => {
      soundManager.playSelect();
      this.showAchievementsModal();
      haptics.setBackButton(() => {
        this.achievementsModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    });

    this.btnCloseAchievements.addEventListener('click', () => {
      this.achievementsModal.classList.add('hidden');
      this.updateScreenBackButton();
    });

    this.btnMenuStats.addEventListener('click', () => {
      soundManager.playSelect();
      if (this.playerNameInput) {
        const saved = localStorage.getItem('sudoku_player_name');
        if (saved) this.playerNameInput.value = saved;
      }
      this.showStatsModal();
      haptics.setBackButton(() => {
        this.statsModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    });

    this.btnMenuSettings.addEventListener('click', () => {
      soundManager.playSelect();
      this.updateSyncBadge();
      this.updateBoardSkinButtons();
      if (this.syncKeyInput) {
        this.syncKeyInput.value = this.getSyncKey();
      }
      this.settingsModal.classList.remove('hidden');
      haptics.setBackButton(() => {
        this.settingsModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    });

    this.btnCloseStats.addEventListener('click', () => {
      this.statsModal.classList.add('hidden');
      this.updateScreenBackButton();
    });

    this.btnCloseSettings.addEventListener('click', () => {
      this.settingsModal.classList.add('hidden');
      this.updateScreenBackButton();
    });

    // Leaderboard Filter Tabs
    this.leaderboardFilterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        soundManager.playSelect();
        this.leaderboardFilterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentLeaderboardModeFilter = tab.getAttribute('data-lb-mode') || 'all';
        this.renderLeaderboardList();
      });
    });

    if (this.lbTimeframeAll) {
      this.lbTimeframeAll.addEventListener('click', () => {
        if (this.currentLeaderboardTimeframe === 'all') return;
        soundManager.playSelect();
        this.currentLeaderboardTimeframe = 'all';
        this.lbTimeframeAll.classList.add('active');
        this.lbTimeframeSeason?.classList.remove('active');
        this.fetchAndRenderLeaderboard();
      });
    }

    if (this.lbTimeframeSeason) {
      this.lbTimeframeSeason.addEventListener('click', () => {
        if (this.currentLeaderboardTimeframe === 'season') return;
        soundManager.playSelect();
        this.currentLeaderboardTimeframe = 'season';
        this.lbTimeframeSeason.classList.add('active');
        this.lbTimeframeAll?.classList.remove('active');
        this.fetchAndRenderLeaderboard();
      });
    }

    // Telegram Auth Modal Event Listeners
    if (this.btnCloseTgAuth) {
      this.btnCloseTgAuth.addEventListener('click', () => {
        this.closeTgAuthModal();
      });
    }

    const btnCloseTgAuthX = document.getElementById('btn-close-tg-auth-x');
    if (btnCloseTgAuthX) {
      btnCloseTgAuthX.addEventListener('click', () => {
        this.closeTgAuthModal();
      });
    }

    const btnCloseWinX = document.getElementById('btn-close-win-x');
    if (btnCloseWinX) {
      btnCloseWinX.addEventListener('click', () => {
        this.winModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    }

    const btnCloseGameOverX = document.getElementById('btn-close-gameover-x');
    if (btnCloseGameOverX) {
      btnCloseGameOverX.addEventListener('click', () => {
        this.gameOverModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    }

    const btnCloseChallengeX = document.getElementById('btn-close-challenge-x');
    if (btnCloseChallengeX) {
      btnCloseChallengeX.addEventListener('click', () => {
        this.challengeModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    }

    const btnCloseStatsX = document.getElementById('btn-close-stats-x');
    if (btnCloseStatsX) {
      btnCloseStatsX.addEventListener('click', () => {
        this.statsModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    }

    const btnCloseAchX = document.getElementById('btn-close-achievements-x');
    if (btnCloseAchX) {
      btnCloseAchX.addEventListener('click', () => {
        this.achievementsModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    }

    const btnCloseSettingsX = document.getElementById('btn-close-settings-x');
    if (btnCloseSettingsX) {
      btnCloseSettingsX.addEventListener('click', () => {
        this.settingsModal.classList.add('hidden');
        this.updateScreenBackButton();
      });
    }

    // Modal background overlay click dismissal for ALL modals
    [
      this.winModal,
      this.gameOverModal,
      this.statsModal,
      this.achievementsModal,
      this.settingsModal,
      this.tgAuthModal,
      this.challengeModal,
      this.adModal
    ].forEach((modal) => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.add('hidden');
            if (modal === this.tgAuthModal) this.stopTgAuthPolling();
            this.updateScreenBackButton();
          }
        });
      }
    });

    // Telegram Bot CTA link handler with deep-link & Capacitor system browser support
    if (this.btnTgOpenBotLink) {
      this.btnTgOpenBotLink.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUrl = this.btnTgOpenBotLink.getAttribute('data-bot-url') ||
                          this.btnTgOpenBotLink.href ||
                          'https://t.me/sudoku_pulse_auth_bot';
        const cleanUrl = (targetUrl && targetUrl !== '#' && !targetUrl.endsWith('#'))
          ? targetUrl
          : 'https://t.me/sudoku_pulse_auth_bot';

        try {
          if ((window as any).Capacitor) {
            window.open(cleanUrl, '_system');
            return;
          }
        } catch {}

        const w = window.open(cleanUrl, '_blank');
        if (!w) {
          window.location.href = cleanUrl;
        }
      });
    }

    if (this.btnTgManualSync) {
      this.btnTgManualSync.addEventListener('click', async () => {
        soundManager.playSelect();
        haptics.light();
        await this.syncWithCloud(true);
      });
    }

    if (this.btnTgLogout) {
      this.btnTgLogout.addEventListener('click', () => {
        this.logoutTelegram();
      });
    }

    this.tgTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.selection();
        const tabKey = tab.getAttribute('data-tg-tab');
        this.tgTabs.forEach((t) => t.classList.toggle('active', t === tab));
        this.tgTabPanes.forEach((pane) => {
          const isMatch = pane.id === `tg-tab-content-${tabKey}`;
          pane.classList.toggle('hidden', !isMatch);
        });
        if (tabKey === 'widget') {
          this.mountTelegramWidget();
        }
      });
    });

    if (this.btnTgManualLogin) {
      this.btnTgManualLogin.addEventListener('click', async () => {
        soundManager.playSelect();
        haptics.light();
        const val = (this.tgManualInput?.value || '').trim();
        if (!val) {
          this.showToast('⚠️ Введите @username, Telegram ID или ключ');
          return;
        }
        await this.importSyncKey(val);
      });
    }

    // Mode Selection Back
    this.btnModesBack.addEventListener('click', () => {
      soundManager.playSelect();
      this.showScreen('menu');
    });

    // Mode Selection Cards
    this.modeCards.forEach((card) => {
      card.addEventListener('click', () => {
        soundManager.playSelect();
        this.modeCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedMode = card.getAttribute('data-mode') as GameMode;
        this.updateDifficultyPillsForMode();
      });
    });

    // Difficulty Pills
    this.diffPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        soundManager.playSelect();
        this.diffPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedDifficulty = pill.getAttribute('data-diff') as Difficulty;
      });
    });

    // Start Mode -> Go to Perk Selection
    this.btnStartSelectedMode.addEventListener('click', () => {
      soundManager.playSelect();
      this.renderPerkDraft();
      this.showScreen('perk_select');
    });

    // Perk Back
    this.btnPerksBack.addEventListener('click', () => {
      soundManager.playSelect();
      this.showScreen('mode_select');
    });

    // Game Screen Home Button
    this.btnGameHome.addEventListener('click', () => {
      soundManager.playSelect();
      if (this.game.status === 'completed' || this.game.status === 'gameover' || this.game.checkWin()) {
        try { localStorage.removeItem('sudoku_pulse_saved_game_v3'); } catch {}
      }
      this.showScreen('menu');
      this.updateDailyInfoOnMenu();
    });

    // Sound / Theme toggles
    this.soundToggleBtn.addEventListener('click', () => this.toggleSound());
    this.settingSoundBtn.addEventListener('click', () => this.toggleSound());

    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    this.settingThemeBtn.addEventListener('click', () => this.toggleTheme());
    this.themeSkinPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const skin = pill.getAttribute('data-skin') || 'dark';
        soundManager.playSelect();
        haptics.selection();
        this.setTheme(skin);
      });
    });

    this.boardSkinPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        soundManager.playSelect();
        const skinKey = pill.getAttribute('data-board-skin') || 'neon';
        const skinsReq: Record<string, { minScore: number; leagueName: string }> = {
          neon: { minScore: 0, leagueName: 'Бронзовая лига' },
          synthwave: { minScore: 10000, leagueName: 'Серебряная лига' },
          matrix: { minScore: 30000, leagueName: 'Золотая лига' },
          hologram: { minScore: 75000, leagueName: 'Платиновая лига' },
          obsidian: { minScore: 150000, leagueName: 'Лига Кибер-Мастер' },
        };
        const req = skinsReq[skinKey];
        const stats = SudokuGame.getPlayerStats();
        if (req && stats.totalScore < req.minScore) {
          const needed = (req.minScore - stats.totalScore).toLocaleString('ru-RU');
          this.showToast(`🔒 Стиль откроется в ${req.leagueName}! Нужно ещё ${needed} очков.`);
          haptics.error();
          return;
        }

        this.setBoardSkin(skinKey);
        haptics.selection();
        this.showToast(`🎨 Применён скин сетки!`);
      });
    });

    // Pause / Resume
    this.pauseBtn.addEventListener('click', () => this.game.togglePause());
    this.resumeBtn.addEventListener('click', () => this.game.togglePause());

    // Toolbar
    this.notesBtn.addEventListener('click', () => this.game.toggleNotesMode());
    this.btnAutoNotes.addEventListener('click', () => {
      const isNowActive = this.game.toggleAutoCandidates();
      soundManager.playSelect();
      haptics.light();
      if (isNowActive) {
        this.showToast('✨ Авто-заметки: кандидаты показаны');
      } else {
        this.showToast('🧹 Авто-заметки: кандидаты скрыты');
      }
    });
    this.undoBtn.addEventListener('click', () => this.game.undo());
    this.eraseBtn.addEventListener('click', () => this.game.eraseCell());

    this.hintBtn.addEventListener('click', () => {
      if (this.game.hintsRemaining > 0) {
        const explanation = this.game.giveHint();
        if (explanation) {
          this.showToast(explanation);
        }
      } else {
        this.showMockAd('🎁 Награда: +1 Подсказка', () => {
          this.game.addBonusHint();
          this.showToast('🎉 Получена дополнительная подсказка!');
        });
      }
    });

    this.newGameBtn.addEventListener('click', () => {
      this.game.startNewGame({
        difficulty: this.selectedDifficulty,
        mode: this.selectedMode,
        perks: this.game.activePerks,
      });
    });

    // Numpad clicks & Long-press for Pin Mode (~380ms)
    this.numpadButtons.forEach((btn, index) => {
      const num = index + 1;
      let pressTimer: number | undefined;
      let isLongPress = false;

      const startPress = () => {
        isLongPress = false;
        pressTimer = window.setTimeout(() => {
          isLongPress = true;
          this.game.togglePinNumber(num);
          soundManager.playSelect();
          haptics.fever();
          if (this.game.pinnedNumber === num) {
            this.showToast(`📌 Цифра ${num} зафиксирована для быстрого ввода!`);
          } else {
            this.showToast(`📌 Фиксация снята`);
          }
        }, 380);
      };

      const cancelPress = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = undefined;
        }
      };

      btn.addEventListener('pointerdown', startPress);
      btn.addEventListener('pointerup', () => {
        cancelPress();
      });
      btn.addEventListener('pointerleave', cancelPress);
      btn.addEventListener('pointercancel', cancelPress);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());

      btn.addEventListener('click', () => {
        if (!isLongPress) {
          this.game.inputNumber(num);
        }
      });
    });

    // Win Modal buttons
    this.playAgainBtn.addEventListener('click', () => {
      this.winModal.classList.add('hidden');
      this.stopConfetti();
      this.game.startNewGame({
        difficulty: this.selectedDifficulty,
        mode: this.selectedMode,
        perks: this.game.activePerks,
      });
      if (this.game.mode === 'ai_duel') {
        this.startAiBotDuel();
      }
    });

    this.btnWinMenu.addEventListener('click', () => {
      this.winModal.classList.add('hidden');
      this.stopConfetti();
      this.stopAiBotDuel();
      try { localStorage.removeItem('sudoku_pulse_saved_game_v3'); } catch {}
      this.showScreen('menu');
      this.updateDailyInfoOnMenu();
    });

    // Share result & Challenge friend buttons
    this.btnDailyShare.addEventListener('click', () => {
      this.shareResultToTelegram();
    });

    this.btnChallengeShare.addEventListener('click', () => {
      this.shareChallengeToTelegram();
    });

    // Cloud Sync & Device Linking
    if (this.btnSyncTgAuth) {
      this.btnSyncTgAuth.addEventListener('click', () => {
        soundManager.playSelect();
        this.settingsModal.classList.add('hidden');
        this.openTgAuthModal();
      });
    }

    if (this.btnSyncCopyKey) {
      this.btnSyncCopyKey.addEventListener('click', () => {
        soundManager.playSelect();
        const key = this.getSyncKey();
        navigator.clipboard.writeText(key).then(() => {
          this.showToast(`📋 Ключ скопирован в буфер: ${key}`);
        }).catch(() => {
          this.showToast(`Ключ: ${key}`);
        });
      });
    }

    const savedNotify = localStorage.getItem('sudoku_notifications_enabled');
    this.notificationsEnabled = savedNotify !== null ? savedNotify === 'true' : true;
    this.updateNotifyButton(this.notificationsEnabled);

    if (this.settingNotifyBtn) {
      this.settingNotifyBtn.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.selection();
        this.notificationsEnabled = !this.notificationsEnabled;
        localStorage.setItem('sudoku_notifications_enabled', this.notificationsEnabled.toString());
        this.updateNotifyButton(this.notificationsEnabled);
        this.syncWithCloud(false);
        if (this.notificationsEnabled) {
          this.showToast('🔔 Утренние напоминания Daily Pulse в Telegram включены');
        } else {
          this.showToast('🔕 Напоминания в Telegram отключены');
        }
      });
    }

    if (this.btnChallengeAccept) {
      this.btnChallengeAccept.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.light();
        if (this.activeChallenge) {
          this.challengeModal.classList.add('hidden');
          this.selectedDifficulty = this.activeChallenge.diff;
          this.selectedMode = this.activeChallenge.mode;
          this.game.startNewGame({
            difficulty: this.activeChallenge.diff,
            mode: this.activeChallenge.mode,
            seed: this.activeChallenge.seed,
          });
          this.showScreen('game');
          this.showToast(`⚔️ Дуэль с ${this.activeChallenge.challenger} началась! Побивайте рекорд!`);
        }
      });
    }

    if (this.btnChallengeDecline) {
      this.btnChallengeDecline.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.light();
        this.challengeModal.classList.add('hidden');
        this.activeChallenge = undefined;
        this.showScreen('menu');
      });
    }

    if (this.btnSyncImport) {
      this.btnSyncImport.addEventListener('click', async () => {
        soundManager.playSelect();
        const key = (this.syncKeyInput?.value || '').trim();
        if (!key) {
          this.showToast('⚠️ Введите ключ синхронизации');
          return;
        }
        await this.importSyncKey(key);
      });
    }

    if (this.btnSyncCloud) {
      this.btnSyncCloud.addEventListener('click', async () => {
        soundManager.playSelect();
        await this.syncWithCloud(true);
      });
    }

    this.playerNameInput.addEventListener('change', async () => {
      const name = this.playerNameInput.value.trim() || 'CyberPlayer';
      this.playerNameInput.value = name;
      localStorage.setItem('sudoku_player_name', name);
      this.showToast(`✅ Никнейм сохранён: ${name}`);
      try {
        const playerId = SudokuGame.getOrCreatePlayerId();
        const apiBase = `${getApiBaseUrl()}/leaderboard`;
        await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, name, action: 'rename' }),
        });
        this.fetchAndRenderLeaderboard();
      } catch {}
    });

    // Game Over buttons
    this.secondChanceBtn.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.showMockAd('❤️ Второй шанс: +1 Жизнь', () => {
        soundManager.stopFeverTrack();
        this.game.reviveSecondChance();
        this.showToast('❤️ Вы получили второй шанс!');
      });
    });

    this.restartGameOverBtn.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.game.startNewGame({
        difficulty: this.selectedDifficulty,
        mode: this.selectedMode,
        perks: this.game.activePerks,
      });
      if (this.game.mode === 'ai_duel') {
        this.startAiBotDuel();
      }
    });

    this.btnGameOverMenu.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.stopAiBotDuel();
      try { localStorage.removeItem('sudoku_pulse_saved_game_v3'); } catch {}
      this.showScreen('menu');
      this.updateDailyInfoOnMenu();
    });

    // Keyboard support
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.currentScreen !== 'game') return;
      if (this.game.status === 'completed' || this.game.status === 'gameover') return;

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        this.game.inputNumber(num);
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        this.handleArrowKey(e.key);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.game.eraseCell();
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        this.game.toggleNotesMode();
        return;
      }

      if (e.key.toLowerCase() === 'a') {
        this.btnAutoNotes.click();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.game.undo();
        return;
      }

      if (e.key.toLowerCase() === 'h') {
        this.hintBtn.click();
        return;
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        this.game.togglePause();
        return;
      }
    });
  }

  private updateDifficultyPillsForMode() {
    const labels: Record<Difficulty, { normal: string; fog: string; ai: string }> = {
      easy: { normal: 'Легкий', fog: 'Легкий (5 🗼)', ai: '🟢 PulseBot v1' },
      medium: { normal: 'Средний', fog: 'Средний (3 🗼)', ai: '🟡 CyberPulse v2' },
      hard: { normal: 'Сложный', fog: 'Сложный (1 🗼)', ai: '🔴 NeuralPulse v3' },
      expert: { normal: 'Эксперт', fog: 'Эксперт (0 🗼)', ai: '🔥 QuantumPulse v4' },
    };
    this.diffPills.forEach((pill) => {
      const diff = (pill.getAttribute('data-diff') as Difficulty) || 'medium';
      const entry = labels[diff];
      if (entry) {
        pill.textContent = this.selectedMode === 'fog' ? entry.fog : this.selectedMode === 'ai_duel' ? entry.ai : entry.normal;
      }
    });
  }

  private renderPerkDraft() {
    this.perksListContainer.innerHTML = '';
    const perks = getRandomPerks(3);

    perks.forEach((perk) => {
      const card = document.createElement('div');
      card.className = 'perk-card';
      card.innerHTML = `
        <div class="perk-icon-lg">${perk.icon}</div>
        <div class="perk-info">
          <div class="perk-title">${perk.name}</div>
          <div class="perk-desc">${perk.description}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        soundManager.playCorrect(3);
        // Start game with selected perk!
        this.game.startNewGame({
          difficulty: this.selectedDifficulty,
          mode: this.selectedMode,
          perks: [perk],
        });
        this.showScreen('game');
        if (this.game.mode === 'ai_duel') {
          this.startAiBotDuel();
          const botNames: Record<Difficulty, string> = {
            easy: 'PulseBot v1 (Новичок)',
            medium: 'CyberPulse v2 (Профи)',
            hard: 'NeuralPulse v3 (Гроссмейстер)',
            expert: 'QuantumPulse v4 (Сверхразум)',
          };
          this.showToast(`🤖 Дуэль началась против ${botNames[this.game.difficulty] || 'PulseBot'}!`);
        }
        if (this.game.isFogActive()) {
          const beaconsMap: Record<Difficulty, number> = { easy: 5, medium: 3, hard: 1, expert: 0 };
          const bCount = beaconsMap[this.game.difficulty];
          if (bCount === 0) {
            this.showToast('🌌 Тёмный сектор (Эксперт): 0 маяков! Сканируйте поле курсором (эхо 3 сек).');
          } else {
            this.showToast(`🌌 Тёмный сектор: стартовых маяков — ${bCount}. Эхо-след сканера: 3 сек!`);
          }
        }
      });

      this.perksListContainer.appendChild(card);
    });
  }

  private toggleSound() {
    const isEnabled = soundManager.toggle();
    this.updateSoundButtons(isEnabled);
    if (isEnabled) soundManager.playSelect();
  }

  private updateSoundButtons(enabled: boolean) {
    this.soundToggleBtn.textContent = enabled ? '🔊' : '🔇';
    this.settingSoundBtn.textContent = enabled ? 'Вкл' : 'Выкл';
    this.settingSoundBtn.classList.toggle('active', enabled);
  }

  private setTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sudoku_theme', theme);
    this.updateThemeButtons(theme);
  }

  private toggleTheme() {
    const skins = ['dark', 'synthwave', 'matrix', 'oled', 'light'];
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const idx = skins.indexOf(current);
    const next = skins[(idx + 1) % skins.length];
    this.setTheme(next);
  }

  private updateThemeButtons(theme: string) {
    const labels: Record<string, { icon: string; name: string }> = {
      dark: { icon: '⚡', name: 'Cyber Neon' },
      synthwave: { icon: '🌆', name: 'Synthwave 80s' },
      matrix: { icon: '🟢', name: 'Matrix Cyber' },
      oled: { icon: '🌑', name: 'OLED Black' },
      light: { icon: '☀️', name: 'Светлая' },
    };
    const info = labels[theme] || labels.dark;
    this.themeToggleBtn.textContent = info.icon;
    this.settingThemeBtn.textContent = `${info.icon} ${info.name}`;
    this.themeSkinPills.forEach((pill) => {
      pill.classList.toggle('active', pill.getAttribute('data-skin') === theme);
    });
  }

  private handleArrowKey(key: string) {
    let r = this.game.selectedCell?.row ?? 4;
    let c = this.game.selectedCell?.col ?? 4;

    switch (key) {
      case 'ArrowUp': r = Math.max(0, r - 1); break;
      case 'ArrowDown': r = Math.min(8, r + 1); break;
      case 'ArrowLeft': c = Math.max(0, c - 1); break;
      case 'ArrowRight': c = Math.min(8, c + 1); break;
    }

    this.game.selectCell(r, c);
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      this.game.tickTimer();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private updateDailyInfoOnMenu() {
    const today = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    this.menuDailyDate.textContent = `Вызов на сегодня: ${today}`;

    const stats = SudokuGame.getPlayerStats();
    evaluateAllAchievements(stats);
    SudokuGame.savePlayerStats(stats);
    this.menuDailyStreak.textContent = `🔥 ${stats.dailyStreak} дн.`;

    // Unlocked achievements counter (robust synchronization)
    const unlockedIds = new Set(stats.unlockedAchievements || []);
    ACHIEVEMENTS.forEach(ach => {
      if (ach.checkUnlocked(stats)) unlockedIds.add(ach.id);
    });
    if (this.menuAchCounter) {
      this.menuAchCounter.textContent = `${unlockedIds.size}/${ACHIEVEMENTS.length}`;
    }

    // Continue game button in Main Menu
    if (this.btnMenuContinue) {
      const hasSave = SudokuGame.hasSavedGame();
      this.btnMenuContinue.classList.toggle('hidden', !hasSave);
      if (hasSave && this.menuContinueMeta) {
        try {
          const raw = localStorage.getItem('sudoku_pulse_saved_game_v3');
          if (raw) {
            const data = JSON.parse(raw);
            const mLabels: Record<string, string> = {
              classic: 'Классика',
              fog: 'Тёмный сектор',
              daily: 'Daily Pulse',
              run: `Забег (Этап ${data.runStage || 1})`,
              ai_duel: 'Pulse AI Дуэль',
            };
            const dLabels: Record<string, string> = {
              easy: 'Легкий',
              medium: 'Средний',
              hard: 'Сложный',
              expert: 'Эксперт',
            };
            const mins = Math.floor((data.timerSeconds || 0) / 60);
            const secs = (data.timerSeconds || 0) % 60;
            const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            this.menuContinueMeta.textContent = `${mLabels[data.mode] || 'Игра'} • ${dLabels[data.difficulty] || ''} • ${timeStr}`;
          }
        } catch {}
      }
    }

    this.updateLeagueViews();
  }

  public render() {
    if (this.currentScreen !== 'game') return;

    this.renderHeaderAndStatus();
    this.renderPulseBar();
    this.renderBoard();
    this.renderToolbar();
    this.renderNumpad();
    this.updateAiDuelHud();
  }

  private renderHeaderAndStatus() {
    // Mode badge
    const modeNames: Record<GameMode, string> = {
      classic: '⚡ Классика',
      fog: '🌌 Тёмный сектор',
      daily: '📅 Daily Pulse',
      run: `🚀 Забег (Этап ${this.game.runStage})`,
      ai_duel: '🤖 AI Дуэль',
    };
    this.gameModeBadge.textContent = modeNames[this.game.mode];

    // Perk badge
    if (this.game.activePerks.length > 0) {
      if (this.game.activePerks.length === 1) {
        const perk = this.game.activePerks[0];
        const lvlStr = (perk.level && perk.level > 1) ? ` ${formatRomanLevel(perk.level)}` : '';
        this.gamePerkBadge.textContent = `${perk.icon} ${perk.name}${lvlStr}`;
      } else {
        const icons = this.game.activePerks.map((p) => {
          const lvl = p.level && p.level > 1 ? formatRomanLevel(p.level) : '';
          return `${p.icon}${lvl ? ` ${lvl}` : ''}`;
        }).join(' ');
        this.gamePerkBadge.textContent = `${icons} (${this.game.activePerks.length})`;
      }
      this.gamePerkBadge.title = this.game.activePerks.map((p) => {
        const lvlStr = (p.level && p.level > 1) ? ` (${formatRomanLevel(p.level)})` : '';
        return `${p.icon} ${p.name}${lvlStr}: ${p.description}`;
      }).join('\n');
      this.gamePerkBadge.classList.remove('hidden');
    } else {
      this.gamePerkBadge.classList.add('hidden');
    }

    // Score
    this.scoreCounter.textContent = this.game.score.toLocaleString('ru-RU');

    // Timer
    const mins = Math.floor(this.game.timerSeconds / 60);
    const secs = this.game.timerSeconds % 60;
    this.timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Mistakes
    this.mistakesElement.textContent = `${this.game.mistakesCount}/${this.game.maxMistakes}`;

    // Pause state
    if (this.game.status === 'paused') {
      this.pauseOverlay.classList.remove('hidden');
      this.pauseBtn.textContent = '▶';
      soundManager.stopFeverTrack();
    } else {
      this.pauseOverlay.classList.add('hidden');
      this.pauseBtn.textContent = '⏸';
    }
  }

  private renderPulseBar() {
    this.pulseFill.style.width = `${this.game.pulseEnergy}%`;

    if (this.game.isFeverMode && this.game.status === 'playing') {
      this.comboBadge.textContent = `🔥 FEVER OVERDRIVE! 10x`;
      this.comboBadge.className = 'combo-badge fever';
      this.pulseFill.classList.add('fever');
      this.pulseStatusText.textContent = `Осталось: ${this.game.feverSecondsLeft} сек!`;
    } else {
      soundManager.stopFeverTrack();
      this.comboBadge.className = 'combo-badge';
      this.pulseFill.classList.remove('fever');

      if (this.game.comboCount >= 2) {
        this.comboBadge.textContent = `🔥 x${this.game.comboMultiplier.toFixed(1)} COMBO (${this.game.comboCount})`;
        this.pulseStatusText.textContent = `Удерживайте комбо-ритм!`;
      } else {
        this.comboBadge.textContent = `⚡ PULSE x${this.game.comboMultiplier.toFixed(1)}`;
        this.pulseStatusText.textContent = this.game.comboMultiplier > 1.0
          ? `Ускоритель активен: множитель x${this.game.comboMultiplier.toFixed(1)}!`
          : `Решайте быстро для комбо!`;
      }
    }
  }

  private renderBoard() {
    this.boardElement.innerHTML = '';

    const selected = this.game.selectedCell;
    const selectedValue =
      selected && !this.game.board[selected.row][selected.col].isInFog
        ? this.game.board[selected.row][selected.col].value
        : 0;
    const selectedBoxRow = selected ? Math.floor(selected.row / 3) : -1;
    const selectedBoxCol = selected ? Math.floor(selected.col / 3) : -1;
    const now = Date.now();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellData = this.game.board[r][c];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.dataset.row = r.toString();
        cellDiv.dataset.col = c.toString();

        // Dark Sector (Fog, Torch, 3s Echo, and Beacons)
        if (cellData.isInFog) {
          cellDiv.classList.add('in-fog');
        }
        if (cellData.isInTorch) {
          cellDiv.classList.add('in-torch');
        }
        if (cellData.isInEcho) {
          cellDiv.classList.add('in-echo');
          const echoLeftMs = Math.max(0, (cellData.torchExpireAt || 0) - now);
          const elapsedMs = Math.min(2950, Math.max(0, 3000 - echoLeftMs));
          cellDiv.style.animationDelay = `-${elapsedMs}ms`;
        }
        if (cellData.isBeacon && this.game.isFogActive()) {
          cellDiv.classList.add('beacon');
        }

        // Energy Surge Cell (⚡ Вспышка)
        if (cellData.isSurge && cellData.value === 0 && !cellData.isInFog) {
          cellDiv.classList.add('surge-cell');
        }

        const isSelected = selected && selected.row === r && selected.col === c;
        const inSameBox = Math.floor(r / 3) === selectedBoxRow && Math.floor(c / 3) === selectedBoxCol;
        const inSameLine = selected && (selected.row === r || selected.col === c);
        const hasSameValue = selectedValue > 0 && !cellData.isInFog && cellData.value === selectedValue;

        if (isSelected) {
          cellDiv.classList.add('selected');
        } else if (hasSameValue) {
          cellDiv.classList.add('highlight-same');
        } else if (inSameLine || inSameBox) {
          cellDiv.classList.add('highlight-area');
        }

        if (cellData.isError) {
          cellDiv.classList.add('error');
        } else if (cellData.isConflictPeer && !cellData.isInFog) {
          cellDiv.classList.add('conflict-peer');
        }

        if (cellData.isGiven) {
          cellDiv.classList.add('given');
        } else if (cellData.isLocked) {
          cellDiv.classList.add('locked');
        } else {
          cellDiv.classList.add('user-value');
        }

        if (cellData.value > 0 && !cellData.isInFog) {
          const digitSpan = document.createElement('span');
          digitSpan.className = 'cell-digit';
          digitSpan.textContent = cellData.value.toString();

          if (cellData.isError) {
            digitSpan.classList.add('shake');
          }

          cellDiv.appendChild(digitSpan);
        } else if (cellData.value === 0 && cellData.notes.size > 0) {
          const notesGrid = document.createElement('div');
          notesGrid.className = 'notes-grid';
          for (let n = 1; n <= 9; n++) {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.textContent = cellData.notes.has(n) ? n.toString() : '';
            notesGrid.appendChild(noteItem);
          }
          cellDiv.appendChild(notesGrid);
        }

        cellDiv.addEventListener('click', () => {
          this.game.selectCell(r, c);
        });

        this.boardElement.appendChild(cellDiv);
      }
    }
  }

  private renderToolbar() {
    this.notesBtn.classList.toggle('active', this.game.isNotesMode);
    this.btnAutoNotes.classList.toggle('active', this.game.isAutoNotesActive);

    if (this.game.hintsRemaining > 0) {
      this.hintBtnLabel.textContent = 'Подсказка';
      this.hintCounterBadge.textContent = this.game.hintsRemaining.toString();
      this.hintCounterBadge.className = 'badge-counter';
    } else {
      this.hintBtnLabel.textContent = '+1 Подсказка';
      this.hintCounterBadge.textContent = '🎬';
      this.hintCounterBadge.className = 'badge-counter ad-badge';
    }

    this.undoBtn.disabled = this.game.history.length === 0;

    const selected = this.game.selectedCell;
    if (selected) {
      const cell = this.game.board[selected.row][selected.col];
      this.eraseBtn.disabled = cell.isGiven || cell.isLocked || (cell.value === 0 && cell.notes.size === 0);
    } else {
      this.eraseBtn.disabled = true;
    }
  }

  private renderNumpad() {
    const counts = this.game.getNumberCounts();
    for (let i = 1; i <= 9; i++) {
      const btn = this.numpadButtons[i - 1];
      if (!btn) continue;
      const count = counts[i] || 0;
      const remaining = 9 - count;

      const remainElem = btn.querySelector('.num-remain');
      if (remainElem) {
        remainElem.textContent = remaining > 0 ? remaining.toString() : '✓';
      }

      btn.classList.toggle('completed', remaining <= 0);
      btn.classList.toggle('pinned', this.game.pinnedNumber === i && remaining > 0);
    }
  }

  private triggerLineWave(cells: Array<[number, number]>) {
    cells.forEach(([r, c]) => {
      const cellElem = this.boardElement.querySelector(
        `.cell[data-row="${r}"][data-col="${c}"]`
      );
      if (cellElem) {
        cellElem.classList.remove('line-wave');
        void (cellElem as HTMLElement).offsetWidth;
        cellElem.classList.add('line-wave');
        setTimeout(() => {
          cellElem.classList.remove('line-wave');
        }, 900);
      }
    });
  }

  private updateNotifyButton(enabled: boolean) {
    if (!this.settingNotifyBtn) return;
    this.settingNotifyBtn.textContent = enabled ? 'Вкл' : 'Выкл';
    this.settingNotifyBtn.classList.toggle('active', enabled);
  }

  private showWinModal(stats: GameStats) {
    const mins = Math.floor(stats.timeSeconds / 60);
    const secs = stats.timeSeconds % 60;
    this.modalTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.modalScore.textContent = stats.score.toLocaleString('ru-RU');
    this.modalCombo.textContent = `x${stats.maxCombo}`;
    this.modalMistakes.textContent = `${stats.mistakes}/${this.game.maxMistakes}`;

    const modeLabels: Record<GameMode, string> = {
      classic: 'Классический',
      fog: 'Тёмный сектор',
      daily: 'Daily Pulse',
      run: `Pulse Run (Этап ${this.game.runStage})`,
      ai_duel: 'Pulse AI Дуэль',
    };
    this.modalMode.textContent = modeLabels[stats.mode];

    const diffLabels: Record<Difficulty, string> = {
      easy: 'Легкий',
      medium: 'Средний',
      hard: 'Сложный',
      expert: 'Эксперт',
    };
    if (this.modalDiff) {
      this.modalDiff.textContent = diffLabels[stats.difficulty] || 'Средний';
    }

    this.stopAiBotDuel();

    // AI Duel Victory Comparison
    if (stats.mode === 'ai_duel' && this.duelResultBanner) {
      this.duelResultBanner.classList.remove('hidden');
      const botName = `🤖 ${this.aiBotProgress.name}`;
      const botScore = this.aiBotProgress.score || Math.floor(stats.score * 0.8);
      const duelRecord: DuelRecord = {
        id: 'duel_' + Date.now(),
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        challenger: botName,
        won: true,
        myScore: stats.score,
        myTime: stats.timeSeconds,
        targetScore: botScore,
        targetTime: Math.floor(stats.timeSeconds * 1.25),
        diff: stats.difficulty,
        mode: stats.mode,
      };
      this.addDuelRecord(duelRecord);

      if (this.duelResultTitle) {
        this.duelResultTitle.textContent = '🎉 ВЫ ПОБЕДИЛИ В ИИ-ДУЭЛИ!';
        this.duelResultTitle.style.color = '#34d399';
      }
      if (this.duelResultText) {
        const scoreDiff = stats.score - botScore;
        this.duelResultText.textContent = `Вы опередили ${botName} и решили сетку быстрее! Преимущество: +${Math.max(0, scoreDiff).toLocaleString('ru-RU')} очков.`;
      }
    } else if (this.activeChallenge && this.duelResultBanner) {
      this.duelResultBanner.classList.remove('hidden');
      const targetScore = this.activeChallenge.targetScore;
      const targetTime = this.activeChallenge.targetTime;
      const challenger = this.activeChallenge.challenger;
      const wonDuel = stats.score > targetScore || (stats.score === targetScore && stats.timeSeconds <= targetTime);

      const duelRecord: DuelRecord = {
        id: 'duel_' + Date.now(),
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        challenger,
        won: wonDuel,
        myScore: stats.score,
        myTime: stats.timeSeconds,
        targetScore,
        targetTime,
        diff: stats.difficulty,
        mode: stats.mode,
      };
      this.addDuelRecord(duelRecord);

      if (wonDuel) {
        if (this.duelResultTitle) {
          this.duelResultTitle.textContent = '🎉 ВЫ ПОБЕДИЛИ В ДУЭЛИ!';
          this.duelResultTitle.style.color = '#34d399';
        }
        if (this.duelResultText) {
          const scoreDiff = stats.score - targetScore;
          this.duelResultText.textContent = `Ваш результат (${stats.score.toLocaleString('ru-RU')}) превзошёл рекорд ${challenger} (+${scoreDiff.toLocaleString('ru-RU')} очков)!`;
        }
      } else {
        if (this.duelResultTitle) {
          this.duelResultTitle.textContent = '⚔️ Дуэль завершена';
          this.duelResultTitle.style.color = '#f59e0b';
        }
        if (this.duelResultText) {
          this.duelResultText.textContent = `Рекорд ${challenger}: ${targetScore.toLocaleString('ru-RU')} очков. Попробуйте еще раз!`;
        }
      }
    } else if (this.duelResultBanner) {
      this.duelResultBanner.classList.add('hidden');
    }

    if (stats.mode === 'run') {
      const nextStage = this.game.runStage + 1;
      const stageBonus = 1500 * this.game.runStage;
      this.modalWinTitle.textContent = `🚀 Этап ${this.game.runStage} пройден!`;
      this.modalSubtitle.textContent = `Бонус за этап: +${stageBonus.toLocaleString('ru-RU')} очков! Выберите новый перк:`;
      this.nextStageNum.textContent = nextStage.toString();
      this.runStageUpgrade.classList.remove('hidden');
      this.playAgainBtn.classList.add('hidden');

      this.runPerksDraft.innerHTML = '';
      const drafted = getRandomPerks(3, this.game.activePerks);
      drafted.forEach((perk) => {
        const card = document.createElement('div');
        card.className = 'perk-card';
        card.style.padding = '10px 12px';
        const lvlStr = (perk.level && perk.level > 1) ? ` (${formatRomanLevel(perk.level)})` : '';
        card.innerHTML = `
          <div class="perk-icon-lg" style="font-size:1.5rem;">${perk.icon}</div>
          <div class="perk-info">
            <div class="perk-title" style="font-size:0.95rem;">${perk.name}${lvlStr}</div>
            <div class="perk-desc" style="font-size:0.8rem;">${perk.description}</div>
          </div>
        `;
        card.addEventListener('click', () => {
          this.winModal.classList.add('hidden');
          this.stopConfetti();
          soundManager.playCorrect(3);
          this.game.advanceRunStage(perk);
          this.showToast(`🚀 Этап ${this.game.runStage}: ${this.game.getRunModifierDescription()}`);
        });
        this.runPerksDraft.appendChild(card);
      });
    } else {
      this.modalWinTitle.textContent = 'Победа!';
      this.modalSubtitle.textContent = 'Головоломка успешно решена!';
      this.runStageUpgrade.classList.add('hidden');
      this.playAgainBtn.classList.remove('hidden');
    }

    this.winModal.classList.remove('hidden');
    this.startConfetti();
    this.updateDailyInfoOnMenu();
    this.submitScoreToLeaderboard(stats);
    // Background cloud sync on win
    this.syncWithCloud(false).catch(() => {});
  }

  private checkUrlChallenge(): boolean {
    const params = new URLSearchParams(window.location.search);
    const tgApp = (window as any).Telegram?.WebApp;
    const tgStartParam = tgApp?.initDataUnsafe?.start_param;
    const rawParam = tgStartParam || params.get('start_param') || params.get('startapp') || params.get('tgWebAppStartParam') || params.get('challenge');

    if (rawParam === 'daily' || params.get('mode') === 'daily') {
      setTimeout(() => {
        this.game.startNewGame({ difficulty: 'medium', mode: 'daily', perks: [] });
        this.showScreen('game');
        this.showToast('📅 Daily Pulse дня запущен!');
      }, 100);
      return true;
    }

    let seed: number | undefined;
    let diff: Difficulty = 'medium';
    let mode: GameMode = 'classic';
    let targetScore = 0;
    let targetTime = 0;
    let challenger = 'Друг';

    if (rawParam && (rawParam.startsWith('c_') || rawParam.startsWith('challenge_'))) {
      const parts = rawParam.replace(/^(c_|challenge_)/, '').split('_');
      seed = parseInt(parts[0], 10);
      const validDiffs: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
      if (parts[1] && validDiffs.includes(parts[1] as Difficulty)) {
        diff = parts[1] as Difficulty;
      }
      if (parts[2] && ['classic', 'fog', 'daily', 'run'].includes(parts[2])) {
        mode = parts[2] as GameMode;
      }
      targetScore = parseInt(parts[3] || '0', 10) || 0;
      targetTime = parseInt(parts[4] || '0', 10) || 0;
      if (parts[5]) {
        try { challenger = decodeURIComponent(parts[5]); } catch {}
      }
    } else if (params.get('seed')) {
      seed = parseInt(params.get('seed')!, 10);
      const diffParam = (params.get('diff') as Difficulty) || 'medium';
      const modeParam = (params.get('mode') as GameMode) || 'classic';
      const validDiffs: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
      diff = validDiffs.includes(diffParam) ? diffParam : 'medium';
      mode = ['classic', 'fog', 'daily', 'run'].includes(modeParam) ? modeParam : 'classic';
      targetScore = parseInt(params.get('score') || '0', 10) || 0;
      targetTime = parseInt(params.get('time') || '0', 10) || 0;
      challenger = params.get('challenger') || 'Друг';
    }

    if (!seed || isNaN(seed)) return false;

    this.activeChallenge = { seed, diff, mode, targetScore, targetTime, challenger };

    // Format target time
    const tMins = Math.floor(targetTime / 60);
    const tSecs = targetTime % 60;
    const timeStr = targetTime > 0 ? `${tMins.toString().padStart(2, '0')}:${tSecs.toString().padStart(2, '0')}` : '—';

    const diffLabels: Record<Difficulty, string> = {
      easy: 'Легкий',
      medium: 'Средний',
      hard: 'Сложный',
      expert: 'Эксперт',
    };
    const modeLabels: Record<GameMode, string> = {
      classic: 'Классический',
      fog: 'Тёмный сектор',
      daily: 'Daily Pulse',
      run: 'Pulse Run',
      ai_duel: 'Pulse AI Дуэль',
    };

    if (this.challengeChallengerName) this.challengeChallengerName.textContent = challenger;
    if (this.challengeDiff) this.challengeDiff.textContent = diffLabels[diff] || 'Средний';
    if (this.challengeMode) this.challengeMode.textContent = modeLabels[mode] || 'Классика';
    if (this.challengeTargetScore) this.challengeTargetScore.textContent = targetScore > 0 ? targetScore.toLocaleString('ru-RU') : '—';
    if (this.challengeTargetTime) this.challengeTargetTime.textContent = timeStr;

    // Clean URL params quietly
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    // Show challenge invitation modal
    this.showScreen('menu');
    this.challengeModal.classList.remove('hidden');
    haptics.fever();
    soundManager.playSelect();

    return true;
  }

  private async submitScoreToLeaderboard(stats: GameStats) {
    try {
      const playerId = SudokuGame.getOrCreatePlayerId();
      const playerName = (localStorage.getItem('sudoku_player_name') || this.playerNameInput?.value || 'Игрок').trim() || 'Игрок';
      const apiBase = `${getApiBaseUrl()}/leaderboard`;
      await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          name: playerName,
          score: stats.score,
          mode: stats.mode,
          difficulty: stats.difficulty,
          timeSeconds: stats.timeSeconds,
          combo: stats.maxCombo,
          runStage: stats.runStage || 1,
        }),
      });
    } catch {
      // Offline or local dev server without /api/leaderboard — silently ignore
    }
  }

  private async fetchAndRenderLeaderboard() {
    if (!this.leaderboardList) return;
    this.leaderboardList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">Загрузка онлайн-рекордов...</div>`;
    try {
      const apiBase = `${getApiBaseUrl()}/leaderboard`;
      const url = `${apiBase}?period=${this.currentLeaderboardTimeframe}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      this.cachedLeaderboardEntries = data.entries || data.leaderboard || [];
      this.currentSeasonId = data.seasonId || data.currentSeason || '';
      this.renderLeaderboardList();
    } catch {
      this.leaderboardList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">Онлайн-сервер недоступен (офлайн-режим)</div>`;
    }
  }

  private renderLeaderboardList() {
    if (!this.leaderboardList) return;
    const myPlayerId = SudokuGame.getOrCreatePlayerId();
    let entries = this.cachedLeaderboardEntries;

    if (this.currentLeaderboardModeFilter !== 'all') {
      entries = entries.filter((e) => e.mode === this.currentLeaderboardModeFilter);
    }

    let seasonHeader = '';
    if (this.currentLeaderboardTimeframe === 'season' && this.currentSeasonId) {
      const parts = this.currentSeasonId.split('-W');
      const weekLabel = parts.length === 2 ? `Неделя ${parts[1]}, ${parts[0]}` : this.currentSeasonId;
      seasonHeader = `
        <div style="font-size:0.75rem; color:var(--accent); font-weight:600; text-align:center; margin-bottom:8px; padding:4px 8px; background:rgba(99,102,241,0.12); border-radius:6px; border:1px solid rgba(99,102,241,0.25);">
          ⏳ Текущий сезон: ${weekLabel}
        </div>
      `;
    }

    if (entries.length === 0) {
      this.leaderboardList.innerHTML = seasonHeader + `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">Пока нет записей в этом режиме.</div>`;
      return;
    }

    this.leaderboardList.innerHTML = seasonHeader + entries.slice(0, 15).map((item, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
      const badge = item.mode === 'run' ? `🚀 Эт.${item.runStage || 1}` : item.mode === 'daily' ? '📅 Daily' : item.mode === 'fog' ? '🌌 Сектор' : item.mode === 'ai_duel' ? '🤖 Дуэль' : '⚡ Классика';
      const isMe = item.playerId && item.playerId === myPlayerId;
      const rowBg = isMe ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255,255,255,0.03)';
      const rowBorder = isMe ? 'var(--primary)' : 'var(--border-subtle)';
      const league = getLeagueForScore(item.score);
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-radius:8px; background:${rowBg}; border:1px solid ${rowBorder}; font-size:0.85rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:700; min-width:24px;">${medal}</span>
            <span title="Лига: ${league.name}" style="font-size:0.9rem;">${league.icon}</span>
            <span style="font-weight:600; color:var(--text-main);">${item.name.replace(/</g, '&lt;')}${isMe ? ' <span style="color:var(--accent); font-size:0.75rem;">(Вы)</span>' : ''}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">${badge}</span>
          </div>
          <span style="font-weight:700; color:var(--accent);">${Number(item.score).toLocaleString('ru-RU')}</span>
        </div>
      `;
    }).join('');
  }

  private showAchievementsModal() {
    const stats = SudokuGame.getPlayerStats();
    evaluateAllAchievements(stats);
    SudokuGame.savePlayerStats(stats);

    const unlockedIds = new Set(stats.unlockedAchievements || []);
    ACHIEVEMENTS.forEach((ach) => {
      if (ach.checkUnlocked(stats)) unlockedIds.add(ach.id);
    });

    this.achievementsSubtitle.textContent = `Открыто ${unlockedIds.size} из ${ACHIEVEMENTS.length} трофеев`;
    if (this.menuAchCounter) {
      this.menuAchCounter.textContent = `${unlockedIds.size}/${ACHIEVEMENTS.length}`;
    }
    this.achievementsList.innerHTML = '';

    ACHIEVEMENTS.forEach((ach) => {
      const isUnlocked = unlockedIds.has(ach.id) || ach.checkUnlocked(stats);
      const { current, target } = ach.getProgress(stats);
      const progress = isUnlocked ? 100 : Math.min(100, Math.round((current / target) * 100));
      const card = document.createElement('div');
      card.className = `ach-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-title-row">
            <span class="ach-title">${ach.title}</span>
            <span class="ach-status-badge">${isUnlocked ? '✅ Получено' : `${current}/${target}`}</span>
          </div>
          <div class="ach-desc">${ach.description}</div>
          <div class="ach-progress-track">
            <div class="ach-progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
      `;
      this.achievementsList.appendChild(card);
    });

    this.achievementsModal.classList.remove('hidden');
  }

  private getStoredTelegramUser(): TelegramUser | null {
    const fromTgApp = haptics.getTelegramUser();
    if (fromTgApp) return fromTgApp;
    try {
      const raw = localStorage.getItem('sudoku_telegram_user');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  private updateTgMenuPill() {
    if (!this.btnMenuTgAuth || !this.menuTgAuthLabel) return;
    const tgUser = this.getStoredTelegramUser();
    if (tgUser) {
      const name = tgUser.username ? `@${tgUser.username}` : (tgUser.first_name || `TG #${tgUser.id}`);
      this.menuTgAuthLabel.textContent = name;
      this.btnMenuTgAuth.style.borderColor = '#34d399';
      this.btnMenuTgAuth.style.color = '#34d399';
      this.btnMenuTgAuth.style.background = 'rgba(52, 211, 153, 0.12)';
    } else {
      this.menuTgAuthLabel.textContent = 'Войти через Telegram';
      this.btnMenuTgAuth.style.borderColor = 'rgba(14, 165, 233, 0.3)';
      this.btnMenuTgAuth.style.color = '#38bdf8';
      this.btnMenuTgAuth.style.background = 'rgba(14, 165, 233, 0.12)';
    }
  }

  private openTgAuthModal() {
    soundManager.playSelect();
    haptics.light();
    this.updateTgAuthModalView();
    this.tgAuthModal.classList.remove('hidden');
    haptics.setBackButton(() => this.closeTgAuthModal());
  }

  private closeTgAuthModal() {
    this.tgAuthModal.classList.add('hidden');
    this.stopTgAuthPolling();
    this.updateScreenBackButton();
  }

  private stopTgAuthPolling() {
    if (this.tgAuthPollTimer) {
      clearInterval(this.tgAuthPollTimer);
      this.tgAuthPollTimer = undefined;
    }
  }

  private updateTgAuthModalView() {
    const tgUser = this.getStoredTelegramUser();
    if (tgUser) {
      this.tgAuthActiveView.classList.remove('hidden');
      this.tgAuthLoginView.classList.add('hidden');
      this.tgAuthUserName.textContent = tgUser.first_name || (tgUser.username ? `@${tgUser.username}` : 'Игрок');
      this.tgAuthUserHandle.textContent = tgUser.username ? `@${tgUser.username}` : `Telegram ID: ${tgUser.id}`;
      if (tgUser.photo_url) {
        this.tgAuthUserAvatar.innerHTML = `<img src="${tgUser.photo_url}" alt="Avatar" />`;
      } else {
        this.tgAuthUserAvatar.textContent = '✈️';
      }
    } else {
      this.tgAuthActiveView.classList.add('hidden');
      this.tgAuthLoginView.classList.remove('hidden');
      this.initTgAuthSession();
    }
  }

  private async initTgAuthSession() {
    this.stopTgAuthPolling();
    if (this.tgQrSpinner) this.tgQrSpinner.style.display = 'flex';
    if (this.tgAuthQrImg) this.tgAuthQrImg.style.display = 'none';
    if (this.tgPollStatusText) this.tgPollStatusText.textContent = 'Ожидание подтверждения в Telegram...';

    const fallbackBotUrl = 'https://t.me/sudoku_pulse_auth_bot';
    if (this.btnTgOpenBotLink) {
      this.btnTgOpenBotLink.href = fallbackBotUrl;
      this.btnTgOpenBotLink.setAttribute('data-bot-url', fallbackBotUrl);
    }

    try {
      const apiBase = `${getApiBaseUrl()}/auth/init`;
      const res = await fetch(apiBase);
      if (!res.ok) throw new Error('Failed to init auth');
      const data = await res.json();
      if (data.success && data.token) {
        const botUrl = data.botUrl || fallbackBotUrl;
        if (this.btnTgOpenBotLink) {
          this.btnTgOpenBotLink.href = botUrl;
          this.btnTgOpenBotLink.setAttribute('data-bot-url', botUrl);
        }
        if (this.tgAuthQrImg && data.qrUrl) {
          this.tgAuthQrImg.src = data.qrUrl;
          this.tgAuthQrImg.onload = () => {
            if (this.tgQrSpinner) this.tgQrSpinner.style.display = 'none';
            if (this.tgAuthQrImg) this.tgAuthQrImg.style.display = 'block';
          };
        }
        this.startTgAuthPolling(data.token);
      }
    } catch {
      if (this.tgPollStatusText) this.tgPollStatusText.textContent = 'Офлайн режим (используйте кнопку бота или ручной ввод)';
      if (this.tgQrSpinner) this.tgQrSpinner.style.display = 'none';
      if (this.btnTgOpenBotLink) {
        this.btnTgOpenBotLink.href = fallbackBotUrl;
        this.btnTgOpenBotLink.setAttribute('data-bot-url', fallbackBotUrl);
      }
    }
  }

  private startTgAuthPolling(token: string) {
    this.tgAuthPollTimer = window.setInterval(async () => {
      try {
        const apiBase = `${getApiBaseUrl()}/auth/poll`;
        const res = await fetch(`${apiBase}?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.status === 'authorized' && data.telegramUser) {
          this.stopTgAuthPolling();
          this.applyTelegramUser(data.telegramUser, data.profile);
        }
      } catch {}
    }, 2000);
  }

  private applyTelegramUser(user: TelegramUser, profile?: any) {
    localStorage.setItem('sudoku_telegram_user', JSON.stringify(user));
    localStorage.setItem('sudoku_cloud_sync_key', `tg_${user.id}`);
    const playerName = user.username ? `@${user.username}` : (user.first_name || `TG #${user.id}`);
    localStorage.setItem('sudoku_player_name', playerName);

    if (this.playerNameInput) {
      this.playerNameInput.value = playerName;
    }
    if (this.syncKeyInput) {
      this.syncKeyInput.value = user.username ? `@${user.username}` : `tg_${user.id}`;
    }

    if (profile?.stats) {
      SudokuGame.mergePlayerStats(profile.stats);
    }

    // Submit rename to leaderboard so player records reflect new username immediately
    try {
      const playerId = SudokuGame.getOrCreatePlayerId();
      const apiBase = `${getApiBaseUrl()}/leaderboard`;
      fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          playerId,
          name: playerName,
        }),
      }).catch(() => {});
    } catch {}

    soundManager.playCorrect(3);
    haptics.success();
    this.updateTgMenuPill();
    this.updateSyncBadge();
    this.updateDailyInfoOnMenu();
    this.updateTgAuthModalView();
    this.showToast(`🎉 Успешный вход через Telegram (${playerName})!`);

    // Auto-close QR / auth modal after 1.2s
    setTimeout(() => {
      if (this.tgAuthModal && !this.tgAuthModal.classList.contains('hidden')) {
        this.closeTgAuthModal();
      }
    }, 1200);
  }

  private logoutTelegram() {
    soundManager.playSelect();
    haptics.light();
    this.stopTgAuthPolling();
    localStorage.removeItem('sudoku_telegram_user');
    localStorage.removeItem('sudoku_cloud_sync_key');
    const defaultName = `Pulse#${Math.floor(100 + Math.random() * 899)}`;
    localStorage.setItem('sudoku_player_name', defaultName);
    if (this.playerNameInput) {
      this.playerNameInput.value = defaultName;
    }
    this.updateTgMenuPill();
    this.updateSyncBadge();
    this.updateTgAuthModalView();
    this.showToast('🚪 Вы вышли из аккаунта Telegram');
  }

  private mountTelegramWidget() {
    if (!this.tgWidgetContainer) return;
    this.tgWidgetContainer.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'sudoku_pulse_auth_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    this.tgWidgetContainer.appendChild(script);
  }

  private updateScreenBackButton() {
    if (this.currentScreen === 'menu') {
      haptics.setBackButton(null);
    } else if (this.currentScreen === 'mode_select') {
      haptics.setBackButton(() => this.showScreen('menu'));
    } else if (this.currentScreen === 'perk_select') {
      haptics.setBackButton(() => this.showScreen('mode_select'));
    } else if (this.currentScreen === 'game') {
      haptics.setBackButton(() => this.showScreen('menu'));
    }
  }

  private getSyncKey(): string {
    const tgUser = this.getStoredTelegramUser();
    if (tgUser?.id) {
      return tgUser.username ? `@${tgUser.username}` : `tg_${tgUser.id}`;
    }
    const KEY = 'sudoku_cloud_sync_key';
    let key = localStorage.getItem(KEY);
    if (!key) {
      const devId = SudokuGame.getOrCreatePlayerId().replace(/^dev_/, '');
      key = `PULSE-${devId.slice(0, 4).toUpperCase()}-${devId.slice(4, 8).toUpperCase()}`;
      localStorage.setItem(KEY, key);
    }
    return key;
  }

  private updateSyncBadge() {
    if (!this.syncAccountBadge) return;
    const tgUser = this.getStoredTelegramUser();
    if (tgUser) {
      const handle = tgUser.username ? `@${tgUser.username}` : tgUser.first_name || `TG #${tgUser.id}`;
      this.syncAccountBadge.textContent = `✈️ Telegram: ${handle}`;
      this.syncAccountBadge.style.color = '#38bdf8';
    } else {
      const key = this.getSyncKey();
      if (key.startsWith('@') || key.startsWith('tg_')) {
        this.syncAccountBadge.textContent = `✈️ Telegram: ${key}`;
        this.syncAccountBadge.style.color = '#38bdf8';
      } else {
        this.syncAccountBadge.textContent = `🔑 ${key}`;
        this.syncAccountBadge.style.color = '#34d399';
      }
    }
    if (this.syncKeyInput) {
      this.syncKeyInput.value = this.getSyncKey();
    }
    this.updateTgMenuPill();
  }

  private async syncWithCloud(showToastNotification: boolean = false) {
    try {
      const key = this.getSyncKey();
      const stats = SudokuGame.getPlayerStats();
      const playerName = localStorage.getItem('sudoku_player_name') || 'Игрок';
      const theme = localStorage.getItem('sudoku_theme') || 'dark';
      const tgUser = this.getStoredTelegramUser();

      const apiBase = `${getApiBaseUrl()}/sync`;
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          stats,
          playerName,
          theme,
          telegramUser: tgUser,
          notificationsEnabled: this.notificationsEnabled,
        }),
      });

      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      if (data.profile?.stats) {
        SudokuGame.mergePlayerStats(data.profile.stats);
        this.updateDailyInfoOnMenu();
      }
      if (data.profile && typeof data.profile.notificationsEnabled === 'boolean') {
        this.notificationsEnabled = data.profile.notificationsEnabled;
        localStorage.setItem('sudoku_notifications_enabled', this.notificationsEnabled.toString());
        this.updateNotifyButton(this.notificationsEnabled);
      }

      if (showToastNotification) {
        this.showToast('☁️ Прогресс успешно синхронизирован с Telegram Cloud!');
      }
    } catch {
      if (showToastNotification) {
        this.showToast('⚠️ Офлайн: локальный прогресс сохранён');
      }
    }
  }

  private async importSyncKey(inputKey: string) {
    try {
      const key = inputKey.trim();
      const apiBase = `${getApiBaseUrl()}/sync`;
      const res = await fetch(`${apiBase}?key=${encodeURIComponent(key)}`);
      if (!res.ok) {
        this.showToast('❌ Профиль с таким Telegram/ключом не найден в облаке');
        return;
      }
      const data = await res.json();
      if (data.profile) {
        if (data.profile.stats) {
          SudokuGame.mergePlayerStats(data.profile.stats);
        }
        if (data.profile.playerName) {
          localStorage.setItem('sudoku_player_name', data.profile.playerName);
          if (this.playerNameInput) this.playerNameInput.value = data.profile.playerName;
        }
        if (data.profile.theme) {
          this.setTheme(data.profile.theme);
        }
        if (data.profile.telegramUser) {
          localStorage.setItem('sudoku_telegram_user', JSON.stringify(data.profile.telegramUser));
        }
        if (typeof data.profile.notificationsEnabled === 'boolean') {
          this.notificationsEnabled = data.profile.notificationsEnabled;
          localStorage.setItem('sudoku_notifications_enabled', this.notificationsEnabled.toString());
          this.updateNotifyButton(this.notificationsEnabled);
        }
        const effectiveKey = data.profile.key || key;
        localStorage.setItem('sudoku_cloud_sync_key', effectiveKey);
        if (this.syncKeyInput) this.syncKeyInput.value = effectiveKey;
        this.updateSyncBadge();
        this.updateDailyInfoOnMenu();
        this.updateTgAuthModalView();
        this.showToast('🎉 Профиль и прогресс успешно подключены!');
      }
    } catch {
      this.showToast('❌ Ошибка при связывании устройств');
    }
  }

  private shareChallengeToTelegram() {
    const seed = this.game.currentSeed;
    const diff = this.game.difficulty;
    const mode = this.game.mode;
    const score = this.game.score;
    const time = this.game.timerSeconds;
    const tgUser = this.getStoredTelegramUser();
    const myName = (localStorage.getItem('sudoku_player_name') || tgUser?.username || 'Игрок').replace(/[@_\s]/g, '');

    const mins = Math.floor(time / 60);
    const secs = time % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const diffLabels: Record<Difficulty, string> = {
      easy: 'Легкий',
      medium: 'Средний',
      hard: 'Сложный',
      expert: 'Эксперт',
    };
    const diffName = diffLabels[diff] || 'Средний';

    const challengeParam = `c_${seed}_${diff}_${mode}_${score}_${time}_${encodeURIComponent(myName)}`;
    const miniAppUrl = `https://t.me/sudoku_pulse_auth_bot/app?startapp=${challengeParam}`;

    const text = `⚔️ Бросаю вызов в Sudoku Pulse!
🎯 Мой рекорд: ${score.toLocaleString('ru-RU')} очков за ${timeStr} на сложности "${diffName}".
Сможешь побить мой рекорд на той же сетке? 🚀`;

    navigator.clipboard.writeText(`${text}\n${miniAppUrl}`).then(() => {
      this.showToast('🔗 Ссылка на вызов скопирована! Открываем Telegram...');
    }).catch(() => {});

    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(miniAppUrl)}&text=${encodeURIComponent(text)}`;
    const tgApp = (window as any).Telegram?.WebApp;
    if (tgApp?.openTelegramLink) {
      tgApp.openTelegramLink(tgShareUrl);
    } else {
      window.open(tgShareUrl, '_blank');
    }
  }

  private shareResultToTelegram() {
    const baseUrl = window.location.origin + window.location.pathname;
    const mins = Math.floor(this.game.timerSeconds / 60);
    const secs = this.game.timerSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const modeLabels: Record<GameMode, string> = {
      classic: 'Классика',
      fog: 'Тёмный сектор',
      daily: 'Daily Pulse',
      run: `Pulse Run (Этап ${this.game.runStage})`,
      ai_duel: 'Pulse AI Дуэль',
    };
    const diffLabels: Record<Difficulty, string> = {
      easy: 'Легкий',
      medium: 'Средний',
      hard: 'Сложный',
      expert: 'Эксперт',
    };

    const modeName = modeLabels[this.game.mode] || 'Классика';
    const diffName = diffLabels[this.game.difficulty] || 'Средний';

    const text = `⚡ Sudoku Pulse — Победа!
🎮 Режим: ${modeName} (${diffName})
⏱️ Время: ${timeStr} | 💎 Очки: ${this.game.score.toLocaleString('ru-RU')}
🔥 Макс. комбо: x${this.game.maxComboAchieved} | ❤️ Ошибки: ${this.game.mistakesCount}/${this.game.maxMistakes}
🟩🟩🟩🟨🟩
Сыграй в ритме Sudoku Pulse:`;

    navigator.clipboard.writeText(`${text}\n${baseUrl}`).then(() => {
      this.showToast('📋 Результат скопирован! Открываем Telegram...');
    }).catch(() => {});

    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(text)}`;
    const tgApp = (window as any).Telegram?.WebApp;
    if (tgApp?.openTelegramLink) {
      tgApp.openTelegramLink(tgShareUrl);
    } else {
      window.open(tgShareUrl, '_blank');
    }
  }

  private showGameOverModal() {
    this.stopAiBotDuel();
    if (this.game.mode === 'run') {
      this.gameOverSubtitle.textContent = `Забег окончен на Этапе ${this.game.runStage}. Ваш счёт: ${this.game.score.toLocaleString('ru-RU')}`;
    } else if (this.game.mode === 'ai_duel') {
      this.gameOverSubtitle.textContent = `Вы совершили ${this.game.maxMistakes} ошибок в дуэли против ${this.aiBotProgress.name}.`;
    } else {
      this.gameOverSubtitle.textContent = `Вы совершили ${this.game.maxMistakes} ошибок.`;
    }
    this.gameOverModal.classList.remove('hidden');
  }

  private showStatsModal() {
    const stats = SudokuGame.getPlayerStats();
    this.statPlayed.textContent = stats.gamesPlayed.toString();
    this.statWon.textContent = stats.gamesWon.toString();
    this.statCombo.textContent = `x${stats.maxCombo}`;
    this.statScore.textContent = stats.totalScore.toLocaleString('ru-RU');
    this.statStreak.textContent = `🔥 ${stats.dailyStreak} дн.`;
    const bestRun = stats.bestRunStage || 0;
    const bestRunScore = stats.bestRunScore || 0;
    this.statRunStage.textContent = bestRun > 0 ? `Этап ${bestRun} (${bestRunScore.toLocaleString('ru-RU')})` : '—';
    this.updateLeagueViews();
    this.renderPlayerSeasonMedals();
    this.renderSeasonArchive();
    this.renderDuelHistory();
    this.statsModal.classList.remove('hidden');
    this.fetchAndRenderLeaderboard();
  }

  private showMultiClearBanner(count: number, bonusScore: number) {
    if (!this.multiClearContainer) return;
    const badge = document.createElement('div');
    const isQuad = count >= 4;
    const isTriple = count === 3;
    badge.className = `multi-clear-badge ${isQuad ? 'quad' : (isTriple ? 'triple' : 'dual')}`;
    const icon = isQuad ? '⚡💥' : (isTriple ? '🔥' : '⚡');
    const title = isQuad ? 'QUAD OVERDRIVE!' : (isTriple ? 'TRIPLE OVERDRIVE!' : 'DUAL CLEAR!');
    badge.innerHTML = `<span>${icon} ${title}</span> <span style="opacity:0.9; font-size:0.9em; margin-left:4px;">+${bonusScore}</span>`;
    this.multiClearContainer.appendChild(badge);

    setTimeout(() => {
      badge.remove();
    }, 1800);
  }

  private getDuelHistory(): DuelRecord[] {
    try {
      const raw = localStorage.getItem('sudoku_duel_history');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private addDuelRecord(record: DuelRecord) {
    try {
      const list = this.getDuelHistory();
      list.unshift(record);
      if (list.length > 30) list.length = 30;
      localStorage.setItem('sudoku_duel_history', JSON.stringify(list));
    } catch {}
  }

  private renderDuelHistory() {
    if (!this.duelHistoryList || !this.duelHistorySummary) return;
    const history = this.getDuelHistory();
    if (history.length === 0) {
      this.duelHistorySummary.textContent = '0 дуэлей сыграно';
      this.duelHistoryList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:10px;">Вы еще не участвовали в дуэлях. Поделитесь вызовом после победы!</div>`;
      return;
    }

    const wins = history.filter((d) => d.won).length;
    const losses = history.length - wins;
    const winRate = Math.round((wins / history.length) * 100);
    this.duelHistorySummary.textContent = `Побед: ${wins} | Поражений: ${losses} (${winRate}% винрейт)`;

    const diffLabels: Record<Difficulty, string> = {
      easy: 'Легкий',
      medium: 'Средний',
      hard: 'Сложный',
      expert: 'Эксперт',
    };

    this.duelHistoryList.innerHTML = history.slice(0, 10).map((d) => {
      const statusIcon = d.won ? '🏆' : '💀';
      const statusClass = d.won ? 'won' : 'lost';
      const statusText = d.won ? 'Победа' : 'Поражение';
      const myMins = Math.floor(d.myTime / 60);
      const mySecs = d.myTime % 60;
      const myTimeStr = `${myMins.toString().padStart(2, '0')}:${mySecs.toString().padStart(2, '0')}`;
      const diffName = diffLabels[d.diff] || 'Средний';

      const scoreDiff = d.myScore - d.targetScore;
      const diffStr = scoreDiff >= 0 ? `+${scoreDiff.toLocaleString('ru-RU')}` : `${scoreDiff.toLocaleString('ru-RU')}`;

      return `
        <div class="duel-card ${statusClass}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:700;">
              <span>${statusIcon}</span>
              <span style="color:${d.won ? '#34d399' : '#f43f5e'};">${statusText} vs ${d.challenger.replace(/</g, '&lt;')}</span>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">${d.date}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);">
            <span>${diffName} | ⏱️ ${myTimeStr}</span>
            <span>Счёт: <strong style="color:var(--text-main);">${d.myScore.toLocaleString('ru-RU')}</strong> (<span style="color:${d.won ? '#34d399' : '#f43f5e'};">${diffStr}</span>)</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private updateLeagueViews() {
    const stats = SudokuGame.getPlayerStats();
    const league = getLeagueForScore(stats.totalScore);

    if (this.menuLeagueBadge) {
      this.menuLeagueBadge.className = league.badgeClass;
      this.menuLeagueBadge.innerHTML = `<span>${league.icon}</span> <span>${league.name}</span>`;
    }

    if (this.statLeagueBadge) {
      this.statLeagueBadge.className = league.badgeClass;
      this.statLeagueBadge.innerHTML = `<span>${league.icon}</span> <span>Лига: ${league.name}</span>`;
    }

    if (this.statSeasonTimer) {
      this.statSeasonTimer.textContent = `⏳ Сезон: ${getSeasonRemainingText()}`;
    }

    if (this.tgAuthUserAvatar) {
      this.tgAuthUserAvatar.classList.remove('avatar-frame-bronze', 'avatar-frame-silver', 'avatar-frame-gold', 'avatar-frame-platinum', 'avatar-frame-grandmaster');
      this.tgAuthUserAvatar.classList.add(league.frameClass);
    }
  }

  private getSeasonArchive(): SeasonTrophy[] {
    try {
      const raw = localStorage.getItem('sudoku_season_archive');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private addSeasonTrophy(trophy: SeasonTrophy) {
    try {
      const list = this.getSeasonArchive();
      if (!list.some((t) => t.seasonId === trophy.seasonId)) {
        list.unshift(trophy);
        localStorage.setItem('sudoku_season_archive', JSON.stringify(list));
      }
    } catch {}
  }

  private checkSeasonTransition() {
    const currentSeason = getCurrentSeasonId();
    const lastSeason = localStorage.getItem('sudoku_last_season_id');
    const stats = SudokuGame.getPlayerStats();

    if (!lastSeason) {
      localStorage.setItem('sudoku_last_season_id', currentSeason);
      return;
    }

    if (lastSeason !== currentSeason) {
      const finalLeague = getLeagueForScore(stats.totalScore);
      const trophy: SeasonTrophy = {
        seasonId: lastSeason,
        seasonName: `Сезон ${lastSeason.replace('-', ' ')}`,
        leagueId: finalLeague.id,
        leagueName: finalLeague.name,
        icon: finalLeague.icon,
        points: stats.totalScore,
        dateAwarded: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      };
      this.addSeasonTrophy(trophy);

      const badgeTier: 'gold' | 'silver' | 'bronze' | 'champion' | 'veteran' =
        finalLeague.id === 'grandmaster' ? 'champion' :
        finalLeague.id === 'platinum' ? 'gold' :
        finalLeague.id === 'gold' ? 'silver' :
        finalLeague.id === 'silver' ? 'bronze' : 'veteran';
      
      const badge: SeasonBadge = {
        id: 'badge_' + lastSeason,
        seasonId: lastSeason,
        title: `${finalLeague.icon} ${finalLeague.name} • ${lastSeason}`,
        icon: finalLeague.icon,
        tier: badgeTier,
        dateAwarded: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      };
      this.addSeasonBadge(badge);

      localStorage.setItem('sudoku_last_season_id', currentSeason);

      setTimeout(() => {
        this.showToast(`🏆 Итоги сезона ${lastSeason}! Вам присвоен трофей: ${finalLeague.icon} ${finalLeague.name}`);
        soundManager.playVictory();
        haptics.victory();
      }, 1200);
    }
  }

  private getSeasonBadges(): SeasonBadge[] {
    try {
      const raw = localStorage.getItem('sudoku_season_badges');
      if (raw) return JSON.parse(raw);
    } catch {}
    const stats = SudokuGame.getPlayerStats();
    if (stats.gamesWon > 0) {
      const starter: SeasonBadge = {
        id: 'badge_starter',
        seasonId: getCurrentSeasonId(),
        title: '⚡ Ветеран Pulse',
        icon: '⚡',
        tier: 'veteran',
        dateAwarded: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      };
      return [starter];
    }
    return [];
  }

  private addSeasonBadge(badge: SeasonBadge) {
    try {
      const list = this.getSeasonBadges();
      if (!list.some((b) => b.id === badge.id)) {
        list.unshift(badge);
        localStorage.setItem('sudoku_season_badges', JSON.stringify(list));
        const stats = SudokuGame.getPlayerStats();
        stats.seasonBadges = list;
        SudokuGame.savePlayerStats(stats);
      }
    } catch {}
  }

  private renderPlayerSeasonMedals() {
    if (!this.playerSeasonMedals) return;
    const badges = this.getSeasonBadges();
    if (badges.length === 0) {
      this.playerSeasonMedals.classList.add('hidden');
      return;
    }
    this.playerSeasonMedals.classList.remove('hidden');
    this.playerSeasonMedals.innerHTML = badges.map((b) => `
      <span class="player-medal-chip ${b.tier}" title="Награда за ${b.title}">
        <span>${b.icon}</span>
        <span>${b.title}</span>
      </span>
    `).join('');
  }

  private setAiBotEmotion(emotion: 'idle' | 'speaking' | 'smug' | 'fever' | 'glitch', durationMs?: number) {
    if (!this.aiBotAvatar) return;
    if (this.aiBotEmotionTimeout) {
      window.clearTimeout(this.aiBotEmotionTimeout);
      this.aiBotEmotionTimeout = undefined;
    }

    this.aiBotAvatar.classList.remove('idle', 'speaking', 'smug', 'fever', 'glitch');
    this.aiBotAvatar.classList.add(emotion);

    if (durationMs && emotion !== 'idle') {
      this.aiBotEmotionTimeout = window.setTimeout(() => {
        if (this.aiBotAvatar) {
          this.aiBotAvatar.classList.remove('idle', 'speaking', 'smug', 'fever', 'glitch');
          this.aiBotAvatar.classList.add('idle');
        }
        this.aiBotEmotionTimeout = undefined;
      }, durationMs);
    }
  }

  private renderSeasonArchive() {
    if (!this.seasonArchiveList) return;
    const archive = this.getSeasonArchive();
    const currentSeason = getCurrentSeasonId();
    const stats = SudokuGame.getPlayerStats();
    const currentLeague = getLeagueForScore(stats.totalScore);

    const currentCard = `
      <div class="season-trophy-card" style="border-color: rgba(56, 189, 248, 0.35); background: rgba(56, 189, 248, 0.06); margin-bottom: 6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.1rem;">⏳</span>
          <div>
            <div style="font-weight:700; color:var(--text-main); font-size:0.82rem;">Сезон ${currentSeason} <span style="font-size:0.7rem; color:var(--pulse-cyan);">(Текущий)</span></div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Квалификация: <strong>${currentLeague.name}</strong> (${stats.totalScore.toLocaleString('ru-RU')} очков)</div>
          </div>
        </div>
        <span class="season-trophy-tag ${currentLeague.badgeClass}">${currentLeague.icon} В игре</span>
      </div>
    `;

    if (archive.length === 0) {
      this.seasonArchiveList.innerHTML = currentCard + `
        <div style="text-align:center; color:var(--text-muted); font-size:0.78rem; padding:6px;">
          Трофей за текущую неделю закрепится в архиве по завершению сезона!
        </div>
      `;
      return;
    }

    const pastCards = archive.map((t) => {
      const league = getLeagueForScore(t.points);
      return `
        <div class="season-trophy-card">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.1rem;">${t.icon}</span>
            <div>
              <div style="font-weight:700; color:var(--text-main); font-size:0.82rem;">${t.seasonName}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${t.dateAwarded} • ${t.points.toLocaleString('ru-RU')} очков</div>
            </div>
          </div>
          <span class="season-trophy-tag ${league.badgeClass}">${t.leagueName}</span>
        </div>
      `;
    }).join('');

    this.seasonArchiveList.innerHTML = currentCard + pastCards;
  }

  private showAiBotTaunt(text: string, durationMs: number = 3000) {
    if (!this.aiBotTaunt || !this.aiBotTauntText) return;
    if (this.game.mode !== 'ai_duel') return;

    if (this.aiBotTauntTimeout) {
      window.clearTimeout(this.aiBotTauntTimeout);
      this.aiBotTauntTimeout = undefined;
    }

    this.aiBotTauntText.textContent = text;
    this.aiBotTaunt.classList.remove('hidden');
    this.setAiBotEmotion('speaking', durationMs);
    soundManager.playBotBeep();

    this.aiBotTauntTimeout = window.setTimeout(() => {
      if (this.aiBotTaunt) {
        this.aiBotTaunt.classList.add('hidden');
      }
      this.aiBotTauntTimeout = undefined;
    }, durationMs);
  }

  private startAiBotDuel() {
    this.stopAiBotDuel();
    this.setAiBotEmotion('idle');
    const counts = this.game.getProgressCounts();
    const botProfiles: Record<Difficulty, { name: string; stepMs: number; errorChance: number; startTaunt: string }> = {
      easy: { name: 'PulseBot v1', stepMs: 8000, errorChance: 0.15, startTaunt: 'Привет, человек! Покажи, как ты решаешь сетку.' },
      medium: { name: 'CyberPulse v2', stepMs: 5000, errorChance: 0.05, startTaunt: 'Мои нейронные цепи прогреты. Готовься к дуэли!' },
      hard: { name: 'NeuralPulse v3', stepMs: 3400, errorChance: 0, startTaunt: 'Высокая сложность? Отлично, я не буду поддаваться.' },
      expert: { name: 'QuantumPulse v4', stepMs: 2300, errorChance: 0, startTaunt: '01000111 01001111! Полное квантовое доминирование.' },
    };
    const profile = botProfiles[this.game.difficulty] || botProfiles.medium;
    this.aiBotProgress = {
      name: profile.name,
      filled: 0,
      total: counts.totalToFill || 45,
      score: 0,
      stepIntervalMs: profile.stepMs,
      reachedHalf: false,
      reachedEighty: false,
    };

    if (this.aiBotName) this.aiBotName.textContent = profile.name;
    this.updateAiDuelHud();

    // Opening greeting taunt
    setTimeout(() => {
      if (this.game.mode === 'ai_duel' && this.currentScreen === 'game') {
        this.showAiBotTaunt(profile.startTaunt, 3200);
      }
    }, 1000);

    this.aiBotInterval = window.setInterval(() => {
      if (this.currentScreen !== 'game' || this.game.status !== 'playing') return;

      if (Math.random() < profile.errorChance) {
        this.setAiBotEmotion('glitch', 2400);
        const errorTaunts = [
          'Сбой в вычислениях... Перезагрузка логики!',
          'Похоже, мой датчик ошибся... Твой шанс!',
          'Критическая погрешность потока... Исправляю!',
        ];
        this.showAiBotTaunt(errorTaunts[Math.floor(Math.random() * errorTaunts.length)], 2500);
        return;
      }

      this.aiBotProgress.filled++;
      this.aiBotProgress.score += Math.floor(180 + Math.random() * 60);
      this.updateAiDuelHud();

      // Milestone taunts
      const halfCount = Math.floor(this.aiBotProgress.total * 0.5);
      const eightyCount = Math.floor(this.aiBotProgress.total * 0.8);
      if (!this.aiBotProgress.reachedHalf && this.aiBotProgress.filled >= halfCount) {
        this.aiBotProgress.reachedHalf = true;
        this.setAiBotEmotion('smug', 3000);
        this.showAiBotTaunt('Половина сетки за мной! Догоняй!', 2800);
      } else if (!this.aiBotProgress.reachedEighty && this.aiBotProgress.filled >= eightyCount) {
        this.aiBotProgress.reachedEighty = true;
        this.setAiBotEmotion('smug', 3000);
        this.showAiBotTaunt('Финишная прямая! Победа уже близко!', 2800);
      }

      if (this.aiBotProgress.filled >= this.aiBotProgress.total) {
        this.stopAiBotDuel();
        this.handleAiDuelLoss();
      }
    }, profile.stepMs);
  }

  private stopAiBotDuel() {
    if (this.aiBotInterval) {
      clearInterval(this.aiBotInterval);
      this.aiBotInterval = undefined;
    }
    if (this.aiBotTauntTimeout) {
      clearTimeout(this.aiBotTauntTimeout);
      this.aiBotTauntTimeout = undefined;
    }
    if (this.aiBotTaunt) {
      this.aiBotTaunt.classList.add('hidden');
    }
    this.setAiBotEmotion('idle');
  }

  private updateAiDuelHud() {
    if (this.game.mode !== 'ai_duel') {
      if (this.aiDuelHud) this.aiDuelHud.classList.add('hidden');
      return;
    }
    if (this.aiDuelHud) this.aiDuelHud.classList.remove('hidden');

    const counts = this.game.getProgressCounts();
    const playerFilled = counts.filled;
    const playerTotal = counts.totalToFill || this.aiBotProgress.total || 45;
    const playerPct = Math.min(100, Math.round((playerFilled / playerTotal) * 100));

    if (this.playerDuelCount) {
      this.playerDuelCount.textContent = `${playerFilled}/${playerTotal}`;
    }
    if (this.playerDuelFill) {
      this.playerDuelFill.style.width = `${playerPct}%`;
    }

    const botFilled = Math.min(this.aiBotProgress.filled, this.aiBotProgress.total);
    const botTotal = this.aiBotProgress.total;
    const botPct = Math.min(100, Math.round((botFilled / botTotal) * 100));

    if (this.aiBotCount) {
      this.aiBotCount.textContent = `${botFilled}/${botTotal}`;
    }
    if (this.aiBotFill) {
      this.aiBotFill.style.width = `${botPct}%`;
    }
  }

  private handleAiDuelLoss() {
    const botName = `🤖 ${this.aiBotProgress.name}`;
    const duelRecord: DuelRecord = {
      id: 'duel_' + Date.now(),
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      challenger: botName,
      won: false,
      myScore: this.game.score,
      myTime: this.game.timerSeconds,
      targetScore: this.aiBotProgress.score,
      targetTime: this.game.timerSeconds,
      diff: this.game.difficulty,
      mode: this.game.mode,
    };
    this.addDuelRecord(duelRecord);

    soundManager.playError();
    haptics.error();
    this.gameOverSubtitle.textContent = `${botName} первым заполнил сетку (${this.aiBotProgress.total}/${this.aiBotProgress.total})! Счёт бота: ${this.aiBotProgress.score.toLocaleString('ru-RU')}.`;
    this.gameOverModal.classList.remove('hidden');
  }

  private getBoardSkin(): string {
    return localStorage.getItem('sudoku_board_skin') || 'neon';
  }

  private setBoardSkin(skin: string) {
    document.documentElement.setAttribute('data-board-skin', skin);
    localStorage.setItem('sudoku_board_skin', skin);
    soundManager.setSoundTheme(skin);
    this.updateBoardSkinButtons();
  }

  private updateBoardSkinButtons() {
    const currentSkin = this.getBoardSkin();
    const stats = SudokuGame.getPlayerStats();
    const totalScore = stats.totalScore;

    const skinsReq: Record<string, { minScore: number; leagueName: string; name: string; icon: string }> = {
      neon: { minScore: 0, leagueName: 'Бронза', name: 'Cyber', icon: '⚡' },
      synthwave: { minScore: 10000, leagueName: 'Серебро', name: 'Synth', icon: '🌆' },
      matrix: { minScore: 30000, leagueName: 'Золото', name: 'Matrix', icon: '🟢' },
      hologram: { minScore: 75000, leagueName: 'Платина', name: 'Hologram', icon: '💎' },
      obsidian: { minScore: 150000, leagueName: 'Мастер', name: 'Obsidian', icon: '👑' },
    };

    this.boardSkinPills.forEach((pill) => {
      const skinKey = pill.getAttribute('data-board-skin') || 'neon';
      const req = skinsReq[skinKey];
      if (!req) return;

      const isUnlocked = totalScore >= req.minScore;
      pill.classList.toggle('active', currentSkin === skinKey);
      pill.classList.toggle('locked', !isUnlocked);

      if (isUnlocked) {
        pill.textContent = `${req.icon} ${req.name}`;
      } else {
        pill.textContent = `🔒 ${req.name} (${req.leagueName})`;
      }
    });
  }

  private showMockAd(rewardTitle: string, onReward: () => void) {
    this.adRewardTitle.textContent = rewardTitle;
    this.adProgressFill.style.width = '0%';
    this.adTimerText.textContent = 'Осталось 3 сек...';
    this.adModal.classList.remove('hidden');

    const durationMs = 3000;
    const intervalMs = 100;
    let elapsed = 0;

    const timer = window.setInterval(() => {
      elapsed += intervalMs;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      this.adProgressFill.style.width = `${progress}%`;

      const secondsLeft = Math.max(1, Math.ceil((durationMs - elapsed) / 1000));
      this.adTimerText.textContent = `Осталось ${secondsLeft} сек...`;

      if (elapsed >= durationMs) {
        clearInterval(timer);
        setTimeout(() => {
          this.adModal.classList.add('hidden');
          soundManager.playCorrect();
          onReward();
        }, 200);
      }
    }, intervalMs);
  }

  private showToast(message: string) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    const isAchievement = message.includes('🏅') || message.toLowerCase().includes('достижение');
    toast.className = isAchievement ? 'toast achievement-toast' : 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  // Confetti Animation
  private initConfetti() {
    const resize = () => {
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  private startConfetti() {
    if (!this.confettiCtx) return;
    const ctx = this.confettiCtx;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
    }> = [];

    const colors = ['#6366f1', '#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * this.confettiCanvas.width,
        y: Math.random() * -this.confettiCanvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (p.y > this.confettiCanvas.height) {
          p.y = -10;
          p.x = Math.random() * this.confettiCanvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      this.confettiAnimationId = requestAnimationFrame(animate);
    };

    animate();
  }

  private stopConfetti() {
    if (this.confettiAnimationId) {
      cancelAnimationFrame(this.confettiAnimationId);
    }
    if (this.confettiCtx) {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }
  }

  private initBgParticles() {
    if (!this.bgParticlesCanvas || !this.bgParticlesCtx) return;
    const ctx = this.bgParticlesCtx;

    const resize = () => {
      this.bgParticlesCanvas.width = window.innerWidth;
      this.bgParticlesCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }));

    const renderParticles = () => {
      ctx.clearRect(0, 0, this.bgParticlesCanvas.width, this.bgParticlesCanvas.height);
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const isFever = this.game.isFeverMode;
      const speedMult = isFever ? 3.5 : 1.0;

      let rgb = '56, 189, 248';
      if (isFever) rgb = '251, 191, 36';
      else if (theme === 'synthwave') rgb = '244, 114, 182';
      else if (theme === 'matrix') rgb = '74, 222, 128';
      else if (theme === 'light') rgb = '99, 102, 241';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        if (p.x < 0) p.x = this.bgParticlesCanvas.width;
        if (p.x > this.bgParticlesCanvas.width) p.x = 0;
        if (p.y < 0) p.y = this.bgParticlesCanvas.height;
        if (p.y > this.bgParticlesCanvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${isFever ? 0.55 : 0.3})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${rgb}, ${(1 - dist / 110) * 0.12})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(renderParticles);
    };

    renderParticles();
  }
}

