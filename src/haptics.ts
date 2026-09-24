// Declare Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        initDataUnsafe?: {
          user?: {
            first_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

export class HapticsManager {
  private hasVibration: boolean = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  public initTelegram() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch {}
    }
  }

  public selection() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate(8); } catch {}
    }
  }

  public light() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate(12); } catch {}
    }
  }

  public success() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([15, 30, 25]); } catch {}
    }
  }

  public error() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([40, 50, 40]); } catch {}
    }
  }

  public fever() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([60, 40, 80]); } catch {}
    }
  }

  public victory() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([30, 40, 40, 40, 90]); } catch {}
    }
  }
}

export const haptics = new HapticsManager();
