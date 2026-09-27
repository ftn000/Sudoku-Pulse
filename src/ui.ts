import { SudokuGame } from './game';
import { Difficulty, GameMode, GameStats, AppScreen, SeasonBadge } from './types';
import { soundManager } from './audio';
import { getRandomPerks, formatRomanLevel } from './perks';
import { ACHIEVEMENTS, evaluateAllAchievements } from './achievements';
import { haptics, TelegramUser } from './haptics';
import { yandexBridge } from './yandex';
import { i18n, t, PERK_TRANSLATIONS, ACHIEVEMENT_TRANSLATIONS } from './i18n';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '/sudoku/api';

  const isNative = Boolean(
    (window as any).Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:'
  );

  const isTelegram = Boolean(
    (window as any).Telegram?.WebApp?.initData ||
    window.location.hostname.includes('telegram.org') ||
    window.location.search.includes('tgWebAppData') ||
    window.location.hash.includes('tgWebAppData')
  );

  const isYandex = yandexBridge.isYandex() || window.location.hostname.includes('yandex');

  const isRemoteOrigin =
    window.location.hostname !== '109.69.17.170.sslip.io' &&
    window.location.hostname !== '109.69.17.170' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (isNative || isTelegram || isYandex || isRemoteOrigin) {
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
  const isEn = i18n.getLanguage() === 'en';
  if (totalScore >= 150000) return { id: 'grandmaster', name: isEn ? 'Cyber Master' : 'Кибер-Мастер', icon: '👑', badgeClass: 'league-badge grandmaster', frameClass: 'avatar-frame-grandmaster', minScore: 150000 };
  if (totalScore >= 75000) return { id: 'platinum', name: isEn ? 'Platinum' : 'Платиновая', icon: '💎', badgeClass: 'league-badge platinum', frameClass: 'avatar-frame-platinum', minScore: 75000 };
  if (totalScore >= 30000) return { id: 'gold', name: isEn ? 'Gold' : 'Золотая', icon: '🥇', badgeClass: 'league-badge gold', frameClass: 'avatar-frame-gold', minScore: 30000 };
  if (totalScore >= 10000) return { id: 'silver', name: isEn ? 'Silver' : 'Серебряная', icon: '🥈', badgeClass: 'league-badge silver', frameClass: 'avatar-frame-silver', minScore: 10000 };
  return { id: 'bronze', name: isEn ? 'Bronze' : 'Бронзовая', icon: '🥉', badgeClass: 'league-badge bronze', frameClass: 'avatar-frame-bronze', minScore: 0 };
}

export const BOARD_SKINS_CONFIG: Record<string, { minScore: number; leagueRu: string; leagueEn: string; nameRu: string; nameEn: string; icon: string }> = {
  neon: { minScore: 0, leagueRu: 'Бронза', leagueEn: 'Bronze', nameRu: 'Кибер', nameEn: 'Cyber', icon: '⚡' },
  synthwave: { minScore: 5000, leagueRu: 'Серебро', leagueEn: 'Silver', nameRu: 'Синтвейв', nameEn: 'Synth', icon: '🌆' },
  aqua: { minScore: 15000, leagueRu: 'Аква', leagueEn: 'Aqua', nameRu: 'Аква', nameEn: 'Aqua', icon: '🌊' },
  matrix: { minScore: 30000, leagueRu: 'Золото', leagueEn: 'Gold', nameRu: 'Матрица', nameEn: 'Matrix', icon: '🟢' },
  crimson: { minScore: 50000, leagueRu: 'Рубин', leagueEn: 'Ruby', nameRu: 'Багровый', nameEn: 'Crimson', icon: '🩸' },
  hologram: { minScore: 75000, leagueRu: 'Платина', leagueEn: 'Platinum', nameRu: 'Голограмма', nameEn: 'Hologram', icon: '💎' },
  retro: { minScore: 100000, leagueRu: 'Алмаз', leagueEn: 'Diamond', nameRu: 'Ретро', nameEn: 'Retro', icon: '👾' },
  obsidian: { minScore: 150000, leagueRu: 'Мастер', leagueEn: 'Master', nameRu: 'Обсидиан', nameEn: 'Obsidian', icon: '👑' },
};

