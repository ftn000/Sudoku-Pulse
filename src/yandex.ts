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
  feedback?: {
    canReview: () => Promise<{ value: boolean; reason?: string }>;
    requestReview: () => Promise<{ value: boolean; reason?: string }>;
  };
  shortcut?: {
    canShowPrompt: () => Promise<{ canShow: boolean }>;
    showPrompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  getPayments?: (options?: { signed?: boolean }) => Promise<YandexPaymentsService>;
  getPlayer: (options?: { scopes?: boolean }) => Promise<YandexPlayer>;
  getLeaderboards: () => Promise<any>;
  on?: (event: string, callback: () => void) => void;
  off?: (event: string, callback: () => void) => void;
  environment: {
    app: { id: string };
    browser: { lang: string };
    i18n: { lang: string; tld: string };
  };
}

export interface YandexPaymentPurchase {
  productID: string;
  purchaseToken: string;
  developerPayload?: string;
  signature?: string;
}

export interface YandexCatalogItem {
  id: string;
  title: string;
  description: string;
  imageURI: string;
  price: string;
  priceValue: string;
  priceCurrencyCode: string;
}

export interface YandexPaymentsService {
  getPurchases: () => Promise<YandexPaymentPurchase[]>;
  getCatalog: () => Promise<YandexCatalogItem[]>;
  purchase: (options: { id: string; developerPayload?: string }) => Promise<YandexPaymentPurchase>;
  consumePurchase: (purchaseToken: string) => Promise<void>;
}

export interface ShopProduct {
  id: string;
  priceYans: number;
  icon: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  badgeRu?: string;
  badgeEn?: string;
  isConsumable: boolean;
}

export const SHOP_PRODUCTS: Record<string, ShopProduct> = {
  no_ads: {
    id: 'no_ads',
    priceYans: 249,
    icon: '🛡️',
    titleRu: 'Отключение рекламы',
    titleEn: 'No Ads Pass',
    descRu: 'Полное отключение межстраничной рекламы и баннеров навсегда',
    descEn: 'Permanent removal of all fullscreen interstitial ads and banners',
    badgeRu: 'Популярно',
    badgeEn: 'Popular',
    isConsumable: false,
  },
  vip_pass: {
    id: 'vip_pass',
    priceYans: 299,
    icon: '👑',
    titleRu: 'Cyber VIP Pass',
    titleEn: 'Cyber VIP Pass',
    descRu: 'No Ads навсегда + Золотой скин "Cyber Gold" + 25 подсказок + VIP значок',
    descEn: 'No Ads forever + Cyber Gold grid skin + 25 hints + VIP badge',
    badgeRu: 'Хит • VIP',
    badgeEn: 'Best Value',
    isConsumable: false,
  },
  hints_pack_20: {
    id: 'hints_pack_20',
    priceYans: 79,
    icon: '💡',
    titleRu: 'Пакет: 20 подсказок',
    titleEn: '20 Hints Pack',
    descRu: '+20 подсказок для мгновенного раскрытия сложнейших ячеек',
    descEn: '+20 hints for instant solution of the toughest cells',
    badgeRu: 'Выгодно',
    badgeEn: 'Useful',
    isConsumable: true,
  },
};

export class YandexGamesBridge {
  private ysdk: YandexSDK | null = null;
  private player: YandexPlayer | null = null;
  private isAvailable: boolean = false;
  private lastInterstitialTime: number = 0;
  private interstitialCooldownMs: number = 90 * 1000; // 90 sec cooldown between fullscreens
  private isGameplayActive: boolean = false;
  private onPauseCallback?: () => void;
  private onResumeCallback?: () => void;

