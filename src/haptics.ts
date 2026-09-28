import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

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
  public intensity: 'off' | 'soft' | 'medium' | 'strong' = 'medium';

  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('sudoku_haptics_mode') : null;
    if (saved && ['off', 'soft', 'medium', 'strong'].includes(saved)) {
      this.intensity = saved as any;
    }
  }

  public setIntensity(mode: 'off' | 'soft' | 'medium' | 'strong') {
    this.intensity = mode;
    try { localStorage.setItem('sudoku_haptics_mode', mode); } catch {}
  }

  public getIntensity(): 'off' | 'soft' | 'medium' | 'strong' {
    return this.intensity;
  }

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

  public async selection() {
    if (this.intensity === 'off') return;
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.selectionChanged(); } catch {}
      return;
    }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      const style = this.intensity === 'strong' ? 'medium' : 'light';
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred(style); } catch {}
      return;
    }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred('medium'); } catch {}
      return;
    }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy'); } catch {}
      return;
    }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch {}
      return;
    }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('error'); } catch {}
      return;
    }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy'); } catch {}
      return;
    }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch {}
      return;
    }
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
      if (window.Telegram?.WebApp?.HapticFeedback) {
        try {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
          setTimeout(() => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'), 120);
        } catch {}
      }
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.notification({ type: NotificationType.Success }).catch(() => {}), 110);
      } catch {}
      if (this.hasVibration) {
        try { navigator.vibrate([60, 30, 80, 30, 140]); } catch {}
      }
    } else if (count === 3) {
      // Triple Overdrive: rhythmic triple pulse
      if (window.Telegram?.WebApp?.HapticFeedback) {
        try {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
          setTimeout(() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'), 90);
        } catch {}
      }
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 90);
      } catch {}
      if (this.hasVibration) {
        try { navigator.vibrate([45, 35, 60, 35, 90]); } catch {}
      }
    } else {
      // Dual Clear: swift double punch
      if (window.Telegram?.WebApp?.HapticFeedback) {
        try { window.Telegram.WebApp.HapticFeedback.impactOccurred('medium'); } catch {}
      }
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        setTimeout(() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'), 150);
      } catch {}
    }
    try {
      await Haptics.notification({ type: NotificationType.Success });
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 120);
    } catch {}
    if (this.hasVibration) {
      try { navigator.vibrate([35, 40, 50, 40, 80, 50, 120]); } catch {}
    }
  }
}

export const haptics = new HapticsManager();
