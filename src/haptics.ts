import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticIntensity = 'off' | 'soft' | 'medium' | 'strong';

class HapticsManager {
  private intensity: HapticIntensity = 'medium';
  private hasVibration: boolean = false;

  constructor() {
    this.hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    try {
      const saved = localStorage.getItem('sudoku_haptics_intensity') as HapticIntensity;
      if (saved && ['off', 'soft', 'medium', 'strong'].includes(saved)) {
        this.intensity = saved;
      }
    } catch {}
  }

  public setIntensity(intensity: HapticIntensity) {
    this.intensity = intensity;
    try {
      localStorage.setItem('sudoku_haptics_intensity', intensity);
    } catch {}
  }

  public getIntensity(): HapticIntensity {
    return this.intensity;
  }

  public isAvailable(): boolean {
    if (this.intensity === 'off') return false;
    if (typeof window === 'undefined') return false;
    const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.());
    if (isCapacitor) return true;

    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    return isMobileDevice && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  public async selection() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.selectionChanged();
      return;
    } catch {}
    if (this.hasVibration) {
      const ms = this.intensity === 'soft' ? 5 : this.intensity === 'strong' ? 14 : 8;
      try { navigator.vibrate(ms); } catch {}
    }
  }

  public async light() {
    if (this.intensity === 'off') return;
    try {
      const style = this.intensity === 'strong' ? ImpactStyle.Medium : ImpactStyle.Light;
      await Haptics.impact({ style });
      return;
    } catch {}
    if (this.hasVibration) {
      const ms = this.intensity === 'soft' ? 8 : this.intensity === 'strong' ? 20 : 12;
      try { navigator.vibrate(ms); } catch {}
    }
  }

  public async medium() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    } catch {}
    if (this.hasVibration) {
      const ms = this.intensity === 'soft' ? 12 : this.intensity === 'strong' ? 30 : 20;
      try { navigator.vibrate(ms); } catch {}
    }
  }

  public async heavy() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return;
    } catch {}
    if (this.hasVibration) {
      const ms = this.intensity === 'soft' ? 20 : this.intensity === 'strong' ? 50 : 35;
      try { navigator.vibrate(ms); } catch {}
    }
  }

  public async success() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
      return;
    } catch {}
    if (this.hasVibration) {
      try { navigator.vibrate([15, 30, 25]); } catch {}
    }
  }

  public async error() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
      return;
    } catch {}
    if (this.hasVibration) {
      try { navigator.vibrate([40, 50, 40]); } catch {}
    }
  }

  public async fever() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return;
    } catch {}
    if (this.hasVibration) {
      try { navigator.vibrate([60, 40, 80]); } catch {}
    }
  }

  public async victory() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
    if (this.hasVibration) {
      try { navigator.vibrate([30, 40, 40, 40, 90]); } catch {}
    }
  }

  // Specialized tactile feedback for Overdrive Combos (Dual, Triple, Quad)
  public async overdrive(count: number = 2) {
    if (count >= 4) {
      // Quad+ Overdrive: mega haptic sequence
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.notification({ type: NotificationType.Success }).catch(() => {}), 110);
      } catch {}
      if (this.hasVibration) {
        try { navigator.vibrate([60, 30, 80, 30, 140]); } catch {}
      }
    } else if (count === 3) {
      // Triple Overdrive: rhythmic triple pulse
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 90);
      } catch {}
      if (this.hasVibration) {
        try { navigator.vibrate([45, 35, 60, 35, 90]); } catch {}
      }
    } else {
      // Dual Clear: swift double punch
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {}
      if (this.hasVibration) {
        try { navigator.vibrate([25, 30, 40]); } catch {}
      }
    }
  }

  // Specialized tactile feedback for Achievement Unlock
  public async achievement() {
    try {
      await Haptics.notification({ type: NotificationType.Success });
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 120);
    } catch {}
    if (this.hasVibration) {
      try { navigator.vibrate([35, 40, 50, 40, 80, 50, 120]); } catch {}
    }
  }

  public isSupportedOnDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.());
    if (isCapacitor) return true;
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    return isMobileDevice && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  public setBackButton(_onClick?: (() => void) | null): void {
    // No-op outside Telegram WebApp (web/Yandex uses in-app back buttons)
  }
}

export const haptics = new HapticsManager();
