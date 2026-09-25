// Declare Telegram WebApp types
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams?: TelegramThemeParams;
        initDataUnsafe?: {
          user?: TelegramUser;
          query_id?: string;
          auth_date?: number;
          hash?: string;
          start_param?: string;
        };
      };
    };
    onTelegramAuth?: (user: TelegramUser & { auth_date?: number; hash?: string }) => void;
  }
}

export class HapticsManager {
  private hasVibration: boolean = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  private currentBackHandler: (() => void) | null = null;

  public initTelegram() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        if (window.Telegram.WebApp.setHeaderColor) {
          window.Telegram.WebApp.setHeaderColor('#0b0f19');
        }
        if (window.Telegram.WebApp.setBackgroundColor) {
          window.Telegram.WebApp.setBackgroundColor('#0b0f19');
        }
      } catch {}
    }
  }

  public isTelegramMiniApp(): boolean {
    return !!(typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user);
  }

  public getTelegramUser(): TelegramUser | null {
    return (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) || null;
  }

  public setBackButton(onBack: (() => void) | null) {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
    if (!tg?.BackButton) return;

    if (this.currentBackHandler) {
      try { tg.BackButton.offClick(this.currentBackHandler); } catch {}
      this.currentBackHandler = null;
    }

    if (onBack) {
      this.currentBackHandler = onBack;
      try {
        tg.BackButton.onClick(onBack);
        tg.BackButton.show();
      } catch {}
    } else {
      try {
        tg.BackButton.hide();
      } catch {}
    }
  }

  public selection() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.selectionChanged(); } catch {}
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate(8); } catch {}
    }
  }

  public light() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch {}
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate(12); } catch {}
    }
  }

  public medium() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred('medium'); } catch {}
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate(18); } catch {}
    }
  }

  public success() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch {}
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([15, 30, 25]); } catch {}
    }
  }

  public error() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('error'); } catch {}
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([40, 50, 40]); } catch {}
    }
  }

  public fever() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy'); } catch {}
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([60, 40, 80]); } catch {}
    }
  }

  public victory() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch {}
      return;
    }
    if (this.hasVibration) {
      try { navigator.vibrate([30, 40, 40, 40, 90]); } catch {}
    }
  }
}

export const haptics = new HapticsManager();
