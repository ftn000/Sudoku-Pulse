import { SudokuGame } from './game';
import { Difficulty, GameMode, GameStats, AppScreen } from './types';
import { soundManager } from './audio';
import { getRandomPerks } from './perks';
import { haptics } from './haptics';

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
  private btnMenuPlay!: HTMLButtonElement;
  private btnMenuDaily!: HTMLButtonElement;
  private btnMenuStats!: HTMLButtonElement;
  private btnMenuSettings!: HTMLButtonElement;
  private menuDailyDate!: HTMLElement;
  private menuDailyStreak!: HTMLElement;

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
  private leaderboardList!: HTMLElement;
  private statPlayed!: HTMLElement;
  private statWon!: HTMLElement;
  private statCombo!: HTMLElement;
  private statScore!: HTMLElement;
  private statStreak!: HTMLElement;
  private statRunStage!: HTMLElement;

  private settingsModal!: HTMLElement;
  private btnCloseSettings!: HTMLButtonElement;
  private settingSoundBtn!: HTMLButtonElement;
  private settingThemeBtn!: HTMLButtonElement;
  private themeSkinPills: HTMLButtonElement[] = [];

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

    if (!this.checkUrlChallenge()) {
      this.showScreen('menu');
    }

    this.game.setCallbacks({
      onStateChange: () => this.render(),
      onWin: (stats) => this.showWinModal(stats),
      onGameOver: () => this.showGameOverModal(),
      onLineComplete: (cells) => this.triggerLineWave(cells),
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
        } else if (sound === 'error') {
          soundManager.playError();
          haptics.error();
        } else if (sound === 'line') {
          soundManager.playLineComplete();
          haptics.success();
        } else if (sound === 'win') {
          soundManager.playVictory();
          haptics.victory();
        } else if (sound === 'fever') {
          soundManager.playFeverStart();
          haptics.fever();
        } else if (sound === 'fever_end') {
          soundManager.stopFeverTrack();
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
    this.btnMenuPlay = document.getElementById('btn-menu-play') as HTMLButtonElement;
    this.btnMenuDaily = document.getElementById('btn-menu-daily') as HTMLButtonElement;
    this.btnMenuStats = document.getElementById('btn-menu-stats') as HTMLButtonElement;
    this.btnMenuSettings = document.getElementById('btn-menu-settings') as HTMLButtonElement;
    this.menuDailyDate = document.getElementById('menu-daily-date')!;
    this.menuDailyStreak = document.getElementById('menu-daily-streak')!;

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
    this.leaderboardList = document.getElementById('leaderboard-list')!;
    this.statPlayed = document.getElementById('stat-played')!;
    this.statWon = document.getElementById('stat-won')!;
    this.statCombo = document.getElementById('stat-combo')!;
    this.statScore = document.getElementById('stat-score')!;
    this.statStreak = document.getElementById('stat-streak')!;
    this.statRunStage = document.getElementById('stat-run-stage')!;

    this.settingsModal = document.getElementById('settings-modal')!;
    this.btnCloseSettings = document.getElementById('btn-close-settings') as HTMLButtonElement;
    this.settingSoundBtn = document.getElementById('setting-sound-btn') as HTMLButtonElement;
    this.settingThemeBtn = document.getElementById('setting-theme-btn') as HTMLButtonElement;
    this.themeSkinPills = Array.from(document.querySelectorAll('.theme-skin-pill'));

    this.adModal = document.getElementById('ad-modal')!;
    this.adRewardTitle = document.getElementById('ad-reward-title')!;
    this.adProgressFill = document.getElementById('ad-progress-fill')!;
    this.adTimerText = document.getElementById('ad-timer-text')!;

    this.bgParticlesCanvas = document.getElementById('bg-particles-canvas') as HTMLCanvasElement;
    this.bgParticlesCtx = this.bgParticlesCanvas.getContext('2d');
    this.confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    this.confettiCtx = this.confettiCanvas.getContext('2d');

    for (let i = 1; i <= 9; i++) {
      const btn = document.getElementById(`num-${i}`) as HTMLButtonElement;
      if (btn) this.numpadButtons.push(btn);
    }

    // Load initial settings & player name
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const defaultName = tgUser?.username || tgUser?.first_name || `Pulse#${Math.floor(100 + Math.random() * 899)}`;
    const savedName = localStorage.getItem('sudoku_player_name') || defaultName;
    this.playerNameInput.value = savedName;
    localStorage.setItem('sudoku_player_name', savedName);

    const savedTheme = localStorage.getItem('sudoku_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButtons(savedTheme);
    this.updateSoundButtons(soundManager.enabled);
  }

  public showScreen(screen: AppScreen) {
    this.currentScreen = screen;
    this.screenMenu.classList.toggle('hidden', screen !== 'menu');
    this.screenModes.classList.toggle('hidden', screen !== 'mode_select');
    this.screenPerks.classList.toggle('hidden', screen !== 'perk_select');
    this.screenGame.classList.toggle('hidden', screen !== 'game');

    if (screen === 'game') {
      this.startTimer();
      this.render();
    } else {
      this.stopTimer();
      soundManager.stopFeverTrack();
    }
  }

  private initEventListeners() {
    // Menu navigation
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

    this.btnMenuStats.addEventListener('click', () => {
      soundManager.playSelect();
      this.showStatsModal();
    });

    this.btnMenuSettings.addEventListener('click', () => {
      soundManager.playSelect();
      this.settingsModal.classList.remove('hidden');
    });

    this.btnCloseStats.addEventListener('click', () => {
      this.statsModal.classList.add('hidden');
    });

    this.btnCloseSettings.addEventListener('click', () => {
      this.settingsModal.classList.add('hidden');
    });

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

    // Numpad clicks
    this.numpadButtons.forEach((btn, index) => {
      const num = index + 1;
      btn.addEventListener('click', () => {
        this.game.inputNumber(num);
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
    });

    this.btnWinMenu.addEventListener('click', () => {
      this.winModal.classList.add('hidden');
      this.stopConfetti();
      this.showScreen('menu');
      this.updateDailyInfoOnMenu();
    });

    // Daily Share button & Challenge Share button
    this.btnDailyShare.addEventListener('click', () => {
      this.copyDailyResultToClipboard();
    });

    this.btnChallengeShare.addEventListener('click', () => {
      this.copyChallengeLinkToClipboard();
    });

    this.playerNameInput.addEventListener('change', async () => {
      const name = this.playerNameInput.value.trim() || 'CyberPlayer';
      this.playerNameInput.value = name;
      localStorage.setItem('sudoku_player_name', name);
      this.showToast(`✅ Никнейм сохранён: ${name}`);
      try {
        const playerId = SudokuGame.getOrCreatePlayerId();
        const apiBase = window.location.pathname.startsWith('/sudoku') ? '/sudoku/api/leaderboard' : '/api/leaderboard';
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
    });

    this.btnGameOverMenu.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.showScreen('menu');
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
        if (this.game.isFogActive()) {
          this.showToast('🔦 Туман войны: кликайте по клеткам, чтобы светить фонариком! Верные ответы зажигают маяки навсегда.');
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
    this.menuDailyStreak.textContent = `🔥 ${stats.dailyStreak} дн.`;
  }

  public render() {
    if (this.currentScreen !== 'game') return;

    this.renderHeaderAndStatus();
    this.renderPulseBar();
    this.renderBoard();
    this.renderToolbar();
    this.renderNumpad();
  }

  private renderHeaderAndStatus() {
    // Mode badge
    const modeNames: Record<GameMode, string> = {
      classic: '⚡ Классика',
      fog: '🌫️ Туман войны',
      daily: '📅 Daily Pulse',
      run: `🚀 Забег (Этап ${this.game.runStage})`,
    };
    this.gameModeBadge.textContent = modeNames[this.game.mode];

    // Perk badge
    if (this.game.activePerks.length > 0) {
      if (this.game.activePerks.length === 1) {
        const perk = this.game.activePerks[0];
        this.gamePerkBadge.textContent = `${perk.icon} ${perk.name}`;
      } else {
        const icons = this.game.activePerks.map((p) => p.icon).join(' ');
        this.gamePerkBadge.textContent = `${icons} (${this.game.activePerks.length})`;
      }
      this.gamePerkBadge.title = this.game.activePerks.map((p) => `${p.icon} ${p.name}: ${p.description}`).join('\n');
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
        this.comboBadge.textContent = `⚡ PULSE x1.0`;
        this.pulseStatusText.textContent = `Решайте быстро для комбо!`;
      }
    }
  }

  private renderBoard() {
    this.boardElement.innerHTML = '';

    const selected = this.game.selectedCell;
    const selectedValue = selected ? this.game.board[selected.row][selected.col].value : 0;
    const selectedBoxRow = selected ? Math.floor(selected.row / 3) : -1;
    const selectedBoxCol = selected ? Math.floor(selected.col / 3) : -1;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellData = this.game.board[r][c];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.dataset.row = r.toString();
        cellDiv.dataset.col = c.toString();

        // Fog of War
        if (cellData.isInFog) {
          cellDiv.classList.add('in-fog');
        }
        if (cellData.isInTorch) {
          cellDiv.classList.add('in-torch');
        }
        if (cellData.isBeacon && this.game.isFogActive()) {
          cellDiv.classList.add('beacon');
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
        } else if (cellData.notes.size > 0 && !cellData.isInFog) {
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

  private showWinModal(stats: GameStats) {
    const mins = Math.floor(stats.timeSeconds / 60);
    const secs = stats.timeSeconds % 60;
    this.modalTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.modalScore.textContent = stats.score.toLocaleString('ru-RU');
    this.modalCombo.textContent = `x${stats.maxCombo}`;
    this.modalMistakes.textContent = `${stats.mistakes}/${this.game.maxMistakes}`;

    const modeLabels: Record<GameMode, string> = {
      classic: 'Классический',
      fog: 'Туман войны',
      daily: 'Daily Pulse',
      run: `Pulse Run (Этап ${this.game.runStage})`,
    };
    this.modalMode.textContent = modeLabels[stats.mode];

    if (stats.mode === 'run') {
      const nextStage = this.game.runStage + 1;
      const stageBonus = 1500 * this.game.runStage;
      this.modalWinTitle.textContent = `🚀 Этап ${this.game.runStage} пройден!`;
      this.modalSubtitle.textContent = `Бонус за этап: +${stageBonus.toLocaleString('ru-RU')} очков! Выберите новый перк:`;
      this.nextStageNum.textContent = nextStage.toString();
      this.runStageUpgrade.classList.remove('hidden');
      this.playAgainBtn.classList.add('hidden');
      this.btnDailyShare.classList.add('hidden');

      this.runPerksDraft.innerHTML = '';
      const ownedIds = this.game.activePerks.map((p) => p.id);
      const drafted = getRandomPerks(3, ownedIds);
      drafted.forEach((perk) => {
        const card = document.createElement('div');
        card.className = 'perk-card';
        card.style.padding = '10px 12px';
        card.innerHTML = `
          <div class="perk-icon-lg" style="font-size:1.5rem;">${perk.icon}</div>
          <div class="perk-info">
            <div class="perk-title" style="font-size:0.95rem;">${perk.name}</div>
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
      this.btnDailyShare.classList.toggle('hidden', stats.mode !== 'daily');
    }

    this.winModal.classList.remove('hidden');
    this.startConfetti();
    this.updateDailyInfoOnMenu();
    this.submitScoreToLeaderboard(stats);
  }

  private checkUrlChallenge(): boolean {
    const params = new URLSearchParams(window.location.search);
    const seedStr = params.get('seed');
    if (!seedStr) return false;

    const seed = parseInt(seedStr, 10);
    if (isNaN(seed)) return false;

    const diffParam = (params.get('diff') as Difficulty) || 'medium';
    const modeParam = (params.get('mode') as GameMode) || 'classic';
    const validDiffs: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
    const diff: Difficulty = validDiffs.includes(diffParam) ? diffParam : 'medium';
    const mode: GameMode = ['classic', 'fog', 'daily', 'run'].includes(modeParam) ? modeParam : 'classic';

    this.selectedDifficulty = diff;
    this.selectedMode = mode;

    // Clean URL query params without reloading
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    setTimeout(() => {
      this.game.startNewGame({
        difficulty: diff,
        mode,
        seed,
      });
      this.showScreen('game');
      this.showToast(`🎯 Вызов по ссылке запущен (Seed #${seed})!`);
    }, 100);

    return true;
  }

  private copyChallengeLinkToClipboard() {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?seed=${this.game.currentSeed}&diff=${this.game.difficulty}&mode=${this.game.mode}`;
    const mins = Math.floor(this.game.timerSeconds / 60);
    const secs = this.game.timerSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const text = `🎯 Вызов в Sudoku Pulse!\nМой счёт: ${this.game.score.toLocaleString('ru-RU')} за ${timeStr}.\nПопробуй побить на том же раскладе:\n${url}`;

    navigator.clipboard.writeText(text).then(() => {
      this.showToast('🔗 Ссылка-вызов скопирована в буфер обмена!');
    }).catch(() => {
      this.showToast('🔗 Не удалось скопировать ссылку.');
    });
  }

  private async submitScoreToLeaderboard(stats: GameStats) {
    try {
      const playerId = SudokuGame.getOrCreatePlayerId();
      const playerName = (localStorage.getItem('sudoku_player_name') || this.playerNameInput?.value || 'Игрок').trim() || 'Игрок';
      const apiBase = window.location.pathname.startsWith('/sudoku') ? '/sudoku/api/leaderboard' : '/api/leaderboard';
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
      const myPlayerId = SudokuGame.getOrCreatePlayerId();
      const apiBase = window.location.pathname.startsWith('/sudoku') ? '/sudoku/api/leaderboard' : '/api/leaderboard';
      const res = await fetch(apiBase);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const entries: Array<{
        playerId?: string;
        name: string;
        score: number;
        mode: string;
        difficulty?: string;
        runStage?: number;
      }> = data.entries || data.leaderboard || [];

      if (entries.length === 0) {
        this.leaderboardList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">Пока нет записей. Станьте первым!</div>`;
        return;
      }

      this.leaderboardList.innerHTML = entries.slice(0, 15).map((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const badge = item.mode === 'run' ? `🚀 Эт.${item.runStage || 1}` : item.mode === 'daily' ? '📅 Daily' : item.mode === 'fog' ? '🌫️ Туман' : '⚡ Классика';
        const isMe = item.playerId && item.playerId === myPlayerId;
        const rowBg = isMe ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255,255,255,0.03)';
        const rowBorder = isMe ? 'var(--primary)' : 'var(--border-subtle)';
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-radius:8px; background:${rowBg}; border:1px solid ${rowBorder}; font-size:0.85rem;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:700; min-width:24px;">${medal}</span>
              <span style="font-weight:600; color:var(--text-main);">${item.name.replace(/</g, '&lt;')}${isMe ? ' <span style="color:var(--accent); font-size:0.75rem;">(Вы)</span>' : ''}</span>
              <span style="font-size:0.75rem; color:var(--text-muted);">${badge}</span>
            </div>
            <span style="font-weight:700; color:var(--accent);">${Number(item.score).toLocaleString('ru-RU')}</span>
          </div>
        `;
      }).join('');
    } catch {
      this.leaderboardList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:8px;">Онлайн-сервер недоступен (офлайн-режим)</div>`;
    }
  }

  private copyDailyResultToClipboard() {
    const mins = Math.floor(this.game.timerSeconds / 60);
    const secs = this.game.timerSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const shareText = `⚡ Sudoku Pulse Daily #${today}
⏱️ Время: ${timeStr} | 🔥 Макс. комбо: x${this.game.maxComboAchieved}
❤️ Ошибки: ${this.game.mistakesCount}/${this.game.maxMistakes} | 💎 Очки: ${this.game.score.toLocaleString()}
🟩🟩🟩🟨🟩
Сыграй в Sudoku Pulse!`;

    navigator.clipboard.writeText(shareText).then(() => {
      this.showToast('📋 Результат скопирован в буфер обмена!');
    }).catch(() => {
      this.showToast('📋 Не удалось скопировать.');
    });
  }

  private showGameOverModal() {
    if (this.game.mode === 'run') {
      this.gameOverSubtitle.textContent = `Забег окончен на Этапе ${this.game.runStage}. Ваш счёт: ${this.game.score.toLocaleString('ru-RU')}`;
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
    this.statsModal.classList.remove('hidden');
    this.fetchAndRenderLeaderboard();
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
    toast.className = 'toast';
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

