import {
  Language,
  TranslationDict,
  PerkTranslation,
  AchievementTranslation,
  LocaleDefinition,
} from './types';
import { ru } from './locales/ru';
import { en } from './locales/en';
import { tr } from './locales/tr';

export type { Language, TranslationDict, PerkTranslation, AchievementTranslation, LocaleDefinition };

export const SUPPORTED_LANGUAGES: Language[] = ['ru', 'en', 'tr'];

export const LOCALES: Record<Language, LocaleDefinition> = {
  ru,
  en,
  tr,
};

export const PERK_TRANSLATIONS: Record<string, Record<Language, PerkTranslation>> = {};
for (const perkId of Object.keys(en.perks)) {
  PERK_TRANSLATIONS[perkId] = {
    ru: ru.perks[perkId] || en.perks[perkId],
    en: en.perks[perkId],
    tr: tr.perks[perkId] || en.perks[perkId],
  };
}

export const ACHIEVEMENT_TRANSLATIONS: Record<string, Record<Language, AchievementTranslation>> = {};
for (const achId of Object.keys(en.achievements)) {
  ACHIEVEMENT_TRANSLATIONS[achId] = {
    ru: ru.achievements[achId] || en.achievements[achId],
    en: en.achievements[achId],
    tr: tr.achievements[achId] || en.achievements[achId],
  };
}

class I18nManager {
  private currentLang: Language = 'ru';
  private listeners: Array<(lang: Language) => void> = [];

  constructor() {
    this.detectLanguage();
  }

  public parseLanguageCode(langCode: string): Language {
    const lower = (langCode || '').toLowerCase().trim();
    if (
      lower.startsWith('ru') ||
      lower.startsWith('be') ||
      lower.startsWith('kk') ||
      lower.startsWith('uk') ||
      lower.startsWith('uz')
    ) {
      return 'ru';
    }
    if (lower.startsWith('tr')) return 'tr';
    return 'en';
  }

  public detectLanguage(): Language {
    try {
      const saved = localStorage.getItem('sudoku_pulse_lang');
      if (saved && (SUPPORTED_LANGUAGES as string[]).includes(saved)) {
        this.currentLang = saved as Language;
        return this.currentLang;
      }
    } catch {}

    // Check Yandex Games environment if already loaded
    const yLang =
      (window as any).ysdk?.environment?.i18n?.lang ||
      (window as any).YaGames?.environment?.i18n?.lang;
    if (yLang && typeof yLang === 'string') {
      this.currentLang = this.parseLanguageCode(yLang);
      return this.currentLang;
    }

    // Check navigator / system
    if (typeof navigator !== 'undefined') {
      const navLang = navigator.language || (navigator as any).userLanguage || '';
      this.currentLang = this.parseLanguageCode(navLang);
    } else {
      this.currentLang = 'ru';
    }

    return this.currentLang;
  }

  public applyPlatformDetectedLanguage(langCode: string): void {
    try {
      if (localStorage.getItem('sudoku_pulse_lang')) return;
    } catch {}
    const resolved = this.parseLanguageCode(langCode);
    if (this.currentLang !== resolved) {
      this.setLanguage(resolved);
    }
  }

  public getLanguage(): Language {
    return this.currentLang;
  }

  public setLanguage(lang: Language): void {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      lang = 'en';
    }
    this.currentLang = lang;
    try {
      localStorage.setItem('sudoku_pulse_lang', lang);
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = 'ltr';
      this.applyTranslationsToDOM();
    }

    this.listeners.forEach((fn) => fn(lang));
  }

  public onLanguageChange(fn: (lang: Language) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public t(key: string, defaultTextOrParams?: string | Record<string, string | number>, params?: Record<string, string | number>): string {
    let defaultText: string | undefined;
    let actualParams: Record<string, string | number> | undefined;

    if (typeof defaultTextOrParams === 'object' && defaultTextOrParams !== null) {
      actualParams = defaultTextOrParams;
    } else {
      defaultText = defaultTextOrParams;
      actualParams = params;
    }

    let text = LOCALES[this.currentLang]?.dict?.[key]
      || LOCALES.en?.dict?.[key]
      || LOCALES.ru?.dict?.[key]
      || defaultText
      || key;

    if (actualParams) {
      for (const [pKey, pVal] of Object.entries(actualParams)) {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }
    return text;
  }

  public applyTranslationsToDOM(): void {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translation = this.t(key);
        if (translation) {
          el.textContent = translation;
        }
      }
    });

    const placeholders = document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]');
    placeholders.forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        const translation = this.t(key);
        if (translation && 'placeholder' in el) {
          (el as any).placeholder = translation;
        }
      }
    });

    const titles = document.querySelectorAll<HTMLElement>('[data-i18n-title]');
    titles.forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const translation = this.t(key);
        if (translation) {
          el.title = translation;
        }
      }
    });

    // Update active state on language select dropdown
    const select = document.getElementById('setting-lang-select') as HTMLSelectElement | null;
    if (select && select.value !== this.currentLang) {
      select.value = this.currentLang;
    }

    // Update active state on all lang switcher buttons if present
    SUPPORTED_LANGUAGES.forEach((l) => {
      const btn = document.getElementById(`lang-btn-${l}`);
      if (btn) {
        btn.classList.toggle('active', this.currentLang === l);
      }
    });
  }
}

export const i18n = new I18nManager();
export const t = (
  key: string,
  defaultTextOrParams?: string | Record<string, string | number>,
  params?: Record<string, string | number>
): string => i18n.t(key, defaultTextOrParams, params);

export const trText = (ruStr: string, enStr: string, trStr: string): string => {
  const lang = i18n.getLanguage();
  if (lang === 'tr') return trStr;
  if (lang === 'en') return enStr;
  return ruStr;
};

