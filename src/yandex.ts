import { soundManager } from './audio';

export interface YandexPlayer {
  getName: () => string;
  getPhoto: (size: 'small' | 'medium' | 'large') => string;
  getUniqueID: () => string;
  setData: (data: Record<string, any>, flush?: boolean) => Promise<void>;
  getData: (keys?: string[]) => Promise<Record<string, any>>;
  getStats: (keys?: string[]) => Promise<Record<string, any>>;
  setStats: (stats: Record<string, number>) => Promise<void>;
  incrementStats: (increments: Record<string, number>) => Promise<Record<string, number>>;
}

export interface YandexSDK {
  features: {
    LoadingAPI?: {
      ready: () => void;
    };
    GameplayAPI?: {
      start: () => void;
      stop: () => void;
    };
  };
  adv: {
    showFullscreenAdv: (options: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: any) => void;
        onOffline?: () => void;
      };
    }) => void;
    showRewardedVideo: (options: {
      callbacks?: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: () => void;
        onError?: (error: any) => void;
      };
    }) => void;
  };
  auth: {
    openAuthDialog: () => Promise<void>;
  };
  getPlayer: (options?: { scopes?: boolean }) => Promise<YandexPlayer>;
  getLeaderboards: () => Promise<any>;
  environment: {
    app: { id: string };
    browser: { lang: string };
    i18n: { lang: string; tld: string };
  };
}

export class YandexGamesBridge {
  private ysdk: YandexSDK | null = null;
  private player: YandexPlayer | null = null;
  private isAvailable: boolean = false;
  private lastInterstitialTime: number = 0;
  private interstitialCooldownMs: number = 90 * 1000; // 90 sec cooldown between fullscreens
  private isGameplayActive: boolean = false;

