import {
  Language,
  TranslationDict,
  PerkTranslation,
  AchievementTranslation,
  LocaleDefinition,
} from './types';
import { ru } from './locales/ru';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { es } from './locales/es';
import { tr } from './locales/tr';
import { zh } from './locales/zh';
import { ar } from './locales/ar';

export type { Language, TranslationDict, PerkTranslation, AchievementTranslation, LocaleDefinition };

export const SUPPORTED_LANGUAGES: Language[] = ['ru', 'en', 'fr', 'de', 'es', 'tr', 'zh', 'ar'];

export const LOCALES: Record<Language, LocaleDefinition> = {
  ru,
  en,
  fr,
  de,
  es,
  tr,
  zh,
  ar,
};

export const PERK_TRANSLATIONS: Record<string, Record<Language, PerkTranslation>> = {};
for (const perkId of Object.keys(en.perks)) {
  PERK_TRANSLATIONS[perkId] = {
    ru: ru.perks[perkId] || en.perks[perkId],
    en: en.perks[perkId],
    fr: fr.perks[perkId] || en.perks[perkId],
    de: de.perks[perkId] || en.perks[perkId],
    es: es.perks[perkId] || en.perks[perkId],
    tr: tr.perks[perkId] || en.perks[perkId],
    zh: zh.perks[perkId] || en.perks[perkId],
    ar: ar.perks[perkId] || en.perks[perkId],
  };
}

export const ACHIEVEMENT_TRANSLATIONS: Record<string, Record<Language, AchievementTranslation>> = {};
for (const achId of Object.keys(en.achievements)) {
  ACHIEVEMENT_TRANSLATIONS[achId] = {
    ru: ru.achievements[achId] || en.achievements[achId],
    en: en.achievements[achId],
    fr: fr.achievements[achId] || en.achievements[achId],
    de: de.achievements[achId] || en.achievements[achId],
    es: es.achievements[achId] || en.achievements[achId],
    tr: tr.achievements[achId] || en.achievements[achId],
    zh: zh.achievements[achId] || en.achievements[achId],
    ar: ar.achievements[achId] || en.achievements[achId],
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
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('de')) return 'de';
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('tr')) return 'tr';
    if (lower.startsWith('zh')) return 'zh';
    if (lower.startsWith('ar')) return 'ar';
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
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
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

  public t(key: string, defaultText?: string): string {
    const activeDict = LOCALES[this.currentLang]?.dict;
    if (activeDict && activeDict[key]) {
      return activeDict[key];
    }
    const enDict = LOCALES.en.dict;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    const ruDict = LOCALES.ru.dict;
    if (ruDict && ruDict[key]) {
      return ruDict[key];
    }
    return defaultText || key;
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
export const t = (key: string, defaultText?: string): string => i18n.t(key, defaultText);
