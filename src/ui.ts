import { SudokuGame } from './game';
import { Difficulty, DIFFICULTY_CONFIGS, GameStats } from './types';
import { soundManager } from './audio';

export class SudokuUI {
  private game: SudokuGame;
  private timerInterval?: number;

  // DOM Elements
  private boardElement!: HTMLElement;
  private timerElement!: HTMLElement;
  private mistakesElement!: HTMLElement;
  private difficultySelect!: HTMLSelectElement;
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

  // Win Modal
  private winModal!: HTMLElement;
  private modalTime!: HTMLElement;
  private modalDifficulty!: HTMLElement;
  private modalMistakes!: HTMLElement;
  private modalHints!: HTMLElement;
  private playAgainBtn!: HTMLButtonElement;

  // Game Over Modal
  private gameOverModal!: HTMLElement;
  private secondChanceBtn!: HTMLButtonElement;
  private restartGameOverBtn!: HTMLButtonElement;

  // Mock Ad Modal
  private adModal!: HTMLElement;
  private adRewardTitle!: HTMLElement;
  private adProgressFill!: HTMLElement;
  private adTimerText!: HTMLElement;

  // Confetti Canvas
  private confettiCanvas!: HTMLCanvasElement;
  private confettiCtx!: CanvasRenderingContext2D | null;
  private confettiAnimationId?: number;

  constructor(game: SudokuGame) {
    this.game = game;
    this.initDOMElements();
    this.initEventListeners();
    this.initConfetti();
    this.startTimer();
    this.render();

    this.game.setCallbacks({
      onStateChange: () => this.render(),
      onWin: (stats) => this.showWinModal(stats),
      onGameOver: () => this.showGameOverModal(),
      onLineComplete: (cells) => this.triggerLineWave(cells),
      onSoundTrigger: (sound) => {
        if (sound === 'select') soundManager.playSelect();
        else if (sound === 'place') soundManager.playSelect();
        else if (sound === 'correct') soundManager.playCorrect();
        else if (sound === 'error') soundManager.playError();
        else if (sound === 'line') soundManager.playLineComplete();
        else if (sound === 'win') soundManager.playVictory();
      },
    });
  }