export function getSeasonRemainingText(): string {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const daysUntilMonday = ((8 - currentDay) % 7) || 7;
  const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0));
  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
  const diffHoursTotal = Math.floor(diffMs / (1000 * 3600));
  const days = Math.floor(diffHoursTotal / 24);
  const hours = diffHoursTotal % 24;
  const isEn = i18n.getLanguage() === 'en';
  return isEn ? `${days}d ${hours}h` : `${days} дн. ${hours} ч.`;
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
  private settingNotifyBtn?: HTMLButtonElement | null;
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

  // Enter Friend Challenge Modal
  private btnOpenEnterChallenge?: HTMLButtonElement;
  private enterChallengeModal?: HTMLElement;
  private btnCloseEnterChallengeX?: HTMLButtonElement;
  private inputChallengeCode?: HTMLInputElement;
  private btnPasteChallengeCode?: HTMLButtonElement;
  private btnSubmitChallengeCode?: HTMLButtonElement;

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

  // 1v1 Live Multiplayer Lobby
  private modeCardLiveDuel?: HTMLElement;
  private liveLobbyModal?: HTMLElement;
  private btnCloseLiveLobbyX?: HTMLButtonElement;
  private tabLiveCreate?: HTMLButtonElement;
  private tabLiveJoin?: HTMLButtonElement;
  private livePanelCreate?: HTMLElement;
  private livePanelJoin?: HTMLElement;
  private liveDiffPills: HTMLButtonElement[] = [];
  private selectedLiveDiff: Difficulty = 'medium';
  private btnCreateLiveRoom?: HTMLButtonElement;
  private inputLiveCode?: HTMLInputElement;
  private btnPasteLiveCode?: HTMLButtonElement;
  private btnJoinLiveRoom?: HTMLButtonElement;
  private liveLobbyViewMain?: HTMLElement;
  private liveLobbyViewWaiting?: HTMLElement;
  private liveLobbyViewCountdown?: HTMLElement;
  private liveWaitingCode?: HTMLElement;
  private liveWaitingDiff?: HTMLElement;
  private btnCopyLiveLink?: HTMLButtonElement;
  private btnShareLiveLink?: HTMLButtonElement;
  private btnCancelLiveRoom?: HTMLButtonElement;
  private liveCountdownNumber?: HTMLElement;
  private liveCdHostName?: HTMLElement;
  private liveCdGuestName?: HTMLElement;

  private currentLiveLobbyId: string | null = null;
  private currentLiveLobbyCode: string | null = null;
  private isLiveHost: boolean = false;
  private livePollInterval?: any = null;
  private liveOpponentName: string = 'Соперник';
  private isLiveDuelActive: boolean = false;
  private btnLiveQuickMatch?: HTMLButtonElement;
  private liveWaitingRoomBox?: HTMLElement;
  private liveWaitingQuickBox?: HTMLElement;
  private liveQuickDiffLabel?: HTMLElement;
  private liveWaitingStatusLabel?: HTMLElement;
  private isQuickMatchWaiting: boolean = false;
  private lastReceivedReactionTime: number = 0;
  private reactionBubbleTimeout?: number;

  // Tutorial Modal Elements
  private tutorialModal!: HTMLElement;
  private btnCloseTutorialX!: HTMLButtonElement;
  private tutorialStepBadge!: HTMLElement;
  private tutorialTitle!: HTMLElement;
  private tutorialVisualBox!: HTMLElement;
  private tutorialDescription!: HTMLElement;
  private tutorialDots!: HTMLElement;
  private btnTutorialPrev!: HTMLButtonElement;
  private btnTutorialNext!: HTMLButtonElement;
  private btnMenuTutorial!: HTMLButtonElement;
  private currentTutorialStep: number = 0;

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
      onStateChange: () => {
        this.render();
        if (this.isLiveDuelActive) {
          this.sendLiveDuelProgress();
        }
      },
      onWin: (stats) => {
        if (this.isLiveDuelActive && this.currentLiveLobbyId) {
          const myId = SudokuGame.getOrCreatePlayerId();
          fetch(`${getApiBaseUrl()}/lobby/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lobbyId: this.currentLiveLobbyId,
              playerId: myId,
              action: 'finish',
              time: stats.timeSeconds,
              score: stats.score,
            }),
          }).catch(() => {});
        }
        this.showWinModal(stats);
      },
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
        const isEn = i18n.getLanguage() === 'en';
        const achTr = ACHIEVEMENT_TRANSLATIONS[ach.id]?.[i18n.getLanguage()];
        const title = achTr?.title || ach.title;
        setTimeout(() => {
          this.showToast(isEn ? `🏅 Achievement unlocked: ${ach.icon} ${title}!` : `🏅 Открыто достижение: ${ach.icon} ${title}!`);
        }, 450);
      },
      onSurgeCaptured: (bonusScore: number) => {
        soundManager.playLineChord(2, ['row', 'col']);
        haptics.fever();
        const isEn = i18n.getLanguage() === 'en';
        this.showToast(isEn ? `⚡ Surge intercepted! +${bonusScore} pts & +45% pulse` : `⚡ Вспышка перехвачена! +${bonusScore} очков и +45% пульса`);
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
            const isEn = i18n.getLanguage() === 'en';
            const comboTaunts = isEn ? [
              `Whoa, combo x${this.game.comboCount}?! Nice acceleration!`,
              `Combo x${this.game.comboCount}! But I'm still faster.`,
              'Impressive tempo... Challenge accepted!',
            ] : [
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
            const isEn = i18n.getLanguage() === 'en';
            const mistakeTaunts = isEn ? [
              'A mistake! My algorithm never makes such misses.',
              'Lost an attempt! Your focus is slipping.',
              'Nerves breaking? Speed demands pure precision!',
            ] : [
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
            const isEn = i18n.getLanguage() === 'en';
            this.showAiBotTaunt(isEn ? '🔥 FEVER Mode?! Overclocking processor cores!' : '🔥 Режим FEVER?! Форсирую ядра процессора!', 3000);
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
    this.settingNotifyBtn = document.getElementById('setting-notify-btn') as HTMLButtonElement | null;
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

    // Enter Friend Challenge Modal
    this.btnOpenEnterChallenge = document.getElementById('btn-open-enter-challenge') as HTMLButtonElement;
    this.enterChallengeModal = document.getElementById('enter-challenge-modal')!;
    this.btnCloseEnterChallengeX = document.getElementById('btn-close-enter-challenge-x') as HTMLButtonElement;
    this.inputChallengeCode = document.getElementById('input-challenge-code') as HTMLInputElement;
    this.btnPasteChallengeCode = document.getElementById('btn-paste-challenge-code') as HTMLButtonElement;
    this.btnSubmitChallengeCode = document.getElementById('btn-submit-challenge-code') as HTMLButtonElement;

    // 1v1 Live Multiplayer Lobby
    this.modeCardLiveDuel = document.getElementById('mode-card-live-duel') || undefined;
    this.liveLobbyModal = document.getElementById('live-lobby-modal') || undefined;
    this.btnCloseLiveLobbyX = (document.getElementById('btn-close-live-lobby-x') as HTMLButtonElement) || undefined;
    this.tabLiveCreate = (document.getElementById('tab-live-create') as HTMLButtonElement) || undefined;
    this.tabLiveJoin = (document.getElementById('tab-live-join') as HTMLButtonElement) || undefined;
    this.livePanelCreate = document.getElementById('live-panel-create') || undefined;
    this.livePanelJoin = document.getElementById('live-panel-join') || undefined;
    this.liveDiffPills = Array.from(document.querySelectorAll('.live-diff-pill'));
    this.btnCreateLiveRoom = (document.getElementById('btn-create-live-room') as HTMLButtonElement) || undefined;
    this.inputLiveCode = (document.getElementById('input-live-code') as HTMLInputElement) || undefined;
    this.btnPasteLiveCode = (document.getElementById('btn-paste-live-code') as HTMLButtonElement) || undefined;
    this.btnJoinLiveRoom = (document.getElementById('btn-join-live-room') as HTMLButtonElement) || undefined;
    this.liveLobbyViewMain = document.getElementById('live-lobby-view-main') || undefined;
    this.liveLobbyViewWaiting = document.getElementById('live-lobby-view-waiting') || undefined;
    this.liveLobbyViewCountdown = document.getElementById('live-lobby-view-countdown') || undefined;
    this.liveWaitingCode = document.getElementById('live-waiting-code') || undefined;
    this.liveWaitingDiff = document.getElementById('live-waiting-diff') || undefined;
    this.btnCopyLiveLink = (document.getElementById('btn-copy-live-link') as HTMLButtonElement) || undefined;
    this.btnShareLiveLink = (document.getElementById('btn-share-live-link') as HTMLButtonElement) || undefined;
    this.btnCancelLiveRoom = (document.getElementById('btn-cancel-live-room') as HTMLButtonElement) || undefined;
    this.btnLiveQuickMatch = (document.getElementById('btn-live-quick-match') as HTMLButtonElement) || undefined;
    this.liveWaitingRoomBox = document.getElementById('live-waiting-room-box') || undefined;
    this.liveWaitingQuickBox = document.getElementById('live-waiting-quick-box') || undefined;
    this.liveQuickDiffLabel = document.getElementById('live-quick-diff-label') || undefined;
    this.liveWaitingStatusLabel = document.getElementById('live-waiting-status-label') || undefined;
    this.liveCountdownNumber = document.getElementById('live-countdown-number') || undefined;
    this.liveCdHostName = document.getElementById('live-cd-host-name') || undefined;
    this.liveCdGuestName = document.getElementById('live-cd-guest-name') || undefined;

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

    // Tutorial Modal
    this.btnMenuTutorial = document.getElementById('btn-menu-tutorial') as HTMLButtonElement;
    this.tutorialModal = document.getElementById('tutorial-modal')!;
    this.btnCloseTutorialX = document.getElementById('btn-close-tutorial-x') as HTMLButtonElement;
    this.tutorialStepBadge = document.getElementById('tutorial-step-badge')!;
    this.tutorialTitle = document.getElementById('tutorial-title')!;
    this.tutorialVisualBox = document.getElementById('tutorial-visual-box')!;
    this.tutorialDescription = document.getElementById('tutorial-description')!;
    this.tutorialDots = document.getElementById('tutorial-dots')!;
    this.btnTutorialPrev = document.getElementById('btn-tutorial-prev') as HTMLButtonElement;
    this.btnTutorialNext = document.getElementById('btn-tutorial-next') as HTMLButtonElement;

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

    // Platform adaptation: Yandex Games
    yandexBridge.onLanguageDetected((detectedLang) => {
      i18n.applyPlatformDetectedLanguage(detectedLang);
    });

    if (yandexBridge.isYandex()) {
      document.body.classList.add('platform-yandex');
      const yLang = yandexBridge.getLanguage();
      if (yLang) {
        i18n.applyPlatformDetectedLanguage(yLang);
      }
      this.updateYandexSettingsBox();
      this.loadYandexCloudData();
    }

    // Initialize i18n DOM translations and event listener
    i18n.detectLanguage();
    i18n.applyTranslationsToDOM();
    i18n.onLanguageChange(() => {
      this.updateDifficultyPillsForMode();
      this.updateBoardSkinButtons();
      this.updateDailyInfoOnMenu();
      this.updateTgMenuPill();
      this.updateLeagueViews();
      this.updateYandexSettingsBox();
      this.updateSoundButtons(soundManager.isSoundEnabled());
      this.updateThemeButtons(document.documentElement.getAttribute('data-theme') || 'dark');
      this.renderTutorialStep();
      this.renderDuelHistory();
      this.renderSeasonArchive();
      this.renderPlayerSeasonMedals();
    });

    // Background cloud sync on start
    setTimeout(() => {
      this.syncWithCloud(false);
    }, 800);

    // First launch onboarding tutorial check
    setTimeout(() => {
      if (!localStorage.getItem('sudoku_pulse_tutorial_seen')) {
        this.openTutorial(0);
      }
    }, 600);
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
      this.updateYandexSettingsBox();
    }

    if (screen === 'game') {
      yandexBridge.gameplayStart();
      this.startTimer();
      this.render();
    } else {
      yandexBridge.gameplayStop();
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
          const isEn = i18n.getLanguage() === 'en';
          this.showToast(isEn ? '▶️ Game restored successfully!' : '▶️ Игра успешно восстановлена!');
        }
      });
    }

    if (this.btnMenuTgAuth) {
      this.btnMenuTgAuth.addEventListener('click', () => {
        if (yandexBridge.isYandex()) {
          soundManager.playSelect();
          yandexBridge.openAuth().then(() => {
            this.updateTgMenuPill();
            this.updateYandexSettingsBox();
            this.loadYandexCloudData();
          });
          return;
        }
        this.openTgAuthModal();
      });
    }

    if (this.menuLeagueBadge) {
      this.menuLeagueBadge.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.selection();
        this.showStatsModal();
        this.switchStatsTab('profile');
      });
    }

    const btnYandexAuth = document.getElementById('btn-yandex-auth');
    if (btnYandexAuth) {
      btnYandexAuth.addEventListener('click', () => {
        soundManager.playSelect();
        yandexBridge.openAuth().then(() => {
          this.updateTgMenuPill();
          this.updateYandexSettingsBox();
          this.loadYandexCloudData();
        });
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

    if (this.btnMenuTutorial) {
      this.btnMenuTutorial.addEventListener('click', () => {
        soundManager.playSelect();
        this.openTutorial(0);
      });
    }

    if (this.btnCloseTutorialX) {
      this.btnCloseTutorialX.addEventListener('click', () => {
        soundManager.playSelect();
        this.closeTutorial();
      });
    }

    if (this.btnTutorialPrev) {
      this.btnTutorialPrev.addEventListener('click', () => {
        soundManager.playSelect();
        if (this.currentTutorialStep > 0) {
          this.renderTutorialStep(this.currentTutorialStep - 1);
        }
      });
    }

    if (this.btnTutorialNext) {
      this.btnTutorialNext.addEventListener('click', () => {
        soundManager.playSelect();
        if (this.currentTutorialStep < 4) {
          this.renderTutorialStep(this.currentTutorialStep + 1);
        } else {
          this.closeTutorial();
        }
      });
    }

    // Prevent browser context menu and text selection callouts on board and UI (Yandex req 1.6.1.8 & 1.6.2.7)
    document.addEventListener('contextmenu', (e) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
      }
    });

    // Wire up Yandex Game pause / resume API callbacks (Yandex req 1.19.4)
    yandexBridge.setPauseResumeCallbacks(
      () => {
        if (this.currentScreen === 'game' && this.game.status === 'playing') {
          this.game.pauseTimer();
          this.pauseOverlay.classList.remove('hidden');
        }
      },
      () => {
        if (this.currentScreen === 'game' && this.game.status === 'playing') {
          this.pauseOverlay.classList.add('hidden');
          this.game.resumeTimer();
        }
      }
    );

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
        this.triggerInterstitialAd();
      });
    }

    const btnCloseGameOverX = document.getElementById('btn-close-gameover-x');
    if (btnCloseGameOverX) {
      btnCloseGameOverX.addEventListener('click', () => {
        this.gameOverModal.classList.add('hidden');
        this.updateScreenBackButton();
        this.triggerInterstitialAd();
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

    // Stats Modal Navigation Tabs
    const statsNavTabs = document.querySelectorAll<HTMLButtonElement>('.stats-nav-tab');
    statsNavTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-stats-tab');
        if (target) {
          soundManager.playSelect();
          this.switchStatsTab(target);
        }
      });
    });

    // 1v1 Live Duel Rematch Buttons (Win & Defeat Modals)
    const btnRematchWin = document.getElementById('btn-duel-rematch');
    if (btnRematchWin) {
      btnRematchWin.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.light();
        this.requestDuelRematch();
      });
    }

    const btnRematchLoss = document.getElementById('btn-duel-loss-rematch');
    if (btnRematchLoss) {
      btnRematchLoss.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.light();
        this.requestDuelRematch();
      });
    }

    // 1v1 Live Quick Reactions (Emoji bar)
    const liveReactionBtns = document.querySelectorAll<HTMLButtonElement>('.live-reaction-btn');
    liveReactionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-reaction') || '⚡';
        this.sendLiveReaction(emoji);
      });
    });

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
      this.enterChallengeModal,
      this.liveLobbyModal
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
          this.showToast(i18n.getLanguage() === 'en' ? '⚠️ Enter @username, Telegram ID or sync key' : '⚠️ Введите @username, Telegram ID или ключ');
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
      this.stopLiveLobbyPolling();
      this.currentLiveLobbyId = null;
      this.isLiveDuelActive = false;
      if (this.game.status === 'completed' || this.game.status === 'gameover' || this.game.checkWin()) {
        try { localStorage.removeItem('sudoku_pulse_saved_game_v3'); } catch {}
      }
      this.showScreen('menu');
      this.updateDailyInfoOnMenu();
    });

    // Language switch buttons
    const btnRu = document.getElementById('lang-btn-ru');
    const btnEn = document.getElementById('lang-btn-en');
    btnRu?.addEventListener('click', () => {
      soundManager.playSelect();
      haptics.selection();
      i18n.setLanguage('ru');
    });
    btnEn?.addEventListener('click', () => {
      soundManager.playSelect();
      haptics.selection();
      i18n.setLanguage('en');
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
        const req = BOARD_SKINS_CONFIG[skinKey];
        const stats = SudokuGame.getPlayerStats();
        const lang = i18n.getLanguage();
        if (req && stats.totalScore < req.minScore) {
          const needed = (req.minScore - stats.totalScore).toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU');
          const leagueName = lang === 'en' ? req.leagueEn : req.leagueRu;
          const msg = lang === 'en'
            ? `🔒 Unlocks in ${leagueName} League! Need ${needed} more points.`
            : `🔒 Стиль откроется в лиге: ${leagueName}! Нужно ещё ${needed} очков.`;
          this.showToast(msg);
          haptics.error();
          return;
        }

        this.setBoardSkin(skinKey);
        haptics.selection();
        const appliedMsg = lang === 'en' ? '🎨 Grid skin applied!' : '🎨 Применён скин сетки!';
        this.showToast(appliedMsg);
      });
    });

    // Pause / Resume
    this.pauseBtn.addEventListener('click', () => this.game.togglePause());
    this.resumeBtn.addEventListener('click', () => this.game.togglePause());

    // Toolbar
    this.notesBtn.addEventListener('click', () => this.game.toggleNotesMode());
    this.undoBtn.addEventListener('click', () => this.game.undo());
    this.eraseBtn.addEventListener('click', () => this.game.eraseCell());

    this.hintBtn.addEventListener('click', () => {
      if (this.game.hintsRemaining > 0) {
        const explanation = this.game.giveHint();
        if (explanation) {
          this.showToast(explanation);
        }
      } else {
        const isEn = i18n.getLanguage() === 'en';
        this.showMockAd(isEn ? '🎁 Reward: +1 Hint' : '🎁 Награда: +1 Подсказка', () => {
          this.game.addBonusHint();
          this.showToast(isEn ? '🎉 Extra hint granted!' : '🎉 Получена дополнительная подсказка!');
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
          const isEn = i18n.getLanguage() === 'en';
          if (this.game.pinnedNumber === num) {
            this.showToast(isEn ? `📌 Number ${num} pinned for quick entry!` : `📌 Цифра ${num} зафиксирована для быстрого ввода!`);
          } else {
            this.showToast(isEn ? '📌 Pin removed' : '📌 Фиксация снята');
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
      this.stopLiveLobbyPolling();
      this.currentLiveLobbyId = null;
      this.isLiveDuelActive = false;
      this.stopConfetti();
      this.triggerInterstitialAd();
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
      this.stopLiveLobbyPolling();
      this.currentLiveLobbyId = null;
      this.isLiveDuelActive = false;
      this.stopConfetti();
      this.stopAiBotDuel();
      this.triggerInterstitialAd();
      try { localStorage.removeItem('sudoku_pulse_saved_game_v3'); } catch {}
      this.showScreen('menu');
      this.updateDailyInfoOnMenu();
    });

    // Share score card & Challenge friend buttons
    this.btnDailyShare.addEventListener('click', () => {
      this.shareResultToTelegram();
    });

    this.btnChallengeShare.addEventListener('click', () => {
      this.shareChallengeToTelegram();
    });

    if (this.btnOpenEnterChallenge) {
      this.btnOpenEnterChallenge.addEventListener('click', () => {
        soundManager.playSelect();
        haptics.light();
        this.enterChallengeModal?.classList.remove('hidden');
        if (this.inputChallengeCode) this.inputChallengeCode.value = '';
      });
    }

    if (this.btnCloseEnterChallengeX) {
      this.btnCloseEnterChallengeX.addEventListener('click', () => {
        this.enterChallengeModal?.classList.add('hidden');
      });
    }

    if (this.btnPasteChallengeCode) {
      this.btnPasteChallengeCode.addEventListener('click', async () => {
        soundManager.playSelect();
        const isEn = i18n.getLanguage() === 'en';
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text && this.inputChallengeCode) {
              this.inputChallengeCode.value = text.trim();
              this.showToast(isEn ? '📋 Pasted from clipboard' : '📋 Вставлено из буфера');
              return;
            }
          }
        } catch {}
        this.showToast(isEn ? 'Paste your challenge code into the field' : 'Вставьте код вызова в поле ввода');
      });
    }

    if (this.btnSubmitChallengeCode) {
      this.btnSubmitChallengeCode.addEventListener('click', () => {
        soundManager.playSelect();
        const isEn = i18n.getLanguage() === 'en';
        const code = (this.inputChallengeCode?.value || '').trim();
        if (!code) {
          this.showToast(isEn ? '⚠️ Please enter a challenge code' : '⚠️ Введите или вставьте код вызова');
          return;
        }
        const success = this.handleIncomingChallenge(code);
        if (success) {
          this.enterChallengeModal?.classList.add('hidden');
        } else {
          this.showToast(isEn ? '❌ Invalid challenge code format.' : '❌ Не удалось распознать код вызова.');
          haptics.error();
        }
      });
    }

    // 1v1 Live Multiplayer Lobby Listeners
    if (this.modeCardLiveDuel) {
      this.modeCardLiveDuel.addEventListener('click', () => {
        this.openLiveLobbyModal();
      });
    }

    if (this.btnCloseLiveLobbyX) {
      this.btnCloseLiveLobbyX.addEventListener('click', () => {
        this.stopLiveLobbyPolling();
        this.liveLobbyModal?.classList.add('hidden');
      });
    }

    if (this.tabLiveCreate) {
      this.tabLiveCreate.addEventListener('click', () => {
        soundManager.playSelect();
        this.switchLiveTab('create');
      });
    }

    if (this.tabLiveJoin) {
      this.tabLiveJoin.addEventListener('click', () => {
        soundManager.playSelect();
        this.switchLiveTab('join');
      });
    }

    this.liveDiffPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        soundManager.playSelect();
        this.liveDiffPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedLiveDiff = (pill.getAttribute('data-diff') as Difficulty) || 'medium';
      });
    });

    if (this.btnCreateLiveRoom) {
      this.btnCreateLiveRoom.addEventListener('click', () => {
        soundManager.playSelect();
        this.createLiveRoom();
      });
    }

    if (this.btnPasteLiveCode) {
      this.btnPasteLiveCode.addEventListener('click', async () => {
        soundManager.playSelect();
        const isEn = i18n.getLanguage() === 'en';
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text && this.inputLiveCode) {
              const codeMatch = text.match(/\b([0-9]{4,6})\b/);
              this.inputLiveCode.value = codeMatch ? codeMatch[1] : text.trim();
              this.showToast(isEn ? '📋 Pasted code' : '📋 Код вставлен');
              return;
            }
          }
        } catch {}
        this.showToast(isEn ? 'Paste 4-digit code' : 'Вставьте 4-значный код комнаты');
      });
    }

    if (this.btnJoinLiveRoom) {
      this.btnJoinLiveRoom.addEventListener('click', () => {
        soundManager.playSelect();
        const code = (this.inputLiveCode?.value || '').trim();
        this.joinLiveRoom(code);
      });
    }

    if (this.btnCopyLiveLink) {
      this.btnCopyLiveLink.addEventListener('click', () => {
        soundManager.playSelect();
        this.copyLiveRoomLink();
      });
    }

    if (this.btnShareLiveLink) {
      this.btnShareLiveLink.addEventListener('click', () => {
        soundManager.playSelect();
        this.shareLiveRoomLink();
      });
    }

    if (this.btnLiveQuickMatch) {
      this.btnLiveQuickMatch.addEventListener('click', () => {
        this.startQuickMatch();
      });
    }

    if (this.btnCancelLiveRoom) {
      this.btnCancelLiveRoom.addEventListener('click', () => {
        soundManager.playSelect();
        this.stopLiveLobbyPolling();
        this.isQuickMatchWaiting = false;
        if (this.liveLobbyViewMain) this.liveLobbyViewMain.classList.remove('hidden');
        if (this.liveLobbyViewWaiting) this.liveLobbyViewWaiting.classList.add('hidden');
      });
    }

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
        const isEn = i18n.getLanguage() === 'en';
        const key = this.getSyncKey();
        navigator.clipboard.writeText(key).then(() => {
          this.showToast(isEn ? `📋 Key copied to clipboard: ${key}` : `📋 Ключ скопирован в буфер: ${key}`);
        }).catch(() => {
          this.showToast(isEn ? `Key: ${key}` : `Ключ: ${key}`);
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
        const isEn = i18n.getLanguage() === 'en';
        if (this.notificationsEnabled) {
          this.showToast(isEn ? '🔔 Daily Pulse morning reminders enabled in Telegram' : '🔔 Утренние напоминания Daily Pulse в Telegram включены');
        } else {
          this.showToast(isEn ? '🔕 Telegram reminders disabled' : '🔕 Напоминания в Telegram отключены');
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
          const isEn = i18n.getLanguage() === 'en';
          this.showToast(isEn ? `⚔️ Duel vs ${this.activeChallenge.challenger} started! Beat their record!` : `⚔️ Дуэль с ${this.activeChallenge.challenger} началась! Побивайте рекорд!`);
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
          const isEn = i18n.getLanguage() === 'en';
          this.showToast(isEn ? '⚠️ Please enter sync key' : '⚠️ Введите ключ синхронизации');
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
      const isEn = i18n.getLanguage() === 'en';
      this.showToast(isEn ? `✅ Nickname saved: ${name}` : `✅ Никнейм сохранён: ${name}`);
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
      const isEn = i18n.getLanguage() === 'en';
      this.showMockAd(isEn ? '❤️ Second Chance: +1 Life' : '❤️ Второй шанс: +1 Жизнь', () => {
        soundManager.stopFeverTrack();
        this.game.reviveSecondChance();
        this.showToast(isEn ? '❤️ Second chance granted!' : '❤️ Вы получили второй шанс!');
      });
    });

    this.restartGameOverBtn.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.stopLiveLobbyPolling();
      this.currentLiveLobbyId = null;
      this.isLiveDuelActive = false;
      this.triggerInterstitialAd();
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
      this.stopLiveLobbyPolling();
      this.currentLiveLobbyId = null;
      this.isLiveDuelActive = false;
      this.stopAiBotDuel();
      this.triggerInterstitialAd();
      try { localStorage.removeItem('sudoku_pulse_saved_game_v3'); } catch {}
      this.showScreen('menu');
      this.updateDailyInfoOnMenu();
    });

    // Keyboard support (Arrows, WASD, Russian keys, Numpad)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.currentScreen !== 'game') return;
      if (this.game.status === 'completed' || this.game.status === 'gameover') return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Desktop navigation: Arrow keys or WASD / ЦФЫВ
      let moveDir: 'up' | 'down' | 'left' | 'right' | null = null;
      if (e.key === 'ArrowUp' || code === 'KeyW' || key === 'w' || key === 'ц') moveDir = 'up';
      else if (e.key === 'ArrowDown' || code === 'KeyS' || key === 's' || key === 'ы') moveDir = 'down';
      else if (e.key === 'ArrowLeft' || code === 'KeyA' || key === 'a' || key === 'ф') moveDir = 'left';
      else if (e.key === 'ArrowRight' || code === 'KeyD' || key === 'd' || key === 'в') moveDir = 'right';

      if (moveDir) {
        e.preventDefault();
        this.handleMoveKey(moveDir);
        return;
      }

      // Number input (1-9 and Numpad 1-9)
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        this.game.inputNumber(num);
        return;
      }

      // Erase (Backspace, Delete, 0, Numpad0)
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || code === 'Numpad0') {
        e.preventDefault();
        this.game.eraseCell();
        return;
      }

      // Notes mode toggle ('n' / 'т')
      if (key === 'n' || key === 'т') {
        this.game.toggleNotesMode();
        return;
      }

      // Undo (Ctrl+Z / Cmd+Z or 'z' / 'я')
      if ((e.ctrlKey || e.metaKey) && (key === 'z' || key === 'я')) {
        e.preventDefault();
        this.game.undo();
        return;
      }

      // Hint ('h' / 'р')
      if (key === 'h' || key === 'р') {
        this.hintBtn.click();
        return;
      }

      // Pause ('Escape', 'p' / 'з')
      if (e.key === 'Escape' || key === 'p' || key === 'з') {
        this.game.togglePause();
        return;
      }
    });
  }

  private updateDifficultyPillsForMode() {
    const lang = i18n.getLanguage();
    const isEn = lang === 'en';
    const labels: Record<Difficulty, { normal: string; fog: string; ai: string }> = {
      easy: {
        normal: isEn ? 'Easy' : 'Легкий',
        fog: isEn ? 'Easy (5 🗼)' : 'Легкий (5 🗼)',
        ai: '🟢 PulseBot v1',
      },
      medium: {
        normal: isEn ? 'Medium' : 'Средний',
        fog: isEn ? 'Medium (3 🗼)' : 'Средний (3 🗼)',
        ai: '🟡 CyberPulse v2',
      },
      hard: {
        normal: isEn ? 'Hard' : 'Сложный',
        fog: isEn ? 'Hard (1 🗼)' : 'Сложный (1 🗼)',
        ai: '🔴 NeuralPulse v3',
      },
      expert: {
        normal: isEn ? 'Expert' : 'Эксперт',
        fog: isEn ? 'Expert (0 🗼)' : 'Эксперт (0 🗼)',
        ai: '🔥 QuantumPulse v4',
      },
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
    const lang = i18n.getLanguage();

    perks.forEach((perk) => {
      const perkTr = PERK_TRANSLATIONS[perk.id]?.[lang];
      const pName = perkTr?.name || perk.name;
      const pDesc = perkTr?.desc || perk.description;

      const card = document.createElement('div');
      card.className = 'perk-card';
      card.innerHTML = `
        <div class="perk-icon-lg">${perk.icon}</div>
        <div class="perk-info">
          <div class="perk-title">${pName}</div>
          <div class="perk-desc">${pDesc}</div>
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
            easy: lang === 'en' ? 'PulseBot v1 (Novice)' : 'PulseBot v1 (Новичок)',
            medium: lang === 'en' ? 'CyberPulse v2 (Pro)' : 'CyberPulse v2 (Профи)',
            hard: lang === 'en' ? 'NeuralPulse v3 (Grandmaster)' : 'NeuralPulse v3 (Гроссмейстер)',
            expert: lang === 'en' ? 'QuantumPulse v4 (Overmind)' : 'QuantumPulse v4 (Сверхразум)',
          };
          const duelStartedMsg = lang === 'en' ? `🤖 Duel started vs ${botNames[this.game.difficulty] || 'PulseBot'}!` : `🤖 Дуэль началась против ${botNames[this.game.difficulty] || 'PulseBot'}!`;
          this.showToast(duelStartedMsg);
        }
        if (this.game.isFogActive()) {
          const beaconsMap: Record<Difficulty, number> = { easy: 5, medium: 3, hard: 1, expert: 0 };
          const bCount = beaconsMap[this.game.difficulty];
          if (bCount === 0) {
            this.showToast(lang === 'en' ? '🌌 Dark Sector (Expert): 0 beacons! Scan with cursor (3s echo).' : '🌌 Тёмный сектор (Эксперт): 0 маяков! Сканируйте поле курсором (эхо 3 сек).');
          } else {
            this.showToast(lang === 'en' ? `🌌 Dark Sector: starting beacons — ${bCount}. Scanner echo: 3s!` : `🌌 Тёмный сектор: стартовых маяков — ${bCount}. Эхо-след сканера: 3 сек!`);
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
    const onLabel = t('setting_btn_on', 'Вкл');
    const offLabel = t('setting_btn_off', 'Выкл');
    this.settingSoundBtn.textContent = enabled ? onLabel : offLabel;
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
    const isEn = i18n.getLanguage() === 'en';
    const labels: Record<string, { icon: string; ru: string; en: string }> = {
      dark: { icon: '⚡', ru: 'Кибер-Неон', en: 'Cyber Neon' },
      synthwave: { icon: '🌆', ru: 'Синтвейв 80-х', en: 'Synthwave 80s' },
      matrix: { icon: '🟢', ru: 'Матрица', en: 'Matrix' },
      oled: { icon: '🌑', ru: 'ОЛЕД (Черная)', en: 'OLED Black' },
      light: { icon: '☀️', ru: 'Светлая', en: 'Light Neon' },
    };
    const pillLabels: Record<string, { ru: string; en: string }> = {
      dark: { ru: '⚡ Кибер', en: '⚡ Cyber' },
      synthwave: { ru: '🌆 Синтвейв', en: '🌆 Synth' },
      matrix: { ru: '🟢 Матрица', en: '🟢 Matrix' },
      oled: { ru: '🌑 ОЛЕД', en: '🌑 OLED' },
      light: { ru: '☀️ Светлая', en: '☀️ Light' },
    };

    const info = labels[theme] || labels.dark;
    this.themeToggleBtn.textContent = info.icon;
    const themeName = isEn ? info.en : info.ru;
    this.settingThemeBtn.textContent = `${info.icon} ${themeName}`;

    this.themeSkinPills.forEach((pill) => {
      const skinKey = pill.getAttribute('data-skin') || 'dark';
      pill.classList.toggle('active', skinKey === theme);
      const pLabel = pillLabels[skinKey];
      if (pLabel) {
        pill.textContent = isEn ? pLabel.en : pLabel.ru;
      }
    });
  }

  private handleMoveKey(dir: 'up' | 'down' | 'left' | 'right') {
    let r = this.game.selectedCell?.row ?? 4;
    let c = this.game.selectedCell?.col ?? 4;

    switch (dir) {
      case 'up': r = (r - 1 + 9) % 9; break;
      case 'down': r = (r + 1) % 9; break;
      case 'left': c = (c - 1 + 9) % 9; break;
      case 'right': c = (c + 1) % 9; break;
    }

    soundManager.playSelect();
    haptics.selection();
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
    const lang = i18n.getLanguage();
    const locale = lang === 'en' ? 'en-US' : 'ru-RU';
    const today = new Date().toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
    });
    this.menuDailyDate.textContent = lang === 'en' ? `Today's Challenge: ${today}` : `Вызов на сегодня: ${today}`;

    const stats = SudokuGame.getPlayerStats();
    evaluateAllAchievements(stats);
    SudokuGame.savePlayerStats(stats);
    this.menuDailyStreak.textContent = lang === 'en' ? `🔥 ${stats.dailyStreak} d.` : `🔥 ${stats.dailyStreak} дн.`;

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
      this.btnMenuContinue.style.display = hasSave ? 'flex' : 'none';
      if (hasSave && this.menuContinueMeta) {
        try {
          const raw = localStorage.getItem('sudoku_pulse_saved_game_v3');
          if (raw) {
            const data = JSON.parse(raw);
            const isEn = lang === 'en';
            const mLabels: Record<string, string> = {
              classic: isEn ? 'Classic' : 'Классика',
              fog: isEn ? 'Dark Sector' : 'Тёмный сектор',
              daily: 'Daily Pulse',
              run: isEn ? `Pulse Run (Stage ${data.runStage || 1})` : `Забег (Этап ${data.runStage || 1})`,
              ai_duel: isEn ? 'Pulse AI Duel' : 'Pulse AI Дуэль',
            };
            const dLabels: Record<string, string> = {
              easy: isEn ? 'Easy' : 'Легкий',
              medium: isEn ? 'Medium' : 'Средний',
              hard: isEn ? 'Hard' : 'Сложный',
              expert: isEn ? 'Expert' : 'Эксперт',
            };
            const mins = Math.floor((data.timerSeconds || 0) / 60);
            const secs = (data.timerSeconds || 0) % 60;
            const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            this.menuContinueMeta.textContent = `${mLabels[data.mode] || (isEn ? 'Game' : 'Игра')} • ${dLabels[data.difficulty] || ''} • ${timeStr}`;
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
    const isEn = i18n.getLanguage() === 'en';
    // Mode badge
    const modeNames: Record<GameMode, string> = {
      classic: isEn ? '⚡ Classic' : '⚡ Классика',
      fog: isEn ? '🌌 Dark Sector' : '🌌 Тёмный сектор',
      daily: '📅 Daily Pulse',
      run: isEn ? `🚀 Run (Stage ${this.game.runStage})` : `🚀 Забег (Этап ${this.game.runStage})`,
      ai_duel: isEn ? '🤖 AI Duel' : '🤖 AI Дуэль',
    };
    this.gameModeBadge.textContent = modeNames[this.game.mode];

    // Perk badge
    if (this.game.activePerks.length > 0) {
      if (this.game.activePerks.length === 1) {
        const perk = this.game.activePerks[0];
        const lvlStr = (perk.level && perk.level > 1) ? ` ${formatRomanLevel(perk.level)}` : '';
        const perkTr = PERK_TRANSLATIONS[perk.id]?.[isEn ? 'en' : 'ru'];
        const pName = perkTr?.name || perk.name;
        this.gamePerkBadge.textContent = `${perk.icon} ${pName}${lvlStr}`;
      } else {
        const icons = this.game.activePerks.map((p) => {
          const lvl = p.level && p.level > 1 ? formatRomanLevel(p.level) : '';
          return `${p.icon}${lvl ? ` ${lvl}` : ''}`;
        }).join(' ');
        this.gamePerkBadge.textContent = `${icons} (${this.game.activePerks.length})`;
      }
      this.gamePerkBadge.title = this.game.activePerks.map((p) => {
        const lvlStr = (p.level && p.level > 1) ? ` (${formatRomanLevel(p.level)})` : '';
        const perkTr = PERK_TRANSLATIONS[p.id]?.[isEn ? 'en' : 'ru'];
        const pName = perkTr?.name || p.name;
        const pDesc = perkTr?.desc || p.description;
        return `${p.icon} ${pName}${lvlStr}: ${pDesc}`;
      }).join('\n');
      this.gamePerkBadge.classList.remove('hidden');
    } else {
      this.gamePerkBadge.classList.add('hidden');
    }

    // Score
    this.scoreCounter.textContent = this.game.score.toLocaleString(isEn ? 'en-US' : 'ru-RU');

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
    const isEn = i18n.getLanguage() === 'en';

    if (this.game.isFeverMode && this.game.status === 'playing') {
      this.comboBadge.textContent = `🔥 FEVER OVERDRIVE! 10x`;
      this.comboBadge.className = 'combo-badge fever';
      this.pulseFill.classList.add('fever');
      this.pulseStatusText.textContent = isEn ? `Remaining: ${this.game.feverSecondsLeft}s!` : `Осталось: ${this.game.feverSecondsLeft} сек!`;
    } else {
      soundManager.stopFeverTrack();
      this.comboBadge.className = 'combo-badge';
      this.pulseFill.classList.remove('fever');

      if (this.game.comboCount >= 2) {
        this.comboBadge.textContent = `🔥 x${this.game.comboMultiplier.toFixed(1)} COMBO (${this.game.comboCount})`;
        this.pulseStatusText.textContent = isEn ? 'Hold the combo rhythm!' : 'Удерживайте комбо-ритм!';
      } else {
        this.comboBadge.textContent = `⚡ PULSE x${this.game.comboMultiplier.toFixed(1)}`;
        this.pulseStatusText.textContent = this.game.comboMultiplier > 1.0
          ? (isEn ? `Booster active: multiplier x${this.game.comboMultiplier.toFixed(1)}!` : `Ускоритель активен: множитель x${this.game.comboMultiplier.toFixed(1)}!`)
          : (isEn ? 'Solve fast for combo!' : 'Решайте быстро для комбо!');
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

    if (this.game.hintsRemaining > 0) {
      this.hintBtnLabel.textContent = t('hint', 'Подсказка');
      this.hintCounterBadge.textContent = this.game.hintsRemaining.toString();
      this.hintCounterBadge.className = 'badge-counter';
    } else {
      this.hintBtnLabel.textContent = t('watch_ad_hint', '+1 Подсказка');
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
    const isEn = i18n.getLanguage() === 'en';
    const locale = isEn ? 'en-US' : 'ru-RU';
    const mins = Math.floor(stats.timeSeconds / 60);
    const secs = stats.timeSeconds % 60;
    this.modalTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.modalScore.textContent = stats.score.toLocaleString(locale);
    this.modalCombo.textContent = `x${stats.maxCombo}`;
    this.modalMistakes.textContent = `${stats.mistakes}/${this.game.maxMistakes}`;

    const modeLabels: Record<GameMode, string> = {
      classic: isEn ? 'Classic' : 'Классический',
      fog: isEn ? 'Dark Sector' : 'Тёмный сектор',
      daily: 'Daily Pulse',
      run: isEn ? `Pulse Run (Stage ${this.game.runStage})` : `Pulse Run (Этап ${this.game.runStage})`,
      ai_duel: isEn ? 'Pulse AI Duel' : 'Pulse AI Дуэль',
    };
    this.modalMode.textContent = modeLabels[stats.mode];

    const diffLabels: Record<Difficulty, string> = {
      easy: isEn ? 'Easy' : 'Легкий',
      medium: isEn ? 'Medium' : 'Средний',
      hard: isEn ? 'Hard' : 'Сложный',
      expert: isEn ? 'Expert' : 'Эксперт',
    };
    if (this.modalDiff) {
      this.modalDiff.textContent = diffLabels[stats.difficulty] || (isEn ? 'Medium' : 'Средний');
    }

    this.stopAiBotDuel();

    const rematchContainer = document.getElementById('duel-rematch-container');
    if (rematchContainer) rematchContainer.classList.add('hidden');

    // 1v1 Live Multiplayer Duel Victory Comparison
    if (this.isLiveDuelActive && this.duelResultBanner) {
      this.duelResultBanner.classList.remove('hidden');
      this.duelResultBanner.className = 'duel-result-banner victory';
      if (this.duelResultTitle) {
        this.duelResultTitle.textContent = isEn ? '🏆 VICTORY IN 1v1 DUEL!' : '🏆 ПОБЕДА В ЖИВОЙ ДУЭЛИ 1v1!';
        this.duelResultTitle.style.color = '#34d399';
      }
      if (this.duelResultText) {
        this.duelResultText.textContent = isEn
          ? `You solved the puzzle faster than ${this.liveOpponentName}! Pure speed victory.`
          : `Вы решили судоку быстрее, чем ${this.liveOpponentName}! Чистая победа на скорости.`;
      }
      soundManager.playDuelWin();

      if (rematchContainer) rematchContainer.classList.remove('hidden');
      const statusEl = document.getElementById('duel-rematch-status');
      if (statusEl) statusEl.classList.add('hidden');
      const btnRematch = document.getElementById('btn-duel-rematch') as HTMLButtonElement | null;
      if (btnRematch) { btnRematch.disabled = false; btnRematch.style.opacity = '1'; }

      this.isLiveDuelActive = false;
      // Note: Live polling remains active to listen for opponent rematch request!
    } else if (stats.mode === 'ai_duel' && this.duelResultBanner) {
      this.duelResultBanner.classList.remove('hidden');
      const botName = `🤖 ${this.aiBotProgress.name}`;
      const botScore = this.aiBotProgress.score || Math.floor(stats.score * 0.8);
      const duelRecord: DuelRecord = {
        id: 'duel_' + Date.now(),
        date: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
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
        this.duelResultTitle.textContent = isEn ? '🎉 YOU WON THE AI DUEL!' : '🎉 ВЫ ПОБЕДИЛИ В ИИ-ДУЭЛИ!';
        this.duelResultTitle.style.color = '#34d399';
      }
      if (this.duelResultText) {
        const scoreDiff = stats.score - botScore;
        this.duelResultText.textContent = isEn
          ? `You outpaced ${botName} and solved the grid faster! Advantage: +${Math.max(0, scoreDiff).toLocaleString(locale)} pts.`
          : `Вы опередили ${botName} и решили сетку быстрее! Преимущество: +${Math.max(0, scoreDiff).toLocaleString(locale)} очков.`;
      }
    } else if (this.activeChallenge && this.duelResultBanner) {
      this.duelResultBanner.classList.remove('hidden');
      const targetScore = this.activeChallenge.targetScore;
      const targetTime = this.activeChallenge.targetTime;
      const challenger = this.activeChallenge.challenger;
      const wonDuel = stats.score > targetScore || (stats.score === targetScore && stats.timeSeconds <= targetTime);

      const duelRecord: DuelRecord = {
        id: 'duel_' + Date.now(),
        date: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
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
          this.duelResultTitle.textContent = isEn ? '🎉 YOU WON THE DUEL!' : '🎉 ВЫ ПОБЕДИЛИ В ДУЭЛИ!';
          this.duelResultTitle.style.color = '#34d399';
        }
        if (this.duelResultText) {
          const scoreDiff = stats.score - targetScore;
          this.duelResultText.textContent = isEn
            ? `Your score (${stats.score.toLocaleString(locale)}) beat ${challenger}'s record (+${scoreDiff.toLocaleString(locale)} pts)!`
            : `Ваш результат (${stats.score.toLocaleString(locale)}) превзошёл рекорд ${challenger} (+${scoreDiff.toLocaleString(locale)} очков)!`;
        }
      } else {
        if (this.duelResultTitle) {
          this.duelResultTitle.textContent = isEn ? '⚔️ Duel Finished' : '⚔️ Дуэль завершена';
          this.duelResultTitle.style.color = '#f59e0b';
        }
        if (this.duelResultText) {
          this.duelResultText.textContent = isEn
            ? `${challenger}'s record: ${targetScore.toLocaleString(locale)} pts. Try again!`
            : `Рекорд ${challenger}: ${targetScore.toLocaleString(locale)} очков. Попробуйте еще раз!`;
        }
      }
    } else if (this.duelResultBanner) {
      this.duelResultBanner.classList.add('hidden');
    }

    if (stats.mode === 'run') {
      const nextStage = this.game.runStage + 1;
      const stageBonus = 1500 * this.game.runStage;
      this.modalWinTitle.textContent = isEn ? `🚀 Stage ${this.game.runStage} Complete!` : `🚀 Этап ${this.game.runStage} пройден!`;
      this.modalSubtitle.textContent = isEn
        ? `Stage bonus: +${stageBonus.toLocaleString(locale)} pts! Select a new perk:`
        : `Бонус за этап: +${stageBonus.toLocaleString(locale)} очков! Выберите новый перк:`;
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
        const perkTr = PERK_TRANSLATIONS[perk.id]?.[isEn ? 'en' : 'ru'];
        const pName = perkTr?.name || perk.name;
        const pDesc = perkTr?.desc || perk.description;
        card.innerHTML = `
          <div class="perk-icon-lg" style="font-size:1.5rem;">${perk.icon}</div>
          <div class="perk-info">
            <div class="perk-title" style="font-size:0.95rem;">${pName}${lvlStr}</div>
            <div class="perk-desc" style="font-size:0.8rem;">${pDesc}</div>
          </div>
        `;
        card.addEventListener('click', () => {
          this.winModal.classList.add('hidden');
          this.stopConfetti();
          soundManager.playCorrect(3);
          this.game.advanceRunStage(perk);
          this.showToast(isEn ? `🚀 Stage ${this.game.runStage}: ${this.game.getRunModifierDescription()}` : `🚀 Этап ${this.game.runStage}: ${this.game.getRunModifierDescription()}`);
        });
        this.runPerksDraft.appendChild(card);
      });
    } else {
      this.modalWinTitle.textContent = isEn ? 'Victory!' : 'Победа!';
      this.modalSubtitle.textContent = isEn ? 'Puzzle solved successfully!' : 'Головоломка успешно решена!';
      this.runStageUpgrade.classList.add('hidden');
      this.playAgainBtn.classList.remove('hidden');
    }

    this.winModal.classList.remove('hidden');
    this.startConfetti();
    this.updateDailyInfoOnMenu();
    this.submitScoreToLeaderboard(stats);
    // Background cloud sync on win
    this.syncWithCloud(false).catch(() => {});

    // Yandex Games: Submit to portal leaderboard & offer review (Points 1 & 4.5.1)
    if (yandexBridge.isYandex()) {
      yandexBridge.submitLeaderboardScore(stats.score);
      setTimeout(() => {
        yandexBridge.promptReviewIfEligible();
      }, 1500);
    }
  }

  private checkUrlChallenge(): boolean {
    return this.handleIncomingChallenge();
  }

  private handleIncomingChallenge(manualInput?: string): boolean {
    const isEn = i18n.getLanguage() === 'en';
    let rawParam: string | null = null;
    let seedParam: string | null = null;
    let diffParam: string | null = null;
    let modeParam: string | null = null;
    let scoreParam: string | null = null;
    let timeParam: string | null = null;
    let challengerParam: string | null = null;
    let lobbyParam: string | null = null;

    if (manualInput) {
      const trimmed = manualInput.trim();
      const lobbyMatch = trimmed.match(/(?:lobby|room)[=_]?([0-9]{4})/i) || trimmed.match(/^([0-9]{4})$/);
      if (lobbyMatch) {
        lobbyParam = lobbyMatch[1];
      }
      const codeMatch = trimmed.match(/(c_[0-9]+_[a-zA-Z0-9_]+)/);
      if (codeMatch) {
        rawParam = codeMatch[1];
      } else {
        try {
          const url = new URL(trimmed.startsWith('http') ? trimmed : `http://dummy.com/${trimmed.startsWith('?') ? '' : '?'}${trimmed}`);
          lobbyParam = lobbyParam || url.searchParams.get('lobby') || url.searchParams.get('room');
          rawParam = url.searchParams.get('start_param') || url.searchParams.get('startapp') || url.searchParams.get('c') || url.searchParams.get('challenge');
          seedParam = url.searchParams.get('seed');
          diffParam = url.searchParams.get('diff');
          modeParam = url.searchParams.get('mode');
          scoreParam = url.searchParams.get('score');
          timeParam = url.searchParams.get('time');
          challengerParam = url.searchParams.get('challenger');
        } catch {}
      }
      if (!rawParam && !seedParam && !lobbyParam) {
        rawParam = trimmed;
      }
    } else {
      const params = new URLSearchParams(window.location.search);
      const tgApp = (window as any).Telegram?.WebApp;
      const tgStartParam = tgApp?.initDataUnsafe?.start_param;
      lobbyParam = params.get('lobby') || params.get('room');
      if (!lobbyParam && tgStartParam) {
        const match = tgStartParam.match(/(?:lobby|room)?_?([0-9]{4})/i);
        if (match) lobbyParam = match[1];
      }
      rawParam = tgStartParam || params.get('start_param') || params.get('startapp') || params.get('tgWebAppStartParam') || params.get('challenge') || params.get('c');
      seedParam = params.get('seed');
      diffParam = params.get('diff');
      modeParam = params.get('mode');
      scoreParam = params.get('score');
      timeParam = params.get('time');
      challengerParam = params.get('challenger');
    }

    if (lobbyParam) {
      setTimeout(() => {
        this.openLiveLobbyModal();
        this.switchLiveTab('join');
        if (this.inputLiveCode) {
          this.inputLiveCode.value = lobbyParam!;
        }
        this.joinLiveRoom(lobbyParam!);
      }, 250);
      return true;
    }

    if (!manualInput && (rawParam === 'daily' || modeParam === 'daily')) {
      setTimeout(() => {
        this.game.startNewGame({ difficulty: 'medium', mode: 'daily', perks: [] });
        this.showScreen('game');
        this.showToast(isEn ? '📅 Daily Pulse launched!' : '📅 Daily Pulse дня запущен!');
      }, 100);
      return true;
    }

    let seed: number | undefined;
    let diff: Difficulty = 'medium';
    let mode: GameMode = 'classic';
    let targetScore = 0;
    let targetTime = 0;
    let challenger = isEn ? 'Friend' : 'Друг';

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
    } else if (seedParam) {
      seed = parseInt(seedParam, 10);
      const validDiffs: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
      diff = validDiffs.includes(diffParam as Difficulty) ? (diffParam as Difficulty) : 'medium';
      mode = ['classic', 'fog', 'daily', 'run'].includes(modeParam as GameMode) ? (modeParam as GameMode) : 'classic';
      targetScore = parseInt(scoreParam || '0', 10) || 0;
      targetTime = parseInt(timeParam || '0', 10) || 0;
      if (challengerParam) challenger = challengerParam;
    }

    if (!seed || isNaN(seed)) return false;

    this.activeChallenge = { seed, diff, mode, targetScore, targetTime, challenger };

    // Format target time
    const tMins = Math.floor(targetTime / 60);
    const tSecs = targetTime % 60;
    const timeStr = targetTime > 0 ? `${tMins.toString().padStart(2, '0')}:${tSecs.toString().padStart(2, '0')}` : '—';

    const diffLabels: Record<Difficulty, string> = {
      easy: isEn ? 'Easy' : 'Легкий',
      medium: isEn ? 'Medium' : 'Средний',
      hard: isEn ? 'Hard' : 'Сложный',
      expert: isEn ? 'Expert' : 'Эксперт',
    };
    const modeLabels: Record<GameMode, string> = {
      classic: isEn ? 'Classic' : 'Классический',
      fog: isEn ? 'Dark Sector' : 'Тёмный сектор',
      daily: 'Daily Pulse',
      run: 'Pulse Run',
      ai_duel: isEn ? 'Pulse AI Duel' : 'Pulse AI Дуэль',
    };

    if (this.challengeChallengerName) this.challengeChallengerName.textContent = challenger;
    if (this.challengeDiff) this.challengeDiff.textContent = diffLabels[diff] || (isEn ? 'Medium' : 'Средний');
    if (this.challengeMode) this.challengeMode.textContent = modeLabels[mode] || (isEn ? 'Classic' : 'Классика');
    if (this.challengeTargetScore) this.challengeTargetScore.textContent = targetScore > 0 ? targetScore.toLocaleString(isEn ? 'en-US' : 'ru-RU') : '—';
    if (this.challengeTargetTime) this.challengeTargetTime.textContent = timeStr;

    // Clean URL params quietly if loaded from page URL
    if (!manualInput) {
      try {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch {}
    }

    // Show challenge invitation modal
    this.showScreen('menu');
    this.challengeModal.classList.remove('hidden');
    haptics.fever();
    soundManager.playSelect();

    return true;
  }

  private async submitScoreToLeaderboard(stats: GameStats) {
    if (yandexBridge.isYandex()) {
      yandexBridge.submitLeaderboardScore(stats.score).catch(() => {});
      this.saveYandexCloudData().catch(() => {});
    }

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
    const isEn = i18n.getLanguage() === 'en';
    this.leaderboardList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">${isEn ? 'Loading server leaderboards...' : 'Загрузка онлайн-рекордов...'}</div>`;

    if (yandexBridge.isYandex()) {
      try {
        const yEntries = await yandexBridge.getLeaderboardEntries('records', 15);
        if (yEntries && yEntries.length > 0) {
          const myPlayerId = SudokuGame.getOrCreatePlayerId();
          this.cachedLeaderboardEntries = yEntries.map((e) => ({
            id: 'y_' + e.rank,
            name: e.name,
            score: e.score,
            date: new Date().toLocaleDateString(isEn ? 'en-US' : 'ru-RU'),
            mode: 'classic' as GameMode,
            playerId: e.isUser ? myPlayerId : undefined,
          }));
          this.currentSeasonId = '';
          this.renderLeaderboardList();
          return;
        }
      } catch (err) {
        console.warn('[Yandex Leaderboard] Fallback to server/local API:', err);
      }
    }

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
      this.leaderboardList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">${isEn ? 'Server unreachable (offline mode)' : 'Онлайн-сервер недоступен (офлайн-режим)'}</div>`;
    }
  }

  private renderLeaderboardList() {
    if (!this.leaderboardList) return;
    const isEn = i18n.getLanguage() === 'en';
    const myPlayerId = SudokuGame.getOrCreatePlayerId();
    let entries = this.cachedLeaderboardEntries;

    if (this.currentLeaderboardModeFilter !== 'all') {
      entries = entries.filter((e) => e.mode === this.currentLeaderboardModeFilter);
    }

    let seasonHeader = '';
    if (this.currentLeaderboardTimeframe === 'season' && this.currentSeasonId) {
      const parts = this.currentSeasonId.split('-W');
      const weekLabel = parts.length === 2 ? (isEn ? `Week ${parts[1]}, ${parts[0]}` : `Неделя ${parts[1]}, ${parts[0]}`) : this.currentSeasonId;
      seasonHeader = `
        <div style="font-size:0.75rem; color:var(--accent); font-weight:600; text-align:center; margin-bottom:8px; padding:4px 8px; background:rgba(99,102,241,0.12); border-radius:6px; border:1px solid rgba(99,102,241,0.25);">
          ⏳ ${isEn ? 'Active season:' : 'Текущий сезон:'} ${weekLabel}
        </div>
      `;
    }

    if (entries.length === 0) {
      this.leaderboardList.innerHTML = seasonHeader + `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">${isEn ? 'No records in this category yet.' : 'Пока нет записей в этом режиме.'}</div>`;
      return;
    }

    this.leaderboardList.innerHTML = seasonHeader + entries.slice(0, 15).map((item, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
      const badge = item.mode === 'run' ? (isEn ? `🚀 St.${item.runStage || 1}` : `🚀 Эт.${item.runStage || 1}`) : item.mode === 'daily' ? '📅 Daily' : item.mode === 'fog' ? (isEn ? '🌌 Sector' : '🌌 Сектор') : item.mode === 'ai_duel' ? (isEn ? '🤖 Duel' : '🤖 Дуэль') : (isEn ? '⚡ Classic' : '⚡ Классика');
      const isMe = item.playerId && item.playerId === myPlayerId;
      const rowBg = isMe ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255,255,255,0.03)';
      const rowBorder = isMe ? 'var(--primary)' : 'var(--border-subtle)';
      const league = getLeagueForScore(item.score);
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-radius:8px; background:${rowBg}; border:1px solid ${rowBorder}; font-size:0.85rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:700; min-width:24px;">${medal}</span>
            <span title="${isEn ? 'League' : 'Лига'}: ${league.name}" style="font-size:0.9rem;">${league.icon}</span>
            <span style="font-weight:600; color:var(--text-main);">${item.name.replace(/</g, '&lt;')}${isMe ? (isEn ? ' <span style="color:var(--accent); font-size:0.75rem;">(You)</span>' : ' <span style="color:var(--accent); font-size:0.75rem;">(Вы)</span>') : ''}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">${badge}</span>
          </div>
          <span style="font-weight:700; color:var(--accent);">${Number(item.score).toLocaleString(isEn ? 'en-US' : 'ru-RU')}</span>
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

    const lang = i18n.getLanguage();
    const isEn = lang === 'en';
    this.achievementsSubtitle.textContent = isEn
      ? `Unlocked ${unlockedIds.size} of ${ACHIEVEMENTS.length} trophies`
      : `Открыто ${unlockedIds.size} из ${ACHIEVEMENTS.length} трофеев`;
    if (this.menuAchCounter) {
      this.menuAchCounter.textContent = `${unlockedIds.size}/${ACHIEVEMENTS.length}`;
    }
    this.achievementsList.innerHTML = '';

    const unlockedLabel = t('ach_unlocked', '✅ Получено');

    ACHIEVEMENTS.forEach((ach) => {
      const isUnlocked = unlockedIds.has(ach.id) || ach.checkUnlocked(stats);
      const { current, target } = ach.getProgress(stats);
      const progress = isUnlocked ? 100 : Math.min(100, Math.round((current / target) * 100));

      const achTr = ACHIEVEMENT_TRANSLATIONS[ach.id]?.[lang];
      const achTitle = achTr?.title || ach.title;
      const achDesc = achTr?.desc || ach.description;

      const card = document.createElement('div');
      card.className = `ach-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-title-row">
            <span class="ach-title">${achTitle}</span>
            <span class="ach-status-badge">${isUnlocked ? unlockedLabel : `${current}/${target}`}</span>
          </div>
          <div class="ach-desc">${achDesc}</div>
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
    const isEn = i18n.getLanguage() === 'en';

    if (yandexBridge.isYandex()) {
      const yName = yandexBridge.getPlayerName();
      if (yName) {
        this.menuTgAuthLabel.textContent = isEn ? `Yandex: ${yName}` : `Яндекс: ${yName}`;
        this.btnMenuTgAuth.style.borderColor = '#fc3f1d';
        this.btnMenuTgAuth.style.color = '#ff6b4a';
        this.btnMenuTgAuth.style.background = 'rgba(252, 63, 29, 0.15)';
      } else {
        this.menuTgAuthLabel.textContent = isEn ? 'Login with Yandex' : 'Войти в Яндекс';
        this.btnMenuTgAuth.style.borderColor = 'rgba(252, 63, 29, 0.4)';
        this.btnMenuTgAuth.style.color = '#ff6b4a';
        this.btnMenuTgAuth.style.background = 'rgba(252, 63, 29, 0.12)';
      }
      return;
    }

    const tgUser = this.getStoredTelegramUser();
    if (tgUser) {
      const name = tgUser.username ? `@${tgUser.username}` : (tgUser.first_name || `TG #${tgUser.id}`);
      this.menuTgAuthLabel.textContent = name;
      this.btnMenuTgAuth.style.borderColor = '#34d399';
      this.btnMenuTgAuth.style.color = '#34d399';
      this.btnMenuTgAuth.style.background = 'rgba(52, 211, 153, 0.12)';
    } else {
      this.menuTgAuthLabel.textContent = isEn ? 'Login with Telegram' : 'Войти через Telegram';
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
    const isEn = i18n.getLanguage() === 'en';
    if (tgUser) {
      this.tgAuthActiveView.classList.remove('hidden');
      this.tgAuthLoginView.classList.add('hidden');
      this.tgAuthUserName.textContent = tgUser.first_name || (tgUser.username ? `@${tgUser.username}` : (isEn ? 'Player' : 'Игрок'));
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
    const isEn = i18n.getLanguage() === 'en';
    if (this.tgQrSpinner) this.tgQrSpinner.style.display = 'flex';
    if (this.tgAuthQrImg) this.tgAuthQrImg.style.display = 'none';
    if (this.tgPollStatusText) this.tgPollStatusText.textContent = isEn ? 'Waiting for confirmation in Telegram...' : 'Ожидание подтверждения в Telegram...';

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
      if (this.tgPollStatusText) this.tgPollStatusText.textContent = isEn ? 'Offline mode (use Bot button or manual entry)' : 'Офлайн режим (используйте кнопку бота или ручной ввод)';
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
    const isEn = i18n.getLanguage() === 'en';
    this.showToast(isEn ? `🎉 Successfully logged in via Telegram (${playerName})!` : `🎉 Успешный вход через Telegram (${playerName})!`);

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
    const isEn = i18n.getLanguage() === 'en';
    this.showToast(isEn ? '🚪 You logged out of Telegram' : '🚪 Вы вышли из аккаунта Telegram');
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
        const isEn = i18n.getLanguage() === 'en';
        this.showToast(isEn ? '☁️ Progress successfully synchronized with Telegram Cloud!' : '☁️ Прогресс успешно синхронизирован с Telegram Cloud!');
      }
    } catch {
      if (showToastNotification) {
        const isEn = i18n.getLanguage() === 'en';
        this.showToast(isEn ? '⚠️ Offline: local progress saved' : '⚠️ Офлайн: локальный прогресс сохранён');
      }
    }
  }

  private async importSyncKey(inputKey: string) {
    const isEn = i18n.getLanguage() === 'en';
    try {
      const key = inputKey.trim();
      const apiBase = `${getApiBaseUrl()}/sync`;
      const res = await fetch(`${apiBase}?key=${encodeURIComponent(key)}`);
      if (!res.ok) {
        this.showToast(isEn ? '❌ Profile with this Telegram/key not found in cloud' : '❌ Профиль с таким Telegram/ключом не найден в облаке');
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
        this.showToast(isEn ? '🎉 Profile and progress connected successfully!' : '🎉 Профиль и прогресс успешно подключены!');
      }
    } catch {
      this.showToast(isEn ? '❌ Device linking error' : '❌ Ошибка при связывании устройств');
    }
  }

  private updateYandexSettingsBox() {
    if (!yandexBridge.isYandex()) return;
    const box = document.getElementById('section-yandex-profile');
    if (box) box.classList.remove('hidden');

    const badge = document.getElementById('yandex-account-badge');
    const btn = document.getElementById('btn-yandex-auth');
    const name = yandexBridge.getPlayerName();
    const isEn = i18n.getLanguage() === 'en';

    if (name) {
      if (badge) {
        badge.textContent = name;
        badge.style.color = '#34d399';
      }
      if (btn) {
        btn.textContent = isEn ? '✓ Yandex Account Connected' : '✓ Яндекс аккаунт подключен';
        btn.setAttribute('disabled', 'true');
        btn.style.opacity = '0.7';
        btn.style.cursor = 'default';
      }
    } else {
      if (badge) {
        badge.textContent = isEn ? 'Guest' : 'Гость';
        badge.style.color = '#f87171';
      }
      if (btn) {
        btn.textContent = isEn ? '🔴 Login with Yandex ID' : '🔴 Войти через Яндекс Паспорт';
        btn.removeAttribute('disabled');
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    }
  }

  private async loadYandexCloudData() {
    if (!yandexBridge.isYandex()) return;
    try {
      const data = await yandexBridge.loadCloudData(['stats', 'theme']);
      if (data && data.stats) {
        SudokuGame.mergePlayerStats(data.stats);
        this.updateDailyInfoOnMenu();
      }
      if (data && data.theme) {
        this.setTheme(data.theme);
      }
    } catch (err) {
      console.warn('[Yandex] Cloud load error:', err);
    }
  }

  private async saveYandexCloudData() {
    if (!yandexBridge.isYandex()) return;
    try {
      const stats = SudokuGame.getPlayerStats();
      const theme = localStorage.getItem('sudoku_theme') || 'dark';
      await yandexBridge.saveCloudData({
        stats,
        theme,
        lastSaved: Date.now(),
      });
    } catch (err) {
      console.warn('[Yandex] Cloud save error:', err);
    }
  }

  private triggerInterstitialAd(onDone?: () => void) {
    if (yandexBridge.isYandex()) {
      soundManager.muteForAd();
      const wasPlaying = this.currentScreen === 'game' && this.game.status === 'playing';
      if (wasPlaying) this.game.pauseTimer();

      yandexBridge.showFullscreenAdv({
        onOpen: () => {
          soundManager.muteForAd();
          if (wasPlaying) this.game.pauseTimer();
        },
        onClose: () => {
          soundManager.unmuteAfterAd();
          if (wasPlaying) this.game.resumeTimer();
          onDone?.();
        },
        onError: () => {
          soundManager.unmuteAfterAd();
          if (wasPlaying) this.game.resumeTimer();
          onDone?.();
        },
      });
    } else {
      onDone?.();
    }
  }

  private async copyTextToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }

  private async tryNativeShare(data: { title: string; text: string; url?: string }): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (err: any) {
        if (err?.name === 'AbortError') return true;
        return false;
      }
    }
    return false;
  }

  private async shareScoreCard() {
    const isEn = i18n.getLanguage() === 'en';
    const mins = Math.floor(this.game.timerSeconds / 60);
    const secs = this.game.timerSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const modeLabels: Record<GameMode, string> = {
      classic: isEn ? 'Classic' : 'Классика',
      fog: isEn ? 'Dark Sector' : 'Тёмный сектор',
      daily: 'Daily Pulse',
      run: isEn ? `Pulse Run (Stage ${this.game.runStage})` : `Pulse Run (Этап ${this.game.runStage})`,
      ai_duel: isEn ? 'Pulse AI Duel' : 'Pulse AI Дуэль',
    };
    const diffLabels: Record<Difficulty, string> = {
      easy: isEn ? 'Easy' : 'Легкий',
      medium: isEn ? 'Medium' : 'Средний',
      hard: isEn ? 'Hard' : 'Сложный',
      expert: isEn ? 'Expert' : 'Эксперт',
    };

    const modeName = modeLabels[this.game.mode] || (isEn ? 'Classic' : 'Классика');
    const diffName = diffLabels[this.game.difficulty] || (isEn ? 'Medium' : 'Средний');

    const title = isEn ? 'Sudoku Pulse — Victory!' : '⚡ Sudoku Pulse — Победа!';
    const text = isEn
      ? `⚡ Sudoku Pulse — Victory!\n🎮 Mode: ${modeName} (${diffName})\n⏱️ Time: ${timeStr} | 💎 Score: ${this.game.score.toLocaleString('en-US')}\n🔥 Max Combo: x${this.game.maxComboAchieved} | ❤️ Mistakes: ${this.game.mistakesCount}/${this.game.maxMistakes}\n🟩🟩🟩🟨🟩\nPlay Sudoku Pulse now!`
      : `⚡ Sudoku Pulse — Победа!\n🎮 Режим: ${modeName} (${diffName})\n⏱️ Время: ${timeStr} | 💎 Очки: ${this.game.score.toLocaleString('ru-RU')}\n🔥 Макс. комбо: x${this.game.maxComboAchieved} | ❤️ Ошибки: ${this.game.mistakesCount}/${this.game.maxMistakes}\n🟩🟩🟩🟨🟩\nСыграй в ритме Sudoku Pulse:`;

    const shareUrl = window.location.origin + window.location.pathname;

    const tgApp = (window as any).Telegram?.WebApp;
    if (tgApp?.openTelegramLink) {
      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
      tgApp.openTelegramLink(tgShareUrl);
      this.showToast(isEn ? '📋 Result copied! Opening Telegram...' : '📋 Результат скопирован! Открываем Telegram...');
      await this.copyTextToClipboard(`${text}\n${shareUrl}`);
      return;
    }

    const shared = await this.tryNativeShare({ title, text, url: shareUrl });
    if (!shared) {
      await this.copyTextToClipboard(`${text}\n${shareUrl}`);
      this.showToast(isEn ? '📋 Result card copied to clipboard!' : '📋 Карточка счёта скопирована в буфер!');
    }
  }

  private async shareChallenge() {
    const isEn = i18n.getLanguage() === 'en';
    const seed = this.game.currentSeed;
    const diff = this.game.difficulty;
    const mode = this.game.mode;
    const score = this.game.score;
    const time = this.game.timerSeconds;
    const tgUser = this.getStoredTelegramUser();
    const myName = (localStorage.getItem('sudoku_player_name') || tgUser?.username || (isEn ? 'Player' : 'Игрок')).replace(/[@_\s]/g, '');

    const mins = Math.floor(time / 60);
    const secs = time % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const diffLabels: Record<Difficulty, string> = {
      easy: isEn ? 'Easy' : 'Легкий',
      medium: isEn ? 'Medium' : 'Средний',
      hard: isEn ? 'Hard' : 'Сложный',
      expert: isEn ? 'Expert' : 'Эксперт',
    };
    const diffName = diffLabels[diff] || (isEn ? 'Medium' : 'Средний');

    const challengeCode = `c_${seed}_${diff}_${mode}_${score}_${time}_${encodeURIComponent(myName)}`;
    const tgApp = (window as any).Telegram?.WebApp;

    let challengeLink = '';
    if (tgApp) {
      challengeLink = `https://t.me/sudoku_pulse_auth_bot/app?startapp=${challengeCode}`;
    } else {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      challengeLink = `${origin}${pathname}?c=${challengeCode}`;
    }

    const title = isEn ? 'Sudoku Pulse — Friend Challenge!' : '⚔️ Sudoku Pulse — Вызов другу!';
    const text = isEn
      ? `⚔️ Challenging you in Sudoku Pulse!\n🎯 My score: ${score.toLocaleString('en-US')} pts in ${timeStr} on "${diffName}".\nCan you beat my record on the exact same grid?\n🔑 Challenge Code: ${challengeCode}`
      : `⚔️ Бросаю вызов в Sudoku Pulse!\n🎯 Мой рекорд: ${score.toLocaleString('ru-RU')} очков за ${timeStr} на сложности "${diffName}".\nСможешь побить мой рекорд на той же сетке? 🚀\n🔑 Код дуэли: ${challengeCode}`;

    if (tgApp?.openTelegramLink) {
      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(challengeLink)}&text=${encodeURIComponent(text)}`;
      tgApp.openTelegramLink(tgShareUrl);
      this.showToast(isEn ? '🔗 Challenge link copied! Opening Telegram...' : '🔗 Ссылка на вызов скопирована! Открываем Telegram...');
      await this.copyTextToClipboard(`${text}\n${challengeLink}`);
      return;
    }

    const shared = await this.tryNativeShare({ title, text, url: challengeLink });
    if (!shared) {
      await this.copyTextToClipboard(`${text}\n${challengeLink}`);
      this.showToast(isEn ? '⚔️ Challenge code and link copied!' : '⚔️ Код дуэли и ссылка скопированы в буфер!');
    }
  }

  private shareChallengeToTelegram() {
    this.shareChallenge();
  }

  private shareResultToTelegram() {
    this.shareScoreCard();
  }

  private showGameOverModal() {
    this.stopAiBotDuel();
    const isEn = i18n.getLanguage() === 'en';
    if (this.game.mode === 'run') {
      this.gameOverSubtitle.textContent = isEn
        ? `Pulse Run ended at Stage ${this.game.runStage}. Your score: ${this.game.score.toLocaleString('en-US')}`
        : `Забег окончен на Этапе ${this.game.runStage}. Ваш счёт: ${this.game.score.toLocaleString('ru-RU')}`;
    } else if (this.game.mode === 'ai_duel') {
      this.gameOverSubtitle.textContent = isEn
        ? `You committed ${this.game.maxMistakes} mistakes in duel against ${this.aiBotProgress.name}.`
        : `Вы совершили ${this.game.maxMistakes} ошибок в дуэли против ${this.aiBotProgress.name}.`;
    } else {
      this.gameOverSubtitle.textContent = isEn
        ? `You made ${this.game.maxMistakes} mistakes.`
        : `Вы совершили ${this.game.maxMistakes} ошибок.`;
    }
    const rematchLossContainer = document.getElementById('duel-loss-rematch-container');
    if (rematchLossContainer) {
      if (this.currentLiveLobbyId) {
        rematchLossContainer.classList.remove('hidden');
      } else {
        rematchLossContainer.classList.add('hidden');
      }
    }
    this.gameOverModal.classList.remove('hidden');
  }

  private showStatsModal() {
    const stats = SudokuGame.getPlayerStats();
    const isEn = i18n.getLanguage() === 'en';
    const locale = isEn ? 'en-US' : 'ru-RU';
    this.statPlayed.textContent = stats.gamesPlayed.toString();
    this.statWon.textContent = stats.gamesWon.toString();
    this.statCombo.textContent = `x${stats.maxCombo}`;
    this.statScore.textContent = stats.totalScore.toLocaleString(locale);
    this.statStreak.textContent = isEn ? `🔥 ${stats.dailyStreak} d.` : `🔥 ${stats.dailyStreak} дн.`;
    const bestRun = stats.bestRunStage || 0;
    const bestRunScore = stats.bestRunScore || 0;
    this.statRunStage.textContent = bestRun > 0
      ? (isEn ? `Stage ${bestRun} (${bestRunScore.toLocaleString(locale)})` : `Этап ${bestRun} (${bestRunScore.toLocaleString(locale)})`)
      : '—';
    this.updateLeagueViews();
    this.renderPlayerSeasonMedals();
    this.renderSeasonArchive();
    this.renderDuelHistory();
    this.switchStatsTab('lb');
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
    const isEn = i18n.getLanguage() === 'en';
    const locale = isEn ? 'en-US' : 'ru-RU';

    if (history.length === 0) {
      this.duelHistorySummary.textContent = isEn ? '0 duels played' : '0 дуэлей сыграно';
      this.duelHistoryList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:10px;">${
        isEn ? 'You have not participated in duels yet. Share a challenge code after winning!' : 'Вы еще не участвовали в дуэлях. Поделитесь вызовом после победы!'
      }</div>`;
      return;
    }

    const wins = history.filter((d) => d.won).length;
    const losses = history.length - wins;
    const winRate = Math.round((wins / history.length) * 100);
    this.duelHistorySummary.textContent = isEn
      ? `Wins: ${wins} | Defeats: ${losses} (${winRate}% win rate)`
      : `Побед: ${wins} | Поражений: ${losses} (${winRate}% винрейт)`;

    const diffLabels: Record<Difficulty, string> = {
      easy: isEn ? 'Easy' : 'Легкий',
      medium: isEn ? 'Medium' : 'Средний',
      hard: isEn ? 'Hard' : 'Сложный',
      expert: isEn ? 'Expert' : 'Эксперт',
    };

    this.duelHistoryList.innerHTML = history.slice(0, 10).map((d) => {
      const statusIcon = d.won ? '🏆' : '💀';
      const statusClass = d.won ? 'won' : 'lost';
      const statusText = d.won ? (isEn ? 'Victory' : 'Победа') : (isEn ? 'Defeat' : 'Поражение');
      const myMins = Math.floor(d.myTime / 60);
      const mySecs = d.myTime % 60;
      const myTimeStr = `${myMins.toString().padStart(2, '0')}:${mySecs.toString().padStart(2, '0')}`;
      const diffName = diffLabels[d.diff] || (isEn ? 'Medium' : 'Средний');

      const scoreDiff = d.myScore - d.targetScore;
      const diffStr = scoreDiff >= 0 ? `+${scoreDiff.toLocaleString(locale)}` : `${scoreDiff.toLocaleString(locale)}`;

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
            <span>${isEn ? 'Score' : 'Счёт'}: <strong style="color:var(--text-main);">${d.myScore.toLocaleString(locale)}</strong> (<span style="color:${d.won ? '#34d399' : '#f43f5e'};">${diffStr}</span>)</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private updateLeagueViews() {
    const stats = SudokuGame.getPlayerStats();
    const league = getLeagueForScore(stats.totalScore);
    const isEn = i18n.getLanguage() === 'en';

    if (this.menuLeagueBadge) {
      this.menuLeagueBadge.className = league.badgeClass;
      this.menuLeagueBadge.innerHTML = `<span>${league.icon}</span> <span>${league.name}</span>`;
    }

    if (this.statLeagueBadge) {
      this.statLeagueBadge.className = league.badgeClass;
      this.statLeagueBadge.innerHTML = `<span>${league.icon}</span> <span>${isEn ? 'League' : 'Лига'}: ${league.name}</span>`;
    }

    if (this.statSeasonTimer) {
      this.statSeasonTimer.textContent = `⏳ ${isEn ? 'Season' : 'Сезон'}: ${getSeasonRemainingText()}`;
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
    const isEn = i18n.getLanguage() === 'en';
    const locale = isEn ? 'en-US' : 'ru-RU';

    if (!lastSeason) {
      localStorage.setItem('sudoku_last_season_id', currentSeason);
      return;
    }

    if (lastSeason !== currentSeason) {
      const finalLeague = getLeagueForScore(stats.totalScore);
      const trophy: SeasonTrophy = {
        seasonId: lastSeason,
        seasonName: isEn ? `Season ${lastSeason.replace('-', ' ')}` : `Сезон ${lastSeason.replace('-', ' ')}`,
        leagueId: finalLeague.id,
        leagueName: finalLeague.name,
        icon: finalLeague.icon,
        points: stats.totalScore,
        dateAwarded: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
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
        dateAwarded: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
      };
      this.addSeasonBadge(badge);

      localStorage.setItem('sudoku_last_season_id', currentSeason);

      setTimeout(() => {
        this.showToast(isEn ? `🏆 Season results for ${lastSeason}! You earned trophy: ${finalLeague.icon} ${finalLeague.name}` : `🏆 Итоги сезона ${lastSeason}! Вам присвоен трофей: ${finalLeague.icon} ${finalLeague.name}`);
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
    const isEn = i18n.getLanguage() === 'en';
    const locale = isEn ? 'en-US' : 'ru-RU';
    if (stats.gamesWon > 0) {
      const starter: SeasonBadge = {
        id: 'badge_starter',
        seasonId: getCurrentSeasonId(),
        title: isEn ? '⚡ Pulse Veteran' : '⚡ Ветеран Pulse',
        icon: '⚡',
        tier: 'veteran',
        dateAwarded: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
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
    const isEn = i18n.getLanguage() === 'en';
    if (badges.length === 0) {
      this.playerSeasonMedals.classList.add('hidden');
      return;
    }
    this.playerSeasonMedals.classList.remove('hidden');
    this.playerSeasonMedals.innerHTML = badges.map((b) => `
      <span class="player-medal-chip ${b.tier}" title="${isEn ? 'Reward for' : 'Награда за'} ${b.title}">
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
    const isEn = i18n.getLanguage() === 'en';
    const locale = isEn ? 'en-US' : 'ru-RU';

    const currentCard = `
      <div class="season-trophy-card" style="border-color: rgba(56, 189, 248, 0.35); background: rgba(56, 189, 248, 0.06); margin-bottom: 6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.1rem;">⏳</span>
          <div>
            <div style="font-weight:700; color:var(--text-main); font-size:0.82rem;">${isEn ? 'Season' : 'Сезон'} ${currentSeason} <span style="font-size:0.7rem; color:var(--pulse-cyan);">${isEn ? '(Current)' : '(Текущий)'}</span></div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${isEn ? 'Qualification' : 'Квалификация'}: <strong>${currentLeague.name}</strong> (${stats.totalScore.toLocaleString(locale)} ${isEn ? 'pts' : 'очков'})</div>
          </div>
        </div>
        <span class="season-trophy-tag ${currentLeague.badgeClass}">${currentLeague.icon} ${isEn ? 'Active' : 'В игре'}</span>
      </div>
    `;

    if (archive.length === 0) {
      this.seasonArchiveList.innerHTML = currentCard + `
        <div style="text-align:center; color:var(--text-muted); font-size:0.78rem; padding:6px;">
          ${isEn ? 'Current week trophy will be locked into the archive when the season ends!' : 'Трофей за текущую неделю закрепится в архиве по завершению сезона!'}
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
              <div style="font-size:0.75rem; color:var(--text-muted);">${t.dateAwarded} • ${t.points.toLocaleString(locale)} ${isEn ? 'pts' : 'очков'}</div>
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
    const isEn = i18n.getLanguage() === 'en';
    const counts = this.game.getProgressCounts();
    const botProfiles: Record<Difficulty, { name: string; stepMs: number; errorChance: number; startTaunt: string }> = {
      easy: {
        name: 'PulseBot v1',
        stepMs: 8000,
        errorChance: 0.15,
        startTaunt: isEn ? 'Hello, human! Show me your grid solving skills.' : 'Привет, человек! Покажи, как ты решаешь сетку.'
      },
      medium: {
        name: 'CyberPulse v2',
        stepMs: 5000,
        errorChance: 0.05,
        startTaunt: isEn ? 'My neural circuits are heated. Prepare for the duel!' : 'Мои нейронные цепи прогреты. Готовься к дуэли!'
      },
      hard: {
        name: 'NeuralPulse v3',
        stepMs: 3400,
        errorChance: 0,
        startTaunt: isEn ? 'High difficulty? Excellent, I won\'t hold back.' : 'Высокая сложность? Отлично, я не буду поддаваться.'
      },
      expert: {
        name: 'QuantumPulse v4',
        stepMs: 2300,
        errorChance: 0,
        startTaunt: isEn ? '01000111 01001111! Full quantum dominance.' : '01000111 01001111! Полное квантовое доминирование.'
      },
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
        const errorTaunts = isEn ? [
          'Calculation glitch... Logic rebooting!',
          'My sensor misfired... Here is your chance!',
          'Critical stream drift... Correcting!',
        ] : [
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
        this.showAiBotTaunt(isEn ? 'Half the grid is mine! Catch up!' : 'Половина сетки за мной! Догоняй!', 2800);
      } else if (!this.aiBotProgress.reachedEighty && this.aiBotProgress.filled >= eightyCount) {
        this.aiBotProgress.reachedEighty = true;
        this.setAiBotEmotion('smug', 3000);
        this.showAiBotTaunt(isEn ? 'Home stretch! Victory is near!' : 'Финишная прямая! Победа уже близко!', 2800);
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
    if (this.game.mode !== 'ai_duel' && !this.isLiveDuelActive) {
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

    if (!this.isLiveDuelActive) {
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
  }

  private handleAiDuelLoss() {
    const isEn = i18n.getLanguage() === 'en';
    const botName = `🤖 ${this.aiBotProgress.name}`;
    const duelRecord: DuelRecord = {
      id: 'duel_' + Date.now(),
      date: new Date().toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' }),
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
    this.gameOverSubtitle.textContent = isEn
      ? `${botName} filled the grid first (${this.aiBotProgress.total}/${this.aiBotProgress.total})! Bot score: ${this.aiBotProgress.score.toLocaleString('en-US')}.`
      : `${botName} первым заполнил сетку (${this.aiBotProgress.total}/${this.aiBotProgress.total})! Счёт бота: ${this.aiBotProgress.score.toLocaleString('ru-RU')}.`;
    this.gameOverModal.classList.remove('hidden');
  }

  // ==========================================
  // 1v1 LIVE MULTIPLAYER DUEL SYSTEM
  // ==========================================
  private openLiveLobbyModal() {
    soundManager.playSelect();
    haptics.light();
    this.stopLiveLobbyPolling();
    this.currentLiveLobbyId = null;
    this.currentLiveLobbyCode = null;
    this.isLiveDuelActive = false;
    this.isQuickMatchWaiting = false;

    if (this.liveLobbyViewMain) this.liveLobbyViewMain.classList.remove('hidden');
    if (this.liveLobbyViewWaiting) this.liveLobbyViewWaiting.classList.add('hidden');
    if (this.liveLobbyViewCountdown) this.liveLobbyViewCountdown.classList.add('hidden');
    if (this.liveWaitingRoomBox) this.liveWaitingRoomBox.classList.remove('hidden');
    if (this.liveWaitingQuickBox) this.liveWaitingQuickBox.classList.add('hidden');
    if (this.inputLiveCode) this.inputLiveCode.value = '';

    this.switchLiveTab('create');
    this.liveLobbyModal?.classList.remove('hidden');
  }

  private switchLiveTab(tab: 'create' | 'join') {
    if (tab === 'create') {
      this.tabLiveCreate?.classList.add('active');
      this.tabLiveJoin?.classList.remove('active');
      this.livePanelCreate?.classList.remove('hidden');
      this.livePanelJoin?.classList.add('hidden');
    } else {
      this.tabLiveCreate?.classList.remove('active');
      this.tabLiveJoin?.classList.add('active');
      this.livePanelCreate?.classList.add('hidden');
      this.livePanelJoin?.classList.remove('hidden');
    }
  }

  private async startQuickMatch() {
    soundManager.playSelect();
    haptics.light();
    const isEn = i18n.getLanguage() === 'en';
    const playerId = SudokuGame.getOrCreatePlayerId();
    const tgUser = this.getStoredTelegramUser();
    const playerName = (localStorage.getItem('sudoku_player_name') || tgUser?.username || (isEn ? 'Player' : 'Игрок')).replace(/[@_\s]/g, '') || (isEn ? 'Player' : 'Игрок');

    try {
      if (this.btnLiveQuickMatch) this.btnLiveQuickMatch.disabled = true;

      const res = await fetch(`${getApiBaseUrl()}/lobby/quick-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          playerName,
          difficulty: this.selectedLiveDiff,
        }),
      });

      if (!res.ok) throw new Error('Quick match failed');
      const data = await res.json();

      this.currentLiveLobbyId = data.lobbyId;
      this.currentLiveLobbyCode = data.code;

      if (data.matched) {
        // Instant match found as guest!
        this.isLiveHost = false;
        this.liveOpponentName = data.hostName || (isEn ? 'Host' : 'Соперник');
        this.isQuickMatchWaiting = false;
        this.showToast(isEn ? `⚡ Opponent found: ${data.hostName}!` : `⚡ Соперник найден: ${data.hostName}!`);
        this.startLiveCountdown(data.hostName, playerName, data.seed, data.difficulty);
      } else {
        // Waiting in queue as host
        this.isLiveHost = true;
        this.liveOpponentName = isEn ? 'Opponent' : 'Соперник';
        this.isQuickMatchWaiting = true;

        if (this.liveWaitingRoomBox) this.liveWaitingRoomBox.classList.add('hidden');
        if (this.liveWaitingQuickBox) this.liveWaitingQuickBox.classList.remove('hidden');
        if (this.liveWaitingStatusLabel) {
          this.liveWaitingStatusLabel.textContent = isEn ? 'Searching for random opponent...' : 'Поиск случайного соперника...';
        }
        if (this.liveQuickDiffLabel) {
          const diffLabels: Record<Difficulty, string> = {
            easy: isEn ? 'Easy' : 'Легкий',
            medium: isEn ? 'Medium' : 'Средний',
            hard: isEn ? 'Hard' : 'Сложный',
            expert: isEn ? 'Expert' : 'Эксперт',
          };
          this.liveQuickDiffLabel.textContent = `${isEn ? 'Difficulty' : 'Сложность'}: ${diffLabels[data.difficulty as Difficulty] || data.difficulty}`;
        }

        if (this.liveLobbyViewMain) this.liveLobbyViewMain.classList.add('hidden');
        if (this.liveLobbyViewWaiting) this.liveLobbyViewWaiting.classList.remove('hidden');

        this.startLiveLobbyPolling();
      }
    } catch {
      this.showToast(isEn ? '❌ Could not find match. Check connection.' : '❌ Ошибка быстрого поиска. Проверьте соединение.');
    } finally {
      if (this.btnLiveQuickMatch) this.btnLiveQuickMatch.disabled = false;
    }
  }

  private async createLiveRoom() {
    const isEn = i18n.getLanguage() === 'en';
    const hostId = SudokuGame.getOrCreatePlayerId();
    const tgUser = this.getStoredTelegramUser();
    const hostName = (localStorage.getItem('sudoku_player_name') || tgUser?.username || (isEn ? 'Host' : 'Игрок 1')).replace(/[@_\s]/g, '') || (isEn ? 'Host' : 'Игрок 1');

    try {
      if (this.btnCreateLiveRoom) this.btnCreateLiveRoom.disabled = true;
      const res = await fetch(`${getApiBaseUrl()}/lobby/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId,
          hostName,
          difficulty: this.selectedLiveDiff,
        }),
      });

      if (!res.ok) throw new Error('Create room failed');
      const data = await res.json();

      this.currentLiveLobbyId = data.lobbyId;
      this.currentLiveLobbyCode = data.code;
      this.isLiveHost = true;
      this.liveOpponentName = isEn ? 'Opponent' : 'Соперник';
      this.isQuickMatchWaiting = false;

      if (this.liveWaitingRoomBox) this.liveWaitingRoomBox.classList.remove('hidden');
      if (this.liveWaitingQuickBox) this.liveWaitingQuickBox.classList.add('hidden');
      if (this.liveWaitingStatusLabel) {
        this.liveWaitingStatusLabel.textContent = isEn ? 'Waiting for opponent to join...' : 'Ожидание подключения соперника...';
      }

      if (this.liveWaitingCode) this.liveWaitingCode.textContent = data.code;
      const diffLabels: Record<Difficulty, string> = {
        easy: isEn ? 'Easy' : 'Легкий',
        medium: isEn ? 'Medium' : 'Средний',
        hard: isEn ? 'Hard' : 'Сложный',
        expert: isEn ? 'Expert' : 'Эксперт',
      };
      if (this.liveWaitingDiff) {
        this.liveWaitingDiff.textContent = `${isEn ? 'Difficulty' : 'Сложность'}: ${diffLabels[data.difficulty as Difficulty] || data.difficulty}`;
      }

      if (this.liveLobbyViewMain) this.liveLobbyViewMain.classList.add('hidden');
      if (this.liveLobbyViewWaiting) this.liveLobbyViewWaiting.classList.remove('hidden');

      this.startLiveLobbyPolling();
    } catch {
      this.showToast(isEn ? '❌ Could not create room. Check connection.' : '❌ Ошибка создания комнаты. Проверьте сеть.');
    } finally {
      if (this.btnCreateLiveRoom) this.btnCreateLiveRoom.disabled = false;
    }
  }

  private async joinLiveRoom(inputCode: string) {
    const isEn = i18n.getLanguage() === 'en';
    const code = inputCode.trim();
    if (!code) {
      this.showToast(isEn ? '⚠️ Enter 4-digit room code' : '⚠️ Введите 4-значный код комнаты');
      return;
    }

    const guestId = SudokuGame.getOrCreatePlayerId();
    const tgUser = this.getStoredTelegramUser();
    const guestName = (localStorage.getItem('sudoku_player_name') || tgUser?.username || (isEn ? 'Challenger' : 'Игрок 2')).replace(/[@_\s]/g, '') || (isEn ? 'Challenger' : 'Игрок 2');

    try {
      if (this.btnJoinLiveRoom) this.btnJoinLiveRoom.disabled = true;
      const res = await fetch(`${getApiBaseUrl()}/lobby/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          guestId,
          guestName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Join failed');
      }

      const data = await res.json();
      this.currentLiveLobbyId = data.lobbyId;
      this.currentLiveLobbyCode = data.code;
      this.isLiveHost = false;
      this.liveOpponentName = data.hostName || (isEn ? 'Host' : 'Соперник');

      this.liveLobbyModal?.classList.remove('hidden');
      this.startLiveCountdown(data.hostName, guestName, data.seed, data.difficulty);
    } catch (err: any) {
      this.showToast(isEn ? `❌ ${err.message || 'Room not found'}` : `❌ ${err.message || 'Комната не найдена'}`);
    } finally {
      if (this.btnJoinLiveRoom) this.btnJoinLiveRoom.disabled = false;
    }
  }

  private async copyLiveRoomLink() {
    const isEn = i18n.getLanguage() === 'en';
    if (!this.currentLiveLobbyCode) return;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const link = `${origin}${pathname}?lobby=${this.currentLiveLobbyCode}`;
    const text = `${link}`;
    const copied = await this.copyTextToClipboard(text);
    if (copied) {
      this.showToast(isEn ? '📋 Link copied to clipboard!' : '📋 Ссылка на дуэль скопирована в буфер!');
    }
  }

  private async shareLiveRoomLink() {
    const isEn = i18n.getLanguage() === 'en';
    if (!this.currentLiveLobbyCode) return;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const link = `${origin}${pathname}?lobby=${this.currentLiveLobbyCode}`;
    const text = isEn
      ? `⚔️ Join my 1v1 Sudoku Pulse live duel!\nRoom code: ${this.currentLiveLobbyCode}\n${link}`
      : `⚔️ Заходи на живую 1v1 дуэль в Sudoku Pulse!\nКод комнаты: ${this.currentLiveLobbyCode}\n${link}`;

    const tgApp = (window as any).Telegram?.WebApp;
    if (tgApp?.openTelegramLink) {
      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      tgApp.openTelegramLink(tgShareUrl);
      this.showToast(isEn ? '🔗 Room link copied! Opening Telegram...' : '🔗 Ссылка на комнату скопирована! Открываем Telegram...');
      await this.copyTextToClipboard(`${text}`);
      return;
    }

    const shared = await this.tryNativeShare({ title: 'Sudoku Pulse 1v1', text, url: link });
    if (!shared) {
      await this.copyTextToClipboard(`${text}`);
      this.showToast(isEn ? '📋 Room link copied to clipboard!' : '📋 Ссылка на комнату скопирована в буфер!');
    }
  }

  private startLiveCountdown(hostName: string, guestName: string, seed: number, difficulty: Difficulty) {
    if (this.liveLobbyViewMain) this.liveLobbyViewMain.classList.add('hidden');
    if (this.liveLobbyViewWaiting) this.liveLobbyViewWaiting.classList.add('hidden');
    if (this.liveLobbyViewCountdown) this.liveLobbyViewCountdown.classList.remove('hidden');

    if (this.liveCdHostName) this.liveCdHostName.textContent = hostName;
    if (this.liveCdGuestName) this.liveCdGuestName.textContent = guestName;

    let count = 3;
    if (this.liveCountdownNumber) this.liveCountdownNumber.textContent = count.toString();
    soundManager.playCountdownTick(3);
    haptics.light();

    const cdInterval = setInterval(() => {
      count--;
      if (count > 0) {
        if (this.liveCountdownNumber) this.liveCountdownNumber.textContent = count.toString();
        soundManager.playCountdownTick(count);
        haptics.light();
      } else {
        clearInterval(cdInterval);
        if (this.liveCountdownNumber) this.liveCountdownNumber.textContent = 'GO!';
        soundManager.playCountdownGo();
        haptics.fever();

        setTimeout(() => {
          this.liveLobbyModal?.classList.add('hidden');
          this.startLiveDuelGame(seed, difficulty);
        }, 500);
      }
    }, 1000);
  }

  private startLiveDuelGame(seed: number, difficulty: Difficulty) {
    this.isLiveDuelActive = true;
    this.stopAiBotDuel();
    this.game.startNewGame({ difficulty, mode: 'classic', perks: [], seed });
    this.showScreen('game');

    const isEn = i18n.getLanguage() === 'en';
    this.showToast(isEn ? `⚔️ Live Duel with ${this.liveOpponentName} started!` : `⚔️ Живая дуэль против ${this.liveOpponentName} началась!`);

    if (this.aiDuelHud) this.aiDuelHud.classList.remove('hidden');
    if (this.aiBotName) this.aiBotName.textContent = this.liveOpponentName;
    if (this.aiBotAvatar) this.aiBotAvatar.className = 'ai-bot-avatar smug';

    const reactionBar = document.getElementById('live-duel-reaction-bar');
    if (reactionBar) reactionBar.classList.remove('hidden');
    const reactionBubble = document.getElementById('live-opponent-reaction-bubble');
    if (reactionBubble) reactionBubble.classList.add('hidden');

    this.startLiveLobbyPolling();
  }

  private startLiveLobbyPolling() {
    this.stopLiveLobbyPolling();
    const myId = SudokuGame.getOrCreatePlayerId();

    this.livePollInterval = setInterval(async () => {
      if (!this.currentLiveLobbyId) return;

      try {
        const url = `${getApiBaseUrl()}/lobby/status?id=${this.currentLiveLobbyId}&playerId=${myId}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const lobby = await res.json();

        // Host waiting: guest joined -> trigger countdown
        if (this.isLiveHost && lobby.status === 'countdown' && this.liveLobbyViewWaiting && !this.liveLobbyViewWaiting.classList.contains('hidden')) {
          if (this.isQuickMatchWaiting) {
            const isEn = i18n.getLanguage() === 'en';
            this.showToast(isEn ? `⚡ Opponent found: ${lobby.guest?.name || 'Player'}!` : `⚡ Соперник найден: ${lobby.guest?.name || 'Игрок'}!`);
          }
          this.isQuickMatchWaiting = false;
          this.liveOpponentName = lobby.guest?.name || 'Соперник';
          this.startLiveCountdown(lobby.host?.name || 'Игрок 1', lobby.guest?.name || 'Игрок 2', lobby.seed, lobby.difficulty);
          return;
        }

        // Opponent live reaction emotes
        if (lobby.lastReaction && lobby.lastReaction.from !== myId) {
          if (lobby.lastReaction.timestamp > this.lastReceivedReactionTime) {
            this.lastReceivedReactionTime = lobby.lastReaction.timestamp;
            this.showOpponentReactionBubble(lobby.lastReaction.emoji);
            soundManager.playTauntReaction();
          }
        }

        // Rematch offer notification
        if (lobby.rematchRequestedBy && lobby.rematchRequestedBy !== myId) {
          const isEn = i18n.getLanguage() === 'en';
          const statusWin = document.getElementById('duel-rematch-status');
          const statusLoss = document.getElementById('duel-loss-rematch-status');
          if (statusWin) {
            statusWin.textContent = isEn ? '⚡ Opponent offered a rematch!' : '⚡ Соперник предлагает реванш!';
            statusWin.classList.remove('hidden');
          }
          if (statusLoss) {
            statusLoss.textContent = isEn ? '⚡ Opponent offered a rematch!' : '⚡ Соперник предлагает реванш!';
            statusLoss.classList.remove('hidden');
          }
        }

        // Rematch accepted: both players launch next round
        if (lobby.status === 'countdown' && (!this.winModal.classList.contains('hidden') || !this.gameOverModal.classList.contains('hidden'))) {
          this.handleRematchCountdown(lobby.seed, lobby.difficulty);
          return;
        }

        // In-game live progress update
        if (this.isLiveDuelActive) {
          const opponent = this.isLiveHost ? lobby.guest : lobby.host;
          if (opponent) {
            const oppFilled = opponent.filled || 0;
            const oppTotal = opponent.total || 45;
            const oppPct = Math.min(100, Math.round((oppFilled / oppTotal) * 100));

            if (this.aiBotCount) this.aiBotCount.textContent = `${oppFilled}/${oppTotal}`;
            if (this.aiBotFill) this.aiBotFill.style.width = `${oppPct}%`;
          }

          // Check winner / game finish
          if (lobby.status === 'finished') {
            const won = (this.isLiveHost && lobby.winner === 'host') || (!this.isLiveHost && lobby.winner === 'guest');
            if (!won) {
              this.handleLiveDuelLoss();
            }
          }
        }
      } catch {}
    }, 600);
  }

  private stopLiveLobbyPolling() {
    if (this.livePollInterval) {
      clearInterval(this.livePollInterval);
      this.livePollInterval = null;
    }
  }

  private sendLiveDuelProgress() {
    if (!this.isLiveDuelActive || !this.currentLiveLobbyId) return;
    const myId = SudokuGame.getOrCreatePlayerId();
    const counts = this.game.getProgressCounts();

    fetch(`${getApiBaseUrl()}/lobby/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lobbyId: this.currentLiveLobbyId,
        playerId: myId,
        action: 'progress',
        filled: counts.filled,
        total: counts.totalToFill,
        mistakes: this.game.mistakesCount,
        combo: this.game.comboCount,
        score: this.game.score,
      }),
    }).catch(() => {});
  }

  private handleLiveDuelLoss() {
    const isEn = i18n.getLanguage() === 'en';
    soundManager.playDuelLoss();
    haptics.error();

    if (this.duelResultTitle) this.duelResultTitle.textContent = isEn ? 'DEFEAT' : 'ПОРАЖЕНИЕ В ДУЭЛИ';
    if (this.duelResultText) {
      this.duelResultText.textContent = isEn
        ? `${this.liveOpponentName} completed the puzzle first!`
        : `${this.liveOpponentName} первым безошибочно решил сетку!`;
    }
    if (this.duelResultBanner) {
      this.duelResultBanner.className = 'duel-result-banner defeat';
      this.duelResultBanner.classList.remove('hidden');
    }

    const rematchContainer = document.getElementById('duel-loss-rematch-container');
    if (rematchContainer) rematchContainer.classList.remove('hidden');
    const statusEl = document.getElementById('duel-loss-rematch-status');
    if (statusEl) statusEl.classList.add('hidden');
    const btnLossRematch = document.getElementById('btn-duel-loss-rematch') as HTMLButtonElement | null;
    if (btnLossRematch) { btnLossRematch.disabled = false; btnLossRematch.style.opacity = '1'; }

    this.showGameOverModal();
    this.isLiveDuelActive = false;
  }

  private sendLiveReaction(emoji: string) {
    if (!this.currentLiveLobbyId) return;
    const myId = SudokuGame.getOrCreatePlayerId();
    soundManager.playTauntReaction();
    haptics.light();
    this.showOpponentReactionBubble(emoji);

    fetch(`${getApiBaseUrl()}/lobby/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lobbyId: this.currentLiveLobbyId,
        playerId: myId,
        action: 'reaction',
        emoji,
      }),
    }).catch(() => {});
  }

  private showOpponentReactionBubble(emoji: string) {
    const bubble = document.getElementById('live-opponent-reaction-bubble');
    if (!bubble) return;
    bubble.textContent = emoji;
    bubble.classList.remove('hidden');
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = '';

    if (this.reactionBubbleTimeout) clearTimeout(this.reactionBubbleTimeout);
    this.reactionBubbleTimeout = window.setTimeout(() => {
      bubble.classList.add('hidden');
    }, 2200);
  }

  private async requestDuelRematch() {
    if (!this.currentLiveLobbyId) return;
    const myId = SudokuGame.getOrCreatePlayerId();
    const btnWin = document.getElementById('btn-duel-rematch') as HTMLButtonElement | null;
    const btnLoss = document.getElementById('btn-duel-loss-rematch') as HTMLButtonElement | null;
    const statusWin = document.getElementById('duel-rematch-status');
    const statusLoss = document.getElementById('duel-loss-rematch-status');

    if (btnWin) { btnWin.disabled = true; btnWin.style.opacity = '0.65'; }
    if (btnLoss) { btnLoss.disabled = true; btnLoss.style.opacity = '0.65'; }
    if (statusWin) {
      statusWin.textContent = i18n.getLanguage() === 'en' ? '⏳ Waiting for opponent confirmation...' : '⏳ Ожидаем согласия соперника...';
      statusWin.classList.remove('hidden');
    }
    if (statusLoss) {
      statusLoss.textContent = i18n.getLanguage() === 'en' ? '⏳ Waiting for opponent confirmation...' : '⏳ Ожидаем согласия соперника...';
      statusLoss.classList.remove('hidden');
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/lobby/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId: this.currentLiveLobbyId,
          playerId: myId,
          action: 'rematch_request',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'countdown') {
          this.handleRematchCountdown(data.seed, data.difficulty);
        }
      }
    } catch {}
  }

  private handleRematchCountdown(seed?: number, difficulty?: string) {
    this.stopLiveLobbyPolling();
    this.winModal.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.stopConfetti();

    const rematchWin = document.getElementById('duel-rematch-container');
    const rematchLoss = document.getElementById('duel-loss-rematch-container');
    if (rematchWin) rematchWin.classList.add('hidden');
    if (rematchLoss) rematchLoss.classList.add('hidden');

    const btnWin = document.getElementById('btn-duel-rematch') as HTMLButtonElement | null;
    const btnLoss = document.getElementById('btn-duel-loss-rematch') as HTMLButtonElement | null;
    if (btnWin) { btnWin.disabled = false; btnWin.style.opacity = '1'; }
    if (btnLoss) { btnLoss.disabled = false; btnLoss.style.opacity = '1'; }

    const myName = localStorage.getItem('sudoku_player_name') || (i18n.getLanguage() === 'en' ? 'Player' : 'Игрок');
    const hostName = this.isLiveHost ? myName : (this.liveOpponentName || 'Игрок 1');
    const guestName = this.isLiveHost ? (this.liveOpponentName || 'Игрок 2') : myName;

    const chosenSeed = seed || Math.floor(100000 + Math.random() * 900000);
    this.startLiveCountdown(hostName, guestName, chosenSeed, (difficulty as Difficulty) || 'medium');
  }

  private switchStatsTab(tabName: string) {
    const tabs = document.querySelectorAll<HTMLButtonElement>('.stats-nav-tab');
    tabs.forEach((t) => {
      if (t.getAttribute('data-stats-tab') === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    const panes = ['lb', 'profile', 'seasons', 'duels'];
    panes.forEach((p) => {
      const paneEl = document.getElementById(`stats-pane-${p}`);
      if (paneEl) {
        if (p === tabName) {
          paneEl.classList.remove('hidden');
          paneEl.classList.add('active');
        } else {
          paneEl.classList.add('hidden');
          paneEl.classList.remove('active');
        }
      }
    });

    if (tabName === 'lb') {
      this.fetchAndRenderLeaderboard();
    } else if (tabName === 'seasons') {
      this.renderSeasonArchive();
    } else if (tabName === 'duels') {
      this.renderDuelHistory();
    }
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
    const lang = i18n.getLanguage();
    const isEn = lang === 'en';

    this.boardSkinPills.forEach((pill) => {
      const skinKey = pill.getAttribute('data-board-skin') || 'neon';
      const req = BOARD_SKINS_CONFIG[skinKey];
      if (!req) return;

      const isUnlocked = totalScore >= req.minScore;
      pill.classList.toggle('active', currentSkin === skinKey);
      pill.classList.toggle('locked', !isUnlocked);

      const skinName = isEn ? req.nameEn : req.nameRu;
      const leagueName = isEn ? req.leagueEn : req.leagueRu;
      if (isUnlocked) {
        pill.textContent = `${req.icon} ${skinName}`;
      } else {
        pill.textContent = `🔒 ${skinName} (${leagueName})`;
      }
    });
  }

  private showMockAd(rewardTitle: string, onReward: () => void) {
    if (yandexBridge.isYandex()) {
      soundManager.muteForAd();
      const wasPlaying = this.currentScreen === 'game' && this.game.status === 'playing';
      if (wasPlaying) this.game.pauseTimer();

      yandexBridge.showRewardedVideo({
        onOpen: () => {
          soundManager.muteForAd();
          if (wasPlaying) this.game.pauseTimer();
        },
        onRewarded: () => {
          soundManager.unmuteAfterAd();
          soundManager.playCorrect();
          onReward();
        },
        onClose: () => {
          soundManager.unmuteAfterAd();
          if (wasPlaying) this.game.resumeTimer();
        },
        onError: (err) => {
          console.warn('[Yandex Ad] Rewarded video error:', err);
          soundManager.unmuteAfterAd();
          if (wasPlaying) this.game.resumeTimer();
          this.showToast('⚠️ Реклама временно недоступна');
        },
      });
      return;
    }

    // In standalone/dev mode: grant reward directly without simulating fake ad dialog (Yandex req 1.16)
    soundManager.playCorrect();
    onReward();
    this.showToast(`🎁 ${rewardTitle}`);
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

  public openTutorial(stepIndex: number = 0) {
    if (!this.tutorialModal) return;
    this.tutorialModal.classList.remove('hidden');
    this.renderTutorialStep(stepIndex);
    haptics.setBackButton(() => this.closeTutorial());
  }

  public closeTutorial() {
    if (!this.tutorialModal) return;
    this.tutorialModal.classList.add('hidden');
    localStorage.setItem('sudoku_pulse_tutorial_seen', 'true');
    this.updateScreenBackButton();
  }

  public renderTutorialStep(stepIndex: number = this.currentTutorialStep) {
    this.currentTutorialStep = Math.max(0, Math.min(4, stepIndex));
    const isEn = i18n.getLanguage() === 'en';

    if (this.tutorialStepBadge) {
      this.tutorialStepBadge.textContent = isEn
        ? `STEP ${this.currentTutorialStep + 1} OF 5`
        : `ШАГ ${this.currentTutorialStep + 1} ИЗ 5`;
    }

    if (this.tutorialDots) {
      this.tutorialDots.innerHTML = [0, 1, 2, 3, 4]
        .map((i) => `<span class="dot ${i === this.currentTutorialStep ? 'active' : ''}"></span>`)
        .join('');
    }

    if (this.btnTutorialPrev) {
      this.btnTutorialPrev.disabled = this.currentTutorialStep === 0;
      this.btnTutorialPrev.style.opacity = this.currentTutorialStep === 0 ? '0.4' : '1';
    }

    if (this.btnTutorialNext) {
      if (this.currentTutorialStep === 4) {
        this.btnTutorialNext.textContent = isEn ? "Let's Play! 🚀" : 'Погнали! 🚀';
      } else {
        this.btnTutorialNext.textContent = isEn ? 'Next ▶' : 'Далее ▶';
      }
    }

    switch (this.currentTutorialStep) {
      case 0: {
        this.tutorialTitle.textContent = isEn ? '🧩 Classic Sudoku Rules' : '🧩 Классические правила Судоку';
        this.tutorialVisualBox.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="display:grid;grid-template-columns:repeat(3, 38px);grid-template-rows:repeat(3, 38px);gap:4px;padding:6px;background:rgba(0,243,255,0.08);border:1px solid #00f3ff;border-radius:10px;">
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#00f3ff;background:rgba(255,255,255,0.05);border-radius:6px;">5</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:rgba(255,255,255,0.05);border-radius:6px;">3</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#ff0055;background:rgba(255,0,85,0.15);border:1px dashed #ff0055;border-radius:6px;">?</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:rgba(255,255,255,0.05);border-radius:6px;">6</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#00f3ff;background:rgba(255,255,255,0.05);border-radius:6px;">7</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:rgba(255,255,255,0.05);border-radius:6px;">2</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:rgba(255,255,255,0.05);border-radius:6px;">1</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:rgba(255,255,255,0.05);border-radius:6px;">9</div>
              <div style="display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:rgba(255,255,255,0.05);border-radius:6px;">8</div>
            </div>
            <span style="font-size:12px;color:rgba(255,255,255,0.7);">${isEn ? '1 to 9 without repeats in row, column, block' : '1 до 9 без повторений в строке, столбце и блоке'}</span>
          </div>
        `;
        this.tutorialDescription.textContent = isEn
          ? 'Fill the 9×9 grid with digits 1 through 9. Each row, column, and 3×3 sector must contain each number exactly once. Tap an empty cell, then select a digit on the keypad below.'
          : 'Заполните сетку 9×9 цифрами от 1 до 9. В каждой строке, столбце и блоке 3×3 каждая цифра должна встречаться ровно один раз без повторений. Нажмите на пустую клетку и выберите цифру на панели снизу.';
        break;
      }
      case 1: {
        this.tutorialTitle.textContent = isEn ? '⚡ Pulse & Fever Multipliers' : '⚡ Механика Пульса и Fever';
        this.tutorialVisualBox.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;">
            <div style="display:flex;align-items:center;justify-content:space-between;width:88%;font-size:12px;font-weight:800;">
              <span id="tut-fever-label" style="color:var(--text-muted);">${isEn ? '⚡ PULSE ACCELERATION:' : '⚡ РАЗГОН ПУЛЬСА:'}</span>
              <span id="tut-fever-mult" style="color:var(--pulse-cyan);font-weight:900;">x1.0</span>
            </div>
            <div style="width:88%;height:14px;background:rgba(255,255,255,0.1);border-radius:7px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);">
              <div id="tut-pulse-fill" style="width:15%;height:100%;background:var(--pulse-cyan);transition:all 0.25s ease;"></div>
            </div>
            <div style="display:flex;gap:12px;margin:4px 0;">
              <button id="tut-btn-1" class="btn-primary" style="width:42px;height:42px;font-size:1.15rem;font-weight:900;border-radius:10px;padding:0;">1</button>
              <button id="tut-btn-2" class="btn-secondary" style="width:42px;height:42px;font-size:1.15rem;font-weight:900;border-radius:10px;padding:0;opacity:0.4;" disabled>5</button>
              <button id="tut-btn-3" class="btn-secondary" style="width:42px;height:42px;font-size:1.15rem;font-weight:900;border-radius:10px;padding:0;opacity:0.4;" disabled>9</button>
            </div>
            <span id="tut-feedback" style="font-size:11px;color:rgba(255,255,255,0.75);">${isEn ? 'Tap [ 1 ] ➔ [ 5 ] ➔ [ 9 ] to ignite Fever!' : 'Нажмите [ 1 ] ➔ [ 5 ] ➔ [ 9 ], чтобы разжечь Fever!'}</span>
          </div>
        `;
        this.tutorialDescription.textContent = isEn
          ? 'Every correct entry charges your Pulse meter. Consecutive swift moves trigger FEVER Mode, boosting score gains up to x20! Beware: mistakes reset your combo chain and drain your pulse.'
          : 'Каждый правильный ход заряжает шкалу Пульса. Серия быстрых ходов активирует Режим FEVER с множителем очков до x20! Ошибки сбрасывают комбо и расходуют драгоценный пульс.';

        const tutBtn1 = document.getElementById('tut-btn-1') as HTMLButtonElement;
        const tutBtn2 = document.getElementById('tut-btn-2') as HTMLButtonElement;
        const tutBtn3 = document.getElementById('tut-btn-3') as HTMLButtonElement;
        const tutFill = document.getElementById('tut-pulse-fill');
        const tutMult = document.getElementById('tut-fever-mult');
        const tutFeedback = document.getElementById('tut-feedback');

        if (tutBtn1 && tutBtn2 && tutBtn3 && tutFill && tutMult && tutFeedback) {
          tutBtn1.onclick = () => {
            soundManager.playCorrect(1);
            haptics.selection();
            tutBtn1.disabled = true;
            tutBtn1.className = 'btn-secondary';
            tutBtn1.textContent = '✓';
            tutBtn1.style.opacity = '0.7';
            tutFill.style.width = '50%';
            tutMult.textContent = 'x2.0';
            tutBtn2.disabled = false;
            tutBtn2.className = 'btn-primary';
            tutBtn2.style.opacity = '1';
            tutFeedback.textContent = isEn ? '⚡ Good! Next tap [ 5 ]!' : '⚡ Отлично! Теперь жмите [ 5 ]!';
          };

          tutBtn2.onclick = () => {
            soundManager.playCorrect(2);
            haptics.selection();
            tutBtn2.disabled = true;
            tutBtn2.className = 'btn-secondary';
            tutBtn2.textContent = '✓';
            tutBtn2.style.opacity = '0.7';
            tutFill.style.width = '85%';
            tutMult.textContent = 'x3.0';
            tutBtn3.disabled = false;
            tutBtn3.className = 'btn-primary';
            tutBtn3.style.opacity = '1';
            tutFeedback.textContent = isEn ? '🔥 Tempo rising! Final tap [ 9 ]!' : '🔥 Темп нарастает! Финальный [ 9 ]!';
          };

          tutBtn3.onclick = () => {
            soundManager.playFeverStart();
            haptics.fever();
            tutBtn3.disabled = true;
            tutBtn3.textContent = '🔥';
            tutFill.style.width = '100%';
            tutFill.style.background = 'linear-gradient(90deg, #ff0055, #ffe600)';
            tutFill.style.boxShadow = '0 0 12px #ff0055';
            tutMult.textContent = isEn ? '🔥 FEVER x4.0!' : '🔥 FEVER x4.0!';
            tutMult.style.color = '#ff0055';
            tutFeedback.textContent = isEn
              ? '🚀 FEVER ACTIVATED! Multipliers up to x20!'
              : '🚀 FEVER АКТИВИРОВАН! Множитель комбо взлетел до x20!';
          };
        }
        break;
      }
      case 2: {
        this.tutorialTitle.textContent = isEn ? '🌑 Dark Sector: Eclipse Zone' : '🌑 Тёмный сектор: Зона затмения';
        this.tutorialVisualBox.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="display:grid;grid-template-columns:repeat(3, 38px);grid-template-rows:repeat(3, 38px);gap:4px;padding:6px;background:#0d1117;border:1px solid #ffaa00;border-radius:10px;">
              <div style="display:flex;align-items:center;justify-content:center;color:#555;background:#151515;border-radius:6px;font-size:16px;">🌑</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#ffaa00;background:rgba(255,170,0,0.15);border:1px solid #ffaa00;border-radius:6px;font-weight:900;">4</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#555;background:#151515;border-radius:6px;font-size:16px;">🌑</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#555;background:#151515;border-radius:6px;font-size:16px;">🌑</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#00f3ff;background:rgba(0,243,255,0.2);border:1px solid #00f3ff;border-radius:6px;font-weight:900;">7</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#555;background:#151515;border-radius:6px;font-size:16px;">🌑</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#555;background:#151515;border-radius:6px;font-size:16px;">🌑</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#555;background:#151515;border-radius:6px;font-size:16px;">🌑</div>
              <div style="display:flex;align-items:center;justify-content:center;color:#555;background:#151515;border-radius:6px;font-size:16px;">🌑</div>
            </div>
            <span style="font-size:12px;color:rgba(255,255,255,0.7);">${isEn ? '📡 Radar pulse illuminates neighboring cells' : '📡 Радарный импульс подсвечивает соседние клетки'}</span>
          </div>
        `;
        this.tutorialDescription.textContent = isEn
          ? 'In Dark Sector mode, numbers are shrouded in deep darkness. Fill cells or deploy the 📡 Radar Scanner to temporarily unveil surrounding cells (3s echo). Blind deduction earns huge bonus rating!'
          : 'В режиме Тёмного Сектора поле окутано тьмой. Заполнение клеток и использование 📡 Сканера временно освещают соседние клетки (эхо 3 сек). Дедукция вслепую приносит колоссальный бонусный рейтинг!';
        break;
      }
      case 3: {
        this.tutorialTitle.textContent = isEn ? '🤖 AI Duel & Roguelite Perks' : '🤖 Дуэль с ИИ и Перки';
        this.tutorialVisualBox.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;">
            <div style="display:flex;gap:10px;justify-content:center;align-items:center;width:90%;">
              <div style="background:rgba(0,243,255,0.12);border:1px solid #00f3ff;padding:5px 8px;border-radius:8px;text-align:center;flex:1;">
                <div style="font-size:10px;color:#00f3ff;font-weight:700;">YOU</div>
                <div id="tut-duel-player" style="font-size:14px;font-weight:900;color:#fff;">⚡ 0/2</div>
              </div>
              <div style="font-size:14px;font-weight:900;color:#ffaa00;">VS</div>
              <div style="background:rgba(255,0,85,0.12);border:1px solid #ff0055;padding:5px 8px;border-radius:8px;text-align:center;flex:1;">
                <div style="font-size:10px;color:#ff0055;font-weight:700;">CYBER BOT</div>
                <div id="tut-duel-bot" style="font-size:14px;font-weight:900;color:#fff;">🤖 0/2</div>
              </div>
            </div>
            <div id="tut-duel-action-box" style="margin:2px 0;">
              <button id="tut-btn-duel-start" class="btn-primary" style="padding:6px 14px;font-size:0.8rem;border-radius:8px;">${isEn ? '⚔️ Start Mini-Duel' : '⚔️ Проверить реакцию'}</button>
            </div>
            <span id="tut-duel-status" style="font-size:11px;color:rgba(255,255,255,0.7);">${isEn ? 'Test your solving speed against PulseBot!' : 'Проверьте скорость против PulseBot!'}</span>
          </div>
        `;
        this.tutorialDescription.textContent = isEn
          ? 'Compete speed-for-speed against PulseBot in real-time Duels! In Pulse Run, conquer consecutive stages and pick game-changing perks: Aegis Shields, Overcharge, EMP Pulses, and Freeze.'
          : 'Соревнуйтесь на скорость против PulseBot в реальном времени! В режиме забега Pulse Run проходите этапы и выбирайте кибер-перки: силовые щиты, EMP-импульсы, Хроно-буст и Overcharge.';

        const btnDuelStart = document.getElementById('tut-btn-duel-start') as HTMLButtonElement;
        const duelActionBox = document.getElementById('tut-duel-action-box');
        const duelPlayer = document.getElementById('tut-duel-player');
        const duelBot = document.getElementById('tut-duel-bot');
        const duelStatus = document.getElementById('tut-duel-status');

        if (btnDuelStart && duelActionBox && duelPlayer && duelBot && duelStatus) {
          btnDuelStart.onclick = () => {
            soundManager.playSelect();
            let battleOver = false;

            duelStatus.textContent = isEn ? '⚡ Quickly tap [ 4 ] then [ 8 ]!' : '⚡ Быстрее нажимайте [ 4 ] затем [ 8 ]!';
            duelActionBox.innerHTML = `
              <div style="display:flex;gap:12px;">
                <button id="tut-duel-4" class="btn-primary" style="width:40px;height:40px;font-size:1.1rem;font-weight:900;border-radius:8px;padding:0;">4</button>
                <button id="tut-duel-8" class="btn-secondary" style="width:40px;height:40px;font-size:1.1rem;font-weight:900;border-radius:8px;padding:0;opacity:0.4;" disabled>8</button>
              </div>
            `;

            const btn4 = document.getElementById('tut-duel-4') as HTMLButtonElement;
            const btn8 = document.getElementById('tut-duel-8') as HTMLButtonElement;

            const botTimer = setTimeout(() => {
              if (battleOver) return;
              if (duelBot) duelBot.textContent = '🤖 1/2';
              soundManager.playBotBeep();

              setTimeout(() => {
                if (battleOver) return;
                battleOver = true;
                if (duelBot) duelBot.textContent = '🤖 2/2';
                soundManager.playError();
                haptics.error();
                duelStatus.textContent = isEn ? '🤖 PulseBot finished first! Speed up!' : '🤖 Бот опередил! Тренируйте скорость!';
              }, 2000);
            }, 1800);

            if (btn4 && btn8) {
              btn4.onclick = () => {
                if (battleOver) return;
                duelPlayer.textContent = '⚡ 1/2';
                soundManager.playCorrect(1);
                haptics.selection();
                btn4.disabled = true;
                btn4.className = 'btn-secondary';
                btn4.textContent = '✓';
                btn4.style.opacity = '0.7';
                btn8.disabled = false;
                btn8.className = 'btn-primary';
                btn8.style.opacity = '1';
              };

              btn8.onclick = () => {
                if (battleOver) return;
                battleOver = true;
                clearTimeout(botTimer);
                duelPlayer.textContent = '⚡ 2/2';
                soundManager.playVictory();
                haptics.victory();
                btn8.disabled = true;
                btn8.textContent = '🏆';
                duelStatus.textContent = isEn
                  ? '🤖 PulseBot: "Whoa, human! Impressive speed. Challenge accepted!"'
                  : '🤖 PulseBot: "Ого, человек! Впечатляющая скорость. Принимаю вызов!"';
              };
            }
          };
        }
        break;
      }
      case 4: {
        this.tutorialTitle.textContent = isEn ? '🎮 Controls, Notes & Hints' : '🎮 Управление, Заметки и Подсказки';
        this.tutorialVisualBox.innerHTML = `
          <div style="display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;padding:4px;">
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;text-align:center;">
              <div style="font-size:18px;">📝</div>
              <div style="font-size:11px;font-weight:700;margin-top:2px;">${isEn ? 'Notes (N)' : 'Заметки (N)'}</div>
            </div>
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;text-align:center;">
              <div style="font-size:18px;">💡</div>
              <div style="font-size:11px;font-weight:700;margin-top:2px;">${isEn ? 'Hint (H)' : 'Подсказка (H)'}</div>
            </div>
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;text-align:center;">
              <div style="font-size:18px;">✨</div>
              <div style="font-size:11px;font-weight:700;margin-top:2px;">${isEn ? 'Auto-Notes' : 'Автозаметки'}</div>
            </div>
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;text-align:center;">
              <div style="font-size:18px;">⌫</div>
              <div style="font-size:11px;font-weight:700;margin-top:2px;">${isEn ? 'Erase / Undo' : 'Стереть / Undo'}</div>
            </div>
          </div>
        `;
        this.tutorialDescription.textContent = isEn
          ? 'Use the onscreen keypad or keyboard numbers 1–9. Toggle Notes mode to mark candidate digits, use Auto-Notes for smart candidates, or ask for a Hint if you ever get stuck!'
          : 'Управляйте нажатиями на экранную клавиатуру или клавишами 1–9. Включайте режим Заметок для проверки вариантов, используйте Автозаметки или берите Подсказку, если возникли трудности!';
        break;
      }
    }
  }
}

