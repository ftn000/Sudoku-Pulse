export class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private feverLoopId: number | null = null;
  private feverStep: number = 0;

  public soundTheme: string = 'neon';
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.7;
  private sfxGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;

  constructor() {
    const saved = localStorage.getItem('sudoku_sound_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
    this.soundTheme = localStorage.getItem('sudoku_board_skin') || 'neon';
    const savedSfx = localStorage.getItem('sudoku_sfx_volume');
    this.sfxVolume = savedSfx !== null ? Math.max(0, Math.min(1, parseFloat(savedSfx))) : 0.8;
    const savedMusic = localStorage.getItem('sudoku_music_volume');
    this.musicVolume = savedMusic !== null ? Math.max(0, Math.min(1, parseFloat(savedMusic))) : 0.7;
  }

  public setSoundTheme(theme: string) {
    this.soundTheme = theme;
  }

  public isSoundEnabled(): boolean {
    return this.enabled;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sudoku_sfx_volume', this.sfxVolume.toString());
    if (this.sfxGainNode && this.ctx) {
      try { this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime); } catch {}
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sudoku_music_volume', this.musicVolume.toString());
    if (this.musicGainNode && this.ctx) {
      try { this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime); } catch {}
    }
  }

  public getSfxDestination(): AudioNode {
    return this.sfxGainNode || this.ctx!.destination;
  }

  public getMusicDestination(): AudioNode {
    return this.musicGainNode || this.ctx!.destination;
  }

  public playBotBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [640, 1080].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.04, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.04);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.045);
    });
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.ctx && !this.sfxGainNode) {
        this.sfxGainNode = this.ctx.createGain();
        this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGainNode.connect(this.ctx.destination);
      }
      if (this.ctx && !this.musicGainNode) {
        this.musicGainNode = this.ctx.createGain();
        this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGainNode.connect(this.ctx.destination);
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('sudoku_sound_enabled', this.enabled.toString());
    if (!this.enabled) {
      this.stopFeverTrack();
    }
    return this.enabled;
  }

  private wasMutedByAd: boolean = false;
  private wasMutedByFocus: boolean = false;
  private adMuteDepth: number = 0;

  public muteForAd() {
    if (this.adMuteDepth === 0) {
      this.wasMutedByAd = this.enabled;
    }
    this.adMuteDepth++;
    this.enabled = false;
    this.stopFeverTrack();
    if (this.ctx && this.ctx.state === 'running') {
      try { this.ctx.suspend(); } catch {}
    }
  }

  public unmuteAfterAd() {
    if (this.adMuteDepth > 0) {
      this.adMuteDepth--;
    }
    if (this.adMuteDepth === 0) {
      if (this.wasMutedByAd) {
        this.enabled = true;
        this.wasMutedByAd = false;
        if (this.ctx && this.ctx.state === 'suspended') {
          try { this.ctx.resume(); } catch {}
        }
      }
    }
  }

  public ensureContextActive() {
    const saved = localStorage.getItem('sudoku_sound_enabled');
    const userWantsSound = saved !== null ? saved === 'true' : true;
    if (userWantsSound && this.adMuteDepth === 0 && !this.wasMutedByFocus) {
      this.enabled = true;
    }
    try {
      if (!this.ctx) {
        this.getContext();
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {}
  }

  public pauseAll() {
    if (this.enabled) {
      this.wasMutedByFocus = true;
      this.enabled = false;
    }
    this.stopFeverTrack();
    if (this.ctx && this.ctx.state === 'running') {
      try { this.ctx.suspend(); } catch {}
    }
  }

  public resumeAll() {
    if (this.wasMutedByFocus) {
      this.enabled = true;
      this.wasMutedByFocus = false;
    }
    if (this.enabled && this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch {}
    }
  }

  public playSelect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (this.soundTheme) {
      case 'matrix':
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.025, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
        break;
      case 'synthwave':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        break;
      case 'hologram':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        break;
      case 'obsidian':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        break;
      case 'aqua':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        break;
      case 'crimson':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
        break;
      case 'retro':
        osc.type = 'square';
        osc.frequency.setValueAtTime(783.99, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        break;
      case 'neon':
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        break;
    }

    osc.connect(gain);
    gain.connect(this.getSfxDestination());
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  public playCorrect(combo: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pitch scales with combo count (up to 8 steps)
    const baseFreq = 440 * Math.pow(2, Math.min(combo - 1, 8) / 12);

    let oscType: OscillatorType = 'triangle';
    let triad = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    let noteDuration = 0.14;
    let volume = 0.07;

    switch (this.soundTheme) {
      case 'matrix':
        oscType = 'square';
        triad = [baseFreq * 0.75, baseFreq, baseFreq * 1.5];
        volume = 0.04;
        noteDuration = 0.1;
        break;
      case 'synthwave':
        oscType = 'sawtooth';
        triad = [baseFreq * 0.5, baseFreq, baseFreq * 1.25];
        volume = 0.05;
        noteDuration = 0.18;
        break;
      case 'hologram':
        oscType = 'sine';
        triad = [baseFreq * 1.5, baseFreq * 2, baseFreq * 2.5];
        volume = 0.06;
        noteDuration = 0.2;
        break;
      case 'obsidian':
        oscType = 'triangle';
        triad = [baseFreq * 0.75, baseFreq * 1.25, baseFreq * 1.75];
        volume = 0.06;
        noteDuration = 0.16;
        break;
      case 'neon':
      default:
        oscType = 'triangle';
        triad = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
        volume = 0.07;
        noteDuration = 0.14;
        break;
    }

    triad.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(volume, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + noteDuration);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + noteDuration + 0.02);
    });
  }

  public playError() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [220, 207].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.22);
    });
  }

  public playShieldDeflect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.getSfxDestination());
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playFeverStart() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Ascending arpeggio burst
    [330, 440, 554, 659, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.1, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.22);
    });

    this.startFeverTrack();
  }

  public startFeverTrack() {
    if (this.feverLoopId !== null) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // 130 BPM = ~115ms per 16th note
    const stepDuration = 0.115;
    const bassScale = [110, 110, 130.8, 146.8, 164.8, 146.8, 130.8, 98];

    this.feverLoopId = window.setInterval(() => {
      const now = ctx.currentTime;
      const freq = bassScale[this.feverStep % bassScale.length];
      this.feverStep++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.getMusicDestination());
      osc.start(now);
      osc.stop(now + 0.095);
    }, stepDuration * 1000);
  }

  public stopFeverTrack() {
    if (this.feverLoopId !== null) {
      clearInterval(this.feverLoopId);
      this.feverLoopId = null;
      this.feverStep = 0;
    }
  }

  public playLineComplete() {
    this.playLineChord(1, ['row']);
  }

  public playLineChord(count: number = 1, types: Array<'row' | 'col' | 'box'> = ['row']) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (count >= 3) {
      // TRIPLE CLEAR! (Row + Col + Box) -> Mega synth fanfare & power chord
      const bassNotes = [130.81, 196.0]; // C3, G3
      bassNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now);
        osc.stop(now + 0.52);
      });

      const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98]; // C5, E5, G5, B5, C6, E6, G6
      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        gain.gain.setValueAtTime(0.1, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.35);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.36);
      });
    } else if (count === 2) {
      // DUAL CLEAR (e.g. Row + Col cross or Line + Box) -> Major 7th chord sweep
      const dualBass = [196.0]; // G3
      dualBass.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now);
        osc.stop(now + 0.36);
      });

      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.09, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.29);
      });
    } else {
      // SINGLE CLEAR (Row, Col, or 3x3 Box) -> Bright crystalline neon arpeggio
      const isBox = types.includes('box');
      const baseNotes = isBox
        ? [587.33, 739.99, 880.0, 1174.66] // D5, F#5, A5, D6 (warm shimmer)
        : [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (classic neon)

      baseNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.09, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.23);
      });
    }
  }

  public playVictory() {
    this.stopFeverTrack();
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chords = [
      { notes: [523.25, 659.25, 783.99], time: 0 },
      { notes: [587.33, 739.99, 880.0], time: 0.18 },
      { notes: [659.25, 830.61, 987.77], time: 0.36 },
      { notes: [783.99, 987.77, 1174.66, 1567.98], time: 0.6 },
    ];
    chords.forEach((c) => {
      c.notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + c.time);
        gain.gain.setValueAtTime(0.08, now + c.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + c.time + 0.4);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now + c.time);
        osc.stop(now + c.time + 0.42);
      });
    });
  }

  public playAchievement() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Sparkle bells: E5, G#5, B5, E6, G#6
    const bells = [659.25, 830.61, 987.77, 1318.51, 1661.22];
    bells.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.09, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.38);
    });
    // Golden chord sustaining at the end
    [523.25, 659.25, 1046.5].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.25);
      gain.gain.setValueAtTime(0.07, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + 0.5);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + 0.25);
      osc.stop(now + 0.25 + 0.52);
    });
  }

  public playSeasonChestOpen() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Sci-fi charge up / energy surge sweep
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(140, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(720, now + 0.22);
    sweepGain.gain.setValueAtTime(0.01, now);
    sweepGain.gain.linearRampToValueAtTime(0.12, now + 0.18);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.getSfxDestination());
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.26);

    // 2. Cyber-Latch mechanical unlock click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1800, now + 0.2);
    clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.26);
    clickGain.gain.setValueAtTime(0.14, now + 0.2);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    clickOsc.connect(clickGain);
    clickGain.connect(this.getSfxDestination());
    clickOsc.start(now + 0.2);
    clickOsc.stop(now + 0.29);

    // 3. Shimmering reward bell arpeggio: C5, E5, G5, B5, D6, G6
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const noteTime = now + 0.26 + idx * 0.055;
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.09, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(noteTime);
      osc.stop(noteTime + 0.48);
    });
  }

  public playCountdownTick(step: number = 3) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freq = step === 1 ? 783.99 : (step === 2 ? 659.25 : 523.25);

    // Pulse Beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.08);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());
    osc.start(now);
    osc.stop(now + 0.095);

    // Click transient
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(1400, now);
    clickGain.gain.setValueAtTime(0.04, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    click.connect(clickGain);
    clickGain.connect(this.getSfxDestination());
    click.start(now);
    click.stop(now + 0.025);
  }

  public playCountdownGo() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sub bass punch
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(130.81, now); // C3
    bass.frequency.exponentialRampToValueAtTime(98.0, now + 0.3);
    bassGain.gain.setValueAtTime(0.14, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    bass.connect(bassGain);
    bassGain.connect(this.getSfxDestination());
    bass.start(now);
    bass.stop(now + 0.36);

    // Neon fanfare power triad (C5, G5, C6)
    [523.25, 783.99, 1046.5].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.95, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  public playDuelWin() {
    this.stopFeverTrack();
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast 6-step ascending triumphant arpeggio
    const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.07, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.23);
    });

    // Sustained triumphant cyber chord at the end
    const chordTime = now + 0.24;
    [523.25, 659.25, 783.99, 1046.5, 1567.98].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, chordTime);
      gain.gain.setValueAtTime(0.08, chordTime);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.65);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(chordTime);
      osc.stop(chordTime + 0.68);
    });
  }

  public playDuelLoss() {
    this.stopFeverTrack();
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Descending dark cyberpunk chords
    const steps = [
      { notes: [440.0, 523.25, 659.25], time: 0 },       // Am
      { notes: [392.0, 466.16, 587.33], time: 0.16 },    // Gm
      { notes: [293.66, 349.23, 440.0], time: 0.34 },    // Dm (deep fall)
    ];

    steps.forEach((step) => {
      step.notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + step.time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + step.time + 0.28);
        gain.gain.setValueAtTime(0.06, now + step.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + step.time + 0.32);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now + step.time);
        osc.stop(now + step.time + 0.34);
      });
    });
  }

  public playTauntReaction() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.16);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.getSfxDestination());
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playDuelPause() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Freeze chord: sweeping down triangle + resonant glitch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(960, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.22);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.getSfxDestination());
    osc.start(now);
    osc.stop(now + 0.26);

    // Staccato cyber click
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'square';
    subOsc.frequency.setValueAtTime(240, now);
    subGain.gain.setValueAtTime(0.05, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    subOsc.connect(subGain);
    subGain.connect(this.getSfxDestination());
    subOsc.start(now);
    subOsc.stop(now + 0.09);
  }

  public playDuelResume() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Rising energetic unfreeze chirp
    [440, 660, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.07, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.09);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.095);
    });
  }

  public playOpponentAbandon() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dual alarm stabs
    [0, 0.14].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now + offset);
      osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.11);
      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + offset);
      osc.stop(now + offset + 0.13);
    });
  }

  public playRematchOffer() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Bright dual chime: 1046.5Hz (C6) -> 1318.5Hz (E6)
    [1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.08, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.16);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.17);
    });
  }

  public playHallOfFameOpen() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Digital resonance pulse blip
    const blip = ctx.createOscillator();
    const blipGain = ctx.createGain();
    blip.type = 'sine';
    blip.frequency.setValueAtTime(2200, now);
    blip.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
    blipGain.gain.setValueAtTime(0.04, now);
    blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    blip.connect(blipGain);
    blipGain.connect(this.getSfxDestination());
    blip.start(now);
    blip.stop(now + 0.055);

    // 2. Sub-bass atmospheric swell (D2 -> A2 -> F#2)
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(73.42, now);
    sub.frequency.exponentialRampToValueAtTime(110.0, now + 0.25);
    sub.frequency.exponentialRampToValueAtTime(92.5, now + 0.7);
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.08, now + 0.12);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    sub.connect(subGain);
    subGain.connect(this.getSfxDestination());
    sub.start(now);
    sub.stop(now + 0.78);

    // 3. Ethereal crystal cyberpunk shimmer arpeggio
    // Cyberpunk scale: F#4, A4, C#5, E5, F#5, C#6
    const arpeggio = [369.99, 440.0, 554.37, 659.25, 739.99, 1108.73];
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.04 + idx * 0.055);
      gain.gain.setValueAtTime(0.001, now + 0.04 + idx * 0.055);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.04 + idx * 0.055 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04 + idx * 0.055 + 0.42);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + 0.04 + idx * 0.055);
      osc.stop(now + 0.04 + idx * 0.055 + 0.45);
    });

    // 4. Warm sustained neon triad pad resolving into silence
    const padTime = now + 0.28;
    [554.37, 739.99, 880.0].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, padTime);
      gain.gain.setValueAtTime(0.001, padTime);
      gain.gain.linearRampToValueAtTime(0.045, padTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, padTime + 0.85);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(padTime);
      osc.stop(padTime + 0.88);
    });
  }

  public playCyberCardInspect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1046.5, 1567.98].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);
      gain.gain.setValueAtTime(0.05, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.08);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.09);
    });
  }
}

export const soundManager = new SoundManager();

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      soundManager.pauseAll();
    } else {
      soundManager.resumeAll();
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('blur', () => {
    soundManager.pauseAll();
  });
  window.addEventListener('focus', () => {
    if (document.visibilityState === 'visible') {
      soundManager.resumeAll();
    }
  });
}