  private paymentsService: YandexPaymentsService | null = null;
  private paymentsInitialized: boolean = false;
  private noAdsActive: boolean = false;
  private vipPassActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.noAdsActive = localStorage.getItem('sudoku_pulse_no_ads') === 'true' || localStorage.getItem('sudoku_pulse_vip_pass') === 'true';
      this.vipPassActive = localStorage.getItem('sudoku_pulse_vip_pass') === 'true';
    }
  }

  public hasNoAds(): boolean {
    return this.noAdsActive || this.vipPassActive;
  }

  public isVip(): boolean {
    return this.vipPassActive;
  }

  public setPauseResumeCallbacks(onPause?: () => void, onResume?: () => void) {
    this.onPauseCallback = onPause;
    this.onResumeCallback = onResume;
  }

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

        // Listen to game_api_pause / game_api_resume according to Yandex Requirements 1.19.4
        if (typeof this.ysdk?.on === 'function') {
          this.ysdk.on('game_api_pause', () => {
            console.log('[YandexGames] game_api_pause event received');
            soundManager.pauseAll();
            this.onPauseCallback?.();
          });
          this.ysdk.on('game_api_resume', () => {
            console.log('[YandexGames] game_api_resume event received');
            soundManager.resumeAll();
            this.onResumeCallback?.();
          });
        }

        // Pre-initialize player & payments
        await this.initPlayer();
        await this.restorePurchases();

        const detectedLang = this.getLanguage();
        if (detectedLang) {
          this.onLanguageDetectedCallback?.(detectedLang);
        }

        return true;
      } catch (err) {
        console.warn('[YandexGames] YaGames.init error:', err);
      }
    }
    return false;
  }

  private onLanguageDetectedCallback?: (lang: string) => void;

  public onLanguageDetected(cb: (lang: string) => void) {
    this.onLanguageDetectedCallback = cb;
    const current = this.getLanguage();
    if (current) cb(current);
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

  public getLanguage(): string {
    if (this.ysdk?.environment?.i18n?.lang) {
      return this.ysdk.environment.i18n.lang.toLowerCase();
    }
    if (this.ysdk?.environment?.browser?.lang) {
      return this.ysdk.environment.browser.lang.toLowerCase();
    }
    return '';
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

  public async getLeaderboardEntries(name: string = 'records', count: number = 10): Promise<Array<{
    rank: number;
    name: string;
    score: number;
    avatarUrl?: string;
    isUser?: boolean;
  }>> {
    if (!this.ysdk) return [];
    try {
      const lb = await this.ysdk.getLeaderboards();
      if (!lb || !lb.getLeaderboardEntries) return [];
      const res = await lb.getLeaderboardEntries(name, {
        quantityTop: count,
        includeUser: true,
        quantityAround: 1,
      });

      if (!res?.entries) return [];
      return res.entries.map((entry: any) => ({
        rank: entry.rank,
        score: entry.score,
        name: entry.player?.publicName || 'Cyber Player',
        avatarUrl: entry.player?.getAvatarSrc?.('small'),
        isUser: entry.player?.uniqueID === this.player?.getUniqueID(),
      }));
    } catch (e) {
      console.warn('[YandexGames] getLeaderboardEntries failed:', e);
      return [];
    }
  }

  public async canReview(): Promise<boolean> {
    if (!this.ysdk?.feedback) return false;
    try {
      const res = await this.ysdk.feedback.canReview();
      return !!res.value;
    } catch {
      return false;
    }
  }

  public async requestReview(): Promise<boolean> {
    if (!this.ysdk?.feedback) return false;
    try {
      const res = await this.ysdk.feedback.requestReview();
      console.log('[YandexGames] requestReview response:', res);
      return !!res.value;
    } catch (e) {
      console.warn('[YandexGames] requestReview failed:', e);
      return false;
    }
  }

  public async promptReviewIfEligible(): Promise<boolean> {
    const hasReviewed = localStorage.getItem('sudoku_pulse_yandex_reviewed');
    if (hasReviewed) return false;

    const eligible = await this.canReview();
    if (eligible) {
      const success = await this.requestReview();
      if (success) {
        localStorage.setItem('sudoku_pulse_yandex_reviewed', 'true');
      }
      return success;
    }
    return false;
  }

  public async canShowShortcut(): Promise<boolean> {
    if (!this.ysdk?.shortcut) return false;
    try {
      const res = await this.ysdk.shortcut.canShowPrompt();
      return !!res.canShow;
    } catch {
      return false;
    }
  }

  public async showShortcutPrompt(): Promise<boolean> {
    if (!this.ysdk?.shortcut) return false;
    try {
      const res = await this.ysdk.shortcut.showPrompt();
      return res.outcome === 'accepted';
    } catch (e) {
      console.warn('[YandexGames] showPrompt failed:', e);
      return false;
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

  public async initPayments(): Promise<boolean> {
    if (this.paymentsInitialized && this.paymentsService) return true;
    if (!this.ysdk?.getPayments) return false;
    try {
      this.paymentsService = await this.ysdk.getPayments({ signed: true });
      this.paymentsInitialized = true;
      console.log('[YandexGames] Payments service initialized');
      return true;
    } catch (e) {
      console.warn('[YandexGames] getPayments failed or unsupported:', e);
      return false;
    }
  }

  public async restorePurchases(): Promise<{ hasNoAds: boolean; isVip: boolean }> {
    // 1. Check local storage
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('sudoku_pulse_vip_pass') === 'true') {
        this.vipPassActive = true;
        this.noAdsActive = true;
      } else if (localStorage.getItem('sudoku_pulse_no_ads') === 'true') {
        this.noAdsActive = true;
      }
    }

    // 2. Check cloud player data
    try {
      const cloud = await this.loadCloudData(['no_ads', 'vip_pass']);
      if (cloud) {
        if (cloud.vip_pass) {
          this.vipPassActive = true;
          this.noAdsActive = true;
          localStorage.setItem('sudoku_pulse_vip_pass', 'true');
          localStorage.setItem('sudoku_pulse_no_ads', 'true');
        } else if (cloud.no_ads) {
          this.noAdsActive = true;
          localStorage.setItem('sudoku_pulse_no_ads', 'true');
        }
      }
    } catch {}

    // 3. Query Yandex Payments service
    try {
      const hasPayments = await this.initPayments();
      if (hasPayments && this.paymentsService) {
        const purchases = await this.paymentsService.getPurchases();
        if (Array.isArray(purchases)) {
          for (const p of purchases) {
            if (p.productID === 'vip_pass') {
              this.vipPassActive = true;
              this.noAdsActive = true;
              localStorage.setItem('sudoku_pulse_vip_pass', 'true');
              localStorage.setItem('sudoku_pulse_no_ads', 'true');
            } else if (p.productID === 'no_ads') {
              this.noAdsActive = true;
              localStorage.setItem('sudoku_pulse_no_ads', 'true');
            }
          }
        }
      }
    } catch (e) {
      console.warn('[YandexGames] restorePurchases failed:', e);
    }

    return { hasNoAds: this.hasNoAds(), isVip: this.isVip() };
  }

  public async purchaseProduct(productId: string): Promise<{ success: boolean; productId: string; error?: string }> {
    const product = SHOP_PRODUCTS[productId];
    if (!product) {
      return { success: false, productId, error: 'Unknown product' };
    }

    // In Yandex environment:
    if (this.isYandex() && this.ysdk?.getPayments) {
      try {
        await this.initPayments();
        if (!this.paymentsService) {
          return { success: false, productId, error: 'Payments unavailable' };
        }

        const purchase = await this.paymentsService.purchase({ id: productId });
        console.log('[YandexGames] Purchase successful:', purchase);

        // Process based on product type
        if (productId === 'no_ads') {
          this.noAdsActive = true;
          localStorage.setItem('sudoku_pulse_no_ads', 'true');
          await this.saveCloudData({ no_ads: true });
        } else if (productId === 'vip_pass') {
          this.vipPassActive = true;
          this.noAdsActive = true;
          localStorage.setItem('sudoku_pulse_vip_pass', 'true');
          localStorage.setItem('sudoku_pulse_no_ads', 'true');
          await this.saveCloudData({ no_ads: true, vip_pass: true });
        } else if (productId === 'hints_pack_20') {
          // Consumable product: must consume purchase token so it can be bought again
          if (purchase.purchaseToken) {
            try {
              await this.paymentsService.consumePurchase(purchase.purchaseToken);
            } catch (ce) {
              console.warn('[YandexGames] consumePurchase error:', ce);
            }
          }
        }

        return { success: true, productId };
      } catch (err: any) {
        console.warn('[YandexGames] purchase error:', err);
        return { success: false, productId, error: err?.message || 'Payment cancelled' };
      }
    }

    // In standalone/dev sandbox mode (test purchase flow)
    console.log('[Sandbox Payments] Simulating purchase for:', productId);
    if (productId === 'no_ads') {
      this.noAdsActive = true;
      localStorage.setItem('sudoku_pulse_no_ads', 'true');
    } else if (productId === 'vip_pass') {
      this.vipPassActive = true;
      this.noAdsActive = true;
      localStorage.setItem('sudoku_pulse_vip_pass', 'true');
      localStorage.setItem('sudoku_pulse_no_ads', 'true');
    }
    return { success: true, productId };
  }

  public showFullscreenAdv(callbacks?: {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: () => void;
  } | (() => void)): void {
    const onFinished = typeof callbacks === 'function' ? callbacks : callbacks?.onClose;
    const onOpen = typeof callbacks === 'object' ? callbacks?.onOpen : undefined;
    const onError = typeof callbacks === 'object' ? callbacks?.onError : undefined;

    // Respect No Ads purchase!
    if (this.hasNoAds()) {
      console.log('[YandexGames] Fullscreen ad skipped (No Ads active)');
      if (onFinished) onFinished();
      return;
    }

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

  public async showStickyBanner(): Promise<boolean> {
    if (this.hasNoAds()) {
      await this.hideStickyBanner();
      return false;
    }
    if (!this.ysdk?.adv) return false;
    try {
      const adv = this.ysdk.adv as any;
      if (typeof adv.getBannerAdvStatus === 'function') {
        const status = await adv.getBannerAdvStatus();
        if (status?.stickyAdvIsShowing) return true;
      }
      if (typeof adv.showBannerAdv === 'function') {
        const res = await adv.showBannerAdv();
        return !!res?.stickyAdvIsShowing;
      }
      return false;
    } catch (e) {
      console.warn('[YandexGames] showStickyBanner error:', e);
      return false;
    }
  }

  public async hideStickyBanner(): Promise<void> {
    if (!this.ysdk?.adv) return;
    try {
      const adv = this.ysdk.adv as any;
      if (typeof adv.hideBannerAdv === 'function') {
        await adv.hideBannerAdv();
      }
    } catch {}
  }
}

export const yandexBridge = new YandexGamesBridge();