  public async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const YaGames = (window as any).YaGames;
    if (YaGames) {
      try {
        this.ysdk = await YaGames.init();
        this.isAvailable = true;

        // Signal to Yandex that loading is complete and game is ready for interaction
        this.ysdk?.features.LoadingAPI?.ready();
        console.log('[YandexGames] SDK v2 initialized successfully');

        // Pre-initialize player
        await this.initPlayer();
        return true;
      } catch (err) {
        console.warn('[YandexGames] YaGames.init error:', err);
      }
    }
    return false;
  }

  public isYandex(): boolean {
    if (this.isAvailable) return true;
    if (typeof window === 'undefined') return false;
    const url = window.location.href;
    return (
      url.includes('yandex') ||
      url.includes('ysdk') ||
      !!(window as any).YaGames ||
      (typeof document !== 'undefined' && document.referrer.includes('yandex'))
    );
  }

  public async initPlayer(): Promise<YandexPlayer | null> {
    if (!this.ysdk) return null;
    try {
      this.player = await this.ysdk.getPlayer({ scopes: false });
      return this.player;
    } catch (e) {
      console.warn('[YandexGames] getPlayer in guest mode:', e);
      return null;
    }
  }

  public getPlayerName(): string | null {
    if (this.player) {
      try {
        const name = this.player.getName();
        if (name && name.trim()) return name.trim();
      } catch {}
    }
    return null;
  }

  public getPlayerProfile(): { name: string; avatarUrl?: string; id?: string; isGuest: boolean } {
    if (this.player) {
      try {
        const name = this.player.getName();
        const avatarUrl = this.player.getPhoto('small');
        const id = this.player.getUniqueID();
        if (name) {
          return { name, avatarUrl, id, isGuest: false };
        }
      } catch {}
    }
    return { name: 'Игрок Яндекса', isGuest: true };
  }

  public async openAuth(): Promise<boolean> {
    if (!this.ysdk) return false;
    try {
      await this.ysdk.auth.openAuthDialog();
      await this.initPlayer();
      return true;
    } catch (e) {
      console.warn('[YandexGames] openAuthDialog canceled or failed:', e);
      return false;
    }
  }

  public async saveCloudData(data: Record<string, any>): Promise<void> {
    if (!this.player) return;
    try {
      await this.player.setData(data, true);
    } catch (e) {
      console.warn('[YandexGames] saveCloudData failed:', e);
    }
  }

  public async loadCloudData(keys?: string[]): Promise<Record<string, any> | null> {
    if (!this.player) return null;
    try {
      return await this.player.getData(keys);
    } catch (e) {
      console.warn('[YandexGames] loadCloudData failed:', e);
      return null;
    }
  }

  public async submitLeaderboardScore(score: number): Promise<void> {
    if (!this.ysdk || score <= 0) return;
    try {
      const lb = await this.ysdk.getLeaderboards();
      if (lb && lb.setLeaderboardScore) {
        await lb.setLeaderboardScore('records', score);
        console.log('[YandexGames] Score submitted to leaderboard:', score);
      }
    } catch (e) {
      console.warn('[YandexGames] submitLeaderboardScore failed:', e);
    }
  }

  public gameplayStart(): void {
    if (!this.ysdk?.features.GameplayAPI || this.isGameplayActive) return;
    try {
      this.ysdk.features.GameplayAPI.start();
      this.isGameplayActive = true;
    } catch {}
  }

  public gameplayStop(): void {
    if (!this.ysdk?.features.GameplayAPI || !this.isGameplayActive) return;
    try {
      this.ysdk.features.GameplayAPI.stop();
      this.isGameplayActive = false;
    } catch {}
  }

  public showFullscreenAdv(callbacks?: {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: () => void;
  } | (() => void)): void {
    const onFinished = typeof callbacks === 'function' ? callbacks : callbacks?.onClose;
    const onOpen = typeof callbacks === 'object' ? callbacks?.onOpen : undefined;
    const onError = typeof callbacks === 'object' ? callbacks?.onError : undefined;

    if (!this.ysdk) {
      if (onFinished) onFinished();
      return;
    }

    const now = Date.now();
    if (now - this.lastInterstitialTime < this.interstitialCooldownMs) {
      if (onFinished) onFinished();
      return;
    }

    try {
      soundManager.muteForAd();
      if (onOpen) onOpen();
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            soundManager.muteForAd();
            if (onOpen) onOpen();
          },
          onClose: (_wasShown: boolean) => {
            this.lastInterstitialTime = Date.now();
            soundManager.unmuteAfterAd();
            if (onFinished) onFinished();
          },
          onError: (err: any) => {
            console.warn('[YandexGames] Fullscreen adv error:', err);
            soundManager.unmuteAfterAd();
            if (onError) onError();
            else if (onFinished) onFinished();
          },
          onOffline: () => {
            soundManager.unmuteAfterAd();
            if (onError) onError();
            else if (onFinished) onFinished();
          },
        },
      });
    } catch (e) {
      soundManager.unmuteAfterAd();
      if (onError) onError();
      else if (onFinished) onFinished();
    }
  }

  public showRewardedVideo(options: {
    onOpen?: () => void;
    onRewarded: () => void;
    onClose?: () => void;
    onError?: (err?: any) => void;
  }): void {
    if (!this.ysdk) {
      options.onError?.();
      return;
    }

    try {
      soundManager.muteForAd();
      options.onOpen?.();
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => {
            soundManager.muteForAd();
            options.onOpen?.();
          },
          onRewarded: () => {
            options.onRewarded();
          },
          onClose: () => {
            soundManager.unmuteAfterAd();
            options.onClose?.();
          },
          onError: (err: any) => {
            console.warn('[YandexGames] Rewarded video error:', err);
            soundManager.unmuteAfterAd();
            options.onError?.(err);
          },
        },
      });
    } catch (e) {
      soundManager.unmuteAfterAd();
      options.onError?.(e);
    }
  }
}

export const yandexBridge = new YandexGamesBridge();
