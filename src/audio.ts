export class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private feverLoopId: number | null = null;
  private feverStep: number = 0;

  public soundTheme: string = 'neon';

  constructor() {
    const saved = localStorage.getItem('sudoku_sound_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
    this.soundTheme = localStorage.getItem('sudoku_board_skin') || 'neon';
  }

  public setSoundTheme(theme: string) {
    this.soundTheme = theme;
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
      gain.connect(ctx.destination);
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
      case 'neon':
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        break;
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
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
      gain.connect(ctx.destination);
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
      gain.connect(ctx.destination);
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
    gain.connect(ctx.destination);
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
      gain.connect(ctx.destination);
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
      gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
        osc.start(now + c.time);
        osc.stop(now + c.time + 0.42);
      });
    });
  }
}

export const soundManager = new SoundManager();