  private initDOMElements() {
    this.boardElement = document.getElementById('sudoku-board')!;
    this.timerElement = document.getElementById('timer')!;
    this.mistakesElement = document.getElementById('mistakes')!;
    this.difficultySelect = document.getElementById('difficulty-select') as HTMLSelectElement;
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

    // Win Modal
    this.winModal = document.getElementById('win-modal')!;
    this.modalTime = document.getElementById('modal-time')!;
    this.modalDifficulty = document.getElementById('modal-difficulty')!;
    this.modalMistakes = document.getElementById('modal-mistakes')!;
    this.modalHints = document.getElementById('modal-hints')!;
    this.playAgainBtn = document.getElementById('btn-play-again') as HTMLButtonElement;

    // Game Over Modal
    this.gameOverModal = document.getElementById('gameover-modal')!;
    this.secondChanceBtn = document.getElementById('btn-second-chance') as HTMLButtonElement;
    this.restartGameOverBtn = document.getElementById('btn-restart-gameover') as HTMLButtonElement;

    // Ad Modal
    this.adModal = document.getElementById('ad-modal')!;
    this.adRewardTitle = document.getElementById('ad-reward-title')!;
    this.adProgressFill = document.getElementById('ad-progress-fill')!;
    this.adTimerText = document.getElementById('ad-timer-text')!;

    // Confetti canvas
    this.confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    this.confettiCtx = this.confettiCanvas.getContext('2d');

    // Numpad buttons
    for (let i = 1; i <= 9; i++) {
      const btn = document.getElementById(`num-${i}`) as HTMLButtonElement;
      if (btn) this.numpadButtons.push(btn);
    }

    // Set saved theme and sound
    const savedTheme = localStorage.getItem('sudoku_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.themeToggleBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    this.soundToggleBtn.textContent = soundManager.enabled ? '🔊' : '🔇';
  }

  private initEventListeners() {
    // Difficulty selector
    this.difficultySelect.value = this.game.difficulty;
    this.difficultySelect.addEventListener('change', () => {
      const diff = this.difficultySelect.value as Difficulty;
      this.game.startNewGame(diff);
    });

    // Theme toggle
    this.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('sudoku_theme', next);
      this.themeToggleBtn.textContent = next === 'dark' ? '🌙' : '☀️';
    });

    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      const isEnabled = soundManager.toggle();
      this.soundToggleBtn.textContent = isEnabled ? '🔊' : '🔇';
      if (isEnabled) soundManager.playSelect();
    });

    // Pause / Resume
    this.pauseBtn.addEventListener('click', () => this.game.togglePause());
    this.resumeBtn.addEventListener('click', () => this.game.togglePause());

    // Toolbar buttons
    this.notesBtn.addEventListener('click', () => this.game.toggleNotesMode());
    this.undoBtn.addEventListener('click', () => this.game.undo());
    this.eraseBtn.addEventListener('click', () => this.game.eraseCell());

    // Hint button click: gives hint or triggers ad for extra hint
    this.hintBtn.addEventListener('click', () => {
      if (this.game.hintsRemaining > 0) {
        this.game.giveHint();
      } else {
        this.showMockAd('🎁 Награда: +1 Подсказка', () => {
          this.game.addBonusHint();
          this.showToast('🎉 Получена дополнительная подсказка!');
        });
      }
    });

    this.newGameBtn.addEventListener('click', () => {
      this.game.startNewGame(this.difficultySelect.value as Difficulty);
    });

    // Numpad click
    this.numpadButtons.forEach((btn, index) => {
      const num = index + 1;
      btn.addEventListener('click', () => {
        this.game.inputNumber(num);
      });
    });

    // Win Modal Play Again
    this.playAgainBtn.addEventListener('click', () => {
      this.winModal.classList.add('hidden');
      this.stopConfetti();
      this.game.startNewGame(this.difficultySelect.value as Difficulty);
    });

    // Game Over Second Chance
    this.secondChanceBtn.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.showMockAd('❤️ Второй шанс: +1 Жизнь', () => {
        this.game.reviveSecondChance();
        this.showToast('❤️ Вы получили второй шанс!');
      });
    });

    // Game Over Restart
    this.restartGameOverBtn.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.game.startNewGame(this.difficultySelect.value as Difficulty);
    });

    // Keyboard support
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.game.status === 'completed' || this.game.status === 'gameover') return;

      // Numbers 1-9
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        this.game.inputNumber(num);
        return;
      }

      // Arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        this.handleArrowKey(e.key);
        return;
      }

      // Erase / Backspace / Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.game.eraseCell();
        return;
      }

      // Notes toggle (N key)
      if (e.key.toLowerCase() === 'n') {
        this.game.toggleNotesMode();
        return;
      }

      // Undo (Ctrl+Z or Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.game.undo();
        return;
      }

      // Redo (Ctrl+Y)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.game.redo();
        return;
      }

      // Hint (H key)
      if (e.key.toLowerCase() === 'h') {
        if (this.game.hintsRemaining > 0) {
          this.game.giveHint();
        } else {
          this.showMockAd('🎁 Награда: +1 Подсказка', () => {
            this.game.addBonusHint();
            this.showToast('🎉 Получена дополнительная подсказка!');
          });
        }
        return;
      }

      // Pause (Escape or P)
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        this.game.togglePause();
        return;
      }
    });
  }

  private handleArrowKey(key: string) {
    let r = this.game.selectedCell?.row ?? 4;
    let c = this.game.selectedCell?.col ?? 4;

    switch (key) {
      case 'ArrowUp':
        r = Math.max(0, r - 1);
        break;
      case 'ArrowDown':
        r = Math.min(8, r + 1);
        break;
      case 'ArrowLeft':
        c = Math.max(0, c - 1);
        break;
      case 'ArrowRight':
        c = Math.min(8, c + 1);
        break;
    }

    this.game.selectCell(r, c);
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      this.game.tickTimer();
    }, 1000);
  }

  public render() {
    this.renderHeaderAndStatus();
    this.renderBoard();
    this.renderToolbar();
    this.renderNumpad();
  }

  private renderHeaderAndStatus() {
    // Format timer
    const mins = Math.floor(this.game.timerSeconds / 60);
    const secs = this.game.timerSeconds % 60;
    this.timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Mistakes: e.g. 0/3
    this.mistakesElement.textContent = `${this.game.mistakesCount}/${this.game.maxMistakes}`;

    // Pause state
    if (this.game.status === 'paused') {
      this.pauseOverlay.classList.remove('hidden');
      this.pauseBtn.textContent = '▶';
    } else {
      this.pauseOverlay.classList.add('hidden');
      this.pauseBtn.textContent = '⏸';
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

        const isSelected = selected && selected.row === r && selected.col === c;
        const inSameBox = Math.floor(r / 3) === selectedBoxRow && Math.floor(c / 3) === selectedBoxCol;
        const inSameLine = selected && (selected.row === r || selected.col === c);
        const hasSameValue = selectedValue > 0 && cellData.value === selectedValue;

        if (isSelected) {
          cellDiv.classList.add('selected');
        } else if (hasSameValue) {
          cellDiv.classList.add('highlight-same');
        } else if (inSameLine || inSameBox) {
          cellDiv.classList.add('highlight-area');
        }

        // Error vs Conflict Peer:
        // 1. Error cell: RED background and its digit shakes
        // 2. Conflict peer: regular matching blue background + pulsing digit (NOT red!)
        if (cellData.isError) {
          cellDiv.classList.add('error');
        } else if (cellData.isConflictPeer) {
          cellDiv.classList.add('conflict-peer');
        }

        if (cellData.isGiven) {
          cellDiv.classList.add('given');
        } else if (cellData.isLocked) {
          cellDiv.classList.add('locked');
        } else {
          cellDiv.classList.add('user-value');
        }

        if (cellData.value > 0) {
          const digitSpan = document.createElement('span');
          digitSpan.className = 'cell-digit';
          digitSpan.textContent = cellData.value.toString();

          // Only shake the digit if this cell is an error
          if (cellData.isError) {
            digitSpan.classList.add('shake');
          }

          cellDiv.appendChild(digitSpan);
        } else if (cellData.notes.size > 0) {
          // Render 3x3 notes mini grid
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
    if (this.game.isNotesMode) {
      this.notesBtn.classList.add('active');
    } else {
      this.notesBtn.classList.remove('active');
    }

    // Hint button & badge
    if (this.game.hintsRemaining > 0) {
      this.hintBtnLabel.textContent = 'Подсказка';
      this.hintCounterBadge.textContent = this.game.hintsRemaining.toString();
      this.hintCounterBadge.className = 'badge-counter';
      this.hintBtn.title = `Подсказка (H) - осталось: ${this.game.hintsRemaining}`;
    } else {
      this.hintBtnLabel.textContent = '+1 Подсказка';
      this.hintCounterBadge.textContent = '🎬';
      this.hintCounterBadge.className = 'badge-counter ad-badge';
      this.hintBtn.title = 'Смотреть рекламу для получения подсказки';
    }

    // Undo button
    this.undoBtn.disabled = this.game.history.length === 0;

    // Erase button disabled if current cell is locked or empty
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

      if (remaining <= 0) {
        btn.classList.add('completed');
      } else {
        btn.classList.remove('completed');
      }
    }
  }

  private triggerLineWave(cells: Array<[number, number]>) {
    cells.forEach(([r, c]) => {
      const cellElem = this.boardElement.querySelector(
        `.cell[data-row="${r}"][data-col="${c}"]`
      );
      if (cellElem) {
        cellElem.classList.remove('line-wave');
        // Force reflow
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
    this.modalDifficulty.textContent = DIFFICULTY_CONFIGS[stats.difficulty].label;
    this.modalMistakes.textContent = `${stats.mistakes}/${this.game.maxMistakes}`;
    this.modalHints.textContent = stats.hintsUsed.toString();

    this.winModal.classList.remove('hidden');
    this.startConfetti();
  }

  private showGameOverModal() {
    this.gameOverModal.classList.remove('hidden');
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
}
